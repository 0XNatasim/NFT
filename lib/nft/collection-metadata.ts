import { publicClient } from "@/lib/chains/client";
import { erc721Abi } from "@/lib/contracts/settlement";
import { safeFetchJson } from "@/lib/nft/safe-fetch";
import { resolveUri } from "@/lib/nft/onchain-metadata";

export const COLLECTION_PLACEHOLDER_IMAGE = "/Logomark.png";

export interface CollectionMetadata {
  name: string | null;
  image: string;
  banner: string | null;
  floorPrice: number | null;
  collectionAddress: string;
  source: "reservoir" | "opensea" | "contractURI" | "tokenURI" | "placeholder";
}

const TTL_MS = 10 * 60_000;
const MAX_CACHE_ENTRIES = 1000;
const cache = new Map<string, { at: number; value: CollectionMetadata }>();

function cacheSet(key: string, value: CollectionMetadata) {
  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(key, { at: Date.now(), value });
}

function metadata(address: string, source: CollectionMetadata["source"], data: Partial<CollectionMetadata>): CollectionMetadata {
  return {
    name: data.name ?? null,
    image: data.image || COLLECTION_PLACEHOLDER_IMAGE,
    banner: data.banner ?? null,
    floorPrice: data.floorPrice ?? null,
    collectionAddress: address.toLowerCase(),
    source,
  };
}

function reservoirBase(chainId: number) {
  return (
    process.env[`RESERVOIR_API_BASE_${chainId}`] ??
    process.env.RESERVOIR_API_BASE_URL ??
    "https://api.reservoir.tools"
  ).replace(/\/$/, "");
}

async function fromReservoir(address: string, chainId: number): Promise<CollectionMetadata | null> {
  const headers: HeadersInit = { accept: "application/json" };
  if (process.env.RESERVOIR_API_KEY) headers["x-api-key"] = process.env.RESERVOIR_API_KEY;
  const res = await fetch(`${reservoirBase(chainId)}/collections/v7?id=${address}`, { headers, next: { revalidate: 600 } });
  if (!res.ok) return null;
  const json = await res.json();
  const c = Array.isArray(json.collections) ? json.collections[0] : null;
  if (!c) return null;
  return metadata(address, "reservoir", {
    name: typeof c.name === "string" ? c.name : undefined,
    image: c.image ?? c.imageUrl ?? c.metadata?.imageUrl ?? null,
    banner: c.banner ?? c.bannerImageUrl ?? null,
    floorPrice: typeof c.floorAsk?.price?.amount?.decimal === "number" ? c.floorAsk.price.amount.decimal : undefined,
  });
}

async function fromOpenSea(address: string): Promise<CollectionMetadata | null> {
  if (!process.env.OPENSEA_API_KEY) return null;
  const res = await fetch(`https://api.opensea.io/api/v2/chain/${process.env.OPENSEA_CHAIN ?? "monad"}/contract/${address}`, {
    headers: { accept: "application/json", "x-api-key": process.env.OPENSEA_API_KEY },
    next: { revalidate: 600 },
  });
  if (!res.ok) return null;
  const contract = await res.json();
  const slug = contract.collection;
  if (!slug) return null;
  const col = await fetch(`https://api.opensea.io/api/v2/collections/${slug}`, {
    headers: { accept: "application/json", "x-api-key": process.env.OPENSEA_API_KEY },
    next: { revalidate: 600 },
  });
  if (!col.ok) return null;
  const c = await col.json();
  return metadata(address, "opensea", { name: c.name ?? slug, image: c.image_url ?? null, banner: c.banner_image_url ?? null });
}

const erc721CollectionAbi = [
  ...erc721Abi,
  { type: "function", name: "contractURI", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "string" }] },
] as const;

async function fromContractURI(address: string): Promise<CollectionMetadata | null> {
  const [uriResult, nameResult] = await Promise.allSettled([
    publicClient.readContract({ address: address as `0x${string}`, abi: erc721CollectionAbi, functionName: "contractURI" }),
    publicClient.readContract({ address: address as `0x${string}`, abi: erc721Abi, functionName: "name" }),
  ]);
  if (uriResult.status !== "fulfilled" || !uriResult.value) return null;
  const json = (await safeFetchJson(resolveUri(uriResult.value))) as any;
  if (!json) return null;
  const rawImage = json.image ?? json.image_url ?? json.imageUrl ?? null;
  const rawBanner = json.banner ?? json.banner_image_url ?? json.bannerImageUrl ?? null;
  return metadata(address, "contractURI", {
    name: typeof json.name === "string" ? json.name : nameResult.status === "fulfilled" ? (nameResult.value ?? undefined) : undefined,
    image: typeof rawImage === "string" ? resolveUri(rawImage) : undefined,
    banner: typeof rawBanner === "string" ? resolveUri(rawBanner) : undefined,
  });
}

async function fromTokenURI(address: string): Promise<CollectionMetadata | null> {
  const [uriResult, nameResult] = await Promise.allSettled([
    publicClient.readContract({ address: address as `0x${string}`, abi: erc721Abi, functionName: "tokenURI", args: [1n] }),
    publicClient.readContract({ address: address as `0x${string}`, abi: erc721Abi, functionName: "name" }),
  ]);
  if (uriResult.status !== "fulfilled" || !uriResult.value) return null;
  const json = (await safeFetchJson(resolveUri(uriResult.value))) as any;
  const rawImage = json?.image ?? json?.image_url ?? json?.imageUrl ?? null;
  return metadata(address, "tokenURI", { name: nameResult.status === "fulfilled" ? (nameResult.value ?? undefined) : undefined, image: typeof rawImage === "string" ? resolveUri(rawImage) : undefined });
}

export async function getCollectionMetadata(collectionAddress: string, chainId: number): Promise<CollectionMetadata> {
  const address = collectionAddress.toLowerCase();
  const key = `${chainId}:${address}`;
  const cached = cache.get(key);
  if (cached && Date.now() - cached.at < TTL_MS) return cached.value;

  for (const load of [() => fromReservoir(address, chainId), () => fromOpenSea(address), () => fromContractURI(address), () => fromTokenURI(address)]) {
    try {
      const value = await load();
      if (value && value.image !== COLLECTION_PLACEHOLDER_IMAGE) {
        cacheSet(key, value);
        return value;
      }
    } catch {}
  }
  const value = metadata(address, "placeholder", {});
  cacheSet(key, value);
  return value;
}
