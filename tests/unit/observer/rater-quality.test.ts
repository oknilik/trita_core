import test from "node:test";
import assert from "node:assert/strict";
import {
  RATER_FLAT_SD_MAX,
  RATER_QUALITY_MIN_ITEMS,
  RATER_REVERSE_GAP_MIN,
  RATER_STRAIGHTLINE_RUN_MIN,
  assessRaterQuality,
  buildRaterQualityItemMeta,
  extractRaterAnswers,
  type RaterAnswer,
} from "@/lib/observer/rater-quality";
import { tritanConfig } from "@/lib/questions/tritan";

// Szintetikus bank: 20 item, A (1–10) és B (11–20) dimenzió, a páros
// id-k fordítottak — minden várt érték kézzel számolható.
const META = buildRaterQualityItemMeta(
  Array.from({ length: 20 }, (_, i) => ({
    id: i + 1,
    dimension: i + 1 <= 10 ? "A" : "B",
    reversed: (i + 1) % 2 === 0,
  })),
);

/** values[i] → { questionId: i+1, value } az id-sorrendű kitöltéshez. */
function seq(values: number[]): RaterAnswer[] {
  return values.map((value, i) => ({ questionId: i + 1, value }));
}

test("csupa-3-as: flat + straightline, de a kulcsolt konzisztencia rendben", () => {
  const result = assessRaterQuality(seq(Array(20).fill(3)), META);
  assert.equal(result.itemSd, 0);
  assert.equal(result.maxRun, 20);
  // forward kulcsolt 3 vs fordított kulcsolt 3 → nincs inkonzisztencia
  assert.equal(result.reverseGap, 0);
  assert.deepEqual(result.flags, ["flat", "straightline"]);
  assert.equal(result.suspect, true);
});

test("gondos, differenciált kitöltés: nulla flag", () => {
  // A-dimenzió magas (forward magas, fordított nyersen alacsony),
  // B-dimenzió alacsony — a kulcsolt irány-átlagok egybevágnak.
  const result = assessRaterQuality(
    seq([5, 1, 4, 2, 5, 1, 4, 2, 5, 2, 2, 4, 1, 5, 2, 4, 2, 5, 1, 4]),
    META,
  );
  assert.ok(result.itemSd !== null && result.itemSd > 1);
  assert.equal(result.maxRun, 2);
  assert.equal(result.reverseGap, 0.1);
  assert.deepEqual(result.flags, []);
  assert.equal(result.suspect, false);
});

test("fordítottakat ignoráló (beleegyező) minta: csak inconsistent", () => {
  // 3-4-5 ciklus irányfüggetlenül: van variancia (nem flat), nincs
  // sorozat (nem straightline), de a fordított itemek kulcsolt átlaga
  // ~2 ponttal tér el a forwardokétól.
  const result = assessRaterQuality(
    seq(Array.from({ length: 20 }, (_, i) => 3 + (i % 3))),
    META,
  );
  assert.equal(result.itemSd, 0.8);
  assert.equal(result.maxRun, 1);
  assert.equal(result.reverseGap, 1.9);
  assert.deepEqual(result.flags, ["inconsistent"]);
  assert.equal(result.suspect, true);
});

test("itemSd határ: a 0.55-re kerekedő szórás már nem flat", () => {
  // 14×3 + 3×4 + 3×2 (átlag 3, variancia 0.3) → sd 0.5477 → 0.55,
  // a flat-küszöb szigorú < miatt nem él.
  const result = assessRaterQuality(
    seq([3, 3, 3, 4, 3, 3, 3, 2, 3, 3, 4, 3, 3, 2, 3, 3, 4, 2, 3, 3]),
    META,
  );
  assert.equal(result.itemSd, RATER_FLAT_SD_MAX);
  assert.deepEqual(result.flags, []);
  assert.equal(result.suspect, false);
});

test("itemSd határ alatt: 0.45 szórás önmagában flat-et ad", () => {
  // 16×3 + 2×4 + 2×2 → sd 0.447 → 0.45 < 0.55; se sorozat, se irány-gap.
  const result = assessRaterQuality(
    seq([3, 3, 4, 3, 3, 2, 3, 3, 3, 4, 3, 3, 2, 3, 3, 3, 3, 3, 3, 3]),
    META,
  );
  assert.equal(result.itemSd, 0.45);
  assert.equal(result.maxRun, 7);
  assert.equal(result.reverseGap, 0.2);
  assert.deepEqual(result.flags, ["flat"]);
  assert.equal(result.suspect, true);
});

test("maxRun határ: 12 azonos érték már straightline, 11 még nem", () => {
  // 12× hármas után differenciált, irány-konzisztens folytatás.
  const straight = assessRaterQuality(
    seq([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 1, 4, 2, 5, 1, 4, 2]),
    META,
  );
  assert.equal(straight.maxRun, RATER_STRAIGHTLINE_RUN_MIN);
  assert.deepEqual(straight.flags, ["straightline"]);

  const almost = assessRaterQuality(
    seq([3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 5, 1, 4, 2, 5, 1, 4, 2]),
    META,
  );
  assert.equal(almost.maxRun, 11);
  assert.deepEqual(almost.flags, []);
  assert.equal(almost.suspect, false);
});

