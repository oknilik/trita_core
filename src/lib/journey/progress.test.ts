import test from "node:test";
import assert from "node:assert/strict";
import { computeScopeProgress } from "@/lib/journey/progress";
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

test("computes personal scope for personal surface", () => {
  const progress = computeScopeProgress(
    createContext({
      activeSurface: "personal",
      assessment: { started: true, completed: true, hasResult: true },
      completionSummary: {
        self: { sentInvites: 3, completedObservers: 2, pendingInvites: 1 },
      },
    }),
  );

  assert.equal(progress.scope, "personal");
  assert.equal(progress.scopeProgress, 90);
  assert.equal(progress.substeps?.[0]?.done, true);
});

test("computes team scope for team surface", () => {
  const progress = computeScopeProgress(
    createContext({
      activeSurface: "team",
      completionSummary: {
        team: {
          joined: true,
          teamId: "t1",
          memberCount: 5,
          completedMemberCount: 3,
          ready: true,
        },
      },
    }),
  );

  assert.equal(progress.scope, "team");
  assert.equal(progress.scopeProgress, 76);
  assert.equal(progress.substeps?.find((step) => step.id === "team_insight_ready")?.done, true);
});

test("continuation scope resolves to org when pending org invite exists", () => {
  const progress = computeScopeProgress(
    createContext({
      activeSurface: "continuation",
      pendingJoinInvite: {
        kind: "org",
        inviteId: "inv1",
        email: "a@b.com",
        teamId: null,
        orgId: "o1",
        role: "ORG_MEMBER",
        createdAt: new Date(),
      },
      completionSummary: {
        org: {
          joined: true,
          orgId: "o1",
          teamCount: 2,
          completedMemberCount: 3,
          activeCampaignCount: 1,
          ready: false,
        },
      },
    }),
  );

  assert.equal(progress.scope, "org");
  assert.equal(progress.scopeProgress, 60);
});
