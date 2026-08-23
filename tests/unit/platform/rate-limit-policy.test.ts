import test from "node:test";
import assert from "node:assert/strict";
import { FAIL_CLOSED_IN_PRODUCTION } from "@/lib/rate-limit";
import { resolveClerkCspOrigins, resolveClerkFrontendApiHost } from "@/lib/clerk-host";

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
    contact: true,
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
