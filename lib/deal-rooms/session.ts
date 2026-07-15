import { createHmac, timingSafeEqual } from "node:crypto";
import type { Client, Hex } from "viem";
import { verifyMessage } from "viem/actions";

export {
  buildSessionMessage,
  sessionTimestampFresh,
  SESSION_SIGNATURE_MAX_SKEW_MS,
} from "@/lib/deal-rooms/session-message";

/**
 * Wallet session for Deal Room APIs.
 *
 * One EIP-191 personal_sign per device establishes a short-lived bearer token
 * (HMAC, stateless). The token authenticates *who is asking* for room reads
 * and draft mutations — actions that can never move assets. Anything
 * executable still requires its own wallet ceremony: the final EIP-712 order
 * signature and the on-chain transactions.
 *
 * The signed message says so explicitly, and is bound to domain + chain +
 * timestamp so it cannot be replayed elsewhere or later.
 */

export const SESSION_TTL_MS = 24 * 60 * 60 * 1000; // 24h

/**
 * Verifies the sign-in signature. Uses viem's action `verifyMessage`, which
 * falls back to on-chain EIP-1271 / ERC-6492 checks, so smart-contract
 * wallets (Safe, AA) can sign in — mirroring the settlement contract's
 * SignatureChecker.
 */
export async function verifySessionSignature(
  client: Client,
  message: string,
  signature: Hex,
  expectedAddress: string
): Promise<boolean> {
  try {
    return await verifyMessage(client, {
      address: expectedAddress as `0x${string}`,
      message,
      signature,
    });
  } catch {
    return false;
  }
}

function secret(): string {
  const configured = process.env.ROOM_SESSION_SECRET;
  if (configured && configured.length >= 16) return configured;
  // Pragmatic fallback so no new mandatory env var: derive from the service
  // role key, which is already required, server-only, and high-entropy.
  const fallback = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!fallback) {
    throw new Error(
      "Set ROOM_SESSION_SECRET (or SUPABASE_SERVICE_ROLE_KEY) to enable Deal Room sessions."
    );
  }
  return `room-session:${fallback}`;
}

function hmac(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

/** Issues a stateless bearer token: base64url(payload).hmac */
export function issueSessionToken(
  walletAddress: string,
  now: number = Date.now()
): { token: string; expiresAt: number } {
  const expiresAt = now + SESSION_TTL_MS;
  const payload = Buffer.from(
    JSON.stringify({ w: walletAddress.toLowerCase(), exp: expiresAt })
  ).toString("base64url");
  return { token: `${payload}.${hmac(payload)}`, expiresAt };
}

/** Returns the wallet address for a valid, unexpired token; null otherwise. */
export function verifySessionToken(
  token: string | null | undefined,
  now: number = Date.now()
): string | null {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return null;
  const payload = token.slice(0, dot);
  const mac = token.slice(dot + 1);
  const expected = hmac(payload);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(payload, "base64url").toString());
    if (typeof parsed.w !== "string" || typeof parsed.exp !== "number")
      return null;
    if (parsed.exp <= now) return null;
    if (!/^0x[0-9a-f]{40}$/.test(parsed.w)) return null;
    return parsed.w;
  } catch {
    return null;
  }
}

/** Extracts the session wallet from a request's Authorization header. */
export function sessionWalletFromRequest(req: Request): string | null {
  const header = req.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) return null;
  return verifySessionToken(header.slice(7));
}
