// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Test} from "forge-std/Test.sol";
import {Handshake} from "../src/Handshake.sol";
import {MockERC721} from "./mocks/MockERC721.sol";

/// @notice A contract that can deposit escrow but cannot receive native MON
///         (no payable receive/fallback). Models the L-2 stranded-funds case.
contract EscrowDepositorNoReceive {
    Handshake public s;

    constructor(Handshake _s) {
        s = _s;
    }

    /// @dev Deposits from this contract's own balance (funded via vm.deal).
    function fund(uint256 amount) external {
        s.deposit{value: amount}();
    }
}

/// @notice Contract with no payable receive/fallback — any native send reverts.
contract NonPayableTarget {
// no receive/fallback => native transfers to this contract revert
}

/// @notice Regression tests for the L-2 fix: `withdrawTo` / `withdrawFeesTo`
///         let a fund owner whose own address cannot receive native MON redirect
///         the payout to a payable address, without letting anyone touch a
///         balance that isn't theirs.
contract HandshakeWithdrawToTest is Test {
    Handshake settlement;
    MockERC721 nftA;

    uint256 makerKey = 0xA11CE;
    uint256 takerKey = 0xB0B;
    address maker;
    address taker;
    address owner = makeAddr("owner");
    address feeRecipient = makeAddr("feeRecipient");
    address rescue = makeAddr("rescue");

    function setUp() public {
        maker = vm.addr(makerKey);
        taker = vm.addr(takerKey);
        settlement = new Handshake(owner, feeRecipient);
        nftA = new MockERC721();
        nftA.mint(maker, 1);

        vm.prank(maker);
        nftA.setApprovalForAll(address(settlement), true);
        vm.deal(maker, 100 ether);
        vm.deal(taker, 100 ether);
    }

    function _sign(Handshake.TradeOrder memory order, uint256 key)
        internal
        view
        returns (bytes memory)
    {
        bytes32 digest = settlement.hashOrder(order);
        (uint8 v, bytes32 r, bytes32 s) = vm.sign(key, digest);
        return abi.encodePacked(r, s, v);
    }

    /// @dev Accrue a protocol fee to `feeRecipient` via an NFT-for-MON trade.
    function _accrueFee() internal returns (uint256 fee) {
        Handshake.NFTItem[] memory makerItems = new Handshake.NFTItem[](1);
        makerItems[0] = Handshake.NFTItem(address(nftA), 1);

        Handshake.TradeOrder memory order = Handshake.TradeOrder({
            maker: maker,
            taker: address(0),
            makerNFTs: makerItems,
            takerNFTs: new Handshake.NFTItem[](0),
            makerMonAmount: 0,
            takerMonAmount: 10 ether,
            feeBps: 100,
            flatFee: 0,
            nonce: 1,
            expiry: block.timestamp + 1 days
        });
        bytes memory sig = _sign(order, makerKey);

        fee = (10 ether * 100) / 10_000;
        vm.prank(taker);
        settlement.fulfillTrade{value: 10 ether + fee}(order, sig);
    }

    // ---- escrow redirect ----

    function test_WithdrawTo_RescuesEscrowForNonReceivingDepositor() public {
        EscrowDepositorNoReceive depositor = new EscrowDepositorNoReceive(settlement);
        vm.deal(address(depositor), 1 ether);
        depositor.fund(1 ether);
        assertEq(settlement.escrowBalance(address(depositor)), 1 ether);

        // Its own address cannot receive MON: plain withdraw reverts.
        vm.prank(address(depositor));
        vm.expectRevert(
            abi.encodeWithSelector(
                Handshake.NativeTransferFailed.selector, address(depositor), 1 ether
            )
        );
        settlement.withdraw(1 ether);

        // withdrawTo routes the same balance to a payable rescue address.
        vm.prank(address(depositor));
        settlement.withdrawTo(rescue, 1 ether);
        assertEq(rescue.balance, 1 ether);
        assertEq(settlement.escrowBalance(address(depositor)), 0);
    }

    function test_WithdrawTo_ZeroAddressReverts() public {
        vm.prank(maker);
        settlement.deposit{value: 1 ether}();
        vm.prank(maker);
        vm.expectRevert(Handshake.ZeroAddress.selector);
        settlement.withdrawTo(address(0), 1 ether);
    }

    function test_WithdrawTo_CannotOverdrawSomeoneElse() public {
        // maker funds escrow; a stranger cannot pull it via withdrawTo.
        vm.prank(maker);
        settlement.deposit{value: 2 ether}();

        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(Handshake.InsufficientEscrow.selector);
        settlement.withdrawTo(stranger, 1 ether);

        assertEq(settlement.escrowBalance(maker), 2 ether);
    }

    // ---- fee redirect ----

    function test_WithdrawFeesTo_RescuesFeesForNonReceivingRecipient() public {
        NonPayableTarget bad = new NonPayableTarget();
        vm.prank(owner);
        settlement.setFeeRecipient(address(bad));

        uint256 fee = _accrueFee();
        assertEq(settlement.pendingFees(address(bad)), fee);

        // The broken recipient cannot pull to itself...
        vm.prank(address(bad));
        vm.expectRevert(
            abi.encodeWithSelector(
                Handshake.NativeTransferFailed.selector, address(bad), fee
            )
        );
        settlement.withdrawFees();

        // ...but can redirect its own accrued fees to a payable address.
        vm.prank(address(bad));
        settlement.withdrawFeesTo(rescue);
        assertEq(rescue.balance, fee);
        assertEq(settlement.pendingFees(address(bad)), 0);
    }

    function test_WithdrawFeesTo_ZeroAddressReverts() public {
        _accrueFee();
        vm.prank(feeRecipient);
        vm.expectRevert(Handshake.ZeroAddress.selector);
        settlement.withdrawFeesTo(address(0));
    }

    function test_WithdrawFeesTo_NothingOwedReverts() public {
        vm.prank(feeRecipient);
        vm.expectRevert(Handshake.ZeroAmount.selector);
        settlement.withdrawFeesTo(rescue);
    }

    function test_WithdrawFeesTo_CannotDrainAnotherRecipient() public {
        // Fees accrue to feeRecipient; a stranger with no pending balance gets nothing.
        _accrueFee();
        address stranger = makeAddr("stranger");
        vm.prank(stranger);
        vm.expectRevert(Handshake.ZeroAmount.selector);
        settlement.withdrawFeesTo(stranger);
    }
}
