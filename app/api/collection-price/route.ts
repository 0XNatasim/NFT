import { NextResponse } from "next/server";
import { z } from "zod";
import { getNFTProvider } from "@/lib/nft";
import type { CollectionPrice } from "@/lib/nft/provider";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

// Floor/offer prices change slowly relative to page loads; cache per contract
// for a short window so repeated card renders don't hammer the indexer.
const TTL_MS = 60_000;
const cache = new Map<string, { at: number; value: CollectionPrice | null }>();

const querySchema = z.object({
  // Comma-separated list of contract addresses, capped to keep calls bounded.
  contracts: z
    .string()
    .transform((s) =>
      s
        .split(",")
        .map((a) => a.trim().toLowerCase())
        .filter((a) => /^0x[0-9a-f]{40}$/.test(a))
    )
    .pipe(z.array(z.string()).min(1).max(25)),
});

export async function GET(req: Request) {
  const { allowed } = await rateLimit(clientKey(req, "collection-price"), 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const parsed = querySchema.safeParse({ contracts: searchParams.get("contracts") });
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const provider = getNFTProvider();
  if (!provider.getCollectionPrice) {
    // Provider can't price collections — return empty rather than erroring so
    // the UI just hides prices.
    return NextResponse.json({ prices: {} });
  }

  const contracts = Array.from(new Set(parsed.data.contracts));
  const now = Date.now();

  const results = await Promise.all(
    contracts.map(async (contract) => {
      const cached = cache.get(contract);
      if (cached && now - cached.at < TTL_MS) {
        return [contract, cached.value] as const;
      }
      let value: CollectionPrice | null = null;
      try {
        value = await provider.getCollectionPrice!(contract);
      } catch {
        value = null;
      }
      cache.set(contract, { at: now, value });
      return [contract, value] as const;
    })
  );

  const prices: Record<string, CollectionPrice> = {};
  for (const [contract, value] of results) {
    if (value) prices[contract] = value;
  }
  return NextResponse.json({ prices });
}
