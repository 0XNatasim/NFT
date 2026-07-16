import type { DealRoomStatus } from "@/lib/types";

/**
 * Deal Room lifecycle.
 *
 *   open ──(both accept current revision)──► agreed
 *   agreed ──(new revision)──► open            (acceptances invalidated)
 *   agreed ──(maker signs final order)──► signed
 *   signed ──(TradeExecuted verified)──► settled
 *   signed ──(final offer cancelled on-chain)──► agreed   (renegotiable)
 *
 * Terminal: settled, declined, cancelled, expired, superseded.
 * "One side accepted" is not a status — it lives in deal_room_acceptances.
 */

const TRANSITIONS: Record<DealRoomStatus, DealRoomStatus[]> = {
  open: ["agreed", "declined", "cancelled", "expired", "superseded"],
  agreed: ["open", "signed", "declined", "cancelled", "expired", "superseded"],
  signed: ["settled", "agreed", "cancelled", "expired", "superseded"],
  settled: [],
  declined: [],
  cancelled: [],
  expired: [],
  superseded: [],
};

export const TERMINAL_STATUSES: ReadonlySet<DealRoomStatus> = new Set([
  "settled",
  "declined",
  "cancelled",
  "expired",
  "superseded",
]);

/** Statuses in which a room still accepts participant mutations. */
export const ACTIVE_STATUSES: ReadonlySet<DealRoomStatus> = new Set([
  "open",
  "agreed",
  "signed",
]);

export function canTransition(
  from: DealRoomStatus,
  to: DealRoomStatus
): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminal(status: DealRoomStatus): boolean {
  return TERMINAL_STATUSES.has(status);
}

export function isActive(status: DealRoomStatus): boolean {
  return ACTIVE_STATUSES.has(status);
}

/** Revisions may only be proposed while negotiating (not after signing). */
export function canPropose(status: DealRoomStatus): boolean {
  return status === "open" || status === "agreed";
}

export function canAgree(status: DealRoomStatus): boolean {
  return status === "open";
}

export function canFinalize(status: DealRoomStatus): boolean {
  return status === "agreed";
}
