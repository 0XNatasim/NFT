import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { getRoomDetail } from "@/lib/db/deal-rooms";
import {
  loadRoomForParticipant,
  notFound,
  requireSession,
  unauthorized,
} from "@/lib/deal-rooms/api";

export const dynamic = "force-dynamic";

const idSchema = z.string().uuid();

/**
 * GET /api/deal-rooms/[id] — full room detail for a participant.
 * Non-participants (and unknown ids) get an indistinguishable 404.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const wallet = requireSession(req);
  if (!wallet) return unauthorized();

  const { id } = await params;
  if (!idSchema.safeParse(id).success) return notFound();

  const { allowed } = await rateLimit(
    clientKey(req, `room-detail:${wallet}`),
    60,
    60_000
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  try {
    const room = await loadRoomForParticipant(id, wallet);
    if (!room) return notFound();
    const detail = await getRoomDetail(id);
    if (!detail) return notFound();
    return NextResponse.json({ room: detail });
  } catch (err) {
    console.error("GET /api/deal-rooms/[id] failed:", err);
    return NextResponse.json({ error: "Failed to fetch room" }, { status: 500 });
  }
}
