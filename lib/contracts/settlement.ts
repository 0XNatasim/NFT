/** ABI of Handshake — keep in sync with the Solidity source. */
export const settlementAbi = [
  {
    type: "function",
    name: "fulfillTrade",
    stateMutability: "payable",
    inputs: [
      {
        name: "order",
        type: "tuple",
        components: [
          { name: "maker", type: "address" },
          { name: "taker", type: "address" },
          {
            name: "makerNFTs",
            type: "tuple[]",
            components: [
              { name: "contractAddress", type: "address" },
              { name: "tokenId", type: "uint256" },
            ],
          },
          {
            name: "takerNFTs",
            type: "tuple[]",
            components: [
              { name: "contractAddress", type: "address" },
              { name: "tokenId", type: "uint256" },
            ],
          },
          { name: "makerMonAmount", type: "uint256" },
          { name: "takerMonAmount", type: "uint256" },
          { name: "feeBps", type: "uint256" },
          { name: "flatFee", type: "uint256" },
          { name: "nonce", type: "uint256" },
          { name: "expiry", type: "uint256" },
        ],
      },
      { name: "signature", type: "bytes" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "cancelNonce",
    stateMutability: "nonpayable",
    inputs: [{ name: "nonce", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "deposit",
    stateMutability: "payable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "withdraw",
    stateMutability: "nonpayable",
    inputs: [{ name: "amount", type: "uint256" }],
    outputs: [],
  },
  {
    type: "function",
    name: "escrowBalance",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "nonceUsed",
    stateMutability: "view",
    inputs: [
      { name: "", type: "address" },
      { name: "", type: "uint256" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "feeBps",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "flatSwapFee",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "pendingFees",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "withdrawFees",
    stateMutability: "nonpayable",
    inputs: [],
    outputs: [],
  },
  {
    type: "function",
    name: "quoteFees",
    stateMutability: "view",
    inputs: [
      { name: "makerMonAmount", type: "uint256" },
      { name: "takerMonAmount", type: "uint256" },
    ],
    outputs: [
      { name: "makerLegFee", type: "uint256" },
      { name: "takerLegFee", type: "uint256" },
      { name: "flatFee", type: "uint256" },
    ],
  },
  {
    type: "function",
    name: "isCollectionAllowed",
    stateMutability: "view",
    inputs: [{ name: "c", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "collectionAllowedAt",
    stateMutability: "view",
    inputs: [{ name: "", type: "address" }],
    outputs: [{ name: "", type: "uint256" }],
  },
  {
    type: "function",
    name: "paused",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "event",
    name: "TradeExecuted",
    inputs: [
      { name: "orderHash", type: "bytes32", indexed: true },
      { name: "maker", type: "address", indexed: true },
      { name: "taker", type: "address", indexed: true },
      { name: "makerMonAmount", type: "uint256", indexed: false },
      { name: "takerMonAmount", type: "uint256", indexed: false },
      { name: "protocolFee", type: "uint256", indexed: false },
    ],
  },
  {
    type: "event",
    name: "TradeCancelled",
    inputs: [
      { name: "maker", type: "address", indexed: true },
      { name: "nonce", type: "uint256", indexed: true },
    ],
  },
  { type: "error", name: "InvalidSignature", inputs: [] },
  { type: "error", name: "EnforcedPause", inputs: [] },
  { type: "error", name: "FeeTooHigh", inputs: [] },
  { type: "error", name: "FlatFeeTooHigh", inputs: [] },
  { type: "error", name: "OrderExpired", inputs: [] },
  { type: "error", name: "NonceAlreadyUsed", inputs: [] },
  { type: "error", name: "NotAuthorizedTaker", inputs: [] },
  { type: "error", name: "SelfTrade", inputs: [] },
  { type: "error", name: "EmptyOrder", inputs: [] },
  { type: "error", name: "TooManyItems", inputs: [] },
  { type: "error", name: "IncorrectPayment", inputs: [] },
  { type: "error", name: "InsufficientEscrow", inputs: [] },
  {
    type: "error",
    name: "NotTokenOwner",
    inputs: [
      { name: "nft", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "expectedOwner", type: "address" },
    ],
  },
  {
    type: "error",
    name: "MissingApproval",
    inputs: [
      { name: "nft", type: "address" },
      { name: "tokenId", type: "uint256" },
      { name: "owner", type: "address" },
    ],
  },
  {
    type: "error",
    name: "NativeTransferFailed",
    inputs: [
      { name: "to", type: "address" },
      { name: "amount", type: "uint256" },
    ],
  },
  {
    type: "error",
    name: "CollectionNotAllowed",
    inputs: [{ name: "collection", type: "address" }],
  },
  {
    type: "error",
    name: "AlreadyAllowed",
    inputs: [{ name: "collection", type: "address" }],
  },
] as const;

/** Human-readable explanations for settlement revert reasons. */
export const settlementErrorMessages: Record<string, string> = {
  InvalidSignature: "The order signature is invalid.",
  EnforcedPause: "Trading is temporarily paused.",
  FeeTooHigh: "The order's protocol fee exceeds the allowed maximum.",
  FlatFeeTooHigh: "The order's flat swap fee exceeds the allowed maximum.",
  OrderExpired: "This offer has expired.",
  NonceAlreadyUsed: "This offer was already filled or cancelled on-chain.",
  NotAuthorizedTaker: "This offer is reserved for a different wallet.",
  SelfTrade: "You can't accept your own offer.",
  IncorrectPayment: "Payment amount doesn't match the required total.",
  InsufficientEscrow:
    "The maker hasn't deposited enough MON escrow to fund their side yet.",
  NotTokenOwner: "One of the NFTs is no longer owned by the expected wallet.",
  CollectionNotAllowed:
    "One of the collections in this trade isn't approved for trading on Handshake yet.",
  MissingApproval:
    "The maker hasn't approved the settlement contract for one of their NFTs yet. Ask them to open the offer and approve.",
  NativeTransferFailed: "A MON transfer failed.",
};

export const erc721Abi = [
  {
    type: "function",
    name: "isApprovedForAll",
    stateMutability: "view",
    inputs: [
      { name: "owner", type: "address" },
      { name: "operator", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    type: "function",
    name: "setApprovalForAll",
    stateMutability: "nonpayable",
    inputs: [
      { name: "operator", type: "address" },
      { name: "approved", type: "bool" },
    ],
    outputs: [],
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "getApproved",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }],
  },
  {
    type: "function",
    name: "name",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "string" }],
  },
] as const;

/**
 * Return the subset of `collections` that the settlement contract will reject
 * as not tradable (not allowlisted, or still inside the ADD_DELAY timelock).
 *
 * Fail-open by design: the on-chain `_verifyNFTs` check is the real security
 * boundary. This is a UX guard that spares a maker from signing an order that
 * would revert with CollectionNotAllowed at fill time. If the settlement
 * contract predates the allowlist (no `isCollectionAllowed` function) or a read
 * fails for any reason, the collection is treated as allowed so we never block
 * legitimate order creation on an inconclusive check.
 */
export async function findDisallowedCollections(
  publicClient: PublicClientLike,
  settlementAddress: `0x${string}`,
  collections: string[],
): Promise<string[]> {
  const unique = Array.from(
    new Set(collections.map((c) => c.toLowerCase())),
  ) as `0x${string}`[];

  const checks = await Promise.all(
    unique.map(async (collection) => {
      try {
        const allowed = (await publicClient.readContract({
          address: settlementAddress,
          abi: settlementAbi,
          functionName: "isCollectionAllowed",
          args: [collection],
        })) as boolean;
        return { collection, allowed };
      } catch {
        return { collection, allowed: true }; // fail open (see above)
      }
    }),
  );

  return checks.filter((c) => !c.allowed).map((c) => c.collection);
}

/** Minimal shape of a viem public client used by findDisallowedCollections. */
type PublicClientLike = {
  readContract: (args: {
    address: `0x${string}`;
    abi: typeof settlementAbi;
    functionName: "isCollectionAllowed";
    args: readonly [`0x${string}`];
  }) => Promise<unknown>;
};
