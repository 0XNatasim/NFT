import { recoverMessageAddress, type Hex } from "viem";

/**
 * Wallet-signed authentication for the wanted board. Posts and deletes must be
 * signed (EIP-191 personal_sign) by the claimed wallet so nobody can post or
 * remove entries on another address's behalf. The signed message is fully
 * reconstructed server-side, so the signature is bound to the exact payload.
 */

/** Max clock skew between the signed timestamp and the server (5 minutes). */
export const SIGNATURE_MAX_SKEW_MS = 5 * 60 * 1000;

export function buildCreateWantedMessage(p: {
  walletAddress: string;
  lookingFor: string;
  offering?: string | null;
  notes?: string | null;
  timestamp: number;
}): string {
  return [
    "Monad Market — Post wanted request",
    `Wallet: ${p.walletAddress.toLowerCase()}`,
    `Looking for: ${p.lookingFor}`,
    `Offering: ${p.offering ?? ""}`,
    `Notes: ${p.notes ?? ""}`,
    `Timestamp: ${p.timestamp}`,
  ].join("\n");
}

export function buildDeleteWantedMessage(p: {
  walletAddress: string;
  id: string;
  timestamp: number;
}): string {
  return [
    "Monad Market — Delete wanted request",
    `Wallet: ${p.walletAddress.toLowerCase()}`,
    `Post: ${p.id}`,
    `Timestamp: ${p.timestamp}`,
  ].join("\n");
}

export function timestampFresh(timestamp: number, now: number = Date.now()): boolean {
  return (
    Number.isFinite(timestamp) &&
    Math.abs(now - timestamp) <= SIGNATURE_MAX_SKEW_MS
  );
}

/** Recovers the signer and checks it matches the claimed wallet (EOA). */
export async function verifyWalletSignature(
  message: string,
  signature: Hex,
  expectedAddress: string
): Promise<boolean> {
  try {
    const recovered = await recoverMessageAddress({ message, signature });
    return recovered.toLowerCase() === expectedAddress.toLowerCase();
  } catch {
    return false;
  }
}
