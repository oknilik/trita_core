import { expect, test, type Locator, type Page } from "@playwright/test";

async function tabTo(page: Page, target: Locator, maxTabs = 20): Promise<void> {
  for (let index = 0; index < maxTabs; index += 1) {
    await page.keyboard.press("Tab");
    if (await target.evaluate((element) => document.activeElement === element)) return;
  }

  throw new Error(`A cél ${maxTabs} Tab után sem kapott fókuszt.`);
}

async function expectVisibleKeyboardFocus(target: Locator): Promise<void> {
  const focusStyle = await target.evaluate((element) => {
    const style = window.getComputedStyle(element);
    return {
      boxShadow: style.boxShadow,
      outlineStyle: style.outlineStyle,
      outlineWidth: style.outlineWidth,
    };
  });

  const hasOutline =
    focusStyle.outlineStyle !== "none" && focusStyle.outlineWidth !== "0px";
  const hasRing = focusStyle.boxShadow !== "none";

  expect(
    hasOutline || hasRing,
    `A billentyűzetes fókusz nem látható: ${JSON.stringify(focusStyle)}`,
  ).toBe(true);
}

test("a vendég kitöltés fő vezérlői Tab-bal elérhetők és látható fókuszt kapnak", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.setItem("trita_locale", "hu");
    localStorage.removeItem("trita_draft_TRITAN");
  });
  await page.goto("/try");

  const start = page.getByRole("button", { name: /kezd|start/i }).first();
  await expect(start).toBeVisible();
  await tabTo(page, start);
  await expectVisibleKeyboardFocus(start);
  await start.press("Space");

  await expect(page.getByRole("progressbar")).toBeVisible({ timeout: 15_000 });
  const firstAnswer = page.getByRole("radio", { name: /^1 - / }).first();
  await tabTo(page, firstAnswer);
  await expectVisibleKeyboardFocus(firstAnswer);
});
