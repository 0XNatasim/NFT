import { publicClient } from "@/lib/chains/client";
import { erc721Abi } from "@/lib/contracts/settlement";

/**
 * Indexer-independent token metadata straight from the contract:
 * tokenURI() -> metadata JSON -> resolved image URL. Cached per token.
 */

const IPFS_GATEWAY = process.env.IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";

export interface OnChainTokenMeta {
  name: string | null;
  image: string | null;
  collectionName: string | null;
}

const cache = new Map<string, OnChainTokenMeta>();

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
  try {
    const res = await fetch(resolveUri(uri), {
      signal: AbortSignal.timeout(8000),
      headers: { accept: "application/json" },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
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
  if (uriResult.status === "fulfilled" && uriResult.value) {
    const meta = await loadMetadataJson(uriResult.value);
    if (meta) {
      name = typeof meta.name === "string" ? meta.name : null;
      const rawImage =
        meta.image ?? meta.image_url ?? meta.imageUrl ?? meta.image_data ?? null;
      image = typeof rawImage === "string" ? resolveUri(rawImage) : null;
    }
  }

  const result: OnChainTokenMeta = { name, image, collectionName };
  cache.set(key, result);
  return result;
}
