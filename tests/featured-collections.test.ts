import { describe, it, expect } from "vitest";
import {
  FEATURED_COLLECTIONS,
  isCollectionTradeLocked,
} from "@/lib/featured-collections";

describe("isCollectionTradeLocked", () => {
  it("collections without a transfer validator are always open", () => {
    expect(isCollectionTradeLocked({ transferValidator: false })).toBe(false);
    expect(isCollectionTradeLocked({})).toBe(false);
    // On-chain result is irrelevant for ungated collections.
    expect(isCollectionTradeLocked({ transferValidator: false }, false)).toBe(
      false,
    );
  });

  it("a gated collection is locked until approved", () => {
    expect(isCollectionTradeLocked({ transferValidator: true })).toBe(true);
    // Pending/failed on-chain read (undefined/false) keeps it locked.
    expect(isCollectionTradeLocked({ transferValidator: true }, undefined)).toBe(
      true,
    );
    expect(isCollectionTradeLocked({ transferValidator: true }, false)).toBe(
      true,
    );
  });

  it("a live on-chain approval opens a gated collection", () => {
    expect(isCollectionTradeLocked({ transferValidator: true }, true)).toBe(
      false,
    );
  });

  it("the manual settlementApproved override opens a gated collection", () => {
    expect(
      isCollectionTradeLocked({
        transferValidator: true,
        settlementApproved: true,
      }),
    ).toBe(false);
  });

  it("every gated collection starts locked with no approval signal", () => {
    const gated = FEATURED_COLLECTIONS.filter(
      (c) => c.transferValidator === true,
    );
    expect(gated.length).toBeGreaterThan(0);
    for (const c of gated) {
      expect(isCollectionTradeLocked(c)).toBe(true);
    }
  });

  it("every non-gated collection is open", () => {
    const open = FEATURED_COLLECTIONS.filter((c) => !c.transferValidator);
    expect(open.length).toBeGreaterThan(0);
    for (const c of open) {
      expect(isCollectionTradeLocked(c)).toBe(false);
    }
  });
});
