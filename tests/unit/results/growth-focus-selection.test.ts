import test from "node:test";
import assert from "node:assert/strict";
import { selectGrowthFocusItems } from "@/lib/workstyle-content";

// Fejlődési fókusz kiválasztás (motor-audit v4):
//  - FIX 2: a fordított Emocionalitás (E) nem deficit — sem a facetei,
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

test("E-facetek kimaradnak a deficit-alapú fókuszból", () => {
  const items = selectGrowthFocusItems([
    dim("E", "Emocionalitás", 25, [
      { code: "fearfulness", label: "Félelem", score: 15 },
      { code: "anxiety", label: "Szorongás", score: 20 },
    ]),
    dim("C", "Lelkiismeretesség", 55, [
      { code: "organization", label: "Szervezettség", score: 45 },
    ]),
    dim("O", "Nyitottság", 80, [
      { code: "creativity", label: "Kreativitás", score: 85 },
    ]),
  ]);

  assert.ok(items.length > 0);
  assert.ok(items.every((i) => i.dimCode !== "E"), "E-tétel a fókuszban");
  // A legalacsonyabb NEM-E facet vezet, nem a 15 pontos Félelem.
  assert.equal(items[0].code, "organization");
});

test("dimenziónként max 2 facet: nincs háromszor ismételt záró-javaslat", () => {
  // A GROWTH_HINT dimenzió-kulcsos — 3 azonos-dimenziós facet háromszor szó
  // szerint ugyanazt a mondatot zárná. A plafon után a 3. helyre a következő
  // legalacsonyabb MÁSIK dimenziós facet lép.
  const items = selectGrowthFocusItems([
    dim("C", "Lelkiismeretesség", 30, [
      { code: "organization", label: "Szervezettség", score: 20 },
      { code: "diligence", label: "Szorgalom", score: 25 },
      { code: "prudence", label: "Körültekintés", score: 28 },
    ]),
    dim("X", "Extraverzió", 50, [
      { code: "sociability", label: "Társaságkedvelés", score: 45 },
    ]),
  ]);

  assert.equal(items.length, 3);
  assert.deepEqual(
    items.map((i) => i.code),
    ["organization", "diligence", "sociability"],
  );
  const thorCount = items.filter((i) => i.dimCode === "C").length;
  assert.ok(thorCount <= 2, "kettőnél több C-facet a fókuszban");
});

test("örökség-sor (üres facets): dimenzió-fallback fut, E és koholt 0 nélkül", () => {
  const items = selectGrowthFocusItems([
    dim("E", "Emocionalitás", 20),
    dim("X", "Extraverzió", 45),
    dim("C", "Lelkiismeretesség", 50),
    dim("O", "Nyitottság", 75),
  ]);

  // Nincs facet-adat → dimenzió-szint; a 20 pontos E nem előzhet.
  assert.equal(items[0]?.dimCode, "X");
  assert.ok(items.every((i) => i.dimCode !== "E"));
  assert.ok(items.every((i) => i.score > 0), "koholt 0-pontszám a fókuszban");
});

test("facet-adat nélküli, csupa-magas profil: üres fókusz (nem 0-facetek)", () => {
  const items = selectGrowthFocusItems([
    dim("C", "Lelkiismeretesség", 78),
    dim("O", "Nyitottság", 82),
  ]);
  assert.deepEqual(items, []);
});

test("csak-E-alacsony profil: a fókusz üres, nem talál ki deficitet", () => {
  const items = selectGrowthFocusItems([
    dim("E", "Emocionalitás", 18, [
      { code: "fearfulness", label: "Félelem", score: 10 },
    ]),
    dim("C", "Lelkiismeretesség", 72, [
      { code: "organization", label: "Szervezettség", score: 74 },
    ]),
  ]);
  assert.deepEqual(items, []);
});
