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
  // Consulting-led módban (operating-mode.ts) a CREATE_TEAM self-serve út
  // nem ajánlott — self-serve visszakapcsolásnál ez újra CREATE_TEAM lesz.
  assert.equal(state.recommendedNextAction?.id, "REVIEW_SELF_RESULTS");
  assert.ok(!state.availableNextActions.some((a) => a.id === "CREATE_TEAM"));
});

test("org-ready context resolves ORG_READY stage", () => {
  const state = computeJourneyState(
    buildJourneyContext({
      currentContext: "org-admin",
      orgMembership: { orgId: "o1", role: "ORG_ADMIN", joinedAt: new Date() },
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

test("plain team member only sees team insights after the team result is ready", () => {
  const context = buildJourneyContext({
    currentContext: "org-member",
    orgId: "o1",
    teamId: "t1",
    orgMembership: { orgId: "o1", role: "ORG_MEMBER", joinedAt: new Date() },
    teamMembership: { teamId: "t1", role: "member", joinedAt: new Date(), orgId: "o1" },
    assessment: { started: true, completed: true, hasResult: true },
    completionSummary: {
      self: { started: true, completed: true },
      team: { joined: true, teamId: "t1", completedMemberCount: 2, ready: false },
      org: { joined: true, orgId: "o1", teamCount: 1, completedMemberCount: 2, ready: false },
    },
  });

  const state = computeJourneyState(context);

  assert.equal(state.currentStage, "ORG_PARTIAL");
  assert.deepEqual(state.availableNextActions.map((action) => action.id), ["REVIEW_SELF_RESULTS"]);
});

test("plain member never receives organization management CTAs", () => {
  const state = computeJourneyState(
    buildJourneyContext({
      currentContext: "org-member",
      orgId: "o1",
      teamId: "t1",
      orgMembership: { orgId: "o1", role: "ORG_MEMBER", joinedAt: new Date() },
      teamMembership: { teamId: "t1", role: "member", joinedAt: new Date(), orgId: "o1" },
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true },
        team: { joined: true, teamId: "t1", completedMemberCount: 3, ready: true },
        org: {
          joined: true,
          orgId: "o1",
          teamCount: 1,
          completedMemberCount: 3,
          activeCampaignCount: 1,
          ready: true,
        },
      },
    }),
  );

  assert.deepEqual(state.availableNextActions.map((action) => action.id), ["VIEW_TEAM_INSIGHTS"]);
});

test("organization insights stay hidden until the result threshold is met", () => {
  const state = computeJourneyState(
    buildJourneyContext({
      currentContext: "org-admin",
      orgId: "o1",
      orgMembership: { orgId: "o1", role: "ORG_ADMIN", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { started: true, completed: true },
        org: { joined: true, orgId: "o1", teamCount: 1, completedMemberCount: 2, ready: false },
      },
    }),
  );

  assert.equal(state.availableNextActions.some((action) => action.id === "VIEW_ORG_INSIGHTS"), false);
});
