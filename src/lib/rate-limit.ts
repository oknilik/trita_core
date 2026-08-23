import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createLogger } from "@/lib/logger";

const log = createLogger("rate-limit");

let redis: Redis | null = null;

function getRedis(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) return null;
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
    // Diagnosztika (CSP-sértés, kliens-oldali hibajelentés): egy hibás oldal
    // sok jelentést szül, ezért bőkezű keret — de a végpont akkor sem válhat
    // erősítővé. A tier SZÁNDÉKOSAN fail-open: pont akkor kell működnie,
    // amikor a rendszerben baj van, és a hasznos terhe egy 204-es no-op.
    diagnostics: { requests: 60, window: "60 s", prefix: "rl:diag" },
  };
  const cfg = configs[tier];
  limiters[tier] = makeRatelimit(cfg.requests, cfg.window, cfg.prefix);
  return limiters[tier];
}

export type RateLimitTier =
  | "api"
  | "billing"
  | "auth"
  | "contact"
  | "analytics"
  | "newsletter"
  | "diagnostics";

/**
 * Mi történjen productionben, ha az Upstash NINCS beállítva?
 *
 * A korábbi működés minden tiernél „fail-open" volt (a hírlevél kivételével),
 * hogy egy konfigurációs hiba ne állítsa le az alkalmazást. A gond ezzel az,
 * hogy a hiány NÉMA: a végpontokon ott a `checkRateLimit` hívás, tehát
 * védettnek LÁTSZANAK, miközben Redis nélkül egyik sem korlátoz.
 *
 * Ezért a besorolás a valós kockázat mentén megy:
 *
 * · `true` (fail-closed) — BELÉPÉS NÉLKÜL hívható vagy ERŐSÍTŐ végpontok:
 *   idegen postafiókba levelet küldenek, vagy korlátlan írást engednének.
 *   Itt a néma lyuk rosszabb, mint a hangos 503 — és a 503 pont azt a
 *   konfigurációs hiányt teszi észrevehetővé, ami eddig rejtve maradt.
 *
 * · `false` (fail-open) — belépéshez kötött, „normál" mutációk. Ezeknél a
 *   visszaélés felülete eleve korlátos (kell hozzá fiók), a leállás viszont
 *   az egész appot használhatatlanná tenné.
 *
 * Ops-következmény: az `UPSTASH_REDIS_REST_URL`/`_TOKEN` NEM csak a
 * hírlevélhez kell — a teljes publikus felület előfeltétele.
 * Ld. `docs/development/launch-checklist.md`.
 */
export const FAIL_CLOSED_IN_PRODUCTION: Record<RateLimitTier, boolean> = {
  // Belépett felhasználó általános mutációi — a leállás aránytalan volna.
  api: false,
  // Parkolt billing-réteg; nincs élő hívója.
  billing: false,
  // Belépés-közeli, auth nélkül hívható.
  auth: true,
  // Levelet küld (admin-értesítő, megosztás) — erősítő.
  contact: true,
  // Auth nélküli írás az AnalyticsEvent táblába. Egy elveszett esemény
  // olcsóbb, mint egy korlátlan író-csatorna.
  analytics: true,
  // Idegen címre küld megerősítő levelet — a legrégebb óta fail-closed.
  newsletter: true,
  // Hibajelentés és CSP-sértés. Fail-OPEN: a rendszer akkor jelent, amikor
  // baj van — ha a Redis is elesett, pont a látásunkat veszítenénk el.
  // A kockázat kicsi: mindkét végpont 204-et ad, korlátozott törzsmérettel,
  // és felhasználói tartalmat nem tárol.
  diagnostics: false,
};

/**
 * Tierenként EGYSZER naplózunk hiányzó konfigurációt. Enélkül egy
 * analitika-beacon minden kérése egy-egy sort írna — a valódi jelzést pont
 * az fojtaná el, amiért naplózunk.
 */
const missingConfigLogged = new Set<RateLimitTier>();

function logMissingConfigOnce(tier: RateLimitTier, failClosed: boolean): void {
  if (missingConfigLogged.has(tier)) return;
  missingConfigLogged.add(tier);

  if (failClosed) {
    log.error(
      { event: "rate_limit.required_but_missing", tier },
      "Rate limit is not configured (UPSTASH_REDIS_REST_URL) — requests on this tier are rejected",
    );
    return;
  }
  log.warn(
    { event: "rate_limit.not_configured", tier },
    "UPSTASH_REDIS_REST_URL not configured — check skipped",
  );
}

export async function checkRateLimit(
  tier: RateLimitTier,
  identifier?: string
): Promise<NextResponse | null> {
  const limiter = getLimiter(tier);

  if (!limiter) {
    const failClosed =
      process.env.NODE_ENV === "production" && FAIL_CLOSED_IN_PRODUCTION[tier];

    if (process.env.NODE_ENV !== "development") {
      logMissingConfigOnce(tier, failClosed);
    }

    if (failClosed) {
      return NextResponse.json(
        { error: "RATE_LIMIT_UNAVAILABLE" },
        { status: 503, headers: { "Retry-After": "300" } },
      );
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
