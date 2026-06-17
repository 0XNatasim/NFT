import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  buildCreateWantedMessage,
  timestampFresh,
  verifyWalletSignature,
} from "@/lib/wanted/auth";
import type { Hex } from "viem";

export const dynamic = "force-dynamic";

const createWantedSchema = z.object({
  walletAddress: addressSchema,
  lookingFor: z.string().min(2).max(280),
  offering: z.string().max(280).optional(),
  notes: z.string().max(500).optional(),
  timestamp: z.number().int(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, "Invalid signature"),
});

export async function GET() {
  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("wanted_posts")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return NextResponse.json({
      posts: (data ?? []).map((p) => ({
        id: p.id,
        walletAddress: p.wallet_address,
        lookingFor: p.looking_for,
        offering: p.offering,
        notes: p.notes,
        createdAt: p.created_at,
      })),
    });
  } catch (err) {
    console.error("GET /api/wanted failed:", err);
    return NextResponse.json({ error: "Failed to list posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const { allowed } = await rateLimit(clientKey(req, "wanted"), 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = createWantedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  if (!timestampFresh(input.timestamp)) {
    return NextResponse.json(
      { error: "Signature timestamp expired; please retry" },
      { status: 401 }
    );
  }

  const message = buildCreateWantedMessage(input);
  const validSig = await verifyWalletSignature(
    message,
    input.signature as Hex,
    input.walletAddress
  );
  if (!validSig) {
    return NextResponse.json(
      { error: "Invalid wallet signature" },
      { status: 401 }
    );
  }

  try {
    const db = getServiceClient();
    const { data, error } = await db
      .from("wanted_posts")
      .insert({
        wallet_address: input.walletAddress.toLowerCase(),
        looking_for: input.lookingFor,
        offering: input.offering ?? null,
        notes: input.notes ?? null,
      })
      .select()
      .single();
    if (error) throw error;
    return NextResponse.json({ post: data }, { status: 201 });
  } catch (err) {
    console.error("POST /api/wanted failed:", err);
    return NextResponse.json({ error: "Failed to create post" }, { status: 500 });
  }
}
