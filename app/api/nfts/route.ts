import { NextResponse } from "next/server";
import { z } from "zod";
import { getNFTProvider } from "@/lib/nft";
import { addressSchema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { publicClient } from "@/lib/chains/client";
import { getOnChainTokenMeta } from "@/lib/nft/onchain-metadata";

export const dynamic = "force-dynamic";

// Indexers sometimes return spam/phantom entries that don't exist on the
// configured chain. Cache contract-code existence so each collection is
// checked at most once per server instance.
const contractExistsCache = new Map<string, boolean>();

async function contractExists(address: string): Promise<boolean> {
  const key = address.toLowerCase();
  const cached = contractExistsCache.get(key);
  if (cached !== undefined) return cached;
  try {
    const code = await publicClient.getCode({ address: key as `0x${string}` });
    const exists = !!code && code !== "0x";
    contractExistsCache.set(key, exists);
    return exists;
  } catch {
    // RPC hiccup: don't cache, let the NFT through rather than hide it.
    return true;
  }
}

const querySchema = z.object({
  owner: addressSchema,
  pageKey: z.string().max(2048).optional(),
});

export async function GET(req: Request) {
  const { allowed } = await rateLimit(clientKey(req, "nfts"), 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({
    owner: searchParams.get("owner"),
    pageKey: searchParams.get("pageKey") ?? undefined,
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const provider = getNFTProvider();
    const result = await provider.getWalletNFTs(parsed.data.owner, {
      pageKey: parsed.data.pageKey ?? null,
    });

    // Drop NFTs whose contract has no code on the configured chain.
    const contracts = Array.from(
      new Set(result.nfts.map((n) => n.contractAddress.toLowerCase()))
    );
    const existence = await Promise.all(contracts.map(contractExists));
    const valid = new Set(contracts.filter((_, i) => existence[i]));
    result.nfts = result.nfts.filter((n) =>
      valid.has(n.contractAddress.toLowerCase())
    );

    // Indexers sometimes return tokens without artwork (e.g. uncached
    // collections). Backfill from on-chain tokenURI metadata, bounded per
    // request; the per-token cache makes subsequent loads cheap.
    const missing = result.nfts.filter((n) => !n.imageUrl).slice(0, 20);
    await Promise.all(
      missing.map(async (nft) => {
        try {
          const meta = await getOnChainTokenMeta(nft.contractAddress, nft.tokenId);
          nft.imageUrl = meta.image ?? nft.imageUrl;
          nft.name = nft.name ?? meta.name;
          nft.collectionName = nft.collectionName ?? meta.collectionName;
        } catch {
          // cosmetic only
        }
      })
    );

    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/nfts failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch NFTs" },
      { status: 502 }
    );
  }
}
