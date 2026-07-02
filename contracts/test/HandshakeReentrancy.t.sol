// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Handshake} from "../src/Handshake.sol";
import {MockERC721} from "./mocks/MockERC721.sol";
import {ERC721} from "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import {IERC721Receiver} from "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

// =====================================================================
//                          ATTACKER CONTRACTS
// =====================================================================

/// @notice Malicious BUYER (taker). It is an ERC721 receiver and a payable
///         contract, so it gets an `onERC721Received` callback when it receives
///         the maker's NFT and a `receive()` callback when it receives a MON
///         payout. In both callbacks it re-enters `fulfillTrade` with the very
///         same signed order, attempting a double-settlement / drain.
contract ReentrantTaker is IERC721Receiver {
    Handshake public s;
    Handshake.TradeOrder private order;
    bytes private sig;
    bool public armed;
    bool public reentered; // set true only if a nested fulfillTrade SUCCEEDS
    bool public reentrancyBlocked; // set true when the guard rejects the reentry

    constructor(Handshake _s) {
        s = _s;
    }

    function approveNFT(MockERC721 nft) external {
        nft.setApprovalForAll(address(s), true);
    }

    function arm(Handshake.TradeOrder calldata o, bytes calldata _sig) external {
        order = o;
        sig = _sig;
        armed = true;
    }

    function fulfill(uint256 value) external {
        s.fulfillTrade{value: value}(order, sig);
    }

    function withdrawEscrow(uint256 amount) external {
        s.withdraw(amount);
    }

    function _tryReenter() private {
        if (!armed) return;
        armed = false; // one-shot so we don't recurse forever on a hypothetical success
        try s.fulfillTrade(order, sig) {
            reentered = true;
        } catch {
            reentrancyBlocked = true;
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        _tryReenter();
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {
        _tryReenter();
    }
}

/// @notice Malicious SELLER (maker) — an EIP-1271 smart-contract wallet. When it
///         receives the taker's NFT / MON during settlement it re-enters a
///         DIFFERENT state-changing function (`withdrawFees`) to prove the guard
///         blocks cross-function reentrancy, not just same-function reentrancy.
contract ReentrantMaker is IERC721Receiver {
    bytes4 internal constant MAGICVALUE = 0x1626ba7e;

    Handshake public s;
    address public owner;
    bool public armed;
    bool public reentrancyBlocked;

    constructor(Handshake _s, address _owner) {
        s = _s;
        owner = _owner;
    }

    function isValidSignature(bytes32 hash, bytes calldata signature) external view returns (bytes4) {
        (address recovered,,) = ECDSA.tryRecover(hash, signature);
        return recovered == owner ? MAGICVALUE : bytes4(0xffffffff);
    }

    function approveNFT(MockERC721 nft) external {
        nft.setApprovalForAll(address(s), true);
    }

    function arm() external {
        armed = true;
    }

    function _tryReenter() private {
        if (!armed) return;
        armed = false;
        try s.withdrawFees() {
            // Reaching here would mean the cross-function guard failed.
        } catch {
            reentrancyBlocked = true;
        }
    }

    function onERC721Received(address, address, uint256, bytes calldata) external returns (bytes4) {
        _tryReenter();
        return IERC721Receiver.onERC721Received.selector;
    }

    receive() external payable {
        _tryReenter();
    }
}

/// @notice Malicious NFT CONTRACT. It re-enters the settlement contract from
///         inside its own `_update` transfer hook (i.e. mid-`safeTransferFrom`,
///         before ownership is finalized) to test both classic and read-only
///         reentrancy exposure through an untrusted token.
contract ReentrantNFT is ERC721 {
    Handshake public s;
    bool public armed;
    bool public reentrancyBlocked;

    constructor(Handshake _s) ERC721("Evil", "EVL") {
        s = _s;
    }

    function mint(address to, uint256 id) external {
        _mint(to, id);
    }

    function arm() external {
        armed = true;
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        if (armed) {
            armed = false;
            try s.withdrawFees() {
                // Success here would prove reentrancy through an untrusted NFT.
            } catch {
                reentrancyBlocked = true;
            }
        }
        return super._update(to, tokenId, auth);
    }
}

/// @notice Classic reentrant REFUND / escrow drainer. It deposits its own MON,
///         then during the `withdraw` payout it re-enters `withdraw` again to try
///         to pull more than it deposited (draining other users' escrow).
contract ReentrantWithdrawer {
    Handshake public s;
    uint256 public amount;
    bool public armed;
    bool public reentrancyBlocked;

    constructor(Handshake _s) {
        s = _s;
    }

    function fund(uint256 depositAmount) external {
        // Deposit from this contract's own balance (funded via vm.deal).
        s.deposit{value: depositAmount}();
    }

    function attackWithdraw(uint256 _amount) external {
        amount = _amount;
        armed = true;
        s.withdraw(_amount);
    }

    receive() external payable {
        if (armed) {
            armed = false;
            try s.withdraw(amount) {
                // Success here would be a double-withdrawal.
            } catch {
                reentrancyBlocked = true;
            }
        }
    }
}

// =====================================================================
//                              TEST SUITE
// =====================================================================

contract HandshakeReentrancyTest is Test {
    Handshake settlement;
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
        settlement = new Handshake(owner, feeRecipient);
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

    function _sign(Handshake.TradeOrder memory order, uint256 key)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = settlement.hashOrder(order);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    function _order() internal view returns (Handshake.TradeOrder memory order) {
        Handshake.NFTItem[] memory makerItems = new Handshake.NFTItem[](1);
        makerItems[0] = Handshake.NFTItem(address(nftA), 1);
        Handshake.NFTItem[] memory takerItems = new Handshake.NFTItem[](1);
        takerItems[0] = Handshake.NFTItem(address(nftB), 2);

        order = Handshake.TradeOrder({
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

    // =================================================================
    // 1. Reentrant BUYER (taker) — reenter during NFT receipt callback
    // =================================================================
    function test_ReentrantTaker_DuringNftReceipt_Blocked() public {
        ReentrantTaker attacker = new ReentrantTaker(settlement);
        // The attacker is the taker: it owns and approves the taker-side NFT.
        nftB.mint(address(attacker), 20);
        attacker.approveNFT(nftB);

        Handshake.TradeOrder memory order = _order();
        order.takerNFTs[0] = Handshake.NFTItem(address(nftB), 20);
        bytes memory sig = _sign(order, makerKey);

        attacker.arm(order, sig);
        attacker.fulfill(0);

        // The trade settled exactly once; the reentrant fulfillTrade was rejected.
        assertTrue(attacker.reentrancyBlocked(), "reentry was not blocked");
        assertFalse(attacker.reentered(), "nested settlement succeeded");
        assertEq(nftA.ownerOf(1), address(attacker));
        assertEq(nftB.ownerOf(20), maker);
        assertTrue(settlement.nonceUsed(maker, order.nonce));
    }

    // =================================================================
    // 2. Reentrant BUYER (taker) — reenter during the auto-withdraw MON payout.
    //    The taker (attacker) is owed a MON payout, which settlement auto-sends
    //    with a bounded gas stipend. Its receive() tries to re-enter fulfillTrade;
    //    the nonReentrant guard blocks any nested settlement. Whether the capped
    //    payout lands directly or falls back to escrow, the invariants hold: no
    //    double settlement, and the attacker is paid exactly once (balance +
    //    escrow == the amount owed).
    // =================================================================
    function test_ReentrantTaker_PayoutCannotBeExploited() public {
        ReentrantTaker attacker = new ReentrantTaker(settlement);
        nftB.mint(address(attacker), 21);
        attacker.approveNFT(nftB);

        Handshake.TradeOrder memory order = _order();
        order.makerNFTs = new Handshake.NFTItem[](0); // maker gives only MON
        order.makerMonAmount = 1 ether;
        order.takerNFTs[0] = Handshake.NFTItem(address(nftB), 21);
        bytes memory sig = _sign(order, makerKey);

        // Maker funds escrow: 1 MON leg + 1% maker-leg fee.
        uint256 makerFee = (1 ether * 100) / 10_000;
        vm.prank(maker);
        settlement.deposit{value: 1 ether + makerFee}();

        attacker.arm(order, sig);
        attacker.fulfill(0);

        // No nested settlement succeeded, and the attacker got exactly its 1 MON
        // (directly or, if its callback exceeded the stipend, as an escrow credit).
        assertFalse(attacker.reentered(), "nested settlement succeeded");
        assertEq(
            address(attacker).balance + settlement.escrowBalance(address(attacker)),
            1 ether,
            "attacker not paid exactly once"
        );
        assertEq(nftB.ownerOf(21), maker);
        assertEq(settlement.escrowBalance(maker), 0);
        assertTrue(settlement.nonceUsed(maker, order.nonce));
    }

    // =================================================================
    // 3. Reentrant SELLER (EIP-1271 maker) — cross-function reentry
    // =================================================================
    function test_ReentrantMaker_CrossFunction_Blocked() public {
        ReentrantMaker attacker = new ReentrantMaker(settlement, maker);
        nftA.mint(address(attacker), 30);
        attacker.approveNFT(nftA);

        Handshake.TradeOrder memory order = _order();
        order.maker = address(attacker);
        order.makerNFTs[0] = Handshake.NFTItem(address(nftA), 30);
        // taker side stays nftB #2 owned by the taker EOA.
        bytes memory sig = _sign(order, makerKey); // owner key -> EIP-1271 valid

        attacker.arm();
        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        assertTrue(attacker.reentrancyBlocked(), "cross-function reentry not blocked");
        assertEq(nftA.ownerOf(30), taker);
        assertEq(nftB.ownerOf(2), address(attacker));
        assertTrue(settlement.nonceUsed(address(attacker), order.nonce));
    }

    // =================================================================
    // 4. Malicious NFT CONTRACT — reenter from inside the transfer hook
    // =================================================================
    function test_MaliciousNFT_ReenterDuringTransfer_Blocked() public {
        ReentrantNFT evil = new ReentrantNFT(settlement);
        evil.mint(maker, 40);
        vm.prank(maker);
        evil.setApprovalForAll(address(settlement), true);
        evil.arm();

        Handshake.TradeOrder memory order = _order();
        order.makerNFTs[0] = Handshake.NFTItem(address(evil), 40);
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        assertTrue(evil.reentrancyBlocked(), "reentry through NFT not blocked");
        assertEq(evil.ownerOf(40), taker);
        assertEq(nftB.ownerOf(2), maker);
        assertTrue(settlement.nonceUsed(maker, order.nonce));
    }

    // =================================================================
    // 5. Classic reentrant REFUND / escrow drain on withdraw()
    // =================================================================
    function test_ReentrantWithdraw_CannotDrainEscrow() public {
        // Honest user parks 5 MON of escrow in the contract.
        address honest = makeAddr("honest");
        vm.deal(honest, 5 ether);
        vm.prank(honest);
        settlement.deposit{value: 5 ether}();

        ReentrantWithdrawer attacker = new ReentrantWithdrawer(settlement);
        vm.deal(address(attacker), 1 ether);
        attacker.fund(1 ether);
        assertEq(address(settlement).balance, 6 ether);

        attacker.attackWithdraw(1 ether);

        // Guard + CEI: attacker recovered exactly its own 1 MON, nothing more.
        assertTrue(attacker.reentrancyBlocked(), "reentrant withdraw not blocked");
        assertEq(address(attacker).balance, 1 ether);
        assertEq(address(settlement).balance, 5 ether); // honest funds untouched
        assertEq(settlement.escrowBalance(honest), 5 ether);
        assertEq(settlement.escrowBalance(address(attacker)), 0);
    }

    // =================================================================
    // 6-9. State-machine idempotency (no attacker contract required)
    // =================================================================

    function test_CannotSettleTwice() public {
        Handshake.TradeOrder memory order = _order();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        // Even after moving the assets back, the consumed nonce blocks a replay.
        vm.prank(taker);
        nftA.transferFrom(taker, maker, 1);
        vm.prank(maker);
        nftB.transferFrom(maker, taker, 2);

        vm.prank(taker);
        vm.expectRevert(Handshake.NonceAlreadyUsed.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_CannotCancelAfterSettlement() public {
        Handshake.TradeOrder memory order = _order();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(taker);
        settlement.fulfillTrade(order, sig);

        vm.prank(maker);
        vm.expectRevert(Handshake.NonceAlreadyUsed.selector);
        settlement.cancelNonce(order.nonce);
    }

    function test_CannotSettleAfterCancel() public {
        Handshake.TradeOrder memory order = _order();
        bytes memory sig = _sign(order, makerKey);

        vm.prank(maker);
        settlement.cancelNonce(order.nonce);

        vm.prank(taker);
        vm.expectRevert(Handshake.NonceAlreadyUsed.selector);
        settlement.fulfillTrade(order, sig);
    }

    function test_CannotWithdrawFeesTwice() public {
        Handshake.TradeOrder memory order = _order();
        order.takerNFTs = new Handshake.NFTItem[](0);
        order.takerMonAmount = 10 ether;
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (10 ether * 100) / 10_000;
        vm.prank(taker);
        settlement.fulfillTrade{value: 10 ether + fee}(order, sig);

        vm.prank(feeRecipient);
        settlement.withdrawFees();

        vm.prank(feeRecipient);
        vm.expectRevert(Handshake.ZeroAmount.selector);
        settlement.withdrawFees();
    }
}
