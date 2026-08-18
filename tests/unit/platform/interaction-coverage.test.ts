import test from "node:test";
import assert from "node:assert/strict";
import { HEXACO_DIMENSION_FACETS, HEXACO_ORDER } from "@/lib/hexaco";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
import { GAP_ATOMS } from "@/lib/interaction-atoms";
import {
  MAX_FACET_NUANCES,
  archetypePrototype,
  simulateInteraction,
  type DimScores,
  type FacetScores,
} from "@/lib/interaction-engine";

// A kiterjesztett lefedettség (2026-08-18) invariánsai.
//
// A rés-alapú réteg azt a lyukat zárja, amit a lefedettség-mérés talált: a
// pólus-kapu (>65 / <35) miatt a valós párok ~35%-a EGYETLEN mondatot sem
// kapott, miközben átlagosan 3,83 dimenzión volt a mérési hibát meghaladó
// eltérés. Részletek: docs/audits/interaction-pair-coverage-2026-08-18.md

const MID = 50;

function scores(overrides: Partial<Record<string, number>>): DimScores {
  const out: DimScores = {};
  for (const dim of HEXACO_ORDER) out[dim] = overrides[dim] ?? MID;
  return out;
}

// ── Rés-alapú aktiválás ──────────────────────────────────────────────

test("a mérési hibát meghaladó rés akkor is megszólal, ha egyik fél sem pólusos", () => {
  // 62 vs 38: 24 pont, a DIFF_MIN_GAP több mint kétszerese — de a 65/35-ös
  // pólus-kapun MINDKÉT oldal fennakadna.
  const result = simulateInteraction({
    self: scores({ C: 62 }),
    other: scores({ C: 38 }),
    level: "profile-profile",
  });
  assert.equal(result.meta.sparse, false);
  assert.deepEqual(result.meta.atomIds, [GAP_ATOMS.C.id]);
  assert.equal(result.meta.gapLineCount, 1);
  assert.equal(result.discuss[0].basis, "gap");
});

test("a küszöb ALATTI rés néma marad", () => {
  const result = simulateInteraction({
    self: scores({ C: 55 }),
    other: scores({ C: 55 - (DIFF_MIN_GAP - 1) }),
    level: "profile-profile",
  });
  assert.equal(result.meta.sparse, true);
});

test("a rés iránya dönti el, melyik nézőpont szólal meg", () => {
  const higher = simulateInteraction({
    self: scores({ X: 64 }),
    other: scores({ X: 36 }),
    level: "profile-profile",
  });
  const lower = simulateInteraction({
    self: scores({ X: 36 }),
    other: scores({ X: 64 }),
    level: "profile-profile",
  });
  assert.equal(higher.discuss[0].text.hu, GAP_ATOMS.X.view.discuss.hu);
  assert.equal(lower.discuss[0].text.hu, GAP_ATOMS.X.viewB.discuss.hu);
});

test("azonos dimenziós pólus-atom kizárja a rés-sort ugyanarra a dimenzióra", () => {
  // 90 vs 10: pólusos IS és nagy rés IS — a konkrétabb pólus-atom nyer, és a
  // felhasználó nem kap két mondatot ugyanarról a dimenzióról.
  const result = simulateInteraction({
    self: scores({ X: 90 }),
    other: scores({ X: 10 }),
    level: "profile-profile",
  });
  assert.deepEqual(result.meta.atomIds, ["same-X-high-low"]);
  assert.equal(result.meta.gapLineCount, 0);
});

test("archetípus-szinten NINCS rés-alapú sor", () => {
  // A prototípus négy dimenziója szerkezetileg 50 — a hozzájuk mért „rés" a
  // kitalált középértékhez képest mérődne, nem valós adathoz.
  const result = simulateInteraction({
    self: scores({ H: 90, E: 20, X: 75, A: 25, C: 88, O: 15 }),
    other: archetypePrototype({ dominant: "O", secondary: "X" }),
    level: "profile-archetype",
  });
  assert.equal(result.meta.gapLineCount, 0);
  assert.deepEqual(result.dimensions, []);
  assert.deepEqual(result.facetNuances, []);
});

// ── Hat dimenziós összevetés ─────────────────────────────────────────

test("a dimenzió-összevetés mind a hat dimenzióról nyilatkozik", () => {
  const result = simulateInteraction({
    self: scores({ H: 70, E: 40, X: 62, A: 55, C: 72, O: 48 }),
    other: scores({ H: 52, E: 58, X: 38, A: 57, C: 44, O: 66 }),
    level: "profile-profile",
  });
  assert.deepEqual(
    result.dimensions.map((row) => row.dim),
    HEXACO_ORDER,
    "kanonikus HEXACO-sorrend — ugyanaz, mint a radaron és az akkordeonon",
  );
  const byDim = new Map(result.dimensions.map((row) => [row.dim, row]));
  // |70 − 52| = 18 ≥ 11 → eltérés, a self oldalán magasabb.
  assert.deepEqual(byDim.get("H"), { dim: "H", state: "differs", higher: "self" });
  // |55 − 57| = 2 < 11 → a mérés felbontásán belül egyezőnek tekintjük.
  assert.deepEqual(byDim.get("A"), { dim: "A", state: "aligned", higher: null });
  assert.deepEqual(byDim.get("O"), { dim: "O", state: "differs", higher: "other" });
});

