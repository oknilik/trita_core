import { randomUUID } from "node:crypto";
import { expect, test, type BrowserContext, type Page } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";
import { getCapabilityGateCopy } from "../../../src/lib/policy-ux";

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

// A capability-megtagadás INDOKLÁSÁNAK sorrendjét őrzi (2026-08-17, P1):
// a szerep-ellenőrzés megelőzi az előfizetés-ellenőrzést. Ez nem kozmetika —
// a régi sorrendben egy org-szinten sima ORG_MEMBER (aki a saját csapatában
// team-manager) „Előfizetés kezelése" CTA-t kapott egy olyan akcióra, amihez
// a SZEREPE eleve kevés: rossz teendőt kért attól, aki nem tehet ellene
// semmit, és közben kiszivárogtatta az org billing-állapotát nem-admin
// szerepnek.
//
// A unit teszt (tests/unit/policy/policy-engine.test.ts) a döntést magát
// fedi; ez a kör azt bizonyítja, hogy a döntés a VALÓDI stacken keresztül
// (DB → policy-service → team page → policy-ux) a felületre is így ér ki.
//
// Miért a csapatoldal a mérőpont: a capability-gate szövege ott jelenik meg
// nem-admin szereplőnek (TeamHeroBlock footer), és a `restricted` állapot a
// teamManage capabilityt mindkét szereptől elveszi — így a gate mindkét
// vizsgált szerepnél renderelődik, csak MÁS indoklással.

// A várt szövegeket a termék-kódból származtatjuk: a teszt a HUZALOZÁST
// őrzi (melyik indok ér ki a felületre), nem a szövegezést. Copy-átírás
// ne törje el; sorrend-visszaesés viszont igen.
const roleCopy = getCapabilityGateCopy({
  locale: "hu",
  reason: "ROLE_INSUFFICIENT",
  upgradeHintCode: "request_manager_access",
});
const subscriptionCopy = getCapabilityGateCopy({
  locale: "hu",
  reason: "SUBSCRIPTION_RESTRICTED",
  upgradeHintCode: "reactivate_subscription",
});

