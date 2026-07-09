import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

interface CriticalIaFixture {
  orgId: string;
  teamId: string;
  admin: {
    profileId: string;
    clerkId: string;
    username: string;
  };
  manager: {
    profileId: string;
    clerkId: string;
    username: string;
  };
}

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function buildLikertScores(offset: number) {
  return {
    type: "likert",
    dimensions: {
      H: 58 + offset,
      E: 54 + offset,
      X: 49 + offset,
      A: 62 + offset,
      C: 64 + offset,
      O: 57 + offset,
    },
  };
}

async function createCriticalIaFixture(): Promise<CriticalIaFixture> {
  const orgId = makeId("ia_org");
  const teamId = makeId("ia_team");

  const adminProfileId = makeId("ia_admin_profile");
  const adminClerkId = makeId("ia_admin_clerk");
  const adminUsername = `IA Admin ${adminProfileId.slice(-4)}`;

  const managerProfileId = makeId("ia_manager_profile");
  const managerClerkId = makeId("ia_manager_clerk");
  const managerUsername = `IA Manager ${managerProfileId.slice(-4)}`;

  const now = new Date("2026-04-02T09:00:00.000Z");

  await prisma.userProfile.createMany({
    data: [
      {
        id: adminProfileId,
        clerkId: adminClerkId,
        email: `${adminProfileId}@test.trita.app`,
        username: adminUsername,
        locale: "hu",
        onboardedAt: now,
        consentedAt: now,
        testType: "HEXACO",
        testTypeAssignedAt: now,
      },
      {
        id: managerProfileId,
        clerkId: managerClerkId,
        email: `${managerProfileId}@test.trita.app`,
        username: managerUsername,
        locale: "hu",
        onboardedAt: now,
        consentedAt: now,
        testType: "HEXACO",
        testTypeAssignedAt: now,
      },
    ],
  });

  await prisma.organization.create({
    data: {
      id: orgId,
      name: `IA Org ${orgId.slice(-4)}`,
      ownerId: adminProfileId,
      status: "ACTIVE",
    },
  });

  await prisma.organizationMember.createMany({
    data: [
      {
        orgId,
        userId: adminProfileId,
        role: "ORG_ADMIN",
      },
      {
        orgId,
        userId: managerProfileId,
        role: "ORG_MANAGER",
      },
    ],
  });

  await prisma.team.create({
    data: {
      id: teamId,
      name: `IA Team ${teamId.slice(-4)}`,
      ownerId: adminProfileId,
      orgId,
    },
  });

  await prisma.teamMember.createMany({
    data: [
      {
        teamId,
        userId: adminProfileId,
        role: "admin",
      },
      {
        teamId,
        userId: managerProfileId,
        role: "manager",
      },
    ],
  });

  await prisma.subscription.create({
    data: {
      orgId,
      status: "active",
      stripeCustomerId: `cus_${orgId}`,
      stripeSubscriptionId: `sub_${orgId}`,
      stripePriceId: "price_org_monthly_e2e_smoke",
      currentPeriodEnd: new Date("2026-06-30T00:00:00.000Z"),
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.assessmentResult.createMany({
    data: [
      {
        id: makeId("ia_result_admin"),
        userProfileId: adminProfileId,
        testType: "HEXACO",
        isSelfAssessment: true,
        scores: buildLikertScores(2),
      },
      {
        id: makeId("ia_result_manager"),
        userProfileId: managerProfileId,
        testType: "HEXACO",
        isSelfAssessment: true,
        scores: buildLikertScores(0),
      },
    ],
  });

  await prisma.candidateInvite.create({
    data: {
      id: makeId("ia_candidate_invite"),
      managerId: managerProfileId,
      teamId,
      email: `candidate-${teamId.slice(-4)}@example.com`,
      name: "IA Candidate",
      position: "Frontend Engineer",
      status: "PENDING",
      testType: "HEXACO",
      expiresAt: new Date("2026-05-15T00:00:00.000Z"),
    },
  });

  await prisma.userProfile.updateMany({
    where: { id: { in: [adminProfileId, managerProfileId] } },
    data: { activeOrgId: orgId },
  });

  return {
    orgId,
    teamId,
    admin: {
      profileId: adminProfileId,
      clerkId: adminClerkId,
      username: adminUsername,
    },
    manager: {
      profileId: managerProfileId,
      clerkId: managerClerkId,
      username: managerUsername,
    },
  };
}

async function cleanupCriticalIaFixture(fixture: CriticalIaFixture): Promise<void> {
  await prisma.candidateResult.deleteMany({
    where: { invite: { teamId: fixture.teamId } },
  });
  await prisma.candidateInvite.deleteMany({
    where: { teamId: fixture.teamId },
  });
  await prisma.assessmentResult.deleteMany({
    where: { userProfileId: { in: [fixture.admin.profileId, fixture.manager.profileId] } },
  });
  await prisma.teamMember.deleteMany({
    where: { teamId: fixture.teamId },
  });
  await prisma.team.deleteMany({
    where: { id: fixture.teamId },
  });
  await prisma.organizationPendingInvite.deleteMany({
    where: { orgId: fixture.orgId },
  });
  await prisma.organizationMember.deleteMany({
    where: { orgId: fixture.orgId },
  });
  await prisma.subscription.deleteMany({
    where: { orgId: fixture.orgId },
  });
  await prisma.organization.deleteMany({
    where: { id: fixture.orgId },
  });
  await prisma.userProfile.deleteMany({
    where: { id: { in: [fixture.admin.profileId, fixture.manager.profileId] } },
  });
}

async function setSessionCookies(
  context: BrowserContext,
  baseURL: string | undefined,
  clerkId: string,
) {
  if (!baseURL) return;

  await context.addCookies([
    {
      name: E2E_AUTH_COOKIE_NAME,
      value: clerkId,
      url: baseURL,
    },
    {
      name: "trita_locale",
      value: "hu",
      url: baseURL,
    },
  ]);
}

async function expectPathname(page: Page, pathname: string) {
  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 15_000,
      message: `expected pathname to be ${pathname}`,
    })
    .toBe(pathname);
}

test.describe("WORKSTREAM G — critical IA smoke", () => {
  let fixture: CriticalIaFixture;

  test.beforeAll(async () => {
    fixture = await createCriticalIaFixture();
  });

  test.afterAll(async () => {
    await cleanupCriticalIaFixture(fixture);
  });

  test("admin critical flows remain healthy after IA cleanup", async ({
    page,
    context,
    baseURL,
  }) => {
    await setSessionCookies(context, baseURL, fixture.admin.clerkId);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expectPathname(page, "/dashboard");

    await expect(page.getByTestId("nav-item-home")).toBeVisible();
    await expect(page.getByTestId("nav-item-org")).toBeVisible();
    await expect(page.getByTestId("nav-item-analytics")).toBeVisible();

    await page.goto(`/team/${fixture.teamId}`, { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/team/${fixture.teamId}`);
    await expect(
      page.getByRole("heading", { name: new RegExp(`IA Team ${fixture.teamId.slice(-4)}`) }),
    ).toBeVisible();

    await page.goto(`/org/${fixture.orgId}/settings`, { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/org/${fixture.orgId}/settings`);
    await expect(
      page.getByRole("heading", { name: new RegExp(`IA Org ${fixture.orgId.slice(-4)}`) }),
    ).toBeVisible();

    await page.goto(`/hiring/${fixture.orgId}`, { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/hiring/${fixture.orgId}`);
    await expect(
      page.getByRole("heading", { name: /trita Hiring/i }),
    ).toBeVisible();

    await page.goto("/assessment-layers", { waitUntil: "domcontentloaded" });
    await expectPathname(page, "/assessment-layers");
    await expect(
      page.locator('a[href^="/assessment-layers/"]').first(),
    ).toBeVisible();

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await page.getByTestId("nav-user-menu-trigger").click();
    await page.getByTestId("nav-user-menu-profile").click();
    await expectPathname(page, "/profile");
    await expect(
      page.getByRole("heading", { name: /IA Admin/i }),
    ).toBeVisible();
  });

  test("manager dashboard keeps simplified role navigation", async ({
    page,
    context,
    baseURL,
  }) => {
    await setSessionCookies(context, baseURL, fixture.manager.clerkId);

    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expectPathname(page, "/dashboard");

    await expect(page.getByTestId("nav-item-home")).toBeVisible();
    await expect(page.getByTestId("nav-item-teams")).toBeVisible();
    await expect(page.getByTestId("nav-item-hiring")).toBeVisible();
    await expect(page.getByTestId("nav-item-analytics")).toBeVisible();
    await expect(page.getByTestId("nav-item-org")).toHaveCount(0);
  });
});

