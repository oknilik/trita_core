import test from "node:test";
import assert from "node:assert/strict";
import { selectGrowthFocusItems } from "@/lib/workstyle-content";

// Fejlődési fókusz kiválasztás (motor-audit v4):
//  - FIX 2: a fordított Emocionalitás (RESO) nem deficit — sem a facetei,
//    sem a dimenzió nem kerülhet a „legalacsonyabb = fejlesztendő" listába
//    (egy stabil kitöltő 1. fejlődési területe korábban a Félelem lett, a
//    magas-emocionalitás stresszkezelő tanácsával).
//  - FIX 4: örökség-sorban nincs facet-bontás — a hiányzó facet NEM 0 pont;
//    koholt 0-facet nem választható fókusznak.

interface DimInput {
  code: string;
  label: string;
  color: string;
  score: number;
  facets: { code: string; label: string; score: number }[];
}

function dim(
  code: string,
  label: string,
  score: number,
  facets: { code: string; label: string; score: number }[] = [],
): DimInput {
  return { code, label, color: "#000", score, facets };
}

test("RESO-facetek kimaradnak a deficit-alapú fókuszból", () => {
  const items = selectGrowthFocusItems([
    dim("RESO", "Emocionalitás", 25, [
      { code: "fearfulness", label: "Félelem", score: 15 },
      { code: "anxiety", label: "Szorongás", score: 20 },
    ]),
    dim("THOR", "Lelkiismeretesség", 55, [
      { code: "organization", label: "Szervezettség", score: 45 },
    ]),
    dim("OPEN", "Nyitottság", 80, [
      { code: "creativity", label: "Kreativitás", score: 85 },
    ]),
  ]);

  assert.ok(items.length > 0);
  assert.ok(items.every((i) => i.dimCode !== "RESO"), "RESO-tétel a fókuszban");
  // A legalacsonyabb NEM-RESO facet vezet, nem a 15 pontos Félelem.
  assert.equal(items[0].code, "organization");
});

test("örökség-sor (üres facets): dimenzió-fallback fut, RESO és koholt 0 nélkül", () => {
  const items = selectGrowthFocusItems([
    dim("RESO", "Emocionalitás", 20),
    dim("TEMP", "Extraverzió", 45),
    dim("THOR", "Lelkiismeretesség", 50),
    dim("OPEN", "Nyitottság", 75),
  ]);

  // Nincs facet-adat → dimenzió-szint; a 20 pontos RESO nem előzhet.
  assert.equal(items[0]?.dimCode, "TEMP");
  assert.ok(items.every((i) => i.dimCode !== "RESO"));
  assert.ok(items.every((i) => i.score > 0), "koholt 0-pontszám a fókuszban");
});

test("facet-adat nélküli, csupa-magas profil: üres fókusz (nem 0-facetek)", () => {
  const items = selectGrowthFocusItems([
    dim("THOR", "Lelkiismeretesség", 78),
    dim("OPEN", "Nyitottság", 82),
  ]);
  assert.deepEqual(items, []);
});

test("csak-RESO-alacsony profil: a fókusz üres, nem talál ki deficitet", () => {
  const items = selectGrowthFocusItems([
    dim("RESO", "Emocionalitás", 18, [
      { code: "fearfulness", label: "Félelem", score: 10 },
    ]),
    dim("THOR", "Lelkiismeretesség", 72, [
      { code: "organization", label: "Szervezettség", score: 74 },
    ]),
  ]);
  assert.deepEqual(items, []);
});
