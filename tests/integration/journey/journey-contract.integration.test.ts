import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolveJourney } from "@/lib/journey/engine";

const NOW = new Date("2026-04-01T10:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function createProfile(options: {
  id?: string;
  clerkId?: string;
  email?: string;
  activeOrgId?: string | null;
  completeOnboarding?: boolean;
}) {
  const id = options.id ?? makeId("profile");
  const completeOnboarding = options.completeOnboarding ?? true;

  return prisma.userProfile.create({
    data: {
      id,
      clerkId: options.clerkId ?? makeId("clerk"),
      email: options.email ?? `${id}@integration.trita.app`,
      username: completeOnboarding ? `User ${id}` : null,
      birthYear: completeOnboarding ? 1990 : null,
      gender: completeOnboarding ? "female" : null,
      consentedAt: completeOnboarding ? NOW : null,
      onboardedAt: completeOnboarding ? NOW : null,
      activeOrgId: options.activeOrgId ?? null,
      testType: "TRITAN",
      testTypeAssignedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });
}

async function createOrgWithTeam(ownerId: string) {
  const org = await prisma.organization.create({
    data: {
      id: makeId("org"),
      name: `Org ${makeId("name")}`,
      ownerId,
      status: "ACTIVE",
    },
  });

  const team = await prisma.team.create({
    data: {
      id: makeId("team"),
      name: `Team ${makeId("name")}`,
      ownerId,
      orgId: org.id,
    },
  });

  return { org, team };
}

async function createSelfAssessmentResult(profileId: string) {
  return prisma.assessmentResult.create({
    data: {
      userProfileId: profileId,
      isSelfAssessment: true,
      testType: "TRITAN",
      scores: {
        INTE: 55,
        RESO: 48,
        TEMP: 61,
        ADAP: 52,
        THOR: 63,
        OPEN: 58,
      },
      createdAt: NOW,
    },
  });
}

test("journey integration: self not started contract resolves to assessment start", async () => {
  const profile = await createProfile({ completeOnboarding: true });

  const resolution = await resolveJourney(profile.id, {
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.stage, "SELF_NOT_STARTED");
  assert.equal(resolution.destination, "/assessment");
  assert.equal(resolution.activeSurface, "personal");
  assert.equal(resolution.nextBestAction.primary.id, "START_SELF_ASSESSMENT");
  assert.equal(resolution.home.primaryAction?.id, "START_SELF_ASSESSMENT");
  assert.equal(resolution.scopeProgress.scope, "personal");
  assert.equal(resolution.scopeProgress.scopeProgress, 0);
});

test("journey integration: pending join invite preempts org cockpit home", async () => {
  const owner = await createProfile({});
  const { org, team } = await createOrgWithTeam(owner.id);
  const manager = await createProfile({
    email: `${makeId("manager")}@integration.trita.app`,
    activeOrgId: org.id,
  });

  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: manager.id,
      role: "ORG_MANAGER",
      joinedAt: NOW,
    },
  });
  await createSelfAssessmentResult(manager.id);

  const pendingInvite = await prisma.teamPendingInvite.create({
    data: {
      id: makeId("pending_join"),
      teamId: team.id,
      email: manager.email!,
      createdAt: NOW,
    },
  });

  const resolution = await resolveJourney(manager.id, {
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.reason, "pending_join");
  // A join-link 2026-07 óta token-alapú (/join/[token]), nem invite-id-s.
  assert.equal(resolution.destination, `/join/${pendingInvite.token}`);
  assert.equal(resolution.activeSurface, "continuation");
  assert.notEqual(resolution.destination, "/dashboard");
});

