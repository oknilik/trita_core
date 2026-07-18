import { expect, test, type Page } from "@playwright/test";

const DRAFT_KEY = "trita_draft_TRITAN";
const TOTAL_QUESTIONS = 100;
const NEXT_BUTTON_LABEL = /^(next|tovább)\s*→$/i;

function buildAnswers(answeredUntil: number): Record<number, number> {
  const answers: Record<number, number> = {};
  for (let i = 1; i <= answeredUntil; i += 1) {
    answers[i] = ((i - 1) % 5) + 1;
  }
  return answers;
}

async function setDraft(page: Page, options: { answeredUntil: number; revision: number }) {
  const payload = {
    version: 2,
    answers: buildAnswers(options.answeredUntil),
    questionIndex: Math.max(options.answeredUntil - 1, 0),
    revision: options.revision,
    updatedAt: Date.now(),
  };

  await page.evaluate(
    ({ key, rawPayload }) => {
      const previous = window.localStorage.getItem(key);
      window.localStorage.setItem(key, rawPayload);
      window.dispatchEvent(
        new StorageEvent("storage", {
          key,
          oldValue: previous,
          newValue: rawPayload,
        }),
      );
    },
    { key: DRAFT_KEY, rawPayload: JSON.stringify(payload) },
  );
}

async function readCurrentQuestionNumber(page: Page): Promise<number> {
  return page.evaluate(() => {
    const totalNode = Array.from(document.querySelectorAll("span")).find((node) =>
      /\/\s*\d+/.test(node.textContent ?? ""),
    );
    if (!totalNode?.parentElement) return Number.NaN;
    const currentNode = totalNode.parentElement.querySelector("span");
    return Number.parseInt(currentNode?.textContent ?? "", 10);
  });
}

async function expectCurrentQuestion(page: Page, expected: number) {
  await expect
    .poll(async () => readCurrentQuestionNumber(page), {
      timeout: 15_000,
      message: `expected assessment question index to become ${expected}`,
    })
    .toBe(expected);
}

async function openAssessmentUi(page: Page) {
  const introStartCta = page.getByRole("button", { name: /let's start|kezd|start/i }).first();
  await expect
    .poll(async () => {
      const current = await readCurrentQuestionNumber(page);
      if (!Number.isNaN(current)) return "assessment";
      if (await introStartCta.isVisible().catch(() => false)) return "intro";
      return "pending";
    }, { timeout: 15_000 })
    .toMatch(/assessment|intro/);

  if (await introStartCta.isVisible().catch(() => false)) {
    await introStartCta.click({ force: true });
  }

  await expect
    .poll(async () => {
      const current = await readCurrentQuestionNumber(page);
      return Number.isNaN(current) ? "pending" : "ready";
    }, { timeout: 15_000 })
    .toBe("ready");
}

async function startAssessment(page: Page) {
  await page.goto("/try");
  await openAssessmentUi(page);

  await expectCurrentQuestion(page, 1);
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate((draftKey) => {
    window.localStorage.setItem("trita_locale", "en");
    window.localStorage.removeItem(draftKey);
  }, DRAFT_KEY);
});

test("self assessment happy path reaches results gate", async ({ page }) => {
  await startAssessment(page);

  await setDraft(page, { answeredUntil: 99, revision: 50 });
  await expectCurrentQuestion(page, 100);

  await page.getByRole("button", { name: /^4 - / }).click();
  await page.waitForURL("**/try/complete", { timeout: 20_000 });

  await expect(page.getByRole("heading", { name: /you're done|kész vagy/i })).toBeVisible();
});

test("draft interruption resumes correctly then reaches results gate", async ({ page }) => {
  await startAssessment(page);

  await page.getByText(/auto-advance|auto-tov/i).click();

  await page.getByRole("button", { name: /^2 - / }).click();
  await page.getByRole("button", { name: NEXT_BUTTON_LABEL }).click();
  await expectCurrentQuestion(page, 2);

  await page.getByRole("button", { name: /^3 - / }).click();
  await page.getByRole("button", { name: NEXT_BUTTON_LABEL }).click();
  await expectCurrentQuestion(page, 3);

  await expect
    .poll(
      () =>
        page.evaluate((draftKey) => {
          const raw = window.localStorage.getItem(draftKey);
          if (!raw) return 0;
          try {
            const parsed = JSON.parse(raw) as { answers?: Record<string, number> };
            return Object.keys(parsed.answers ?? {}).length;
          } catch {
            return 0;
          }
        }, DRAFT_KEY),
      { timeout: 5_000 },
    )
    .toBeGreaterThanOrEqual(2);

  await page.goto("/");
  await page.goto("/try");
  await openAssessmentUi(page);
  await expectCurrentQuestion(page, 3);

  await setDraft(page, { answeredUntil: 99, revision: 90 });
  await expectCurrentQuestion(page, 100);

  await page.getByRole("button", { name: /^5 - / }).click();
  await page.waitForURL("**/try/complete", { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: /you're done|kész vagy/i })).toBeVisible();
});
