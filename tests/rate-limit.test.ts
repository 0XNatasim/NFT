import { describe, expect, it } from "vitest";
import { clientIp, clientKey } from "@/lib/rate-limit";

function reqWith(headers: Record<string, string>): Request {
  return new Request("https://example.com/api/offers", { headers });
}

describe("clientIp", () => {
  it("prefers x-real-ip (proxy-set, not client-spoofable)", () => {
    const req = reqWith({
      "x-real-ip": "203.0.113.7",
      // A client-injected forwarded chain must be ignored when x-real-ip exists.
      "x-forwarded-for": "1.2.3.4, 203.0.113.7",
    });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("uses the rightmost x-forwarded-for entry (the trusted proxy hop)", () => {
    // The leftmost value is attacker-controlled; the real peer IP is appended
    // to the right by our single trusted proxy.
    const req = reqWith({ "x-forwarded-for": "9.9.9.9, 203.0.113.7" });
    expect(clientIp(req)).toBe("203.0.113.7");
  });

  it("does not let a spoofed leftmost XFF mint a fresh bucket", () => {
    // Same real peer, different attacker-supplied leftmost values must collapse
    // to the same rate-limit key.
    const a = clientKey(reqWith({ "x-forwarded-for": "1.1.1.1, 203.0.113.7" }), "create-offer");
    const b = clientKey(reqWith({ "x-forwarded-for": "2.2.2.2, 203.0.113.7" }), "create-offer");
    expect(a).toBe(b);
    expect(a).toBe("create-offer:203.0.113.7");
  });

  it("falls back to 'unknown' when no forwarding headers are present", () => {
    expect(clientIp(reqWith({}))).toBe("unknown");
  });

  it("trims whitespace around header values", () => {
    expect(clientIp(reqWith({ "x-real-ip": "  203.0.113.7  " }))).toBe("203.0.113.7");
  });
});
