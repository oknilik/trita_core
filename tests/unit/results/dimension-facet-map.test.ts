import test from "node:test";
import assert from "node:assert/strict";
import {
  TRITAN_DIMENSION_FACETS,
  TRITAN_FACETS,
  dimensionFacetNames,
  type TritanDimCode,
} from "@/lib/tritan";
import { tritanConfig } from "@/lib/questions/tritan";

// A facet-teaser (DimensionAccordion) a kanonikus térképből dolgozik — ez a
// guardrail tartja szinkronban a kérdésbank facet-kódjaival, hogy a szabad
// felhasználó ugyanazokat az alskála-neveket lássa, mint a feloldott nézet.

test("TRITAN_DIMENSION_FACETS a kérdésbank facet-kódjait tükrözi", () => {
  for (const dim of tritanConfig.dimensions) {
    if (dim.code === "I") continue; // intersticiális, nincs a teaserben
    assert.deepEqual(
      [...(TRITAN_DIMENSION_FACETS[dim.code as TritanDimCode] ?? [])],
      dim.facets?.map((f) => f.code) ?? [],
      `facet-kód eltérés: ${dim.code}`,
    );
  }
});

test("minden facet-kódhoz van hu+en név a TRITAN_FACETS-ben", () => {
  for (const codes of Object.values(TRITAN_DIMENSION_FACETS)) {
    for (const code of codes) {
      assert.ok(TRITAN_FACETS[code]?.hu, `${code} hu-név hiányzik`);
      assert.ok(TRITAN_FACETS[code]?.en, `${code} en-név hiányzik`);
    }
  }
});

test("dimensionFacetNames lokalizált neveket ad, ismeretlen kódra üreset", () => {
  assert.deepEqual(dimensionFacetNames("INTE", "hu"), [
    "Őszinteség",
    "Méltányosság",
    "Kapzsiságkerülés",
    "Szerénység",
  ]);
  assert.deepEqual(dimensionFacetNames("INTE", "en"), [
    "Sincerity",
    "Fairness",
    "Greed Avoidance",
    "Modesty",
  ]);
  assert.deepEqual(dimensionFacetNames("NOPE", "hu"), []);
});
