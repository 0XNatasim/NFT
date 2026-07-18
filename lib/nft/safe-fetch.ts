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

async function isPublicUrl(url: URL): Promise<boolean> {
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  return hostIsPublic(url.hostname);
}

/**
 * Fetch that follows redirects MANUALLY, re-validating that every hop's host
 * is public. IPFS path gateways (ipfs.io, dweb.link, nftstorage.link…)
 * legitimately 30x-redirect path CIDs to subdomain gateways, so we must follow
 * them — but doing so with `redirect: "follow"` would defeat the SSRF guard, so
 * each hop is re-checked and a redirect into a private range is refused.
 */
async function safeFetchFollow(
  url: string,
  init: RequestInit,
  maxRedirects = 4,
): Promise<Response | null> {
  let current: URL;
  try {
    current = new URL(url);
  } catch {
    return null;
  }

  for (let hop = 0; hop <= maxRedirects; hop++) {
    if (!(await isPublicUrl(current))) return null;
    let res: Response;
    try {
      res = await fetch(current.toString(), {
        ...init,
        redirect: "manual",
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
    } catch {
      return null;
    }
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get("location");
      await res.body?.cancel().catch(() => {});
      if (!location) return null;
      try {
        current = new URL(location, current);
      } catch {
        return null;
      }
      continue;
    }
    return res;
  }
  return null; // too many redirects
}

/**
 * SSRF-guarded content-type probe for an untrusted media URL. Tries HEAD,
 * then a 1-byte ranged GET for hosts that don't support HEAD. Returns the
 * Content-Type (lowercased) or null. Follows gateway redirects safely; never
 * downloads the body.
 */
export async function safeProbeContentType(url: string): Promise<string | null> {
  const read = (res: Response) =>
    (res.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();

  const head = await safeFetchFollow(url, { method: "HEAD" });
  if (head?.ok && head.headers.get("content-type")) return read(head);

  const res = await safeFetchFollow(url, {
    method: "GET",
    headers: { range: "bytes=0-0" },
  });
  if (!res) return null;
  await res.body?.cancel().catch(() => {});
  if (!res.ok && res.status !== 206) return null;
  const ct = res.headers.get("content-type");
  return ct ? read(res) : null;
}

/** Fetch untrusted metadata JSON with SSRF and size protections. */
export async function safeFetchJson(url: string): Promise<unknown | null> {
  try {
    const res = await safeFetchFollow(url, {
      headers: { accept: "application/json" },
    });
    if (!res || !res.ok) return null;

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
