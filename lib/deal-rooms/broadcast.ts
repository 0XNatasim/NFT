/**
 * Server → room realtime push.
 *
 * After every room mutation the API broadcasts a lightweight "room_updated"
 * ping on the room's channel; clients react by revalidating their queries
 * (the payload never carries room data — the participant-scoped API remains
 * the only data path). Uses Supabase Realtime's HTTP broadcast endpoint so
 * no server-side socket is needed. Fail-soft by design: realtime is a UX
 * accelerator, clients also poll as a fallback.
 */

export function roomChannelName(roomId: string, realtimeToken: string): string {
  return `deal-room:${roomId}:${realtimeToken}`;
}

export async function broadcastRoomUpdate(
  roomId: string,
  realtimeToken: string,
  event: string,
  payload: Record<string, unknown> = {}
): Promise<void> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return;
  try {
    await fetch(`${url}/realtime/v1/api/broadcast`, {
      method: "POST",
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          {
            topic: roomChannelName(roomId, realtimeToken),
            event,
            payload: { ...payload, at: Date.now() },
            private: false,
          },
        ],
      }),
      cache: "no-store",
    });
  } catch {
    // Non-fatal: clients poll as fallback.
  }
}
