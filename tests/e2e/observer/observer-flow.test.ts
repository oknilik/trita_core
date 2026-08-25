import { randomUUID } from "node:crypto";
import { expect, test, type Page } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";
import { getTestConfig } from "../../../src/lib/questions";
import { DEFAULT_ASSESSMENT_FORM } from "../../../src/lib/operating-mode";
import { calculateScores } from "../../../src/lib/scoring";

const NOW = new Date("2026-04-01T10:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const NEXT_BUTTON_LABEL = /^(next|tovább)$/i;

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

interface ObserverFixture {
  inviterId: string;
  invitationIds: string[];
  invitationTokens: string[];
  questionIds: number[];
}

async function createObserverFixture(options: {
  invitationCount?: number;
  expiresAt?: Date;
  status?: "PENDING" | "COMPLETED" | "EXPIRED" | "CANCELED";
} = {}): Promise<ObserverFixture> {
  const inviterId = makeId("obs_inviter");
  const invitationCount = options.invitationCount ?? 1;
  // A /observe/[token] a mindenkori alapértelmezett formát szolgálja ki
  // (TSFI-S, 60 item) — a fixture UGYANAZT a kérdéslistát használja, hogy az
  // "utolsó kérdés kivételével kitöltött draft" tényleg egyetlen kattintásra
  // hagyja a kitöltőt.
  const config = getTestConfig("TRITAN", "en", DEFAULT_ASSESSMENT_FORM);
  const selfAnswers = config.questions.map((q) => ({
    questionId: q.id,
    value: 3,
  }));
  const selfScores = calculateScores("TRITAN", selfAnswers);

  await prisma.userProfile.create({
    data: {
      id: inviterId,
      clerkId: makeId("clerk"),
      email: `${inviterId}@test.trita.app`,
      username: `Observer E2E ${inviterId}`,
      locale: "en",
      testType: "TRITAN",
      testTypeAssignedAt: NOW,
      onboardedAt: NOW,
      consentedAt: NOW,
      birthYear: 1990,
      gender: "male",
    },
  });

  await prisma.assessmentResult.create({
    data: {
      id: makeId("self_result"),
      userProfileId: inviterId,
      testType: "TRITAN",
      isSelfAssessment: true,
      scores: selfScores as never,
    },
  });

  // Relatív lejárat: a token-életciklus a VALÓS órához mérten dől el
  // (resolveObserverTokenLifecycle) — fix dátummal a fixture elévülne.
  const invitations = await Promise.all(
    Array.from({ length: invitationCount }).map(() =>
      prisma.observerInvitation.create({
        data: {
          id: makeId("obs_inv"),
          inviterId,
          testType: "TRITAN",
          status: options.status ?? "PENDING",
          expiresAt: options.expiresAt ?? new Date(Date.now() + 30 * DAY_MS),
          observerType: "EXTERNAL",
        },
      }),
    ),
  );

  return {
    inviterId,
    invitationIds: invitations.map((inv) => inv.id),
    invitationTokens: invitations.map((inv) => inv.token),
    questionIds: config.questions.map((q) => q.id),
  };
}

async function cleanupObserverFixture(fixture: ObserverFixture): Promise<void> {
  await prisma.observerAssessment.deleteMany({
    where: { invitationId: { in: fixture.invitationIds } },
  });
  await prisma.observerDraft.deleteMany({
    where: { invitationId: { in: fixture.invitationIds } },
  });
  await prisma.observerInvitation.deleteMany({
    where: { id: { in: fixture.invitationIds } },
  });
  await prisma.assessmentResult.deleteMany({
    where: { userProfileId: fixture.inviterId },
  });
  await prisma.userProfile.deleteMany({
    where: { id: fixture.inviterId },
  });
}

async function prefillObserverDraft(
  page: Page,
  token: string,
  questionIds: number[],
): Promise<void> {
  const answers: Record<number, number> = {};
  for (const questionId of questionIds.slice(0, -1)) {
    answers[questionId] = 3;
  }
  const currentPage = Math.max(0, Math.floor((questionIds.length - 1) / 5));
  const draftPayload = {
    phase: "assessment",
    relationshipType: "COLLEAGUE",
    knownDuration: "1_3",
    answers,
    currentPage,
  };

  const draftKey = `trita_observer_draft_${token}`;
  await page.addInitScript(
    ({ key, raw }) => {
      window.localStorage.setItem("trita_locale", "en");
      window.localStorage.setItem(key, raw);
    },
    { key: draftKey, raw: JSON.stringify(draftPayload) },
  );
}

async function completeObserverViaUi(
  page: Page,
  token: string,
  questionIds: number[],
): Promise<void> {
  await prefillObserverDraft(page, token, questionIds);
  await page.goto(`/observe/${token}`, { waitUntil: "domcontentloaded" });

  await expect(page.getByRole("radio", { name: /^4 - / }).first()).toBeVisible();
  await expect(page.locator("[data-site-footer]")).toHaveCount(0);

  const focusHeader = page.getByTestId("assessment-focus-header").locator(":scope > div");
  const reminder = page.getByTestId("observer-think-of");
  const focusHeaderBox = await focusHeader.boundingBox();
  const reminderBox = await reminder.boundingBox();
  expect(focusHeaderBox).not.toBeNull();
  expect(reminderBox).not.toBeNull();
  expect(Math.abs(reminderBox!.width - focusHeaderBox!.width)).toBeLessThanOrEqual(1);
  expect(reminderBox!.y).toBeGreaterThanOrEqual(focusHeaderBox!.y + focusHeaderBox!.height);

  await page.getByRole("radio", { name: /^4 - / }).first().click();

  // Az utolsó válasz után az auto-advance (~130 ms) magától a confidence-
  // lépésre visz; ha mégsem, a Tovább gomb visz át. A korábbi poll az
  // auto-advance időzítése ELŐTT is elfogadta a Tovább-ágat, így a kattintás
  // a fázisváltással (framer-motion átmenettel) versenyzett.
  const confidenceLabel = page
    .getByText(/How confident are you|Mennyire vagy biztos/i)
    .first();
  const reachedConfidence = await confidenceLabel
    .waitFor({ state: "visible", timeout: 3_000 })
    .then(() => true)
    .catch(() => false);
  if (!reachedConfidence) {
    await page.getByRole("button", { name: NEXT_BUTTON_LABEL }).click();
  }
  await expect(confidenceLabel).toBeVisible();

  await expect(page.getByRole("radio", { name: /^4 - / }).first()).toBeVisible();
  await page.getByRole("radio", { name: /^4 - / }).first().click();

  await page.getByRole("button", { name: /submit|küldés/i }).click();
  await expect(
    page.getByRole("heading", { name: /Thank you for participating|Köszönjük a részvételt/i }),
  ).toBeVisible();
  await expect(page.getByTestId("observer-done-layout")).toBeVisible();
  await expect(page.getByTestId("assessment-focus-header")).toBeVisible();
  await expect(page.locator("[data-site-footer]")).toHaveCount(0);
}

function buildObserverSubmitPayload(token: string, questionIds: number[]) {
  return {
    token,
    relationshipType: "COLLEAGUE",
    knownDuration: "1_3",
    confidence: 4,
    answers: questionIds.map((questionId) => ({ questionId, value: 3 })),
  };
}

test.describe("C5.6 Observer E2E happy path", () => {
  test("observer intro stacks cleanly on a narrow mobile viewport", async ({ page }) => {
    const fixture = await createObserverFixture({ invitationCount: 1 });
    try {
      await page.setViewportSize({ width: 360, height: 800 });
      await page.addInitScript(() => {
        window.localStorage.setItem("trita_locale", "hu");
      });
      await page.goto(`/observe/${fixture.invitationTokens[0]}`, {
        waitUntil: "domcontentloaded",
      });

      const layout = page.getByTestId("observer-intro-layout");
      await expect(layout).toBeVisible();
      await expect(page.getByRole("heading", { name: /A te nézőpontod is számít/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /Kezdjük el/i })).toBeVisible();

      const panels = layout.locator(":scope > section");
      await expect(panels).toHaveCount(2);
      const heroBox = await panels.nth(0).boundingBox();
      const formBox = await panels.nth(1).boundingBox();
      expect(heroBox).not.toBeNull();
      expect(formBox).not.toBeNull();
      expect(formBox!.y).toBeGreaterThanOrEqual(heroBox!.y + heroBox!.height - 1);

      const relationshipButton = page.getByRole("button", { name: /Kolléga/i });
      const relationshipButtonBox = await relationshipButton.boundingBox();
      expect(relationshipButtonBox).not.toBeNull();
      expect(relationshipButtonBox!.height).toBeGreaterThanOrEqual(44);

      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(horizontalOverflow).toBeLessThanOrEqual(1);
    } finally {
      await cleanupObserverFixture(fixture);
    }
  });

  test("observer token link open -> submit -> completion persists in DB", async ({ page }) => {
    const fixture = await createObserverFixture({ invitationCount: 1 });
    try {
      await page.setViewportSize({ width: 360, height: 800 });
      await completeObserverViaUi(page, fixture.invitationTokens[0], fixture.questionIds);

      const completionPanels = page.getByTestId("observer-done-layout").locator(":scope > section");
      await expect(completionPanels).toHaveCount(2);
      const successPanelBox = await completionPanels.nth(0).boundingBox();
      const nextStepPanelBox = await completionPanels.nth(1).boundingBox();
      expect(successPanelBox).not.toBeNull();
      expect(nextStepPanelBox).not.toBeNull();
      expect(nextStepPanelBox!.y).toBeGreaterThanOrEqual(
        successPanelBox!.y + successPanelBox!.height - 1,
      );
      const horizontalOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(horizontalOverflow).toBeLessThanOrEqual(1);

      await expect
        .poll(
          () =>
            prisma.observerInvitation.findUnique({
              where: { id: fixture.invitationIds[0] },
              select: { status: true },
            }),
          { timeout: 15_000 },
        )
        .toMatchObject({ status: "COMPLETED" });

      await expect
        .poll(
          () =>
            prisma.observerAssessment.count({
              where: { invitationId: fixture.invitationIds[0] },
            }),
          { timeout: 15_000 },
        )
        .toBe(1);
    } finally {
      await cleanupObserverFixture(fixture);
    }
  });

  test("expired token shows expired state and cannot proceed", async ({ page }) => {
    const fixture = await createObserverFixture({
      invitationCount: 1,
      expiresAt: new Date(Date.now() - DAY_MS),
    });
    try {
      await page.goto(`/observe/${fixture.invitationTokens[0]}`, { waitUntil: "domcontentloaded" });
      await expect(
        page.getByRole("heading", { name: /Invite expired|A meghívó lejárt/i }),
      ).toBeVisible();
    } finally {
      await cleanupObserverFixture(fixture);
    }
  });

  test("duplicate submit path reopens as already completed", async ({ page }) => {
    const fixture = await createObserverFixture({ invitationCount: 1 });
    try {
      await completeObserverViaUi(page, fixture.invitationTokens[0], fixture.questionIds);
      await page.goto(`/observe/${fixture.invitationTokens[0]}`, { waitUntil: "domcontentloaded" });

      await expect(
        page.getByRole("heading", {
          name: /already completed|Már kitöltötted ezt az értékelést/i,
        }),
      ).toBeVisible();
    } finally {
      await cleanupObserverFixture(fixture);
    }
  });

  test("at least 2 observer responses are persisted for one inviter", async ({ page }) => {
    const fixture = await createObserverFixture({ invitationCount: 2 });
    try {
      await completeObserverViaUi(page, fixture.invitationTokens[0], fixture.questionIds);

      const secondSubmitRes = await page.request.post("/api/observer/submit", {
        data: buildObserverSubmitPayload(fixture.invitationTokens[1], fixture.questionIds),
      });
      expect(secondSubmitRes.status()).toBe(200);

      await expect
        .poll(
          () =>
            prisma.observerAssessment.count({
              where: {
                invitation: { inviterId: fixture.inviterId },
              },
            }),
          { timeout: 15_000 },
        )
        .toBeGreaterThanOrEqual(2);
    } finally {
      await cleanupObserverFixture(fixture);
    }
  });
});
