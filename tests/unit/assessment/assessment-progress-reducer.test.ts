import assert from "node:assert/strict";
import test from "node:test";
import {
  assessmentProgressReducer,
  clampProgress,
  createAssessmentProgressState,
  getAssessmentProgressMeta,
  type AssessmentProgressAction,
  type AssessmentProgressState,
} from "@/lib/assessment-progress-reducer";

function reduceMany(
  initialState: AssessmentProgressState,
  actions: AssessmentProgressAction[],
): AssessmentProgressState {
  return actions.reduce(assessmentProgressReducer, initialState);
}

function createBaseState() {
  return createAssessmentProgressState({
    questionIds: [101, 102, 103],
  });
}

test("next egyszer", () => {
  const state = assessmentProgressReducer(createBaseState(), { type: "NEXT" });
  assert.equal(state.questionIndex, 1);
});

test("next ketszer gyorsan", () => {
  const state = reduceMany(createBaseState(), [{ type: "NEXT" }, { type: "NEXT" }]);
  assert.equal(state.questionIndex, 2);
});

test("back + next gyorsan", () => {
  const state = reduceMany(
    createAssessmentProgressState({
      questionIds: [101, 102, 103],
      initialQuestionIndex: 1,
    }),
    [{ type: "BACK" }, { type: "NEXT" }],
  );
  assert.equal(state.questionIndex, 1);
});

test("duplikalt answer event nem noveli a progresszt", () => {
  const first = assessmentProgressReducer(createBaseState(), {
    type: "ANSWER",
    questionId: 101,
    value: 4,
  });
  const second = assessmentProgressReducer(first, {
    type: "ANSWER",
    questionId: 101,
    value: 4,
  });

  assert.equal(first.answeredCount, 1);
  assert.equal(second.answeredCount, 1);
  assert.equal(first.progress, second.progress);
  assert.equal(second, first);
});

test("idempotens answer update: ugyanazon kerdes atirasa nem noveli answeredCountot", () => {
  const first = assessmentProgressReducer(createBaseState(), {
    type: "ANSWER",
    questionId: 101,
    value: 2,
  });
  const second = assessmentProgressReducer(first, {
    type: "ANSWER",
    questionId: 101,
    value: 5,
  });

  assert.equal(first.answeredCount, 1);
  assert.equal(second.answeredCount, 1);
  assert.equal(second.progress, first.progress);
  assert.equal(second.answers[101], 5);
});

test("0 ala nem mehet", () => {
  const state = reduceMany(createBaseState(), [{ type: "BACK" }, { type: "BACK" }]);
  assert.equal(state.questionIndex, 0);
});

test("100 fole nem mehet", () => {
  const state = reduceMany(createBaseState(), [
    { type: "ANSWER", questionId: 101, value: 1 },
    { type: "ANSWER", questionId: 102, value: 2 },
    { type: "ANSWER", questionId: 103, value: 3 },
    // invalid question should be ignored and must not push progress above 100
    { type: "ANSWER", questionId: 999, value: 4 },
  ]);

  assert.equal(state.answeredCount, 3);
  assert.equal(state.progress, 100);
});

test("progress clamp helyes", () => {
  assert.equal(clampProgress(-10), 0);
  assert.equal(clampProgress(44.5), 44.5);
  assert.equal(clampProgress(130), 100);

  const emptyState = createAssessmentProgressState({ questionIds: [] });
  assert.equal(emptyState.progress, 0);
});

test("last step viselkedes", () => {
  const initial = createAssessmentProgressState({
    questionIds: [101, 102, 103],
    initialQuestionIndex: 2,
  });
  const stateAfterNext = assessmentProgressReducer(initial, { type: "NEXT" });
  const meta = getAssessmentProgressMeta(stateAfterNext);

  assert.equal(stateAfterNext.questionIndex, 2);
  assert.equal(meta.isLastStep, true);
  assert.equal(meta.canGoNext, false);
});
