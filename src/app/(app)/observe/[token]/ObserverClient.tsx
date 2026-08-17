"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { TritaWordmark } from "@/components/TritaLogo";
import { isLikertQuestion, type Question } from "@/lib/questions/types";
import { createClientLogger } from "@/lib/client-logger";

const log = createClientLogger("observer");

interface ObserverDraftData {
  phase: "assessment" | "confidence";
  relationshipType: string;
  knownDuration: string;
  answers: Record<number, number>;
  currentPage: number;
}

interface ObserverClientProps {
  token: string;
  inviterName: string;
  testName: string;
  questions: Question[];
  initialDraft?: ObserverDraftData;
  // Belsős (név szerinti kollégának szóló) meghívónál a kapcsolat rögzített
  // — előtöltve, a többi opció szürke/nem választható.
  lockedRelationship?: string | null;
}

const RELATIONSHIP_OPTIONS = [
  { value: "FRIEND", labelKey: "observer.relationFriend" },
  { value: "COLLEAGUE", labelKey: "observer.relationColleague" },
  { value: "FAMILY", labelKey: "observer.relationFamily" },
  { value: "PARTNER", labelKey: "observer.relationPartner" },
  { value: "OTHER", labelKey: "observer.relationOther" },
] as const;

const DURATION_OPTIONS = [
  { value: "LT_1", labelKey: "observer.durationLt1" },
  { value: "1_3", labelKey: "observer.duration1to3" },
  { value: "3_5", labelKey: "observer.duration3to5" },
  { value: "5P", labelKey: "observer.duration5p" },
] as const;

const QUESTIONS_PER_PAGE = 5;

function sanitizeAnswersForQuestions(
  rawAnswers: Record<number, number> | Record<string, unknown> | undefined,
  questions: Question[],
): Record<number, number> {
  if (!rawAnswers || typeof rawAnswers !== "object") return {};

  const validIds = new Set(questions.map((q) => q.id));
  const sanitized: Record<number, number> = {};

  for (const [key, value] of Object.entries(rawAnswers)) {
    const questionId = Number(key);
    if (!Number.isInteger(questionId) || !validIds.has(questionId)) continue;
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) continue;
    sanitized[questionId] = value;
  }

  return sanitized;
}

function getResumePage(
  questions: Question[],
  answers: Record<number, number>,
  fallbackPage: number,
): number {
  const totalPages = Math.max(1, Math.ceil(questions.length / QUESTIONS_PER_PAGE));
  const firstUnansweredIdx = questions.findIndex((q) => answers[q.id] === undefined);
  if (firstUnansweredIdx === -1) return totalPages - 1;

  const byMissing = Math.floor(firstUnansweredIdx / QUESTIONS_PER_PAGE);
  const safeFallback = Number.isInteger(fallbackPage) ? fallbackPage : 0;
  return Math.max(0, Math.min(Math.min(byMissing, safeFallback), totalPages - 1));
}

