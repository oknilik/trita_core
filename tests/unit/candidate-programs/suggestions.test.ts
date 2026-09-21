import test from "node:test";
import assert from "node:assert/strict";
import { candidateSuggestions } from "@/lib/candidate-programs/suggestions";
import { referenceEvidence } from "@/lib/candidate-programs/reference-evidence";
import { createCandidateProgram } from "@/lib/candidate-programs/core";
import {
  readComparisons,
  type CandidateComparison,
} from "@/lib/candidate-programs/comparisons";
import { TEAM_ROLE_ITEMS } from "@/lib/team-role-questions";
import { SOLO_DIM_SUMMARIES } from "@/lib/profile-content";
const dimensions = { H: 50, E: 50, X: 50, A: 50, C: 50, O: 50 };
const input = {
  dimensions,
  measuredAt: "2026-09-21",
  locale: "en" as const,
  roleCompleted: false,
};
const comparison: CandidateComparison = {
  reportId: "r",
  teamId: "team",
  teamName: "Alpha",
  revision: 2,
  count: 5,
  publishedAt: "2026-09-20",
  dimensions,
  connection: "",
  difference: "",
  prompt: "",
  evidence: {
    spread: Object.fromEntries(Object.keys(dimensions).map((d) => [d, 10])),
  },
};
const text = (id: string, data = input, c?: CandidateComparison) =>
  candidateSuggestions({ ...data, comparison: c }).find((s) =>
    s.id.endsWith(`:${id}`),
  )!.text;
test("reuses personal profile content and preserves neutral emotionality", () => {
  const suggestions = candidateSuggestions({
    ...input,
    dimensions: { ...dimensions, E: 95 },
  });
  assert.ok(suggestions[0].text.includes(SOLO_DIM_SUMMARIES.E_high.en));
  assert.ok(suggestions[0].source.includes("2026-09-21"));
  assert.equal(
    candidateSuggestions({ ...input, dimensions: { H: 50 } }).length,
    0,
  );
});
test("small gaps and missing spread never become differences; large spread suppresses claims", () => {
  assert.match(text("difference", input, comparison), /No difference exceeds/);
  const changed = { ...input, dimensions: { ...dimensions, O: 95 } };
  assert.match(
    text("difference", changed, comparison),
    /Openness: candidate 95/,
  );
  assert.match(
    text("difference", changed, { ...comparison, evidence: undefined }),
    /lacks complete/,
  );
  assert.match(
    text("difference", changed, {
      ...comparison,
      evidence: { spread: { ...comparison.evidence!.spread!, O: 50 } },
    }),
    /No difference exceeds/,
  );
  assert.match(text("interview", changed, comparison), /Openness/);
});
test("role comparison requires valid completed questionnaire and fully measured team coverage", () => {
  const roleSelections = Object.fromEntries(
    TEAM_ROLE_ITEMS.slice(0, 10).map((q, i) => [q.id, i < 3 ? 2 : 1]),
  );
  const roles = { ...input, roleCompleted: true, roleSelections };
  assert.match(text("roles", roles, comparison), /missing, estimated or mixed/);
  assert.match(
    text("roles", { ...roles, roleCompleted: false }, comparison),
    /No valid completed/,
  );
  const measured = {
    ...comparison,
    evidence: {
      roles: {
        counts: { OG: 5 },
        secondaryCounts: { KE: 5, KO: 5 },
        questionnaireCount: 5,
        estimateCount: 0,
      },
    },
  };
  assert.doesNotMatch(
    text("roles", roles, measured),
    /missing, estimated or mixed/,
  );
  assert.match(
    text("roles", roles, {
      ...measured,
      evidence: { roles: { ...measured.evidence.roles, estimateCount: 1 } },
    }),
    /mixed/,
  );
});
test("reference evidence is a bounded whitelist and old snapshots remain readable", () => {
  const result = referenceEvidence({
    dimensionSpread: { ...dimensions, secret: 42 },
    roleDistribution: {
      counts: { OG: 3 },
      secondaryCounts: {},
      questionnaireCount: 3,
      estimateCount: 0,
    },
    privateNames: ["SECRET"],
  });
  assert.equal(JSON.stringify(result).includes("secret"), false);
  assert.equal(JSON.stringify(result).includes("SECRET"), false);
  assert.deepEqual(
    referenceEvidence({
      dimensionSpread: { H: NaN },
      roleDistribution: {
        counts: { invalid: 3 },
        questionnaireCount: 3,
        estimateCount: 0,
      },
    }),
    {},
  );
  const p = createCandidateProgram(false, "", comparison);
  assert.equal(readComparisons(null, p)?.[0].evidence?.spread?.H, 10);
  assert.ok(readComparisons([{ ...comparison, evidence: undefined }], p));
});
