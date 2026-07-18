import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import type { TestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
  __setAcceptanceRuntimeForTests,
  completeAcceptance,
} from "@/lib/acceptance/service";
import {
  CandidateApplyServiceError,
  createCandidateApplyInvite,
} from "@/lib/candidate-apply/service";
import { getTestConfig } from "@/lib/questions";
import { buildJourneyResolution } from "../../factories/journey-fixture-builder";

const NOW = new Date("2026-04-01T10:00:00.000Z");
const FUTURE = new Date("2026-05-01T10:00:00.000Z");

const restorers: Array<() => void> = [];

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

afterEach(() => {
  while (restorers.length > 0) {
    const restore = restorers.pop();
    if (restore) restore();
  }
});

async function createProfile(options: {
  clerkId?: string;
  email?: string;
  username?: string;
  completeProfile?: boolean;
  activeOrgId?: string | null;
}) {
  const id = makeId("profile");
  const completeProfile = options.completeProfile ?? true;

  return prisma.userProfile.create({
    data: {
      id,
      clerkId: options.clerkId ?? makeId("clerk"),
      email: options.email ?? `${id}@integration.trita.app`,
      username: options.username ?? (completeProfile ? `User ${id}` : null),
      birthYear: completeProfile ? 1990 : null,
      gender: completeProfile ? "female" : null,
      consentedAt: completeProfile ? NOW : null,
      onboardedAt: completeProfile ? NOW : null,
      activeOrgId: options.activeOrgId ?? null,
      testType: "TRITAN",
      testTypeAssignedAt: NOW,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });
}

async function createOrgAndTeam(ownerId: string) {
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

async function ensureActiveOrgSubscription(orgId: string) {
  await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      status: "active",
      stripePriceId: "scale_test_price",
      currentPeriodEnd: FUTURE,
      cancelAtPeriodEnd: false,
      candidateCredits: 100,
    },
    update: {
      status: "active",
      stripePriceId: "scale_test_price",
      currentPeriodEnd: FUTURE,
      cancelAtPeriodEnd: false,
      candidateCredits: 100,
    },
  });
}

async function createCandidateInvite(options: {
  managerId: string;
  teamId?: string | null;
  token?: string;
}) {
  return prisma.candidateInvite.create({
    data: {
      id: makeId("candidate_invite"),
      token: options.token ?? makeId("candidate_token"),
      managerId: options.managerId,
      teamId: options.teamId ?? null,
      name: "Apply Candidate",
      email: `${makeId("candidate")}@integration.trita.app`,
      position: "Engineer",
      status: "PENDING",
      testType: "TRITAN",
      expiresAt: FUTURE,
      createdAt: NOW,
    },
  });
}

function buildCompleteAnswers(testType: TestType = "TRITAN") {
  const config = getTestConfig(testType);
  return config.questions.map((question, index) => ({
    questionId: question.id,
    value: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
  }));
}

test("new apply is created for authorized manager in valid org/team context", async () => {
  const owner = await createProfile({ username: "Owner" });
  const manager = await createProfile({ username: "Manager" });
  const { org, team } = await createOrgAndTeam(owner.id);
  await ensureActiveOrgSubscription(org.id);

  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: manager.id,
      role: "ORG_MANAGER",
      joinedAt: NOW,
    },
  });
  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: manager.id,
      role: "manager",
      joinedAt: NOW,
    },
  });

  const result = await createCandidateApplyInvite({
    clerkId: manager.clerkId!,
    teamId: team.id,
    email: "candidate.new@integration.trita.app",
    name: "New Candidate",
    position: "Designer",
  });

  assert.ok(result.invite.id);
  assert.equal(result.invite.email, "candidate.new@integration.trita.app");
  assert.equal(result.invite.position, "Designer");

  const persisted = await prisma.candidateInvite.findUnique({
    where: { id: result.invite.id },
    select: { managerId: true, teamId: true, status: true },
  });
  assert.equal(persisted?.managerId, manager.id);
  assert.equal(persisted?.teamId, team.id);
  assert.equal(persisted?.status, "PENDING");
});

