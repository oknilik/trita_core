import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

interface BillingFixture {
  profileId: string;
  clerkId: string;
  orgId: string;
}

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function pathnameOf(url: string): string {
  return new URL(url).pathname;
}

async function createBillingFixture(): Promise<BillingFixture> {
  const profileId = makeId("billing_profile");
  const clerkId = makeId("billing_clerk");
  const orgId = makeId("billing_org");

  await prisma.userProfile.create({
    data: {
      id: profileId,
      clerkId,
      email: `${profileId}@test.trita.app`,
      username: `Billing E2E ${profileId}`,
      locale: "hu",
      onboardedAt: new Date("2026-04-01T10:00:00.000Z"),
      consentedAt: new Date("2026-04-01T10:00:00.000Z"),
    },
  });

  await prisma.organization.create({
    data: {
      id: orgId,
      name: `Billing Org ${orgId}`,
      ownerId: profileId,
      status: "ACTIVE",
    },
  });

  await prisma.organizationMember.create({
    data: {
      orgId,
      userId: profileId,
      role: "ORG_ADMIN",
    },
  });

  await prisma.userProfile.update({
    where: { id: profileId },
    data: { activeOrgId: orgId },
  });

  return { profileId, clerkId, orgId };
}

async function cleanupBillingFixture(fixture: BillingFixture): Promise<void> {
  await prisma.subscription.deleteMany({ where: { orgId: fixture.orgId } });
  await prisma.organizationMember.deleteMany({ where: { orgId: fixture.orgId } });
  await prisma.organization.deleteMany({ where: { id: fixture.orgId } });
  await prisma.userProfile.deleteMany({ where: { id: fixture.profileId } });
}

test.describe("D4 Billing E2E happy path", () => {
  test("user starts upgrade, returns from checkout, and sees refreshed active state", async ({
    page,
    context,
    baseURL,
  }) => {
    const fixture = await createBillingFixture();
    try {
      if (baseURL) {
        await context.addCookies([
          {
            name: E2E_AUTH_COOKIE_NAME,
            value: fixture.clerkId,
            url: baseURL,
          },
          {
            name: "trita_locale",
            value: "hu",
            url: baseURL,
          },
        ]);
      }

      await page.route("**/billing/checkout?plan=*", async (route) => {
        const url = new URL(route.request().url());
        const selectedPlan = url.searchParams.get("plan") ?? "unknown";
        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `<!doctype html>
<html lang="hu">
  <body>
    <h1>Mock Stripe checkout</h1>
    <p data-testid="selected-plan">${selectedPlan}</p>
    <button id="complete">Fizetés befejezése</button>
    <script>
      localStorage.setItem("trita_e2e_billing_checkout_plan", "${selectedPlan}");
      document.getElementById("complete").addEventListener("click", () => {
        window.location.assign("/billing/return?session_id=cs_e2e_upgrade_success");
      });
    </script>
  </body>
</html>`,
        });
      });

      await page.route("**/billing/return?session_id=cs_e2e_upgrade_success", async (route) => {
        await prisma.subscription.upsert({
          where: { orgId: fixture.orgId },
          create: {
            orgId: fixture.orgId,
            status: "active",
            stripeCustomerId: `cus_${fixture.orgId}`,
            stripeSubscriptionId: `sub_${fixture.orgId}`,
            stripePriceId: "price_org_annual_e2e",
            currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
            trialEndsAt: null,
            cancelAtPeriodEnd: false,
          },
          update: {
            status: "active",
            stripePriceId: "price_org_annual_e2e",
            currentPeriodEnd: new Date("2026-06-01T00:00:00.000Z"),
            trialEndsAt: null,
            cancelAtPeriodEnd: false,
          },
        });

        await route.fulfill({
          status: 200,
          contentType: "text/html",
          body: `<!doctype html>
<html lang="hu">
  <body>
    <script>
      localStorage.setItem("trita_e2e_billing_state", "active");
      window.location.assign("/billing/upgrade?portal=updated");
    </script>
  </body>
</html>`,
        });
      });

      await page.goto("/billing/upgrade", { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /Aktiváld az előfizetést/i }),
      ).toBeVisible();

      await page.getByRole("button", { name: /Fizetés/i }).first().click();
      await expect(
        page.getByRole("heading", { name: /Mock Stripe checkout/i }),
      ).toBeVisible();

      await expect(page.getByTestId("selected-plan")).toHaveText("team_annual");
      await page.locator("#complete").click();

      await expect
        .poll(() => pathnameOf(page.url()), {
          timeout: 15_000,
          message: "expected billing return handoff to reach /billing/upgrade",
        })
        .toBe("/billing/upgrade");

      await expect(page.getByRole("heading", { name: /Előfizetés aktív/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Számlázás kezelése/i })).toBeVisible();

      await expect
        .poll(
          () =>
            prisma.subscription.findUnique({
              where: { orgId: fixture.orgId },
              select: { status: true },
            }),
          { timeout: 10_000 },
        )
        .toMatchObject({ status: "active" });

      const localState = await page.evaluate(() =>
        window.localStorage.getItem("trita_e2e_billing_state"),
      );
      expect(localState).toBe("active");
    } finally {
      await cleanupBillingFixture(fixture);
    }
  });
});
