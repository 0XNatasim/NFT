// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {MonadMarketSettlement} from "../../src/MonadMarketSettlement.sol";
import {MockERC721} from "../mocks/MockERC721.sol";

/// @notice Drives random, bounded sequences of every value-moving entrypoint.
///         All calls are guarded or wrapped so the handler itself never reverts
///         on legitimately-invalid input; the invariant does the asserting.
contract SolvencyHandler is Test {
    MonadMarketSettlement public settlement;
    MockERC721 public nft;
    address public feeRecipient;

    // Fixed cast so the invariant can enumerate every escrow holder.
    uint256[3] internal makerKeys = [uint256(0xA11CE), uint256(0xB0B0B0), uint256(0xCAFE)];
    address[3] public makers;
    address[2] public takers;

    mapping(address => uint256) internal nextNonce;
    uint256 internal tokenCounter;

    constructor(MonadMarketSettlement _settlement, MockERC721 _nft, address _feeRecipient) {
        settlement = _settlement;
        nft = _nft;
        feeRecipient = _feeRecipient;

        for (uint256 i = 0; i < 3; i++) {
            makers[i] = vm.addr(makerKeys[i]);
            vm.prank(makers[i]);
            nft.setApprovalForAll(address(settlement), true);
        }
        takers[0] = makeAddr("taker0");
        takers[1] = makeAddr("taker1");
    }

    function getActors() external view returns (address[5] memory a) {
        a[0] = makers[0];
        a[1] = makers[1];
        a[2] = makers[2];
        a[3] = takers[0];
        a[4] = takers[1];
    }

    function _actor(uint256 seed) internal view returns (address) {
        uint256 i = seed % 5;
        return i < 3 ? makers[i] : takers[i - 3];
    }

    // --- fuzzed actions ---

    function deposit(uint256 seed, uint256 amount) external {
        address actor = _actor(seed);
        amount = bound(amount, 1, 10 ether);
        vm.deal(actor, actor.balance + amount);
        vm.prank(actor);
        settlement.deposit{value: amount}();
    }

    function withdraw(uint256 seed, uint256 amount) external {
        address actor = _actor(seed);
        uint256 bal = settlement.escrowBalance(actor);
        if (bal == 0) return;
        amount = bound(amount, 1, bal);
        vm.prank(actor);
        settlement.withdraw(amount);
    }

    function withdrawFees() external {
        if (settlement.pendingFees(feeRecipient) == 0) return;
        vm.prank(feeRecipient);
        settlement.withdrawFees();
    }

    function cancel(uint256 makerSeed, uint256 nonce) external {
        address maker = makers[makerSeed % 3];
        vm.prank(maker);
        try settlement.cancelNonce(nonce) {} catch {}
    }

    /// @dev NFT-for-MON, taker pays. Maker needs no escrow; taker funds
    ///      takerMon + taker-leg fee. Exercises money-in, native-out, fee accrual.
    ///      Split across two frames to stay under the EVM stack limit.
    function fulfill(uint256 makerSeed, uint256 takerSeed, uint256 takerMon) external {
        uint256 mIdx = makerSeed % 3;
        address taker = takers[takerSeed % 2];
        takerMon = bound(takerMon, 1, 5 ether);

        (MonadMarketSettlement.TradeOrder memory order, bytes memory sig) = _makeOrder(mIdx, takerMon);

        uint256 pay = takerMon + (takerMon * 100) / 10_000;
        vm.deal(taker, taker.balance + pay);
        vm.prank(taker);
        try settlement.fulfillTrade{value: pay}(order, sig) {} catch {}
    }

    function _makeOrder(uint256 mIdx, uint256 takerMon)
        internal
        returns (MonadMarketSettlement.TradeOrder memory order, bytes memory sig)
    {
        address maker = makers[mIdx];
        uint256 tokenId = ++tokenCounter;
        nft.mint(maker, tokenId);

        MonadMarketSettlement.NFTItem[] memory makerNFTs = new MonadMarketSettlement.NFTItem[](1);
        makerNFTs[0] = MonadMarketSettlement.NFTItem(address(nft), tokenId);

        order = MonadMarketSettlement.TradeOrder({
            maker: maker,
            taker: address(0),
            makerNFTs: makerNFTs,
            takerNFTs: new MonadMarketSettlement.NFTItem[](0),
            makerMonAmount: 0,
            takerMonAmount: takerMon,
            feeBps: 100,
            flatFee: 0,
            nonce: nextNonce[maker]++,
            expiry: block.timestamp + 365 days
        });

        bytes32 digest = settlement.hashOrder(order);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerKeys[mIdx], digest);
        sig = abi.encodePacked(r, s, v);
    }
}

/// @notice The core solvency invariant: every wei the contract holds is
///         accounted for as either someone's escrow or accrued protocol fees.
///         No leak, no phantom balance, under any call ordering.
contract SolvencyInvariantTest is Test {
    MonadMarketSettlement settlement;
    MockERC721 nft;
    SolvencyHandler handler;

    address owner = makeAddr("owner");
    address feeRecipient = makeAddr("feeRecipient");

    function setUp() public {
        settlement = new MonadMarketSettlement(owner, feeRecipient);
        nft = new MockERC721();
        handler = new SolvencyHandler(settlement, nft, feeRecipient);

        // Only fuzz the handler's action functions.
        bytes4[] memory selectors = new bytes4[](5);
        selectors[0] = handler.deposit.selector;
        selectors[1] = handler.withdraw.selector;
        selectors[2] = handler.withdrawFees.selector;
        selectors[3] = handler.cancel.selector;
        selectors[4] = handler.fulfill.selector;

        targetContract(address(handler));
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    function invariant_ContractIsAlwaysSolvent() public view {
        address[5] memory actors = handler.getActors();
        uint256 tracked = settlement.pendingFees(feeRecipient);
        for (uint256 i = 0; i < actors.length; i++) {
            tracked += settlement.escrowBalance(actors[i]);
        }
        assertEq(address(settlement).balance, tracked, "SOLVENCY BROKEN: balance != escrow + fees");
    }

    /// @dev Accrued fees can never exceed what the contract actually holds.
    function invariant_FeesNeverExceedBalance() public view {
        assertLe(settlement.pendingFees(feeRecipient), address(settlement).balance);
    }
}
