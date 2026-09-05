import test from "node:test";
import assert from "node:assert/strict";
import sitemap from "@/app/sitemap";
import { SEO_INTENTS } from "@/lib/seo-intents";

test("minden fő keresési céloldalnak egyedi elsődleges keresési szándéka van", () => {
  const intents = Object.values(SEO_INTENTS);
  const primaryKeywords = intents.map((intent) => intent.primary.toLocaleLowerCase("hu"));

  assert.equal(new Set(primaryKeywords).size, primaryKeywords.length);
});

test("minden keresési céloldal szerepel a sitemapben", () => {
  const sitemapPaths = new Set(sitemap().map((entry) => new URL(entry.url).pathname));

  for (const intent of Object.values(SEO_INTENTS)) {
    assert.ok(sitemapPaths.has(intent.path), `hiányzó SEO-céloldal a sitemapből: ${intent.path}`);
    assert.ok(intent.topics.length >= 2, `túl szűk témakör: ${intent.path}`);
  }
});
