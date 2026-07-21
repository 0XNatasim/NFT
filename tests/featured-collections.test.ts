import { describe, it, expect } from "vitest";
import {
  FEATURED_COLLECTIONS,
  collectionTradeStatus,
} from "@/lib/featured-collections";

describe("collectionTradeStatus", () => {
  it("gated collection with neither approval is locked (red)", () => {
    expect(
      collectionTradeStatus(
        { transferValidator: true },
        { validatorApproved: false, handshakeAllowed: false },
      ),
    ).toBe("locked");
    // Missing signals default to not-approved.
    expect(collectionTradeStatus({ transferValidator: true })).toBe("locked");
  });

  it("gated collection with exactly one approval is pending (yellow)", () => {
    expect(
      collectionTradeStatus(
        { transferValidator: true },
        { validatorApproved: true, handshakeAllowed: false },
      ),
    ).toBe("pending");
    expect(
      collectionTradeStatus(
        { transferValidator: true },
        { validatorApproved: false, handshakeAllowed: true },
      ),
    ).toBe("pending");
  });

  it("gated collection with both approvals is open (green)", () => {
    expect(
      collectionTradeStatus(
        { transferValidator: true },
        { validatorApproved: true, handshakeAllowed: true },
      ),
    ).toBe("open");
  });

  it("manual settlementApproved override satisfies the validator condition", () => {
    // Validator approved manually, Handshake allow still missing → pending.
    expect(
      collectionTradeStatus(
        { transferValidator: true, settlementApproved: true },
        { handshakeAllowed: false },
      ),
    ).toBe("pending");
    // Both satisfied → open.
    expect(
      collectionTradeStatus(
        { transferValidator: true, settlementApproved: true },
        { handshakeAllowed: true },
      ),
    ).toBe("open");
  });

  it("non-validator collection needs only the Handshake allowlist", () => {
    // No validator gate → validator condition is always met.
    expect(
      collectionTradeStatus(
        { transferValidator: false },
        { handshakeAllowed: true },
      ),
    ).toBe("open");
    // Not yet allowlisted → pending, never locked (nothing else to approve).
    expect(
      collectionTradeStatus(
        { transferValidator: false },
        { handshakeAllowed: false },
      ),
    ).toBe("pending");
  });

  it("with no live signals, gated collections are locked and open ones pending", () => {
    for (const c of FEATURED_COLLECTIONS) {
      const status = collectionTradeStatus(c);
      expect(status).toBe(c.transferValidator ? "locked" : "pending");
    }
  });
});
