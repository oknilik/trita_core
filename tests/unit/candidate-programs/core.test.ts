import test from "node:test";
import assert from "node:assert/strict";
import {
  createCandidateProgram,
  readCandidateProgram,
  validCandidateAnswers,
  candidateQuestions,
} from "@/lib/candidate-programs/core";
test("candidate program pins its instrument and optional activity and fails closed", () => {
  const p = createCandidateProgram();
  assert.equal(p.includeTeamRole, false);
  assert.equal(p.baseline, null);
  assert.equal(candidateQuestions(p, "en").length, 60);
  assert.equal(readCandidateProgram({ ...p, version: 2 }), null);
  assert.equal(readCandidateProgram({ ...p, questionIds: [1, 1] }), null);
  assert.equal(validCandidateAnswers(p, { 9999: 4 }), false);
  assert.equal(validCandidateAnswers(p, {}, true), false);
  assert.equal(
    validCandidateAnswers(
      p,
      Object.fromEntries(p.questionIds.map((q) => [q, 3])),
      true,
    ),
    true,
  );
});
