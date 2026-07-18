import { NextResponse } from "next/server";
import { z } from "zod";
import { addressSchema, uint256Schema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getOnChainTokenMeta } from "@/lib/nft/onchain-metadata";
import { getNFTProvider } from "@/lib/nft";
import { openseaProvider } from "@/lib/nft/providers/opensea";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  contract: addressSchema,
  tokenId: uint256Schema,
});

export async function GET(req: Request) {
  const { allowed } = await rateLimit(clientKey(req, "token-meta"), 60, 60_000);
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

  const [meta, indexed, openSeaToken] = await Promise.all([
    getOnChainTokenMeta(parsed.data.contract, parsed.data.tokenId),
    getNFTProvider()
      .getToken(parsed.data.contract, parsed.data.tokenId)
      .catch(() => null),
    openseaProvider
      .getToken(parsed.data.contract, parsed.data.tokenId)
      .catch(() => null),
  ]);

  return NextResponse.json({
    ...meta,
    name: indexed?.name ?? meta.name,
    // OpenSea's CDN image is the reliable last resort when the indexer and
    // on-chain IPFS both come up empty (e.g. 10kSquad).
    image: indexed?.imageUrl ?? meta.image ?? openSeaToken?.imageUrl ?? null,
    collectionName: indexed?.collectionName ?? meta.collectionName,
    rarityRank: openSeaToken?.rarityRank ?? indexed?.rarityRank ?? null,
  });
}
