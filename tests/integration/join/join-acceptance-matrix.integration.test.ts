import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  MembershipOnboardingError,
  joinMembershipFromInvite,
  resolveAcceptance,
} from "@/lib/acceptance/service";
import { GET as candidateLookupGET } from "@/app/api/candidate/[token]/route";
import { PATCH as candidateProgressPATCH } from "@/app/api/candidate/[token]/progress/route";

const NOW = new Date("2026-04-01T10:00:00.000Z");
const FUTURE = new Date("2026-04-15T10:00:00.000Z");
const PAST = new Date("2026-03-01T10:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function createProfile(options: {
  clerkId?: string;
  email?: string;
  completeProfile?: boolean;
  activeOrgId?: string | null;
}) {
  const id = makeId("profile");
  const completeProfile = options.completeProfile ?? true;
  const email = options.email ?? `${id}@integration.trita.app`;

  const profile = await prisma.userProfile.create({
    data: {
      id,
      clerkId: options.clerkId,
      email,
      username: completeProfile ? `User ${id}` : null,
      birthYear: completeProfile ? 1992 : null,
      gender: completeProfile ? "female" : null,
      consentedAt: completeProfile ? NOW : null,
      onboardedAt: completeProfile ? NOW : null,
      activeOrgId: options.activeOrgId ?? null,
      testType: "TRITAN",
      testTypeAssignedAt: NOW,
    },
  });

  return profile;
}

async function createOrgGraph() {
  const owner = await createProfile({ clerkId: makeId("clerk_owner") });
  const orgId = makeId("org");
  const teamId = makeId("team");

  const org = await prisma.organization.create({
    data: {
      id: orgId,
      name: `Org ${orgId}`,
      ownerId: owner.id,
      status: "ACTIVE",
    },
  });

  const team = await prisma.team.create({
    data: {
      id: teamId,
      name: `Team ${teamId}`,
      ownerId: owner.id,
      orgId: org.id,
    },
  });

  return { owner, org, team };
}

async function createTeamInvite(teamId: string, email?: string) {
  return prisma.teamPendingInvite.create({
    data: {
      id: makeId("team_invite"),
      teamId,
      email: email ?? `${makeId("invitee")}@integration.trita.app`,
      createdAt: NOW,
    },
  });
}

async function createOrgInvite(orgId: string, email?: string, role = "ORG_MEMBER") {
  return prisma.organizationPendingInvite.create({
    data: {
      id: makeId("org_invite"),
      orgId,
      email: email ?? `${makeId("invitee")}@integration.trita.app`,
      role,
      createdAt: NOW,
    },
  });
}

async function createCandidateInvite(options: {
  managerId: string;
  teamId?: string | null;
  status?: "PENDING" | "COMPLETED" | "CANCELED";
  expiresAt?: Date;
  token?: string;
}) {
  return prisma.candidateInvite.create({
    data: {
      id: makeId("candidate_invite"),
      token: options.token ?? makeId("candidate_token"),
      managerId: options.managerId,
      teamId: options.teamId ?? null,
      email: `${makeId("candidate")}@integration.trita.app`,
      name: "Candidate Integration",
      position: "Engineer",
      status: options.status ?? "PENDING",
      testType: "TRITAN",
      expiresAt: options.expiresAt ?? FUTURE,
      createdAt: NOW,
      draftAnsweredCount: 0,
    },
  });
}

test("api.team.join valid token: creates org+team memberships and consumes invite", async () => {
  const { org, team } = await createOrgGraph();
  const invite = await createTeamInvite(team.id);
  const user = await createProfile({
    clerkId: makeId("clerk_join_valid_team"),
    email: invite.email,
    completeProfile: true,
  });

  const result = await joinMembershipFromInvite({
    clerkId: user.clerkId!,
    kind: "team",
    inviteId: invite.id,
  });

  assert.equal(result.ok, true);
  assert.equal(result.acceptanceState, "acceptance_success");

  const [orgMembership, teamMembership, pendingInvite] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId: user.id } },
    }),
    prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: user.id } },
    }),
    prisma.teamPendingInvite.findUnique({
      where: { id: invite.id },
    }),
  ]);

  assert.ok(orgMembership, "organization membership should be created");
  assert.ok(teamMembership, "team membership should be created");
  assert.equal(orgMembership?.role, "ORG_MEMBER");
  assert.equal(teamMembership?.role, "member");
  assert.equal(pendingInvite, null, "team invite should be consumed after successful join");
});

