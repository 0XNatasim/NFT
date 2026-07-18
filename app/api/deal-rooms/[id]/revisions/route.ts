import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  createNotification,
  DuplicateTermsError,
  proposeRevision,
  RoomConflictError,
} from "@/lib/db/deal-rooms";
import { proposeRevisionSchema } from "@/lib/validation/deal-rooms";
import { termsHash } from "@/lib/deal-rooms/canonicalize";
import { canPropose } from "@/lib/deal-rooms/state-machine";
import { broadcastRoomUpdate } from "@/lib/deal-rooms/broadcast";
import {
  conflict,
  loadRoomForParticipant,
  notFound,
  requireSession,
  shortAddr,
  unauthorized,
} from "@/lib/deal-rooms/api";
import { counterpartyOf } from "@/lib/db/deal-rooms";
import { publicClient } from "@/lib/chains/client";
import { rejectedDealRoomCollections } from "@/lib/deal-rooms/collection-allowlist";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

/**
 * POST /api/deal-rooms/[id]/revisions — propose a counter-revision.
 *
 * Append-only. The revision becomes the room's current draft, all previous
 * acceptances are invalidated (a fresh acceptance row is written only for the
 * proposer), and the room returns to `open` if it had reached `agreed`.
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
    clientKey(req, `room-revise:${wallet}`),
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

  const parsed = proposeRevisionSchema.safeParse(body);
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

    if (!canPropose(room.status)) {
      return conflict(`Room is ${room.status} — no further revisions`);
    }

    // The draft must keep binding exactly the two participants.
    const draftParties = new Set([
      input.draft.makerAddress.toLowerCase(),
      input.draft.takerAddress.toLowerCase(),
    ]);
    if (
      !draftParties.has(room.participantA) ||
      !draftParties.has(room.participantB)
    ) {
      return NextResponse.json(
        { error: "Draft maker/taker must be the two room participants" },
        { status: 400 }
      );
    }

    const rejected = await rejectedDealRoomCollections(publicClient, [
      ...input.draft.makerNFTs,
      ...input.draft.takerNFTs,
    ]);
    if (rejected.length > 0) {
      return NextResponse.json(
        {
          error: "Draft contains a collection that Handshake does not support",
          collections: rejected,
        },
        { status: 400 },
      );
    }

    const hash = termsHash(input.draft);
    const { room: updated, revision } = await proposeRevision({
      room,
      expectedVersion: input.expectedVersion,
      proposedBy: wallet,
      draft: input.draft,
      termsHash: hash,
      note: input.note ?? null,
    });

    const counterparty = counterpartyOf(room, wallet);
    await createNotification({
      recipient: counterparty,
      type: "revision_proposed",
      roomId: room.id,
      actor: wallet,
      title: "New counter-proposal",
      body: `${shortAddr(wallet)} proposed revision #${revision.revisionNumber}${input.note ? ` — “${input.note.slice(0, 80)}”` : ""}`,
      actionPath: `/rooms/${room.id}`,
      dedupeKey: `revision_proposed:${room.id}:${revision.id}:${counterparty}`,
    });
    await broadcastRoomUpdate(room.id, room.realtimeToken, "room_updated", {
      kind: "revision",
      revisionNumber: revision.revisionNumber,
    });

    return NextResponse.json({ room: updated, revision }, { status: 201 });
  } catch (err) {
    if (err instanceof RoomConflictError) {
      return conflict("This room moved — review the latest revision and retry");
    }
    if (err instanceof DuplicateTermsError) {
      return conflict("These exact terms were already proposed in this room");
    }
    console.error("POST /api/deal-rooms/[id]/revisions failed:", err);
    return NextResponse.json(
      { error: "Failed to propose revision" },
      { status: 500 }
    );
  }
}
