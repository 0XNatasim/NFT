import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { addressSchema } from "@/lib/validation/offers";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  buildDeleteWantedMessage,
  timestampFresh,
  verifyWalletSignature,
} from "@/lib/wanted/auth";
import type { Hex } from "viem";

export const dynamic = "force-dynamic";

const deleteSchema = z.object({
  walletAddress: addressSchema,
  timestamp: z.number().int(),
  signature: z.string().regex(/^0x[0-9a-fA-F]+$/, "Invalid signature"),
});

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed } = await rateLimit(clientKey(req, "wanted-delete"), 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid post id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = deleteSchema.safeParse(body);
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

  const message = buildDeleteWantedMessage({
    walletAddress: input.walletAddress,
    id,
    timestamp: input.timestamp,
  });
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
      .delete()
      .eq("id", id)
      .eq("wallet_address", input.walletAddress.toLowerCase())
      .select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return NextResponse.json(
        { error: "Post not found or not yours" },
        { status: 404 }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/wanted/[id] failed:", err);
    return NextResponse.json({ error: "Failed to delete post" }, { status: 500 });
  }
}
