// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {MonadMarketSettlement} from "../../src/MonadMarketSettlement.sol";
import {MockERC721} from "../mocks/MockERC721.sol";
import {ReentrantActor} from "./ReentrantActor.sol";

/// @notice Adversarial tests that go beyond the negative-path unit tests in
///         MonadMarketSettlement.t.sol. These mount ACTIVE attacks — malicious
///         callbacks that re-enter, orders that try to double-spend an NFT, and
///         a cross-maker escrow isolation check.
contract AttacksTest is Test {
    MonadMarketSettlement settlement;
    MockERC721 nftA; // maker side
    MockERC721 nftB; // taker side

    uint256 makerKey = 0xA11CE;
    address maker;
    address owner = makeAddr("owner");
    address feeRecipient = makeAddr("feeRecipient");

    function setUp() public {
        maker = vm.addr(makerKey);
        settlement = new MonadMarketSettlement(owner, feeRecipient);
        nftA = new MockERC721();
        nftB = new MockERC721();

        vm.prank(maker);
        nftA.setApprovalForAll(address(settlement), true);
        vm.deal(maker, 100 ether);
    }

    // ---- helpers (mirror the main harness) ----

    function _sign(MonadMarketSettlement.TradeOrder memory order, uint256 key)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = settlement.hashOrder(order);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    function _one(address nft, uint256 id)
        internal
        pure
        returns (MonadMarketSettlement.NFTItem[] memory items)
    {
        items = new MonadMarketSettlement.NFTItem[](1);
        items[0] = MonadMarketSettlement.NFTItem(nft, id);
    }

    function _none() internal pure returns (MonadMarketSettlement.NFTItem[] memory items) {
        items = new MonadMarketSettlement.NFTItem[](0);
    }

    // ================================================================
    // 1. Cross-function reentrancy via the ERC721 receive callback.
    //    Actor is the taker; when it receives the maker's NFT it tries
    //    to re-enter settlement.withdraw(). The guard must block it while
    //    the outer trade still completes atomically.
    // ================================================================
    function test_ReentrancyViaERC721CallbackIsBlocked() public {
        nftA.mint(maker, 1);

        ReentrantActor actor = new ReentrantActor(address(settlement));
        vm.deal(address(actor), 10 ether);
        actor.setApprovalForAll(address(nftB));

        // Give the actor its own escrow so a successful re-entrant withdraw
        // would actually move money — making the guard the only thing stopping it.
        actor.fundEscrow{value: 5 ether}();
        actor.arm(ReentrantActor.Mode.WITHDRAW, 1 ether);

        // NFT-for-NFT: maker gives nftA#1, actor(taker) gives nftB#2.
        nftB.mint(address(actor), 2);

        MonadMarketSettlement.TradeOrder memory order = MonadMarketSettlement.TradeOrder({
            maker: maker,
            taker: address(actor),
            makerNFTs: _one(address(nftA), 1),
            takerNFTs: _one(address(nftB), 2),
            makerMonAmount: 0,
            takerMonAmount: 0,
            feeBps: 0,
            flatFee: 0,
            nonce: 1,
            expiry: block.timestamp + 1 days
        });
        bytes memory sig = _sign(order, makerKey);

        vm.prank(address(actor));
        settlement.fulfillTrade(order, sig);

        // Trade settled atomically...
        assertEq(nftA.ownerOf(1), address(actor), "actor should hold maker NFT");
        assertEq(nftB.ownerOf(2), maker, "maker should hold taker NFT");
        // ...and the re-entrant withdraw was attempted AND rejected.
        assertTrue(actor.reentryAttempted(), "actor never tried to re-enter");
        assertTrue(actor.reentryBlocked(), "GUARD FAILED: re-entry got through");
        // Actor's escrow is fully intact — nothing leaked mid-trade.
        assertEq(settlement.escrowBalance(address(actor)), 5 ether);
    }

    // ================================================================
    // 2. Cross-function reentrancy via the native (MON) refund leg.
    //    Maker funds MON from escrow; the actor(taker) receives it via
    //    receive() and tries to re-enter withdrawFees().
    // ================================================================
    function test_ReentrancyViaNativeRefundIsBlocked() public {
        // MON-for-NFT: maker pays 1 MON (from escrow) for the actor's nftB#2.
        // The actor receives ONLY the native leg here — no NFT — so this
        // isolates the receive() callback path (no onERC721Received fires).
        ReentrantActor actor = new ReentrantActor(address(settlement));
        actor.setApprovalForAll(address(nftB));
        nftB.mint(address(actor), 2);

        // Fund the actor's own escrow and have it re-enter withdraw() on the
        // native refund. Without the guard this withdraw would SUCCEED mid-trade
        // (the actor has 5 ether), flipping reentryBlocked to false and failing
        // the test — a genuine regression tripwire, not a no-op.
        vm.deal(address(actor), 5 ether);
        actor.fundEscrow{value: 5 ether}();
        actor.arm(ReentrantActor.Mode.WITHDRAW, 1 ether);

        // Maker funds escrow to cover makerMonAmount + maker-leg fee.
        uint256 makerMon = 1 ether;
        uint256 makerLegFee = (makerMon * 100) / 10_000;
        vm.prank(maker);
        settlement.deposit{value: makerMon + makerLegFee}();

        MonadMarketSettlement.TradeOrder memory order = MonadMarketSettlement.TradeOrder({
            maker: maker,
            taker: address(actor),
            makerNFTs: _none(),
            takerNFTs: _one(address(nftB), 2),
            makerMonAmount: makerMon,
            takerMonAmount: 0,
            feeBps: 100,
            flatFee: 0,
            nonce: 7,
            expiry: block.timestamp + 1 days
        });
        bytes memory sig = _sign(order, makerKey);

        // Taker's leg is zero MON, so it owes nothing: msg.value == 0.
        vm.prank(address(actor));
        settlement.fulfillTrade{value: 0}(order, sig);

        assertEq(nftB.ownerOf(2), maker, "maker should receive the NFT");
        assertTrue(actor.reentryAttempted(), "receive() never fired / no re-entry tried");
        assertTrue(actor.reentryBlocked(), "GUARD FAILED on native refund leg");
        // Actor got its 1 MON refund but its escrow is untouched (5 ether intact).
        assertEq(settlement.escrowBalance(address(actor)), 5 ether, "escrow leaked mid-trade");
    }

    // ================================================================
    // 3. An order can't list the same NFT twice to double-count it.
    //    _verifyNFTs passes (owner still holds it at verify time) but the
    //    second transfer reverts because ownership already moved — the whole
    //    trade reverts atomically.
    // ================================================================
    function test_DuplicateNftInOrderReverts() public {
        nftA.mint(maker, 1);

        MonadMarketSettlement.NFTItem[] memory dup = new MonadMarketSettlement.NFTItem[](2);
        dup[0] = MonadMarketSettlement.NFTItem(address(nftA), 1);
        dup[1] = MonadMarketSettlement.NFTItem(address(nftA), 1);

        address taker = makeAddr("taker");
        vm.deal(taker, 10 ether);

        MonadMarketSettlement.TradeOrder memory order = MonadMarketSettlement.TradeOrder({
            maker: maker,
            taker: address(0),
            makerNFTs: dup,
            takerNFTs: _none(),
            makerMonAmount: 0,
            takerMonAmount: 1 ether,
            feeBps: 100,
            flatFee: 0,
            nonce: 3,
            expiry: block.timestamp + 1 days
        });
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (uint256(1 ether) * 100) / 10_000;
        vm.prank(taker);
        vm.expectRevert(); // ERC721: transfer of token not owned on 2nd leg
        settlement.fulfillTrade{value: 1 ether + fee}(order, sig);
    }

    // ================================================================
    // 4. Filling one maker's order never touches another account's escrow.
    // ================================================================
    function test_CrossMakerEscrowIsolation() public {
        // makerB parks escrow but is uninvolved in the trade.
        address makerB = makeAddr("makerB");
        vm.deal(makerB, 10 ether);
        vm.prank(makerB);
        settlement.deposit{value: 5 ether}();

        // maker (A) sells an NFT for taker MON — no maker escrow needed.
        nftA.mint(maker, 1);
        address taker = makeAddr("taker");
        vm.deal(taker, 10 ether);

        MonadMarketSettlement.TradeOrder memory order = MonadMarketSettlement.TradeOrder({
            maker: maker,
            taker: address(0),
            makerNFTs: _one(address(nftA), 1),
            takerNFTs: _none(),
            makerMonAmount: 0,
            takerMonAmount: 2 ether,
            feeBps: 100,
            flatFee: 0,
            nonce: 9,
            expiry: block.timestamp + 1 days
        });
        bytes memory sig = _sign(order, makerKey);

        uint256 fee = (uint256(2 ether) * 100) / 10_000;
        vm.prank(taker);
        settlement.fulfillTrade{value: 2 ether + fee}(order, sig);

        // makerB's escrow is byte-for-byte untouched.
        assertEq(settlement.escrowBalance(makerB), 5 ether, "unrelated escrow moved");
        assertEq(nftA.ownerOf(1), taker);
    }
}
