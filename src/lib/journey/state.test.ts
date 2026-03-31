import test from "node:test";
import assert from "node:assert/strict";
import { computeJourneyState } from "@/lib/journey/state";
import type { JourneyContextSnapshot } from "@/lib/journey/types";

type JourneyContextOverrides = Omit<
  Partial<JourneyContextSnapshot>,
  "assessment" | "pendingInviteCounts" | "subscription" | "completionSummary"
> & {
  assessment?: Partial<JourneyContextSnapshot["assessment"]>;
  pendingInviteCounts?: Partial<JourneyContextSnapshot["pendingInviteCounts"]>;
  subscription?: Partial<JourneyContextSnapshot["subscription"]>;
  completionSummary?: {
    self?: Partial<JourneyContextSnapshot["completionSummary"]["self"]>;
    team?: Partial<JourneyContextSnapshot["completionSummary"]["team"]>;
    org?: Partial<JourneyContextSnapshot["completionSummary"]["org"]>;
  };
};

function createContext(overrides: JourneyContextOverrides = {}): JourneyContextSnapshot {
  const base: JourneyContextSnapshot = {
    profileId: "p1",
    entryIntent: "explore",
    currentContext: "self-only",
    activeSurface: "personal",
    teamId: null,
    orgId: null,
    hasPendingJoinInvite: false,
    explicitTeamIntent: false,
    assessment: {
      started: false,
      completed: false,
      skipped: false,
      hasDraft: false,
      hasResult: false,
    },
    orgMembership: null,
    teamMembership: null,
    pendingJoinInvite: null,
    pendingInviteCounts: { team: 0, org: 0 },
    subscription: {
      state: "none",
      orgId: null,
      status: "none",
      hasAccess: false,
      trialEndsAt: null,
      currentPeriodEnd: null,
      cancelAtPeriodEnd: false,
    },
    completionSummary: {
      self: {
        started: false,
        completed: false,
        skipped: false,
        hasDraft: false,
        sentInvites: 0,
        pendingInvites: 0,
        completedObservers: 0,
        pendingTeamInvites: 0,
        pendingOrgInvites: 0,
        explicitTeamIntent: false,
      },
      team: {
        joined: false,
        teamId: null,
        memberCount: 0,
        completedMemberCount: 0,
        pendingInviteCount: 0,
        ready: false,
      },
      org: {
        joined: false,
        orgId: null,
        teamCount: 0,
        memberCount: 0,
        completedMemberCount: 0,
        pendingInviteCount: 0,
        activeCampaignCount: 0,
        ready: false,
      },
    },
  };

  return {
    ...base,
    ...overrides,
    assessment: { ...base.assessment, ...(overrides.assessment ?? {}) },
    pendingInviteCounts: { ...base.pendingInviteCounts, ...(overrides.pendingInviteCounts ?? {}) },
    subscription: { ...base.subscription, ...(overrides.subscription ?? {}) },
    completionSummary: {
      self: { ...base.completionSummary.self, ...(overrides.completionSummary?.self ?? {}) },
      team: { ...base.completionSummary.team, ...(overrides.completionSummary?.team ?? {}) },
      org: { ...base.completionSummary.org, ...(overrides.completionSummary?.org ?? {}) },
    },
  };
}

test("returns SELF_NOT_STARTED with start-self action", () => {
  const state = computeJourneyState(createContext());
  assert.equal(state.currentStage, "SELF_NOT_STARTED");
  assert.equal(state.recommendedNextAction?.id, "START_SELF_ASSESSMENT");
});

test("current obligation keeps SELF_IN_PROGRESS even with org context", () => {
  const state = computeJourneyState(
    createContext({
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
    createContext({
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
    createContext({
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
