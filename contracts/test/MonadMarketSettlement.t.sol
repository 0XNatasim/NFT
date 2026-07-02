// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {MonadMarketSettlement} from "../src/MonadMarketSettlement.sol";
import {MockERC721} from "./mocks/MockERC721.sol";
import {MockSmartWallet} from "./mocks/MockSmartWallet.sol";

contract RejectEther {
    // no receive/fallback => native transfers to this contract revert
}

/// @notice A non-compliant "ERC721" whose transfer is a silent no-op: it reports
///         a fixed owner and blanket approval so it passes the pre-transfer
///         checks, but safeTransferFrom does nothing. Used to prove L-04 — the
///         post-transfer ownership check catches tokens that never move.
contract NoOpERC721 {
    address public immutable fixedOwner;

    constructor(address _owner) {
        fixedOwner = _owner;
    }

    function ownerOf(uint256) external view returns (address) {
        return fixedOwner;
    }

    function getApproved(uint256) external pure returns (address) {
        return address(0);
    }

    function isApprovedForAll(address, address) external pure returns (bool) {
        return true;
    }

    function safeTransferFrom(address, address, uint256) external {
        // no-op: the token never actually moves
    }
}

/// @notice A contract that return-bombs from its payable fallback (returns a
///         large blob on a bare-value call). It also implements EIP-1271 (accepts
///         any signature) so it can act as a maker and receive a MON payout,
///         exercising the L-06 hardened _sendNative which must ignore returndata.
contract ReturnBomber {
    bytes4 internal constant MAGICVALUE = 0x1626ba7e;

    function approveAll(MockERC721 nft, address op) external {
        nft.setApprovalForAll(op, true);
    }

    function isValidSignature(bytes32, bytes calldata) external pure returns (bytes4) {
        return MAGICVALUE;
    }

    function pullEscrow(MonadMarketSettlement s, uint256 amount) external {
        s.withdraw(amount);
    }

    fallback() external payable {
        assembly {
            return(0, 0x10000) // 64KB of returndata
        }
    }
}

