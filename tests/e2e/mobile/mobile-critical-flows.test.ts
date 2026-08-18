import { expect, test, type Locator, type Page } from "@playwright/test";

const HELP_BUTTON = /segítség|help/i;

async function settleResponsiveLayout(page: Page): Promise<void> {
  await page.waitForLoadState("domcontentloaded");
  // A kérdésváltás Framer Motion animációja rövid ideig szándékosan
  // translateX-et használ. A stabil végállapotot mérjük, nem az átmenetet.
  await page.waitForTimeout(600);
}

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  await settleResponsiveLayout(page);
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content, JSON.stringify(dimensions)).toBeLessThanOrEqual(dimensions.viewport);
}

async function expectTouchTarget(locator: Locator): Promise<void> {
  await expect(locator).toBeVisible();
  const box = await locator.boundingBox();
  expect(box, "a fő műveletnek mérhető érintési cél kell").not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

async function expectFocusRouteWithoutHelp(page: Page): Promise<void> {
  await expect(page.getByRole("button", { name: HELP_BUTTON })).toHaveCount(0);
}

async function openGuestAssessment(page: Page): Promise<void> {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("trita_locale", "hu");
    localStorage.removeItem("trita_draft_TRITAN");
  });
  await page.goto("/try");

  const start = page.getByRole("button", { name: /kezd|start/i }).first();
  const progress = page.getByRole("progressbar");

  // A `/try` dev-módban igény szerint fordul, és az intro csak draft nélkül
  // jelenik meg. A puszta `isVisible()` PILLANATNYI kérdés: a fordítás alatt
  // hamisat ad, a teszt szó nélkül kihagyja a kattintást, majd 15s-et vár egy
  // olyan kitöltőre, amit el sem indított — ez okozta a projektek közti
  // „hol zöld, hol piros" viselkedést (amelyik projekt először ért ide, az
  // fizette a fordítást). Előbb megvárjuk, hogy VALAMELYIK állapot kiálljon.
  await expect(start.or(progress).first()).toBeVisible({ timeout: 60_000 });
  if (await start.isVisible().catch(() => false)) await start.click({ force: true });

  await expect(progress).toBeVisible({ timeout: 15_000 });
}

test.describe("Mobil pilot minőségkapu", () => {
  test("a vendég assessment fókuszált, használható és nem lóg túl", async ({ page }) => {
    await openGuestAssessment(page);

    await expectFocusRouteWithoutHelp(page);
    await expect(page.getByText(/Automatikus továbblépés/i)).toBeVisible();
    await expectTouchTarget(page.getByRole("button", { name: /Tovább.*→/i }));
    await expectNoHorizontalOverflow(page);

    const progress = page.getByRole("progressbar");
    await expect(progress).toHaveAttribute("aria-valuemin", "1");
    await expect(progress).toHaveAttribute("aria-valuemax", "60");
    await expect(progress).toHaveAttribute("aria-valuenow", "1");
  });

  test("az auth belépő mobilon olvasható, címkézett és a viewporton belül marad", async ({ page }) => {
    await page.goto("/tasks?filter=open");
    await expect(page).toHaveURL(
      /\/sign-in\?redirect_url=%2Ftasks%3Ffilter%3Dopen/,
    );
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/folytasd|continue/i);
    await expect(page.getByLabel(/e-mail|email/i)).toBeVisible();
    await expectTouchTarget(page.getByRole("link", { name: "trita" }));
    await expectTouchTarget(page.getByRole("link", { name: /főoldal|home/i }));
    await expectTouchTarget(page.getByRole("button", { name: /belépési kód|sign-in code/i }));

    const headingOrder = await page.locator("h1, h2").evaluateAll((headings) =>
      headings.map((heading) => heading.tagName),
    );
    expect(headingOrder[0]).toBe("H1");
    await expectNoHorizontalOverflow(page);
  });

  for (const route of [
    "/join/mobile-smoke-invalid-token",
    "/observe/mobile-smoke-invalid-token",
    "/apply/mobile-smoke-invalid-token",
  ]) {
    test(`${route} hibaállapota sem kap ütköző widgetet vagy overflow-t`, async ({ page }) => {
      test.setTimeout(90_000);
      await page.goto(route, { waitUntil: "domcontentloaded" });
      await expectFocusRouteWithoutHelp(page);
      await expectNoHorizontalOverflow(page);
    });
  }
});
