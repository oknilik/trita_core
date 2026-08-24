import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

// A felső nav MAI modellje (2026-07-17 felület-diéta, lib/navigation/config.ts):
//   · admin (ORG_ADMIN): Vezérlő · Feladataim · Csapatok · Szervezet — NINCS
//     Analitika (kivezetve) és NINCS Jelöltek (a hiring 2026-07-23 óta a
//     tanácsadói köré: ORG_CONSULTANT / isConsultant / trita-admin);
//   · manager (ORG_MANAGER): Vezérlő · Feladataim · Csapatom — se Szervezet,
//     se Analitika, se Jelöltek.
// A /dashboard tiszta elosztó: admin → /org/[id] (org cockpit), manager →
// /manager, ami EGY kezelt csapatnál a /team/[id]-re továbbít (UX-audit #10).

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

  // Relatív dátumok: a fixture ne évüljön el (a lejárt subscription más
  // policy-állapotot adna).
  const now = new Date();
  const subscriptionPeriodEnd = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);

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
        testType: "TRITAN",
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
        testType: "TRITAN",
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
      currentPeriodEnd: subscriptionPeriodEnd,
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.assessmentResult.createMany({
    data: [
      {
        id: makeId("ia_result_admin"),
        userProfileId: adminProfileId,
        testType: "TRITAN",
        isSelfAssessment: true,
        scores: buildLikertScores(2),
      },
      {
        id: makeId("ia_result_manager"),
        userProfileId: managerProfileId,
        testType: "TRITAN",
        isSelfAssessment: true,
        scores: buildLikertScores(0),
      },
    ],
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
  let fixture: CriticalIaFixture | undefined;

  test.beforeAll(async () => {
    fixture = await createCriticalIaFixture();
  });

  test.afterAll(async () => {
    // Ha a beforeAll dobott, nincs mit takarítani — a guard nélkül a cleanup
    // maga is TypeError-ral halna el, és elfedné az eredeti hibát.
    if (!fixture) return;
    await cleanupCriticalIaFixture(fixture);
  });

  test("admin critical flows remain healthy after IA cleanup", async ({
    page,
    context,
    baseURL,
  }) => {
    // Ez a teszt HÉT különböző útvonalat tölt be egymás után (org cockpit,
    // csapat, org settings, assessment-layers, profil, /tasks). A webServer
    // `next dev`, tehát MINDEGYIK útvonal első betöltése fordítással jár —
    // ez összeadódva rendszeresen átlépte a 30 s-os alap-timeoutot, miközben
    // meleg szerverrel ugyanez ~20 s alatt lefut.
    //
    // A CI-ben a `retries: 2` eddig elfedte a bukást (a második futásra a
    // szerver már meleg volt) — csak a jelzés veszett el vele: egy VALÓDI
    // lassulás is „flaky retry"-ként ment volna át.
    test.slow();

    if (!fixture) throw new Error("fixture setup failed");
    await setSessionCookies(context, baseURL, fixture.admin.clerkId);

    // /dashboard = elosztó: org admin a szervezeti cockpiton landol.
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/org/${fixture.orgId}`);

    await expect(page.getByTestId("nav-item-home")).toBeVisible();
    await expect(page.getByTestId("nav-item-teams")).toBeVisible();
    await expect(page.getByTestId("nav-item-org")).toBeVisible();
    // Kivezetett / tanácsadói-körre szűkített menüpontok nem jelenhetnek meg.
    await expect(page.getByTestId("nav-item-analytics")).toHaveCount(0);
    await expect(page.getByTestId("nav-item-hiring")).toHaveCount(0);

    await page.goto(`/team/${fixture.teamId}`, { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/team/${fixture.teamId}`);
    await expect(
      page.getByRole("heading", { name: new RegExp(`IA Team ${fixture.teamId.slice(-4)}`) }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(`/org/${fixture.orgId}/settings`, { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/org/${fixture.orgId}/settings`);
    await expect(
      page.getByRole("heading", { name: new RegExp(`IA Org ${fixture.orgId.slice(-4)}`) }),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto("/assessment-layers", { waitUntil: "domcontentloaded" });
    await expectPathname(page, "/assessment-layers");
    await expect(
      page.locator('a[href^="/assessment-layers/"]').first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.goto(`/org/${fixture.orgId}`, { waitUntil: "domcontentloaded" });
    // A menü kliens-oldali — hydration előtt a kattintás elveszhet, ezért
    // addig próbálkozunk, amíg a menüelem tényleg megjelenik.
    await expect
      .poll(
        async () => {
          const profileItem = page.getByTestId("nav-user-menu-profile");
          if (await profileItem.isVisible().catch(() => false)) return "open";
          await page
            .getByTestId("nav-user-menu-trigger")
            .click({ timeout: 5_000 })
            .catch(() => undefined);
          return "pending";
        },
        { timeout: 15_000 },
      )
      .toBe("open");
    await page.getByTestId("nav-user-menu-profile").click();
    await expectPathname(page, "/profile");
    // A profil-fejléc kliens-oldali API-ból tölt — dev-fordítással együtt is
    // beférő türelmi idő.
    await expect(
      page.getByRole("heading", { name: /IA Admin/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-platform-surface="self"]')).toBeVisible();

    await page.goto("/tasks", { waitUntil: "domcontentloaded" });
    await expectPathname(page, "/tasks");
    await expect(
      page.getByRole("heading", { name: /Mérési feladataim/i }),
    ).toBeVisible({ timeout: 15_000 });
    await expect(page.locator('[data-platform-surface="self"]')).toBeVisible();

    const taskPageWidth = await page.evaluate(() => ({
      viewport: document.documentElement.clientWidth,
      content: document.documentElement.scrollWidth,
    }));
    expect(taskPageWidth.content).toBeLessThanOrEqual(taskPageWidth.viewport);
  });

  test("manager dashboard keeps simplified role navigation", async ({
    page,
    context,
    baseURL,
  }) => {
    if (!fixture) throw new Error("fixture setup failed");
    await setSessionCookies(context, baseURL, fixture.manager.clerkId);

    // /dashboard → /manager → egyetlen kezelt csapatnál egyből a csapatoldal.
    await page.goto("/dashboard", { waitUntil: "domcontentloaded" });
    await expectPathname(page, `/team/${fixture.teamId}`);

    await expect(page.getByTestId("nav-item-home")).toBeVisible();
    await expect(page.getByTestId("nav-item-teams")).toBeVisible();
    await expect(page.getByTestId("nav-item-org")).toHaveCount(0);
    await expect(page.getByTestId("nav-item-analytics")).toHaveCount(0);
    await expect(page.getByTestId("nav-item-hiring")).toHaveCount(0);
  });
});
