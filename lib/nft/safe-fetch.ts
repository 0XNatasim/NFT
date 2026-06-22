import { lookup } from "node:dns/promises";
import { isIP } from "node:net";

/**
 * SSRF-resistant fetch for untrusted URLs returned by arbitrary NFT
 * contracts (tokenURI). Blocks non-public IP ranges, restricts schemes,
 * and caps response size.
 */

const MAX_RESPONSE_BYTES = 512 * 1024; // 512 KB is plenty for metadata JSON
const FETCH_TIMEOUT_MS = 8000;

function isPrivateIPv4(ip: string): boolean {
  const p = ip.split(".").map(Number);
  if (p.length !== 4 || p.some((n) => Number.isNaN(n))) return true;
  const [a, b] = p;
  return (
    a === 10 ||
    a === 127 ||
    a === 0 ||
    (a === 169 && b === 254) || // link-local / cloud metadata 169.254.169.254
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 168) ||
    a >= 224 // multicast / reserved
  );
}

function isPrivateIPv6(ip: string): boolean {
  const lower = ip.toLowerCase();
  return (
    lower === "::1" ||
    lower === "::" ||
    lower.startsWith("fe80") || // link-local
    lower.startsWith("fc") || // unique local
    lower.startsWith("fd") ||
    lower.startsWith("::ffff:") // IPv4-mapped — defer to v4 check upstream
  );
}

async function hostIsPublic(hostname: string): Promise<boolean> {
  // Literal IPs
  const literal = isIP(hostname);
  if (literal === 4) return !isPrivateIPv4(hostname);
  if (literal === 6) return !isPrivateIPv6(hostname);

  if (hostname === "localhost" || hostname.endsWith(".local")) return false;

  // Resolve and check every returned address.
  try {
    const records = await lookup(hostname, { all: true });
    if (records.length === 0) return false;
    return records.every((r) =>
      r.family === 6 ? !isPrivateIPv6(r.address) : !isPrivateIPv4(r.address)
    );
  } catch {
    return false;
  }
}

/** Fetch untrusted metadata JSON with SSRF and size protections. */
export async function safeFetchJson(url: string): Promise<unknown | null> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
  if (!(await hostIsPublic(parsed.hostname))) return null;

  try {
    const res = await fetch(parsed.toString(), {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      headers: { accept: "application/json" },
      redirect: "error", // don't follow redirects into private ranges
    });
    if (!res.ok) return null;

    const contentLength = Number(res.headers.get("content-length") ?? 0);
    if (contentLength > MAX_RESPONSE_BYTES) return null;

    // Stream with a hard byte cap in case content-length is absent/lying.
    const reader = res.body?.getReader();
    if (!reader) return null;
    const chunks: Uint8Array[] = [];
    let total = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_RESPONSE_BYTES) {
        await reader.cancel();
        return null;
      }
      chunks.push(value);
    }
    const text = Buffer.concat(chunks).toString("utf8");
    return JSON.parse(text);
  } catch {
    return null;
  }
}
