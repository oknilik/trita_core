import test from "node:test";
import assert from "node:assert/strict";
import { createProgramSnapshot, parseProgram, safeParseProgram, activityStates } from "@/lib/programs/core";
import { isStepOpenFor, getCurrentStepType, countCampaignStepsDone } from "@/lib/campaign-steps-core";
import { resolveJourneyFromContext } from "@/lib/journey/engine-core";
import { buildJourneyContext } from "../../factories/journey-fixture-builder";

test("Team Scan opens independent questionnaires while observer responses are pending", () => {
  const program = createProgramSnapshot("TEAM_SCAN");
  assert.deepEqual(activityStates(program, {}).filter(a => a.state === "AVAILABLE").map(a => a.key), ["SELF_ASSESSMENT"]);
  const completions = { __program: 1, SELF_ASSESSMENT: "done" };
  const states = activityStates(program, completions, { observerSent: 3, observerResponses: 1 });
  assert.equal(states.find(a => a.key === "OBSERVER_360")?.state, "WAITING");
  const c = { type: "SELF_ASSESSMENT", steps: [], programSnapshot: program };
  const p = { currentStep: 99, nextStepOpensAt: new Date("2100-01-01"), stepCompletions: completions };
  assert.equal(isStepOpenFor(c, p, "TEAM_OPERATING_STYLE"), true);
  assert.equal(isStepOpenFor(c, p, "PSYCH_SAFETY"), true);
  assert.equal(getCurrentStepType(c, p), "TEAM_OPERATING_STYLE");
  assert.equal(countCampaignStepsDone(["SELF_ASSESSMENT", "OBSERVER_360"], p, true), 1);
});
test("Follow-up never requires personality or observers", () => {
  const p = createProgramSnapshot("FOLLOW_UP");
  assert.deepEqual(activityStates(p, {}).map(a => [a.key, a.state]), [["TEAM_OPERATING_STYLE", "AVAILABLE"], ["PSYCH_SAFETY", "AVAILABLE"]]);
});
test("saved v1 policy stays unchanged when a later template is revised", () => {
  const saved = JSON.parse(JSON.stringify(createProgramSnapshot("TEAM_SCAN")));
  const v2 = createProgramSnapshot("TEAM_SCAN"); v2.policy.minOperatingCoverage = 0.8;
  v2.activities.find(a => a.key === "TEAM_OPERATING_STYLE")!.dependencies = [];
  const next = parseProgram(v2)!;
  assert.equal(saved.policy.minOperatingCoverage, 0.6); assert.equal(next.policy.minOperatingCoverage, 0.8);
  assert.equal(safeParseProgram({ ...v2, version: 2 }), null);
  assert.equal(activityStates(saved, {}).find(a => a.key === "TEAM_OPERATING_STYLE")!.state, "LOCKED");
  assert.equal(activityStates(next, {}).find(a => a.key === "TEAM_OPERATING_STYLE")!.state, "AVAILABLE");
});
test("invalid snapshots never fall back to legacy; cycles and cross-scope edges fail closed", () => {
  assert.equal(getCurrentStepType({ type: "SELF_ASSESSMENT", steps: [], programSnapshot: {} }, { currentStep: 0 }), null);
  assert.equal(isStepOpenFor({ type: "SELF_ASSESSMENT", steps: [], programSnapshot: { version: 999 } }, { currentStep: 0 }, "SELF_ASSESSMENT"), false);
  const p = createProgramSnapshot("TEAM_SCAN"); p.activities[0].dependencies = ["OBSERVER_360"];
  assert.throws(() => parseProgram(p), /CYCLE/);
  p.activities[0].dependencies = ["PUBLISH"]; assert.throws(() => parseProgram(p), /SCOPE/);
});
test("Journey picks available campaign work over an unrelated self draft and preserves parallel actions", () => {
  const context = buildJourneyContext({ currentContext: "org-member", orgId: "org", teamId: "team", assessment: { started: true, completed: false, hasDraft: true }, subscription: { state: "active" }, programs: [{ campaignId: "follow", name: "Follow-up", programKey: "FOLLOW_UP", activities: ["a", "b"].map(key => ({ key, state: "AVAILABLE", href: `/tasks?campaignId=${key}`, label: { hu: key, en: key } })) }] });
  const r = resolveJourneyFromContext(context, { locale: "hu" });
  assert.equal(r.destination, "/tasks"); assert.equal(r.nextBestAction.primary.href, "/tasks?campaignId=a");
  assert.equal(r.nextBestAction.secondary?.href, "/tasks?campaignId=b");
  const restricted = resolveJourneyFromContext({ ...context, subscription: { ...context.subscription, state: "frozen" } });
  assert.notEqual(restricted.nextBestAction.primary.id, "COMPLETE_PROGRAM_ACTIVITY");
});


test("completion envelopes are versioned and read the pre-release sentinel without trusting future versions", async () => {
  const { completionMap, programCompletions } = await import("@/lib/programs/core");
  const receipt = programCompletions({ __program: 1, SELF_ASSESSMENT: "done" });
  assert.deepEqual(receipt, { v: 1, activities: { SELF_ASSESSMENT: "done" } });
  assert.deepEqual(completionMap({ v: 99, activities: { SELF_ASSESSMENT: "done" } }), {});
  assert.equal(countCampaignStepsDone(["SELF_ASSESSMENT"], { currentStep: 9, stepCompletions: { v: 99, activities: {} } }, true), 0);
});

test("baseline copy excludes unrelated and individual report data", async () => {
  const { baselineAggregates } = await import("@/lib/programs/baseline.server");
  const { makeReaderReport } = await import("../../../scripts/fixtures/team-report-reader");
  const a = makeReaderReport(true).aggregates!;
  const result = baselineAggregates({ ...a, trustHighlights: { hubs: ["private person"] } as never, comparisonBasis: { private: true } as never });
  assert.equal("trustHighlights" in result, false);
  assert.equal("comparisonBasis" in result, false);
  assert.deepEqual(result.dimensionAverages, a.dimensionAverages);
});

test("snapshot policy controls report readiness", async () => {
  const { programDataError } = await import("@/lib/programs/report");
  const { makeReaderReport } = await import("../../../scripts/fixtures/team-report-reader");
  const a = makeReaderReport(true).aggregates!;
  a.program = { key: "TEAM_SCAN", observerReady: true, participantCount: 5, policy: { ...createProgramSnapshot("TEAM_SCAN").policy, minOperatingCoverage: 1 } };
  assert.equal(programDataError(a), "REPORT_OPERATING_DATA_INSUFFICIENT");
});

for (const key of ["TEAM_SCAN", "FOLLOW_UP"] as const) test(`${key}: trust is opt-in, parallel and never a report dependency`, () => {
  assert.equal(createProgramSnapshot(key).activities.some(a => a.key === "TRUST_360"), false);
  const p = createProgramSnapshot(key, { includeTrustNetwork: true });
  const trust = p.activities.find(a => a.key === "TRUST_360")!;
  assert.equal(trust.required, false);
  assert.equal(p.activities.find(a => a.key === "REPORT_GENERATION")!.dependencies.includes("TRUST_360"), false);
  assert.equal(activityStates(p, {}).find(a => a.key === "TRUST_360")!.state, key === "TEAM_SCAN" ? "LOCKED" : "AVAILABLE");
  assert.equal(activityStates(p, { v: 1, activities: { SELF_ASSESSMENT: "done" } }).find(a => a.key === "TRUST_360")!.state, "AVAILABLE");
});
