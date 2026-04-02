import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

const FIXTURE = {
  orgId: "e2e_intel_visual_org",
  lowTeamId: "e2e_intel_visual_team_low",
  sufficientTeamId: "e2e_intel_visual_team_sufficient",
  admin: {
    profileId: "e2e_intel_visual_admin_profile",
    clerkId: "e2e_intel_visual_admin_clerk",
    username: "E2E Visual Admin",
  },
  lowMembers: [
    { profileId: "e2e_intel_visual_low_1", clerkId: "e2e_intel_visual_low_clerk_1", username: "Low Data One" },
    { profileId: "e2e_intel_visual_low_2", clerkId: "e2e_intel_visual_low_clerk_2", username: "Low Data Two" },
    { profileId: "e2e_intel_visual_low_3", clerkId: "e2e_intel_visual_low_clerk_3", username: "Low Data Three" },
    { profileId: "e2e_intel_visual_low_4", clerkId: "e2e_intel_visual_low_clerk_4", username: "Low Data Four" },
  ],
  sufficientMembers: [
    { profileId: "e2e_intel_visual_ok_1", clerkId: "e2e_intel_visual_ok_clerk_1", username: "Sufficient One" },
    { profileId: "e2e_intel_visual_ok_2", clerkId: "e2e_intel_visual_ok_clerk_2", username: "Sufficient Two" },
    { profileId: "e2e_intel_visual_ok_3", clerkId: "e2e_intel_visual_ok_clerk_3", username: "Sufficient Three" },
  ],
} as const;

const ALL_PROFILE_IDS = [
  FIXTURE.admin.profileId,
  ...FIXTURE.lowMembers.map((member) => member.profileId),
  ...FIXTURE.sufficientMembers.map((member) => member.profileId),
];

function scorePayload(input: { H: number; E: number; X: number; A: number; C: number; O: number }) {
  return {
    type: "likert",
    dimensions: {
      H: input.H,
      E: input.E,
      X: input.X,
      A: input.A,
      C: input.C,
      O: input.O,
    },
  };
}

async function cleanupFixture() {
  await prisma.assessmentResult.deleteMany({
    where: { userProfileId: { in: ALL_PROFILE_IDS } },
  });
  await prisma.teamMember.deleteMany({
    where: { teamId: { in: [FIXTURE.lowTeamId, FIXTURE.sufficientTeamId] } },
  });
  await prisma.teamPendingInvite.deleteMany({
    where: { teamId: { in: [FIXTURE.lowTeamId, FIXTURE.sufficientTeamId] } },
  });
  await prisma.team.deleteMany({
    where: { id: { in: [FIXTURE.lowTeamId, FIXTURE.sufficientTeamId] } },
  });
  await prisma.organizationPendingInvite.deleteMany({
    where: { orgId: FIXTURE.orgId },
  });
  await prisma.organizationMember.deleteMany({
    where: { orgId: FIXTURE.orgId },
  });
  await prisma.subscription.deleteMany({
    where: { orgId: FIXTURE.orgId },
  });
  await prisma.organization.deleteMany({
    where: { id: FIXTURE.orgId },
  });
  await prisma.userProfile.deleteMany({
    where: { id: { in: ALL_PROFILE_IDS } },
  });
}

