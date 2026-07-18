"use client";

import { useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { MONAD_CHAIN_ID, SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { erc721Abi } from "@/lib/contracts/settlement";
import type { Address } from "viem";

/** Visual approval state of a collection for the settlement contract. */
export type ApprovalState = "approved" | "unapproved" | "pending" | "unknown";

export const COLLECTION_APPROVALS_KEY = "collection-approvals";

/**
 * Reads isApprovedForAll(owner, settlement) for a set of collection contracts
 * (the connected wallet as owner). Powers the approval dots on NFT cards.
 * Distinct collections are read in one multicall, cached briefly, and
 * refetched on demand after the user approves.
 */
export function useCollectionApprovals(contracts: string[]) {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const owner = address?.toLowerCase() ?? null;

  const uniqueContracts = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.toLowerCase()))).sort(),
    [contracts],
  );

  const settlementConfigured =
    SETTLEMENT_CONTRACT_ADDRESS !==
    "0x0000000000000000000000000000000000000000";

  const query = useQuery({
    queryKey: [COLLECTION_APPROVALS_KEY, owner, uniqueContracts],
    enabled:
      !!owner && !!publicClient && settlementConfigured && uniqueContracts.length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const reads = await publicClient!.multicall({
        allowFailure: true,
        contracts: uniqueContracts.map((contract) => ({
          address: contract as Address,
          abi: erc721Abi,
          functionName: "isApprovedForAll" as const,
          args: [owner as Address, SETTLEMENT_CONTRACT_ADDRESS] as const,
        })),
      });
      const entries = uniqueContracts.map((contract, index) => {
        const result = reads[index];
        return [
          contract,
          result?.status === "success" ? Boolean(result.result) : null,
        ] as const;
      });
      return Object.fromEntries(entries) as Record<string, boolean | null>;
    },
  });

  const stateFor = useMemo(() => {
    const map = query.data ?? {};
    return (contract: string, pending = false): ApprovalState => {
      const value = map[contract.toLowerCase()];
      if (value === true) return "approved";
      if (pending) return "pending";
      if (value === false) return "unapproved";
      return "unknown";
    };
  }, [query.data]);

  return { ...query, stateFor, chainId: MONAD_CHAIN_ID };
}

/**
 * Which of `contracts` are tradable on Handshake (settlement allowlist +
 * timelock). Lets the trade UI show only supported collections rather than the
 * wallet's entire holdings (LP positions, vouchers, spam, …).
 */
export function useAllowedCollections(contracts: string[]) {
  const unique = useMemo(
    () => Array.from(new Set(contracts.map((c) => c.toLowerCase()))).sort(),
    [contracts],
  );

  const query = useQuery({
    queryKey: ["collection-allowlist", unique],
    enabled: unique.length > 0,
    staleTime: 5 * 60_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const chunks: string[][] = [];
      for (let i = 0; i < unique.length; i += 50) {
        chunks.push(unique.slice(i, i + 50));
      }
      const results = await Promise.all(
        chunks.map((chunk) =>
          fetch(`/api/collections/allowed?contracts=${chunk.join(",")}`)
            .then((r) => (r.ok ? r.json() : { allowed: {} }))
            .then((d) => d.allowed as Record<string, boolean>),
        ),
      );
      return Object.assign({}, ...results) as Record<string, boolean>;
    },
  });

  const isReady = query.data !== undefined;
  const isAllowed = (contract: string) =>
    query.data?.[contract.toLowerCase()] === true;

  return { ...query, isReady, isAllowed };
}
