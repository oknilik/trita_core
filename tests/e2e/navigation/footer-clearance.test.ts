import { expect, test, type Page } from "@playwright/test";

const PUBLIC_FOOTER_ROUTES = [
  "/",
  "/about",
  "/rolunk",
  "/how-we-work",
  "/pilot",
  "/privacy",
  "/contact",
  "/blog",
  "/blog/tritan-vs-mbti",
] as const;

const VIEWPORTS = [360, 390, 768, 1024, 1440] as const;

async function footerGeometry(page: Page) {
  return page.evaluate(() => {
    const footer = document.querySelector<HTMLElement>("[data-site-footer]");
    const surface = document.querySelector<HTMLElement>("[data-footer-surface]");
    const pageContent = footer?.previousElementSibling as HTMLElement | null;

    if (!footer || !surface || !pageContent) return null;

    const footerStyle = getComputedStyle(footer);
    const surfaceStyle = getComputedStyle(surface);
    const contentBottom = pageContent.getBoundingClientRect().bottom + window.scrollY;
    const surfaceTop = surface.getBoundingClientRect().top + window.scrollY;

    return {
      clearance: surfaceTop - contentBottom,
      footerBackground: footerStyle.backgroundColor,
      surfaceBackground: surfaceStyle.backgroundImage,
      documentWidth: document.documentElement.scrollWidth,
      viewportWidth: document.documentElement.clientWidth,
    };
  });
}

test("minden publikus oldalon és törésponton elkülönül a tartalom a footertől", async ({ page }) => {
  test.setTimeout(180_000);

  for (const route of PUBLIC_FOOTER_ROUTES) {
    await page.goto(route, { waitUntil: "domcontentloaded" });
    await expect(page.locator("[data-site-footer]")).toBeVisible();

    for (const width of VIEWPORTS) {
      await page.setViewportSize({ width, height: 900 });
      const geometry = await footerGeometry(page);

      expect(geometry, `${route} @ ${width}px: hiányos footer-szerkezet`).not.toBeNull();
      expect(
        geometry!.clearance,
        `${route} @ ${width}px: a footer túl közel került az oldal tartalmához`,
      ).toBeGreaterThanOrEqual(64);
      expect(
        geometry!.documentWidth,
        `${route} @ ${width}px: vízszintes overflow`,
      ).toBeLessThanOrEqual(geometry!.viewportWidth);
      expect(geometry!.footerBackground).not.toBe("rgba(0, 0, 0, 0)");
      expect(geometry!.surfaceBackground).toContain("gradient");
    }
  }
});
