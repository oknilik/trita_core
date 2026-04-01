import test from "node:test";
import assert from "node:assert/strict";
import { computeJourneyState } from "@/lib/journey/state";
import { buildJourneyContext } from "../../factories/journey-fixture-builder";

test("returns SELF_NOT_STARTED with start-self action", () => {
  const state = computeJourneyState(buildJourneyContext());
  assert.equal(state.currentStage, "SELF_NOT_STARTED");
  assert.equal(state.recommendedNextAction?.id, "START_SELF_ASSESSMENT");
});

test("current obligation keeps SELF_IN_PROGRESS even with org context", () => {
  const state = computeJourneyState(
    buildJourneyContext({
      currentContext: "org-admin",
      assessment: { started: true, completed: false, hasDraft: true },
      completionSummary: {
        org: { joined: true, ready: true, orgId: "o1" },
      },
    }),
  );

  assert.equal(state.currentStage, "SELF_IN_PROGRESS");
  assert.equal(state.recommendedNextAction?.id, "CONTINUE_SELF_ASSESSMENT");
});

test("team intent without membership resolves TEAM_NOT_JOINED", () => {
  const state = computeJourneyState(
    buildJourneyContext({
      explicitTeamIntent: true,
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true, explicitTeamIntent: true },
      },
    }),
  );

  assert.equal(state.currentStage, "TEAM_NOT_JOINED");
  assert.equal(state.recommendedNextAction?.id, "CREATE_TEAM");
});

test("org-ready context resolves ORG_READY stage", () => {
  const state = computeJourneyState(
    buildJourneyContext({
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true },
        org: { joined: true, orgId: "o1", ready: true, teamCount: 2, activeCampaignCount: 1 },
      },
    }),
  );

  assert.equal(state.currentStage, "ORG_READY");
  assert.equal(state.recommendedNextAction?.id, "VIEW_ORG_INSIGHTS");
});
