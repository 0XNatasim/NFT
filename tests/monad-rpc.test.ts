import { describe, expect, it } from "vitest";
import { MONAD_RPC_URL, MONAD_RPC_URLS, monad } from "@/lib/chains/monad";

describe("Monad RPC configuration", () => {
  it("prefers a healthy Monad RPC and exposes fallback endpoints", () => {
    expect(MONAD_RPC_URL).toBe("https://monad.rpc.blxrbdn.com");
    expect(MONAD_RPC_URLS).toContain("https://rpc.monad.xyz");
    expect(MONAD_RPC_URLS.length).toBeGreaterThan(1);
  });

  it("publishes the fallback list on the chain definition", () => {
    expect(monad.rpcUrls.default.http).toEqual(MONAD_RPC_URLS);
  });
});
