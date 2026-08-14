import test from "node:test";
import assert from "node:assert/strict";
import { dimensionDefinition, hasFacetMarker } from "@/lib/dimension-description";
import { tritanConfig } from "@/lib/questions/tritan";

// A megosztott profil (/share/[token]) a dimenzió-leírásnak csak a definíciós
// felét adja ki. A vágás a leírás szövegében lévő facet-markerhez kötött —
// ez a guardrail fogja meg, ha egy átfogalmazás elveszíti a markert (a hiba
// egyébként néma lenne: a teljes facet-felsorolás kerülne a publikus lapra).

test("minden dimenzió-leírásban felismerhető a facet-felsorolás (hu+en)", () => {
  for (const dim of tritanConfig.dimensions) {
    if (dim.code === "I") continue; // intersticiális, nem jelenik meg
    for (const [locale, description] of [
      ["hu", dim.descriptionByLocale?.hu ?? dim.description],
      ["en", dim.descriptionByLocale?.en ?? dim.description],
    ] as const) {
      assert.ok(
        hasFacetMarker(description),
        `hiányzó facet-marker: ${dim.code} / ${locale}`,
      );
      const definition = dimensionDefinition(description);
      assert.ok(definition.length > 0, `üres definíció: ${dim.code} / ${locale}`);
      assert.ok(
        definition.length < description.length,
        `a facet-felsorolás bennmaradt: ${dim.code} / ${locale}`,
      );
    }
  }
});
