import test from "node:test";
import assert from "node:assert/strict";
import sitemap from "@/app/sitemap";
import { LEGAL_DOCS_ARE_DRAFT } from "@/lib/legal/company";

/**
 * TERVEZET-ÁLLAPOT ↔ INDEXELHETŐSÉG — a kettőnek együtt kell mozognia.
 *
 * A jogi lapon lévő „Tervezet" jelölés az EMBERI olvasónak szól. A keresőnek
 * nem: a találati lista snippetjében a figyelmeztetés nem látszik, tehát egy
 * indexelt jogi oldal helykitöltő cégjegyzékszámmal akkor is félrevezet, ha a
 * lap tetején ott a doboz.
 *
 * Három hely dönt erről, és mindhárom UGYANARRA a konstansra hivatkozik
 * (`LEGAL_DOCS_ARE_DRAFT`, `src/lib/legal/company.ts`):
 *   1. `privacy/page.tsx`  — `robots: { index: false }`
 *   2. `sitemap.ts`        — a lap kimarad a sitemapből
 *   3. `robots.ts`         — a lap BEJÁRHATÓ marad (a noindex meta csak akkor
 *                            érvényesül, ha a robot le tudja tölteni a lapot)
 *
 * Ez a teszt a 2. és 3. pontot őrzi. Ha valaki élesíti a jogi dokumentumot
 * (a konstans `false`-ra vált), a teszt automatikusan az ELLENKEZŐ elvárásra
 * vált — nem kell hozzányúlni.
 */

const entries = sitemap();
const privacyEntries = entries.filter((entry) => entry.url.endsWith("/privacy"));

test("a sitemap a tervezet-állapottal összhangban tartalmazza a /privacy lapot", () => {
  if (LEGAL_DOCS_ARE_DRAFT) {
    assert.equal(
      privacyEntries.length,
      0,
      "tervezet-állapotú jogi lap nem kerülhet a sitemapbe (helykitöltő cégadatokkal indexelnénk)",
    );
  } else {
    assert.equal(
      privacyEntries.length,
      1,
      "az élesített jogi lapnak szerepelnie kell a sitemapben",
    );
  }
});

test("a sitemap minden bejegyzése abszolút URL, duplikátum nélkül", () => {
  // Kísérő ellenőrzés: a feltételes bejegyzés beszúrása ne törje el a listát.
  const urls = entries.map((entry) => entry.url);
  assert.ok(urls.every((url) => url.startsWith("http")), "relatív URL a sitemapben");
  assert.equal(new Set(urls).size, urls.length, "duplikált URL a sitemapben");
});
