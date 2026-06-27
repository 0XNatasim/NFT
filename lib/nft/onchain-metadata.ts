import { publicClient } from "@/lib/chains/client";
import { erc721Abi } from "@/lib/contracts/settlement";
import { safeFetchJson } from "@/lib/nft/safe-fetch";

/**
 * Indexer-independent token metadata straight from the contract:
 * tokenURI() -> metadata JSON -> resolved image URL. Cached per token.
 */

const IPFS_GATEWAY = process.env.IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";
const MAX_CACHE_ENTRIES = 5000;

export interface OnChainTokenMeta {
  name: string | null;
  image: string | null;
  animationUrl: string | null;
  collectionName: string | null;
  metadata: Record<string, unknown> | null;
}

// Bounded LRU-ish cache: oldest insertion evicted when over capacity.
const cache = new Map<string, OnChainTokenMeta>();

function cacheSet(key: string, value: OnChainTokenMeta) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, value);
}

export function resolveUri(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return IPFS_GATEWAY + uri.replace("ipfs://", "").replace(/^ipfs\//, "");
  }
  return uri;
}

async function loadMetadataJson(uri: string): Promise<any | null> {
  if (uri.startsWith("data:application/json;base64,")) {
    try {
      return JSON.parse(Buffer.from(uri.split(",")[1], "base64").toString("utf8"));
    } catch {
      return null;
    }
  }
  if (uri.startsWith("data:application/json,")) {
    try {
      return JSON.parse(decodeURIComponent(uri.split(",").slice(1).join(",")));
    } catch {
      return null;
    }
  }
  // http(s)/ipfs URIs from untrusted contracts: SSRF- and size-guarded.
  return safeFetchJson(resolveUri(uri));
}

export async function getOnChainTokenMeta(
  contract: string,
  tokenId: string
): Promise<OnChainTokenMeta> {
  const key = `${contract.toLowerCase()}:${tokenId}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const [uriResult, nameResult] = await Promise.allSettled([
    publicClient.readContract({
      address: contract as `0x${string}`,
      abi: erc721Abi,
      functionName: "tokenURI",
      args: [BigInt(tokenId)],
    }),
    publicClient.readContract({
      address: contract as `0x${string}`,
      abi: erc721Abi,
      functionName: "name",
    }),
  ]);

  const collectionName =
    nameResult.status === "fulfilled" ? nameResult.value : null;

  let name: string | null = null;
  let image: string | null = null;
  let animationUrl: string | null = null;
  let metadata: Record<string, unknown> | null = null;
  if (uriResult.status === "fulfilled" && uriResult.value) {
    const meta = await loadMetadataJson(uriResult.value);
    if (meta) {
      metadata = typeof meta === "object" && !Array.isArray(meta) ? meta : null;
      name = typeof meta.name === "string" ? meta.name : null;
      const rawImage =
        meta.image ?? meta.image_url ?? meta.imageUrl ?? meta.image_data ?? null;
      const rawAnimation = meta.animation_url ?? meta.animationUrl ?? null;
      image = typeof rawImage === "string" ? resolveUri(rawImage) : null;
      animationUrl = typeof rawAnimation === "string" ? resolveUri(rawAnimation) : null;
    }
  }

  const result: OnChainTokenMeta = { name, image, animationUrl, collectionName, metadata };
  cacheSet(key, result);
  return result;
}
