import test from "node:test";
import assert from "node:assert/strict";
import sitemap from "@/app/sitemap";

/**
 * Az adatvédelmi tájékoztató valós cégadatokkal éles, ezért indexelhető és a
 * sitemap stabil része. A teszt azt őrzi, hogy későbbi refaktor ne ejtse ki.
 */

const entries = sitemap();
const privacyEntries = entries.filter((entry) => entry.url.endsWith("/privacy"));
const legalEntries = entries.filter((entry) => entry.url.includes("/legal"));

test("az éles adatvédelmi tájékoztató szerepel a sitemapben", () => {
  assert.equal(privacyEntries.length, 1, "az éles jogi lapnak szerepelnie kell a sitemapben");
});

test("a hatályos jogi gyűjtő és mindhárom dokumentum szerepel a sitemapben", () => {
  assert.deepEqual(
    legalEntries.map((entry) => new URL(entry.url).pathname).sort(),
    ["/legal", "/legal/business-terms", "/legal/dpa", "/legal/platform-terms"],
  );
});

test("a sitemap minden bejegyzése abszolút URL, duplikátum nélkül", () => {
  // Kísérő ellenőrzés: a feltételes bejegyzés beszúrása ne törje el a listát.
  const urls = entries.map((entry) => entry.url);
  assert.ok(urls.every((url) => url.startsWith("http")), "relatív URL a sitemapben");
  assert.equal(new Set(urls).size, urls.length, "duplikált URL a sitemapben");
});
