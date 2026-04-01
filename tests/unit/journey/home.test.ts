import test from "node:test";
import assert from "node:assert/strict";
import { resolveHome } from "@/lib/journey/home";
import type { JourneyContextSnapshot, JourneyStage, JourneyState } from "@/lib/journey/types";

function createContext(overrides: Partial<JourneyContextSnapshot> = {}): JourneyContextSnapshot {
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
    pendingInviteCounts: {
      team: 0,
      org: 0,
    },
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

function createState(stage: JourneyStage): JourneyState {
  return {
    currentStage: stage,
    recommendedNextAction: null,
    availableNextActions: [],
    blockingReasons: [],
    completionSummary: createContext().completionSummary,
  };
}

test("pending join invite has highest priority", () => {
  const context = createContext({
    currentContext: "org-admin",
    pendingJoinInvite: {
      kind: "org",
      inviteId: "inv123",
      email: "test@trita.app",
      teamId: null,
      orgId: "org2",
      role: "ORG_MEMBER",
      createdAt: new Date(),
    },
  });
  const state = createState("TEAM_READY");

  const result = resolveHome({ context, state });
  assert.equal(result.activeSurface, "continuation");
  assert.equal(result.home.reason, "pending_join");
  assert.equal(result.home.destination, "/join/org/inv123");
});

test("self in progress goes to assessment", () => {
  const context = createContext({
    assessment: { started: true, completed: false, skipped: false, hasDraft: true, hasResult: false },
  });
  const state = createState("SELF_IN_PROGRESS");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "continuation");
  assert.equal(result.home.reason, "assessment_continuation");
  assert.equal(result.home.destination, "/assessment");
});

test("manager/admin goes to org cockpit", () => {
  const context = createContext({
    currentContext: "org-manager",
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
  });
  const state = createState("TEAM_READY");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "org");
  assert.equal(result.home.reason, "org_cockpit");
  assert.equal(result.home.destination, "/dashboard");
});

test("org member without completed self is redirected to assessment", () => {
  const context = createContext({
    currentContext: "org-member",
    assessment: { started: true, completed: false, skipped: false, hasDraft: true, hasResult: false },
  });
  const state = createState("SELF_IN_PROGRESS");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "continuation");
  assert.equal(result.home.destination, "/assessment");
});

test("org member with completed self can land on team home", () => {
  const context = createContext({
    currentContext: "org-member",
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
    teamId: "team42",
  });
  const state = createState("TEAM_NOT_JOINED");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "team");
  assert.equal(result.home.reason, "team_home");
  assert.equal(result.home.destination, "/team/team42");
});

test("self completed goes to profile results", () => {
  const context = createContext({
    assessment: { started: true, completed: true, skipped: false, hasDraft: false, hasResult: true },
  });
  const state = createState("SELF_COMPLETED");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "personal");
  assert.equal(result.home.reason, "personal_home");
  assert.equal(result.home.destination, "/profile/results");
});

test("first start goes to assessment", () => {
  const context = createContext({
    assessment: { started: false, completed: false, skipped: false, hasDraft: false, hasResult: false },
  });
  const state = createState("SELF_NOT_STARTED");
  const result = resolveHome({ context, state });

  assert.equal(result.activeSurface, "personal");
  assert.equal(result.home.reason, "first_assessment");
  assert.equal(result.home.destination, "/assessment");
});
