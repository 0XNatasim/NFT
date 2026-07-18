import { NextResponse } from "next/server";

/**
 * Same-origin IPFS proxy: /api/ipfs/<CID>/<path>
 *
 * Fetches IPFS content server-side from a set of public gateways (first
 * healthy one wins) and streams it back from our own domain. Because the
 * response is immutable (IPFS is content-addressed) it's returned with a long
 * CDN cache, so after the first hit the platform CDN serves it — dodging the
 * per-visitor rate limits that make public gateways flaky for whole
 * collections (e.g. 10kSquad), with no paid/dedicated gateway required.
 *
 * SSRF-safe: only fixed public gateways are contacted, and the first path
 * segment must be a valid CID.
 */

const GATEWAYS = [
  "https://ipfs.io/ipfs/",
  "https://dweb.link/ipfs/",
  "https://nftstorage.link/ipfs/",
  "https://gateway.pinata.cloud/ipfs/",
  "https://4everland.io/ipfs/",
];

const FETCH_TIMEOUT_MS = 15_000;
const MAX_BYTES = 30 * 1024 * 1024; // 30 MB — generous for NFT art

// CIDv0 (Qm…) or CIDv1 (base32, starts with b…).
const CID_RE = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|b[a-z2-7]{20,})$/;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;
  if (!path || path.length === 0) {
    return new NextResponse("Not found", { status: 404 });
  }
  const cid = path[0]!;
  if (!CID_RE.test(cid)) {
    return new NextResponse("Invalid CID", { status: 400 });
  }

  const rest = path.map(encodeURIComponent).join("/");
  const search = new URL(req.url).search;

  for (const gateway of GATEWAYS) {
    try {
      const upstream = await fetch(`${gateway}${rest}${search}`, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        redirect: "follow",
        headers: { accept: "*/*" },
      });
      if (!upstream.ok || !upstream.body) continue;

      const contentLength = Number(upstream.headers.get("content-length") ?? 0);
      if (contentLength > MAX_BYTES) {
        await upstream.body.cancel().catch(() => {});
        continue;
      }

      const contentType =
        upstream.headers.get("content-type") ?? "application/octet-stream";

      return new NextResponse(upstream.body, {
        status: 200,
        headers: {
          "content-type": contentType,
          // IPFS content is immutable; let the CDN cache it aggressively.
          "cache-control":
            "public, max-age=86400, s-maxage=31536000, stale-while-revalidate=86400, immutable",
        },
      });
    } catch {
      // try the next gateway
    }
  }

  return new NextResponse("IPFS content unavailable", { status: 502 });
}