test("a csak egyik oldalon mért dimenzió kimarad az összevetésből", () => {
  const partial: DimScores = { H: 70, C: 40 };
  const result = simulateInteraction({
    self: partial,
    other: scores({ H: 40 }),
    level: "profile-profile",
  });
  assert.deepEqual(
    result.dimensions.map((row) => row.dim),
    ["H", "C"],
  );
});

test("a dimenzió-összevetés SEMMILYEN pontszámot nem hordoz", () => {
  // Adatvédelmi invariáns: a partner nyers értékei nem hagyhatják el a
  // szervert. A sor dimenziónként egyetlen bitet visz (ki a magasabb).
  const result = simulateInteraction({
    self: scores({ H: 73, C: 84 }),
    other: scores({ H: 41, C: 29 }),
    level: "profile-profile",
  });
  for (const row of result.dimensions) {
    for (const value of Object.values(row)) {
      assert.notEqual(typeof value, "number", `${row.dim}: pontszám szivárgott ki`);
    }
  }
});

// ── Facet-nüansz ─────────────────────────────────────────────────────

const FACET_GAP = 17; // a rövid forma √2·facet-SEM értéke

function facets(dim: string, values: Record<string, number>): FacetScores {
  return { [dim]: values };
}

test("facet-nüansz csak DIMENZIÓ-SZINTEN EGYEZŐ dimenzióban születik", () => {
  // C: 70 vs 66 → dimenzió-szinten egyezés (4 < 11), de a Rendszerezettség
  // alskálán 30 pont a különbség → „azonos címke, más működés".
  const result = simulateInteraction({
    self: scores({ C: 70 }),
    other: scores({ C: 66 }),
    level: "profile-profile",
    selfFacets: facets("C", { organization: 85, diligence: 60 }),
    otherFacets: facets("C", { organization: 55, diligence: 62 }),
    facetMinGap: FACET_GAP,
  });
  assert.deepEqual(result.facetNuances, [
    { dim: "C", facet: "organization", higher: "self" },
  ]);
});

test("eltérő dimenzióban NINCS facet-nüansz", () => {
  // Ott már a dimenzió-szint is beszél — a nüansz épp az egyezést árnyalná.
  const result = simulateInteraction({
    self: scores({ C: 80 }),
    other: scores({ C: 40 }),
    level: "profile-profile",
    selfFacets: facets("C", { organization: 90 }),
    otherFacets: facets("C", { organization: 30 }),
    facetMinGap: FACET_GAP,
  });
  assert.deepEqual(result.facetNuances, []);
});

test("a küszöb alatti facet-eltérés nem szólal meg", () => {
  const result = simulateInteraction({
    self: scores({ C: 70 }),
    other: scores({ C: 66 }),
    level: "profile-profile",
    selfFacets: facets("C", { organization: 70 }),
    otherFacets: facets("C", { organization: 70 - (FACET_GAP - 1) }),
    facetMinGap: FACET_GAP,
  });
  assert.deepEqual(result.facetNuances, []);
});

test("facet-adat vagy küszöb nélkül a réteg némán kimarad", () => {
  const base = {
    self: scores({ C: 70 }),
    other: scores({ C: 66 }),
    level: "profile-profile" as const,
  };
  assert.deepEqual(simulateInteraction(base).facetNuances, []);
  assert.deepEqual(
    simulateInteraction({
      ...base,
      selfFacets: facets("C", { organization: 90 }),
      otherFacets: facets("C", { organization: 30 }),
    }).facetNuances,
    [],
    "küszöb nélkül nem találgatunk",
  );
});

test("a facet-nüansz dimenziónként egy, összesen legfeljebb MAX_FACET_NUANCES sor", () => {
  const selfFacets: FacetScores = {};
  const otherFacets: FacetScores = {};
  for (const dim of HEXACO_ORDER) {
    // A motor CSAK a kanonikus facet-térkép kódjait nézi (koholt kódra nem
    // épít állítást), ezért itt valódi facetekkel dolgozunk. Dimenziónként
    // KETTŐ lépi át a küszöböt — akkor is csak egy sor jár belőlük.
    const [first, second] = HEXACO_DIMENSION_FACETS[dim];
    selfFacets[dim] = { [first]: 90, [second]: 88 };
    otherFacets[dim] = { [first]: 30, [second]: 32 };
  }
  const result = simulateInteraction({
    self: scores({}),
    other: scores({}),
    level: "profile-profile",
    selfFacets,
    otherFacets,
    facetMinGap: FACET_GAP,
  });
  assert.equal(result.facetNuances.length, MAX_FACET_NUANCES);
  assert.equal(
    new Set(result.facetNuances.map((row) => row.dim)).size,
    result.facetNuances.length,
    "dimenziónként legfeljebb egy nüansz",
  );
});

test("a facet-nüansz determinisztikus", () => {
  const input = {
    self: scores({ C: 70, A: 60 }),
    other: scores({ C: 66, A: 58 }),
    level: "profile-profile" as const,
    selfFacets: { C: { organization: 85 }, A: { patience: 84 } },
    otherFacets: { C: { organization: 55 }, A: { patience: 54 } },
    facetMinGap: FACET_GAP,
  };
  assert.deepEqual(
    simulateInteraction(input).facetNuances,
    simulateInteraction(input).facetNuances,
  );
});
