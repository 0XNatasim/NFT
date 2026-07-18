import { afterEach, describe, expect, it } from "vitest";
import {
  ipfsGateways,
  resolveUri,
  resolveUriCandidates,
} from "@/lib/nft/onchain-metadata";

const ORIGINAL_ENV = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("resolveUri", () => {
  it("expands ipfs://CID/path to every configured gateway", () => {
    delete process.env.IPFS_GATEWAYS;
    delete process.env.IPFS_GATEWAY;
    const candidates = resolveUriCandidates("ipfs://bafyCID/1.json");
    expect(candidates.length).toBe(ipfsGateways().length);
    // First candidate is the first configured gateway + the CID path.
    expect(candidates[0]).toBe(`${ipfsGateways()[0]}bafyCID/1.json`);
    candidates.forEach((c) => expect(c.endsWith("bafyCID/1.json")).toBe(true));
  });

  it("strips the redundant ipfs/ prefix in ipfs://ipfs/CID/path", () => {
    delete process.env.IPFS_GATEWAYS;
    delete process.env.IPFS_GATEWAY;
    expect(resolveUri("ipfs://ipfs/bafyCID/meta.json")).toBe(
      `${ipfsGateways()[0]}bafyCID/meta.json`,
    );
  });

  it("resolves ar://txid to the arweave gateway", () => {
    expect(resolveUri("ar://abc123")).toBe("https://arweave.net/abc123");
  });

  it("passes through valid https URLs unchanged", () => {
    const url = "https://cdn.example.com/logo.png?v=2";
    expect(resolveUri(url)).toBe(url);
  });

  it("passes through data: URIs unchanged", () => {
    const url = "data:application/json;base64,eyJhIjoxfQ==";
    expect(resolveUri(url)).toBe(url);
  });

  it("honors a custom comma-separated IPFS_GATEWAYS list", () => {
    process.env.IPFS_GATEWAYS = "https://g1.test/ipfs/, https://g2.test/ipfs/";
    const candidates = resolveUriCandidates("ipfs://CID");
    expect(candidates).toEqual([
      "https://g1.test/ipfs/CID",
      "https://g2.test/ipfs/CID",
    ]);
  });
});
