import { expect, test, type Page } from "@playwright/test";

// A vendég-útvonalak MAI szerződése (src/proxy.ts):
//   · védett route (/dashboard, /assessment, /onboarding, /billing/…) vendégként
//     a landingre ("/") esik vissza (auth.protect unauthenticatedUrl) — NEM a
//     /sign-in-re;
//   · a /sign-in és /sign-up vendégnek helyben marad, bejelentkezett usert
//     (e2e bypass cookie) a journey-kapura (/dashboard) irányítja;
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

  test("dashboard handoff forwards guests to the landing page", async ({ page }) => {
    await expectRedirectPath(page, "/dashboard", "/");

    // A landing a vendég-belépő: a fejléc bejelentkezés-linkje a horgony.
    await expect(
      page.getByRole("link", { name: /sign in|bejelentkezés/i }).first(),
    ).toBeVisible({ timeout: 15_000 });
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

  test("invite accept entrypoint with invalid token shows not-found without wrong redirect", async ({ page }) => {
    // A TESZT-SZINTŰ budgetet tágítjuk, nem (csak) az assert-időt: ez a lépés
    // három, egymás UTÁN futó várakozásból áll — `goto` (a `next dev` igény
    // szerinti route-fordítása, hidegen a leglassabb), a pathname-poll (15s), és
    // a not-found tartalom assertje. A Playwright alap teszt-timeoutja 30s, így
    // egy 30s-os assert-timeout SOHA nem tud lefutni: a teszt-szintű plafon
    // előbb üt („Test timeout of 30000ms exceeded"), függetlenül attól, hogy a
    // tartalom helyes-e. (Helyben a merge utáni kódon a /join hidegen rendben
    // renderel — a tartalom nem hibás, a budget volt szűk.) Ezért: bővebb
    // teszt-budget + az alatta maradó assert-idő.
    test.setTimeout(120_000);
    await page.goto("/join/c4-smoke-invalid-token", { waitUntil: "domcontentloaded" });
    await expectFinalPathname(page, "/join/c4-smoke-invalid-token");
    await expect(
      page.getByText(/this page could not be found|ez az oldal nem található/i).first(),
    ).toBeVisible({ timeout: 30_000 });
  });
});
