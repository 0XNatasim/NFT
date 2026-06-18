// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {Pausable} from "@openzeppelin/contracts/utils/Pausable.sol";
import {Ownable2Step, Ownable} from "@openzeppelin/contracts/access/Ownable2Step.sol";
import {IERC721} from "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title MonadMarketSettlement
/// @notice Atomic peer-to-peer settlement of off-chain signed NFT/MON trade
///         orders on Monad. Orders are EIP-712 signed by the maker, stored
///         off-chain (zero gas to create), and settled on-chain by the taker.
///
///         Supported shapes: NFT↔NFT, NFT↔MON, MON↔NFT, NFT+MON↔NFT(+MON).
///
///         Maker-side MON is funded from the maker's self-managed escrow
///         balance (deposit/withdraw — the contract owner can never move
///         user funds). Taker-side MON is provided as msg.value.
contract MonadMarketSettlement is EIP712, ReentrancyGuard, Pausable, Ownable2Step {
    // ---------------------------------------------------------------------
    // Types
    // ---------------------------------------------------------------------

    struct NFTItem {
        address contractAddress;
        uint256 tokenId;
    }

    struct TradeOrder {
        address maker;
        address taker; // address(0) => open to anyone
        NFTItem[] makerNFTs;
        NFTItem[] takerNFTs;
        uint256 makerMonAmount;
        uint256 takerMonAmount;
        uint256 feeBps; // fee on each MON leg, agreed at signing time
        uint256 flatFee; // flat fee (wei) for NFT-only swaps, agreed at signing
        uint256 nonce;
        uint256 expiry; // unix timestamp
    }

    // ---------------------------------------------------------------------
    // Constants
    // ---------------------------------------------------------------------

    bytes32 public constant NFT_ITEM_TYPEHASH =
        keccak256("NFTItem(address contractAddress,uint256 tokenId)");

    bytes32 public constant TRADE_ORDER_TYPEHASH = keccak256(
        "TradeOrder(address maker,address taker,NFTItem[] makerNFTs,NFTItem[] takerNFTs,uint256 makerMonAmount,uint256 takerMonAmount,uint256 feeBps,uint256 flatFee,uint256 nonce,uint256 expiry)NFTItem(address contractAddress,uint256 tokenId)"
    );

    uint256 public constant MAX_FEE_BPS = 500; // 5%
    uint256 public constant MAX_FLAT_SWAP_FEE = 1 ether; // hard cap on flat swap fee
    uint256 public constant BPS_DENOMINATOR = 10_000;
    uint256 public constant MAX_ITEMS_PER_SIDE = 20;

    // ---------------------------------------------------------------------
    // Storage
    // ---------------------------------------------------------------------

    address public feeRecipient;
    uint256 public feeBps; // fee on each MON leg, default 100 = 1%
    uint256 public flatSwapFee; // flat fee (in wei) charged on NFT-only swaps

    /// @notice maker => nonce => consumed (filled or cancelled)
    mapping(address => mapping(uint256 => bool)) public nonceUsed;

    /// @notice Self-managed MON escrow used to fund maker-side MON legs.
    mapping(address => uint256) public escrowBalance;

    /// @notice Pull-payment ledger of protocol fees owed to fee recipients.
    ///         Accrued during settlement; claimed via withdrawFees(). Pull
    ///         payments stop a reverting fee recipient from bricking trades.
    mapping(address => uint256) public pendingFees;

    // ---------------------------------------------------------------------
    // Events
    // ---------------------------------------------------------------------

    event TradeExecuted(
        bytes32 indexed orderHash,
        address indexed maker,
        address indexed taker,
        uint256 makerMonAmount,
        uint256 takerMonAmount,
        uint256 protocolFee
    );
    event TradeCancelled(address indexed maker, uint256 indexed nonce);
    event FeeRecipientUpdated(address indexed previousRecipient, address indexed newRecipient);
    event FeeBpsUpdated(uint256 previousFeeBps, uint256 newFeeBps);
    event FlatSwapFeeUpdated(uint256 previousFee, uint256 newFee);
    event EscrowDeposited(address indexed account, uint256 amount);
    event EscrowWithdrawn(address indexed account, uint256 amount);
    event FeesWithdrawn(address indexed recipient, uint256 amount);

    // ---------------------------------------------------------------------
    // Errors
    // ---------------------------------------------------------------------

    error InvalidSignature();
    error OrderExpired();
    error NonceAlreadyUsed();
    error NotAuthorizedTaker();
    error SelfTrade();
    error EmptyOrder();
    error TooManyItems();
    error IncorrectPayment();
    error InsufficientEscrow();
    error NotTokenOwner(address nft, uint256 tokenId, address expectedOwner);
    error MissingApproval(address nft, uint256 tokenId, address owner);
    error NativeTransferFailed(address to, uint256 amount);
    error FeeTooHigh();
    error FlatFeeTooHigh();
    error ZeroAddress();
    error ZeroAmount();

    // ---------------------------------------------------------------------
    // Constructor
    // ---------------------------------------------------------------------

    constructor(address initialOwner, address initialFeeRecipient)
        EIP712("MonadMarket", "1")
        Ownable(initialOwner)
    {
        if (initialFeeRecipient == address(0)) revert ZeroAddress();
        feeRecipient = initialFeeRecipient;
        feeBps = 100; // 1%
        flatSwapFee = 0;
    }

    // ---------------------------------------------------------------------
    // Escrow (self-managed; owner can never touch user balances)
    // ---------------------------------------------------------------------

    function deposit() external payable {
        if (msg.value == 0) revert ZeroAmount();
        escrowBalance[msg.sender] += msg.value;
        emit EscrowDeposited(msg.sender, msg.value);
    }

    function withdraw(uint256 amount) external nonReentrant {
        if (amount == 0) revert ZeroAmount();
        uint256 balance = escrowBalance[msg.sender];
        if (balance < amount) revert InsufficientEscrow();
        escrowBalance[msg.sender] = balance - amount;
        emit EscrowWithdrawn(msg.sender, amount);
        _sendNative(msg.sender, amount);
    }

    /// @notice Claim protocol fees accrued to the caller (the fee recipient).
    ///         Always available, even when the contract is paused.
    function withdrawFees() external nonReentrant {
        uint256 amount = pendingFees[msg.sender];
        if (amount == 0) revert ZeroAmount();
        pendingFees[msg.sender] = 0;
        emit FeesWithdrawn(msg.sender, amount);
        _sendNative(msg.sender, amount);
    }

    // ---------------------------------------------------------------------
    // Settlement
    // ---------------------------------------------------------------------

    /// @notice Settle a maker-signed order. Caller is the taker and must
    ///         send `takerMonAmount` plus the taker-side protocol fee
    ///         (and the flat swap fee for NFT-only swaps) as msg.value.
    function fulfillTrade(TradeOrder calldata order, bytes calldata signature)
        external
        payable
        nonReentrant
        whenNotPaused
    {
        // ----- Checks -----
        if (order.makerNFTs.length == 0 && order.makerMonAmount == 0) revert EmptyOrder();
        if (order.takerNFTs.length == 0 && order.takerMonAmount == 0) revert EmptyOrder();
        if (order.makerNFTs.length > MAX_ITEMS_PER_SIDE || order.takerNFTs.length > MAX_ITEMS_PER_SIDE) {
            revert TooManyItems();
        }
        if (block.timestamp > order.expiry) revert OrderExpired();
        if (order.taker != address(0) && order.taker != msg.sender) revert NotAuthorizedTaker();
        if (order.maker == msg.sender) revert SelfTrade();
        if (nonceUsed[order.maker][order.nonce]) revert NonceAlreadyUsed();

        // The fee both parties agreed to is baked into the signed order, so the
        // owner can never change the fee on an order after it is signed. We only
        // enforce that it stays within the protocol's hard caps.
        if (order.feeBps > MAX_FEE_BPS) revert FeeTooHigh();
        if (order.flatFee > MAX_FLAT_SWAP_FEE) revert FlatFeeTooHigh();

        bytes32 orderHash = hashOrder(order);
        address signer = ECDSA.recover(orderHash, signature);
        if (signer != order.maker) revert InvalidSignature();

        // Fees: order.feeBps on each MON leg; flat fee when no MON moves at all.
        uint256 makerLegFee = (order.makerMonAmount * order.feeBps) / BPS_DENOMINATOR;
        uint256 takerLegFee = (order.takerMonAmount * order.feeBps) / BPS_DENOMINATOR;
        uint256 flatFee = (order.makerMonAmount == 0 && order.takerMonAmount == 0) ? order.flatFee : 0;
        uint256 totalFee = makerLegFee + takerLegFee + flatFee;

        // Taker funds their MON leg + taker-side fee + flat fee in msg.value.
        if (msg.value != order.takerMonAmount + takerLegFee + flatFee) revert IncorrectPayment();

        // Maker funds their MON leg + maker-side fee from escrow.
        uint256 makerCost = order.makerMonAmount + makerLegFee;
        if (escrowBalance[order.maker] < makerCost) revert InsufficientEscrow();

        _verifyNFTs(order.makerNFTs, order.maker);
        _verifyNFTs(order.takerNFTs, msg.sender);

        // ----- Effects -----
        nonceUsed[order.maker][order.nonce] = true;
        escrowBalance[order.maker] -= makerCost;
        // Fees accrue to the recipient's pull-payment balance instead of being
        // pushed here, so a reverting fee recipient can never brick a trade.
        if (totalFee > 0) pendingFees[feeRecipient] += totalFee;

        // ----- Interactions -----
        _transferNFTs(order.makerNFTs, order.maker, msg.sender);
        _transferNFTs(order.takerNFTs, msg.sender, order.maker);

        if (order.takerMonAmount > 0) _sendNative(order.maker, order.takerMonAmount);
        if (order.makerMonAmount > 0) _sendNative(msg.sender, order.makerMonAmount);

        emit TradeExecuted(
            orderHash,
            order.maker,
            msg.sender,
            order.makerMonAmount,
            order.takerMonAmount,
            totalFee
        );
    }

    /// @notice Cancel an order nonce. Idempotent-safe: reverts if already used.
    function cancelNonce(uint256 nonce) external {
        if (nonceUsed[msg.sender][nonce]) revert NonceAlreadyUsed();
        nonceUsed[msg.sender][nonce] = true;
        emit TradeCancelled(msg.sender, nonce);
    }

    /// @notice Cancel multiple nonces at once.
    function cancelNonces(uint256[] calldata nonces) external {
        for (uint256 i = 0; i < nonces.length; i++) {
            if (nonceUsed[msg.sender][nonces[i]]) revert NonceAlreadyUsed();
            nonceUsed[msg.sender][nonces[i]] = true;
            emit TradeCancelled(msg.sender, nonces[i]);
        }
    }

    // ---------------------------------------------------------------------
    // Views
    // ---------------------------------------------------------------------

    function hashOrder(TradeOrder calldata order) public view returns (bytes32) {
        return _hashTypedDataV4(
            keccak256(
                abi.encode(
                    TRADE_ORDER_TYPEHASH,
                    order.maker,
                    order.taker,
                    _hashNFTItems(order.makerNFTs),
                    _hashNFTItems(order.takerNFTs),
                    order.makerMonAmount,
                    order.takerMonAmount,
                    order.feeBps,
                    order.flatFee,
                    order.nonce,
                    order.expiry
                )
            )
        );
    }

    function domainSeparator() external view returns (bytes32) {
        return _domainSeparatorV4();
    }

    /// @notice Quote the protocol fee for a prospective trade.
    function quoteFees(uint256 makerMonAmount, uint256 takerMonAmount)
        external
        view
        returns (uint256 makerLegFee, uint256 takerLegFee, uint256 flatFee)
    {
        makerLegFee = (makerMonAmount * feeBps) / BPS_DENOMINATOR;
        takerLegFee = (takerMonAmount * feeBps) / BPS_DENOMINATOR;
        flatFee = (makerMonAmount == 0 && takerMonAmount == 0) ? flatSwapFee : 0;
    }

    // ---------------------------------------------------------------------
    // Admin (fee configuration only — never user assets)
    // ---------------------------------------------------------------------

    function setFeeRecipient(address newRecipient) external onlyOwner {
        if (newRecipient == address(0)) revert ZeroAddress();
        emit FeeRecipientUpdated(feeRecipient, newRecipient);
        feeRecipient = newRecipient;
    }

    function setFeeBps(uint256 newFeeBps) external onlyOwner {
        if (newFeeBps > MAX_FEE_BPS) revert FeeTooHigh();
        emit FeeBpsUpdated(feeBps, newFeeBps);
        feeBps = newFeeBps;
    }

    function setFlatSwapFee(uint256 newFlatFee) external onlyOwner {
        if (newFlatFee > MAX_FLAT_SWAP_FEE) revert FlatFeeTooHigh();
        emit FlatSwapFeeUpdated(flatSwapFee, newFlatFee);
        flatSwapFee = newFlatFee;
    }

    /// @notice Emergency stop for new settlements. Escrow withdrawal, fee
    ///         withdrawal, and nonce cancellation stay available while paused
    ///         so users can always exit.
    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    // ---------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------

    function _hashNFTItems(NFTItem[] calldata items) internal pure returns (bytes32) {
        bytes32[] memory hashes = new bytes32[](items.length);
        for (uint256 i = 0; i < items.length; i++) {
            hashes[i] = keccak256(
                abi.encode(NFT_ITEM_TYPEHASH, items[i].contractAddress, items[i].tokenId)
            );
        }
        return keccak256(abi.encodePacked(hashes));
    }

    function _verifyNFTs(NFTItem[] calldata items, address expectedOwner) internal view {
        for (uint256 i = 0; i < items.length; i++) {
            IERC721 nft = IERC721(items[i].contractAddress);
            if (nft.ownerOf(items[i].tokenId) != expectedOwner) {
                revert NotTokenOwner(items[i].contractAddress, items[i].tokenId, expectedOwner);
            }
            if (
                nft.getApproved(items[i].tokenId) != address(this)
                    && !nft.isApprovedForAll(expectedOwner, address(this))
            ) {
                revert MissingApproval(items[i].contractAddress, items[i].tokenId, expectedOwner);
            }
        }
    }

    function _transferNFTs(NFTItem[] calldata items, address from, address to) internal {
        for (uint256 i = 0; i < items.length; i++) {
            IERC721(items[i].contractAddress).safeTransferFrom(from, to, items[i].tokenId);
        }
    }

    function _sendNative(address to, uint256 amount) internal {
        (bool success,) = payable(to).call{value: amount}("");
        if (!success) revert NativeTransferFailed(to, amount);
    }
}
