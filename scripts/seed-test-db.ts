import { PrismaClient, TestType, UserRole } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

const NOW = new Date("2026-04-01T10:00:00.000Z");

const IDS = {
  selfUser: "it_user_self_1",
  orgAdminUser: "it_user_org_admin_1",
  org: "it_org_1",
  team: "it_team_1",
  orgInvite: "it_org_invite_1",
  teamInvite: "it_team_invite_1",
} as const;

async function seedUsers() {
  await prisma.userProfile.upsert({
    where: { id: IDS.selfUser },
    create: {
      id: IDS.selfUser,
      email: "self.integration@trita.app",
      username: "Integration Self User",
      role: UserRole.INDIVIDUAL,
      locale: "hu",
      testType: TestType.HEXACO,
      consentedAt: NOW,
      onboardedAt: NOW,
    },
    update: {
      email: "self.integration@trita.app",
      username: "Integration Self User",
      role: UserRole.INDIVIDUAL,
      locale: "hu",
      testType: TestType.HEXACO,
      consentedAt: NOW,
      onboardedAt: NOW,
    },
  });

  await prisma.userProfile.upsert({
    where: { id: IDS.orgAdminUser },
    create: {
      id: IDS.orgAdminUser,
      email: "org.admin.integration@trita.app",
      username: "Integration Org Admin",
      role: UserRole.ORG_ADMIN,
      locale: "hu",
      testType: TestType.HEXACO,
      consentedAt: NOW,
      onboardedAt: NOW,
    },
    update: {
      email: "org.admin.integration@trita.app",
      username: "Integration Org Admin",
      role: UserRole.ORG_ADMIN,
      locale: "hu",
      testType: TestType.HEXACO,
      consentedAt: NOW,
      onboardedAt: NOW,
    },
  });
}

async function seedOrgTeamGraph() {
  await prisma.organization.upsert({
    where: { id: IDS.org },
    create: {
      id: IDS.org,
      name: "Integration Test Organization",
      ownerId: IDS.orgAdminUser,
      status: "ACTIVE",
    },
    update: {
      name: "Integration Test Organization",
      ownerId: IDS.orgAdminUser,
      status: "ACTIVE",
    },
  });

  await prisma.organizationMember.upsert({
    where: {
      orgId_userId: {
        orgId: IDS.org,
        userId: IDS.orgAdminUser,
      },
    },
    create: {
      orgId: IDS.org,
      userId: IDS.orgAdminUser,
      role: "ORG_ADMIN",
      joinedAt: NOW,
    },
    update: {
      role: "ORG_ADMIN",
      joinedAt: NOW,
      leftAt: null,
    },
  });

  await prisma.team.upsert({
    where: { id: IDS.team },
    create: {
      id: IDS.team,
      name: "Integration Test Team",
      ownerId: IDS.orgAdminUser,
      orgId: IDS.org,
    },
    update: {
      name: "Integration Test Team",
      ownerId: IDS.orgAdminUser,
      orgId: IDS.org,
    },
  });

  await prisma.teamMember.upsert({
    where: {
      teamId_userId: {
        teamId: IDS.team,
        userId: IDS.orgAdminUser,
      },
    },
    create: {
      teamId: IDS.team,
      userId: IDS.orgAdminUser,
      role: "admin",
      joinedAt: NOW,
    },
    update: {
      role: "admin",
      joinedAt: NOW,
    },
  });

  await prisma.subscription.upsert({
    where: { orgId: IDS.org },
    create: {
      orgId: IDS.org,
      status: "active",
      trialEndsAt: null,
      currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      candidateCredits: 3,
    },
    update: {
      status: "active",
      trialEndsAt: null,
      currentPeriodEnd: new Date("2026-05-01T00:00:00.000Z"),
      cancelAtPeriodEnd: false,
      candidateCredits: 3,
    },
  });
}

async function seedInvites() {
  await prisma.organizationPendingInvite.upsert({
    where: { id: IDS.orgInvite },
    create: {
      id: IDS.orgInvite,
      orgId: IDS.org,
      email: "org.invite.integration@trita.app",
      role: "ORG_MEMBER",
      createdAt: NOW,
    },
    update: {
      email: "org.invite.integration@trita.app",
      role: "ORG_MEMBER",
      createdAt: NOW,
    },
  });

  await prisma.teamPendingInvite.upsert({
    where: { id: IDS.teamInvite },
    create: {
      id: IDS.teamInvite,
      teamId: IDS.team,
      email: "team.invite.integration@trita.app",
      createdAt: NOW,
    },
    update: {
      email: "team.invite.integration@trita.app",
      createdAt: NOW,
    },
  });
}

async function seedActiveOrgContext() {
  await prisma.userProfile.update({
    where: { id: IDS.orgAdminUser },
    data: {
      activeOrgId: IDS.org,
    },
  });
}

async function main() {
  await seedUsers();
  await seedOrgTeamGraph();
  await seedInvites();
  await seedActiveOrgContext();
}

main()
  .catch((error) => {
    console.error("[seed-test-db] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
