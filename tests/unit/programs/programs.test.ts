import test from "node:test";
import assert from "node:assert/strict";
import { createProgramSnapshot, parseProgram, activityStates } from "@/lib/programs/core";
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
test("saved v1 snapshot stays unchanged when a later template is revised", () => {
  const saved = JSON.parse(JSON.stringify(createProgramSnapshot("TEAM_SCAN")));
  const v2 = createProgramSnapshot("TEAM_SCAN"); v2.version = 2;
  v2.activities.find(a => a.key === "TEAM_OPERATING_STYLE")!.dependencies = [];
  const next = parseProgram(v2)!;
  assert.equal(saved.version, 1); assert.equal(next.version, 2);
  assert.equal(activityStates(saved, {}).find(a => a.key === "TEAM_OPERATING_STYLE")!.state, "LOCKED");
  assert.equal(activityStates(next, {}).find(a => a.key === "TEAM_OPERATING_STYLE")!.state, "AVAILABLE");
});
test("invalid snapshots never fall back to legacy; cycles and cross-scope edges fail closed", () => {
  assert.throws(() => getCurrentStepType({ type: "SELF_ASSESSMENT", steps: [], programSnapshot: {} }, { currentStep: 0 }));
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
