/**
 * In-memory sliding window rate limiter for API routes.
 * Suitable for Vercel serverless (per-instance limiting).
 * For distributed rate limiting, consider Upstash Redis.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up expired entries every 60 seconds
const CLEANUP_INTERVAL = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt < now) store.delete(key);
  }
}

interface RateLimitConfig {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();
  const now = Date.now();
  const windowMs = config.windowSec * 1000;
  const entry = store.get(key);

  if (!entry || entry.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { success: true, limit: config.limit, remaining: config.limit - 1, resetAt: now + windowMs };
  }

  entry.count++;
  if (entry.count > config.limit) {
    return { success: false, limit: config.limit, remaining: 0, resetAt: entry.resetAt };
  }

  return { success: true, limit: config.limit, remaining: config.limit - entry.count, resetAt: entry.resetAt };
}

/** Get client IP from request headers (works on Vercel) */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

/** Pre-configured rate limit configs */
export const RATE_LIMITS = {
  /** General API: 60 req/min */
  api: { limit: 60, windowSec: 60 },
  /** Auth endpoints: 10 req/min (anti brute-force) */
  auth: { limit: 10, windowSec: 60 },
  /** AI review: 5 req/min (expensive operation) */
  ai: { limit: 5, windowSec: 60 },
  /** Document send: 20 req/min */
  send: { limit: 20, windowSec: 60 },
  /** Billing: 10 req/min */
  billing: { limit: 10, windowSec: 60 },
  /** OTP: 5 req/min (anti brute-force) */
  otp: { limit: 5, windowSec: 60 },
  /** Webhook: 100 req/min (Stripe sends bursts) */
  webhook: { limit: 100, windowSec: 60 },
} as const;

/** Helper: returns 429 Response if rate limited */
export function rateLimitResponse(result: RateLimitResult): Response | null {
  if (result.success) return null;
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again later." }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(Math.ceil((result.resetAt - Date.now()) / 1000)),
        "X-RateLimit-Limit": String(result.limit),
        "X-RateLimit-Remaining": "0",
        "X-RateLimit-Reset": String(Math.ceil(result.resetAt / 1000)),
      },
    }
  );
}
