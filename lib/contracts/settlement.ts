/** ABI of MonadMarketSettlement — keep in sync with the Solidity source. */
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
] as const;

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
] as const;
