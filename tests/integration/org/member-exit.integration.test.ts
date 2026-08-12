import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { UserRole } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { exitOrganizationMember } from "@/lib/org-membership-lifecycle.server";
import { resolveJourney } from "@/lib/journey/engine";

const NOW = new Date("2026-08-12T12:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function createProfile(role: UserRole = UserRole.INDIVIDUAL) {
  const id = makeId("profile");
  return prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId("clerk"),
      email: `${id}@member-exit.test`,
      username: `User ${id}`,
      role,
      consentedAt: NOW,
      onboardedAt: NOW,
      testType: "TRITAN",
      testTypeAssignedAt: NOW,
    },
  });
}

async function createOrganizationWithTeam(ownerId: string) {
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

async function createSelfResult(userProfileId: string) {
  return prisma.assessmentResult.create({
    data: {
      userProfileId,
      isSelfAssessment: true,
      testType: "TRITAN",
      scores: {
        type: "likert",
        dimensions: { H: 61, E: 47, X: 58, A: 64, C: 70, O: 55 },
      },
      createdAt: NOW,
    },
  });
}

test("org exit: a saját eredmény megmarad, a profil self-only lesz", async () => {
  const owner = await createProfile();
  const member = await createProfile(UserRole.ORG_MEMBER);
  const { org, team } = await createOrganizationWithTeam(owner.id);
  const selfResult = await createSelfResult(member.id);

  await prisma.organizationMember.create({
    data: { orgId: org.id, userId: member.id, role: "ORG_MEMBER", joinedAt: NOW },
  });
  await prisma.teamMember.create({
    data: { teamId: team.id, userId: member.id, role: "member", joinedAt: NOW },
  });
  await prisma.userProfile.update({
    where: { id: member.id },
    data: { activeOrgId: org.id, activeTeamId: team.id },
  });

  const exit = await exitOrganizationMember({ orgId: org.id, userId: member.id, now: NOW });

  assert.ok(exit);
  assert.equal(exit.retainedSelfResult, true);
  assert.equal(exit.removedTeamMemberships, 1);
  assert.equal(exit.role, UserRole.INDIVIDUAL);
  assert.equal(exit.activeOrgId, null);
  assert.equal(exit.activeTeamId, null);

  const [profile, membership, teamMembership, retainedResult] = await Promise.all([
    prisma.userProfile.findUnique({ where: { id: member.id } }),
    prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId: org.id, userId: member.id } },
    }),
    prisma.teamMember.findUnique({
      where: { teamId_userId: { teamId: team.id, userId: member.id } },
    }),
    prisma.assessmentResult.findUnique({ where: { id: selfResult.id } }),
  ]);

  assert.equal(profile?.role, UserRole.INDIVIDUAL);
  assert.equal(profile?.activeOrgId, null);
  assert.equal(profile?.activeTeamId, null);
  assert.equal(membership?.leftAt?.toISOString(), NOW.toISOString());
  assert.equal(teamMembership, null);
  assert.equal(retainedResult?.userProfileId, member.id);

  const journey = await resolveJourney(member.id, { now: NOW, entryPoint: "org_member_exit" });
  assert.equal(journey.currentContext, "self-only");
  assert.equal(journey.destination, "/profile/results");
});

test("org exit: több szervezetnél a megmaradt org lesz az aktív kontextus", async () => {
  const owner = await createProfile();
  const member = await createProfile(UserRole.ORG_MEMBER);
  const removed = await createOrganizationWithTeam(owner.id);
  const kept = await createOrganizationWithTeam(owner.id);

  await prisma.organizationMember.createMany({
    data: [
      { orgId: removed.org.id, userId: member.id, role: "ORG_MEMBER", joinedAt: NOW },
      {
        orgId: kept.org.id,
        userId: member.id,
        role: "ORG_MANAGER",
        joinedAt: new Date(NOW.getTime() - 1_000),
      },
    ],
  });
  await prisma.teamMember.createMany({
    data: [
      { teamId: removed.team.id, userId: member.id, role: "member", joinedAt: NOW },
      { teamId: kept.team.id, userId: member.id, role: "manager", joinedAt: NOW },
    ],
  });
  await prisma.userProfile.update({
    where: { id: member.id },
    data: { activeOrgId: removed.org.id, activeTeamId: removed.team.id },
  });

  const exit = await exitOrganizationMember({
    orgId: removed.org.id,
    userId: member.id,
    now: NOW,
  });

  assert.ok(exit);
  assert.equal(exit.activeOrgId, kept.org.id);
  assert.equal(exit.activeTeamId, null);
  assert.equal(exit.role, UserRole.ORG_MEMBER);

  const [profile, removedTeamMembership, keptTeamMembership, keptMembership] =
    await Promise.all([
      prisma.userProfile.findUnique({ where: { id: member.id } }),
      prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: removed.team.id, userId: member.id } },
      }),
      prisma.teamMember.findUnique({
        where: { teamId_userId: { teamId: kept.team.id, userId: member.id } },
      }),
      prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: kept.org.id, userId: member.id } },
      }),
    ]);

  assert.equal(profile?.activeOrgId, kept.org.id);
  assert.equal(profile?.activeTeamId, null);
  assert.equal(profile?.role, UserRole.ORG_MEMBER);
  assert.equal(removedTeamMembership, null);
  assert.ok(keptTeamMembership);
  assert.equal(keptMembership?.leftAt, null);
});
