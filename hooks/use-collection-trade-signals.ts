"use client";

import { useQuery } from "@tanstack/react-query";
import type { CollectionTradeSignals } from "@/lib/featured-collections";

function normalize(addresses: string[]) {
  return Array.from(
    new Set(
      addresses
        .map((a) => a.trim().toLowerCase())
        .filter((a) => /^0x[0-9a-f]{40}$/.test(a)),
    ),
  ).sort();
}

async function fetchMap(
  path: string,
  key: string,
  field: "allowed" | "approved",
): Promise<Record<string, boolean>> {
  const res = await fetch(`${path}?contracts=${encodeURIComponent(key)}`);
  if (!res.ok) throw new Error(`Failed to load ${field} status`);
  const json = (await res.json()) as Record<string, Record<string, boolean>>;
  return json[field] ?? {};
}

/**
 * Reads the two independent trade-readiness signals for a set of collections:
 *   - transfer-validator approval  (/api/collections/settlement-approved)
 *   - Handshake allowlist          (/api/collections/allowed)
 *
 * Returns a lowercase-address → { validatorApproved, handshakeAllowed } map for
 * feeding into collectionTradeStatus(). Both endpoints are fail-closed, so an
 * unresolved read reports `false` and the collection stays locked/pending.
 */
export function useCollectionTradeSignals(addresses: string[]) {
  const unique = normalize(addresses);
  const key = unique.join(",");
  const enabled = unique.length > 0;

  const validator = useQuery({
    queryKey: ["collections-settlement-approved", key],
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: () =>
      fetchMap("/api/collections/settlement-approved", key, "approved"),
  });

  const handshake = useQuery({
    queryKey: ["collections-allowed", key],
    enabled,
    staleTime: 5 * 60_000,
    gcTime: 10 * 60_000,
    queryFn: () => fetchMap("/api/collections/allowed", key, "allowed"),
  });

  const validatorMap = validator.data ?? {};
  const handshakeMap = handshake.data ?? {};

  function signalsFor(address: string): CollectionTradeSignals {
    const a = address.toLowerCase();
    return {
      validatorApproved: validatorMap[a],
      handshakeAllowed: handshakeMap[a],
    };
  }

  return {
    signalsFor,
    isLoading: validator.isLoading || handshake.isLoading,
  };
}
