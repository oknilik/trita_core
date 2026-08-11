import test from "node:test";
import assert from "node:assert/strict";
import { HERO_RANGE_GATE_FACTOR, selectHeroInsightDims } from "@/lib/workstyle-content";

// Hero-mondat dimenzió-választása (motor-audit v6, M4c): a results-oldal
// „leggyengébb" slotja korábban nyers `.sort`-tal a fordított E-t is
// kiválaszthatta — egy stabil kitöltő hero-mondata a stabilitását nevezte
// gyengeségnek. Szabályok: kanonikus rangsor (rankDimensionScores,
// determinista tie-break), E kimarad a gyenge-slotból, lapos profilnál
// (max−min terjedelem < HERO_RANGE_GATE_FACTOR·SEM) nincs gyenge-slot —
// a range-statisztika indoklása a konstans kommentjében (motor-audit v9).

const d = (code: string, score: number) => ({ code, score });
const SEM = 10;

test("a leggyengébb slot a legalacsonyabb NEM-E dimenzió", () => {
  const pick = selectHeroInsightDims(
    [d("O", 80), d("C", 60), d("X", 45), d("E", 20)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "O");
  // A nyers minimum a E (20) lenne — fordított skála, kimarad.
  assert.equal(pick.weakest?.code, "X");
});

test("lapos NEM-E mezőny: nincs gyenge-slot, hiába mély a E", () => {
  // Korábban a E 15 lett volna a „leggyengébb" (gap 47 > 2·SEM) — most a
  // megjelenített pár (O 62 vs X 58) a mérési hibán belül → nincs
  // gyenge-slot, ÉS a flat jelzés is él: a hívó kiegyensúlyozott-profil
  // mondatot renderel az erősség-ige helyett (a 2 pontos „lead" zaj).
  const pick = selectHeroInsightDims(
    [d("O", 62), d("C", 60), d("X", 58), d("E", 15)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "O");
  assert.equal(pick.weakest, null);
  assert.equal(pick.flat, true);
});

test("nem-lapos profil E nélkül: strongest + weakest változatlanul kimegy", () => {
  const pick = selectHeroInsightDims(
    [d("O", 80), d("C", 55), d("X", 40), d("A", 30)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "O");
  assert.equal(pick.weakest?.code, "A");
  assert.equal(pick.flat, false);
});

test("holtverseny: a kanonikus HEXACO-sorrend dönt (determinista rangsor)", () => {
  // X és O azonos ponton — a HEXACO_ORDER-ben a X előrébb áll.
  const pick = selectHeroInsightDims(
    [d("O", 70), d("X", 70), d("C", 30)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "X");
});

test("a E lehet a legerősebb (a magas Emocionalitás valós karakterjegy)", () => {
  const pick = selectHeroInsightDims([d("E", 85), d("C", 40)], SEM);
  assert.ok(pick);
  assert.equal(pick.strongest.code, "E");
  assert.equal(pick.weakest?.code, "C");
});

test("egyetlen nem-E dimenzió = a legerősebb: nincs gyenge-slot", () => {
  const pick = selectHeroInsightDims([d("O", 80), d("E", 20)], SEM);
  assert.ok(pick);
  assert.equal(pick.strongest.code, "O");
  assert.equal(pick.weakest, null);
  // Nem a terjedelem-kapu tüzelt (nincs összevethető gyenge-jelölt) — a
  // flat NEM állítható, az erősség kimehet.
  assert.equal(pick.flat, false);
});

test("üres bemenet: null (hívói fallback)", () => {
  assert.equal(selectHeroInsightDims([], SEM), null);
});

// ── A terjedelem-kapu rögzítése (motor-audit v9 döntés) ──────────────────
// A kapu SZÁNDÉKOSAN 2·SEM (szigorúbb a páronkénti √2-szabálynál), mert a
// max−min hat pontszám terjedelme — tiszta zaj mellett a várható terjedelem
// ≈ 2,5·SEM. A faktor megváltoztatása tudatos döntést igényel, nem drift.

test("a terjedelem-kapu faktora rögzítve: 2", () => {
  assert.equal(HERO_RANGE_GATE_FACTOR, 2);
});

test("határeset: pontosan 2·SEM terjedelemnél a gyenge-slot már kimegy", () => {
  // gap = 20 = 2·SEM → nem „kisebb, mint", tehát a weakest megjelenik.
  const pick = selectHeroInsightDims(
    [d("O", 70), d("C", 60), d("X", 50)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.weakest?.code, "X");
  assert.equal(pick.flat, false);
});

test("lapos, csupa-magas mezőny is flat: a 2 pontos lead nem „legerősebb”", () => {
  // A flat nem csak csupa-közepesnél él: 88/86/85 terjedelme (3) < 2·SEM —
  // erősség-állítás itt is zaj-műtermék lenne.
  const pick = selectHeroInsightDims(
    [d("O", 88), d("C", 86), d("X", 85)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.flat, true);
  assert.equal(pick.weakest, null);
});
