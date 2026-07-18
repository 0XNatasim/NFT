import { publicClient } from "@/lib/chains/client";
import { erc721Abi } from "@/lib/contracts/settlement";
import { safeFetchJson } from "@/lib/nft/safe-fetch";

/**
 * Indexer-independent token metadata straight from the contract:
 * tokenURI() -> metadata JSON -> resolved image URL. Cached per token.
 */

const DEFAULT_IPFS_GATEWAYS = [
  // Dedicated Pinata gateway first (not rate-limited); public gateways as
  // fallback. Override with the IPFS_GATEWAYS env var.
  "https://scarlet-worthy-minnow-552.mypinata.cloud/ipfs/",
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
];
const ARWEAVE_GATEWAY = process.env.ARWEAVE_GATEWAY ?? "https://arweave.net/";
const MAX_CACHE_ENTRIES = 5000;

function withTrailingSlash(url: string): string {
  return url.endsWith("/") ? url : `${url}/`;
}

/**
 * Configured IPFS gateways, in priority order. Supports a comma-separated
 * IPFS_GATEWAYS list (preferred) and the legacy single IPFS_GATEWAY, falling
 * back to a public default set so a single dead gateway can't block metadata.
 */
export function ipfsGateways(): string[] {
  const configured = (process.env.IPFS_GATEWAYS ?? process.env.IPFS_GATEWAY ?? "")
    .split(",")
    .map((g) => g.trim())
    .filter(Boolean)
    .map(withTrailingSlash);
  const list = configured.length > 0 ? configured : DEFAULT_IPFS_GATEWAYS;
  return Array.from(new Set(list));
}

/** ipfs://CID/path and ipfs://ipfs/CID/path → the CID-relative path. */
function ipfsPath(uri: string): string | null {
  if (!uri.startsWith("ipfs://")) return null;
  return uri.slice("ipfs://".length).replace(/^ipfs\//, "");
}

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

/**
 * All resolvable https URLs for a URI, in fetch-priority order. ipfs:// and
 * ar:// expand to gateway URLs (ipfs to every configured gateway for
 * fallback); already-valid http(s)/data URIs pass through unchanged.
 */
export function resolveUriCandidates(uri: string): string[] {
  if (!uri) return [];
  const path = ipfsPath(uri);
  if (path) return ipfsGateways().map((gateway) => `${gateway}${path}`);
  if (uri.startsWith("ar://")) {
    return [`${withTrailingSlash(ARWEAVE_GATEWAY)}${uri.slice("ar://".length)}`];
  }
  // https://…, data:application/json;…, data:image/… — never rewrite.
  return [uri];
}

/** Primary resolved URL for a URI (first candidate). */
export function resolveUri(uri: string): string {
  return resolveUriCandidates(uri)[0] ?? uri;
}

function decodeDataJson(uri: string): any | null {
  const comma = uri.indexOf(",");
  if (comma < 0) return null;
  const meta = uri.slice(0, comma);
  const payload = uri.slice(comma + 1);
  try {
    if (meta.includes(";base64")) {
      return JSON.parse(Buffer.from(payload, "base64").toString("utf8"));
    }
    // data:application/json;utf8,{…} or data:application/json,{…}
    return JSON.parse(decodeURIComponent(payload));
  } catch {
    try {
      // Some encoders don't percent-encode the payload.
      return JSON.parse(payload);
    } catch {
      return null;
    }
  }
}

async function loadMetadataJson(uri: string): Promise<any | null> {
  if (uri.startsWith("data:application/json")) return decodeDataJson(uri);
  // http(s)/ipfs/arweave URIs from untrusted contracts: SSRF- and
  // size-guarded. Try each gateway candidate until one yields JSON so a
  // single dead gateway doesn't block resolution.
  for (const candidate of resolveUriCandidates(uri)) {
    const json = await safeFetchJson(candidate);
    if (json) return json;
  }
  return null;
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
      // Malformed collections (e.g. Erebus) put the same .mp4 in both `image`
      // and `animation_url`. Keep it as the animation only so it never lands
      // in an <img>/next/image; the media layer renders it as <video>.
      if (image && animationUrl && image === animationUrl) {
        image = null;
      }
    }
  }

  const result: OnChainTokenMeta = { name, image, animationUrl, collectionName, metadata };
  cacheSet(key, result);
  return result;
}
