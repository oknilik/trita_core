import test from "node:test";
import assert from "node:assert/strict";
import { assertJourneyInvariants, enforceJourneyGuardrails } from "@/lib/journey/guardrails";
import type { JourneyContextSnapshot, JourneyState } from "@/lib/journey/types";

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

function createState(): JourneyState {
  return {
    currentStage: "ORG_PARTIAL",
    recommendedNextAction: {
      id: "LAUNCH_ORG_CAMPAIGN",
      href: "/org/o1/campaigns/new",
      scope: "org",
    },
    availableNextActions: [
      {
        id: "LAUNCH_ORG_CAMPAIGN",
        href: "/org/o1/campaigns/new",
        scope: "org",
      },
      {
        id: "VIEW_ORG_INSIGHTS",
        href: "/org/o1",
        scope: "org",
      },
    ],
    blockingReasons: [],
    completionSummary: createContext().completionSummary,
  };
}

test("enforces unfinished assessment guardrail", () => {
  const context = createContext({
    assessment: { started: true, completed: false },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.home.destination, "/assessment");
  assert.equal(result.home.reason, "assessment_continuation");
  assert.equal(result.home.activeSurface, "continuation");
});

test("enforces pending join before team/org home", () => {
  const context = createContext({
    pendingJoinInvite: {
      kind: "org",
      inviteId: "inv123",
      email: "a@b.com",
      teamId: null,
      orgId: "o1",
      role: "ORG_MEMBER",
      createdAt: new Date(),
    },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.home.destination, "/join/org/inv123");
  assert.equal(result.home.reason, "pending_join");
  assert.equal(result.home.activeSurface, "continuation");
});

test("filters create/manage actions in restricted state", () => {
  const context = createContext({
    currentContext: "org-member",
    orgId: "o1",
    orgMembership: { orgId: "o1", role: "ORG_MEMBER", joinedAt: new Date() },
    subscription: { state: "restricted", orgId: "o1", status: "past_due" },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.restrictionFlags.disableOrgWriteActions, true);
  assert.equal(result.state.availableNextActions.some((a) => a.id === "LAUNCH_ORG_CAMPAIGN"), false);
  assert.equal(result.state.recommendedNextAction?.id, "VIEW_ORG_INSIGHTS");
});

test("self-only users never keep org home", () => {
  const context = createContext({
    currentContext: "self-only",
    assessment: { completed: true, started: true, hasResult: true },
  });
  const result = enforceJourneyGuardrails({
    context,
    state: createState(),
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
  });

  assert.equal(result.home.activeSurface, "personal");
  assert.equal(result.home.destination, "/profile/results");
  assert.equal(result.home.reason, "personal_home");
});

test("assertJourneyInvariants reports violations", () => {
  const context = createContext({
    assessment: { started: true, completed: false },
  });
  const state = createState();
  const violations = assertJourneyInvariants({
    context,
    state,
    home: {
      activeSurface: "org",
      destination: "/dashboard",
      reason: "org_cockpit",
    },
    restrictionFlags: {
      subscriptionState: "restricted",
      missingOrgSubscription: false,
      readOnlyOrgViews: true,
      disableOrgWriteActions: true,
      hideDetailedOrgInsights: false,
      requiresSubscriptionAction: true,
    },
  });

  assert.ok(violations.some((v) => v.code === "UNFINISHED_ASSESSMENT_NOT_FORCED"));
  assert.ok(violations.some((v) => v.code === "SELF_ONLY_ORG_HOME"));
  assert.ok(violations.some((v) => v.code === "RESTRICTED_WRITE_ACTION_EXPOSED"));
});

