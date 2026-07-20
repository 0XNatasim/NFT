"use client";

import { useQuery } from "@tanstack/react-query";

/**
 * Reads which collections the settlement contract will accept right now
 * (isCollectionAllowed — allowlisted AND past its ADD_DELAY timelock) via
 * /api/collections/allowed. Used to drive the collection trade-status dot so a
 * validator-gated collection flips from locked (red) to open (green) the moment
 * its owner approves Handshake's settlement contract on-chain.
 *
 * Returns a lowercase-address → boolean map. Missing/unresolved addresses are
 * simply absent from the map (callers treat that as "still locked").
 */
export function useCollectionsAllowed(addresses: string[]) {
  const unique = Array.from(
    new Set(
      addresses
        .map((a) => a.trim().toLowerCase())
        .filter((a) => /^0x[0-9a-f]{40}$/.test(a)),
    ),
  ).sort();
  const key = unique.join(",");

  const query = useQuery({
    queryKey: ["collections-allowed", key],
    enabled: unique.length > 0,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: async () => {
      const res = await fetch(
        `/api/collections/allowed?contracts=${encodeURIComponent(key)}`,
      );
      if (!res.ok) throw new Error("Failed to load collection allow status");
      const json = (await res.json()) as {
        allowed?: Record<string, boolean>;
      };
      return json.allowed ?? {};
    },
  });

  return {
    allowed: query.data ?? {},
    isLoading: query.isLoading,
  };
}
