type Bucket = {
  count: number;
  windowStart: number;
};

const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 60_000;
let lastSweep = Date.now();

function sweep(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, b] of buckets) {
    if (now - b.windowStart > 60_000) buckets.delete(key);
  }
}

export interface RateLimitResult {
  ok: boolean;
  remaining: number;
  resetMs: number;
  retryAfterSec: number;
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const b = buckets.get(key);
  if (!b || now - b.windowStart >= windowMs) {
    buckets.set(key, { count: 1, windowStart: now });
    return { ok: true, remaining: limit - 1, resetMs: windowMs, retryAfterSec: 0 };
  }

  if (b.count >= limit) {
    const resetMs = windowMs - (now - b.windowStart);
    return { ok: false, remaining: 0, resetMs, retryAfterSec: Math.ceil(resetMs / 1000) };
  }

  b.count += 1;
  return { ok: true, remaining: limit - b.count, resetMs: windowMs - (now - b.windowStart), retryAfterSec: 0 };
}

export function getClientIp(req: Request, headers: Headers): string {
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim();
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  return "unknown";
}

export const LIMITS = {
  read: { count: 30, windowMs: 1_000 },
  write: { count: 5, windowMs: 1_000 },
  create: { count: 3, windowMs: 10_000 },
  verify: { count: 10, windowMs: 60_000 },
} as const;
