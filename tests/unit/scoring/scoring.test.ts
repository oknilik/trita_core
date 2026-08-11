import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateScores,
  computeBankHash,
  extractDimensionScores,
  SCORING_BANK_HASH,
  SCORING_BANK_VERSION,
  SCORING_ENGINE_VERSION,
} from "@/lib/scoring";
import { getTestConfig, isLikertQuestion, type LikertQuestion } from "@/lib/questions";
import { HEXACO_ORDER } from "@/lib/hexaco";

const fullQuestions = getTestConfig("TRITAN", "hu", "full")
  .questions.filter(isLikertQuestion) as LikertQuestion[];
const shortQuestions = getTestConfig("TRITAN", "hu", "short")
  .questions.filter(isLikertQuestion) as LikertQuestion[];

/** Válaszlista, ahol minden item EFFEKTÍV (pivot utáni) értéke azonos. */
const answersAtEffective = (questions: LikertQuestion[], effective: number) =>
  questions.map((q) => ({
    questionId: q.id,
    value: q.reversed ? 6 - effective : effective,
  }));

describe("calculateScores", () => {
  it("fordított item pivotja 6−v (nyers 2 → effektív 4 → 75)", () => {
    const reversed = fullQuestions.find((q) => q.reversed);
    const straight = fullQuestions.find((q) => !q.reversed);
    assert.ok(reversed && straight);

    const revResult = calculateScores("TRITAN", [
      { questionId: reversed.id, value: 2 },
    ]);
    assert.equal(revResult.dimensions[reversed.dimension], 75);

    const strResult = calculateScores("TRITAN", [
      { questionId: straight.id, value: 2 },
    ]);
    assert.equal(strResult.dimensions[straight.dimension], 25);
  });

  it("horgonyok: effektív 1 → 0, 3 → 50, 5 → 100 minden dimenzión", () => {
    for (const [effective, expected] of [
      [1, 0],
      [3, 50],
      [5, 100],
    ] as const) {
      const result = calculateScores(
        "TRITAN",
        answersAtEffective(fullQuestions, effective),
      );
      for (const code of HEXACO_ORDER) {
        assert.equal(result.dimensions[code], expected, `${code} @ ${effective}`);
      }
    }
  });

  it("válasz nélküli dimenzió KIMARAD a JSON-ból (nincs koholt 0)", () => {
    // A „nincs mérve" nem 0 pont: a korábbi motor a valódi 0-tól megkülön-
    // böztethetetlen nullát írt, abból lett 0%-os sáv, „figyelendő" badge és
    // fejlődési fókusz egy meg sem kérdezett skálán. A hiánytalan kitöltést
    // az API-réteg (isCompleteFormAnswerSet) garantálja, a motor nem.
    const result = calculateScores("TRITAN", []);
    assert.deepEqual(result.dimensions, {});
    for (const code of HEXACO_ORDER) {
      assert.equal(code in result.dimensions, false, `${code} nem lehet a JSON-ban`);
    }
    // Üres facet-map sem kerül be — a `{}` ugyanúgy „megmért, de üres".
    assert.deepEqual(result.facets, {});
  });

  it("részleges beadásnál CSAK a megmért dimenzió/facet kerül a JSON-ba", () => {
    const straight = fullQuestions.find((q) => !q.reversed && q.facet);
    assert.ok(straight);
    const result = calculateScores("TRITAN", [
      { questionId: straight.id, value: 5 },
    ]);

    assert.deepEqual(Object.keys(result.dimensions), [straight.dimension]);
    assert.equal(result.dimensions[straight.dimension], 100);
    // A többi öt dimenzió kulcsa hiányzik — nem 0.
    for (const code of HEXACO_ORDER) {
      if (code === straight.dimension) continue;
      assert.equal(code in result.dimensions, false);
    }

    // Facet-oldal ugyanígy: csak a megválaszolt facet, csak a saját dimenziója
    // alatt. A megmért dimenzió TÖBBI facetje sem kap koholt 0-t.
    assert.deepEqual(Object.keys(result.facets ?? {}), [straight.dimension]);
    assert.deepEqual(Object.keys(result.facets?.[straight.dimension] ?? {}), [
      straight.facet,
    ]);
  });

  it("a rövid forma pontozásában NINCS kiegészítő altruizmus-skála (I)", () => {
    // A rövid forma 2026-08-11 óta egyetlen `I` itemet sem szolgál ki, így a
    // tárolt score-JSON-ban sem jelenhet meg — sem dimenzióként, sem facetként.
    const result = calculateScores(
      "TRITAN",
      answersAtEffective(shortQuestions, 4),
    );
    assert.equal("I" in result.dimensions, false);
    assert.equal("I" in (result.facets ?? {}), false);
    assert.deepEqual(Object.keys(result.dimensions).sort(), [...HEXACO_ORDER].sort());

    // A TELJES forma viszont továbbra is méri (mind a 4 altruizmus-item ott van).
    const full = calculateScores("TRITAN", answersAtEffective(fullQuestions, 4));
    assert.equal(full.dimensions.I, 75);
    assert.equal(full.facets?.I?.altruism, 75);
  });

  it("bankon kívüli (stale) questionId-t figyelmen kívül hagy", () => {
    const straight = fullQuestions.find((q) => !q.reversed);
    assert.ok(straight);
    const result = calculateScores("TRITAN", [
      { questionId: straight.id, value: 5 },
      { questionId: 999999, value: 1 },
    ]);
    assert.equal(result.dimensions[straight.dimension], 100);
  });

  it("short (60) és full (100) beadás azonos 0–100 skálán pontozódik", () => {
    assert.equal(shortQuestions.length, 60);
    assert.equal(fullQuestions.length, 100);

    const shortResult = calculateScores(
      "TRITAN",
      answersAtEffective(shortQuestions, 4),
    );
    const fullResult = calculateScores(
      "TRITAN",
      answersAtEffective(fullQuestions, 4),
    );
    for (const code of HEXACO_ORDER) {
      assert.equal(shortResult.dimensions[code], 75);
      assert.equal(fullResult.dimensions[code], 75);
    }
  });

  it("provenance-pecsét: form a beadott itemszámból, bank- és motor-verzió fix", () => {
    const shortResult = calculateScores(
      "TRITAN",
      answersAtEffective(shortQuestions, 3),
    );
    assert.equal(shortResult.form, "short");
    assert.equal(shortResult.bankVersion, SCORING_BANK_VERSION);
    assert.equal(shortResult.engineVersion, SCORING_ENGINE_VERSION);
    assert.equal(SCORING_BANK_VERSION, "tsfi-v2");
    assert.equal(SCORING_ENGINE_VERSION, 1);

    const fullResult = calculateScores(
      "TRITAN",
      answersAtEffective(fullQuestions, 3),
    );
    assert.equal(fullResult.form, "full");
  });

  it("bank-ujjlenyomat: a score-JSON a modul-szintű bankHash-t hordozza", () => {
    const result = calculateScores("TRITAN", answersAtEffective(shortQuestions, 3));
    assert.equal(result.bankHash, SCORING_BANK_HASH);
    // A hash a teljes bank pontozás-releváns mezőiből determinisztikus.
    assert.equal(
      SCORING_BANK_HASH,
      computeBankHash(getTestConfig("TRITAN").questions.filter(isLikertQuestion)),
    );
    assert.match(SCORING_BANK_HASH, /^[0-9a-f]{8}$/);
  });

  it("bank-ujjlenyomat: egy reversed-flip megváltoztatja a hash-t", () => {
    // Ez a bankVersion-literál vakfoltja: egy item-kulcsolási szerkesztés
    // (reversed, dimenzió, facet) a verzió-string alatt észrevétlen maradna —
    // a hash-nek tüzelnie kell rá.
    const bank = [
      { id: 1, reversed: false, dimension: "C", facet: "organization" },
      { id: 2, reversed: true, dimension: "O", facet: "creativity" },
    ];
    const flipped = [
      { ...bank[0], reversed: true },
      bank[1],
    ];
    assert.notEqual(computeBankHash(bank), computeBankHash(flipped));
    // Dimenzió-átsorolás is más hash-t ad.
    const remapped = [{ ...bank[0], dimension: "A" }, bank[1]];
    assert.notEqual(computeBankHash(bank), computeBankHash(remapped));
    // A bemenet sorrendje viszont nem számít (id szerint kanonizál).
    assert.equal(computeBankHash(bank), computeBankHash([bank[1], bank[0]]));
  });

  it("aspects-et nem számol és nem ír (a bankban nincs aspect-item)", () => {
    const result = calculateScores(
      "TRITAN",
      answersAtEffective(shortQuestions, 3),
    );
    assert.equal("aspects" in result, false);
  });
});

