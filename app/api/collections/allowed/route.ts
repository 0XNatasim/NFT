import { NextResponse } from "next/server";
import type { Address } from "viem";
import { publicClient } from "@/lib/chains/client";
import { settlementAbi } from "@/lib/contracts/settlement";
import { SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { clientKey, rateLimit } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * GET /api/collections/allowed?contracts=0x..,0x..
 *
 * Reports which collections the settlement contract will accept
 * (isCollectionAllowed — allowlisted AND past its ADD_DELAY timelock). Lets the
 * trade UI show only Handshake-supported collections instead of the wallet's
 * entire holdings. Fail-open per contract (matches findDisallowedCollections):
 * an inconclusive read is treated as allowed so legit collections aren't hidden.
 */

const TTL_MS = 5 * 60_000;
const cache = new Map<string, { at: number; allowed: boolean }>();

export async function GET(req: Request) {
  const { allowed: rateOk } = await rateLimit(
    clientKey(req, "collections-allowed"),
    60,
    60_000,
  );
  if (!rateOk) {
    return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
  }

  const { searchParams } = new URL(req.url);
  const unique = Array.from(
    new Set(
      (searchParams.get("contracts") ?? "")
        .split(",")
        .map((c) => c.trim().toLowerCase())
        .filter((c) => /^0x[0-9a-f]{40}$/.test(c)),
    ),
  ).slice(0, 100);

  const settlementConfigured =
    SETTLEMENT_CONTRACT_ADDRESS !==
    "0x0000000000000000000000000000000000000000";

  const result: Record<string, boolean> = {};
  await Promise.all(
    unique.map(async (address) => {
      const cached = cache.get(address);
      if (cached && Date.now() - cached.at < TTL_MS) {
        result[address] = cached.allowed;
        return;
      }
      if (!settlementConfigured) {
        result[address] = true; // no allowlist to gate on
        return;
      }
      try {
        const allowed = Boolean(
          await publicClient.readContract({
            address: SETTLEMENT_CONTRACT_ADDRESS,
            abi: settlementAbi,
            functionName: "isCollectionAllowed",
            args: [address as Address],
          }),
        );
        result[address] = allowed;
        cache.set(address, { at: Date.now(), allowed });
      } catch {
        // Fail open — never hide a collection on an inconclusive read.
        result[address] = true;
        cache.set(address, { at: Date.now(), allowed: true });
      }
    }),
  );

  return NextResponse.json({ allowed: result });
}
