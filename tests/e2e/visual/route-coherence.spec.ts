import { existsSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

// Route-szintű vizuális regressziós mátrix. A token-galéria a színeket őrzi;
// ez a suite a valódi oldalak hierarchiáját, ritmusát és reszponzív töréseit.
// A publikus, determinisztikusan elérhető útvonalakat választjuk, hogy a
// baseline ne függjön Clerk-sessiontől vagy seedelt adatbázis-azonosítóktól.
const ROUTES = [
  { name: "home", path: "/" },
  { name: "about", path: "/about" },
  { name: "how-we-work", path: "/how-we-work" },
  { name: "pilot", path: "/pilot" },
  { name: "contact", path: "/contact" },
  { name: "blog", path: "/blog" },
  { name: "patterns", path: "/patterns" },
  { name: "pricing", path: "/pricing" },
  { name: "privacy", path: "/privacy" },
  { name: "try", path: "/try" },
] as const;

const THEMES = ["light", "dark"] as const;
const VIEWPORTS = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 390, height: 844 },
} as const;

const SNAPSHOT_DIR = join(
  process.cwd(),
  "tests/e2e/visual/route-coherence.spec.ts-snapshots",
);
const UPDATING = process.env.UPDATE_VISUAL_BASELINE === "1";

function hasBaseline(name: string): boolean {
  if (!existsSync(SNAPSHOT_DIR)) return false;
  return readdirSync(SNAPSHOT_DIR).some(
    (file) => file === `${name}.png` || (file.startsWith(`${name}-`) && file.endsWith(".png")),
  );
}

for (const route of ROUTES) {
  for (const theme of THEMES) {
    for (const [viewportName, viewport] of Object.entries(VIEWPORTS)) {
      const snapshotName = `${route.name}-${theme}-${viewportName}`;

      test.describe(`${route.path} — ${theme} — ${viewportName}`, () => {
        test.skip(
          !UPDATING && !hasBaseline(snapshotName),
          "nincs commitolt route-baseline — generáld a CI platformján UPDATE_VISUAL_BASELINE=1 értékkel",
        );

        test("vizuálisan stabil", async ({ page, context, baseURL }) => {
          await page.setViewportSize(viewport);
          await context.addCookies([
            {
              name: "trita_theme",
              value: theme,
              url: baseURL ?? "http://127.0.0.1:4100",
            },
          ]);

          await page.goto(route.path, { waitUntil: "networkidle" });
          await expect
            .poll(() => page.evaluate(() => document.documentElement.dataset.theme))
            .toBe(theme);
          await page.evaluate(() => document.fonts.ready);
          await page.addStyleTag({
            content:
              "*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important} html{scroll-behavior:auto!important}",
          });

          await expect(page).toHaveScreenshot(`${snapshotName}.png`, {
            fullPage: true,
            animations: "disabled",
            maxDiffPixelRatio: 0.003,
            mask: [page.locator("time")],
          });
        });
      });
    }
  }
}
