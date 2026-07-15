import { NextResponse } from "next/server";
import type { DealRoom } from "@/lib/types";
import { sessionWalletFromRequest } from "@/lib/deal-rooms/session";
import {
  forceRoomStatus,
  getRoomRow,
  isParticipant,
} from "@/lib/db/deal-rooms";
import { isActive } from "@/lib/deal-rooms/state-machine";

/**
 * Shared plumbing for Deal Room routes: session extraction, participant
 * scoping (unauthorized callers get a generic 404 — a room's existence is
 * private), and lazy expiry.
 */

export type RoomWithToken = DealRoom & { realtimeToken: string };

export function unauthorized(): NextResponse {
  return NextResponse.json(
    { error: "Sign in to Deal Rooms first" },
    { status: 401 }
  );
}

export function notFound(): NextResponse {
  return NextResponse.json({ error: "Not found" }, { status: 404 });
}

export function conflict(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 409 });
}

export function requireSession(req: Request): string | null {
  return sessionWalletFromRequest(req);
}

/**
 * Loads a room the session wallet participates in. Applies lazy expiry:
 * an active room whose expiry passed flips to `expired` before being served.
 * Returns null both for missing rooms and for rooms the wallet is not a
 * participant of (indistinguishable to the caller by design).
 */
export async function loadRoomForParticipant(
  roomId: string,
  wallet: string
): Promise<RoomWithToken | null> {
  const room = await getRoomRow(roomId);
  if (!room || !isParticipant(room, wallet)) return null;
  if (isActive(room.status) && new Date(room.expiresAt).getTime() < Date.now()) {
    await forceRoomStatus(room.id, "expired", {}, "room_expired");
    const refreshed = await getRoomRow(roomId);
    return refreshed && isParticipant(refreshed, wallet) ? refreshed : null;
  }
  return room;
}

export function shortAddr(addr: string): string {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}
