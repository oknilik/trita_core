import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyDevice,
  DEV_FALLBACK_SALT,
  clientIpFromHeaders,
  computeVisitorRef,
  extractUtm,
  isAnalyticsSaltConfigured,
  isBotUserAgent,
  normalizePath,
  referrerHost,
  utcDay,
} from "@/lib/analytics/context";
import { ANALYTICS_RETENTION_MONTHS, analyticsRetentionCutoff } from "@/lib/analytics/retention";

// ─────────────────────────────────────────────────────────────────────
// Az útvonal-normalizálás és a látogató-azonosító a rendszer két
// adatvédelmi ígérete. Itt őrizzük őket.
// ─────────────────────────────────────────────────────────────────────

test("a token-alapú útvonalakból SOHA nem kerül token az adatbázisba", () => {
  const cases: [string, string][] = [
    ["/observe/8f3a9b2c1d4e5f60", "/observe/[token]"],
    ["/share/abc123def456ghi789", "/share/[token]"],
    ["/join/xyz987654321abcdef", "/join/[token]"],
    ["/join/org/clv12345678901234567890", "/join/org/[inviteId]"],
    ["/apply/tokentokentoken1234", "/apply/[token]"],
    ["/hiring/clv12345678901234567890", "/hiring/[orgId]"],
    ["/interaction/compare/abc123def456", "/interaction/compare/[token]"],
  ];

  for (const [input, expected] of cases) {
    assert.equal(normalizePath(input), expected, `nem normalizált: ${input}`);
  }
});

test("a szervezet- és csapat-azonosítók helyére [id] kerül, de az al-útvonal marad", () => {
  assert.equal(normalizePath("/team/clv12345678901234567890"), "/team/[id]");
  assert.equal(normalizePath("/org/clv12345678901234567890/settings"), "/org/[id]/settings");
  assert.equal(
    normalizePath("/org/clv12345678901234567890/campaigns/clv09876543210987654321"),
    "/org/[id]/campaigns/[id]",
  );
});

test("a query string sosem kerül tárolásra", () => {
  assert.equal(normalizePath("/pricing?utm_source=hirlevel&x=titok"), "/pricing");
  assert.equal(normalizePath("/blog/valami#szakasz"), "/blog/valami");
});

test("a blog-slug megmarad – az tartalom-azonosító, nem személyes adat", () => {
  assert.equal(
    normalizePath("/blog/miert-nem-eleg-az-onertekeles"),
    "/blog/miert-nem-eleg-az-onertekeles",
  );
});

test("a publikus útvonalak érintetlenül maradnak", () => {
  for (const path of ["/", "/pricing", "/try", "/patterns", "/founding", "/contact"]) {
    assert.equal(normalizePath(path), path);
  }
});

test("a látogató-azonosító naponta rotál, és nem tartalmazza a bemenetet", () => {
  const base = { salt: "s3cret", ip: "203.0.113.7", userAgent: "Mozilla/5.0" };
  const today = computeVisitorRef({ ...base, day: "2026-08-06" });
  const tomorrow = computeVisitorRef({ ...base, day: "2026-08-07" });

  assert.notEqual(today, tomorrow, "a ref nem rotál naponta – hosszú távú profil épülne");
  assert.equal(today, computeVisitorRef({ ...base, day: "2026-08-06" }), "nem determinisztikus");
  assert.equal(today.length, 32);
  assert.match(today, /^[0-9a-f]{32}$/);
  assert.ok(!today.includes("203.0.113.7"), "az IP megjelenik a refben");
});

test("más só más azonosítót ad – a hash nem kitalálható a titok nélkül", () => {
  const base = { day: "2026-08-06", ip: "203.0.113.7", userAgent: "UA" };
  assert.notEqual(
    computeVisitorRef({ ...base, salt: "a" }),
    computeVisitorRef({ ...base, salt: "b" }),
  );
});

test("az utcDay UTC szerinti napot ad", () => {
  assert.equal(utcDay(new Date("2026-08-06T23:59:59Z")), "2026-08-06");
  assert.equal(utcDay(new Date("2026-08-07T00:00:01Z")), "2026-08-07");
});