describe("extractDimensionScores", () => {
  it("nested ScoreResult-ból a dimensions objektumot adja vissza", () => {
    const extracted = extractDimensionScores({
      type: "likert",
      dimensions: { X: 62, E: 45 },
      answers: [{ questionId: 1, value: 3 }],
      questionCount: 60,
    });
    assert.deepEqual(extracted, { X: 62, E: 45 });
  });

  it("flat formátumból csak az ismert dim-kódokat adja vissza", () => {
    const extracted = extractDimensionScores({
      X: 62,
      E: 45,
      O: 80,
      questionCount: 100,
      answers: [1, 2, 3],
      type: "legacy",
    });
    assert.deepEqual(extracted, { E: 45, X: 62, O: 80 });
  });

  it("szemetes bemenetre null", () => {
    assert.equal(extractDimensionScores(null), null);
    assert.equal(extractDimensionScores(undefined), null);
    assert.equal(extractDimensionScores("X"), null);
    assert.equal(extractDimensionScores(42), null);
    assert.equal(extractDimensionScores({}), null);
    assert.equal(extractDimensionScores({ foo: 1, bar: "x" }), null);
    // Dim-kód nem-szám értékkel nem számít találatnak.
    assert.equal(extractDimensionScores({ X: "62" }), null);
  });
});
