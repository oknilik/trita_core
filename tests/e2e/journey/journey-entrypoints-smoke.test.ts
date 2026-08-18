import { expect, test, type Page } from "@playwright/test";

// A vendég-útvonalak MAI szerződése (src/proxy.ts):
//   · védett route (/dashboard, /assessment, /onboarding, /billing/…) vendégként
//     a /sign-in-re esik vissza, ÉS megőrzi az eredeti célt a `redirect_url`
//     paraméterben (auth.protect unauthenticatedUrl + buildSignInPath).
//     2026-08-18 előtt a landingre ("/") esett vissza, a szándék elvesztésével;
//     a mélylink-megőrzés a UI/UX-kör tudatos váltása;
//   · a `redirect_url` KIZÁRÓLAG alkalmazáson belüli útvonal lehet
//     (sanitizeInternalRedirect) — protokoll-relatív külső URL nem;
//   · a /sign-in és /sign-up vendégnek helyben marad, bejelentkezett usert
//     a `redirect_url`-re, annak híján a journey-kapura (/dashboard) irányítja;
//   · érvénytelen join-token: az (app) not-found felület renderel, az URL nem
//     változik. A notFound() streamelt válaszban érkezik (ld. a
//     src/app/(app)/not-found.tsx kommentjét), ezért a HTTP-státusz nem 404 —
//     a tartalmat és az URL-t assertáljuk.
//
// A korábbi sign-in/sign-up ŰRLAP-assertek (email input, intent-pick utáni
// CTA-unlock) kivezetve: a custom Clerk flow űrlapja csak isLoaded után
// renderel (clerk-js betöltés — az e2e dummy kulcsával nincs élő instance),
// az intent-választó pedig consulting-led módban nem létezik (a sign-up
// "explore" intent-tel indul, ld. src/app/(auth)/sign-up/page.tsx).

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

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

/**
 * Védett mélylink vendégként: a /sign-in-en kell kikötni ÚGY, hogy az eredeti
 * cél (útvonal + query) megmaradjon a `redirect_url`-ben. A pathname önmagában
 * kevés lenne — pont a szándék megőrzése a szerződés lényege.
 */
async function expectSignInWithReturnTo(page: Page, sourcePath: string) {
  await page.goto(sourcePath, { waitUntil: "domcontentloaded" });
  await expectFinalPathname(page, "/sign-in");
  await expect
    .poll(() => new URL(page.url()).searchParams.get("redirect_url"), {
      timeout: 15_000,
      message: `expected redirect_url to preserve ${sourcePath}`,
    })
    .toBe(sourcePath);
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

  test("dashboard handoff forwards guests to sign-in and keeps the target", async ({ page }) => {
    await expectSignInWithReturnTo(page, "/dashboard");
  });

  test("sign-in entrypoint stays in place for guests", async ({ page }) => {
    const response = await page.goto("/sign-in?redirect_url=%2Fdashboard", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    await expectFinalPathname(page, "/sign-in");
  });

  test("sign-up entrypoint stays in place for guests", async ({ page }) => {
    const response = await page.goto("/sign-up?redirect_url=%2Fdashboard", {
      waitUntil: "domcontentloaded",
    });
    expect(response?.status()).toBe(200);
    await expectFinalPathname(page, "/sign-up");
  });

  test("authenticated user is bounced from auth routes to the journey handoff", async ({
    page,
    context,
    baseURL,
  }) => {
    if (baseURL) {
      await context.addCookies([
        {
          name: E2E_AUTH_COOKIE_NAME,
          value: "journey-smoke-authed-user",
          url: baseURL,
        },
      ]);
    }

    // A middleware-szerződést nyersen assertáljuk (maxRedirects: 0): a
    // bejelentkezett user auth-route-ról a journey-kapura (/dashboard)
    // pattan. A teljes lánc követése itt nem cél — a kapu mögötti út a
    // user DB-állapotától függ (profil nélkül pl. /onboarding a vége).
    for (const authRoute of ["/sign-in", "/sign-up"]) {
      const response = await page.request.get(authRoute, { maxRedirects: 0 });
      expect(response.status(), `${authRoute} should redirect`).toBe(307);
      expect(response.headers()["location"]).toContain("/dashboard");
    }
  });

  test("auth-route bounce refuses an external redirect_url", async ({ page, context, baseURL }) => {
    if (baseURL) {
      await context.addCookies([
        {
          name: E2E_AUTH_COOKIE_NAME,
          value: "journey-smoke-authed-user",
          url: baseURL,
        },
      ]);
    }

    // A `sanitizeInternalRedirect` egységtesztje a függvényt fedi; ez azt
    // bizonyítja, hogy a middleware a valódi bounce-ágon MEG IS HÍVJA. A
    // protokoll-relatív `//evil.example` a klasszikus nyitott-átirányítás:
    // `startsWith("/")` átengedné, a böngésző viszont külső hostra vinné.
    const response = await page.request.get("/sign-in?redirect_url=%2F%2Fevil.example", {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(307);
    const location = response.headers()["location"] ?? "";
    expect(location).toContain("/dashboard");
    expect(location).not.toContain("evil.example");
  });

  test("onboarding finish entrypoint falls back through protected-route guard", async ({ page }) => {
    await expectSignInWithReturnTo(page, "/onboarding");
  });

  test("billing return entrypoint falls back through protected-route guard", async ({ page }) => {
    await expectSignInWithReturnTo(page, "/billing/return?session_id=missing");
  });

  test("deep link /dashboard falls back through protected-route guard", async ({ page }) => {
    await expectSignInWithReturnTo(page, "/dashboard");
  });

  test("deep link /assessment falls back through protected-route guard", async ({ page }) => {
    await expectSignInWithReturnTo(page, "/assessment");
  });

  test("invite accept entrypoint with invalid token shows not-found without wrong redirect", async ({ page }) => {
    // A TESZT keretét is tágítani kell, nem csak az állításét (2026-08-11).
    //
    // A not-found tartalom streamelve érkezik: a `next dev` igény szerinti
    // route-fordítása + a teljes app-shell SSR-je terhelt CI-runneren lassú.
    // Ezért kapott az állítás előbb 15s, majd 30s türelmet — a 30s-es emelés
    // viszont HATÁSTALAN volt: a playwright.config.ts nem ír felül
    // teszt-timeoutot, tehát a Playwright alapértelmezett 30s-e a keret, és
    // abból fogy a goto + a pathname-ellenőrzés is. Az állítás így sosem
    // kaphatta meg a saját 30s-ét — a teszt halt meg előbb. A CI-napló ezt
    // pontosan mutatja: „Test timeout of 30000ms exceeded", nem expect-timeout.
    //
    // A keret ezért 90s (a webServer indítási kerete 120s), így a 30s-es
    // állítás-türelem ténylegesen felhasználható. Ez nem hibát fed el: a
    // tartalom helyes, a késleltetés a dev-render latenciája.
    test.setTimeout(90_000);
    await page.goto("/join/c4-smoke-invalid-token", { waitUntil: "domcontentloaded" });
    await expectFinalPathname(page, "/join/c4-smoke-invalid-token");
    await expect(
      page.getByText(/this page could not be found|ez az oldal nem található/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
