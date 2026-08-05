import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { resolveJourney } from "@/lib/journey/engine";

const NOW = new Date("2026-04-01T10:00:00.000Z");

const WRITE_BLOCKED_ACTION_IDS = new Set([
  "CREATE_TEAM",
  "INVITE_TEAM_MEMBERS",
  "CREATE_ORG_TEAM",
  "INVITE_ORG_MEMBERS",
  "LAUNCH_ORG_CAMPAIGN",
]);

const ORG_ACTION_IDS = new Set([
  "CREATE_ORG_TEAM",
  "INVITE_ORG_MEMBERS",
  "LAUNCH_ORG_CAMPAIGN",
  "VIEW_ORG_INSIGHTS",
]);

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

test("E2 guardrail integration: unfinished assessment always resolves to /assessment", async () => {
  const owner = await createProfile({});
  const { org, team } = await createOrgWithTeam(owner.id);
  const member = await createProfile({ activeOrgId: org.id });

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

  const resolution = await resolveJourney(member.id, {
    now: NOW,
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.destination, "/assessment");
  assert.equal(resolution.reason, "assessment_continuation");
  assert.equal(resolution.activeSurface, "continuation");
});

test("E2 guardrail integration: pending join invite preempts team/org home", async () => {
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
    now: NOW,
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.reason, "pending_join");
  // A join-link 2026-07 óta token-alapú (/join/[token]), nem invite-id-s.
  assert.equal(resolution.destination, `/join/${pendingInvite.token}`);
  assert.equal(resolution.activeSurface, "continuation");
  assert.notEqual(resolution.destination, "/dashboard");
});

test("E2 guardrail integration: restricted subscription blocks create/manage actions", async () => {
  const owner = await createProfile({});
  const { org } = await createOrgWithTeam(owner.id);
  const manager = await createProfile({ activeOrgId: org.id });

  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: manager.id,
      role: "ORG_MANAGER",
      joinedAt: NOW,
    },
  });
  await createSelfAssessmentResult(manager.id);

  await prisma.subscription.upsert({
    where: { orgId: org.id },
    create: {
      orgId: org.id,
      status: "past_due",
      currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      candidateCredits: 10,
    },
    update: {
      status: "past_due",
      currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      candidateCredits: 10,
    },
  });

  const resolution = await resolveJourney(manager.id, {
    now: NOW,
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.restrictionFlags.subscriptionState, "restricted");
  assert.equal(resolution.restrictionFlags.disableOrgWriteActions, true);

  const hasWriteAction = resolution.state.availableNextActions.some((action) =>
    WRITE_BLOCKED_ACTION_IDS.has(action.id),
  );
  assert.equal(hasWriteAction, false);
  assert.equal(resolution.nextBestAction.primary.id, "VIEW_ORG_INSIGHTS");
});

test("E2 guardrail integration: frozen subscription keeps minimal read-only org behavior", async () => {
  const owner = await createProfile({});
  const { org } = await createOrgWithTeam(owner.id);
  const manager = await createProfile({ activeOrgId: org.id });

  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: manager.id,
      role: "ORG_MANAGER",
      joinedAt: NOW,
    },
  });
  await createSelfAssessmentResult(manager.id);

  await prisma.subscription.upsert({
    where: { orgId: org.id },
    create: {
      orgId: org.id,
      status: "canceled",
      currentPeriodEnd: new Date("2026-01-01T00:00:00.000Z"),
      cancelAtPeriodEnd: true,
      candidateCredits: 10,
    },
    update: {
      status: "canceled",
      currentPeriodEnd: new Date("2026-01-01T00:00:00.000Z"),
      cancelAtPeriodEnd: true,
      candidateCredits: 10,
    },
  });

  const resolution = await resolveJourney(manager.id, {
    now: NOW,
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.restrictionFlags.subscriptionState, "frozen");
  assert.equal(resolution.restrictionFlags.readOnlyOrgViews, true);
  assert.equal(resolution.restrictionFlags.disableOrgWriteActions, true);
  assert.equal(resolution.restrictionFlags.hideDetailedOrgInsights, true);
  assert.equal(resolution.restrictionFlags.requiresSubscriptionAction, true);

  const visibleActions = resolution.state.availableNextActions.map((action) => action.id);
  assert.deepEqual(visibleActions, ["VIEW_ORG_INSIGHTS"]);
});

test("E2 guardrail integration: self-only user is never resolved to org actions", async () => {
  const owner = await createProfile({});
  const { org } = await createOrgWithTeam(owner.id);
  const selfOnly = await createProfile({
    activeOrgId: org.id, // dangling org context without membership
  });

  await createSelfAssessmentResult(selfOnly.id);

  const resolution = await resolveJourney(selfOnly.id, {
    now: NOW,
    entryPoint: "integration_test_entrypoint",
  });

  assert.equal(resolution.currentContext, "self-only");
  assert.notEqual(resolution.activeSurface, "org");
  assert.notEqual(resolution.destination, "/dashboard");
  assert.equal(resolution.home.reason, "personal_home");

  const hasOrgAction = resolution.state.availableNextActions.some((action) =>
    ORG_ACTION_IDS.has(action.id),
  );
  assert.equal(hasOrgAction, false);
});
