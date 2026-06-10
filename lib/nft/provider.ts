import type { NFTAsset } from "@/lib/types";

/**
 * NFT indexing abstraction. The rest of the codebase only depends on this
 * interface — swap providers via the NFT_PROVIDER env var.
 */

export interface CollectionInfo {
  contractAddress: string;
  name: string | null;
  imageUrl: string | null;
  totalSupply: string | null;
  description: string | null;
}

export interface WalletNFTsResult {
  nfts: NFTAsset[];
  pageKey: string | null;
}

export interface NFTProvider {
  readonly name: string;
  getWalletNFTs(
    owner: string,
    options?: { pageKey?: string | null; pageSize?: number }
  ): Promise<WalletNFTsResult>;
  getCollection(contractAddress: string): Promise<CollectionInfo | null>;
  getToken(contractAddress: string, tokenId: string): Promise<NFTAsset | null>;
  searchCollection(query: string): Promise<CollectionInfo[]>;
}
