import type { NFTAsset } from "@/lib/types";

export const COLLECTION_BID_TOKEN_ID =
  "115792089237316195423570985008687907853269984665640564039457584007913129639935";

export function isCollectionBid(nft: Pick<NFTAsset, "tokenId" | "metadata">) {
  return (
    nft.tokenId === COLLECTION_BID_TOKEN_ID ||
    (typeof nft.metadata === "object" &&
      nft.metadata !== null &&
      "collectionBid" in nft.metadata)
  );
}