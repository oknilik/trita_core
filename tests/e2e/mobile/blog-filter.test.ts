import { expect, test, type Page } from "@playwright/test";

async function expectNoHorizontalOverflow(page: Page): Promise<void> {
  const dimensions = await page.evaluate(() => ({
    viewport: document.documentElement.clientWidth,
    content: document.documentElement.scrollWidth,
  }));
  expect(dimensions.content, JSON.stringify(dimensions)).toBeLessThanOrEqual(
    dimensions.viewport,
  );
}

test("a blog temak mobilon elerhetok, megoszthatok es kovetik a vissza gombot", async ({
  page,
}) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.setItem("trita_locale", "hu"));
  await page.goto("/blog");

  const filters = page.getByRole("group", { name: "Téma szerint" });
  await expect(filters).toBeVisible();

  const firstTopic = filters.getByRole("button").nth(1);
  const secondTopic = filters.getByRole("button").nth(2);
  await expect(firstTopic).toHaveAttribute("aria-pressed", "false");
  await expect(firstTopic).toHaveCSS("min-height", "44px");

  await firstTopic.click();
  await expect(firstTopic).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => new URL(page.url()).searchParams.get("topic")).not.toBeNull();
  await expect(page.getByRole("status")).toContainText(/\d+ cikk/);

  await secondTopic.click();
  await expect(secondTopic).toHaveAttribute("aria-pressed", "true");

  await page.goBack();
  await expect(firstTopic).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: "Szűrés törlése" }).click();
  await expect
    .poll(() => new URL(page.url()).searchParams.has("topic"))
    .toBe(false);
  await expect(filters.getByRole("button", { name: /^\u2713?\s*Összes/ })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expectNoHorizontalOverflow(page);
});