test("journey integration: unfinished self assessment has obligation precedence over team context", async () => {
  const owner = await createProfile({});
  const { org, team } = await createOrgWithTeam(owner.id);
  const member = await createProfile({
    activeOrgId: org.id,
  });

  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: member.id,
      role: "ORG_MEMBER",
      joinedAt: NOW,
    },
  });
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: member.id,
      role: "member",
      joinedAt: NOW,
    },
  });

  await prisma.assessmentDraft.create({
    data: {
      userProfileId: member.id,
      testType: "TRITAN",
      answers: { 1: 2, 2: 4 },
      currentPage: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const teammateA = await createProfile({});
  const teammateB = await createProfile({});
  for (const teammate of [teammateA, teammateB]) {
    await prisma.organizationMember.create({
      data: {
        orgId: org.id,
        userId: teammate.id,
        role: "ORG_MEMBER",
        joinedAt: NOW,
      },
    });
    await prisma.teamMember.create({
      data: {
        teamId: team.id,
        userId: teammate.id,
        role: "member",
        joinedAt: NOW,
      },
    });
    await createSelfAssessmentResult(teammate.id);
  }

  const resolution = await resolveJourney(member.id, {
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.stage, "SELF_IN_PROGRESS");
  assert.equal(resolution.reason, "assessment_continuation");
  assert.equal(resolution.destination, "/assessment");
  assert.equal(resolution.activeSurface, "continuation");
  assert.notEqual(resolution.destination, `/team/${team.id}`);
});

test("journey integration: subscription restriction precedence matrix is enforced", async () => {
  const owner = await createProfile({});
  const { org } = await createOrgWithTeam(owner.id);
  const manager = await createProfile({
    activeOrgId: org.id,
  });

  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: manager.id,
      role: "ORG_MANAGER",
      joinedAt: NOW,
    },
  });
  await createSelfAssessmentResult(manager.id);

  const scenarios = [
    {
      state: "active" as const,
      status: "active",
      currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      expectedHomePrimaryActionId: "INVITE_ORG_MEMBERS",
      expected: {
        readOnlyOrgViews: false,
        disableOrgWriteActions: false,
        hideDetailedOrgInsights: false,
        requiresSubscriptionAction: false,
      },
    },
    {
      state: "restricted" as const,
      status: "past_due",
      currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      expectedHomePrimaryActionId: "VIEW_ORG_INSIGHTS",
      expected: {
        readOnlyOrgViews: true,
        disableOrgWriteActions: true,
        hideDetailedOrgInsights: false,
        requiresSubscriptionAction: true,
      },
    },
    {
      state: "frozen" as const,
      status: "canceled",
      currentPeriodEnd: new Date("2026-01-01T00:00:00.000Z"),
      expectedHomePrimaryActionId: "VIEW_ORG_INSIGHTS",
      expected: {
        readOnlyOrgViews: true,
        disableOrgWriteActions: true,
        hideDetailedOrgInsights: true,
        requiresSubscriptionAction: true,
      },
    },
  ];

  for (const scenario of scenarios) {
    await prisma.subscription.upsert({
      where: { orgId: org.id },
      create: {
        orgId: org.id,
        status: scenario.status,
        currentPeriodEnd: scenario.currentPeriodEnd,
        cancelAtPeriodEnd: scenario.status === "canceled",
        candidateCredits: 10,
      },
      update: {
        status: scenario.status,
        currentPeriodEnd: scenario.currentPeriodEnd,
        cancelAtPeriodEnd: scenario.status === "canceled",
        candidateCredits: 10,
      },
    });

    const resolution = await resolveJourney(manager.id, {
      entryPoint: "integration_test_entrypoint",
      now: NOW,
    });

    assert.equal(
      resolution.restrictionFlags.subscriptionState,
      scenario.state,
      `subscriptionState (${scenario.state})`,
    );
    assert.equal(resolution.restrictionFlags.readOnlyOrgViews, scenario.expected.readOnlyOrgViews);
    assert.equal(
      resolution.restrictionFlags.disableOrgWriteActions,
      scenario.expected.disableOrgWriteActions,
    );
    assert.equal(
      resolution.restrictionFlags.hideDetailedOrgInsights,
      scenario.expected.hideDetailedOrgInsights,
    );
    assert.equal(
      resolution.restrictionFlags.requiresSubscriptionAction,
      scenario.expected.requiresSubscriptionAction,
    );

    // Mai journey-modell: a /dashboard tiszta dispatcher, sosem cél; az
    // ORG_MANAGER home-ja a /manager cockpit (activeSurface: team).
    assert.equal(resolution.destination, "/manager");
    assert.equal(resolution.reason, "manager_cockpit");
    assert.equal(resolution.activeSurface, "team");
    assert.equal(resolution.home.primaryAction?.id, scenario.expectedHomePrimaryActionId);
  }
});
