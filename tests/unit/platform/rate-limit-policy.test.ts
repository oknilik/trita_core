import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  __setRateLimitExecutorForTests,
  checkRateLimit,
  checkTokenRateLimit,
  FAIL_CLOSED_IN_PRODUCTION,
  hashRateLimitIdentifier,
  RATE_LIMIT_TIMEOUT_MS,
} from "@/lib/rate-limit";
import { resolveClerkCspOrigins, resolveClerkFrontendApiHost } from "@/lib/clerk-host";

function setNodeEnv(value: string | undefined): void {
  const env = process.env as Record<string, string | undefined>;
  if (value === undefined) delete env.NODE_ENV;
  else env.NODE_ENV = value;
}

// ─────────────────────────────────────────────────────────────────────
// Döntés-zár: melyik rate-limit tier fail-closed élesben, ha az Upstash
// nincs beállítva. Ez NEM tautológia — a tábla átírása némán nyitna ki egy
// belépés nélkül hívható, levelet küldő végpontot, és a review-ban egy
// `false` átírása nem tűnne fel. Ez a teszt teszi láthatóvá.
// ─────────────────────────────────────────────────────────────────────

test("a belépés nélkül hívható / erősítő tierek élesben fail-closed-ok", () => {
  assert.deepEqual(FAIL_CLOSED_IN_PRODUCTION, {
    api: false,
    billing: false,
    auth: true,
    public: true,
    contact: true,
    invite: true,
    analytics: true,
    newsletter: true,
    // A diagnosztika kivétel: hibajelentés és CSP-sértés akkor kell a
    // legjobban, amikor épp baj van — ott a néma eldobás rosszabb, mint a
    // korlátozás hiánya.
    diagnostics: false,
  });
});

test("minden tiernek van kimondott döntése (nincs undefined ág)", () => {
  for (const [tier, value] of Object.entries(FAIL_CLOSED_IN_PRODUCTION)) {
    assert.equal(typeof value, "boolean", `${tier} tier döntése hiányzik`);
  }
});

test("a capability-token rate-limit kulcsa stabil hash, nem tartalmazza a tokent", () => {
  const token = "titkos-meghivo-token";
  const first = hashRateLimitIdentifier("observer", token);
  const second = hashRateLimitIdentifier("observer", token);
  assert.equal(first, second);
  assert.match(first, /^observer:[a-f0-9]{32}$/);
  assert.equal(first.includes(token), false);
  assert.notEqual(first, hashRateLimitIdentifier("candidate", token));
});

test("hiányzó production konfigurációnál a veszélyes tier 503, az api fail-open", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousUrl = process.env.UPSTASH_REDIS_REST_URL;
  const previousToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  const env = process.env as Record<string, string | undefined>;
  setNodeEnv("production");
  delete env.UPSTASH_REDIS_REST_URL;
  delete env.UPSTASH_REDIS_REST_TOKEN;
  __setRateLimitExecutorForTests(null);

  try {
    const unavailable = await checkRateLimit("contact", "test-user");
    assert.equal(unavailable?.status, 503);
    assert.equal(unavailable?.headers.get("Retry-After"), "300");
    assert.equal(await checkRateLimit("api", "test-user"), null);
  } finally {
    if (previousUrl === undefined) delete env.UPSTASH_REDIS_REST_URL;
    else env.UPSTASH_REDIS_REST_URL = previousUrl;
    if (previousToken === undefined) delete env.UPSTASH_REDIS_REST_TOKEN;
    else env.UPSTASH_REDIS_REST_TOKEN = previousToken;
    setNodeEnv(previousNodeEnv);
    __setRateLimitExecutorForTests(null);
  }
});

test("az Upstash timeout rövid, és a publikus tierben kontrollált 503", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  setNodeEnv("production");
  assert.equal(RATE_LIMIT_TIMEOUT_MS, 1_500);

  __setRateLimitExecutorForTests(async () => ({
    success: true,
    limit: 0,
    remaining: 0,
    reset: 0,
    pending: Promise.resolve(),
    reason: "timeout",
  }));

  try {
    const response = await checkRateLimit("contact", "test-user");
    assert.equal(response?.status, 503);
    assert.equal(response?.headers.get("Retry-After"), "30");

    // A diagnosztika policy szerint fail-open marad: Redis-hiba közben is
    // tudjon CSP/client-error jelentést fogadni.
    assert.equal(await checkRateLimit("diagnostics", "test-client"), null);
  } finally {
    __setRateLimitExecutorForTests(null);
    setNodeEnv(previousNodeEnv);
  }
});

test("a Redis kivétel tierenként fail-closed vagy fail-open", async () => {
  const previousNodeEnv = process.env.NODE_ENV;
  setNodeEnv("production");
  __setRateLimitExecutorForTests(async () => {
    throw new Error("redis unavailable");
  });

  try {
    assert.equal((await checkRateLimit("newsletter", "test-email"))?.status, 503);
    assert.equal(await checkRateLimit("api", "test-user"), null);
  } finally {
    __setRateLimitExecutorForTests(null);
    setNodeEnv(previousNodeEnv);
  }
});

