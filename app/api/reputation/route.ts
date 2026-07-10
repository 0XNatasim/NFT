import { NextResponse } from "next/server";
import { getReputation } from "@/lib/db/offers";
import { addressSchema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { allowed } = await rateLimit(clientKey(req, "reputation"), 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }
  const wallet = new URL(req.url).searchParams.get("wallet");
  const parsed = addressSchema.safeParse(wallet);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid wallet" }, { status: 400 });
  }
  try {
    const reputation = await getReputation(parsed.data);
    return NextResponse.json({ reputation });
  } catch (err) {
    console.error("GET /api/reputation failed:", err);
    return NextResponse.json({ error: "Failed to fetch reputation" }, { status: 500 });
  }
}
