/**
 * Rate limiter for API routes.
 *
 * Uses Upstash Redis (REST) when UPSTASH_REDIS_REST_URL / _TOKEN are set so
 * limits hold across serverless instances and cold starts. Falls back to a
 * process-local sliding window otherwise (fine for single-instance/dev).
 */

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const distributed = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

const buckets = new Map<string, number[]>();

function localLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const windowStart = now - windowMs;
  const hits = (buckets.get(key) ?? []).filter((t) => t > windowStart);
  if (hits.length >= limit) {
    buckets.set(key, hits);
    return { allowed: false, remaining: 0 };
  }
  hits.push(now);
  buckets.set(key, hits);
  return { allowed: true, remaining: limit - hits.length };
}

/**
 * Fixed-window counter in Redis: INCR the key, set TTL on first hit.
 * Pipelined into a single round trip. On any transport error we fail open
 * (allow) so a Redis outage can't take the whole API down.
 */
async function redisLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  const ttlSeconds = Math.max(1, Math.ceil(windowMs / 1000));
  const redisKey = `rl:${key}`;
  try {
    const res = await fetch(`${UPSTASH_URL}/pipeline`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${UPSTASH_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify([
        ["INCR", redisKey],
        ["EXPIRE", redisKey, String(ttlSeconds), "NX"],
      ]),
      cache: "no-store",
    });
    if (!res.ok) return { allowed: true, remaining: limit };
    const out = (await res.json()) as Array<{ result?: number }>;
    const count = Number(out?.[0]?.result ?? 0);
    if (count > limit) return { allowed: false, remaining: 0 };
    return { allowed: true, remaining: Math.max(0, limit - count) };
  } catch {
    return { allowed: true, remaining: limit };
  }
}

export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{ allowed: boolean; remaining: number }> {
  if (distributed) return redisLimit(key, limit, windowMs);
  return localLimit(key, limit, windowMs);
}

export function clientKey(req: Request, scope: string): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  return `${scope}:${ip}`;
}