export function ObserverClient({
  token,
  inviterName,
  testName,
  questions,
  initialDraft,
  lockedRelationship = null,
}: ObserverClientProps) {
  const { isSignedIn } = useUser();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const sanitizedInitialAnswers = sanitizeAnswersForQuestions(initialDraft?.answers, questions);
  const initialAllAnswered =
    questions.length > 0 &&
    questions.every((q) => sanitizedInitialAnswers[q.id] !== undefined);
  const initialPhase = initialDraft
    ? initialDraft.phase === "confidence" && !initialAllAnswered
      ? "assessment"
      : initialDraft.phase
    : "intro";
  const initialPage = initialDraft
    ? getResumePage(questions, sanitizedInitialAnswers, initialDraft.currentPage)
    : 0;

  const [phase, setPhase] = useState<
    "intro" | "assessment" | "confidence" | "done" | "inactive"
  >(initialPhase);
  const [relationshipType, setRelationshipType] = useState(
    lockedRelationship ?? initialDraft?.relationshipType ?? "",
  );
  const [knownDuration, setKnownDuration] = useState(initialDraft?.knownDuration ?? "");
  // UX-B20: a "válaszd ki mindkettőt" jelzés csak blokkolt indítási
  // KÍSÉRLET után jelenik meg — nem előre szidjuk a kitöltőt.
  const [startAttempted, setStartAttempted] = useState(false);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [answers, setAnswers] = useState<Record<number, number>>(sanitizedInitialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null);
  const [highlightConfidence, setHighlightConfidence] = useState(false);
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const reachedCheckpoints = useRef<Set<number>>(new Set(
    initialDraft
      ? ([25, 50, 75] as const).filter(
          (m) => (Object.keys(sanitizedInitialAnswers).length / questions.length) * 100 >= m,
        )
      : [],
  ));
  const initializedFocusPage = useRef<number | null>(null);
  const serverSaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef({ phase, relationshipType, knownDuration, answers, currentPage });
  const questionAreaRef = useRef<HTMLDivElement>(null);
  const scrollMounted = useRef(false);

  const DRAFT_KEY = `trita_observer_draft_${token}`;

  useEffect(() => {
    latestDraftRef.current = { phase, relationshipType, knownDuration, answers, currentPage };
  }, [phase, relationshipType, knownDuration, answers, currentPage]);

  useEffect(() => {
    if (!scrollMounted.current) { scrollMounted.current = true; return; }
    questionAreaRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentPage]);

  useEffect(() => {
    if (initialDraft) {
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.relationshipType && !lockedRelationship) setRelationshipType(data.relationshipType);
      if (data.knownDuration) setKnownDuration(data.knownDuration);
      if (data.answers && typeof data.answers === "object") {
        const sanitized = sanitizeAnswersForQuestions(
          data.answers as Record<string, unknown>,
          questions,
        );
        setAnswers(sanitized);
        const pct = (Object.keys(sanitized).length / questions.length) * 100;
        for (const m of [25, 50, 75] as const) {
          if (pct >= m) reachedCheckpoints.current.add(m);
        }
        setCurrentPage(getResumePage(questions, sanitized, data.currentPage ?? 0));
      }
      if (data.phase === "assessment" || data.phase === "confidence") {
        const sanitized = sanitizeAnswersForQuestions(
          (data.answers ?? {}) as Record<string, unknown>,
          questions,
        );
        const allAnswered = questions.every((q) => sanitized[q.id] !== undefined);
        setPhase(data.phase === "confidence" && !allAnswered ? "assessment" : data.phase);
      }
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (phase === "done" || phase === "inactive") return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ phase, relationshipType, knownDuration, answers, currentPage }),
      );
    } catch {}
    if (phase === "intro" || Object.keys(answers).length === 0) return;
    if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current);
    serverSaveDebounce.current = setTimeout(async () => {
      const d = latestDraftRef.current;
      if (d.phase === "done" || d.phase === "inactive") return;
      try {
        await fetch("/api/observer/draft", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token,
            phase: d.phase,
            relationshipType: d.relationshipType,
            knownDuration: d.knownDuration,
            answers: d.answers,
            currentPage: d.currentPage,
          }),
        });
      } catch {}
    }, 2000);
    return () => { if (serverSaveDebounce.current) clearTimeout(serverSaveDebounce.current); };
  }, [DRAFT_KEY, token, phase, relationshipType, knownDuration, answers, currentPage]);

  const totalQuestions = questions.length;
  const totalPages = Math.ceil(totalQuestions / QUESTIONS_PER_PAGE);
  const pageQuestions = questions.slice(
    currentPage * QUESTIONS_PER_PAGE,
    (currentPage + 1) * QUESTIONS_PER_PAGE,
  );
  const isLastPage = currentPage === totalPages - 1;
  const answeredCount = Object.keys(answers).length;
  const remainingQuestions = Math.max(totalQuestions - answeredCount, 0);
  const etaMinutes = Math.max(1, Math.ceil((remainingQuestions * 15) / 60));
  const activeQuestion = pageQuestions[activeQuestionIndex] ?? null;
  const canGoForwardWithinPage = activeQuestionIndex < pageQuestions.length - 1;
  const canGoBackWithinPage = activeQuestionIndex > 0;
  const canGoPrev = phase === "confidence" || canGoBackWithinPage || currentPage > 0;
  const canGoNext = pageQuestions.every((q) => answers[q.id] !== undefined);
  const currentQuestionAnswered = !activeQuestion || answers[activeQuestion.id] !== undefined;
  const checkpointActive = checkpoint !== null;
  const canProceed = phase === "confidence" || checkpointActive || currentQuestionAnswered;

  // Initialize active question index when page loads.
  // If all questions on this page are already answered (draft resume), auto-advance to next page.
  useEffect(() => {
    if (initializedFocusPage.current === currentPage) return;
    if (pageQuestions.length === 0) return;

    const firstUnanswered = pageQuestions.findIndex((q) => answers[q.id] === undefined);

    if (firstUnanswered === -1 && currentPage < totalPages - 1) {
      // Every question on this page is already answered — skip it.
      setCurrentPage((prev) => prev + 1);
      return; // initializedFocusPage stays unset so the next page re-inits
    }

    setActiveQuestionIndex(firstUnanswered === -1 ? pageQuestions.length - 1 : firstUnanswered);
    initializedFocusPage.current = currentPage;
  }, [currentPage, pageQuestions, answers, totalPages]);

  useEffect(() => {
    if (phase !== "assessment") return;
    const marks = [25, 50, 75];
    const percentage = (answeredCount / totalQuestions) * 100;
    const nextMark = marks.find(
      (mark) => percentage >= mark && !reachedCheckpoints.current.has(mark),
    );
    if (!nextMark) return;
    reachedCheckpoints.current.add(nextMark);
    setCheckpoint(nextMark);
  }, [phase, answeredCount, totalQuestions]);

  const highlightMissing = useCallback(
    (missingId: number) => {
      const missingIdx = pageQuestions.findIndex((q) => q.id === missingId);
      if (missingIdx >= 0) setActiveQuestionIndex(missingIdx);
      setHighlightQuestionId(missingId);
      window.setTimeout(() => {
        setHighlightQuestionId((current) => (current === missingId ? null : current));
      }, 1200);
    },
    [pageQuestions],
  );

  const handleNextPage = useCallback(() => {
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined);
      if (missing) highlightMissing(missing.id);
      return;
    }
    if (!isLastPage) {
      setCurrentPage((prev) => prev + 1);
    }
  }, [canGoNext, pageQuestions, answers, highlightMissing, isLastPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    }
  }, [currentPage]);

  const handleGoToConfidence = useCallback(() => {
    const currentAnswers = latestDraftRef.current.answers;
    const canGoNextNow = pageQuestions.every((q) => currentAnswers[q.id] !== undefined);
    if (!canGoNextNow) {
      const missing = pageQuestions.find((q) => currentAnswers[q.id] === undefined);
      if (missing) highlightMissing(missing.id);
      return;
    }
    setPhase("confidence");
  }, [pageQuestions, highlightMissing]);

  const handleAnswer = useCallback((questionId: number, value: number) => {
    const wasUnanswered = latestDraftRef.current.answers[questionId] === undefined;
    setAnswers((prev) => ({ ...prev, [questionId]: value }));

    if (!autoAdvance || !activeQuestion || activeQuestion.id !== questionId) return;

    const currentAnsweredCount = Object.keys(latestDraftRef.current.answers).length;
    const nextAnsweredCount = wasUnanswered ? currentAnsweredCount + 1 : currentAnsweredCount;
    const nextProgress = (nextAnsweredCount / totalQuestions) * 100;
    const willTriggerCheckpoint = [25, 50, 75].some(
      (mark) => nextProgress >= mark && !reachedCheckpoints.current.has(mark),
    );

    window.setTimeout(() => {
      if (willTriggerCheckpoint) return;

      if (canGoForwardWithinPage) {
        const updatedAnswers = { ...latestDraftRef.current.answers, [questionId]: value };
        const nextUnanswered = pageQuestions.findIndex(
          (q, i) => i > activeQuestionIndex && updatedAnswers[q.id] === undefined,
        );
        if (nextUnanswered !== -1) {
          setActiveQuestionIndex(nextUnanswered);
          return;
        }
        const allPageAnswered = pageQuestions.every((q) => updatedAnswers[q.id] !== undefined);
        if (!allPageAnswered) return;
        if (isLastPage) {
          handleGoToConfidence();
        } else {
          setCurrentPage((prev) => prev + 1);
        }
        return;
      }

      if (isLastPage) {
        handleGoToConfidence();
        return;
      }
      setCurrentPage((prev) => prev + 1);
    }, 130);
  }, [
    autoAdvance,
    activeQuestion,
    activeQuestionIndex,
    totalQuestions,
    canGoForwardWithinPage,
    pageQuestions,
    isLastPage,
    handleGoToConfidence,
  ]);

  const handlePrevStep = useCallback(() => {
    if (phase === "confidence") {
      setPhase("assessment");
      return;
    }
    if (checkpointActive) {
      setCheckpoint(null);
      return;
    }
    if (canGoBackWithinPage) {
      setActiveQuestionIndex((idx) => idx - 1);
      return;
    }
    handlePreviousPage();
  }, [phase, checkpointActive, canGoBackWithinPage, handlePreviousPage]);

  const handleNextStep = useCallback(() => {
    if (checkpointActive) {
      setCheckpoint(null);
      const nextUnanswered = pageQuestions.findIndex(
        (q, i) => i > activeQuestionIndex && answers[q.id] === undefined,
      );
      if (nextUnanswered !== -1) {
        setActiveQuestionIndex(nextUnanswered);
      } else if (isLastPage) {
        handleGoToConfidence();
      } else {
        handleNextPage();
      }
      return;
    }
    if (activeQuestion && answers[activeQuestion.id] === undefined) {
      highlightMissing(activeQuestion.id);
      return;
    }
    if (canGoForwardWithinPage) {
      const nextUnanswered = pageQuestions.findIndex(
        (q, i) => i > activeQuestionIndex && answers[q.id] === undefined,
      );
      if (nextUnanswered !== -1) {
        setActiveQuestionIndex(nextUnanswered);
      } else {
        if (isLastPage) {
          handleGoToConfidence();
        } else {
          handleNextPage();
        }
      }
      return;
    }
    if (isLastPage) {
      handleGoToConfidence();
      return;
    }
    handleNextPage();
  }, [
    checkpointActive,
    activeQuestion,
    activeQuestionIndex,
    pageQuestions,
    answers,
    highlightMissing,
    canGoForwardWithinPage,
    isLastPage,
    handleGoToConfidence,
    handleNextPage,
  ]);

  useEffect(() => {
    if (phase !== "assessment") return;
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (!checkpointActive && activeQuestion && ["1", "2", "3", "4", "5"].includes(event.key)) {
        event.preventDefault();
        handleAnswer(activeQuestion.id, Number(event.key));
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        handleNextStep();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [phase, checkpointActive, activeQuestion, handleAnswer, handleNextStep]);

  const handleFinish = async () => {
    const missingIndex = questions.findIndex((q) => answers[q.id] === undefined);
    if (missingIndex !== -1) {
      const missingQuestionId = questions[missingIndex]?.id;
      const targetPage = Math.floor(missingIndex / QUESTIONS_PER_PAGE);
      setPhase("assessment");
      setCurrentPage(targetPage);
      initializedFocusPage.current = null;
      if (typeof missingQuestionId === "number") {
        setHighlightQuestionId(missingQuestionId);
        window.setTimeout(() => {
          setHighlightQuestionId((current) =>
            current === missingQuestionId ? null : current,
          );
        }, 1200);
      }
      showToast(t("error.MISSING_ANSWER", locale), "error");
      return;
    }

    if (confidence === null) {
      setHighlightConfidence(true);
      window.setTimeout(() => setHighlightConfidence(false), 1200);
      return;
    }
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload = {
        token,
        relationshipType,
        knownDuration,
        answers: Object.entries(answers).map(([questionId, value]) => ({
          questionId: Number(questionId),
          value,
        })),
        ...(confidence != null ? { confidence } : {}),
      };
      const response = await fetch("/api/observer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const data = await response.json();
        const code = data.error ?? "";
        if (code === "INVITE_CANCELED" || code === "INVITE_EXPIRED") {
          setPhase("inactive");
          return;
        }
        const message = t(`error.${code}`, locale);
        throw new Error(
          message !== `error.${code}` ? message : t("observer.genericError", locale),
        );
      }
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      fetch("/api/observer/draft", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
      setPhase("done");
    } catch (error) {
      log.warn({ event: "observer.submit_failed", err: error }, "Observer flow error");
      showToast(
        error instanceof Error ? error.message : t("observer.saveError", locale),
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const helpText = tf("observer.helpLikertAbout", locale, { inviter: inviterName });
  const thinkOfText = tf("observer.thinkOf", locale, { inviter: inviterName });
  const thinkOfParts = thinkOfText.split(inviterName);

  if (phase === "intro") {
    const canStart = relationshipType !== "" && knownDuration !== "";

    return (
      <div className="relative min-h-dvh bg-cream">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-b from-transparent to-cream" aria-hidden="true" />
        <div className="relative z-10 mx-auto max-w-2xl px-4 pt-8 pb-20 md:pt-12">
          <div className="rounded-2xl border border-sand bg-surface-card p-6 md:p-8">
            <h1 className="text-2xl font-bold text-ink">
              👋 {t("observer.introWelcome", locale)}
            </h1>
            <div className="mt-4 rounded-xl border border-sage-ring bg-gradient-to-r from-sage via-sage-dark to-sage-deep px-4 py-2 text-center text-sm font-medium text-[var(--color-action-primary-fg)] shadow-sm">
              {tf("observer.introInvitedBy", locale, { inviter: inviterName })}
            </div>
            <p className="mt-4 text-sm leading-relaxed text-ink-body">
              {t("observer.introBodyShort", locale)}
            </p>
            <div className="mt-4 rounded-xl border border-sage-ring bg-sage-soft px-4 py-3 text-sm leading-relaxed text-bronze-dark">
              {tf("observer.introPauseNote", locale, { count: questions.length })}
            </div>

            <div className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-semibold text-ink-body">
                {t("observer.relationshipLabel", locale)}
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIP_OPTIONS.map((opt) => {
                    const lockedOut =
                      lockedRelationship !== null && opt.value !== lockedRelationship;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={lockedOut}
                        onClick={() => !lockedOut && setRelationshipType(opt.value)}
                        className={`min-h-[44px] rounded-lg border px-4 text-sm font-medium transition ${
                          relationshipType === opt.value
                            ? "border-sage-ring bg-sage-soft text-bronze-dark"
                            : lockedOut
                              ? "cursor-not-allowed border-sand bg-cream/50 text-muted opacity-60"
                              : "border-sand bg-surface-card text-ink-body hover:border-warm-dark"
                        }`}
                      >
                        {t(opt.labelKey, locale)}
                      </button>
                    );
                  })}
                </div>
                {lockedRelationship !== null && (
                  <span className="text-xs font-normal text-muted">
                    {t("observer.relationLockedNote", locale)}
                  </span>
                )}
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-ink-body">
                {t("observer.durationLabel", locale)}
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKnownDuration(opt.value)}
                      className={`min-h-[44px] rounded-lg border px-4 text-sm font-medium transition ${
                        knownDuration === opt.value
                          ? "border-sage-ring bg-sage-soft text-bronze-dark"
                          : "border-sand bg-surface-card text-ink-body hover:border-warm-dark"
                      }`}
                    >
                      {t(opt.labelKey, locale)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {startAttempted && !canStart && (
              <p className="mt-4 text-center text-xs text-state-warning-fg">
                {t("observer.selectBothFields", locale)}
              </p>
            )}
            <button
              type="button"
              onClick={() => {
                if (!canStart) {
                  setStartAttempted(true);
                  return;
                }
                setPhase("assessment");
              }}
              className="mt-6 min-h-[48px] w-full rounded-lg bg-sage px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-sage-dark hover:shadow-xl"
            >
              {t("observer.start", locale)}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "inactive") {
    return (
      <div className="relative min-h-dvh bg-cream">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-b from-transparent to-cream" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-sand bg-surface-card p-8 shadow-sm">
            <div className="text-5xl leading-none">😕</div>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              {t("observer.inactiveTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("observer.inactiveBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="relative min-h-dvh bg-cream">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-1/3 bg-gradient-to-b from-transparent to-cream" aria-hidden="true" />
        <div className="relative z-10 mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-[#cfe2d6] bg-surface-card p-8 shadow-sm">
            <div className="text-5xl leading-none">🙏</div>
            <h1 className="mt-4 text-2xl font-bold text-ink">
              {t("observer.doneTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-ink-body">
              {t("observer.doneBody", locale)}
            </p>
            {isSignedIn ? (
              <>
                <p className="mt-4 text-sm leading-relaxed text-ink-body">
                  {t("observer.doneSignedInHint", locale)}
                </p>
                <a
                  href="/profile/results"
                  className="mt-4 inline-block min-h-[48px] rounded-lg bg-sage px-6 py-3 text-sm font-semibold text-[var(--color-action-primary-fg)] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-sage-dark hover:shadow-xl"
                >
                  {t("observer.goDashboard", locale)}
                </a>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed text-ink-body">
                  {t("observer.doneSignedOutHint", locale)}
                </p>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-center">
                  <a
                    href={`/sign-up?observeToken=${token}`}
                    className="inline-flex min-h-[48px] items-center justify-center rounded-lg bg-sage px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] shadow-lg transition-all duration-300 hover:scale-105 hover:bg-sage-dark hover:shadow-xl"
                  >
                    {t("observer.signUpCta", locale)}
                  </a>
                  <a
                    href={`/sign-in?observeToken=${token}`}
                    className="inline-flex min-h-[44px] items-center justify-center rounded-lg border border-sage bg-transparent px-6 text-sm font-semibold text-[var(--color-accent-primary-strong)] transition hover:bg-sage-soft"
                  >
                    {t("observer.signInCta", locale)}
                  </a>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  const globalIndex = activeQuestion
    ? questions.findIndex((q) => q.id === activeQuestion.id)
    : totalQuestions - 1;
  const displayIndex = phase === "confidence" ? totalQuestions : globalIndex + 1;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface-canvas)]">
      {/* ═══ MINIMAL NAV — a self-kitöltéssel azonos héj ═══ */}
      <nav className="flex shrink-0 items-center justify-between bg-[var(--color-surface-header)]/95 px-6 py-3 backdrop-blur-[12px] sm:px-10 lg:px-16">
        <Link href="/" className="text-[var(--color-text-primary)]">
          <TritaWordmark className="text-2xl" />
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-micro text-[var(--color-action-primary-bg)]">
            ✓ {t("assessment.savedState", locale)}
          </span>
          {/* Az observer sosem lép be — a séma-választó csak itt érhető el. */}
          <ThemeToggle variant="compact" />
        </div>
      </nav>

      {/* ═══ PROGRESS BAR — single row ═══ */}
      <div className="flex shrink-0 items-center gap-4 border-b border-[var(--color-border-default)] px-7 py-2.5">
        <div className="flex items-baseline gap-1">
          <span className="font-fraunces text-base font-medium text-[var(--color-text-primary)]">{displayIndex}</span>
          <span className="text-xs text-[var(--color-text-muted)]">/ {totalQuestions}</span>
        </div>
        <div className="relative h-1 flex-1 overflow-hidden rounded-full bg-[var(--color-border-default)]">
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)]/30 transition-all duration-300"
            style={{ width: `${(Math.max(answeredCount, displayIndex) / totalQuestions) * 100}%` }}
          />
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)] transition-all duration-300"
            style={{ width: `${(displayIndex / totalQuestions) * 100}%` }}
          />
        </div>
        <span className="whitespace-nowrap text-[11px] text-[var(--color-text-muted)]">
          {tf("assessment.etaRemaining", locale, { minutes: etaMinutes })}
        </span>
      </div>

      {/* Observer-emlékeztető — kire gondolj válasz közben */}
      <div className="shrink-0 border-b border-[var(--color-border-default)] bg-[var(--color-surface-self-accent-soft)]/50 px-7 py-2 text-center text-[12px] text-[var(--color-accent-self-deep)]">
        {thinkOfParts.length > 1 ? (
          thinkOfParts.map((part, index) => (
            <span key={`thinkof-${index}`}>
              {part}
              {index < thinkOfParts.length - 1 ? <strong className="font-semibold">{inviterName}</strong> : null}
            </span>
          ))
        ) : (
          thinkOfText
        )}
      </div>

      {/* ═══ QUESTION AREA (centered) ═══ */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 py-8 lg:py-12">
        <div ref={questionAreaRef} className="w-full max-w-xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                phase === "confidence"
                  ? "observer-confidence"
                  : checkpointActive
                    ? `observer-checkpoint-${checkpoint}`
                    : `observer-${activeQuestion?.id ?? "none"}`
              }
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -40 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col items-center"
            >
              {phase === "confidence" ? (
                <>
                  <QuestionCard
                    testName={testName}
                    format="likert"
                    question={t("observer.confidenceLabel", locale)}
                    value={confidence}
                    onChange={(v) => setConfidence(v)}
                    highlight={highlightConfidence}
                  />
                  <p className="mt-4 text-center text-xs text-[var(--color-text-muted)]">
                    {t("observer.confidenceHint", locale)}
                  </p>
                </>
              ) : checkpointActive ? (
                <div className="flex flex-col items-center text-center">
                  <div className="mb-4 inline-flex items-center gap-[5px] rounded-full bg-[var(--color-surface-self-accent-soft)] px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-widest text-[var(--color-action-primary-bg)]">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
                    {t("assessment.journeyMilestone", locale)}
                  </div>
                  <h2 className="mb-3 font-fraunces text-[24px] leading-tight text-[var(--color-text-primary)] lg:text-[26px]">
                    {t(
                      checkpoint === 25 ? "assessment.journeyMilestone25"
                      : checkpoint === 50 ? "assessment.journeyMilestone50"
                      : "assessment.journeyMilestone75",
                      locale
                    )}
                  </h2>
                  <div className="mb-5 flex w-full max-w-[280px] gap-[3px]">
                    {Array.from({ length: 10 }, (_, i) => {
                      const filledSegments = Math.round((answeredCount / totalQuestions) * 10);
                      return (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${
                            i < filledSegments
                              ? "bg-[var(--color-action-primary-bg)]"
                              : i === filledSegments
                                ? "bg-[var(--color-accent-primary)]"
                                : "bg-[var(--color-border-default)]"
                          }`}
                        />
                      );
                    })}
                  </div>
                  <div className="flex w-full max-w-[400px] items-start gap-2 rounded-lg bg-[var(--color-surface-self-accent-soft)] px-4 py-3 text-left">
                    <span className="mt-px shrink-0 text-sm">💡</span>
                    <p className="text-caption leading-[1.45] text-[var(--color-accent-self-deep)]">
                      {t(
                        checkpoint === 25 ? "assessment.journeyMilestone25Hint"
                        : checkpoint === 50 ? "assessment.journeyMilestone50Hint"
                        : "assessment.journeyMilestone75Hint",
                        locale
                      )}
                    </p>
                  </div>
                </div>
              ) : activeQuestion && isLikertQuestion(activeQuestion) ? (
                <QuestionCard
                  testName={testName}
                  dimension={activeQuestion.dimension}
                  format="likert"
                  question={activeQuestion.textObserver ?? activeQuestion.text}
                  value={(answers[activeQuestion.id] as number) ?? null}
                  onChange={(v) => handleAnswer(activeQuestion.id, v)}
                  highlight={highlightQuestionId === activeQuestion.id}
                />
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="mt-6 text-xs italic text-[var(--color-text-muted)]">
          {helpText}
        </p>
      </div>

      {/* ═══ FOOTER BAR — a self-kitöltéssel azonos ═══ */}
      {/* Mobilon a vezérlősor a viewport aljára tapad (az (app)-shell fejléce
          alatt egyébként a hajtás alá csúszna); md-től a korábbi in-flow sáv. */}
      <div className="sticky bottom-0 z-20 flex shrink-0 items-center justify-between gap-2 border-t border-[var(--color-border-default)] bg-surface-card px-3 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.02)] md:static md:z-auto md:px-7">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={!canGoPrev}
          className={`min-h-[44px] whitespace-nowrap rounded-lg border px-3 py-2.5 text-caption transition-all md:px-5 ${
            canGoPrev
              ? "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
              : "border-transparent bg-transparent text-transparent pointer-events-none"
          }`}
        >
          ← {t("assessment.prevCta", locale)}
        </button>

        <label className="flex min-h-[44px] shrink-0 cursor-pointer items-center gap-2 px-1">
          <div
            className={`flex h-3.5 w-3.5 items-center justify-center rounded-[3px] border-[1.5px] transition-all ${
              autoAdvance ? "border-[var(--color-action-primary-bg)] bg-[var(--color-action-primary-bg)]" : "border-[var(--color-border-default)] bg-surface-card"
            }`}
          >
            {autoAdvance && <span className="text-micro leading-none text-white">✓</span>}
          </div>
          <input
            type="checkbox"
            checked={autoAdvance}
            onChange={(e) => setAutoAdvance(e.target.checked)}
            className="sr-only"
          />
          {/* Mobilon csak a jelölőnégyzet látszik (a felirat elférne, de a
              három vezérlőt szétnyomná) — a szöveg sr-only marad, hogy a
              kapcsolónak legyen elérhető neve. */}
          <span className="sr-only whitespace-nowrap text-[11px] text-[var(--color-text-muted)] md:not-sr-only">
            {t("assessment.autoAdvance", locale)}
          </span>
        </label>

        {phase === "confidence" ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={isSubmitting}
            className={`min-h-[44px] whitespace-nowrap rounded-lg px-4 py-2.5 text-caption font-semibold transition-all md:px-6 ${
              !isSubmitting && confidence !== null
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/15 hover:brightness-[1.06]"
                : "bg-[var(--color-action-primary-bg)]/30 text-white/50"
            }`}
          >
            {isSubmitting ? t("observer.submitLoading", locale) : t("observer.submit", locale)}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleNextStep}
            disabled={isSubmitting}
            aria-disabled={!canProceed || isSubmitting}
            className={`min-h-[44px] whitespace-nowrap rounded-lg px-4 py-2.5 text-caption font-semibold transition-all md:px-6 ${
              canProceed && !isSubmitting
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/15 hover:brightness-[1.06]"
                : "bg-[var(--color-action-primary-bg)]/30 text-white/50"
            }`}
          >
            {t("assessment.nextCta", locale)} →
          </button>
        )}
      </div>
    </div>
  );
}