contract MonadMarketSettlementTest is Test {
    MonadMarketSettlement settlement;
    MockERC721 nftA;
    MockERC721 nftB;

    uint256 makerKey = 0xA11CE;
    uint256 takerKey = 0xB0B;
    address maker;
    address taker;
    address owner = makeAddr("owner");
    address feeRecipient = makeAddr("feeRecipient");

    function setUp() public {
        maker = vm.addr(makerKey);
        taker = vm.addr(takerKey);
        settlement = new MonadMarketSettlement(owner, feeRecipient);
        nftA = new MockERC721();
        nftB = new MockERC721();

        nftA.mint(maker, 1);
        nftB.mint(taker, 2);

        vm.prank(maker);
        nftA.setApprovalForAll(address(settlement), true);
        vm.prank(taker);
        nftB.setApprovalForAll(address(settlement), true);

        vm.deal(maker, 100 ether);
        vm.deal(taker, 100 ether);
    }

    // ----- helpers -----

    function _baseOrder() internal view returns (MonadMarketSettlement.TradeOrder memory order) {
        MonadMarketSettlement.NFTItem[] memory makerItems = new MonadMarketSettlement.NFTItem[](1);
        makerItems[0] = MonadMarketSettlement.NFTItem(address(nftA), 1);
        MonadMarketSettlement.NFTItem[] memory takerItems = new MonadMarketSettlement.NFTItem[](1);
        takerItems[0] = MonadMarketSettlement.NFTItem(address(nftB), 2);

        order = MonadMarketSettlement.TradeOrder({
            maker: maker,
            taker: address(0),
            makerNFTs: makerItems,
            takerNFTs: takerItems,
            makerMonAmount: 0,
            takerMonAmount: 0,
            feeBps: 100,
            flatFee: 0,
            nonce: 1,
            expiry: block.timestamp + 1 days
        });
    }

    function _sign(MonadMarketSettlement.TradeOrder memory order, uint256 key)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = settlement.hashOrder(_toCalldata(order));
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    // hashOrder takes calldata; route through this external helper
    function _toCalldata(MonadMarketSettlement.TradeOrder memory order)
        internal
        pure
        returns (MonadMarketSettlement.TradeOrder memory)
    {
        return order;
    }

    // ----- settlement success -----

    function test_NftForNftSwap() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        assertEq(nftA.ownerOf(1), taker);
        assertEq(nftB.ownerOf(2), maker);
        assertTrue(settlement.nonceUsed(maker, 1));
    }

    function test_NftForMon_TakerPays() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.takerMonAmount = 10 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (10 ether * 100) / 10_000; // 1%
        uint256 makerBefore = maker.balance;

        vm.prank(taker);
        settlement.fulfillTrade{value: 10 ether + fee}(order, sig);

        assertEq(nftA.ownerOf(1), taker);
        // Proceeds are credited to the seller's escrow (pull payment), not pushed.
        assertEq(maker.balance, makerBefore);
        assertEq(settlement.escrowBalance(maker), 10 ether);
        // Fees accrue to the pull-payment ledger, not pushed to the recipient.
        assertEq(feeRecipient.balance, 0);
        assertEq(settlement.pendingFees(feeRecipient), fee);
    }

    function test_MonForNft_MakerPaysFromEscrow() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.makerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.makerMonAmount = 5 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (5 ether * 100) / 10_000;
        vm.prank(maker);
        settlement.deposit{value: 5 ether + fee}();

        uint256 takerBefore = taker.balance;
        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        assertEq(nftB.ownerOf(2), maker);
        // Taker's MON proceeds are credited to its escrow (pull payment).
        assertEq(taker.balance, takerBefore);
        assertEq(settlement.escrowBalance(taker), 5 ether);
        assertEq(settlement.pendingFees(feeRecipient), fee);
        assertEq(settlement.escrowBalance(maker), 0);
    }

    function test_NftPlusMonForNft() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.makerMonAmount = 2 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (2 ether * 100) / 10_000;
        vm.prank(maker);
        settlement.deposit{value: 2 ether + fee}();

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        assertEq(nftA.ownerOf(1), taker);
        assertEq(nftB.ownerOf(2), maker);
        assertEq(settlement.pendingFees(feeRecipient), fee);
    }

    // ----- fee math -----

    function test_NoFeeOnPureNftSwapByDefault() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);
        vm.prank(taker);
        settlement.fulfillTrade(order, sig);
        assertEq(feeRecipient.balance, 0);
    }

    function test_FlatSwapFeeOnPureNftSwap() public {
        // The flat fee is part of the signed order now, not contract storage.
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.flatFee = 0.05 ether;
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.IncorrectPayment.selector);
        settlement.fulfillTrade(order, sig);

        vm.prank(taker);
        settlement.fulfillTrade{value: 0.05 ether}(order, sig);
        assertEq(settlement.pendingFees(feeRecipient), 0.05 ether);
    }

    // ----- fee bound to the signed order -----

    function test_OrderFeeOverridesStorageFee() public {
        // Owner cranks storage fee to the max, but the order was signed at 1%.
        vm.prank(owner);
        settlement.setFeeBps(500);

        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.takerMonAmount = 10 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (10 ether * 100) / 10_000; // 1%, from the order
        vm.prank(taker);
        settlement.fulfillTrade{value: 10 ether + fee}(order, sig);
        assertEq(settlement.pendingFees(feeRecipient), fee);
    }

    function test_RevertOrderFeeBpsTooHigh() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.feeBps = 501;
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.FeeTooHigh.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_RevertOrderFlatFeeTooHigh() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.flatFee = 1 ether + 1;
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.FlatFeeTooHigh.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_RevertSetFlatSwapFeeTooHigh() public {
        vm.prank(owner);
        vm.expectRevert(MonadMarketSettlement.FlatFeeTooHigh.selector);
        settlement.setFlatSwapFee(1 ether + 1);
    }

    // ----- pull-payment fee withdrawal -----

    function test_WithdrawFees() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.takerMonAmount = 10 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (10 ether * 100) / 10_000;
        vm.prank(taker);
        settlement.fulfillTrade{value: 10 ether + fee}(order, sig);

        uint256 before = feeRecipient.balance;
        vm.prank(feeRecipient);
        settlement.withdrawFees();
        assertEq(feeRecipient.balance, before + fee);
        assertEq(settlement.pendingFees(feeRecipient), 0);
    }

    function test_RevertWithdrawFeesWhenNothingOwed() public {
        vm.prank(feeRecipient);
        vm.expectRevert(MonadMarketSettlement.ZeroAmount.selector);
        settlement.withdrawFees();
    }

    function test_RevertingFeeRecipientDoesNotBrickTrade() public {
        RejectEther badRecipient = new RejectEther();
        vm.prank(owner);
        settlement.setFeeRecipient(address(badRecipient));

        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.takerMonAmount = 1 ether;
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        bytes memory sig = _sign(order, makerKey);

        // Trade now succeeds; fee just accrues to the (broken) recipient.
        vm.prank(taker);
        settlement.fulfillTrade{value: 1.01 ether}(order, sig);
        assertEq(nftA.ownerOf(1), taker);
        assertEq(settlement.pendingFees(address(badRecipient)), 0.01 ether);

        // The broken recipient can't pull its fees, but trading is unaffected.
        vm.prank(address(badRecipient));
        vm.expectRevert(
            abi.encodeWithSelector(
                MonadMarketSettlement.NativeTransferFailed.selector, address(badRecipient), 0.01 ether
            )
        );
        settlement.withdrawFees();
    }

    // ----- pause -----

    function test_PauseBlocksFulfill() public {
        vm.prank(owner);
        settlement.pause();

        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        vm.expectRevert(); // Pausable: EnforcedPause()
        settlement.fulfillTrade(order, sig);

        vm.prank(owner);
        settlement.unpause();
        vm.prank(taker);
        settlement.fulfillTrade(order, sig);
        assertEq(nftA.ownerOf(1), taker);
    }

    function test_PauseDoesNotBlockExit() public {
        vm.prank(maker);
        settlement.deposit{value: 1 ether}();

        vm.prank(owner);
        settlement.pause();

        // Escrow withdrawal and nonce cancellation stay available while paused.
        vm.prank(maker);
        settlement.withdraw(1 ether);
        assertEq(settlement.escrowBalance(maker), 0);

        vm.prank(maker);
        settlement.cancelNonce(99);
        assertTrue(settlement.nonceUsed(maker, 99));
    }

    function test_RevertNonOwnerPause() public {
        vm.prank(taker);
        vm.expectRevert();
        settlement.pause();
    }

    function test_QuoteFees() public view {
        (uint256 makerFee, uint256 takerFee, uint256 flat) = settlement.quoteFees(10 ether, 4 ether);
        assertEq(makerFee, 0.1 ether);
        assertEq(takerFee, 0.04 ether);
        assertEq(flat, 0);
    }

    // ----- signature / auth failures -----

    function test_RevertBadSignature() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, takerKey); // wrong signer

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.InvalidSignature.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_RevertTamperedOrder() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);
        order.takerMonAmount = 0; // tamper after signing
        order.makerMonAmount = 1 ether;

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.InvalidSignature.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_RevertWrongTaker() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.taker = makeAddr("designated");
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.NotAuthorizedTaker.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_DesignatedTakerCanFill() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.taker = taker;
        bytes memory sig = _sign(order, makerKey);
        vm.prank(taker);
        settlement.fulfillTrade(order, sig);
        assertEq(nftA.ownerOf(1), taker);
    }

    function test_RevertSelfTrade() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);
        vm.prank(maker);
        vm.expectRevert(MonadMarketSettlement.SelfTrade.selector);
        settlement.fulfillTrade(order, sig);
    }

    // ----- EIP-1271 smart-contract wallet makers -----

    function test_SmartWalletMakerCanTrade() public {
        // A smart-contract wallet (Safe / AA) owned by makerKey acts as maker.
        MockSmartWallet wallet = new MockSmartWallet(maker);
        nftA.mint(address(wallet), 10);

        // The wallet approves the settlement, as a real smart wallet would.
        wallet.execute(
            address(nftA),
            0,
            abi.encodeWithSignature("setApprovalForAll(address,bool)", address(settlement), true)
        );

        MonadMarketSettlement.NFTItem[] memory makerItems = new MonadMarketSettlement.NFTItem[](1);
        makerItems[0] = MonadMarketSettlement.NFTItem(address(nftA), 10);
        MonadMarketSettlement.NFTItem[] memory takerItems = new MonadMarketSettlement.NFTItem[](1);
        takerItems[0] = MonadMarketSettlement.NFTItem(address(nftB), 2);

        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.maker = address(wallet);
        order.makerNFTs = makerItems;
        order.takerNFTs = takerItems;

        // The wallet's owner key produces the ECDSA signature the wallet's
        // isValidSignature() will accept via EIP-1271.
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        assertEq(nftA.ownerOf(10), taker);
        assertEq(nftB.ownerOf(2), address(wallet));
        assertTrue(settlement.nonceUsed(address(wallet), order.nonce));
    }

    function test_RevertSmartWalletBadSignature() public {
        MockSmartWallet wallet = new MockSmartWallet(maker);
        nftA.mint(address(wallet), 11);
        wallet.execute(
            address(nftA),
            0,
            abi.encodeWithSignature("setApprovalForAll(address,bool)", address(settlement), true)
        );

        MonadMarketSettlement.NFTItem[] memory makerItems = new MonadMarketSettlement.NFTItem[](1);
        makerItems[0] = MonadMarketSettlement.NFTItem(address(nftA), 11);

        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.maker = address(wallet);
        order.makerNFTs = makerItems;

        // Signed by the wrong key -> wallet's isValidSignature rejects it.
        bytes memory sig = _sign(order, takerKey);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.InvalidSignature.selector);
        settlement.fulfillTrade(order, sig);
    }

    // ----- expiry / nonce / replay -----

    function test_RevertExpiredOrder() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);
        vm.warp(order.expiry + 1);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.OrderExpired.selector);
        settlement.fulfillTrade(order, sig);
    }

    // ----- L-07: expiry is exclusive -----

    /// @dev At exactly the expiry second the order is already dead (>= check).
    function test_RevertFillAtExactExpiry() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);
        vm.warp(order.expiry);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.OrderExpired.selector);
        settlement.fulfillTrade(order, sig);
    }

    /// @dev One second before expiry still fills.
    function test_FillOneSecondBeforeExpiry() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);
        vm.warp(order.expiry - 1);

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);
        assertEq(nftA.ownerOf(1), taker);
    }

    function test_RevertCancelledNonce() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(maker);
        settlement.cancelNonce(order.nonce);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.NonceAlreadyUsed.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_RevertReplayAttack() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        // transfer assets back and try to replay the same signed order
        vm.prank(taker);
        nftA.transferFrom(taker, maker, 1);
        vm.prank(maker);
        nftB.transferFrom(maker, taker, 2);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.NonceAlreadyUsed.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_CancelNonces() public {
        uint256[] memory nonces = new uint256[](2);
        nonces[0] = 7;
        nonces[1] = 8;
        vm.prank(maker);
        settlement.cancelNonces(nonces);
        assertTrue(settlement.nonceUsed(maker, 7));
        assertTrue(settlement.nonceUsed(maker, 8));
    }

    // ----- L-01: batch cancel is idempotent, not all-or-nothing -----

    /// @dev An already-used nonce in the batch is skipped, and every other nonce
    ///      is still cancelled — the batch is not rolled back.
    function test_CancelNonces_SkipsUsedNonceAndCancelsRest() public {
        // Pre-consume nonce 8 (as if an order on it was already cancelled/filled).
        vm.prank(maker);
        settlement.cancelNonce(8);

        uint256[] memory nonces = new uint256[](3);
        nonces[0] = 7;
        nonces[1] = 8; // already used -> must be skipped, not revert
        nonces[2] = 9;

        vm.prank(maker);
        settlement.cancelNonces(nonces); // does not revert

        assertTrue(settlement.nonceUsed(maker, 7));
        assertTrue(settlement.nonceUsed(maker, 8));
        assertTrue(settlement.nonceUsed(maker, 9));
    }

    /// @dev The reported attack: a taker front-runs a bulk cancel by filling one
    ///      order in the batch. The maker's cancellation must still invalidate
    ///      every other order, not revert and leave them fillable.
    function test_CancelNonces_FrontRunFillDoesNotVoidBatch() public {
        // maker signs three orders (nonces 1, 2, 3); only nonce 1 is the base swap.
        MonadMarketSettlement.TradeOrder memory filled = _baseOrder(); // nonce 1
        bytes memory sig = _sign(filled, makerKey);

        // Taker front-runs the pending batch cancel by filling order #1.
        vm.prank(taker);
        settlement.fulfillTrade(filled, sig);
        assertTrue(settlement.nonceUsed(maker, 1));

        // Maker's batch cancel includes the now-consumed nonce 1 plus 2 and 3.
        uint256[] memory nonces = new uint256[](3);
        nonces[0] = 1; // consumed by the front-run fill
        nonces[1] = 2;
        nonces[2] = 3;
        vm.prank(maker);
        settlement.cancelNonces(nonces); // must NOT revert

        // The remaining orders are now firmly cancelled.
        assertTrue(settlement.nonceUsed(maker, 2));
        assertTrue(settlement.nonceUsed(maker, 3));
    }

    // ----- ownership / approval failures -----

    function test_RevertMakerNoLongerOwnsNFT() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(maker);
        nftA.transferFrom(maker, makeAddr("someoneElse"), 1);

        vm.prank(taker);
        vm.expectRevert(
            abi.encodeWithSelector(
                MonadMarketSettlement.NotTokenOwner.selector, address(nftA), 1, maker
            )
        );
        settlement.fulfillTrade(order, sig);
    }

    function test_RevertApprovalRevoked() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(maker);
        nftA.setApprovalForAll(address(settlement), false);

        vm.prank(taker);
        vm.expectRevert(
            abi.encodeWithSelector(
                MonadMarketSettlement.MissingApproval.selector, address(nftA), 1, maker
            )
        );
        settlement.fulfillTrade(order, sig);
    }

    // ----- L-03: at least one NFT leg required -----

    /// @dev A MON-only (native-for-native) order must be rejected — this is an
    ///      NFT marketplace, so at least one side has to move an NFT.
    function test_RevertMonOnlyOrderHasNoNFT() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.makerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.makerMonAmount = 1 ether;
        order.takerMonAmount = 2 ether;
        bytes memory sig = _sign(order, makerKey);

        // Fund the maker's escrow so we get past the escrow check and prove the
        // rejection is specifically the missing-NFT rule, not insufficient funds.
        uint256 makerFee = (1 ether * 100) / 10_000;
        vm.prank(maker);
        settlement.deposit{value: 1 ether + makerFee}();

        uint256 takerFee = (2 ether * 100) / 10_000;
        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.NoNFTInTrade.selector);
        settlement.fulfillTrade{value: 2 ether + takerFee}(order, sig);
    }

    /// @dev An order with an NFT on only one side still settles (NFT↔MON).
    function test_SingleSidedNFTLegStillAllowed() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.takerMonAmount = 3 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (3 ether * 100) / 10_000;
        vm.prank(taker);
        settlement.fulfillTrade{value: 3 ether + fee}(order, sig);
        assertEq(nftA.ownerOf(1), taker);
    }

    // ----- payment validation -----

    function test_RevertIncorrectPayment() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.takerMonAmount = 1 ether;
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.IncorrectPayment.selector);
        settlement.fulfillTrade{value: 1 ether}(order, sig); // missing fee
    }

    function test_RevertInsufficientEscrow() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.makerMonAmount = 5 ether;
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.InsufficientEscrow.selector);
        settlement.fulfillTrade(order, sig);
    }

    // ----- escrow -----

    function test_EscrowDepositWithdraw() public {
        vm.prank(maker);
        settlement.deposit{value: 3 ether}();
        assertEq(settlement.escrowBalance(maker), 3 ether);

        uint256 before = maker.balance;
        vm.prank(maker);
        settlement.withdraw(2 ether);
        assertEq(settlement.escrowBalance(maker), 1 ether);
        assertEq(maker.balance, before + 2 ether);
    }

    function test_RevertWithdrawTooMuch() public {
        vm.prank(maker);
        settlement.deposit{value: 1 ether}();
        vm.prank(maker);
        vm.expectRevert(MonadMarketSettlement.InsufficientEscrow.selector);
        settlement.withdraw(2 ether);
    }

    // ----- admin -----

    function test_AdminFeeConfig() public {
        vm.startPrank(owner);
        settlement.setFeeBps(250);
        assertEq(settlement.feeBps(), 250);

        vm.expectRevert(MonadMarketSettlement.FeeTooHigh.selector);
        settlement.setFeeBps(501);

        address newRecipient = makeAddr("newRecipient");
        settlement.setFeeRecipient(newRecipient);
        assertEq(settlement.feeRecipient(), newRecipient);

        vm.expectRevert(MonadMarketSettlement.ZeroAddress.selector);
        settlement.setFeeRecipient(address(0));
        vm.stopPrank();
    }

    function test_RevertNonOwnerAdmin() public {
        vm.prank(taker);
        vm.expectRevert();
        settlement.setFeeBps(50);
    }

    // ----- L-04: transfer effectiveness -----

    /// @dev A no-op ERC721 (transfer does nothing) must not let settlement
    ///      release the opposite leg; the post-transfer ownerOf check reverts.
    function test_RevertNoOpNFTTransfer() public {
        NoOpERC721 fake = new NoOpERC721(maker); // reports maker as owner, approves all

        MonadMarketSettlement.NFTItem[] memory makerItems = new MonadMarketSettlement.NFTItem[](1);
        makerItems[0] = MonadMarketSettlement.NFTItem(address(fake), 1);

        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.makerNFTs = makerItems;
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.takerMonAmount = 1 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (1 ether * 100) / 10_000;
        vm.prank(taker);
        vm.expectRevert(
            abi.encodeWithSelector(
                MonadMarketSettlement.TransferNotEffective.selector, address(fake), 1
            )
        );
        settlement.fulfillTrade{value: 1 ether + fee}(order, sig);
    }

    // ----- L-05: signature-authorized cancellation -----

    function test_CancelNonceFor_ECDSA() public {
        uint256 nonce = 42;
        bytes32 digest = settlement.hashCancel(maker, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerKey, digest);
        bytes memory sig = abi.encodePacked(r, s, v);

        // A random relayer submits the maker's signed cancellation.
        address relayer = makeAddr("relayer");
        vm.prank(relayer);
        settlement.cancelNonceFor(maker, nonce, sig);
        assertTrue(settlement.nonceUsed(maker, nonce));
    }

    function test_CancelNonceFor_BlocksSubsequentFill() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        bytes memory orderSig = _sign(order, makerKey);

        bytes32 digest = settlement.hashCancel(maker, order.nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerKey, digest);
        settlement.cancelNonceFor(maker, order.nonce, abi.encodePacked(r, s, v));

        vm.prank(taker);
        vm.expectRevert(MonadMarketSettlement.NonceAlreadyUsed.selector);
        settlement.fulfillTrade(order, orderSig);
    }

    function test_CancelNonceFor_EIP1271Wallet() public {
        MockSmartWallet wallet = new MockSmartWallet(maker); // owner key = makerKey
        uint256 nonce = 7;

        bytes32 digest = settlement.hashCancel(address(wallet), nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerKey, digest);

        settlement.cancelNonceFor(address(wallet), nonce, abi.encodePacked(r, s, v));
        assertTrue(settlement.nonceUsed(address(wallet), nonce));
    }

    function test_RevertCancelNonceForBadSig() public {
        uint256 nonce = 9;
        bytes32 digest = settlement.hashCancel(maker, nonce);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(takerKey, digest); // wrong signer
        vm.expectRevert(MonadMarketSettlement.InvalidSignature.selector);
        settlement.cancelNonceFor(maker, nonce, abi.encodePacked(r, s, v));
    }

    function test_RevertCancelNonceForAlreadyUsed() public {
        vm.prank(maker);
        settlement.cancelNonce(5);

        bytes32 digest = settlement.hashCancel(maker, 5);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(makerKey, digest);
        vm.expectRevert(MonadMarketSettlement.NonceAlreadyUsed.selector);
        settlement.cancelNonceFor(maker, 5, abi.encodePacked(r, s, v));
    }

    // ----- L-06: return-bomb recipient is still paid on withdraw -----

    /// @dev Settlement no longer pushes MON (L-08 pull payments), so the remaining
    ///      native call is withdraw(). A recipient whose fallback return-bombs is
    ///      still paid there — _sendNative discards the returndata instead of
    ///      copying the hostile blob into memory. ReturnBomber accepts any
    ///      signature via EIP-1271, so it can be the maker whose proceeds it later
    ///      withdraws.
    function test_ReturnBombRecipientStillPaidOnWithdraw() public {
        ReturnBomber bomber = new ReturnBomber();
        nftA.mint(address(bomber), 50);
        bomber.approveAll(nftA, address(settlement));

        MonadMarketSettlement.NFTItem[] memory makerItems = new MonadMarketSettlement.NFTItem[](1);
        makerItems[0] = MonadMarketSettlement.NFTItem(address(nftA), 50);

        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.maker = address(bomber);
        order.makerNFTs = makerItems;
        order.takerNFTs = new MonadMarketSettlement.NFTItem[](0);
        order.takerMonAmount = 1 ether; // taker pays MON -> credited to bomber's escrow
        bytes memory sig = _sign(order, makerKey); // bomber's EIP-1271 accepts it

        uint256 fee = (1 ether * 100) / 10_000;
        vm.prank(taker);
        settlement.fulfillTrade{value: 1 ether + fee}(order, sig);

        assertEq(nftA.ownerOf(50), taker);
        assertEq(settlement.escrowBalance(address(bomber)), 1 ether); // pull credit

        // Now the bomber withdraws; its return-bombing fallback must not choke it.
        bomber.pullEscrow(settlement, 1 ether);
        assertEq(address(bomber).balance, 1 ether);
        assertEq(settlement.escrowBalance(address(bomber)), 0);
    }

    // ----- L-08: dual-MON proceeds credited to escrow, no push -----

    /// @dev NFT+MON <-> NFT+MON settles with both MON legs credited to escrow, so
    ///      there is no native push a hostile recipient could grief or OOG.
    function test_DualMonSettlesToEscrow() public {
        MonadMarketSettlement.TradeOrder memory order = _baseOrder();
        order.makerMonAmount = 2 ether;
        order.takerMonAmount = 3 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 makerLegFee = (2 ether * 100) / 10_000;
        uint256 takerLegFee = (3 ether * 100) / 10_000;
        vm.prank(maker);
        settlement.deposit{value: 2 ether + makerLegFee}();

        uint256 makerBefore = maker.balance;
        uint256 takerBefore = taker.balance;

        vm.prank(taker);
        settlement.fulfillTrade{value: 3 ether + takerLegFee}(order, sig);

        // NFTs swapped.
        assertEq(nftA.ownerOf(1), taker);
        assertEq(nftB.ownerOf(2), maker);
        // No native pushed to either party; proceeds are escrow credits.
        assertEq(maker.balance, makerBefore);
        assertEq(taker.balance, takerBefore - (3 ether + takerLegFee));
        assertEq(settlement.escrowBalance(maker), 3 ether); // received taker's MON
        assertEq(settlement.escrowBalance(taker), 2 ether); // received maker's MON
        assertEq(settlement.pendingFees(feeRecipient), makerLegFee + takerLegFee);
    }

    // ----- fuzz -----

    function testFuzz_FeeMath(uint96 makerAmount, uint96 takerAmount) public view {
        (uint256 makerFee, uint256 takerFee,) = settlement.quoteFees(makerAmount, takerAmount);
        assertEq(makerFee, (uint256(makerAmount) * 100) / 10_000);
        assertEq(takerFee, (uint256(takerAmount) * 100) / 10_000);
    }
}
