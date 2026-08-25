import test from "node:test";
import assert from "node:assert/strict";
import {
  clampEvaluationProgress,
  getRemainingEvaluationTime,
  getEvaluationPhase,
} from "@/lib/assessment-evaluation";

test("az eredménykészítő progressze 0 és 100 közé szorul", () => {
  assert.equal(clampEvaluationProgress(-12), 0);
  assert.equal(clampEvaluationProgress(48.5), 48.5);
  assert.equal(clampEvaluationProgress(140), 100);
  assert.equal(clampEvaluationProgress(Number.NaN), 0);
});

test("az eredménykészítő képernyő legalább három másodpercig látható", () => {
  assert.equal(getRemainingEvaluationTime(1_000, 1_250), 2_750);
  assert.equal(getRemainingEvaluationTime(1_000, 4_000), 0);
  assert.equal(getRemainingEvaluationTime(1_000, 6_000), 0);
});

test("a három eredménykészítő üzenet a kijelölt küszöbökön vált", () => {
  assert.equal(getEvaluationPhase(0), 0);
  assert.equal(getEvaluationPhase(35.99), 0);
  assert.equal(getEvaluationPhase(36), 1);
  assert.equal(getEvaluationPhase(71.99), 1);
  assert.equal(getEvaluationPhase(72), 2);
  assert.equal(getEvaluationPhase(100), 2);
});
