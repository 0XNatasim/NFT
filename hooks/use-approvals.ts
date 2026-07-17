"use client";

import { useMemo } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { MONAD_CHAIN_ID, SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { erc721Abi } from "@/lib/contracts/settlement";
import type { Address } from "viem";

/** Visual approval state of a collection for the settlement contract. */
export type ApprovalState = "approved" | "unapproved" | "pending" | "unknown";

export const COLLECTION_APPROVALS_KEY = "collection-approvals";

/**
 * Reads isApprovedForAll(owner, settlement) for a set of collection contracts
 * (the connected wallet as owner). Powers the approval dots on NFT cards.
 * One read per distinct collection, cached briefly; refetched on demand after
 * the user approves.
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
    queryFn: async () => {
      const entries = await Promise.all(
        uniqueContracts.map(async (contract) => {
          try {
            const approved = await publicClient!.readContract({
              address: contract as Address,
              abi: erc721Abi,
              functionName: "isApprovedForAll",
              args: [owner as Address, SETTLEMENT_CONTRACT_ADDRESS],
            });
            return [contract, Boolean(approved)] as const;
          } catch {
            return [contract, null] as const;
          }
        }),
      );
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
