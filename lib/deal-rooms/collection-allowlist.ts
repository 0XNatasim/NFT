import type { Address, PublicClient } from "viem";
import { SETTLEMENT_CONTRACT_ADDRESS } from "@/lib/chains/monad";
import { settlementAbi } from "@/lib/contracts/settlement";

export function uniqueCollectionAddresses(
  nfts: Array<{ contractAddress: string }>,
): Address[] {
  return Array.from(
    new Set(nfts.map((nft) => nft.contractAddress.toLowerCase())),
  ) as Address[];
}

/**
 * Fail-closed settlement allowlist verification for server-side Deal Room
 * mutations. RPC failures are deliberately treated as rejected collections:
 * a draft can be retried, while admitting an unverifiable asset could lead a
 * user to sign an order that can never settle.
 */
export async function rejectedDealRoomCollections(
  client: Pick<PublicClient, "readContract">,
  nfts: Array<{ contractAddress: string }>,
): Promise<Address[]> {
  const collections = uniqueCollectionAddresses(nfts);
  const checks = await Promise.all(
    collections.map(async (collection) => {
      try {
        const allowed = await client.readContract({
          address: SETTLEMENT_CONTRACT_ADDRESS,
          abi: settlementAbi,
          functionName: "isCollectionAllowed",
          args: [collection],
        });
        return allowed === true;
      } catch {
        return false;
      }
    }),
  );
  return collections.filter((_, index) => !checks[index]);
}
