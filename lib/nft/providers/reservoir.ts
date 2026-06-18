import type { NFTAsset } from "@/lib/types";
import type {
  CollectionInfo,
  NFTProvider,
  WalletNFTsResult,
} from "@/lib/nft/provider";

const RESERVOIR_BASE_URL =
  process.env.RESERVOIR_BASE_URL ?? "https://api-monad.reservoir.tools";

async function fetchJson(path: string): Promise<any> {
  const key = process.env.RESERVOIR_API_KEY;
  if (!key) throw new Error("RESERVOIR_API_KEY is not set");
  const res = await fetch(`${RESERVOIR_BASE_URL}${path}`, {
    headers: { accept: "application/json", "x-api-key": key },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`Reservoir request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function toAsset(raw: any): NFTAsset {
  const token = raw.token ?? raw;
  return {
    contractAddress: (token.contract ?? "").toLowerCase(),
    tokenId: String(token.tokenId ?? ""),
    tokenStandard: "ERC721",
    name: token.name ?? null,
    collectionName: token.collection?.name ?? null,
    imageUrl: token.image ?? token.imageSmall ?? null,
    metadata: token.attributes ? { attributes: token.attributes } : null,
  };
}

export const reservoirProvider: NFTProvider = {
  name: "reservoir",

  async getWalletNFTs(owner, options): Promise<WalletNFTsResult> {
    const params = new URLSearchParams({ limit: String(options?.pageSize ?? 50) });
    if (options?.pageKey) params.set("continuation", options.pageKey);
    const data = await fetchJson(`/users/${owner}/tokens/v10?${params}`);
    const nfts: NFTAsset[] = (data.tokens ?? [])
      .filter((t: any) => (t.token?.kind ?? "erc721") === "erc721")
      .map(toAsset);
    return { nfts, pageKey: data.continuation ?? null };
  },

  async getCollection(contractAddress): Promise<CollectionInfo | null> {
    try {
      const data = await fetchJson(`/collections/v7?id=${contractAddress}`);
      const c = data.collections?.[0];
      if (!c) return null;
      return {
        contractAddress: contractAddress.toLowerCase(),
        name: c.name ?? null,
        imageUrl: c.image ?? null,
        totalSupply: c.tokenCount ?? null,
        description: c.description ?? null,
      };
    } catch {
      return null;
    }
  },

  async getToken(contractAddress, tokenId): Promise<NFTAsset | null> {
    try {
      const data = await fetchJson(
        `/tokens/v7?tokens=${contractAddress}:${tokenId}`
      );
      const t = data.tokens?.[0];
      return t ? toAsset(t) : null;
    } catch {
      return null;
    }
  },

  async searchCollection(query): Promise<CollectionInfo[]> {
    try {
      const data = await fetchJson(
        `/collections/v7?name=${encodeURIComponent(query)}&limit=10`
      );
      return (data.collections ?? []).map((c: any) => ({
        contractAddress: (c.id ?? "").toLowerCase(),
        name: c.name ?? null,
        imageUrl: c.image ?? null,
        totalSupply: c.tokenCount ?? null,
        description: c.description ?? null,
      }));
    } catch {
      return [];
    }
  },
};
