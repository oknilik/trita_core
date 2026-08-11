import test from "node:test";
import assert from "node:assert/strict";
import { selectHeroInsightDims } from "@/lib/workstyle-content";

// Hero-mondat dimenzió-választása (motor-audit v6, M4c): a results-oldal
// „leggyengébb" slotja korábban nyers `.sort`-tal a fordított RESO-t is
// kiválaszthatta — egy stabil kitöltő hero-mondata a stabilitását nevezte
// gyengeségnek. Szabályok: kanonikus rangsor (rankDimensionScores,
// determinista tie-break), RESO kimarad a gyenge-slotból, lapos profilnál
// (a megjelenített pár < 2·SEM) nincs gyenge-slot.

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
  // megjelenített pár (OPEN 62 vs TEMP 58) a mérési hibán belül → csak erősség.
  const pick = selectHeroInsightDims(
    [d("OPEN", 62), d("THOR", 60), d("TEMP", 58), d("RESO", 15)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "OPEN");
  assert.equal(pick.weakest, null);
});

test("nem-lapos profil RESO nélkül: strongest + weakest változatlanul kimegy", () => {
  const pick = selectHeroInsightDims(
    [d("OPEN", 80), d("THOR", 55), d("TEMP", 40), d("ADAP", 30)],
    SEM,
  );
  assert.ok(pick);
  assert.equal(pick.strongest.code, "OPEN");
  assert.equal(pick.weakest?.code, "ADAP");
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
});

test("üres bemenet: null (hívói fallback)", () => {
  assert.equal(selectHeroInsightDims([], SEM), null);
});
