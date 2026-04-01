import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  __setAcceptanceRuntimeForTests,
  completeAcceptance,
  joinMembershipFromInvite,
  resolveCandidateApplyPageModel,
  resolveOrgJoinPageModel,
  resolveTeamJoinPageModel,
} from "@/lib/acceptance/service";
import type { JourneyResolution } from "@/lib/journey/types";

const NOW = new Date("2026-04-01T10:00:00.000Z");
const FUTURE = new Date("2026-04-15T10:00:00.000Z");
const PAST = new Date("2026-03-01T10:00:00.000Z");

const restorers: Array<() => void> = [];

function stubMethod<T extends object, K extends keyof T>(
  obj: T,
  key: K,
  impl: T[K],
): void {
  const original = obj[key];
  (obj as T & Record<K, T[K]>)[key] = impl;
  restorers.push(() => {
    (obj as T & Record<K, T[K]>)[key] = original;
  });
}

function stubRuntime(
  overrides: Parameters<typeof __setAcceptanceRuntimeForTests>[0],
): void {
  restorers.push(__setAcceptanceRuntimeForTests(overrides));
}

function makeJourneyResolution(destination: string): JourneyResolution {
  return {
    activeSurface: "personal",
    entryIntent: "explore",
    currentContext: "self-only",
    stage: "SELF_COMPLETED",
    stageDisplay: {
      label: { hu: "Kesz", en: "Done" },
      scopeProgress: 100,
    },
    destination,
    reason: "personal_home",
    home: { destination, reason: "personal_home" },
    nextBestAction: {
      stage: "SELF_COMPLETED",
      primary: {
        id: "REVIEW_SELF_RESULTS",
        label: "View results",
        href: "/profile/results",
      },
      secondary: null,
      explanation: "Continue personal journey.",
    },
    scopeProgress: {
      scope: "personal",
      label: { hu: "Kesz", en: "Done" },
      scopeProgress: 100,
    },
    experienceHints: {
      showOrgExpansionPrompt: false,
      showTeamCreationBanner: false,
      showAssessmentContinuation: false,
    },
    restrictionFlags: {
      subscriptionState: "active",
      missingOrgSubscription: false,
      readOnlyOrgViews: false,
      disableOrgWriteActions: false,
      hideDetailedOrgInsights: false,
      requiresSubscriptionAction: false,
    },
    state: {
      currentStage: "SELF_COMPLETED",
      recommendedNextAction: null,
      availableNextActions: [],
      blockingReasons: [],
      completionSummary: {
        self: {
          started: true,
          completed: true,
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
    },
  };
}

afterEach(() => {
  while (restorers.length > 0) {
    const restore = restorers.pop();
    if (restore) restore();
  }
});

test("new user invite link resolves to profile completion acceptance state", async () => {
  stubMethod((prisma as any).teamPendingInvite, "findUnique", async () => ({
    id: "team-invite-new",
    email: "__open__",
    teamId: "team-1",
    team: {
      name: "Team One",
      orgId: "org-1",
      org: { name: "Org One" },
    },
  }));
  stubMethod((prisma as any).userProfile, "upsert", async () => ({
    id: "profile-new",
    username: null,
    birthYear: null,
    gender: null,
    consentedAt: null,
    onboardedAt: null,
  }));
  stubRuntime({
    getActiveOrgMembership: async () => null,
  });

  const model = await resolveTeamJoinPageModel({
    inviteId: "team-invite-new",
    clerkId: "clerk-new",
  });

  assert.equal(model.state, "ready");
  assert.equal(model.payload.acceptanceState, "profile_completion_required");
});

test("existing user invite link resolves to team assignment pending", async () => {
  stubMethod((prisma as any).teamPendingInvite, "findUnique", async () => ({
    id: "team-invite-existing",
    email: "__open__",
    teamId: "team-2",
    team: {
      name: "Team Two",
      orgId: "org-2",
      org: { name: "Org Two" },
    },
  }));
  stubMethod((prisma as any).userProfile, "upsert", async () => ({
    id: "profile-existing",
    username: "Existing User",
    birthYear: 1991,
    gender: "female",
    consentedAt: NOW,
    onboardedAt: NOW,
  }));
  stubRuntime({
    getActiveOrgMembership: async () => null,
  });

  const model = await resolveTeamJoinPageModel({
    inviteId: "team-invite-existing",
    clerkId: "clerk-existing",
  });

  assert.equal(model.state, "ready");
  assert.equal(model.payload.acceptanceState, "team_assignment_pending");
});

test("expired token returns expired state on apply model", async () => {
  stubMethod((prisma as any).candidateInvite, "findUnique", async () => ({
    id: "candidate-expired",
    token: "expired-token",
    testType: "HEXACO",
    position: "Engineer",
    name: "Candidate",
    status: "PENDING",
    expiresAt: PAST,
    draftStartedAt: null,
    draftAnsweredCount: 0,
  }));

  const model = await resolveCandidateApplyPageModel({ token: "expired-token" });
  assert.equal(model.state, "expired_token");
});

test("duplicate accept returns already-used error", async () => {
  stubMethod((prisma as any).candidateInvite, "findUnique", async () => ({
    id: "candidate-completed",
    token: "duplicate-token",
    testType: "HEXACO",
    position: "Engineer",
    name: "Candidate",
    status: "COMPLETED",
    expiresAt: FUTURE,
    draftStartedAt: NOW,
    draftAnsweredCount: 60,
  }));

  const result = await completeAcceptance({
    token: "duplicate-token",
    routeSource: "api.candidate.submit",
    targetContext: { kind: "candidate" },
  });

  assert.equal(result.machineState, "already_accepted");
  assert.equal(result.errorState?.code, "ALREADY_USED");
});

test("already member invite resolves to already accepted state", async () => {
  stubMethod((prisma as any).organizationPendingInvite, "findUnique", async () => ({
    id: "org-invite-member",
    orgId: "org-3",
    role: "ORG_MEMBER",
    org: { name: "Org Three" },
  }));
  stubMethod((prisma as any).userProfile, "upsert", async () => ({
    id: "profile-member",
    username: "Member User",
    birthYear: 1990,
    gender: "male",
    consentedAt: NOW,
    onboardedAt: NOW,
  }));
  stubMethod((prisma as any).organization, "findUnique", async () => ({
    id: "org-3",
    name: "Org Three",
  }));
  stubMethod((prisma as any).organizationMember, "findFirst", async () => ({
    orgId: "org-3",
  }));
  stubRuntime({
    getActiveOrgMembership: async () => ({
      orgId: "org-3",
      role: "ORG_MEMBER",
      joinedAt: NOW,
    }),
    resolveJourney: async () => makeJourneyResolution("/assessment"),
  });

  const model = await resolveOrgJoinPageModel({
    inviteId: "org-invite-member",
    clerkId: "clerk-member",
  });

  assert.equal(model.state, "already_accepted");
  assert.equal(model.redirectTo, "/assessment");
});

test("unfinished assessment after join uses journey handoff destination", async () => {
  stubMethod((prisma as any).teamPendingInvite, "findUnique", async () => ({
    id: "team-invite-join",
    email: "__open__",
    teamId: "team-4",
    team: {
      name: "Team Four",
      orgId: "org-4",
      org: { name: "Org Four" },
    },
  }));
  stubMethod((prisma as any).userProfile, "upsert", async () => ({
    id: "profile-join",
    username: "Join User",
    birthYear: 1994,
    gender: "female",
    consentedAt: NOW,
    onboardedAt: NOW,
  }));
  stubMethod((prisma as any).organizationMember, "upsert", async () => ({}));
  stubMethod((prisma as any).teamMember, "upsert", async () => ({}));
  stubMethod((prisma as any), "$transaction", async () => []);
  stubRuntime({
    getActiveOrgMembership: async () => null,
    setActiveOrgContext: async () => ({
      orgId: "org-4",
      role: "ORG_MEMBER",
      joinedAt: NOW,
    }),
    resolveJourney: async () => makeJourneyResolution("/assessment"),
  });

  const result = await joinMembershipFromInvite({
    clerkId: "clerk-join",
    kind: "team",
    inviteId: "team-invite-join",
  });

  assert.equal(result.acceptanceState, "acceptance_success");
  assert.equal(result.nextPath, "/assessment");
});

test("restricted/frozen acceptance attempts hand off to journey destination", async () => {
  for (const destination of ["/billing/upgrade", "/billing/reactivate"]) {
    stubMethod((prisma as any).teamPendingInvite, "findUnique", async () => ({
      id: `team-invite-${destination}`,
      email: "__open__",
      teamId: "team-5",
      team: {
        name: "Team Five",
        orgId: "org-5",
        org: { name: "Org Five" },
      },
    }));
    stubMethod((prisma as any).userProfile, "upsert", async () => ({
      id: "profile-restricted",
      username: "Restricted User",
      birthYear: 1988,
      gender: "male",
      consentedAt: NOW,
      onboardedAt: NOW,
    }));
    stubMethod((prisma as any).organizationMember, "upsert", async () => ({}));
    stubMethod((prisma as any).teamMember, "upsert", async () => ({}));
    stubMethod((prisma as any), "$transaction", async () => []);
    stubRuntime({
      getActiveOrgMembership: async () => null,
      setActiveOrgContext: async () => ({
        orgId: "org-5",
        role: "ORG_MEMBER",
        joinedAt: NOW,
      }),
      resolveJourney: async () => makeJourneyResolution(destination),
    });

    const result = await joinMembershipFromInvite({
      clerkId: "clerk-restricted",
      kind: "team",
      inviteId: `team-invite-${destination}`,
    });

    assert.equal(result.nextPath, destination);

    while (restorers.length > 0) {
      const restore = restorers.pop();
      if (restore) restore();
    }
  }
});
