import { NextResponse } from "next/server";
import { z } from "zod";
import { getOfferById } from "@/lib/db/offers";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  if (!idSchema.safeParse(id).success) {
    return NextResponse.json({ error: "Invalid offer id" }, { status: 400 });
  }
  try {
    const offer = await getOfferById(id);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    return NextResponse.json({ offer });
  } catch (err) {
    console.error("GET /api/offers/[id] failed:", err);
    return NextResponse.json({ error: "Failed to fetch offer" }, { status: 500 });
  }
}
