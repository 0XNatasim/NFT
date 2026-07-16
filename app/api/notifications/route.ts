import { NextResponse } from "next/server";
import { z } from "zod";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/lib/db/deal-rooms";
import { requireSession, unauthorized } from "@/lib/deal-rooms/api";

export const dynamic = "force-dynamic";

/**
 * GET /api/notifications — the session wallet's notifications
 * (server-persistent; survives devices and cleared storage).
 */
export async function GET(req: Request) {
  const wallet = requireSession(req);
  if (!wallet) return unauthorized();

  const { allowed } = await rateLimit(
    clientKey(req, `notifications:${wallet}`),
    30,
    60_000
  );
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const unreadOnly = searchParams.get("unread") === "1";

  try {
    const notifications = await listNotifications(wallet, unreadOnly);
    return NextResponse.json({ notifications });
  } catch (err) {
    console.error("GET /api/notifications failed:", err);
    return NextResponse.json(
      { error: "Failed to list notifications" },
      { status: 500 }
    );
  }
}

const markSchema = z.object({
  id: z.string().uuid().optional(),
  all: z.boolean().optional(),
});

/** POST /api/notifications — mark one ({id}) or all ({all:true}) as read. */
export async function POST(req: Request) {
  const wallet = requireSession(req);
  if (!wallet) return unauthorized();

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = markSchema.safeParse(body);
  if (!parsed.success || (!parsed.data.id && !parsed.data.all)) {
    return NextResponse.json({ error: "Pass id or all:true" }, { status: 400 });
  }

  try {
    if (parsed.data.all) {
      await markAllNotificationsRead(wallet);
    } else if (parsed.data.id) {
      await markNotificationRead(wallet, parsed.data.id);
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("POST /api/notifications failed:", err);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 }
    );
  }
}
