import { NextResponse } from "next/server";
import { z } from "zod";
import { getServiceClient } from "@/lib/supabase/server";
import { bumpReputation, getOfferById, recordEvent } from "@/lib/db/offers";
import { cancelOfferSchema } from "@/lib/validation/offers";
import { publicClient } from "@/lib/chains/client";
import { settlementAbi } from "@/lib/contracts/settlement";
import { SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Mark an offer cancelled. Cancellation is an on-chain action
 * (cancelNonce) — we verify nonceUsed on-chain rather than trusting
 * the caller, so this endpoint cannot be abused to hide other
 * people's offers.
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { allowed } = await rateLimit(clientKey(req, "cancel-offer"), 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { id } = await params;
  if (!z.string().uuid().safeParse(id).success) {
    return NextResponse.json({ error: "Invalid offer id" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = cancelOfferSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const offer = await getOfferById(id);
    if (!offer) {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    if (offer.status !== "open") {
      return NextResponse.json(
        { error: `Offer is already ${offer.status}` },
        { status: 409 }
      );
    }
    if (
      parsed.data.walletAddress.toLowerCase() !== offer.makerAddress.toLowerCase()
    ) {
      return NextResponse.json(
        { error: "Only the maker can cancel" },
        { status: 403 }
      );
    }

    // Trustless check: the maker must have consumed the nonce on-chain.
    const used = await publicClient.readContract({
      address: SETTLEMENT_CONTRACT_ADDRESS,
      abi: settlementAbi,
      functionName: "nonceUsed",
      args: [offer.makerAddress as `0x${string}`, BigInt(offer.nonce)],
    });
    if (!used) {
      return NextResponse.json(
        { error: "Nonce not cancelled on-chain yet" },
        { status: 409 }
      );
    }

    const db = getServiceClient();
    const { error } = await db
      .from("trade_offers")
      .update({
        status: "cancelled",
        cancelled_tx_hash: parsed.data.txHash ?? null,
      })
      .eq("id", id)
      .eq("status", "open");
    if (error) throw error;

    await recordEvent(id, "cancelled", offer.makerAddress, parsed.data.txHash ?? null);
    await bumpReputation(offer.makerAddress, "cancelled_trades_count");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/offers/[id]/cancel failed:", err);
    return NextResponse.json({ error: "Failed to cancel offer" }, { status: 500 });
  }
}
