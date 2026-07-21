"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Reads whether the shared Creator Token Transfer Validator currently permits
 * Handshake's settlement contract to move each collection's tokens, via
 * /api/collections/settlement-approved. Drives the trade-status dot so a
 * validator-gated collection flips from locked (red) to open (green) the moment
 * its owner approves the settlement contract on-chain.
 *
 * Returns a lowercase-address → boolean map. The endpoint is fail-closed, so an
 * unresolved or reverted read simply reports `false` (callers keep it locked).
 */
export function useCollectionsSettlementApproved(addresses: string[]) {
  const unique = Array.from(
    new Set(
      addresses
        .map((a) => a.trim().toLowerCase())
        .filter((a) => /^0x[0-9a-f]{40}$/.test(a)),
    ),
  ).sort();
  const key = unique.join(",");

  const query = useQuery({
    queryKey: ["collections-settlement-approved", key],
    enabled: unique.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const res = await fetch(
        `/api/collections/settlement-approved?contracts=${encodeURIComponent(key)}`,
      );
      if (!res.ok) throw new Error("Failed to load settlement approval status");
      const json = (await res.json()) as {
        approved?: Record<string, boolean>;
      };
      return json.approved ?? {};
    },
  });

  return {
    approved: query.data ?? {},
    isLoading: query.isLoading,
  };
}