interface CapabilityGateFixture {
  orgId: string;
  teamId: string;
  /** Org-szinten ORG_MEMBER, a csapatában viszont team-manager. */
  teamLead: { profileId: string; clerkId: string };
  /** Org-szintű manager ugyanabban a csapatban — kontroll-eset. */
  orgManager: { profileId: string; clerkId: string };
}

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function createCapabilityGateFixture(): Promise<CapabilityGateFixture> {
  const orgId = makeId("gate_org");
  const teamId = makeId("gate_team");
  const teamLeadProfileId = makeId("gate_lead_profile");
  const teamLeadClerkId = makeId("gate_lead_clerk");
  const orgManagerProfileId = makeId("gate_mgr_profile");
  const orgManagerClerkId = makeId("gate_mgr_clerk");

  const now = new Date();
  // Relatív dátum: a fixture ne évüljön el. A `past_due` amúgy is dátumtól
  // függetlenül `restricted` (getSubscriptionState) — a frozen ág kizárólag
  // `canceled` + 30 napnál régebbi periódusvég esetén nyílna.
  const currentPeriodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  await prisma.userProfile.createMany({
    data: [
      {
        id: teamLeadProfileId,
        clerkId: teamLeadClerkId,
        email: `${teamLeadProfileId}@test.trita.app`,
        username: `Gate Lead ${teamLeadProfileId.slice(-4)}`,
        locale: "hu",
        onboardedAt: now,
        consentedAt: now,
        testType: "TRITAN",
        testTypeAssignedAt: now,
      },
      {
        id: orgManagerProfileId,
        clerkId: orgManagerClerkId,
        email: `${orgManagerProfileId}@test.trita.app`,
        username: `Gate Manager ${orgManagerProfileId.slice(-4)}`,
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
      name: `Gate Org ${orgId.slice(-4)}`,
      ownerId: teamLeadProfileId,
      status: "ACTIVE",
    },
  });

  await prisma.organizationMember.createMany({
    data: [
      { orgId, userId: teamLeadProfileId, role: "ORG_MEMBER" },
      { orgId, userId: orgManagerProfileId, role: "ORG_MANAGER" },
    ],
  });

  await prisma.team.create({
    data: { id: teamId, name: `Gate Team ${teamId.slice(-4)}`, ownerId: teamLeadProfileId, orgId },
  });

  // MINDKETTEN csapat-szintű managerek: a gate csak akkor renderelődik, ha a
  // néző kezelheti a csapatot (canManageTeam), de a capability tiltott.
  await prisma.teamMember.createMany({
    data: [
      { teamId, userId: teamLeadProfileId, role: "manager" },
      { teamId, userId: orgManagerProfileId, role: "manager" },
    ],
  });

  // `past_due` → `restricted`: a írás-capabilityk (köztük a teamManage)
  // tiltottak, a tartalom látható marad. Ez az az állapot, amelyben a régi
  // sorrend a billing-indokot adta vissza a szerep-indok helyett.
  await prisma.subscription.create({
    data: {
      orgId,
      status: "past_due",
      currentPeriodEnd,
      trialEndsAt: null,
      cancelAtPeriodEnd: false,
    },
  });

  await prisma.userProfile.updateMany({
    where: { id: { in: [teamLeadProfileId, orgManagerProfileId] } },
    data: { activeOrgId: orgId },
  });

  return {
    orgId,
    teamId,
    teamLead: { profileId: teamLeadProfileId, clerkId: teamLeadClerkId },
    orgManager: { profileId: orgManagerProfileId, clerkId: orgManagerClerkId },
  };
}

async function cleanupCapabilityGateFixture(fixture: CapabilityGateFixture): Promise<void> {
  const profileIds = [fixture.teamLead.profileId, fixture.orgManager.profileId];
  await prisma.teamMember.deleteMany({ where: { teamId: fixture.teamId } });
  await prisma.team.deleteMany({ where: { id: fixture.teamId } });
  await prisma.organizationMember.deleteMany({ where: { orgId: fixture.orgId } });
  await prisma.subscription.deleteMany({ where: { orgId: fixture.orgId } });
  await prisma.organization.deleteMany({ where: { id: fixture.orgId } });
  await prisma.userProfile.deleteMany({ where: { id: { in: profileIds } } });
}

async function setSessionCookies(
  context: BrowserContext,
  baseURL: string | undefined,
  clerkId: string,
) {
  if (!baseURL) return;
  await context.addCookies([
    { name: E2E_AUTH_COOKIE_NAME, value: clerkId, url: baseURL },
    { name: "trita_locale", value: "hu", url: baseURL },
  ]);
}

async function openTeamPage(page: Page, teamId: string) {
  await page.goto(`/team/${teamId}`, { waitUntil: "domcontentloaded" });
  await expect
    .poll(() => new URL(page.url()).pathname, {
      timeout: 15_000,
      message: `expected to stay on /team/${teamId}`,
    })
    .toBe(`/team/${teamId}`);
}

test.describe("Capability-gate indoklás — szerep az előfizetés előtt", () => {
  let fixture: CapabilityGateFixture | undefined;

  test.beforeAll(async () => {
    fixture = await createCapabilityGateFixture();
  });

  test.afterAll(async () => {
    // Ha a beforeAll dobott, nincs mit takarítani — guard nélkül a cleanup
    // maga is elhalna, és elfedné az eredeti hibát.
    if (!fixture) return;
    await cleanupCapabilityGateFixture(fixture);
  });

  test("org-tag (csapat-manager) szerep-indokot kap, nem billing-CTA-t", async ({
    page,
    context,
    baseURL,
  }) => {
    if (!fixture) throw new Error("fixture setup failed");
    await setSessionCookies(context, baseURL, fixture.teamLead.clerkId);

    await openTeamPage(page, fixture.teamId);

    await expect(page.getByText(roleCopy.description)).toBeVisible({ timeout: 15_000 });
    // A REGRESSZIÓ-ŐR: a billing-állapot nem szivároghat ki olyan szerepnek,
    // amelyik úgysem tehet ellene semmit.
    await expect(page.getByText(subscriptionCopy.description)).toHaveCount(0);
  });

  test("org-manager továbbra is az előfizetés-indokot kapja", async ({
    page,
    context,
    baseURL,
  }) => {
    if (!fixture) throw new Error("fixture setup failed");
    await setSessionCookies(context, baseURL, fixture.orgManager.clerkId);

    await openTeamPage(page, fixture.teamId);

    // Az ellenpróba: a sorrend-csere NEM nyelheti el az előfizetés-indokot
    // ott, ahol a szerep elegendő — különben a restricted org managere sem
    // kapna reaktiválási teendőt.
    await expect(page.getByText(subscriptionCopy.description)).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText(roleCopy.description)).toHaveCount(0);
  });
});
