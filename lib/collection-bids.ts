import type { NFTAsset } from "@/lib/types";

/** Sentinel token ID used for off-chain collection-wide buy offers. */
export const COLLECTION_BID_TOKEN_ID =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export function isCollectionBid(nft: Pick<NFTAsset, "tokenId" | "metadata">): boolean {
  return nft.tokenId === COLLECTION_BID_TOKEN_ID || nft.metadata?.collectionBid === true;
}
