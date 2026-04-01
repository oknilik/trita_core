import test from "node:test";
import assert from "node:assert/strict";
import { resolveJourneyFromContext } from "@/lib/journey/engine-core";
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

test("resolveJourneyFromContext exposes the unified handoff contract fields", () => {
  const resolution = resolveJourneyFromContext(createContext());

  assert.equal(resolution.stage, "SELF_NOT_STARTED");
  assert.equal(resolution.activeSurface, "personal");
  assert.equal(resolution.destination, "/assessment");
  assert.equal(resolution.reason, "first_assessment");
  assert.ok(resolution.nextBestAction.primary.href.length > 0);
  assert.equal(typeof resolution.scopeProgress.scopeProgress, "number");
  assert.equal(typeof resolution.experienceHints.showAssessmentContinuation, "boolean");
  assert.equal(resolution.restrictionFlags.subscriptionState, "none");
  assert.equal(resolution.destination, resolution.home.destination);
  assert.equal(resolution.reason, resolution.home.reason);
});

test("restriction flags mark restricted org scope as read-only", () => {
  const resolution = resolveJourneyFromContext(
    createContext({
      currentContext: "org-member",
      orgId: "org1",
      orgMembership: { orgId: "org1", role: "ORG_MEMBER", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      subscription: { state: "restricted", orgId: "org1", status: "past_due", hasAccess: false },
      completionSummary: {
        self: { started: true, completed: true },
        org: { joined: true, orgId: "org1" },
      },
    }),
  );

  assert.equal(resolution.restrictionFlags.subscriptionState, "restricted");
  assert.equal(resolution.restrictionFlags.missingOrgSubscription, false);
  assert.equal(resolution.restrictionFlags.readOnlyOrgViews, true);
  assert.equal(resolution.restrictionFlags.disableOrgWriteActions, true);
  assert.equal(resolution.restrictionFlags.hideDetailedOrgInsights, false);
  assert.equal(resolution.restrictionFlags.requiresSubscriptionAction, true);
});

test("restriction flags hide detailed insights in frozen state", () => {
  const resolution = resolveJourneyFromContext(
    createContext({
      currentContext: "org-manager",
      orgId: "org1",
      orgMembership: { orgId: "org1", role: "ORG_MANAGER", joinedAt: new Date() },
      assessment: { started: true, completed: true, hasResult: true },
      subscription: { state: "frozen", orgId: "org1", status: "canceled", hasAccess: false },
      completionSummary: {
        self: { started: true, completed: true },
        org: { joined: true, orgId: "org1" },
      },
    }),
  );

  assert.equal(resolution.restrictionFlags.subscriptionState, "frozen");
  assert.equal(resolution.restrictionFlags.readOnlyOrgViews, true);
  assert.equal(resolution.restrictionFlags.hideDetailedOrgInsights, true);
});