test("eszköz-osztályozás három vödörbe sorol", () => {
  assert.equal(classifyDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0) Mobile/15E148"), "mobile");
  assert.equal(classifyDevice("Mozilla/5.0 (iPad; CPU OS 17_0) Tablet"), "tablet");
  assert.equal(classifyDevice("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"), "desktop");
  assert.equal(classifyDevice(null), "desktop");
});

test("a bot-forgalom kiszűrődik", () => {
  for (const ua of ["Googlebot/2.1", "curl/8.0", "python-requests/2.31", "HeadlessChrome", ""]) {
    assert.equal(isBotUserAgent(ua), true, `nem szűrt bot: ${ua}`);
  }
  assert.equal(isBotUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605"), false);
});

test("a hivatkozóból csak a host marad meg, a saját domain nem forrás", () => {
  assert.equal(referrerHost("https://www.google.com/search?q=titkos+kereses"), "www.google.com");
  assert.equal(referrerHost("https://trita.io/blog/valami", "trita.io"), null);
  assert.equal(referrerHost("nem-url"), null);
  assert.equal(referrerHost(null), null);
});

test("az UTM-paraméterek kinyerhetők és hosszra vágottak", () => {
  const utm = extractUtm("https://trita.io/?utm_source=hirlevel&utm_medium=email&utm_campaign=augusztus");
  assert.deepEqual(utm, {
    utmSource: "hirlevel",
    utmMedium: "email",
    utmCampaign: "augusztus",
  });
  assert.deepEqual(extractUtm(null), { utmSource: null, utmMedium: null, utmCampaign: null });
});

test("a kliens IP a szokásos proxy-fejlécekből jön", () => {
  const headers = new Map([["x-forwarded-for", "203.0.113.7, 70.41.3.18"]]);
  assert.equal(clientIpFromHeaders((n) => headers.get(n) ?? null), "203.0.113.7");
  assert.equal(clientIpFromHeaders(() => null), "unknown");
});

test("a megőrzési határ a dokumentált hónapszámot követi", () => {
  const now = new Date("2026-08-06T12:00:00Z");
  const cutoff = analyticsRetentionCutoff(now);
  const months =
    (now.getFullYear() - cutoff.getFullYear()) * 12 + (now.getMonth() - cutoff.getMonth());
  assert.equal(months, ANALYTICS_RETENTION_MONTHS);
});

// ─────────────────────────────────────────────────────────────────────
// Só-konfiguráció: a rendszer só NÉLKÜL is működik (a mérés soha nem áll
// az üzemeltetés útjába), de ilyenkor a pszeudonimitás ígérete nem
// tartható – ezért kell látható figyelmeztetés. Ez a teszt azt őrzi, hogy
// a felület egyáltalán MEG TUDJA mondani, hiányzik-e a só.
// ─────────────────────────────────────────────────────────────────────

test("a hiányzó ANALYTICS_SALT felismerhető (ebből jön az admin-figyelmeztetés)", () => {
  const previous = process.env.ANALYTICS_SALT;

  try {
    delete process.env.ANALYTICS_SALT;
    assert.equal(isAnalyticsSaltConfigured(), false, "hiányzó sót nem ismer fel");

    process.env.ANALYTICS_SALT = "   ";
    assert.equal(isAnalyticsSaltConfigured(), false, "a csupa szóköz só is hiányzónak számít");

    process.env.ANALYTICS_SALT = "a3f9c1";
    assert.equal(isAnalyticsSaltConfigured(), true);
  } finally {
    if (previous === undefined) delete process.env.ANALYTICS_SALT;
    else process.env.ANALYTICS_SALT = previous;
  }
});

test("só nélkül is képződik látogató-azonosító (a mérés nem áll le)", () => {
  // A dev-fallback só publikus, tehát a ref kitalálható – de LÉTEZIK.
  // A rendszer nem hal el tőle, csak figyelmeztet.
  const ref = computeVisitorRef({
    salt: DEV_FALLBACK_SALT,
    day: "2026-08-06",
    ip: "203.0.113.7",
    userAgent: "UA",
  });
  assert.match(ref, /^[0-9a-f]{32}$/);
});
