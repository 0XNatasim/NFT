import { NextResponse } from "next/server";
import { z } from "zod";
import { getNFTProvider } from "@/lib/nft";
import { addressSchema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const querySchema = z.object({
  owner: addressSchema,
  pageKey: z.string().max(2048).optional(),
});

export async function GET(req: Request) {
  const { allowed } = rateLimit(clientKey(req, "nfts"), 30, 60_000);
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
    return NextResponse.json(result);
  } catch (err) {
    console.error("GET /api/nfts failed:", err);
    return NextResponse.json(
      { error: "Failed to fetch NFTs" },
      { status: 502 }
    );
  }
}
