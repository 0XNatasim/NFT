import {
  type Address,
  type Hex,
  type TypedDataDomain,
  hashTypedData,
  verifyTypedData,
} from "viem";
import { MONAD_CHAIN_ID, SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";

/**
 * EIP-712 order model. Must stay byte-compatible with
 * contracts/src/MonadMarketSettlement.sol.
 */

export const ORDER_TYPES = {
  TradeOrder: [
    { name: "maker", type: "address" },
    { name: "taker", type: "address" },
    { name: "makerNFTs", type: "NFTItem[]" },
    { name: "takerNFTs", type: "NFTItem[]" },
    { name: "makerMonAmount", type: "uint256" },
    { name: "takerMonAmount", type: "uint256" },
    { name: "feeBps", type: "uint256" },
    { name: "flatFee", type: "uint256" },
    { name: "nonce", type: "uint256" },
    { name: "expiry", type: "uint256" },
  ],
  NFTItem: [
    { name: "contractAddress", type: "address" },
    { name: "tokenId", type: "uint256" },
  ],
} as const;

export interface NFTItem {
  contractAddress: Address;
  tokenId: bigint;
}

export interface TradeOrder {
  maker: Address;
  taker: Address;
  makerNFTs: NFTItem[];
  takerNFTs: NFTItem[];
  makerMonAmount: bigint;
  takerMonAmount: bigint;
  feeBps: bigint;
  flatFee: bigint;
  nonce: bigint;
  expiry: bigint;
}

export const ZERO_ADDRESS =
  "0x0000000000000000000000000000000000000000" as Address;

export function getOrderDomain(
  chainId: number = MONAD_CHAIN_ID,
  verifyingContract: Address = SETTLEMENT_CONTRACT_ADDRESS
): TypedDataDomain {
  return {
    name: "MonadMarket",
    version: "1",
    chainId,
    verifyingContract,
  };
}

export function hashOrder(
  order: TradeOrder,
  chainId?: number,
  verifyingContract?: Address
): Hex {
  return hashTypedData({
    domain: getOrderDomain(chainId, verifyingContract),
    types: ORDER_TYPES,
    primaryType: "TradeOrder",
    message: order,
  });
}

export async function verifyOrderSignature(
  order: TradeOrder,
  signature: Hex,
  chainId?: number,
  verifyingContract?: Address
): Promise<boolean> {
  try {
    return await verifyTypedData({
      address: order.maker,
      domain: getOrderDomain(chainId, verifyingContract),
      types: ORDER_TYPES,
      primaryType: "TradeOrder",
      message: order,
      signature,
    });
  } catch {
    return false;
  }
}

/** Random 256-bit nonce; avoids cross-device nonce coordination. */
export function generateNonce(): bigint {
  const bytes =
    typeof crypto !== "undefined"
      ? crypto.getRandomValues(new Uint8Array(32))
      : new Uint8Array(32).map(() => Math.floor(Math.random() * 256));
  let value = 0n;
  for (const b of bytes) value = (value << 8n) | BigInt(b);
  return value;
}
