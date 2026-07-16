import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getRoomDetail } from "@/lib/db/deal-rooms";
import { getOfferById } from "@/lib/db/offers";
import { evaluateReadiness } from "@/lib/deal-rooms/readiness";
import {
  loadRoomForParticipant,
  notFound,
  requireSession,
  unauthorized,
} from "@/lib/deal-rooms/api";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

/**
 * GET /api/deal-rooms/[id]/readiness — live settlement-readiness snapshot of
 * the current revision (ownership, approvals, escrow, allowlist, expiry, and
 * the source-offer nonce-retirement gate). Derived state only; the contract
 * re-checks everything atomically at fill time.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const wallet = requireSession(req);
  if (!wallet) return unauthorized();

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFound();

  // Chain-read heavy — keep the per-wallet budget modest.
  const { allowed } = await rateLimit(
    clientKey(req, `room-readiness:${wallet}`),
    15,
    60_000
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const room = await loadRoomForParticipant(id, wallet);
    if (!room) return notFound();

    const detail = await getRoomDetail(id);
    if (!detail?.currentRevision) {
      return NextResponse.json(
        { error: "Room has no current revision" },
        { status: 409 }
      );
    }

    const sourceOffer = room.sourceOfferId
      ? await getOfferById(room.sourceOfferId)
      : null;

    const report = await evaluateReadiness(detail.currentRevision, sourceOffer);
    return NextResponse.json({ readiness: report });
  } catch (err) {
    console.error("GET /api/deal-rooms/[id]/readiness failed:", err);
    return NextResponse.json(
      { error: "Failed to evaluate readiness" },
      { status: 500 }
    );
  }
}
