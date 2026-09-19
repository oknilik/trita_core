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

test("comparison snapshots distinguish inherited, explicitly empty and unsupported data", async () => {
  const { readComparisons } = await import(
    "@/lib/candidate-programs/comparisons"
  );
  const p = createCandidateProgram(false, "", {
    reportId: "r",
    teamId: "t",
    revision: 1,
    publishedAt: "2026-09-12",
    count: 4,
    dimensions: { H: 50, E: 50, X: 50, A: 50, C: 50, O: 50 },
  });
  assert.equal(readComparisons(null, p)?.length, 1);
  assert.deepEqual(readComparisons([], p), []);
  assert.equal(readComparisons({ unexpected: true }, p), null);
  const c = readComparisons(null, p)![0];
  assert.equal(readComparisons([c, c], p), null);
  assert.equal(readComparisons([{ ...c, dimensions: { H: 50 } }], p), null);
});
