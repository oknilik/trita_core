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
import { buildJourneyResolution } from "../../factories/journey-fixture-builder";
import {
  createJourneyOrgMembership,
  createOrgInviteRecord,
  createTeamInviteRecord,
} from "../../factories/org-team-factory";
import {
  createTestUserIdentity,
  createTestUserProfileRecord,
} from "../../factories/user-factory";

const NOW = new Date("2026-04-01T10:00:00.000Z");
const FUTURE = new Date("2026-04-15T10:00:00.000Z");
const PAST = new Date("2026-03-01T10:00:00.000Z");

const restorers: Array<() => void> = [];

const prismaModels = prisma as unknown as Record<string, Record<string, unknown>>;

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

afterEach(() => {
  while (restorers.length > 0) {
    const restore = restorers.pop();
    if (restore) restore();
  }
});

test("new user invite link resolves to profile completion acceptance state", async () => {
  const user = createTestUserIdentity({
    clerkId: "clerk-new",
    profileId: "profile-new",
    username: null,
  });
  const invite = createTeamInviteRecord({
    id: "team-invite-new",
    teamId: "team-1",
    team: {
      name: "Team One",
      orgId: "org-1",
      org: { name: "Org One" },
    },
  });

  stubMethod(prismaModels.teamPendingInvite, "findUnique", async () => invite);
  stubMethod(prismaModels.userProfile, "upsert", async () =>
    createTestUserProfileRecord({
      id: user.profileId,
      username: null,
      birthYear: null,
      gender: null,
      consentedAt: null,
      onboardedAt: null,
    }),
  );
  stubRuntime({
    getActiveOrgMembership: async () => null,
  });

  const model = await resolveTeamJoinPageModel({
    inviteId: invite.id,
    clerkId: user.clerkId,
  });

  assert.equal(model.state, "ready");
  assert.equal(model.payload.acceptanceState, "profile_completion_required");
});

test("existing user invite link resolves to team assignment pending", async () => {
  const user = createTestUserIdentity({
    clerkId: "clerk-existing",
    profileId: "profile-existing",
    username: "Existing User",
  });
  const invite = createTeamInviteRecord({
    id: "team-invite-existing",
    teamId: "team-2",
    team: {
      name: "Team Two",
      orgId: "org-2",
      org: { name: "Org Two" },
    },
  });

  stubMethod(prismaModels.teamPendingInvite, "findUnique", async () => invite);
  stubMethod(prismaModels.userProfile, "upsert", async () =>
    createTestUserProfileRecord({
      id: user.profileId,
      username: user.username,
      birthYear: 1991,
      gender: "female",
      consentedAt: NOW,
      onboardedAt: NOW,
    }),
  );
  stubRuntime({
    getActiveOrgMembership: async () => null,
  });

  const model = await resolveTeamJoinPageModel({
    inviteId: invite.id,
    clerkId: user.clerkId,
  });

  assert.equal(model.state, "ready");
  assert.equal(model.payload.acceptanceState, "team_assignment_pending");
});

