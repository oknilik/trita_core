import assert from "node:assert/strict";
import test from "node:test";
import { DIFF_MIN_GAP, isSecondaryUncertain, resolveSecondaryUncertainty } from "@/lib/personality-type";

const scores = (first: number, second: number, third?: number) => [
  { code: "H", score: first },
  { code: "E", score: second },
  ...(third === undefined ? [] : [{ code: "X", score: third }]),
];

test("distinguishes the observed top-two and second/third gaps", () => {
  assert.equal(resolveSecondaryUncertainty(scores(82, 55, 54)), "secondary-pair");
  assert.equal(resolveSecondaryUncertainty(scores(82, 80, 54)), "top-pair");
  assert.equal(resolveSecondaryUncertainty(scores(82, 80, 79)), "top-pair");
  assert.equal(resolveSecondaryUncertainty(scores(82, 55, 30)), null);
});

test("uses the same threshold as the personality label, including boundary and partial data", () => {
  const exactBoundary = scores(90, 90 - DIFF_MIN_GAP, 90 - 2 * DIFF_MIN_GAP);
  assert.equal(resolveSecondaryUncertainty(exactBoundary), null);
  assert.equal(isSecondaryUncertain(exactBoundary), false);
  assert.equal(resolveSecondaryUncertainty(scores(82, 80)), "top-pair");
  assert.equal(resolveSecondaryUncertainty(scores(82, 55)), null);
  assert.equal(resolveSecondaryUncertainty([{ code: "H", score: 82 }, { code: "I", score: 82 }]), null);
  for (const sample of [scores(82, 55, 54), scores(82, 80, 54), exactBoundary]) {
    assert.equal(isSecondaryUncertain(sample), resolveSecondaryUncertainty(sample) !== null);
  }
});
