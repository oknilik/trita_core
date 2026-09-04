import { expect, test, type Page } from "@playwright/test";

type Locale = "hu" | "en";

async function setPublicLocale(page: Page, baseURL: string | undefined, locale: Locale) {
  if (!baseURL) throw new Error("Playwright baseURL is required");
  await page.context().addCookies([{ name: "trita_locale", value: locale, url: baseURL }]);
  await page.addInitScript((nextLocale) => {
    localStorage.setItem("trita_locale", nextLocale);
    sessionStorage.setItem("trita_locale_synced", "1");
  }, locale);
}

test("contact: HU keyboard validation, API error and successful Enter retry", async ({
  page,
  baseURL,
}) => {
  await setPublicLocale(page, baseURL, "hu");
  let requests = 0;
  await page.route("**/api/contact", async (route) => {
    requests += 1;
    await route.fulfill({
      status: requests === 1 ? 500 : 200,
      contentType: "application/json",
      body: JSON.stringify(requests === 1 ? { error: "test failure" } : { ok: true }),
    });
  });
  await page.goto("/contact");

  const form = page.locator("#contact-form form");
  const name = form.getByRole("textbox", { name: "Név" });
  const email = form.getByRole("textbox", { name: "Email" });
  const company = form.getByRole("textbox", { name: "Cég (opcionális)" });
  const message = form.getByRole("textbox", { name: "Üzenet" });
  const submit = form.getByRole("button", { name: "Üzenet küldése" });

  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByText("Adj meg egy legalább 2 karakteres nevet.")).toBeVisible();
  await expect(submit).toBeEnabled();

  await page.keyboard.type("Teszt Elek");
  await page.keyboard.press("Tab");
  await expect(email).toBeFocused();
  await page.keyboard.type("teszt@example.com");
  await page.keyboard.press("Tab");
  await expect(company).toBeFocused();
  await page.keyboard.type("Tesztes Kft.");
  await page.keyboard.press("Tab");
  await expect(message).toBeFocused();
  await page.keyboard.type("Ez egy kellően hosszú tesztüzenet a csapatnak.");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(form.getByRole("alert")).toContainText("Nem sikerült elküldeni");
  await expect(name).toHaveValue("Teszt Elek");
  await expect(email).toHaveValue("teszt@example.com");
  await expect(message).toHaveValue("Ez egy kellően hosszú tesztüzenet a csapatnak.");

  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Megkaptuk az üzeneted");
  expect(requests).toBe(2);
});

test("pilot: EN keyboard validation, retained API error and successful retry", async ({
  page,
  baseURL,
}) => {
  await setPublicLocale(page, baseURL, "en");
  let requests = 0;
  await page.route("**/api/pilot-apply", async (route) => {
    requests += 1;
    await route.fulfill({
      status: requests === 1 ? 500 : 200,
      contentType: "application/json",
      body: JSON.stringify(requests === 1 ? { error: "test failure" } : { ok: true }),
    });
  });
  await page.goto("/pilot");

  const form = page.locator("#jelentkezes form");
  const name = form.getByRole("textbox", { name: "Name", exact: true });
  const email = form.getByRole("textbox", { name: "Email" });
  const company = form.getByRole("textbox", { name: "Company name" });
  const size = form.getByRole("combobox", { name: "Team size" });
  const message = form.getByRole("textbox", {
    name: "What's the most important question about your team?",
  });
  const submit = form.getByRole("button", { name: "Apply as a partner team" });

  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(name).toBeFocused();
  await expect(name).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByText("Enter a name between 2 and 100 characters.")).toBeVisible();

  await page.keyboard.type("Pilot Paula");
  await page.keyboard.press("Tab");
  await page.keyboard.type("pilot@example.com");
  await page.keyboard.press("Tab");
  await page.keyboard.type("Pilot Ltd.");
  await page.keyboard.press("Tab");
  await expect(size).toBeFocused();
  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("Tab");
  await expect(message).toBeFocused();
  await page.keyboard.type("How can we improve collaboration across the team?");
  await page.keyboard.press("Tab");
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");

  await expect(form.getByRole("alert")).toContainText("We could not send your application");
  await expect(name).toHaveValue("Pilot Paula");
  await expect(email).toHaveValue("pilot@example.com");
  await expect(company).toHaveValue("Pilot Ltd.");

  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("status")).toContainText("Thank you for applying");
  expect(requests).toBe(2);
});

test("blog newsletter: EN invalid email, rate limit and Enter retry", async ({
  page,
  baseURL,
}) => {
  await setPublicLocale(page, baseURL, "en");
  let requests = 0;
  await page.route("**/api/newsletter/subscribe", async (route) => {
    requests += 1;
    await route.fulfill({
      status: requests === 1 ? 429 : 200,
      contentType: "application/json",
      body: JSON.stringify(requests === 1 ? { error: "rate limited" } : { ok: true }),
    });
  });
  await page.goto("/blog");

  const form = page.locator("main form");
  const email = form.getByRole("textbox", { name: "Email address" });
  const submit = form.getByRole("button", { name: "Subscribe" });

  await submit.focus();
  await page.keyboard.press("Enter");
  await expect(email).toBeFocused();
  await expect(email).toHaveAttribute("aria-invalid", "true");
  await expect(form.getByRole("alert")).toContainText("doesn't look valid");
  await expect(submit).toBeEnabled();

  await page.keyboard.type("reader@example.com");
  await page.keyboard.press("Enter");
  await expect(form.getByRole("alert")).toContainText("Too many attempts");
  await expect(email).toHaveValue("reader@example.com");

  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("status").filter({ hasText: "Check your inbox" }),
  ).toBeVisible();
  expect(requests).toBe(2);
});
