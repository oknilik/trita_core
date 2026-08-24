import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const routes = ["/sign-in", "/sign-up", "/try", "/blog", "/pilot"];
const viewports = [
  { width: 360, height: 800, name: "mobile" },
  { width: 1440, height: 900, name: "desktop" },
] as const;
const themes = ["light", "dark"] as const;

for (const route of routes) {
  for (const viewport of viewports) {
    for (const theme of themes) {
      test(`axe: ${route} · ${viewport.name} · ${theme}`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport);
        await page.goto("/");
        await page.evaluate((selectedTheme) => localStorage.setItem("trita_theme", selectedTheme), theme);
        await page.goto(route);
        await page.waitForLoadState("networkidle");

        const result = await new AxeBuilder({ page })
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const blockers = result.violations.filter((violation) =>
          violation.impact === "critical" || violation.impact === "serious",
        );
        await testInfo.attach("axe-results", {
          body: JSON.stringify(result, null, 2),
          contentType: "application/json",
        });
        expect(blockers, JSON.stringify(blockers, null, 2)).toEqual([]);
      });
    }
  }
}
