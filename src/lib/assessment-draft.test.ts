import test from "node:test";
import assert from "node:assert/strict";
import {
  getResumeQuestionIndex,
  toAssessmentAnswerPayload,
} from "@/lib/assessment-draft";

test("getResumeQuestionIndex returns first unanswered question", () => {
  const orderedIds = [10, 20, 30, 40];
  const answers = { 10: 3, 20: 5, 40: 2 };

  const index = getResumeQuestionIndex(orderedIds, answers);

  assert.equal(index, 2);
});

test("getResumeQuestionIndex returns last index if all answered", () => {
  const orderedIds = [10, 20, 30];
  const answers = { 10: 1, 20: 2, 30: 3 };

  const index = getResumeQuestionIndex(orderedIds, answers);

  assert.equal(index, 2);
});

test("toAssessmentAnswerPayload returns sorted numeric payload", () => {
  const payload = toAssessmentAnswerPayload({ 12: 5, 2: 1, 9: 3 });

  assert.deepEqual(payload, [
    { questionId: 2, value: 1 },
    { questionId: 9, value: 3 },
    { questionId: 12, value: 5 },
  ]);
});