test("duplicate apply submit is handled idempotently (ALREADY_USED on second submit)", async () => {
  const owner = await createProfile({ username: "Owner2" });
  const { team } = await createOrgAndTeam(owner.id);
  const invite = await createCandidateInvite({ managerId: owner.id, teamId: team.id });
  const answers = buildCompleteAnswers("TRITAN");

  const first = await completeAcceptance({
    token: invite.token,
    routeSource: "api.candidate.submit",
    targetContext: { kind: "candidate" },
    authState: { clerkId: null, authenticated: false },
    answers,
  });

  assert.equal(first.acceptanceState, "APPLY_COMPLETED");
  assert.equal(first.machineState, "acceptance_success");
  assert.equal(first.errorState, null);

  const second = await completeAcceptance({
    token: invite.token,
    routeSource: "api.candidate.submit",
    targetContext: { kind: "candidate" },
    authState: { clerkId: null, authenticated: false },
    answers,
  });

  assert.equal(second.machineState, "already_accepted");
  assert.equal(second.errorState?.code, "ALREADY_USED");
  assert.equal(second.errorState?.status, 400);
});

test("auth/role gate blocks unauthorized and insufficient-role manager-side apply creation", async () => {
  await assert.rejects(
    () =>
      createCandidateApplyInvite({
        clerkId: "missing-clerk-id",
        name: "No Auth Candidate",
      }),
    (error: unknown) => {
      assert.ok(error instanceof CandidateApplyServiceError);
      assert.equal(error.code, "UNAUTHORIZED");
      assert.equal(error.status, 401);
      return true;
    },
  );

  const owner = await createProfile({ username: "Owner3" });
  const member = await createProfile({ username: "OrgMember" });
  const { org, team } = await createOrgAndTeam(owner.id);
  await ensureActiveOrgSubscription(org.id);

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
      role: "admin",
      joinedAt: NOW,
    },
  });

  await assert.rejects(
    () =>
      createCandidateApplyInvite({
        clerkId: member.clerkId!,
        teamId: team.id,
        name: "Blocked Candidate",
      }),
    (error: unknown) => {
      assert.ok(error instanceof CandidateApplyServiceError);
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error.status, 403);
      return true;
    },
  );
});

test("org/team context validation blocks creating apply invite for foreign team", async () => {
  const ownerA = await createProfile({ username: "Owner A" });
  const managerA = await createProfile({ username: "Manager A" });
  const ownerB = await createProfile({ username: "Owner B" });
  const { org: orgA, team: teamA } = await createOrgAndTeam(ownerA.id);
  const { team: teamB } = await createOrgAndTeam(ownerB.id);
  await ensureActiveOrgSubscription(orgA.id);

  await prisma.organizationMember.create({
    data: {
      orgId: orgA.id,
      userId: managerA.id,
      role: "ORG_MANAGER",
      joinedAt: NOW,
    },
  });
  await prisma.teamMember.create({
    data: {
      teamId: teamA.id,
      userId: managerA.id,
      role: "manager",
      joinedAt: NOW,
    },
  });

  await assert.rejects(
    () =>
      createCandidateApplyInvite({
        clerkId: managerA.clerkId!,
        teamId: teamB.id,
        name: "Foreign Team Candidate",
      }),
    (error: unknown) => {
      assert.ok(error instanceof CandidateApplyServiceError);
      assert.equal(error.code, "FORBIDDEN");
      assert.equal(error.status, 403);
      return true;
    },
  );
});

test("post-accept handoff returns journey destination for authenticated apply submit", async () => {
  const owner = await createProfile({ username: "Owner4" });
  const candidateUser = await createProfile({ username: "CandidateUser" });
  const { team } = await createOrgAndTeam(owner.id);
  const invite = await createCandidateInvite({ managerId: owner.id, teamId: team.id });
  const answers = buildCompleteAnswers("TRITAN");

  restorers.push(
    __setAcceptanceRuntimeForTests({
      resolveJourneyForClerkId: async () =>
        buildJourneyResolution("/profile/results", { reason: "personal_home" }),
    }),
  );

  const result = await completeAcceptance({
    token: invite.token,
    routeSource: "api.candidate.submit",
    targetContext: { kind: "candidate" },
    authState: { clerkId: candidateUser.clerkId!, authenticated: true },
    answers,
  });

  assert.equal(result.acceptanceState, "APPLY_COMPLETED");
  assert.equal(result.machineState, "acceptance_success");
  assert.equal(result.handoffContext.nextPath, "/profile/results");

  const persistedInvite = await prisma.candidateInvite.findUnique({
    where: { id: invite.id },
    select: { status: true, completedAt: true },
  });
  assert.equal(persistedInvite?.status, "COMPLETED");
  assert.ok(persistedInvite?.completedAt);
});