async function createFixture() {
  await cleanupFixture();

  const now = new Date("2026-04-02T10:00:00.000Z");

  await prisma.userProfile.createMany({
    data: [
      {
        id: FIXTURE.admin.profileId,
        clerkId: FIXTURE.admin.clerkId,
        email: `${FIXTURE.admin.profileId}@test.trita.app`,
        username: FIXTURE.admin.username,
        locale: "hu",
        onboardedAt: now,
        consentedAt: now,
        testType: "HEXACO",
        testTypeAssignedAt: now,
      },
      ...FIXTURE.lowMembers.map((member) => ({
        id: member.profileId,
        clerkId: member.clerkId,
        email: `${member.profileId}@test.trita.app`,
        username: member.username,
        locale: "hu",
        onboardedAt: now,
        consentedAt: now,
        testType: "HEXACO",
        testTypeAssignedAt: now,
      })),
      ...FIXTURE.sufficientMembers.map((member) => ({
        id: member.profileId,
        clerkId: member.clerkId,
        email: `${member.profileId}@test.trita.app`,
        username: member.username,
        locale: "hu",
        onboardedAt: now,
        consentedAt: now,
        testType: "HEXACO",
        testTypeAssignedAt: now,
      })),
    ],
  });

  await prisma.organization.create({
    data: {
      id: FIXTURE.orgId,
      name: "E2E Intelligence Visual Org",
      ownerId: FIXTURE.admin.profileId,
      status: "ACTIVE",
    },
  });

  await prisma.organizationMember.createMany({
    data: [
      {
        orgId: FIXTURE.orgId,
        userId: FIXTURE.admin.profileId,
        role: "ORG_ADMIN",
      },
      ...FIXTURE.lowMembers.map((member) => ({
        orgId: FIXTURE.orgId,
        userId: member.profileId,
        role: "ORG_MEMBER" as const,
      })),
      ...FIXTURE.sufficientMembers.map((member) => ({
        orgId: FIXTURE.orgId,
        userId: member.profileId,
        role: "ORG_MEMBER" as const,
      })),
    ],
  });

  await prisma.team.createMany({
    data: [
      {
        id: FIXTURE.lowTeamId,
        name: "E2E Intelligence Low Data Team",
        ownerId: FIXTURE.admin.profileId,
        orgId: FIXTURE.orgId,
      },
      {
        id: FIXTURE.sufficientTeamId,
        name: "E2E Intelligence Sufficient Team",
        ownerId: FIXTURE.admin.profileId,
        orgId: FIXTURE.orgId,
      },
    ],
  });

  await prisma.teamMember.createMany({
    data: [
      {
        teamId: FIXTURE.lowTeamId,
        userId: FIXTURE.admin.profileId,
        role: "admin",
      },
      ...FIXTURE.lowMembers.map((member) => ({
        teamId: FIXTURE.lowTeamId,
        userId: member.profileId,
        role: "member" as const,
      })),
      {
        teamId: FIXTURE.sufficientTeamId,
        userId: FIXTURE.admin.profileId,
        role: "admin",
      },
      ...FIXTURE.sufficientMembers.map((member) => ({
        teamId: FIXTURE.sufficientTeamId,
        userId: member.profileId,
        role: "member" as const,
      })),
    ],
  });

  await prisma.assessmentResult.createMany({
    data: [
      {
        id: "e2e_intel_visual_result_admin",
        userProfileId: FIXTURE.admin.profileId,
        testType: "HEXACO",
        isSelfAssessment: true,
        scores: scorePayload({ H: 61, E: 47, X: 51, A: 58, C: 62, O: 56 }),
      },
      {
        id: "e2e_intel_visual_result_low_1",
        userProfileId: FIXTURE.lowMembers[0].profileId,
        testType: "HEXACO",
        isSelfAssessment: true,
        scores: scorePayload({ H: 55, E: 49, X: 33, A: 57, C: 54, O: 52 }),
      },
      {
        id: "e2e_intel_visual_result_ok_1",
        userProfileId: FIXTURE.sufficientMembers[0].profileId,
        testType: "HEXACO",
        isSelfAssessment: true,
        scores: scorePayload({ H: 49, E: 51, X: 73, A: 48, C: 52, O: 64 }),
      },
      {
        id: "e2e_intel_visual_result_ok_2",
        userProfileId: FIXTURE.sufficientMembers[1].profileId,
        testType: "HEXACO",
        isSelfAssessment: true,
        scores: scorePayload({ H: 58, E: 45, X: 30, A: 64, C: 66, O: 53 }),
      },
      {
        id: "e2e_intel_visual_result_ok_3",
        userProfileId: FIXTURE.sufficientMembers[2].profileId,
        testType: "HEXACO",
        isSelfAssessment: true,
        scores: scorePayload({ H: 63, E: 43, X: 68, A: 59, C: 60, O: 62 }),
      },
    ],
  });

  await prisma.userProfile.updateMany({
    where: { id: { in: ALL_PROFILE_IDS } },
    data: { activeOrgId: FIXTURE.orgId },
  });
}

async function setSessionCookies(context: BrowserContext, baseURL: string | undefined) {
  if (!baseURL) return;
  await context.addCookies([
    {
      name: E2E_AUTH_COOKIE_NAME,
      value: FIXTURE.admin.clerkId,
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

async function expectSectionScreenshot(locator: Locator, name: string) {
  await expect(locator).toBeVisible();
  await expect(locator).toHaveScreenshot(name, {
    animations: "disabled",
    caret: "hide",
    maxDiffPixelRatio: 0.01,
  });
}

test.describe("Team intelligence visual regression snapshots", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeAll(async () => {
    await createFixture();
  });

  test.afterAll(async () => {
    await cleanupFixture();
  });

  test.beforeEach(async ({ context, baseURL }) => {
    await setSessionCookies(context, baseURL);
  });

  test("low-data state has dedicated collection-first layout", async ({ page }) => {
    await page.goto(`/team/${FIXTURE.lowTeamId}?tab=intelligence`, { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/team/${FIXTURE.lowTeamId}`);

    const lowDataSection = page.locator("section").filter({
      has: page.getByRole("heading", { name: "Még nincs elég adat a csapatintelligenciához" }),
    });

    await expectSectionScreenshot(lowDataSection, "team-intelligence-low-data-hu.png");
  });

  test("sufficient-data state resource map and deep-dive CTA remain visually stable", async ({ page }) => {
    await page.goto(`/team/${FIXTURE.sufficientTeamId}?tab=intelligence`, { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/team/${FIXTURE.sufficientTeamId}`);

    const resourceSection = page.locator("section").filter({
      has: page.locator("p").filter({ hasText: /^Ki mit hoz a csapatba$/ }),
    });
    await expectSectionScreenshot(resourceSection, "team-intelligence-resource-map-hu.png");

    const deepDiveSection = page.locator("section").filter({
      has: page.locator("p").filter({ hasText: /^Részletes csapatszerep-elemzés$/ }),
    });
    await expectSectionScreenshot(deepDiveSection, "team-intelligence-deep-dive-cta-hu.png");
  });
});