test("api.org.join valid token: creates org membership with invite role and consumes invite", async () => {
  const { org } = await createOrgGraph();
  const invite = await createOrgInvite(org.id, undefined, "ORG_MANAGER");
  const user = await createProfile({
    clerkId: makeId("clerk_join_valid_org"),
    email: invite.email,
    completeProfile: true,
  });

  const result = await joinMembershipFromInvite({
    clerkId: user.clerkId!,
    kind: "org",
    inviteId: invite.id,
  });

  assert.equal(result.ok, true);

  const [orgMembership, pendingInvite] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId: user.id } },
    }),
    prisma.organizationPendingInvite.findUnique({
      where: { id: invite.id },
    }),
  ]);

  assert.ok(orgMembership, "organization membership should exist");
  assert.equal(orgMembership?.role, "ORG_MANAGER");
  assert.equal(pendingInvite, null, "org invite should be consumed after successful join");
});

test("api.team.join email mismatch: named invite rejects a different account", async () => {
  const { team } = await createOrgGraph();
  const invite = await createTeamInvite(team.id, "invited-person@integration.trita.app");
  // A belépő user MÁS email-lel — a named meghívó nem fogadható el.
  const intruder = await createProfile({
    clerkId: makeId("clerk_join_mismatch_team"),
    email: "someone-else@integration.trita.app",
    completeProfile: true,
  });

  await assert.rejects(
    () =>
      joinMembershipFromInvite({
        clerkId: intruder.clerkId!,
        kind: "team",
        inviteId: invite.id,
      }),
    (error: unknown) => {
      assert.ok(error instanceof MembershipOnboardingError);
      assert.equal(error.code, "INVITE_EMAIL_MISMATCH");
      assert.equal(error.status, 403);
      return true;
    },
  );

  // A meghívó és a csapat érintetlen marad
  const [pendingInvite, teamMembership] = await Promise.all([
    prisma.teamPendingInvite.findUnique({ where: { id: invite.id } }),
    prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: intruder.id } },
    }),
  ]);
  assert.ok(pendingInvite, "invite must survive a rejected join");
  assert.equal(teamMembership, null, "no membership for a mismatched account");
});

test("api.team.join invalid token: throws INVITE_NOT_FOUND", async () => {
  await assert.rejects(
    () =>
      joinMembershipFromInvite({
        clerkId: makeId("clerk_invalid_invite"),
        kind: "team",
        inviteId: makeId("missing_invite"),
      }),
    (error: unknown) => {
      assert.ok(error instanceof MembershipOnboardingError);
      assert.equal(error.code, "INVITE_NOT_FOUND");
      assert.equal(error.status, 404);
      return true;
    },
  );
});

test("api.team.join auth required: resolveAcceptance returns unauthorized state", async () => {
  const { team } = await createOrgGraph();
  const invite = await createTeamInvite(team.id);

  const result = await resolveAcceptance({
    token: invite.id,
    routeSource: "api.team.join",
    authState: { clerkId: null, authenticated: false },
    targetContext: { kind: "team" },
  });

  assert.equal(result.acceptanceState, "INVITED_UNAUTHENTICATED");
  assert.equal(result.machineState, "auth_required");
  assert.equal(result.errorState?.code, "UNAUTHORIZED");
  assert.equal(result.errorState?.status, 401);
});

test("api.team.join org mismatch: resolveAcceptance returns org_mismatch", async () => {
  const firstGraph = await createOrgGraph();
  const secondGraph = await createOrgGraph();

  const user = await createProfile({
    clerkId: makeId("clerk_org_mismatch"),
    activeOrgId: firstGraph.org.id,
  });

  await prisma.organizationMember.create({
    data: {
      orgId: firstGraph.org.id,
      userId: user.id,
      role: "ORG_MEMBER",
      joinedAt: NOW,
    },
  });

  const invite = await createTeamInvite(secondGraph.team.id, user.email ?? undefined);

  const result = await resolveAcceptance({
    token: invite.id,
    routeSource: "api.team.join",
    authState: { clerkId: user.clerkId!, authenticated: true },
    targetContext: { kind: "team" },
  });

  assert.equal(result.acceptanceState, "INVITED_AUTHENTICATED_ORG_SWITCH_REQUIRED");
  assert.equal(result.machineState, "org_mismatch");
});

