import { NextResponse } from "next/server";
import type { Hex } from "viem";
import { publicClient } from "@/lib/chains/client";
import { clientKey, rateLimit } from "@/lib/rate-limit";
import { createSessionSchema } from "@/lib/validation/deal-rooms";
import {
  buildSessionMessage,
  issueSessionToken,
  sessionTimestampFresh,
  verifySessionSignature,
} from "@/lib/deal-rooms/session";

export const dynamic = "force-dynamic";

/**
 * POST /api/deal-rooms/session
 * Exchanges a fresh EIP-191 sign-in signature for a short-lived bearer token
 * used by every other Deal Room endpoint. EOA + EIP-1271 signers accepted.
 */
export async function POST(req: Request) {
  const { allowed } = await rateLimit(clientKey(req, "room-session"), 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const { walletAddress, timestamp, signature } = parsed.data;

  if (!sessionTimestampFresh(timestamp)) {
    return NextResponse.json(
      { error: "Signature timestamp expired — retry sign-in" },
      { status: 401 }
    );
  }

  const message = buildSessionMessage({ walletAddress, timestamp });
  const valid = await verifySessionSignature(
    publicClient,
    message,
    signature as Hex,
    walletAddress
  );
  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const { token, expiresAt } = issueSessionToken(walletAddress);
  return NextResponse.json({
    token,
    expiresAt,
    walletAddress: walletAddress.toLowerCase(),
  });
}
