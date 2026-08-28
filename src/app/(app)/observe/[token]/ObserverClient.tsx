"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AssessmentFocusHeader } from "@/components/layout/AssessmentFocusHeader";
import { useAssessmentStepController } from "@/components/assessment/useAssessmentStepController";
import { BackChevronIcon } from "@/components/ui/primitives/BackChevronIcon";
import { ChevronRightIcon } from "@/components/ui/icons";
import { isLikertQuestion, type Question } from "@/lib/questions/types";
import { createClientLogger } from "@/lib/client-logger";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { PageState } from "@/components/ui/primitives/StatePanel";

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
  const observerHomeHref = isSignedIn ? JOURNEY_HOME_HANDOFF_PATH : "/";

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
      ? ([50] as const).filter(
          (m) => (Object.keys(sanitizedInitialAnswers).length / questions.length) * 100 >= m,
        )
      : [],
  ));
  const initializedFocusPage = useRef<number | null>(null);
  const serverSaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef({ phase, relationshipType, knownDuration, answers, currentPage });
  const currentPageRef = useRef(currentPage);
  const activeQuestionIndexRef = useRef(activeQuestionIndex);
  const questionAreaRef = useRef<HTMLDivElement>(null);
  const scrollMounted = useRef(false);
  const {
    cancelAutoAdvance,
    runStepTransition,
    scheduleAutoAdvance: scheduleGuardedAutoAdvance,
  } = useAssessmentStepController({
    getActiveQuestionId: () =>
      questions[currentPageRef.current * QUESTIONS_PER_PAGE + activeQuestionIndexRef.current]?.id ??
      null,
  });

  const DRAFT_KEY = `trita_observer_draft_${token}`;

  useEffect(() => {
    latestDraftRef.current = { phase, relationshipType, knownDuration, answers, currentPage };
    currentPageRef.current = currentPage;
    activeQuestionIndexRef.current = activeQuestionIndex;
  }, [phase, relationshipType, knownDuration, answers, currentPage, activeQuestionIndex]);

  useEffect(() => {
    if (!autoAdvance || phase !== "assessment" || checkpoint !== null) {
      cancelAutoAdvance();
    }
  }, [autoAdvance, cancelAutoAdvance, checkpoint, phase]);

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
        for (const m of [50] as const) {
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
        const res = await fetch("/api/observer/draft", {
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
        if (!res.ok) {
          // P1.5: a szerver-oldali draft-mentés hibája eddig teljesen néma
          // volt – localStorage a fallback, de eszközváltásnál adatvesztés.
          log.warn(
            { event: "observer.server_draft_save_failed", status: res.status },
            "Observer server draft save returned non-OK",
          );
        }
      } catch (err) {
        log.warn(
          { event: "observer.server_draft_save_failed", err },
          "Observer server draft save failed",
        );
      }
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
      // Every question on this page is already answered – skip it.
      setCurrentPage((prev) => prev + 1);
      return; // initializedFocusPage stays unset so the next page re-inits
    }

    setActiveQuestionIndex(firstUnanswered === -1 ? pageQuestions.length - 1 : firstUnanswered);
    initializedFocusPage.current = currentPage;
  }, [currentPage, pageQuestions, answers, totalPages]);

  useEffect(() => {
    if (phase !== "assessment") return;
    const marks = [50];
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
    const willTriggerCheckpoint =
      nextProgress >= 50 && !reachedCheckpoints.current.has(50);

    scheduleGuardedAutoAdvance(questionId, () => {
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
    });
  }, [
    autoAdvance,
    activeQuestion,
    activeQuestionIndex,
    totalQuestions,
    canGoForwardWithinPage,
    pageQuestions,
    isLastPage,
    handleGoToConfidence,
    scheduleGuardedAutoAdvance,
  ]);

  const handlePrevStep = useCallback(() => {
    runStepTransition(() => {
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
    });
  }, [phase, checkpointActive, canGoBackWithinPage, handlePreviousPage, runStepTransition]);

  const handleNextStep = useCallback(() => {
    if (activeQuestion && answers[activeQuestion.id] === undefined) {
      highlightMissing(activeQuestion.id);
      return;
    }

    runStepTransition(() => {
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
      if (canGoForwardWithinPage) {
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
      if (isLastPage) {
        handleGoToConfidence();
        return;
      }
      handleNextPage();
    });
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
    runStepTransition,
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
    let userMessage = t("observer.saveError", locale);
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
        userMessage =
          message !== `error.${code}` ? message : t("observer.genericError", locale);
        throw new Error("OBSERVER_SUBMIT_FAILED");
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
      showToast(userMessage, "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const helpText = tf("observer.helpLikertAbout", locale, { inviter: inviterName });
  const helpScaleText = t("observer.helpLikertScale", locale);
  const thinkOfText = tf("observer.thinkOf", locale, { inviter: inviterName });
  const thinkOfParts = thinkOfText.split(inviterName);

  if (phase === "intro") {
    const canStart = relationshipType !== "" && knownDuration !== "";
    const inviterInitials = inviterName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toLocaleUpperCase(locale))
      .join("");

    return (
      <div className="flex min-h-dvh flex-col bg-[var(--color-surface-canvas)]">
        <AssessmentFocusHeader homeHref={observerHomeHref}>
          <ThemeToggle variant="compact" />
        </AssessmentFocusHeader>

        <main className="mx-auto flex w-full max-w-[1180px] flex-1 px-3 pb-3 pt-3 sm:px-5 sm:pb-5 lg:px-4 lg:pb-8 lg:pt-4">
          <div data-testid="observer-intro-layout" className="grid w-full overflow-hidden rounded-[22px] border border-[var(--color-border-default)] bg-surface-card shadow-[0_18px_48px_rgba(26,26,46,0.10)] lg:min-h-[680px] lg:grid-cols-[minmax(0,0.88fr)_minmax(0,1.12fr)]">
            <section className="relative flex min-h-[390px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--color-layer-self-hero-from)] via-[var(--color-layer-self-hero-mid)] to-[var(--color-layer-self-hero-to)] px-7 py-9 text-[var(--color-text-on-inverse)] sm:min-h-[430px] sm:px-10 sm:py-11 lg:min-h-0 lg:px-12 lg:py-14">
              <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 h-72 w-72 rounded-full bg-white/[0.05]" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-white/[0.05]" />

              <div className="relative z-10">
                <p className="text-label uppercase text-[var(--color-accent-primary-soft)]">
                  {t("observer.introEyebrow", locale)}
                </p>
                <h1 className="mt-6 max-w-[470px] font-fraunces text-display font-medium leading-[1.03] tracking-[-0.035em] text-[var(--color-text-on-inverse)] lg:text-hero">
                  {t("observer.introHeroTitle", locale)}
                </h1>
                <p className="mt-6 max-w-[430px] text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)] sm:text-base">
                  {tf("observer.introHeroBody", locale, { inviter: inviterName })}
                </p>
              </div>

              <div className="relative z-10 mt-12 flex items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent-primary)] text-caption font-semibold text-[var(--color-accent-primary-deep)]">
                  {inviterInitials || "T"}
                </span>
                <span>
                  <strong className="block text-caption font-semibold text-[var(--color-text-on-inverse)]">
                    {tf("observer.introInviterMeta", locale, { inviter: inviterName })}
                  </strong>
                  <span className="mt-0.5 block text-note text-[var(--color-text-on-inverse-muted)]">
                    {t("observer.introAnonymousMeta", locale)}
                  </span>
                </span>
              </div>
            </section>

            <section className="flex flex-col justify-center px-5 py-8 sm:px-9 sm:py-10 lg:px-12 lg:py-12">
              <p className="text-label uppercase text-[var(--color-text-muted)]">
                {t("observer.introFormEyebrow", locale)}
              </p>
              <h2 className="mt-2 font-fraunces text-title font-medium leading-tight tracking-[-0.025em] text-[var(--color-text-primary)] sm:text-display">
                {t("observer.introFormTitle", locale)}
              </h2>
              <p className="mt-3 max-w-[560px] text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t("observer.introFormBody", locale)}
              </p>

              <div className="mt-8 flex flex-col gap-7">
                <fieldset>
                  <legend className="mb-3 text-caption font-semibold text-[var(--color-text-primary)]">
                    {t("observer.relationshipLabel", locale)}
                  </legend>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
                  {RELATIONSHIP_OPTIONS.map((opt) => {
                    const lockedOut =
                      lockedRelationship !== null && opt.value !== lockedRelationship;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={lockedOut}
                        onClick={() => !lockedOut && setRelationshipType(opt.value)}
                        aria-pressed={relationshipType === opt.value}
                        className={`min-h-[50px] rounded-xl border px-3 text-caption font-medium transition-all ${FOCUS_RING_CLASS} ${
                          relationshipType === opt.value
                            ? "border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] text-[var(--color-action-primary-bg)]"
                            : lockedOut
                              ? "cursor-not-allowed border-[var(--color-border-default)] bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] opacity-55"
                              : "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-secondary)] hover:border-[var(--color-action-primary-bg)] hover:bg-[var(--color-surface-subtle)]"
                        }`}
                      >
                        {t(opt.labelKey, locale)}
                      </button>
                    );
                  })}
                  </div>
                  {lockedRelationship !== null && (
                  <p className="mt-2 text-note text-[var(--color-text-muted)]">
                    {t("observer.relationLockedNote", locale)}
                  </p>
                  )}
                </fieldset>

                <fieldset>
                  <legend className="mb-3 text-caption font-semibold text-[var(--color-text-primary)]">
                    {t("observer.durationLabel", locale)}
                  </legend>
                  <div className="grid grid-cols-1 gap-2.5 min-[430px]:grid-cols-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKnownDuration(opt.value)}
                      aria-pressed={knownDuration === opt.value}
                      className={`min-h-[50px] rounded-xl border px-3 text-caption font-medium transition-all ${FOCUS_RING_CLASS} ${
                        knownDuration === opt.value
                          ? "border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] text-[var(--color-action-primary-bg)]"
                          : "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-secondary)] hover:border-[var(--color-action-primary-bg)] hover:bg-[var(--color-surface-subtle)]"
                      }`}
                    >
                      {t(opt.labelKey, locale)}
                    </button>
                  ))}
                  </div>
                </fieldset>
              </div>

              {startAttempted && !canStart && (
                <p className="mt-5 text-center text-caption text-state-warning-fg" role="alert">
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
                className={`mt-7 min-h-[52px] w-full rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-sm font-semibold text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/20 transition-all hover:brightness-[1.06] ${FOCUS_RING_CLASS}`}
              >
                {t("observer.start", locale)}
              </button>
              <p className="mt-3 text-center text-note text-[var(--color-text-muted)]">
                {tf("observer.introMeta", locale, { count: questions.length })}
              </p>
            </section>
          </div>
        </main>
      </div>
    );
  }

  if (phase === "inactive") {
    return (
      <PageState
        tone="error"
        title={t("observer.inactiveTitle", locale)}
        body={t("observer.inactiveBody", locale)}
      />
    );
  }

  if (phase === "done") {
    return (
      <div className="flex min-h-dvh flex-col bg-[var(--color-surface-canvas)]">
        <AssessmentFocusHeader homeHref={observerHomeHref}>
          <ThemeToggle variant="compact" />
        </AssessmentFocusHeader>

        <main className="mx-auto flex w-full max-w-[1180px] flex-1 items-center px-3 pb-3 pt-3 sm:px-5 sm:pb-5 lg:px-4 lg:pb-8 lg:pt-4">
          <div
            data-testid="observer-done-layout"
            className="grid w-full overflow-hidden rounded-[22px] border border-[var(--color-border-default)] bg-surface-card shadow-[0_18px_48px_rgba(26,26,46,0.10)] lg:min-h-[540px] lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
          >
            <section className="relative flex min-h-[350px] flex-col justify-between overflow-hidden bg-gradient-to-br from-[var(--color-layer-self-hero-from)] via-[var(--color-layer-self-hero-mid)] to-[var(--color-layer-self-hero-to)] px-7 py-9 text-[var(--color-text-on-inverse)] sm:min-h-[390px] sm:px-10 sm:py-11 lg:min-h-0 lg:px-12 lg:py-14">
              <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-32 h-72 w-72 rounded-full bg-white/[0.05]" />
              <div aria-hidden="true" className="pointer-events-none absolute -bottom-24 -left-20 h-52 w-52 rounded-full bg-white/[0.05]" />

              <div className="relative z-10">
                <span
                  aria-hidden="true"
                  className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--color-accent-primary)] text-2xl font-semibold text-[var(--color-accent-primary-deep)] shadow-sm"
                >
                  ✓
                </span>
                <p className="mt-8 text-label uppercase text-[var(--color-accent-primary-soft)]">
                  {t("observer.doneEyebrow", locale)}
                </p>
                <h1 className="mt-3 max-w-[430px] font-fraunces text-display font-medium leading-[1.05] tracking-[-0.035em] text-[var(--color-text-on-inverse)] sm:text-hero">
                  {t("observer.doneTitle", locale)}
                </h1>
                <p className="mt-5 max-w-[410px] text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)] sm:text-base">
                  {t("observer.doneBody", locale)}
                </p>
              </div>

              <div className="relative z-10 mt-10 flex items-start gap-3 border-t border-white/15 pt-5">
                <span aria-hidden="true" className="mt-0.5 text-[var(--color-accent-primary-soft)]">◇</span>
                <p className="max-w-[390px] text-note leading-relaxed text-[var(--color-text-on-inverse-muted)]">
                  {t("observer.donePrivacyNote", locale)}
                </p>
              </div>
            </section>

            <section className="flex flex-col justify-center px-5 py-9 sm:px-9 sm:py-11 lg:px-12 lg:py-12">
              <p className="text-label uppercase text-[var(--color-text-muted)]">
                {t("observer.doneNextEyebrow", locale)}
              </p>
              <h2 className="mt-2 font-fraunces text-title font-medium leading-tight tracking-[-0.025em] text-[var(--color-text-primary)] sm:text-display">
                {t(isSignedIn ? "observer.doneSignedInTitle" : "observer.doneSignedOutTitle", locale)}
              </h2>
              <p className="mt-4 max-w-[520px] text-sm leading-relaxed text-[var(--color-text-muted)]">
                {t(isSignedIn ? "observer.doneSignedInHint" : "observer.doneSignedOutHint", locale)}
              </p>

              {isSignedIn ? (
                <a
                  href="/profile/results"
                  className={`mt-8 inline-flex min-h-[52px] w-full items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-center text-sm font-semibold text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/20 transition-all hover:brightness-[1.06] ${FOCUS_RING_CLASS}`}
                >
                  {t("observer.goDashboard", locale)}
                </a>
              ) : (
                <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <a
                    href={`/sign-up?observeToken=${token}`}
                    className={`inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-center text-sm font-semibold text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/20 transition-all hover:brightness-[1.06] ${FOCUS_RING_CLASS}`}
                  >
                    {t("observer.signUpCta", locale)}
                  </a>
                  <a
                    href={`/sign-in?observeToken=${token}`}
                    className={`inline-flex min-h-[52px] flex-1 items-center justify-center rounded-xl border border-[var(--color-action-primary-bg)] bg-transparent px-6 text-center text-sm font-semibold text-[var(--color-action-primary-bg)] transition hover:bg-[var(--color-surface-self-accent-soft)] ${FOCUS_RING_CLASS}`}
                  >
                    {t("observer.signInCta", locale)}
                  </a>
                </div>
              )}

              <p className="mt-5 text-center text-note text-[var(--color-text-muted)]">
                {t("observer.doneMeta", locale)}
              </p>
            </section>
          </div>
        </main>
      </div>
    );
  }

  const globalIndex = activeQuestion
    ? questions.findIndex((q) => q.id === activeQuestion.id)
    : totalQuestions - 1;
  const displayIndex = phase === "confidence" ? totalQuestions : globalIndex + 1;

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--color-surface-canvas)]">
      <AssessmentFocusHeader
        homeHref={observerHomeHref}
        center={(
          <div className="flex w-full items-center gap-2.5 lg:gap-3">
            <div className="hidden shrink-0 items-baseline gap-1 sm:flex">
              <span className="font-fraunces text-base font-medium text-[var(--color-text-primary)]">{displayIndex}</span>
              <span className="text-xs text-[var(--color-text-muted)]">/ {totalQuestions}</span>
            </div>
            <div
              role="progressbar"
              aria-label={tf("assessment.progressLabel", locale, {
                done: displayIndex,
                total: totalQuestions,
              })}
              aria-valuemin={1}
              aria-valuemax={totalQuestions}
              aria-valuenow={displayIndex}
              className="relative h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-[var(--color-border-default)]"
            >
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)]/30 transition-all duration-300"
                style={{ width: `${(Math.max(answeredCount, displayIndex) / totalQuestions) * 100}%` }}
              />
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-[var(--color-action-primary-bg)] transition-all duration-300"
                style={{ width: `${(displayIndex / totalQuestions) * 100}%` }}
              />
            </div>
            <span className="hidden shrink-0 whitespace-nowrap text-note text-[var(--color-text-muted)] sm:inline">
              {tf("assessment.etaRemaining", locale, { minutes: etaMinutes })}
            </span>
          </div>
        )}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="flex shrink-0 items-baseline gap-1 sm:hidden">
            <span className="font-fraunces text-base font-medium text-[var(--color-text-primary)]">{displayIndex}</span>
            <span className="text-xs text-[var(--color-text-muted)]">/ {totalQuestions}</span>
          </div>
          <div className="hidden items-center gap-2 sm:flex sm:gap-3">
            <span className="text-micro text-[var(--color-action-primary-bg)]">
              ✓ {t("assessment.savedState", locale)}
            </span>
            <ThemeToggle variant="compact" />
          </div>
        </div>
      </AssessmentFocusHeader>

      {/* Observer-emlékeztető – kire gondolj válasz közben */}
      <div data-testid="observer-think-of" className="mx-auto mt-2 w-[calc(100%-1.5rem)] max-w-[1180px] shrink-0 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-self-accent-soft)]/50 px-4 py-2.5 text-center text-xs text-[var(--color-accent-self-deep)] sm:px-7">
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
      <div className="flex flex-1 flex-col items-center justify-center px-5 py-6 sm:px-6 sm:py-8 lg:py-12">
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
                  <div className="mb-4 inline-flex items-center gap-[5px] rounded-full bg-[var(--color-surface-self-accent-soft)] px-3.5 py-1.5 text-label uppercase text-[var(--color-action-primary-bg)]">
                    <div className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
                    {t("assessment.journeyMilestone", locale)}
                  </div>
                  <h2 className="mb-3 font-fraunces text-title leading-tight text-[var(--color-text-primary)] lg:text-title">
                    {t("assessment.journeyMilestone50", locale)}
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
                      {t("assessment.journeyMilestone50Hint", locale)}
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
          <span className="block">{helpText}</span>
          <span className="mt-1 block text-note not-italic">{helpScaleText}</span>
        </p>
      </div>

      {/* ═══ FLOATING CONTROL DOCK – a self-kitöltéssel azonos ═══ */}
      <div className="mx-3 mb-[max(0.75rem,env(safe-area-inset-bottom))] grid shrink-0 grid-cols-2 items-center gap-2 rounded-[20px] border border-[var(--color-border-default)] bg-[var(--color-surface-header)]/95 p-2 shadow-[0_10px_28px_rgba(26,26,46,0.10)] backdrop-blur-[14px] sm:grid-cols-[1fr_auto_1fr] md:mx-auto md:mb-3 md:w-[calc(100%-1.5rem)] md:max-w-[1180px] md:px-3">
        <button
          type="button"
          onClick={handlePrevStep}
          disabled={!canGoPrev}
          className={`group col-start-1 row-start-1 inline-flex min-h-[48px] w-full items-center justify-center gap-2 justify-self-start whitespace-nowrap rounded-xl border px-3 py-2.5 text-caption transition-all sm:min-h-[44px] sm:w-auto sm:px-4 md:px-5 ${FOCUS_RING_CLASS} ${
            canGoPrev
              ? "border-[var(--color-border-default)] bg-surface-card text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]"
              : "pointer-events-none border-transparent bg-transparent opacity-0"
          }`}
        >
          <BackChevronIcon size="sm" />
          <span>{t("assessment.prevCta", locale)}</span>
        </button>

        <label className="col-span-2 row-start-2 flex min-h-[36px] min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded-lg focus-within:outline-none focus-within:ring-2 focus-within:ring-state-focus-ring focus-within:ring-offset-2 focus-within:ring-offset-surface-canvas sm:col-span-1 sm:col-start-2 sm:row-start-1 sm:min-h-[44px]">
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
          <span className="whitespace-nowrap text-note text-[var(--color-text-muted)]">
            {t("assessment.autoAdvance", locale)}
          </span>
        </label>

        {phase === "confidence" ? (
          <button
            type="button"
            onClick={handleFinish}
            disabled={isSubmitting}
            className={`col-start-2 row-start-1 inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 justify-self-end whitespace-nowrap rounded-xl px-3 py-2.5 text-caption font-semibold transition-all sm:col-start-3 sm:min-h-[44px] sm:w-auto sm:px-4 md:px-6 ${FOCUS_RING_CLASS} ${
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
            className={`col-start-2 row-start-1 inline-flex min-h-[48px] w-full items-center justify-center gap-1.5 justify-self-end whitespace-nowrap rounded-xl px-3 py-2.5 text-caption font-semibold transition-all sm:col-start-3 sm:min-h-[44px] sm:w-auto sm:px-4 md:px-6 ${FOCUS_RING_CLASS} ${
              canProceed && !isSubmitting
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-sm shadow-[var(--color-action-primary-bg)]/15 hover:brightness-[1.06]"
                : "bg-[var(--color-action-primary-bg)]/30 text-white/50"
            }`}
          >
            {t("assessment.nextCta", locale)}
            <ChevronRightIcon />
          </button>
        )}
      </div>
    </div>
  );
}
