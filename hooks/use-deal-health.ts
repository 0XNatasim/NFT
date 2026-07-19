"use client";

import { useQuery } from "@tanstack/react-query";
import { usePublicClient } from "wagmi";
import type { Address } from "viem";
import { erc721Abi, settlementAbi } from "@/lib/contracts/settlement";
import { MONAD_CHAIN_ID, SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { quoteFees } from "@/lib/fees";
import { isCollectionBid } from "@/lib/collection-bids";
import { prettyCollectionName, shortAddress } from "@/lib/utils";
import type { TradeOffer } from "@/lib/types";

/**
 * Pre-flight "deal health" check for the taker.
 *
 * The settlement contract reverts with a precise reason (CollectionNotAllowed,
 * NotTokenOwner, MissingApproval, NonceAlreadyUsed, InsufficientEscrow), but
 * Monad's RPC frequently returns a revert without the decodable reason bytes,
 * so `simulateContract` collapses to a generic "would revert" message. Instead
 * of decoding the revert, we read the exact preconditions straight from chain
 * and report which one fails — so the UI can say *why* a deal can't be filled.
 *
 * Only surfaces blockers the taker cannot resolve at accept time. The taker's
 * own NFT approval is intentionally omitted: the accept flow requests it.
 */

export type DealBlockerCode =
  | "collection-not-allowed"
  | "maker-not-owner"
  | "taker-not-owner"
  | "maker-not-approved"
  | "nonce-used"
  | "maker-escrow";

export interface DealBlocker {
  code: DealBlockerCode;
  message: string;
}

export interface DealHealth {
  ok: boolean;
  blockers: DealBlocker[];
}

// Most fundamental first — the order shown to the user.
const PRIORITY: DealBlockerCode[] = [
  "collection-not-allowed",
  "nonce-used",
  "maker-not-owner",
  "taker-not-owner",
  "maker-not-approved",
  "maker-escrow",
];

export function useDealHealth(
  offer: TradeOffer | undefined,
  connectedTaker: string | undefined,
) {
  // Pin reads to Monad so a wallet on the wrong network can't skew the check.
  const publicClient = usePublicClient({ chainId: MONAD_CHAIN_ID });

  return useQuery<DealHealth>({
    queryKey: ["deal-health", offer?.id, offer?.status, connectedTaker],
    enabled: !!offer && !!publicClient && offer.status === "open",
    staleTime: 15_000,
    refetchInterval: 20_000,
    queryFn: async () => {
      const client = publicClient!;
      const o = offer!;
      const maker = o.makerAddress.toLowerCase() as Address;
      const takerOwner = (connectedTaker ?? o.takerAddress ?? "").toLowerCase();
      const settlement = SETTLEMENT_CONTRACT_ADDRESS;

      const labelFor = (contract: string) => {
        const match = o.nfts.find(
          (n) => n.contractAddress.toLowerCase() === contract.toLowerCase(),
        );
        return (
          prettyCollectionName(match?.collectionName) ?? shortAddress(contract)
        );
      };

      // Concrete NFTs only; collection-wide bids have no single token to check.
      const makerNfts = o.nfts.filter(
        (n) => n.side === "maker" && !isCollectionBid(n),
      );
      const takerNfts = o.nfts.filter(
        (n) => n.side === "taker" && !isCollectionBid(n),
      );

      const blockers: DealBlocker[] = [];

      // 1. Every collection on the table must be on the settlement allowlist.
      const collections = Array.from(
        new Set(
          [...makerNfts, ...takerNfts].map((n) =>
            n.contractAddress.toLowerCase(),
          ),
        ),
      ) as Address[];
      const allowed = await Promise.all(
        collections.map((c) =>
          client
            .readContract({
              address: settlement,
              abi: settlementAbi,
              functionName: "isCollectionAllowed",
              args: [c],
            })
            .then((v) => ({ c, allowed: v as boolean }))
            .catch(() => ({ c, allowed: null as boolean | null })),
        ),
      );
      for (const r of allowed) {
        if (r.allowed === false) {
          blockers.push({
            code: "collection-not-allowed",
            message: `${labelFor(r.c)} isn't an approved collection for Handshake settlement, so this deal can't be filled on-chain.`,
          });
        }
      }

      // 2. Each concrete NFT must still be owned by the giving side.
      const ownerChecks = [
        ...makerNfts.map((n) => ({ n, expected: maker, who: "maker" as const })),
        ...takerNfts.map((n) => ({
          n,
          expected: takerOwner,
          who: "taker" as const,
        })),
      ];
      const owners = await Promise.all(
        ownerChecks.map((chk) =>
          client
            .readContract({
              address: chk.n.contractAddress as Address,
              abi: erc721Abi,
              functionName: "ownerOf",
              args: [BigInt(chk.n.tokenId)],
            })
            .then((owner) => ({ chk, owner: (owner as string).toLowerCase() }))
            .catch(() => ({ chk, owner: null as string | null })),
        ),
      );
      for (const { chk, owner } of owners) {
        if (owner && chk.expected && owner !== chk.expected.toLowerCase()) {
          blockers.push({
            code: chk.who === "maker" ? "maker-not-owner" : "taker-not-owner",
            message:
              chk.who === "maker"
                ? `The maker no longer owns ${labelFor(chk.n.contractAddress)} #${chk.n.tokenId}.`
                : `You no longer own ${labelFor(chk.n.contractAddress)} #${chk.n.tokenId}.`,
          });
        }
      }

      // 3. The maker must have approved settlement for each collection they give.
      const makerCollections = Array.from(
        new Set(makerNfts.map((n) => n.contractAddress.toLowerCase())),
      ) as Address[];
      const approvals = await Promise.all(
        makerCollections.map((c) =>
          client
            .readContract({
              address: c,
              abi: erc721Abi,
              functionName: "isApprovedForAll",
              args: [maker, settlement],
            })
            .then((a) => ({ c, approved: a as boolean }))
            .catch(() => ({ c, approved: null as boolean | null })),
        ),
      );
      for (const { c, approved } of approvals) {
        if (approved === false) {
          blockers.push({
            code: "maker-not-approved",
            message: `The maker hasn't approved ${labelFor(c)} for settlement yet, so the contract can't move it.`,
          });
        }
      }

      // 4. Nonce already consumed — the deal was filled or cancelled.
      const nonceUsed = await client
        .readContract({
          address: settlement,
          abi: settlementAbi,
          functionName: "nonceUsed",
          args: [maker, BigInt(o.nonce)],
        })
        .catch(() => null);
      if (nonceUsed === true) {
        blockers.push({
          code: "nonce-used",
          message: "This deal has already been filled or cancelled on-chain.",
        });
      }

      // 5. If the maker owes MON, their escrow must cover it.
      const makerMon = BigInt(o.makerMonAmount);
      if (makerMon > 0n) {
        const required = quoteFees(
          makerMon,
          0n,
          BigInt(o.feeBps),
        ).makerEscrowRequired;
        const balance = await client
          .readContract({
            address: settlement,
            abi: settlementAbi,
            functionName: "escrowBalance",
            args: [maker],
          })
          .catch(() => null);
        if (typeof balance === "bigint" && balance < required) {
          blockers.push({
            code: "maker-escrow",
            message:
              "The maker hasn't funded the MON side of this deal in escrow yet.",
          });
        }
      }

      blockers.sort(
        (a, b) => PRIORITY.indexOf(a.code) - PRIORITY.indexOf(b.code),
      );
      return { ok: blockers.length === 0, blockers };
    },
  });
}
