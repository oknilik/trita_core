import test from "node:test";
import assert from "node:assert/strict";
import { RIASEC_ITEMS, scoreRiasec } from "@/lib/questions/riasec";
import { getTestConfig } from "@/lib/questions";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";

// Két szerver-oldali kapu szerződése (2026-08-11):
//  - a career-background végpont a NYERS 30 item-válaszból pontoz
//    (scoreRiasec) — „measured" forrás csak teljes, érvényes kitöltésből;
//  - a candidate progress végpont a meghívó TÉNYLEGES formájának
//    itemszámára vágja a kliens által állított darabszámot.

test("scoreRiasec: csak TELJES és érvényes válasz-halmazból születik mért kód", () => {
  const complete: Record<number, number> = {};
  for (const item of RIASEC_ITEMS) complete[item.id] = 3;
  const scored = scoreRiasec(complete);
  assert.ok(scored, "teljes kitöltésre null jött");
  for (const letter of ["R", "I", "A", "S", "E", "C"] as const) {
    assert.equal(scored[letter], 50, `${letter}: a csupa-3 kitöltés nem 50`);
  }

  // Hiányzó item → null (a route becsült forrásra esik vissza).
  const partial = { ...complete };
  delete partial[RIASEC_ITEMS[0].id];
  assert.equal(scoreRiasec(partial), null);

  // Skálán kívüli érték → null; a darabszám-egyezés önmagában nem elég
  // (30 kulcs rossz id-kkal sem mérés).
  assert.equal(scoreRiasec({ ...complete, [RIASEC_ITEMS[0].id]: 9 }), null);
  const wrongIds: Record<number, number> = {};
  for (let i = 1000; i < 1000 + RIASEC_ITEMS.length; i += 1) wrongIds[i] = 3;
  assert.equal(scoreRiasec(wrongIds), null);
});

test("a jelölt-flow forma-itemszáma a progress-plafon és a hiring-nevező forrása", () => {
  // Az apply-oldal a DEFAULT_ASSESSMENT_FORM kérdéslistáját szolgálja ki; a
  // progress-végpont és a hiring-dashboard nevezője ugyanebből számol. Ha a
  // forma változik, ez a teszt jelzi, hogy a "N/60" feltételezések elavultak.
  const shortCount = getTestConfig("TRITAN", "hu", DEFAULT_ASSESSMENT_FORM).questions.length;
  assert.equal(shortCount, 60, "a TSFI-S rövid forma nem 60 itemes");
  // A kliens-állította 500 a plafonra vágva már nem jelenhet meg tényként.
  assert.equal(Math.min(500, shortCount), 60);
  // A teljes forma nagyobb – a plafonnak formakövetőnek kell lennie.
  const fullCount = getTestConfig("TRITAN", "hu", "full").questions.length;
  assert.ok(fullCount > shortCount);
});
