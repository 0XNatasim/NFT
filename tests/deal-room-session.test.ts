import { beforeAll, describe, expect, it } from "vitest";
import {
  buildSessionMessage,
  issueSessionToken,
  sessionTimestampFresh,
  sessionWalletFromRequest,
  verifySessionToken,
  SESSION_TTL_MS,
} from "@/lib/deal-rooms/session";

const WALLET = "0xabcdefabcdefabcdefabcdefabcdefabcdefabcd";

beforeAll(() => {
  process.env.ROOM_SESSION_SECRET = "test-secret-at-least-16-chars";
});

describe("session message", () => {
  it("states explicitly that it authorizes no asset movement", () => {
    const msg = buildSessionMessage({ walletAddress: WALLET, timestamp: 1 });
    expect(msg).toContain("does NOT approve, transfer, or trade");
    expect(msg).toContain(WALLET.toLowerCase());
    expect(msg).toContain("Timestamp: 1");
  });

  it("rejects stale timestamps beyond the skew window", () => {
    const now = Date.now();
    expect(sessionTimestampFresh(now, now)).toBe(true);
    expect(sessionTimestampFresh(now - 4 * 60_000, now)).toBe(true);
    expect(sessionTimestampFresh(now - 6 * 60_000, now)).toBe(false);
    expect(sessionTimestampFresh(now + 6 * 60_000, now)).toBe(false);
    expect(sessionTimestampFresh(NaN, now)).toBe(false);
  });
});

describe("session token", () => {
  it("round-trips a wallet address", () => {
    const { token } = issueSessionToken(WALLET);
    expect(verifySessionToken(token)).toBe(WALLET.toLowerCase());
  });

  it("expires after the TTL", () => {
    const now = 1_700_000_000_000;
    const { token } = issueSessionToken(WALLET, now);
    expect(verifySessionToken(token, now + SESSION_TTL_MS - 1)).toBe(
      WALLET.toLowerCase()
    );
    expect(verifySessionToken(token, now + SESSION_TTL_MS + 1)).toBeNull();
  });

  it("rejects tampered payloads (wallet swap)", () => {
    const { token } = issueSessionToken(WALLET);
    const [, mac] = [token.slice(0, token.lastIndexOf(".")), token.slice(token.lastIndexOf(".") + 1)];
    const forgedPayload = Buffer.from(
      JSON.stringify({
        w: "0x1111111111111111111111111111111111111111",
        exp: Date.now() + 60_000,
      })
    ).toString("base64url");
    expect(verifySessionToken(`${forgedPayload}.${mac}`)).toBeNull();
  });

  it("rejects tampered MACs, malformed tokens, and null", () => {
    const { token } = issueSessionToken(WALLET);
    expect(verifySessionToken(`${token}x`)).toBeNull();
    expect(verifySessionToken("not-a-token")).toBeNull();
    expect(verifySessionToken("")).toBeNull();
    expect(verifySessionToken(null)).toBeNull();
    expect(verifySessionToken(undefined)).toBeNull();
  });

  it("rejects a payload whose wallet is not a valid address", () => {
    // Forge a full token with the real secret but junk wallet — the HMAC
    // passes, the shape check must still reject it.
    const { createHmac } = require("node:crypto");
    const payload = Buffer.from(
      JSON.stringify({ w: "not-an-address", exp: Date.now() + 60_000 })
    ).toString("base64url");
    const mac = createHmac("sha256", process.env.ROOM_SESSION_SECRET!)
      .update(payload)
      .digest("base64url");
    expect(verifySessionToken(`${payload}.${mac}`)).toBeNull();
  });
});

describe("sessionWalletFromRequest", () => {
  it("extracts the wallet from a Bearer header", () => {
    const { token } = issueSessionToken(WALLET);
    const req = new Request("https://x.test/api/deal-rooms", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect(sessionWalletFromRequest(req)).toBe(WALLET.toLowerCase());
  });

  it("returns null without a header or with a non-Bearer scheme", () => {
    expect(
      sessionWalletFromRequest(new Request("https://x.test/api/deal-rooms"))
    ).toBeNull();
    const req = new Request("https://x.test/api/deal-rooms", {
      headers: { authorization: "Basic abc" },
    });
    expect(sessionWalletFromRequest(req)).toBeNull();
  });
});
