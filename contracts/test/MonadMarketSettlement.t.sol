// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {MonadMarketSettlement} from "../src/MonadMarketSettlement.sol";
import {MockERC721} from "./mocks/MockERC721.sol";
import {MockSmartWallet} from "./mocks/MockSmartWallet.sol";

contract RejectEther {
    // no receive/fallback => native transfers to this contract revert
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
        assertEq(maker.balance, makerBefore + 10 ether);
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
        assertEq(taker.balance, takerBefore + 5 ether);
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

    // ----- fuzz -----

    function testFuzz_FeeMath(uint96 makerAmount, uint96 takerAmount) public view {
        (uint256 makerFee, uint256 takerFee,) = settlement.quoteFees(makerAmount, takerAmount);
        assertEq(makerFee, (uint256(makerAmount) * 100) / 10_000);
        assertEq(takerFee, (uint256(takerAmount) * 100) / 10_000);
    }
}
