/**
 * C5.5 — Observer client integration tests (Vitest + RTL)
 *
 * Covers: intro render with token, questionnaire fill + navigation,
 * back/next, progress tracking, submit lock against double-click,
 * invalid/completed/inactive token UI, and success state UI.
 */

import type { ComponentProps } from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { ObserverClient } from "@/app/observe/[token]/ObserverClient";
import { t } from "@/lib/i18n";
import { createLocalStorageMock } from "../../helpers/local-storage-mock";

// ── Mocks ──────────────────────────────────────────────────────────────────────

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

let mockIsSignedIn = false;
vi.mock("@clerk/nextjs", () => ({
  useUser: () => ({
    isSignedIn: mockIsSignedIn,
    user: mockIsSignedIn ? { id: "user_123" } : null,
  }),
}));

vi.mock("@/lib/doodles", () => ({
  DOODLE_SOURCES: ["/doodle1.svg"],
  pickRandomDoodle: () => "/doodle1.svg",
}));

vi.mock("@/components/illustrations/BackgroundDoodles", () => ({
  BackgroundDoodles: () => null,
}));

vi.mock("framer-motion", () => ({
  motion: {
    div: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <div {...filterDomProps(props)}>{children}</div>
    ),
    button: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <button {...filterDomProps(props)}>{children}</button>
    ),
    p: ({
      children,
      ...props
    }: React.PropsWithChildren<Record<string, unknown>>) => (
      <p {...filterDomProps(props)}>{children}</p>
    ),
  },
  AnimatePresence: ({ children }: React.PropsWithChildren) => <>{children}</>,
}));

function filterDomProps(props: Record<string, unknown>) {
  const filtered: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(props)) {
    if (
      key === "whileHover" ||
      key === "whileTap" ||
      key === "initial" ||
      key === "animate" ||
      key === "exit" ||
      key === "transition" ||
      key === "mode"
    )
      continue;
    filtered[key] = value;
  }
  return filtered;
}

// ── Constants ──────────────────────────────────────────────────────────────────

const TOKEN = "test-observer-token-abc";
const INVITER = "Jane Doe";
const DRAFT_KEY = `trita_observer_draft_${TOKEN}`;

const TOTAL_QUESTIONS = 10;
const QUESTIONS = Array.from({ length: TOTAL_QUESTIONS }, (_, i) => ({
  id: 201 + i,
  text: `Question ${i + 1}`,
  textObserver: `Observer Q${i + 1}`,
  dimension: ["H", "E", "X", "A", "C", "O"][i % 6],
  type: "likert" as const,
  reversed: false,
}));

const NEXT_CTA = t("assessment.nextCta", "en");
const PREV_CTA = t("assessment.prevCta", "en");
const START_CTA = t("observer.start", "en");
const SUBMIT_CTA = t("observer.submit", "en");
const SUBMIT_LOADING = t("observer.submitLoading", "en");

// ── Helpers ────────────────────────────────────────────────────────────────────

let restoreLocalStorage: (() => void) | null = null;

function installLsMock(initialValues?: Record<string, string>) {
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
    if (windowDescriptor)
      Object.defineProperty(window, "localStorage", windowDescriptor);
    else delete (window as { localStorage?: Storage }).localStorage;
    if (globalDescriptor)
      Object.defineProperty(globalThis, "localStorage", globalDescriptor);
    else delete (globalThis as { localStorage?: Storage }).localStorage;
  };
}

function renderObserver(
  overrides: Partial<ComponentProps<typeof ObserverClient>> = {},
) {
  return render(
    <ObserverClient
      token={TOKEN}
      inviterName={INVITER}
      testName="HEXACO"
      questions={QUESTIONS}
      {...overrides}
    />,
  );
}

function allAnswers(): Record<number, number> {
  const a: Record<number, number> = {};
  for (const q of QUESTIONS) a[q.id] = 3;
  return a;
}

function buildDraft(params: {
  phase?: "assessment" | "confidence";
  relationshipType?: string;
  knownDuration?: string;
  answers?: Record<number, number>;
  currentPage?: number;
}) {
  return {
    phase: params.phase ?? "assessment",
    relationshipType: params.relationshipType ?? "COLLEAGUE",
    knownDuration: params.knownDuration ?? "1_3",
    answers: params.answers ?? {},
    currentPage: params.currentPage ?? 0,
  };
}

async function passIntro(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByText(t("observer.relationFriend", "en")));
  await user.click(screen.getByText(t("observer.durationLt1", "en")));
  await user.click(screen.getByText(START_CTA));
}

// ── Setup ──────────────────────────────────────────────────────────────────────

