import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { createLogger } from "@/lib/logger";

const log = createLogger("rate-limit");

// A library alapértelmezése 5 másodperc után fail-open választ ad. Ez túl
// hosszú egy interaktív route-nál, és a publikus/erősítő tiereknél ellentmond
// a saját fail-closed policy-nknak. A `reason: timeout` választ lent külön
// policy szerint kezeljük.
export const RATE_LIMIT_TIMEOUT_MS = 1_500;

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
    timeout: RATE_LIMIT_TIMEOUT_MS,
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
    // Publikus capability-tokenes route-ok közös IP-abúzus plafonja. Magas,
    // hogy egy 20–50 fős, közös irodai NAT mögötti pilot ne akadjon össze;
    // a szűkebb, tokenenkénti `api` limitet a checkTokenRateLimit adja mellé.
    public:  { requests: 120, window: "10 s", prefix: "rl:public" },
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
  | "public"
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
  // Auth nélküli token-végpontok közös IP-védelme.
  public: true,
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
const runtimeFailureLogged = new Set<RateLimitTier>();
type RateLimitResult = Awaited<ReturnType<Ratelimit["limit"]>>;
type RateLimitExecutor = (tier: RateLimitTier, identifier: string) => Promise<RateLimitResult>;
let testExecutor: RateLimitExecutor | null = null;

/** Teszt-seam: valódi hálózati hívás nélkül ellenőrizhető minden válaszág. */
export function __setRateLimitExecutorForTests(executor: RateLimitExecutor | null): void {
  testExecutor = executor;
  runtimeFailureLogged.clear();
  missingConfigLogged.clear();
  redis = null;
  for (const tier of Object.keys(limiters)) delete limiters[tier];
}

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
  const limiter = testExecutor ? null : getLimiter(tier);

  if (!limiter && !testExecutor) {
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

  let key = identifier;
  if (!key) {
    const headersList = await headers();
    key =
      headersList.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      headersList.get("x-real-ip") ??
      "anonymous";
  }

  let result: RateLimitResult;
  try {
    result = testExecutor
      ? await testExecutor(tier, key)
      : await limiter!.limit(key);
  } catch (err) {
    return handleRuntimeFailure(tier, "error", err);
  }

  // Az Upstash kliens a timeoutot technikailag `success: true` válaszként
  // adja vissza. A veszélyes tiereknél ezt nem szabad valódi engedélynek
  // tekinteni; ugyanaz a policy érvényes rá, mint konfigurációs hibánál.
  if (result.reason === "timeout") {
    return handleRuntimeFailure(tier, "timeout");
  }

  runtimeFailureLogged.delete(tier);
  const { success, limit, remaining, reset } = result;

  if (!success) {
    return NextResponse.json(
      { error: "RATE_LIMIT_EXCEEDED" },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": limit.toString(),
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": reset.toString(),
          "Retry-After": Math.max(1, Math.ceil((reset - Date.now()) / 1000)).toString(),
        },
      }
    );
  }

  return null;
}

function handleRuntimeFailure(
  tier: RateLimitTier,
  reason: "error" | "timeout",
  err?: unknown,
): NextResponse | null {
  const failClosed =
    process.env.NODE_ENV === "production" && FAIL_CLOSED_IN_PRODUCTION[tier];

  if (!runtimeFailureLogged.has(tier)) {
    runtimeFailureLogged.add(tier);
    const context = { event: "rate_limit.runtime_failure", tier, reason, err };
    if (failClosed) {
      log.error(context, "Rate limit backend unavailable — request rejected");
    } else {
      log.warn(context, "Rate limit backend unavailable — check skipped");
    }
  }

  if (!failClosed) return null;
  return NextResponse.json(
    { error: "RATE_LIMIT_UNAVAILABLE" },
    { status: 503, headers: { "Retry-After": "30" } },
  );
}

/**
 * Publikus capability-tokeneket soha nem küldünk nyersen az Upstashnak.
 * A hash stabil rate-limit kulcsot ad, de Redis-hozzáférésből nem állítható
 * vissza a meghívó/kitöltő token.
 */
export function hashRateLimitIdentifier(namespace: string, value: string): string {
  const digest = createHash("sha256").update(value).digest("hex").slice(0, 32);
  return `${namespace}:${digest}`;
}

/**
 * Kétrétegű védelem publikus capability-tokenes route-okhoz:
 * 1. magas IP-plafon a véletlen tokenekkel indított DB-flood ellen;
 * 2. szűk tokenenkénti keret, hogy a legitim közös NAT ne legyen közös bucket.
 */
export async function checkTokenRateLimit(
  namespace: string,
  token: string,
  publicIdentifier?: string,
): Promise<NextResponse | null> {
  const publicLimit = await checkRateLimit("public", publicIdentifier);
  if (publicLimit) return publicLimit;
  return checkRateLimit("api", hashRateLimitIdentifier(namespace, token));
}
