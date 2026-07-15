import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  agreeToRevision,
  counterpartyOf,
  createNotification,
  RoomConflictError,
} from "@/lib/db/deal-rooms";
import { agreeSchema } from "@/lib/validation/deal-rooms";
import { canAgree } from "@/lib/deal-rooms/state-machine";
import { broadcastRoomUpdate } from "@/lib/deal-rooms/broadcast";
import {
  conflict,
  loadRoomForParticipant,
  notFound,
  requireSession,
  shortAddr,
  unauthorized,
} from "@/lib/deal-rooms/api";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

/**
 * POST /api/deal-rooms/[id]/agree — accept the room's CURRENT revision.
 *
 * Acceptance is bound to an exact revision id; if a newer revision landed
 * meanwhile the request 409s so nobody ever agrees to terms they haven't
 * seen. When both participants have accepted, the room becomes `agreed`
 * (still non-executable — the maker must sign the final order next).
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const wallet = requireSession(req);
  if (!wallet) return unauthorized();

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFound();

  const { allowed } = await rateLimit(
    clientKey(req, `room-agree:${wallet}`),
    20,
    60_000
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = agreeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const input = parsed.data;

  try {
    const room = await loadRoomForParticipant(id, wallet);
    if (!room) return notFound();

    if (!canAgree(room.status)) {
      return conflict(`Room is ${room.status} — nothing to agree to`);
    }
    if (room.currentRevisionId !== input.revisionId) {
      return conflict("A newer revision exists — review it before agreeing");
    }

    const { room: updated, bothAgreed } = await agreeToRevision({
      room,
      expectedVersion: input.expectedVersion,
      revisionId: input.revisionId,
      wallet,
    });

    const counterparty = counterpartyOf(room, wallet);
    await createNotification({
      recipient: counterparty,
      type: bothAgreed ? "room_agreed" : "revision_agreed",
      roomId: room.id,
      actor: wallet,
      title: bothAgreed ? "Terms agreed 🤝" : "They agreed to the draft",
      body: bothAgreed
        ? "Both sides agreed. The maker can now sign the final deal."
        : `${shortAddr(wallet)} agreed to the current draft.`,
      actionPath: `/rooms/${room.id}`,
      dedupeKey: `agree:${room.id}:${input.revisionId}:${wallet}`,
    });
    await broadcastRoomUpdate(room.id, room.realtimeToken, "room_updated", {
      kind: bothAgreed ? "agreed" : "acceptance",
    });

    return NextResponse.json({ room: updated, bothAgreed });
  } catch (err) {
    if (err instanceof RoomConflictError) {
      return conflict("This room moved — refresh and retry");
    }
    console.error("POST /api/deal-rooms/[id]/agree failed:", err);
    return NextResponse.json({ error: "Failed to agree" }, { status: 500 });
  }
}