beforeEach(() => {
  installLsMock();
  pushMock.mockReset();
  showToastMock.mockReset();
  mockIsSignedIn = false;
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { status: 200 })));
  // jsdom doesn't have scrollIntoView
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  restoreLocalStorage?.();
  restoreLocalStorage = null;
});

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("C5.5 ObserverClient integration", () => {

  // ── Intro phase ──────────────────────────────────────────────────────────

  describe("intro phase", () => {
    it("renders intro with inviter name and welcome message", () => {
      renderObserver();
      // Welcome text is inside h1 with emoji prefix: "👋 We're glad you're here!"
      expect(screen.getByText((_content, el) =>
        el?.tagName === "H1" && Boolean(el?.textContent?.includes(t("observer.introWelcome", "en"))),
      )).toBeInTheDocument();
      expect(screen.getByText(new RegExp(INVITER))).toBeInTheDocument();
    });

    it("shows all 5 relationship type buttons", () => {
      renderObserver();
      for (const opt of ["relationFriend", "relationColleague", "relationFamily", "relationPartner", "relationOther"] as const) {
        const text = t(`observer.${opt}`, "en");
        const el = screen.getByText(text);
        expect(el.tagName).toBe("BUTTON");
      }
    });

    it("shows all 4 duration buttons", () => {
      renderObserver();
      for (const opt of ["durationLt1", "duration1to3", "duration3to5", "duration5p"] as const) {
        const text = t(`observer.${opt}`, "en");
        const el = screen.getByText(text);
        expect(el.tagName).toBe("BUTTON");
      }
    });

    it("start button is disabled until both relationship and duration selected", async () => {
      const user = userEvent.setup();
      renderObserver();
      const startBtn = screen.getByText(START_CTA);
      expect(startBtn).toBeDisabled();

      // Select only relationship
      await user.click(screen.getByText(t("observer.relationFriend", "en")));
      expect(startBtn).toBeDisabled();

      // Select duration too
      await user.click(screen.getByText(t("observer.durationLt1", "en")));
      expect(startBtn).not.toBeDisabled();
    });

    it("shows hint text when fields not yet selected", () => {
      renderObserver();
      const selectBothText = t("observer.selectBothFields", "en");
      expect(screen.getByText(selectBothText)).toBeInTheDocument();
    });

    it("clicking start transitions to assessment phase", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);

      // Assessment phase should show question content
      await waitFor(() => {
        expect(screen.getByText(/Observer Q1/)).toBeInTheDocument();
      });
      // Intro should be gone
      expect(screen.queryByRole("button", { name: START_CTA })).not.toBeInTheDocument();
    });
  });

  // ── Assessment phase ─────────────────────────────────────────────────────

  describe("assessment phase", () => {
    it("displays question with observer text variant", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);
      await waitFor(() => {
        expect(screen.getByText(/Observer Q1/)).toBeInTheDocument();
      });
    });

    it("shows progress bar with answered count", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);

      await waitFor(() => {
        // Progress shows total question count
        expect(screen.getByText(new RegExp(`${TOTAL_QUESTIONS}`))).toBeInTheDocument();
      });
    });

    it("answering a question persists to localStorage", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);

      await waitFor(() => {
        expect(screen.getByText(/Observer Q1/)).toBeInTheDocument();
      });

      // Click Likert value 4
      const btn = screen.getByRole("button", { name: /^4 - / });
      await user.click(btn);

      await waitFor(() => {
        const stored = window.localStorage.getItem(DRAFT_KEY);
        expect(stored).not.toBeNull();
        const parsed = JSON.parse(stored!);
        expect(parsed.answers[201]).toBe(4);
      });
    });

    it("back button is disabled on first question of first page", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);

      await waitFor(() => {
        expect(screen.getByText(/Observer Q1/)).toBeInTheDocument();
      });

      const prevBtn = screen.getByRole("button", { name: new RegExp(PREV_CTA, "i") });
      expect(prevBtn).toBeDisabled();
    });

    it("next button navigates forward after answering", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);

      await waitFor(() => {
        expect(screen.getByText(/Observer Q1/)).toBeInTheDocument();
      });

      // Disable auto-advance
      const autoAdvanceCheckbox = screen.getByRole("checkbox");
      if ((autoAdvanceCheckbox as HTMLInputElement).checked) {
        await user.click(autoAdvanceCheckbox);
      }

      // Answer question
      await user.click(screen.getByRole("button", { name: /^3 - / }));

      // Click next
      const nextBtn = screen.getByRole("button", { name: new RegExp(NEXT_CTA, "i") });
      await user.click(nextBtn);

      await waitFor(() => {
        expect(screen.getByText(/Observer Q2/)).toBeInTheDocument();
      });
    });

    it("keyboard shortcut 1-5 answers current question", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);

      await waitFor(() => {
        expect(screen.getByText(/Observer Q1/)).toBeInTheDocument();
      });

      // Disable auto-advance
      const autoAdvanceCheckbox = screen.getByRole("checkbox");
      if ((autoAdvanceCheckbox as HTMLInputElement).checked) {
        await user.click(autoAdvanceCheckbox);
      }

      fireEvent.keyDown(window, { key: "2" });

      await waitFor(() => {
        const stored = window.localStorage.getItem(DRAFT_KEY);
        expect(stored).not.toBeNull();
        expect(JSON.parse(stored!).answers[201]).toBe(2);
      });
    });

    it("auto-advance moves to next question after answering", async () => {
      const user = userEvent.setup();
      renderObserver();
      await passIntro(user);

      await waitFor(() => {
        expect(screen.getByText(/Observer Q1/)).toBeInTheDocument();
      });

      // Auto-advance is on by default
      vi.useFakeTimers();
      fireEvent.click(screen.getByRole("button", { name: /^3 - / }));

      act(() => {
        vi.advanceTimersByTime(150);
      });

      expect(screen.getByText(/Observer Q2/)).toBeInTheDocument();
    });
  });

  // ── Draft resume ─────────────────────────────────────────────────────────

  describe("draft resume", () => {
    it("resumes from server initialDraft at correct page", () => {
      const answers: Record<number, number> = {};
      // First 5 questions answered
      for (let i = 0; i < 5; i++) answers[201 + i] = 3;

      renderObserver({
        initialDraft: buildDraft({ answers, currentPage: 1 }),
      });

      // Should be on page 2 (question 6)
      expect(screen.getByText(/Observer Q6/)).toBeInTheDocument();
    });

    it("resumes from localStorage draft when no server draft", async () => {
      const answers: Record<number, number> = {};
      for (let i = 0; i < 3; i++) answers[201 + i] = 4;

      window.localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          phase: "assessment",
          relationshipType: "FAMILY",
          knownDuration: "3_5",
          answers,
          currentPage: 0,
        }),
      );

      renderObserver();

      // Should skip intro and go straight to assessment phase (not intro)
      await waitFor(() => {
        // Assessment phase shows progress bar with total count
        expect(screen.getByText(new RegExp(`${TOTAL_QUESTIONS}`))).toBeInTheDocument();
      });

      // Verify answers were restored from localStorage
      const stored = window.localStorage.getItem(DRAFT_KEY);
      expect(stored).not.toBeNull();
      const parsed = JSON.parse(stored!);
      expect(parsed.phase).toBe("assessment");
      expect(parsed.answers[201]).toBe(4);
      expect(parsed.answers[202]).toBe(4);
      expect(parsed.answers[203]).toBe(4);
    });

    it("handles corrupted localStorage gracefully", () => {
      window.localStorage.setItem(DRAFT_KEY, "{invalid json zzz");

      renderObserver();

      // Should fall back to intro — check for the start button
      expect(screen.getByText(START_CTA)).toBeInTheDocument();
    });
  });

  // ── Confidence phase ─────────────────────────────────────────────────────

  describe("confidence phase", () => {
    it("transitions to confidence phase after all questions answered", () => {
      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
          currentPage: 1,
        }),
      });

      expect(screen.getByText(t("observer.confidenceLabel", "en"))).toBeInTheDocument();
    });

    it("shows submit button in confidence phase", () => {
      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      expect(
        screen.getByRole("button", { name: SUBMIT_CTA }),
      ).toBeInTheDocument();
    });

    it("back button returns to assessment from confidence", async () => {
      const user = userEvent.setup();
      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      const prevBtn = screen.getByRole("button", { name: new RegExp(PREV_CTA, "i") });
      await user.click(prevBtn);

      // Should be back in assessment
      expect(screen.queryByText(t("observer.confidenceLabel", "en"))).not.toBeInTheDocument();
    });
  });

  // ── Submit behavior ──────────────────────────────────────────────────────

  describe("submit", () => {
    it("submit calls fetch and transitions to done phase on success", async () => {
      const user = userEvent.setup();
      const fetchMock = vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      // Select confidence
      await user.click(screen.getByRole("button", { name: /^4 - / }));

      // Submit
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        expect(screen.getByText(t("observer.doneTitle", "en"))).toBeInTheDocument();
      });

      // Verify fetch was called with submit endpoint
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/observer/submit",
        expect.objectContaining({ method: "POST" }),
      );
    });

    it("submit lock: double-click does not send two requests", async () => {
      const user = userEvent.setup();
      let resolveSubmit: ((v: Response) => void) | null = null;
      const submitPromise = new Promise<Response>((resolve) => {
        resolveSubmit = resolve;
      });
      const fetchMock = vi.fn()
        .mockImplementationOnce(() => submitPromise)
        .mockResolvedValue(new Response("{}", { status: 200 }));
      vi.stubGlobal("fetch", fetchMock);

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      // Select confidence
      await user.click(screen.getByRole("button", { name: /^4 - / }));

      const submitBtn = screen.getByRole("button", { name: SUBMIT_CTA });

      // First click
      await user.click(submitBtn);

      // Shows loading text
      await waitFor(() => {
        expect(screen.getByText(SUBMIT_LOADING)).toBeInTheDocument();
      });

      // Second click while loading
      await user.click(screen.getByRole("button", { name: SUBMIT_LOADING }));

      // Resolve the first request
      resolveSubmit!(new Response(JSON.stringify({ success: true }), { status: 200 }));

      await waitFor(() => {
        expect(screen.getByText(t("observer.doneTitle", "en"))).toBeInTheDocument();
      });

      // Only ONE submit call (draft delete calls don't count)
      const submitCalls = fetchMock.mock.calls.filter(
        (call: unknown[]) => call[0] === "/api/observer/submit",
      );
      expect(submitCalls.length).toBe(1);
    });

    it("submit without confidence highlights but does not submit", async () => {
      const user = userEvent.setup();
      const fetchMock = vi.fn().mockResolvedValue(
        new Response("{}", { status: 200 }),
      );
      vi.stubGlobal("fetch", fetchMock);

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      // Don't select confidence, just click submit
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      // Should NOT have called submit endpoint
      const submitCalls = fetchMock.mock.calls.filter(
        (call: unknown[]) => call[0] === "/api/observer/submit",
      );
      expect(submitCalls.length).toBe(0);

      // Should still be on confidence phase
      expect(screen.getByText(t("observer.confidenceLabel", "en"))).toBeInTheDocument();
    });

    it("clears localStorage on successful submit", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^4 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        expect(screen.getByText(t("observer.doneTitle", "en"))).toBeInTheDocument();
      });

      expect(window.localStorage.getItem(DRAFT_KEY)).toBeNull();
    });
  });

  // ── Error states ─────────────────────────────────────────────────────────

  describe("error states on submit", () => {
    it("INVITE_CANCELED error shows inactive UI", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "INVITE_CANCELED" }), { status: 400 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^3 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        expect(screen.getByText(t("observer.inactiveTitle", "en"))).toBeInTheDocument();
        expect(screen.getByText("😕")).toBeInTheDocument();
      });
    });

    it("INVITE_EXPIRED error shows inactive UI", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "INVITE_EXPIRED" }), { status: 400 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^3 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        expect(screen.getByText(t("observer.inactiveTitle", "en"))).toBeInTheDocument();
      });
    });

    it("generic API error shows toast", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "UNKNOWN_ERROR" }), { status: 500 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^3 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        expect(showToastMock).toHaveBeenCalledWith(
          expect.any(String),
          "error",
        );
      });
    });
  });

  // ── Done phase ───────────────────────────────────────────────────────────

  describe("done phase", () => {
    it("shows success emoji and title", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^4 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        expect(screen.getByText("🙏")).toBeInTheDocument();
        expect(screen.getByText(t("observer.doneTitle", "en"))).toBeInTheDocument();
        expect(screen.getByText(t("observer.doneBody", "en"))).toBeInTheDocument();
      });
    });

    it("shows sign-up/sign-in CTAs when not signed in", async () => {
      mockIsSignedIn = false;
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^4 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        const signUpLink = screen.getByText(t("observer.signUpCta", "en"));
        expect(signUpLink.closest("a")).toHaveAttribute(
          "href",
          `/sign-up?observeToken=${TOKEN}`,
        );
        const signInLink = screen.getByText(t("observer.signInCta", "en"));
        expect(signInLink.closest("a")).toHaveAttribute(
          "href",
          `/sign-in?observeToken=${TOKEN}`,
        );
      });
    });

    it("shows dashboard link when signed in", async () => {
      mockIsSignedIn = true;
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ success: true }), { status: 200 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^4 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        const dashLink = screen.getByText(t("observer.goDashboard", "en"));
        expect(dashLink.closest("a")).toHaveAttribute("href", "/profile/results");
      });
    });
  });

  // ── Inactive phase ───────────────────────────────────────────────────────

  describe("inactive phase", () => {
    it("shows inactive state with emoji and message", async () => {
      const user = userEvent.setup();
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ error: "INVITE_CANCELED" }), { status: 400 }),
      ));

      renderObserver({
        initialDraft: buildDraft({
          phase: "confidence",
          answers: allAnswers(),
        }),
      });

      await user.click(screen.getByRole("button", { name: /^3 - / }));
      await user.click(screen.getByRole("button", { name: SUBMIT_CTA }));

      await waitFor(() => {
        expect(screen.getByText("😕")).toBeInTheDocument();
        expect(screen.getByText(t("observer.inactiveTitle", "en"))).toBeInTheDocument();
        expect(screen.getByText(t("observer.inactiveBody", "en"))).toBeInTheDocument();
      });
    });
  });
});
