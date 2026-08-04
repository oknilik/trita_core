import { expect, test, type Page } from "@playwright/test";

function pathnameOf(url: string): string {
  return new URL(url).pathname;
}

async function expectFinalPathname(page: Page, expectedPathname: string) {
  await expect
    .poll(() => pathnameOf(page.url()), {
      timeout: 15_000,
      message: `expected final pathname to be ${expectedPathname}`,
    })
    .toBe(expectedPathname);
}

async function expectRedirectPath(page: Page, sourcePath: string, expectedPathname: string) {
  await page.goto(sourcePath, { waitUntil: "domcontentloaded" });
  await expectFinalPathname(page, expectedPathname);
}

test.describe("Journey entrypoint smoke (guest handoff)", () => {
  test.beforeEach(async ({ context, baseURL }) => {
    if (baseURL) {
      await context.addCookies([
        {
          name: "trita_locale",
          value: "en",
          url: baseURL,
        },
      ]);
    }
  });

  test("dashboard handoff forwards to sign-in", async ({ page }) => {
    await expectRedirectPath(page, "/dashboard", "/sign-in");

    const emailInput = page.locator("input[type='email']").first();
    const primaryCta = page.locator("form button[type='submit']").first();
    await expect(emailInput).toBeVisible();
    await expect(primaryCta).toBeVisible();
  });

  test("sign-in entrypoint keeps redirect intent and CTA remains coherent", async ({ page }) => {
    await page.goto("/sign-in?redirect_url=%2Fdashboard", { waitUntil: "domcontentloaded" });
    await expectFinalPathname(page, "/sign-in");

    const emailInput = page.locator("input[type='email']").first();
    const primaryCta = page.locator("form button[type='submit']").first();
    const signUpLink = page.getByRole("link", { name: /sign up|regisztr/i }).first();

    await expect(emailInput).toBeVisible();
    await expect(primaryCta).toBeVisible();
    await expect(signUpLink).toHaveAttribute("href", /redirect_url=%2Fdashboard/);
  });

  test("sign-up entrypoint keeps redirect intent and unlocks CTA only after intent pick", async ({ page }) => {
    await page.goto("/sign-up?redirect_url=%2Fdashboard", { waitUntil: "domcontentloaded" });
    await expectFinalPathname(page, "/sign-up");

    const primaryCta = page.locator("form button[type='submit']").first();
    const signInLink = page.getByRole("link", { name: /sign in|bejelentk/i }).first();
    const intentButton = page.getByRole("button", { name: /Önismeret|Self-awareness/i }).first();

    await expect(primaryCta).toBeDisabled();
    await intentButton.click();
    await expect(primaryCta).toBeEnabled();
    await expect(signInLink).toHaveAttribute("href", /redirect_url=%2Fdashboard/);
  });

  test("onboarding finish entrypoint falls back through protected-route guard", async ({ page }) => {
    await expectRedirectPath(page, "/onboarding", "/");
  });

  test("billing return entrypoint falls back through protected-route guard", async ({ page }) => {
    await expectRedirectPath(page, "/billing/return?session_id=missing", "/");
  });

  test("deep link /dashboard falls back through protected-route guard", async ({ page }) => {
    await expectRedirectPath(page, "/dashboard", "/");
  });

  test("deep link /assessment falls back through protected-route guard", async ({ page }) => {
    await expectRedirectPath(page, "/assessment", "/");
  });

  test("invite accept entrypoint with invalid token returns 404 without wrong redirect", async ({ page }) => {
    const response = await page.goto("/join/c4-smoke-invalid-token", { waitUntil: "domcontentloaded" });
    expect(response?.status()).toBe(404);
    await expectFinalPathname(page, "/join/c4-smoke-invalid-token");
  });
});
