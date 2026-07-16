import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  counterpartyOf,
  createNotification,
  RoomConflictError,
  setRoomStatus,
} from "@/lib/db/deal-rooms";
import { cancelRoomSchema } from "@/lib/validation/deal-rooms";
import { isActive } from "@/lib/deal-rooms/state-machine";
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
 * POST /api/deal-rooms/[id]/cancel — close a room without settling.
 * Unlike decline (a "no"), cancel is a neutral withdrawal by either side.
 * A `signed` room can be cancelled here only in the app-state sense; the
 * signed offer itself must be cancelled on-chain via the offer's cancel flow
 * (its nonce is the authoritative kill switch).
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
    clientKey(req, `room-cancel:${wallet}`),
    10,
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

  const parsed = cancelRoomSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const room = await loadRoomForParticipant(id, wallet);
    if (!room) return notFound();
    if (!isActive(room.status)) {
      return conflict(`Room is already ${room.status}`);
    }
    if (room.status === "signed") {
      return conflict(
        "This room has a live signed offer. Cancel that offer on-chain first — its nonce is what actually kills the deal."
      );
    }

    const updated = await setRoomStatus({
      roomId: room.id,
      expectedVersion: parsed.data.expectedVersion,
      status: "cancelled",
      eventType: "room_cancelled",
      actor: wallet,
    });

    const counterparty = counterpartyOf(room, wallet);
    await createNotification({
      recipient: counterparty,
      type: "room_cancelled",
      roomId: room.id,
      actor: wallet,
      title: "Room closed",
      body: `${shortAddr(wallet)} closed the negotiation.`,
      actionPath: `/rooms/${room.id}`,
      dedupeKey: `room_cancelled:${room.id}`,
    });
    await broadcastRoomUpdate(room.id, room.realtimeToken, "room_updated", {
      kind: "cancelled",
    });

    return NextResponse.json({ room: updated });
  } catch (err) {
    if (err instanceof RoomConflictError) {
      return conflict("This room moved — refresh and retry");
    }
    console.error("POST /api/deal-rooms/[id]/cancel failed:", err);
    return NextResponse.json({ error: "Failed to cancel" }, { status: 500 });
  }
}
