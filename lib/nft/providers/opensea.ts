import type { NFTAsset } from "@/lib/types";
import type {
  CollectionInfo,
  CollectionPrice,
  NFTProvider,
  WalletNFTsResult,
} from "@/lib/nft/provider";

/**
 * OpenSea API v2 provider. OpenSea indexes Monad mainnet natively.
 * Chain slug configurable via OPENSEA_CHAIN (default "monad").
 */

const OPENSEA_BASE_URL =
  process.env.OPENSEA_BASE_URL ?? "https://api.opensea.io/api/v2";
const OPENSEA_CHAIN = process.env.OPENSEA_CHAIN ?? "monad";

async function fetchJson(path: string): Promise<any> {
  const key = process.env.OPENSEA_API_KEY;
  if (!key) throw new Error("OPENSEA_API_KEY is not set");
  const res = await fetch(`${OPENSEA_BASE_URL}${path}`, {
    headers: { accept: "application/json", "x-api-key": key },
    next: { revalidate: 30 },
  });
  if (!res.ok) {
    throw new Error(`OpenSea request failed: ${res.status} ${await res.text()}`);
  }
  return res.json();
}

function toAsset(raw: any): NFTAsset {
  return {
    contractAddress: (raw.contract ?? "").toLowerCase(),
    tokenId: String(raw.identifier ?? ""),
    tokenStandard: "ERC721",
    name: raw.name ?? null,
    collectionName: raw.collection ?? null,
    imageUrl: raw.display_image_url ?? raw.image_url ?? null,
    metadata: null,
    rarityRank: typeof raw.rarity?.rank === "number" ? raw.rarity.rank : null,
  };
}

export const openseaProvider: NFTProvider = {
  name: "opensea",

  async getWalletNFTs(owner, options): Promise<WalletNFTsResult> {
    const params = new URLSearchParams({
      limit: String(Math.min(options?.pageSize ?? 50, 200)),
    });
    if (options?.pageKey) params.set("next", options.pageKey);
    const data = await fetchJson(
      `/chain/${OPENSEA_CHAIN}/account/${owner}/nfts?${params}`
    );
    const nfts: NFTAsset[] = (data.nfts ?? [])
      .filter(
        (n: any) => (n.token_standard ?? "erc721").toLowerCase() !== "erc1155"
      )
      .map(toAsset);
    return { nfts, pageKey: data.next ?? null };
  },

  async getCollection(contractAddress): Promise<CollectionInfo | null> {
    try {
      const contract = await fetchJson(
        `/chain/${OPENSEA_CHAIN}/contract/${contractAddress}`
      );
      let name: string | null = contract.name ?? null;
      let imageUrl: string | null = null;
      let description: string | null = null;
      if (contract.collection) {
        try {
          const col = await fetchJson(`/collections/${contract.collection}`);
          name = col.name ?? name;
          imageUrl = col.image_url ?? null;
          description = col.description ?? null;
        } catch {
          // collection detail is optional
        }
      }
      return {
        contractAddress: contractAddress.toLowerCase(),
        name,
        imageUrl,
        totalSupply: contract.supply ? String(contract.supply) : null,
        description,
      };
    } catch {
      return null;
    }
  },

  async getToken(contractAddress, tokenId): Promise<NFTAsset | null> {
    try {
      const data = await fetchJson(
        `/chain/${OPENSEA_CHAIN}/contract/${contractAddress}/nfts/${tokenId}`
      );
      return data.nft ? toAsset(data.nft) : null;
    } catch {
      return null;
    }
  },

  async getCollectionPrice(contractAddress): Promise<CollectionPrice | null> {
    try {
      // Resolve the collection slug, then read its live stats.
      const contract = await fetchJson(
        `/chain/${OPENSEA_CHAIN}/contract/${contractAddress}`
      );
      const slug = contract.collection;
      if (!slug) return null;
      const stats = await fetchJson(`/collections/${slug}/stats`);
      const floor = stats.total?.floor_price ?? null;
      const currency = stats.total?.floor_price_symbol ?? "MON";
      return {
        contractAddress: contractAddress.toLowerCase(),
        floorPrice: typeof floor === "number" ? floor : null,
        topOffer: null, // OpenSea best-offer needs a separate paid lookup
        currency,
      };
    } catch {
      return null;
    }
  },

  async searchCollection(query): Promise<CollectionInfo[]> {
    try {
      const data = await fetchJson(
        `/collections?chain=${OPENSEA_CHAIN}&limit=10&order_by=market_cap`
      );
      const q = query.toLowerCase();
      return (data.collections ?? [])
        .filter((c: any) => (c.name ?? "").toLowerCase().includes(q))
        .map((c: any) => ({
          contractAddress: (c.contracts?.[0]?.address ?? "").toLowerCase(),
          name: c.name ?? null,
          imageUrl: c.image_url ?? null,
          totalSupply: null,
          description: c.description ?? null,
        }));
    } catch {
      return [];
    }
  },
};
