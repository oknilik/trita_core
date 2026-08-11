import test from "node:test";
import assert from "node:assert/strict";
import { HERO_RANGE_GATE_FACTOR, selectHeroInsightDims } from "@/lib/workstyle-content";

// Hero-mondat dimenzió-választása (motor-audit v6, M4c): a results-oldal
// „leggyengébb" slotja korábban nyers `.sort`-tal a fordított RESO-t is
// kiválaszthatta — egy stabil kitöltő hero-mondata a stabilitását nevezte
// gyengeségnek. Szabályok: kanonikus rangsor (rankDimensionScores,
// determinista tie-break), RESO kimarad a gyenge-slotból, lapos profilnál
// (max−min terjedelem < HERO_RANGE_GATE_FACTOR·SEM) nincs gyenge-slot —
// a range-statisztika indoklása a konstans kommentjében (motor-audit v9).

const d = (code: string, score: number) => ({ code, score });
const SEM = 10;

test("a leggyengébb slot a legalacsonyabb NEM-RESO dimenzió", () => {
  const pick = selectHeroInsightDims(
    [d("OPEN", 80), d("THOR", 60), d("TEMP", 45), d("RESO", 20)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "OPEN");
  // A nyers minimum a RESO (20) lenne — fordított skála, kimarad.
  assert.equal(pick.weakest?.code, "TEMP");
});

test("lapos NEM-RESO mezőny: nincs gyenge-slot, hiába mély a RESO", () => {
  // Korábban a RESO 15 lett volna a „leggyengébb" (gap 47 > 2·SEM) — most a
  // megjelenített pár (OPEN 62 vs TEMP 58) a mérési hibán belül → nincs
  // gyenge-slot, ÉS a flat jelzés is él: a hívó kiegyensúlyozott-profil
  // mondatot renderel az erősség-ige helyett (a 2 pontos „lead" zaj).
  const pick = selectHeroInsightDims(
    [d("OPEN", 62), d("THOR", 60), d("TEMP", 58), d("RESO", 15)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "OPEN");
  assert.equal(pick.weakest, null);
  assert.equal(pick.flat, true);
});

test("nem-lapos profil RESO nélkül: strongest + weakest változatlanul kimegy", () => {
  const pick = selectHeroInsightDims(
    [d("OPEN", 80), d("THOR", 55), d("TEMP", 40), d("ADAP", 30)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "OPEN");
  assert.equal(pick.weakest?.code, "ADAP");
  assert.equal(pick.flat, false);
});

test("holtverseny: a kanonikus HEXACO-sorrend dönt (determinista rangsor)", () => {
  // TEMP és OPEN azonos ponton — a TRITAN_ORDER-ben a TEMP előrébb áll.
  const pick = selectHeroInsightDims(
    [d("OPEN", 70), d("TEMP", 70), d("THOR", 30)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "TEMP");
});

test("a RESO lehet a legerősebb (a magas Emocionalitás valós karakterjegy)", () => {
  const pick = selectHeroInsightDims([d("RESO", 85), d("THOR", 40)], SEM);
  assert.ok(pick);
  assert.equal(pick.strongest.code, "RESO");
  assert.equal(pick.weakest?.code, "THOR");
});

test("egyetlen nem-RESO dimenzió = a legerősebb: nincs gyenge-slot", () => {
  const pick = selectHeroInsightDims([d("OPEN", 80), d("RESO", 20)], SEM);
  assert.ok(pick);
  assert.equal(pick.strongest.code, "OPEN");
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
    [d("OPEN", 70), d("THOR", 60), d("TEMP", 50)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.weakest?.code, "TEMP");
  assert.equal(pick.flat, false);
});

test("lapos, csupa-magas mezőny is flat: a 2 pontos lead nem „legerősebb”", () => {
  // A flat nem csak csupa-közepesnél él: 88/86/85 terjedelme (3) < 2·SEM —
  // erősség-állítás itt is zaj-műtermék lenne.
  const pick = selectHeroInsightDims(
    [d("OPEN", 88), d("THOR", 86), d("TEMP", 85)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.flat, true);
  assert.equal(pick.weakest, null);
});
