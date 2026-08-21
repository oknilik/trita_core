import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createLogger } from "@/lib/logger";

const log = createLogger("rate-limit");

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL) return null;
  if (!redis) {
    redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL!,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    });
  }
  return redis;
}

function makeRatelimit(requests: number, window: `${number} ${"s" | "m" | "h" | "d"}`, prefix: string): Ratelimit | null {
  const r = getRedis();
  if (!r) return null;
  return new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(requests, window),
    analytics: true,
    prefix,
  });
}

// Lazily created limiters so they don't blow up if Redis isn't configured
const limiters: Record<string, Ratelimit | null> = {};

function getLimiter(tier: RateLimitTier): Ratelimit | null {
  if (tier in limiters) return limiters[tier];
  const configs: Record<RateLimitTier, { requests: number; window: `${number} ${"s" | "m" | "h" | "d"}`; prefix: string }> = {
    api:     { requests: 30, window: "10 s", prefix: "rl:api" },
    billing: { requests: 5,  window: "60 s", prefix: "rl:billing" },
    auth:    { requests: 10, window: "60 s", prefix: "rl:auth" },
    contact: { requests: 3,  window: "60 s", prefix: "rl:contact" },
    // Analitika: egy valódi munkamenet legitim módon küld sok KÖTEGELT
    // eseményt (lapváltás, tölcsér-lépések), ezért bőkezűbb keret. A cél
    // nem a felhasználó fékezése, hanem a szemét-forgalom kizárása.
    analytics: { requests: 60, window: "60 s", prefix: "rl:analytics" },
    // Hírlevél-feliratkozás: szűk keret. A végpont e-mailt küld egy
    // TETSZŐLEGES címre, tehát fékezetlenül levél-ágyúként volna használható
    // idegen postafiókok ellen. A megerősítő levél emiatt is rövid és
    // semleges hangú.
    newsletter: { requests: 3, window: "60 s", prefix: "rl:newsletter" },
  };
  const cfg = configs[tier];
  limiters[tier] = makeRatelimit(cfg.requests, cfg.window, cfg.prefix);
  return limiters[tier];
}

export type RateLimitTier = "api" | "billing" | "auth" | "contact" | "analytics" | "newsletter";

export async function checkRateLimit(
  tier: RateLimitTier,
  identifier?: string
): Promise<NextResponse | null> {
  const limiter = getLimiter(tier);

  // Upstash not configured — skip in dev, warn in prod
  if (!limiter) {
    if (process.env.NODE_ENV !== "development") {
      log.warn({ event: "rate_limit.not_configured", tier }, "UPSTASH_REDIS_REST_URL not configured — check skipped");
    }
    return null;
  }

  const headersList = await headers();
  const ip =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    headersList.get("x-real-ip") ??
    "anonymous";

  const key = identifier ?? ip;
  const { success, limit, remaining, reset } = await limiter.limit(key);

  if (!success) {
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
        },
      }
    );
  }

  return null;
}
