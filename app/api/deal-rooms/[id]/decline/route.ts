import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  counterpartyOf,
  createNotification,
  declineRoom,
  RoomConflictError,
} from "@/lib/db/deal-rooms";
import { declineSchema } from "@/lib/validation/deal-rooms";
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

const REASON_LABEL: Record<string, string> = {
  price: "the price",
  items: "the items",
  not_trading: "not trading right now",
  other: "other reasons",
};

/** POST /api/deal-rooms/[id]/decline — close the negotiation with a reason. */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const wallet = requireSession(req);
  if (!wallet) return unauthorized();

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFound();

  const { allowed } = await rateLimit(
    clientKey(req, `room-decline:${wallet}`),
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

  const parsed = declineSchema.safeParse(body);
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
        "A final offer is already signed — cancel it on-chain first"
      );
    }

    const updated = await declineRoom({
      room,
      expectedVersion: parsed.data.expectedVersion,
      wallet,
      reason: parsed.data.reason,
    });

    const counterparty = counterpartyOf(room, wallet);
    await createNotification({
      recipient: counterparty,
      type: "room_declined",
      roomId: room.id,
      actor: wallet,
      title: "Negotiation declined",
      body: `${shortAddr(wallet)} passed — ${REASON_LABEL[parsed.data.reason]}.`,
      actionPath: `/rooms/${room.id}`,
      dedupeKey: `room_declined:${room.id}`,
    });
    await broadcastRoomUpdate(room.id, room.realtimeToken, "room_updated", {
      kind: "declined",
    });

    return NextResponse.json({ room: updated });
  } catch (err) {
    if (err instanceof RoomConflictError) {
      return conflict("This room moved — refresh and retry");
    }
    console.error("POST /api/deal-rooms/[id]/decline failed:", err);
    return NextResponse.json({ error: "Failed to decline" }, { status: 500 });
  }
}
