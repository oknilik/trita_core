import test from "node:test";
import assert from "node:assert/strict";
import {
  HEXACO_DIMENSION_FACETS,
  HEXACO_FACETS,
  dimensionFacetNames,
  type HexacoCode,
} from "@/lib/hexaco";
import { tritanConfig } from "@/lib/questions/tritan";

// A facet-teaser (DimensionAccordion) a kanonikus térképből dolgozik — ez a
// guardrail tartja szinkronban a kérdésbank facet-kódjaival, hogy a szabad
// felhasználó ugyanazokat az alskála-neveket lássa, mint a feloldott nézet.

test("HEXACO_DIMENSION_FACETS a kérdésbank facet-kódjait tükrözi", () => {
  for (const dim of tritanConfig.dimensions) {
    if (dim.code === "I") continue; // intersticiális, nincs a teaserben
    assert.deepEqual(
      [...(HEXACO_DIMENSION_FACETS[dim.code as HexacoCode] ?? [])],
      dim.facets?.map((f) => f.code) ?? [],
      `facet-kód eltérés: ${dim.code}`,
    );
  }
});

test("HEXACO_FACETS NEVEI a kérdésbank labeljeit tükrözik (hu+en)", () => {
  // A kódok egyezése kevés: a zárt teaser (tritan.ts nevek) és a feloldott
  // akkordeon (bank-labelek) NÉV-driftjét is fogni kell – korábban a
  // greed_avoidance („Kapzsiságkerülés" vs „Mohóságkerülés") és a
  // forgiveness („Forgivingness" vs „Forgiveness") némán széttartott.
  for (const dim of tritanConfig.dimensions) {
    if (dim.code === "I") continue;
    for (const facet of dim.facets ?? []) {
      assert.equal(
        HEXACO_FACETS[facet.code]?.hu,
        facet.labelByLocale?.hu ?? facet.label,
        `hu facet-név eltérés: ${dim.code}/${facet.code}`,
      );
      assert.equal(
        HEXACO_FACETS[facet.code]?.en,
        facet.labelByLocale?.en ?? facet.label,
        `en facet-név eltérés: ${dim.code}/${facet.code}`,
      );
    }
  }
});

test("minden facet-kódhoz van hu+en név a HEXACO_FACETS-ben", () => {
  for (const codes of Object.values(HEXACO_DIMENSION_FACETS)) {
    for (const code of codes) {
      assert.ok(HEXACO_FACETS[code]?.hu, `${code} hu-név hiányzik`);
      assert.ok(HEXACO_FACETS[code]?.en, `${code} en-név hiányzik`);
    }
  }
});

test("dimensionFacetNames lokalizált neveket ad, ismeretlen kódra üreset", () => {
  assert.deepEqual(dimensionFacetNames("H", "hu"), [
    "Őszinteség",
    "Méltányosság",
    "Mohóságkerülés",
    "Szerénység",
  ]);
  assert.deepEqual(dimensionFacetNames("H", "en"), [
    "Sincerity",
    "Fairness",
    "Greed Avoidance",
    "Modesty",
  ]);
  assert.deepEqual(dimensionFacetNames("NOPE", "hu"), []);
});
