import type { ComponentProps } from "react";
import { ThemeProvider } from "@/components/ThemeProvider";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import type { TestType } from "@prisma/client";
import { AssessmentClient } from "@/app/(app)/assessment/AssessmentClient";
import { getAssessmentDraftKey } from "@/lib/assessment-draft";
import { t } from "@/lib/i18n";
import { createLocalStorageMock } from "../../helpers/local-storage-mock";

const pushMock = vi.fn();
const showToastMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: pushMock,
    prefetch: vi.fn(),
    refresh: vi.fn(),
    replace: vi.fn(),
  }),
}));

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/components/LocaleProvider", () => ({
  useLocale: () => ({
    locale: "en",
    setLocale: vi.fn(),
    isChanging: false,
  }),
}));

vi.mock("@/components/ui/Toast", () => ({
  useToast: () => ({
    showToast: showToastMock,
  }),
}));

const TEST_TYPE = "TRITAN" as TestType;
const TOTAL_QUESTIONS = 10;
const QUESTIONS = Array.from({ length: TOTAL_QUESTIONS }, (_, index) => ({
  id: 101 + index,
  text: `Question ${index + 1}`,
}));
const DRAFT_KEY = getAssessmentDraftKey(TEST_TYPE);

const NEXT_CTA = t("assessment.nextCta", "en");
const PREV_CTA = t("assessment.prevCta", "en");
const INTRO_START_CTA = t("assessment.introStart", "en");
const AUTO_ADVANCE_LABEL = t("assessment.autoAdvance", "en");

let restoreLocalStorage: (() => void) | null = null;

