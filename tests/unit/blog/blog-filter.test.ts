import test from "node:test";
import assert from "node:assert/strict";
import { resolveBlogTopic, toBlogTopicParam } from "@/lib/blog-filter";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

test("a blogtema URL-parametere ekezet- es irasjel-fuggetlen", () => {
  assert.equal(
    toBlogTopicParam("Pszichológiai biztonság"),
    "pszichologiai-biztonsag",
  );
  assert.equal(toBlogTopicParam("  Team dynamics / trust  "), "team-dynamics-trust");
});

test("az URL-parametert az aktualis nyelv cimkejehez oldjuk fel", () => {
  const tags = ["Csapatdinamika", "Önértékelés", "Pszichometria"];

  assert.equal(resolveBlogTopic("onertekeles", tags), "Önértékelés");
  assert.equal(resolveBlogTopic("CSAPATDINAMIKA", tags), "Csapatdinamika");
  assert.equal(resolveBlogTopic("nem-letezo-tema", tags), null);
  assert.equal(resolveBlogTopic(null, tags), null);
});

// ── Slug → fájlút (2026-08-21, review-találat) ────────────────────────────
//
// A slug útvonal-paraméterből jön, és a Next dekódolja: a
// `placeholder%2f..%2fvalodi-cikk` alak tehát `../`-ként érkezik a
// `getPostBySlug`-ba. A `path.join` ezt engedelmesen követte, vagyis ki
// lehetett lépni a `content/blog` mappából. Ma nincs máshol csomagolt `.mdx`,
// de a lehetőség valódi volt — ezért van rá kapu és teszt.
test("a getPostBySlug nem lep ki a blog konyvtarbol", () => {
  const real = getAllPosts("hu")[0];
  assert.ok(real, "kell legalább egy publikált cikk a teszthez");

  // Ugyanaz a cikk kanonikus alakban feloldható…
  assert.equal(getPostBySlug(real!.slug)?.slug, real!.slug);

  // …de semmilyen útvonal-trükkel nem.
  for (const attack of [
    `placeholder/../${real!.slug}`,
    `../content/blog/${real!.slug}`,
    `..%2f${real!.slug}`,
    "../../package",
    "/etc/passwd",
    "foo/bar",
    "foo\\bar",
    ".",
    "..",
    "",
  ]) {
    assert.equal(getPostBySlug(attack), null, `feloldható maradt: ${attack}`);
  }
});

test("a tulzottan hosszu slug nem er el a fajlrendszerig", () => {
  assert.equal(getPostBySlug("a".repeat(121)), null);
});