test("api.team.join already member: invite resolves as accepted without duplicate membership", async () => {
  const { org, team } = await createOrgGraph();
  const user = await createProfile({
    clerkId: makeId("clerk_already_member"),
    activeOrgId: org.id,
  });

  await prisma.organizationMember.create({
    data: {
      orgId: org.id,
      userId: user.id,
      role: "ORG_MEMBER",
      joinedAt: NOW,
    },
  });

  await prisma.teamMember.create({
    data: {
      teamId: team.id,
      userId: user.id,
      role: "member",
      joinedAt: NOW,
    },
  });

  const invite = await createTeamInvite(team.id, user.email ?? undefined);

  const resolution = await resolveAcceptance({
    token: invite.id,
    routeSource: "api.team.join",
    authState: { clerkId: user.clerkId!, authenticated: true },
    targetContext: { kind: "team" },
  });
  assert.equal(resolution.acceptanceState, "INVITE_ACCEPTED");

  const result = await joinMembershipFromInvite({
    clerkId: user.clerkId!,
    kind: "team",
    inviteId: invite.id,
  });
  assert.equal(result.ok, true);

  const teamMemberCount = await prisma.teamMember.count({
    where: { teamId: team.id, userId: user.id },
  });
  const pendingInvite = await prisma.teamPendingInvite.findUnique({
    where: { id: invite.id },
  });

  assert.equal(teamMemberCount, 1, "already-member flow must not duplicate team membership");
  assert.ok(
    pendingInvite,
    "already-accepted invite should remain untouched because no mutation transaction runs",
  );
});

test("pending assessment + join: journey handoff keeps destination on /assessment", async () => {
  const { team } = await createOrgGraph();
  const invite = await createTeamInvite(team.id);
  const user = await createProfile({
    clerkId: makeId("clerk_pending_assessment"),
    email: invite.email,
    completeProfile: true,
  });

  await prisma.assessmentDraft.create({
    data: {
      userProfileId: user.id,
      testType: "TRITAN",
      answers: { 1: 3, 2: 4 },
      currentPage: 1,
      createdAt: NOW,
      updatedAt: NOW,
    },
  });

  const result = await joinMembershipFromInvite({
    clerkId: user.clerkId!,
    kind: "team",
    inviteId: invite.id,
  });

  assert.equal(result.nextPath, "/assessment");
});

test("relevant apply endpoints: /api/candidate/[token] handles invalid, expired and already accepted states", async () => {
  const { owner, team } = await createOrgGraph();
  const completedInvite = await createCandidateInvite({
    managerId: owner.id,
    teamId: team.id,
    status: "COMPLETED",
    expiresAt: FUTURE,
  });
  const expiredInvite = await createCandidateInvite({
    managerId: owner.id,
    teamId: team.id,
    status: "PENDING",
    expiresAt: PAST,
  });

  const completedResponse = await candidateLookupGET(
    new Request(`http://localhost/api/candidate/${completedInvite.token}`),
    { params: Promise.resolve({ token: completedInvite.token }) },
  );
  assert.equal(completedResponse.status, 410);
  assert.equal((await completedResponse.json()).error, "ALREADY_USED");

  const expiredResponse = await candidateLookupGET(
    new Request(`http://localhost/api/candidate/${expiredInvite.token}`),
    { params: Promise.resolve({ token: expiredInvite.token }) },
  );
  assert.equal(expiredResponse.status, 410);
  assert.equal((await expiredResponse.json()).error, "INVITE_EXPIRED");

  const invalidResponse = await candidateLookupGET(
    new Request("http://localhost/api/candidate/invalid-token"),
    { params: Promise.resolve({ token: "invalid-token" }) },
  );
  assert.equal(invalidResponse.status, 404);
  assert.equal((await invalidResponse.json()).error, "INVALID_TOKEN");
});

test("relevant apply endpoint: /api/candidate/[token]/progress mutates draft progress for ready invite", async () => {
  const { owner, team } = await createOrgGraph();
  const pendingInvite = await createCandidateInvite({
    managerId: owner.id,
    teamId: team.id,
    status: "PENDING",
    expiresAt: FUTURE,
  });

  const response = await candidateProgressPATCH(
    new Request(`http://localhost/api/candidate/${pendingInvite.token}/progress`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ answeredCount: 17 }),
    }) as unknown as Parameters<typeof candidateProgressPATCH>[0],
    { params: Promise.resolve({ token: pendingInvite.token }) },
  );

  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { ok: true });

  const updated = await prisma.candidateInvite.findUnique({
    where: { id: pendingInvite.id },
    select: { draftAnsweredCount: true, draftStartedAt: true },
  });

  assert.equal(updated?.draftAnsweredCount, 17);
  assert.ok(updated?.draftStartedAt, "draftStartedAt should be set when progress starts");
});

