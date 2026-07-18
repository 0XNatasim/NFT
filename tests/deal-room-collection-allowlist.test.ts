import { describe, expect, it, vi } from "vitest";
import { rejectedDealRoomCollections } from "@/lib/deal-rooms/collection-allowlist";

const ALLOWED = "0x1111111111111111111111111111111111111111";
const REJECTED = "0x2222222222222222222222222222222222222222";
const UNKNOWN = "0x3333333333333333333333333333333333333333";

describe("Deal Room collection allowlist", () => {
  it("deduplicates addresses and returns collections rejected on-chain", async () => {
    const readContract = vi.fn(async ({ args }: { args: readonly [string] }) =>
      args[0].toLowerCase() === ALLOWED,
    );

    const result = await rejectedDealRoomCollections(
      { readContract } as never,
      [
        { contractAddress: ALLOWED.toUpperCase().replace("0X", "0x") },
        { contractAddress: ALLOWED },
        { contractAddress: REJECTED },
      ],
    );

    expect(result).toEqual([REJECTED]);
    expect(readContract).toHaveBeenCalledTimes(2);
  });

  it("fails closed when the allowlist RPC read is inconclusive", async () => {
    const readContract = vi.fn(async () => {
      throw new Error("RPC unavailable");
    });

    await expect(
      rejectedDealRoomCollections(
        { readContract } as never,
        [{ contractAddress: UNKNOWN }],
      ),
    ).resolves.toEqual([UNKNOWN]);
  });

  it("does not perform RPC reads for MON-only terms", async () => {
    const readContract = vi.fn();
    await expect(
      rejectedDealRoomCollections({ readContract } as never, []),
    ).resolves.toEqual([]);
    expect(readContract).not.toHaveBeenCalled();
  });
});