test("a tárolt válasz-sorrend nem számít: id-sorrendben értékelünk", () => {
  const values = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 5, 1, 4, 2, 5, 1, 4, 2];
  const shuffled = [...seq(values)].reverse();
  const result = assessRaterQuality(shuffled, META);
  assert.equal(result.maxRun, 12);
  assert.deepEqual(result.flags, ["straightline"]);
});

test("reverseGap határ: pontosan 1.6 már inconsistent, 1.4 még nem", () => {
  // Mindkét dimenzióban: forward kulcsolt átlag 4.6, fordított kulcsolt
  // átlag 3.0 → gap kereken 1.6 (a kerekítés fedi a float-zajt).
  const atThreshold = assessRaterQuality(
    seq([5, 4, 4, 3, 5, 3, 4, 3, 5, 2, 5, 4, 4, 3, 5, 3, 4, 3, 5, 2]),
    META,
  );
  assert.equal(atThreshold.reverseGap, RATER_REVERSE_GAP_MIN);
  assert.deepEqual(atThreshold.flags, ["inconsistent"]);

  // Fordított kulcsolt átlag 3.2 → gap 1.4 → küszöb alatt.
  const below = assessRaterQuality(
    seq([5, 3, 4, 3, 5, 3, 4, 2, 5, 3, 5, 3, 4, 3, 5, 3, 4, 2, 5, 3]),
    META,
  );
  assert.equal(below.reverseGap, 1.4);
  assert.deepEqual(below.flags, []);
});

test("minimum-itemszám kapu: 9 válasz nem flagelhető, 10 már igen", () => {
  const nine = assessRaterQuality(seq(Array(9).fill(3)), META);
  assert.equal(nine.itemSd, 0);
  assert.equal(nine.maxRun, 9);
  assert.deepEqual(nine.flags, []);
  assert.equal(nine.suspect, false);

  const ten = assessRaterQuality(seq(Array(RATER_QUALITY_MIN_ITEMS).fill(3)), META);
  assert.deepEqual(ten.flags, ["flat"]);
  assert.equal(ten.suspect, true);
});

test("üres és bankon kívüli válaszsor: nem értékelhető, nem gyanús", () => {
  assert.deepEqual(assessRaterQuality([], META), {
    itemSd: null,
    maxRun: 0,
    reverseGap: null,
    flags: [],
    suspect: false,
  });
  // Ismeretlen questionId (más bank-verzió) nem számít bele.
  const unknownOnly = assessRaterQuality([{ questionId: 999, value: 5 }], META);
  assert.equal(unknownOnly.itemSd, null);
  assert.equal(unknownOnly.suspect, false);
});

test("reverseGap null, ha nincs mindkét irányú item — inconsistent nem élhet", () => {
  const forwardOnlyMeta = buildRaterQualityItemMeta(
    Array.from({ length: 12 }, (_, i) => ({ id: i + 1, dimension: "A" })),
  );
  const result = assessRaterQuality(
    Array.from({ length: 12 }, (_, i) => ({ questionId: i + 1, value: 3 + (i % 3) })),
    forwardOnlyMeta,
  );
  assert.equal(result.reverseGap, null);
  assert.deepEqual(result.flags, []);
});

test("extractRaterAnswers: tárolt scores JSON-ból, örökség-sorokra null", () => {
  const answers = extractRaterAnswers({
    type: "likert",
    dimensions: { X: 50 },
    answers: [
      { questionId: 1, value: 4 },
      { questionId: "rossz", value: 4 }, // hibás tétel kimarad
      { questionId: 2, value: 2 },
    ],
    questionCount: 2,
  });
  assert.deepEqual(answers, [
    { questionId: 1, value: 4 },
    { questionId: 2, value: 2 },
  ]);

  assert.equal(extractRaterAnswers({ dimensions: { X: 50 } }), null);
  assert.equal(extractRaterAnswers({ answers: [] }), null);
  assert.equal(extractRaterAnswers(null), null);
  assert.equal(extractRaterAnswers("scores"), null);
});

test("buildRaterQualityItemMeta: reversed alapértéke false", () => {
  const meta = buildRaterQualityItemMeta([
    { id: 1, dimension: "A" },
    { id: 2, dimension: "B", reversed: true },
  ]);
  assert.deepEqual(meta.get(1), { reversed: false, dimension: "A" });
  assert.deepEqual(meta.get(2), { reversed: true, dimension: "B" });
});

test("valódi TSFI-bank: csupa-3-as rövid forma flat + straightline", () => {
  const meta = buildRaterQualityItemMeta(tritanConfig.questions);
  const answers = tritanConfig.questions
    .filter((q) => q.short === true)
    .map((q) => ({ questionId: q.id, value: 3 }));
  assert.equal(answers.length, 60);
  const result = assessRaterQuality(answers, meta);
  assert.equal(result.itemSd, 0);
  assert.equal(result.maxRun, 60);
  assert.equal(result.reverseGap, 0);
  assert.deepEqual(result.flags, ["flat", "straightline"]);
  assert.equal(result.suspect, true);
});
