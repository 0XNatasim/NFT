import { NextResponse } from "next/server";
import { z } from "zod";
import { publicClient } from "@/lib/chains/client";
import { erc721Abi } from "@/lib/contracts/settlement";
import { addressSchema, uint256Schema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Indexer-independent token metadata: reads tokenURI + collection name
 * on-chain, fetches the metadata JSON, and resolves the image URL.
 */

const IPFS_GATEWAY = process.env.IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";

const querySchema = z.object({
  contract: addressSchema,
  tokenId: uint256Schema,
});

interface TokenMeta {
  name: string | null;
  image: string | null;
  collectionName: string | null;
}

const cache = new Map<string, TokenMeta>();

function resolveUri(uri: string): string {
  if (uri.startsWith("ipfs://")) {
    return IPFS_GATEWAY + uri.replace("ipfs://", "").replace(/^ipfs\//, "");
  }
  return uri;
}

async function loadMetadataJson(uri: string): Promise<any | null> {
  if (uri.startsWith("data:application/json;base64,")) {
    try {
      return JSON.parse(
        Buffer.from(uri.split(",")[1], "base64").toString("utf8")
      );
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

export async function GET(req: Request) {
  const { allowed } = rateLimit(clientKey(req, "token-meta"), 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    contract: searchParams.get("contract"),
    tokenId: searchParams.get("tokenId"),
  });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const key = `${parsed.data.contract.toLowerCase()}:${parsed.data.tokenId}`;
  const cached = cache.get(key);
  if (cached) return NextResponse.json(cached);

  const contract = parsed.data.contract as `0x${string}`;
  const tokenId = BigInt(parsed.data.tokenId);

  const [uriResult, nameResult] = await Promise.allSettled([
    publicClient.readContract({
      address: contract,
      abi: erc721Abi,
      functionName: "tokenURI",
      args: [tokenId],
    }),
    publicClient.readContract({
      address: contract,
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

  const result: TokenMeta = { name, image, collectionName };
  cache.set(key, result);
  return NextResponse.json(result);
}
