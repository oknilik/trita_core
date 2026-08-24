import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";
import { getTestConfig } from "../../../src/lib/questions";
import { DEFAULT_ASSESSMENT_FORM } from "../../../src/lib/operating-mode";

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

// P1-QA-02: a fizető szervezet tagjai a BELÉPETT /assessment → submit →
// /profile/results utat járják — a kapu eddig csak a vendég /try lane-t
// fedte böngészőből. A fixture szerver-oldali draftot is ad (scope: "self"),
// így a P0-CORE-02 folytatás-út is a valódi stacken bizonyít.

const ASSESSMENT_CONFIG = getTestConfig("TRITAN", "en", DEFAULT_ASSESSMENT_FORM);
const QUESTION_IDS = ASSESSMENT_CONFIG.questions.map((question) => question.id);
const TOTAL_QUESTIONS = QUESTION_IDS.length;

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function createAuthedFixture() {
  const profileId = makeId("authed_profile");
  const clerkId = makeId("authed_clerk");
  const now = new Date();

  await prisma.userProfile.create({
    data: {
      id: profileId,
      clerkId,
      email: `${profileId}@test.trita.app`,
      username: `Authed ${profileId.slice(-4)}`,
      locale: "en",
      onboardedAt: now,
      consentedAt: now,
      testType: "TRITAN",
      testTypeAssignedAt: now,
    },
  });

  // Szerver-draft az utolsó kérdés előtt: a betöltésnek ide kell visszaállnia.
  const answers: Record<number, number> = {};
  QUESTION_IDS.slice(0, TOTAL_QUESTIONS - 1).forEach((questionId, index) => {
    answers[questionId] = (index % 5) + 1;
  });
  await prisma.assessmentDraft.create({
    data: {
      userProfileId: profileId,
      scope: "self",
      testType: "TRITAN",
      answers,
      currentPage: TOTAL_QUESTIONS - 1,
    },
  });

  return { profileId, clerkId };
}

async function readCurrentQuestionNumber(page: Page): Promise<number> {
  // A belépett fejlécben a szám és a "/ 60" KÜLÖN elemekben áll (a vendég
  // fejléc egy spanben tartja) — ezért a body szövegéből olvasunk, ahol az
  // innerText sortöréssel fűzi össze őket. Navigáció közben az evaluate
  // kontextusa megsemmisülhet — az a poll számára "még nincs kérdés", nem hiba.
  return page
    .evaluate(() => {
      const match = document.body?.innerText?.match(/(\d+)\s*\/\s*\d+/);
      return match ? Number(match[1]) : Number.NaN;
    })
    .catch(() => Number.NaN);
}

test("authenticated member resumes server draft, submits and reaches results", async ({
  page,
  context,
  baseURL,
}) => {
  // A belépett route-fa első dev-fordítása párhuzamos terhelés alatt a
  // szokásos keretet túllépheti — a lane-nek bővebb büdzsé jár.
  test.setTimeout(120_000);
  const fixture = await createAuthedFixture();
  await context.addCookies([
    { name: E2E_AUTH_COOKIE_NAME, value: fixture.clerkId, url: baseURL ?? "http://localhost:3000" },
  ]);

  await page.goto("/assessment");

  // Intro-képernyő (ha van) → kérdőív; a szerver-draft az utolsó kérdésre áll.
  const introStartCta = page.getByRole("button", { name: /let's start|kezd|start|continue|folytat/i }).first();
  await expect
    .poll(async () => {
      const current = await readCurrentQuestionNumber(page);
      if (!Number.isNaN(current)) return "assessment";
      if (await introStartCta.isVisible().catch(() => false)) return "intro";
      return "pending";
    }, { timeout: 60_000 })
    .toMatch(/assessment|intro/);
  if (await introStartCta.isVisible().catch(() => false)) {
    await introStartCta.click({ force: true });
  }
  await expect
    .poll(async () => readCurrentQuestionNumber(page), { timeout: 20_000 })
    .toBe(TOTAL_QUESTIONS);

  // Utolsó válasz → submit → journey-handoff (nem a vendég /try/complete).
  await page.getByRole("radio", { name: /^4 - / }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/assessment"), { timeout: 30_000 });
  expect(page.url()).not.toContain("/try/complete");

  // A submit idempotens szerver-útja pontosan egy eredményt írt.
  const results = await prisma.assessmentResult.findMany({
    where: { userProfileId: fixture.profileId },
    select: { id: true, campaignId: true },
  });
  expect(results).toHaveLength(1);

  // Az eredményoldal a hat dimenzióval renderel. A submit utáni journey-
  // átirányítás még futhat — előbb hagyjuk leérni, és az egyszeri ERR_ABORTED
  // (a SPA-navigáció megszakítja a goto-t) egy ismétléssel feloldódik.
  await page.waitForLoadState("networkidle").catch(() => {});
  await page
    .goto("/profile/results", { waitUntil: "domcontentloaded" })
    .catch(() => page.goto("/profile/results", { waitUntil: "domcontentloaded" }));
  // Hajtás feletti, locale-stabil horgony: a hero PDF-gombja csak kész
  // eredménnyel renderel (a dimenzió-címkék mélyebb nézetben élnek).
  await expect(page.getByText(/PDF/i).first()).toBeVisible({ timeout: 20_000 });

  // A scope-olt self-draft a beadással törlődött.
  const draftCount = await prisma.assessmentDraft.count({
    where: { userProfileId: fixture.profileId },
  });
  expect(draftCount).toBe(0);
});