test("expired token returns expired state on apply model", async () => {
  stubMethod(prismaModels.candidateInvite, "findUnique", async () => ({
    id: "candidate-expired",
    token: "expired-token",
    testType: "TRITAN",
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
  stubMethod(prismaModels.candidateInvite, "findUnique", async () => ({
    id: "candidate-completed",
    token: "duplicate-token",
    testType: "TRITAN",
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
  const user = createTestUserIdentity({
    clerkId: "clerk-member",
    profileId: "profile-member",
    username: "Member User",
  });
  const invite = createOrgInviteRecord({
    id: "org-invite-member",
    orgId: "org-3",
    role: "ORG_MEMBER",
    org: { name: "Org Three" },
  });

  stubMethod(prismaModels.organizationPendingInvite, "findUnique", async () => invite);
  stubMethod(prismaModels.userProfile, "upsert", async () =>
    createTestUserProfileRecord({
      id: user.profileId,
      username: user.username,
      birthYear: 1990,
      gender: "male",
      consentedAt: NOW,
      onboardedAt: NOW,
    }),
  );
  stubMethod(prismaModels.organization, "findUnique", async () => ({
    id: "org-3",
    name: "Org Three",
  }));
  stubMethod(prismaModels.organizationMember, "findFirst", async () => ({
    orgId: "org-3",
  }));
  stubRuntime({
    getActiveOrgMembership: async () =>
      createJourneyOrgMembership({
        orgId: "org-3",
        role: "ORG_MEMBER",
        joinedAt: NOW,
      }),
    resolveJourney: async () =>
      buildJourneyResolution("/assessment", {
        reason: "assessment_continuation",
      }),
  });

  const model = await resolveOrgJoinPageModel({
    inviteId: invite.id,
    clerkId: user.clerkId,
  });

  assert.equal(model.state, "already_accepted");
  assert.equal(model.redirectTo, "/assessment");
});

test("unfinished assessment after join uses journey handoff destination", async () => {
  const user = createTestUserIdentity({
    clerkId: "clerk-join",
    profileId: "profile-join",
    username: "Join User",
  });
  const invite = createTeamInviteRecord({
    id: "team-invite-join",
    teamId: "team-4",
    team: {
      name: "Team Four",
      orgId: "org-4",
      org: { name: "Org Four" },
    },
  });

  stubMethod(prismaModels.teamPendingInvite, "findUnique", async () => invite);
  stubMethod(prismaModels.userProfile, "upsert", async () =>
    createTestUserProfileRecord({
      id: user.profileId,
      username: user.username,
      birthYear: 1994,
      gender: "female",
      consentedAt: NOW,
      onboardedAt: NOW,
    }),
  );
  stubMethod(prismaModels.organizationMember, "upsert", async () => ({}));
  stubMethod(prismaModels.teamMember, "upsert", async () => ({}));
  stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", async () => []);
  stubRuntime({
    getActiveOrgMembership: async () => null,
    setActiveOrgContext: async () =>
      createJourneyOrgMembership({
        orgId: "org-4",
        role: "ORG_MEMBER",
        joinedAt: NOW,
      }),
    resolveJourney: async () =>
      buildJourneyResolution("/assessment", {
        reason: "assessment_continuation",
      }),
  });

  const result = await joinMembershipFromInvite({
    clerkId: user.clerkId,
    kind: "team",
    inviteId: invite.id,
  });

  assert.equal(result.acceptanceState, "acceptance_success");
  assert.equal(result.nextPath, "/assessment");
});

test("restricted/frozen acceptance attempts hand off to journey destination", async () => {
  for (const destination of ["/billing/upgrade", "/billing/reactivate"]) {
    const user = createTestUserIdentity({
      clerkId: "clerk-restricted",
      profileId: "profile-restricted",
      username: "Restricted User",
    });
    const invite = createTeamInviteRecord({
      id: `team-invite-${destination}`,
      teamId: "team-5",
      team: {
        name: "Team Five",
        orgId: "org-5",
        org: { name: "Org Five" },
      },
    });

    stubMethod(prismaModels.teamPendingInvite, "findUnique", async () => invite);
    stubMethod(prismaModels.userProfile, "upsert", async () =>
      createTestUserProfileRecord({
        id: user.profileId,
        username: user.username,
        birthYear: 1988,
        gender: "male",
        consentedAt: NOW,
        onboardedAt: NOW,
      }),
    );
    stubMethod(prismaModels.organizationMember, "upsert", async () => ({}));
    stubMethod(prismaModels.teamMember, "upsert", async () => ({}));
    stubMethod(prisma as unknown as Record<string, unknown>, "$transaction", async () => []);
    stubRuntime({
      getActiveOrgMembership: async () => null,
      setActiveOrgContext: async () =>
        createJourneyOrgMembership({
          orgId: "org-5",
          role: "ORG_MEMBER",
          joinedAt: NOW,
        }),
      resolveJourney: async () => buildJourneyResolution(destination),
    });

    const result = await joinMembershipFromInvite({
      clerkId: user.clerkId,
      kind: "team",
      inviteId: invite.id,
    });

    assert.equal(result.nextPath, destination);

    while (restorers.length > 0) {
      const restore = restorers.pop();
      if (restore) restore();
    }
  }
});