function installLocalStorageMock(initialValues?: Record<string, string>) {
  const windowDescriptor = Object.getOwnPropertyDescriptor(window, "localStorage");
  const globalDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const localStorage = createLocalStorageMock(initialValues);

  Object.defineProperty(window, "localStorage", {
    value: localStorage,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(globalThis, "localStorage", {
    value: localStorage,
    configurable: true,
    writable: true,
  });

  restoreLocalStorage = () => {
    if (windowDescriptor) {
      Object.defineProperty(window, "localStorage", windowDescriptor);
    } else {
      delete (window as { localStorage?: Storage }).localStorage;
    }

    if (globalDescriptor) {
      Object.defineProperty(globalThis, "localStorage", globalDescriptor);
    } else {
      delete (globalThis as { localStorage?: Storage }).localStorage;
    }
  };
}

function buildDraftSnapshot(params: {
  answers: Record<number, number>;
  questionIndex: number;
  revision: number;
}): string {
  return JSON.stringify({
    version: 2,
    answers: params.answers,
    questionIndex: params.questionIndex,
    revision: params.revision,
    updatedAt: 1_711_960_000_000,
  });
}

function renderAssessmentClient(
  overrides: Partial<ComponentProps<typeof AssessmentClient>> = {},
) {
  // A ThemeProvider a gyökér-layoutban él; itt izoláltan renderelünk,
  // ezért a héjnak ezt a darabját kézzel adjuk hozzá – a nav
  // séma-választója enélkül provider nélkül hívná a useTheme-et.
  return render(
    <ThemeProvider>
      <AssessmentClient
        testType={TEST_TYPE}
        testName="TRITAN"
        totalQuestions={TOTAL_QUESTIONS}
        questions={QUESTIONS}
        guestMode
        {...overrides}
      />
    </ThemeProvider>,
  );
}

async function startAssessmentIfIntroVisible(user: ReturnType<typeof userEvent.setup>) {
  await waitFor(() => {
    const introCta = screen.queryByRole("button", { name: INTRO_START_CTA });
    const questionVisible = screen.queryByRole("progressbar");
    expect(Boolean(introCta || questionVisible)).toBe(true);
  });

  const introCta = screen.queryByRole("button", { name: INTRO_START_CTA });
  if (introCta) {
    await user.click(introCta);
  }
}

function getCurrentQuestionNumber(): number {
  const progress = screen.getByRole("progressbar");
  return Number.parseInt(progress.getAttribute("aria-valuenow") ?? "", 10);
}

async function expectCurrentQuestionNumber(expected: number) {
  await waitFor(() => {
    expect(getCurrentQuestionNumber()).toBe(expected);
  });
}

/**
 * Lépés-váltás megbízhatóan, fix várakozás nélkül.
 *
 * A komponens `runStepTransition`-je 120 ms-os záron engedi át a lépést, és a
 * záron BELÜL érkező kattintást SZÁNDÉKOSAN eldobja (ez védi a dupla-lépés
 * ellen – épp ezt méri a „next/back spam" eset). Egy fix `setTimeout(140)`
 * ezért versenyhelyzet volt: 20 ms tartalék egy 120 ms-os valós idejű timerhez.
 * Terhelt gépen a felszabadító timer később fut le, a kattintás némán elveszik,
 * és a teszt olyan képernyőn állít, ahova el sem jutott. Így bukott a CI
 * 2026-08-23-án: a `toHaveClass` a KÖVETKEZŐ kérdés nem kiválasztott gombján
 * futott. Helyben 10/10 zöld volt, CPU-terhelés alatt 6-ból 1 bukás.
 *
 * Ezért nem időre várunk, hanem a KIMENETRE: addig kattintunk, amíg a lépés
 * tényleg megtörtént. Egy eldobott kattintás így egy újabb kör, nem bukás – a
 * valódi regressziót (a lépés SOHA nem történik meg) a timeout elkapja, és
 * túllépés sem lehet, mert a cél elérése után már nem kattintunk.
 */
async function stepUntilQuestion(
  // `unknown`, mert a `fireEvent.click` boolean-t ad vissza, a `user.click`
  // Promise-t – a visszatérési érték itt egyikből sem érdekes.
  clickStep: () => unknown,
  expected: number,
): Promise<void> {
  await waitFor(
    async () => {
      if (getCurrentQuestionNumber() !== expected) await clickStep();
      expect(getCurrentQuestionNumber()).toBe(expected);
    },
    { timeout: 3_000, interval: 60 },
  );
}

async function disableAutoAdvance(user: ReturnType<typeof userEvent.setup>) {
  const autoAdvanceCheckbox = screen.getByRole("checkbox", {
    name: new RegExp(AUTO_ADVANCE_LABEL, "i"),
  }) as HTMLInputElement;
  if (autoAdvanceCheckbox.checked) {
    await user.click(autoAdvanceCheckbox);
  }
}

function getCurrentProgressBarWidth(): number {
  const progressBar = Array.from(document.querySelectorAll("div")).find((node) => {
    const element = node as HTMLDivElement;
    return (
      element.style.width.length > 0 &&
      typeof element.className === "string" &&
      element.className.includes("bg-[var(--color-action-primary-bg)] transition-all duration-300")
    );
  }) as HTMLDivElement | undefined;

  if (!progressBar) {
    throw new Error("Could not find current progress bar element");
  }
  return Number.parseFloat(progressBar.style.width.replace("%", ""));
}

function dispatchDraftStorageUpdate(newSnapshot: string) {
  const oldValue = window.localStorage.getItem(DRAFT_KEY);
  window.localStorage.setItem(DRAFT_KEY, newSnapshot);
  window.dispatchEvent(
    new StorageEvent("storage", {
      key: DRAFT_KEY,
      oldValue,
      newValue: newSnapshot,
    }),
  );
}

beforeEach(() => {
  installLocalStorageMock();
  pushMock.mockReset();
  showToastMock.mockReset();
});

afterEach(() => {
  restoreLocalStorage?.();
  restoreLocalStorage = null;
});

describe("AssessmentClient integration behavior", () => {
  it("uses the shared dot eyebrow and editorial art without a fake result preview", async () => {
    const { container } = renderAssessmentClient();

    const eyebrow = screen.getByText(t("assessment.introEyebrow", "en"));
    expect(eyebrow.querySelector("span.rounded-full")).not.toBeNull();
    expect(container.querySelector("[data-assessment-intro-art] svg")).not.toBeNull();
    expect(screen.queryByText("Strategic Innovator")).not.toBeInTheDocument();
    expect(t("assessment.introInfoGuest", "hu")).toBe(
      "Bármikor félbeszakíthatod – a haladásod ebben a böngészőben mentésre kerül, itt folytathatod. Másik eszközön vagy a böngészési adatok törlése után nem lesz elérhető, regisztráció után az eredményed a fiókodba kerül.",
    );
  });

  it("handles next/back spam without overshoot or reset", async () => {
    const user = userEvent.setup();
    renderAssessmentClient();
    await startAssessmentIfIntroVisible(user);
    await disableAutoAdvance(user);

    fireEvent.keyDown(window, { key: "3" });
    const nextButton = screen.getByRole("button", { name: new RegExp(NEXT_CTA, "i") });
    const prevButton = screen.getByRole("button", { name: new RegExp(PREV_CTA, "i") });

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(nextButton);
    }
    await expectCurrentQuestionNumber(2);
    fireEvent.keyDown(window, { key: "4" });

    await stepUntilQuestion(() => fireEvent.click(nextButton), 3);

    for (let i = 0; i < 5; i += 1) {
      fireEvent.click(prevButton);
    }
    await expectCurrentQuestionNumber(3);

    await stepUntilQuestion(() => fireEvent.click(prevButton), 2);

    await stepUntilQuestion(() => fireEvent.click(prevButton), 1);
  });

  it("updates progress bar on forward/back navigation and keeps width clamped", async () => {
    const user = userEvent.setup();
    renderAssessmentClient();
    await startAssessmentIfIntroVisible(user);
    await disableAutoAdvance(user);

    const initialWidth = getCurrentProgressBarWidth();
    await user.click(screen.getByRole("radio", { name: /^2 - / }));
    await user.click(screen.getByRole("button", { name: new RegExp(NEXT_CTA, "i") }));
    const widthAfterNext = getCurrentProgressBarWidth();

    await stepUntilQuestion(
      () => user.click(screen.getByRole("button", { name: new RegExp(PREV_CTA, "i") })),
      1,
    );
    const widthAfterBack = getCurrentProgressBarWidth();

    expect(widthAfterNext).toBeGreaterThan(initialWidth);
    expect(widthAfterBack).toBeLessThan(widthAfterNext);
    expect(widthAfterBack).toBeGreaterThanOrEqual(0);
    expect(widthAfterNext).toBeLessThanOrEqual(100);
  });

  it("persists answers, then preserves them when returning to an earlier question", async () => {
    const user = userEvent.setup();
    renderAssessmentClient();
    await startAssessmentIfIntroVisible(user);
    await disableAutoAdvance(user);

    await user.click(screen.getByRole("radio", { name: /^4 - / }));
    await waitFor(() => {
      const payload = window.localStorage.getItem(DRAFT_KEY);
      expect(payload).not.toBeNull();
      expect(JSON.parse(payload as string).answers["101"]).toBe(4);
    });

    await user.click(screen.getByRole("button", { name: new RegExp(NEXT_CTA, "i") }));
    await expectCurrentQuestionNumber(2);

    await stepUntilQuestion(
      () => user.click(screen.getByRole("button", { name: new RegExp(PREV_CTA, "i") })),
      1,
    );
    const selected = screen.getByRole("radio", { name: /^4 - / });
    expect(selected).toHaveClass("bg-[var(--color-action-primary-bg)]");
  });

  it("restores an existing local draft and resumes from the first unanswered question", async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      buildDraftSnapshot({
        answers: { 101: 2, 102: 5 },
        questionIndex: 0,
        revision: 4,
      }),
    );

    const user = userEvent.setup();
    renderAssessmentClient();
    await expectCurrentQuestionNumber(3);

    await user.click(screen.getByRole("button", { name: new RegExp(PREV_CTA, "i") }));
    await expectCurrentQuestionNumber(2);
    const restoredPayload = window.localStorage.getItem(DRAFT_KEY);
    expect(restoredPayload).not.toBeNull();
    expect(JSON.parse(restoredPayload as string).answers).toEqual({ "101": 2, "102": 5 });
  });

  it("prefers server draft resume and clears stale local draft", async () => {
    window.localStorage.setItem(
      DRAFT_KEY,
      buildDraftSnapshot({
        answers: { 101: 5, 102: 5, 103: 5 },
        questionIndex: 2,
        revision: 9,
      }),
    );

    renderAssessmentClient({
      initialDraft: {
        answers: { "101": 3 },
        currentPage: 0,
        updatedAt: Date.now(),
      },
    });

    await expectCurrentQuestionNumber(2);
    const persistedPayload = window.localStorage.getItem(DRAFT_KEY);
    expect(persistedPayload).not.toBeNull();
    expect(JSON.parse(persistedPayload as string).answers).toEqual({ "101": 3 });
  });

  it("drops out-of-form server draft answers so a partial draft is not falsely complete", async () => {
    // 9 érvényes válasz (101–109) + 3 formán kívüli, „ragadós" id (901–903).
    // Szűrés nélkül a 12 nyers válasz hamis „kész" (>= 10) állapotot adna:
    // Kiértékelés gomb + a szerver által 400-zal elutasított submit-payload.
    renderAssessmentClient({
      initialDraft: {
        answers: {
          "101": 3, "102": 3, "103": 3, "104": 3, "105": 3,
          "106": 3, "107": 3, "108": 3, "109": 3,
          "901": 5, "902": 4, "903": 2,
        },
        currentPage: 0,
        updatedAt: Date.now(),
      },
    });

    // A resume az első ténylegesen megválaszolatlan formán belüli kérdésnél
    // (10.) áll meg – nem esik vissza „kész"-be a formán kívüli id-k miatt.
    await expectCurrentQuestionNumber(10);

    const evaluateLabel = t("assessment.evaluateCta", "en");
    expect(
      screen.queryByRole("button", { name: new RegExp(evaluateLabel, "i") }),
    ).toBeNull();
    expect(
      screen.getByRole("button", { name: new RegExp(NEXT_CTA, "i") }),
    ).toBeInTheDocument();
  });

  it("recovers after tab close/reopen by resuming from persisted local draft", async () => {
    const user = userEvent.setup();
    const firstRender = renderAssessmentClient();
    await startAssessmentIfIntroVisible(user);
    await disableAutoAdvance(user);

    await user.click(screen.getByRole("radio", { name: /^1 - / }));
    await waitFor(() => {
      const payload = window.localStorage.getItem(DRAFT_KEY);
      expect(payload).not.toBeNull();
      expect(JSON.parse(payload as string).answers["101"]).toBe(1);
    });

    firstRender.unmount();
    renderAssessmentClient();
    await expectCurrentQuestionNumber(2);
  });

  it("syncs a newer draft from another tab through storage events", async () => {
    const user = userEvent.setup();
    renderAssessmentClient();
    await startAssessmentIfIntroVisible(user);

    const crossTabSnapshot = buildDraftSnapshot({
      answers: { 101: 2, 102: 3, 103: 4 },
      questionIndex: 2,
      revision: 10,
    });

    act(() => {
      dispatchDraftStorageUpdate(crossTabSnapshot);
    });

    await expectCurrentQuestionNumber(4);
    await user.click(screen.getByRole("button", { name: new RegExp(PREV_CTA, "i") }));
    await expectCurrentQuestionNumber(3);
    const syncedPayload = window.localStorage.getItem(DRAFT_KEY);
    expect(syncedPayload).not.toBeNull();
    expect(JSON.parse(syncedPayload as string).answers).toEqual({
      "101": 2,
      "102": 3,
      "103": 4,
    });
  });

  it("supports retry draft recovery after corrupted payload", async () => {
    window.localStorage.setItem(DRAFT_KEY, "{invalid-json");

    renderAssessmentClient();
    await screen.findByRole("button", { name: INTRO_START_CTA });

    const recoveredSnapshot = buildDraftSnapshot({
      answers: { 101: 5 },
      questionIndex: 0,
      revision: 5,
    });
    act(() => {
      dispatchDraftStorageUpdate(recoveredSnapshot);
    });

    await expectCurrentQuestionNumber(2);
  });

  it("uses fake timers for deterministic auto-advance", async () => {
    const user = userEvent.setup();
    renderAssessmentClient();
    await startAssessmentIfIntroVisible(user);

    vi.useFakeTimers();
    fireEvent.click(screen.getByRole("radio", { name: /^3 - / }));
    expect(getCurrentQuestionNumber()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(130);
    });
    expect(getCurrentQuestionNumber()).toBe(2);
  });
});
