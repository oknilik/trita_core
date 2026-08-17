import test from "node:test";
import assert from "node:assert/strict";

// A crawler-felület (robots.txt + llms.txt) egyetlen szabálya, amit gépileg
// őrizni kell: PRIVÁT ÚTVONAL NEM SZIVÁROGHAT KI. A robots.txt-ben azért,
// mert az az indexelhetőség kapuja; az llms.txt-ben azért, mert az egy
// nyelvi modellnek szóló, explicit „ide nézz" lista — egy odakerült
// /observe/<token> vagy /profile útvonal személyes adatot mutatna meg.

import robotsRoute from "@/app/robots";
import { GET as llmsTxt } from "@/app/llms.txt/route";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

/**
 * A robots.ts preview/dev környezetben MINDENT tilt (a preview-URL nem
 * versenyezhet az éles domainnel), a teljes szabálykészlet csak élesben fut le.
 * A modul futásidőben — a hívás pillanatában — olvassa az envet, ezért elég a
 * hívás előtt beállítani.
 */
function productionRobots() {
  const previous = process.env.VERCEL_ENV;
  process.env.VERCEL_ENV = "production";
  try {
    return robotsRoute();
  } finally {
    process.env.VERCEL_ENV = previous;
  }
}

/** Bejelentkezés mögötti / token-alapú prefixek, amiknek sehol nincs helyük. */
const PRIVATE_PREFIXES = [
  "/admin",
  "/api/",
  "/blog",
  "/dashboard",
  "/hiring/",
  "/join/",
  "/manager",
  "/observe/",
  "/org",
  "/patterns",
  "/profile",
  "/share/",
  "/team",
];

test("a robots.txt külön szabályt ad az AI-keresők crawlereinek", () => {
  const result = productionRobots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  const agents = rules.flatMap((rule) =>
    Array.isArray(rule?.userAgent) ? rule.userAgent : [rule?.userAgent],
  );

  // Kereső/idéző botok: ezek hivatkoznak ránk egy konkrét felhasználói kérdésnél
  for (const agent of ["OAI-SearchBot", "PerplexityBot", "Claude-SearchBot", "Google-Extended"]) {
    assert.ok(agents.includes(agent), `hiányzó AI-crawler szabály: ${agent}`);
  }
});

test("a robots.txt minden szabálya tiltja a privát útvonalakat", () => {
  const result = productionRobots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];

  for (const rule of rules) {
    const disallow = Array.isArray(rule?.disallow)
      ? rule.disallow
      : rule?.disallow
        ? [rule.disallow]
        : [];

    for (const prefix of PRIVATE_PREFIXES) {
      assert.ok(
        disallow.includes(prefix),
        `a(z) ${JSON.stringify(rule?.userAgent)} szabályból hiányzik a tiltás: ${prefix}`,
      );
    }
  }
});

test("a robots.txt a sitemapre és a kanonikus hostra mutat", () => {
  const result = productionRobots();
  assert.ok(String(result.sitemap).endsWith("/sitemap.xml"));
  assert.ok(String(result.host).startsWith("http"));
});

test("az llms.txt nem sorol fel privát útvonalat linkként", async () => {
  const body = await llmsTxt().text();

  // Csak a markdown-linkeket nézzük: a záró „mit NE indexelj" szekció
  // szándékosan NEVESÍTI a privát prefixeket, de kódrészletként, nem linkként.
  const linkedPaths = [...body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((m) => {
    const url = new URL(m[1]);
    return url.pathname;
  });

  assert.ok(linkedPaths.length > 0, "az llms.txt egyetlen oldalt sem linkel");

  for (const path of linkedPaths) {
    for (const prefix of PRIVATE_PREFIXES) {
      assert.ok(
        !path.startsWith(prefix),
        `privát útvonal szivárgott az llms.txt-be: ${path}`,
      );
    }
  }
});

test("az llms.txt csak az aktív fő lapokat tartalmazza", async () => {
  const body = await llmsTxt().text();

  for (const path of ["/try", "/pricing", "/pilot"]) {
    assert.ok(body.includes(`${path})`), `hiányzó publikus lap az llms.txt-ből: ${path}`);
  }
  for (const path of ["/patterns", "/blog"]) {
    assert.equal(body.includes(`${path})`), false, `parkolt lap kint maradt: ${path}`);
  }
  assert.ok(body.includes("hello@trita.io"));
});

test("az aktív publikus megosztás tokenútja továbbra sem crawler-belépő", async () => {
  assert.equal(isPortfolioSurfaceActive("publicSharing"), true);
  const body = await llmsTxt().text();
  assert.equal(/\]\(https?:\/\/[^)]+\/share\//.test(body), false);

  const result = productionRobots();
  const rules = Array.isArray(result.rules) ? result.rules : [result.rules];
  for (const rule of rules) {
    const disallow = Array.isArray(rule?.disallow)
      ? rule.disallow
      : rule?.disallow
        ? [rule.disallow]
        : [];
    assert.ok(disallow.includes("/share/"));
  }
});