test("a limiter elutasítása 429-et és használható retry fejléceket ad", async () => {
  const reset = Date.now() + 5_000;
  __setRateLimitExecutorForTests(async () => ({
    success: false,
    limit: 3,
    remaining: 0,
    reset,
    pending: Promise.resolve(),
  }));

  try {
    const response = await checkRateLimit("contact", "test-user");
    assert.equal(response?.status, 429);
    assert.equal(response?.headers.get("X-RateLimit-Limit"), "3");
    assert.equal(response?.headers.get("X-RateLimit-Remaining"), "0");
    assert.equal(response?.headers.get("X-RateLimit-Reset"), reset.toString());
    assert.ok(Number(response?.headers.get("Retry-After")) >= 1);
    assert.deepEqual(await response?.json(), { error: "RATE_LIMIT_EXCEEDED" });
  } finally {
    __setRateLimitExecutorForTests(null);
  }
});

test("a tokenes limiter előbb IP-, majd hash-elt tokenkeretet ellenőriz", async () => {
  const calls: Array<{ tier: string; identifier: string }> = [];
  __setRateLimitExecutorForTests(async (tier, identifier) => {
    calls.push({ tier, identifier });
    return {
      success: true,
      limit: 30,
      remaining: 29,
      reset: Date.now() + 10_000,
      pending: Promise.resolve(),
    };
  });

  try {
    assert.equal(
      await checkTokenRateLimit("observer", "nyers-token", "ip:203.0.113.1"),
      null,
    );
    assert.deepEqual(calls, [
      { tier: "public", identifier: "ip:203.0.113.1" },
      { tier: "api", identifier: hashRateLimitIdentifier("observer", "nyers-token") },
    ]);
    assert.equal(calls.some((call) => call.identifier.includes("nyers-token")), false);
  } finally {
    __setRateLimitExecutorForTests(null);
  }
});

test("az ismételhető e-mail route-ok a fail-closed contact tiert használják", () => {
  const routes = [
    "src/app/api/team/pending-invite/[id]/resend/route.ts",
    "src/app/api/manager/candidates/route.ts",
    "src/app/api/manager/candidates/[id]/resend/route.ts",
    "src/app/api/hiring/request-credits/route.ts",
    "src/app/api/observer/invite/route.ts",
    "src/app/api/observer/invite/[id]/decision/route.ts",
    "src/app/api/admin/consultants/route.ts",
    "src/app/api/admin/send-reminder/[id]/route.ts",
    "src/app/api/admin/send-draft-reminder/[id]/route.ts",
  ];

  for (const route of routes) {
    const source = readFileSync(join(process.cwd(), route), "utf8");
    assert.match(source, /checkRateLimit\([\s\S]{0,80}"contact"/, `${route} nem contact tier`);
  }
});

test("a bulk invite saját fail-closed tierben fut, nem a 3/perces contact keretben", () => {
  const routes = [
    "src/app/api/org/[id]/invite/route.ts",
    "src/app/api/team/[id]/invite/route.ts",
  ];
  for (const route of routes) {
    const source = readFileSync(join(process.cwd(), route), "utf8");
    assert.match(source, /checkRateLimit\("invite"/, `${route} nem invite tier`);
  }
});

// ─────────────────────────────────────────────────────────────────────
// Clerk-host feloldás a publishable key-ből (a preconnect fejléc és a CSP
// forrása). A bedrótozott dev-host volt az eredeti hiba — ezek a tesztek
// rögzítik, hogy a feloldás a kulcsból megy, és hogy szemétre nem dob.
// ─────────────────────────────────────────────────────────────────────

/** base64("clerk.trita.io$") — éles instance saját domainen. */
const LIVE_KEY = `pk_live_${Buffer.from("clerk.trita.io$").toString("base64")}`;
/** base64("perfect-elf-67.clerk.accounts.dev$") — fejlesztői instance. */
const DEV_KEY = `pk_test_${Buffer.from("perfect-elf-67.clerk.accounts.dev$").toString("base64")}`;

test("az éles kulcsból a saját domain oldódik fel", () => {
  assert.equal(resolveClerkFrontendApiHost(LIVE_KEY), "clerk.trita.io");
});

test("a dev kulcsból az accounts.dev aldomain oldódik fel", () => {
  assert.equal(resolveClerkFrontendApiHost(DEV_KEY), "perfect-elf-67.clerk.accounts.dev");
});

test("hiányzó vagy értelmezhetetlen kulcs null-t ad, nem dob", () => {
  assert.equal(resolveClerkFrontendApiHost(undefined), null);
  assert.equal(resolveClerkFrontendApiHost(""), null);
  assert.equal(resolveClerkFrontendApiHost("nem_clerk_kulcs"), null);
  assert.equal(resolveClerkFrontendApiHost("pk_live_"), null);
  // Base64-ként dekódolható, de nem host — nem kerülhet fejlécbe/CSP-be.
  assert.equal(
    resolveClerkFrontendApiHost(`pk_live_${Buffer.from("nem host; script-src *$").toString("base64")}`),
    null,
  );
});

test("az éles host a CSP-origin listába kerül, a wildcardok mellé", () => {
  const origins = resolveClerkCspOrigins(LIVE_KEY);
  assert.ok(origins.includes("https://clerk.trita.io"));
  assert.ok(origins.includes("https://*.clerk.accounts.dev"));
  assert.ok(origins.includes("https://*.clerk.com"));
});

test("a dev hostot a wildcard már fedi — nem duplikálunk", () => {
  assert.deepEqual(resolveClerkCspOrigins(DEV_KEY), [
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
  ]);
});

test("kulcs nélkül is használható CSP-lista jön vissza", () => {
  assert.deepEqual(resolveClerkCspOrigins(undefined), [
    "https://*.clerk.accounts.dev",
    "https://*.clerk.com",
  ]);
});
