import {
  createNotification,
  forceRoomStatus,
  getRoomByFinalOffer,
  getRoomRow,
  listRoomsBySourceOffer,
  recordRoomEvent,
} from "@/lib/db/deal-rooms";
import { broadcastRoomUpdate } from "@/lib/deal-rooms/broadcast";

/**
 * Keeps Deal Rooms consistent with verified on-chain offer transitions.
 * Called from the offer complete/cancel routes AFTER receipt verification —
 * so every state written here is backed by a chain event. Fail-soft: a room
 * sync failure must never fail the offer update it follows.
 */
export async function syncDealRoomsOnOfferChange(
  offerId: string,
  change: "completed" | "cancelled",
  txHash: string | null
): Promise<void> {
  try {
    // Case 1: this offer is a room's FINAL signed order.
    const finalRoom = await getRoomByFinalOffer(offerId);
    if (finalRoom && finalRoom.status === "signed") {
      if (change === "completed") {
        await forceRoomStatus(
          finalRoom.id,
          "settled",
          { settled_at: new Date().toISOString() },
          "room_settled",
          txHash
        );
        for (const wallet of [finalRoom.participantA, finalRoom.participantB]) {
          await createNotification({
            recipient: wallet,
            type: "room_settled",
            roomId: finalRoom.id,
            offerId,
            title: "Handshake settled 🤝",
            body: "Your negotiated deal settled on-chain.",
            actionPath: `/rooms/${finalRoom.id}`,
            dedupeKey: `room_settled:${finalRoom.id}:${wallet}`,
          });
        }
      } else {
        // The signed final order was cancelled on-chain: negotiation can
        // resume from the agreed draft (signed → agreed is a legal move).
        await forceRoomStatus(
          finalRoom.id,
          "agreed",
          { final_offer_id: null, signed_at: null },
          "system",
          "Final signed offer was cancelled on-chain — negotiation reopened"
        );
      }
      const withToken = await getRoomRow(finalRoom.id);
      if (withToken) {
        await broadcastRoomUpdate(
          finalRoom.id,
          withToken.realtimeToken,
          "room_updated",
          { kind: change === "completed" ? "settled" : "final-cancelled" }
        );
      }
    }

    // Case 2: this offer is the SOURCE some active rooms negotiate around.
    const sourceRooms = await listRoomsBySourceOffer(offerId);
    for (const room of sourceRooms) {
      if (change === "completed") {
        // Source got filled as-is — the negotiation is moot.
        await forceRoomStatus(
          room.id,
          "superseded",
          {},
          "room_superseded",
          "The original offer settled on-chain as signed"
        );
        for (const wallet of [room.participantA, room.participantB]) {
          await createNotification({
            recipient: wallet,
            type: "room_superseded",
            roomId: room.id,
            offerId,
            title: "Negotiation superseded",
            body: "The original offer settled as signed before your revision was finalized.",
            actionPath: `/rooms/${room.id}`,
            dedupeKey: `room_superseded:${room.id}:${wallet}`,
          });
        }
      } else {
        // Cancelled source is the EXPECTED retire step before replacement —
        // just wake the room so the finalize gate flips live.
        await recordRoomEvent(
          room.id,
          "system",
          null,
          null,
          "Original offer retired on-chain — the replacement can now be signed"
        );
      }
      const withToken = await getRoomRow(room.id);
      if (withToken) {
        await broadcastRoomUpdate(
          room.id,
          withToken.realtimeToken,
          "room_updated",
          { kind: `source-${change}` }
        );
      }
    }
  } catch (err) {
    console.error("Deal room sync failed (non-fatal):", err);
  }
}
