import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateScores,
  extractDimensionScores,
  SCORING_BANK_VERSION,
  SCORING_ENGINE_VERSION,
} from "@/lib/scoring";
import { getTestConfig, isLikertQuestion, type LikertQuestion } from "@/lib/questions";
import { TRITAN_ORDER } from "@/lib/tritan";

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
      for (const code of TRITAN_ORDER) {
        assert.equal(result.dimensions[code], expected, `${code} @ ${effective}`);
      }
    }
  });

  it("count=0 → 0 (üres beadás: minden dimenzió 0, nem null/NaN)", () => {
    // Dokumentált viselkedés: válasz nélküli dimenzió pontszáma 0. A hiánytalan
    // kitöltést az API-réteg (isCompleteFormAnswerSet) garantálja, a motor nem.
    const result = calculateScores("TRITAN", []);
    for (const code of TRITAN_ORDER) {
      assert.equal(result.dimensions[code], 0);
    }
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
    for (const code of TRITAN_ORDER) {
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
      dimensions: { TEMP: 62, RESO: 45 },
      answers: [{ questionId: 1, value: 3 }],
      questionCount: 60,
    });
    assert.deepEqual(extracted, { TEMP: 62, RESO: 45 });
  });

  it("flat formátumból csak az ismert dim-kódokat adja vissza", () => {
    const extracted = extractDimensionScores({
      TEMP: 62,
      RESO: 45,
      OPEN: 80,
      questionCount: 100,
      answers: [1, 2, 3],
      type: "legacy",
    });
    assert.deepEqual(extracted, { RESO: 45, TEMP: 62, OPEN: 80 });
  });

  it("szemetes bemenetre null", () => {
    assert.equal(extractDimensionScores(null), null);
    assert.equal(extractDimensionScores(undefined), null);
    assert.equal(extractDimensionScores("TEMP"), null);
    assert.equal(extractDimensionScores(42), null);
    assert.equal(extractDimensionScores({}), null);
    assert.equal(extractDimensionScores({ foo: 1, bar: "x" }), null);
    // Dim-kód nem-szám értékkel nem számít találatnak.
    assert.equal(extractDimensionScores({ TEMP: "62" }), null);
  });
});
