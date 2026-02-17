"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { AssessmentDoodle } from "@/components/illustrations/AssessmentDoodle";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import type { Question } from "@/lib/questions";
import { isLikertQuestion } from "@/lib/questions";
import { DOODLE_SOURCES, pickRandomDoodle } from "@/lib/doodles";

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

export function ObserverClient({
  token,
  inviterName,
  testName,
  questions,
  initialDraft,
}: ObserverClientProps) {
  const { isSignedIn } = useUser();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<
    "intro" | "assessment" | "confidence" | "done" | "inactive"
  >(initialDraft?.phase ?? "intro");
  const [relationshipType, setRelationshipType] = useState(initialDraft?.relationshipType ?? "");
  const [knownDuration, setKnownDuration] = useState(initialDraft?.knownDuration ?? "");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialDraft?.currentPage ?? 0);
  const [answers, setAnswers] = useState<Record<number, number>>(initialDraft?.answers ?? {});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null);
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const [doodleSrc, setDoodleSrc] = useState<string>(DOODLE_SOURCES[0]);
  const reachedCheckpoints = useRef<Set<number>>(new Set(
    initialDraft
      ? ([25, 50, 75] as const).filter(
          (m) => (Object.keys(initialDraft.answers).length / questions.length) * 100 >= m,
        )
      : [],
  ));
  const initializedFocusPage = useRef<number | null>(null);
  const serverSaveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestDraftRef = useRef({ phase, relationshipType, knownDuration, answers, currentPage });

  const DRAFT_KEY = `trita_observer_draft_${token}`;

  // Keep latestDraftRef in sync for use inside async callbacks
  useEffect(() => {
    latestDraftRef.current = { phase, relationshipType, knownDuration, answers, currentPage };
  }, [phase, relationshipType, knownDuration, answers, currentPage]);

  // Randomize doodle only on the client after hydration to avoid SSR mismatch
  useEffect(() => {
    setDoodleSrc(pickRandomDoodle());
  }, []);

  // On mount: if no server draft was loaded, try localStorage as fallback
  useEffect(() => {
    if (initialDraft) {
      // Server draft takes precedence; clear any stale localStorage
      try { localStorage.removeItem(DRAFT_KEY); } catch {}
      return;
    }
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const data = JSON.parse(raw);
      if (data.relationshipType) setRelationshipType(data.relationshipType);
      if (data.knownDuration) setKnownDuration(data.knownDuration);
      if (data.answers && typeof data.answers === "object") {
        setAnswers(data.answers);
        // Pre-mark passed milestones so they don't re-trigger
        const pct = (Object.keys(data.answers).length / questions.length) * 100;
        for (const m of [25, 50, 75] as const) {
          if (pct >= m) reachedCheckpoints.current.add(m);
        }
      }
      if (typeof data.currentPage === "number") setCurrentPage(data.currentPage);
      if (data.phase === "assessment" || data.phase === "confidence") setPhase(data.phase);
    } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Save draft to localStorage + debounced server save on every state change
  useEffect(() => {
    if (phase === "done" || phase === "inactive") return;
    // localStorage (immediate)
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ phase, relationshipType, knownDuration, answers, currentPage }),
      );
    } catch {}
    // Server save (debounced 2s) – only when assessment has started
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
  const canGoPrev =
    phase === "confidence" ||
    (focusMode ? canGoBackWithinPage || currentPage > 0 : currentPage > 0);
  const canGoNext = pageQuestions.every((q) => answers[q.id] !== undefined);
  const currentQuestionAnswered =
    !focusMode || !activeQuestion ? true : answers[activeQuestion.id] !== undefined;
  const checkpointActive = checkpoint !== null;
  const canProceed =
    phase === "confidence" || checkpointActive || (focusMode ? currentQuestionAnswered : canGoNext);

  const questionElementIds = useMemo(
    () => new Map(pageQuestions.map((q) => [q.id, `observer-question-${q.id}`])),
    [pageQuestions],
  );

  useEffect(() => {
    if (!focusMode) {
      initializedFocusPage.current = null;
      return;
    }
    if (initializedFocusPage.current === currentPage) return;
    const firstUnanswered = pageQuestions.findIndex((q) => answers[q.id] === undefined);
    setActiveQuestionIndex(firstUnanswered === -1 ? pageQuestions.length - 1 : firstUnanswered);
    initializedFocusPage.current = currentPage;
  }, [focusMode, currentPage, pageQuestions, answers]);

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
      if (focusMode) {
        const missingIdx = pageQuestions.findIndex((q) => q.id === missingId);
        if (missingIdx >= 0) setActiveQuestionIndex(missingIdx);
      } else {
        const elementId = questionElementIds.get(missingId);
        if (elementId) {
          const el = document.getElementById(elementId);
          el?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      setHighlightQuestionId(missingId);
      window.setTimeout(() => {
        setHighlightQuestionId((current) => (current === missingId ? null : current));
      }, 1200);
    },
    [focusMode, pageQuestions, questionElementIds],
  );

  const handleNextPage = useCallback(() => {
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined);
      if (missing) highlightMissing(missing.id);
      return;
    }
    if (!isLastPage) {
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [canGoNext, pageQuestions, answers, highlightMissing, isLastPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [currentPage]);

  // Must be defined before handleAnswer so it can be referenced in handleAnswer's dependency array
  const handleGoToConfidence = useCallback(() => {
    // Use the ref so this is safe even when called from a stale closure (e.g. auto-advance timeout)
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

    if (!focusMode || !autoAdvance || !activeQuestion || activeQuestion.id !== questionId) {
      return;
    }

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
        } else {
          setActiveQuestionIndex((idx) => Math.min(idx + 1, pageQuestions.length - 1));
        }
        return;
      }

      // Last question on page: advance to next page or confidence phase
      if (isLastPage) {
        handleGoToConfidence();
        return;
      }
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, 130);
  }, [
    focusMode,
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
    if (focusMode && canGoBackWithinPage) {
      setActiveQuestionIndex((idx) => idx - 1);
      return;
    }
    handlePreviousPage();
  }, [phase, checkpointActive, focusMode, canGoBackWithinPage, handlePreviousPage]);

  const handleNextStep = useCallback(() => {
    if (checkpointActive) {
      setDoodleSrc((prev) => pickRandomDoodle(prev));
      setCheckpoint(null);
      return;
    }
    if (focusMode && activeQuestion && answers[activeQuestion.id] === undefined) {
      highlightMissing(activeQuestion.id);
      return;
    }
    if (focusMode && canGoForwardWithinPage) {
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
    focusMode,
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
      // Delete server draft (fire-and-forget)
      fetch("/api/observer/draft", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      }).catch(() => {});
      setPhase("done");
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error ? error.message : t("observer.saveError", locale),
        "error",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const helpText = tf("observer.helpLikertAbout", locale, { inviter: inviterName });

  if (phase === "intro") {
    const canStart = relationshipType !== "" && knownDuration !== "";

    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("observer.introTitle", locale)}
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              {tf("observer.introBody", locale, {
                inviter: inviterName,
                testName,
              })}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              {t("observer.introBody2", locale)}
            </p>

            <div className="mt-6 flex flex-col gap-4">
              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                {t("observer.relationshipLabel", locale)}
                <div className="flex flex-wrap gap-2">
                  {RELATIONSHIP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setRelationshipType(opt.value)}
                      className={`min-h-[44px] rounded-lg border px-4 text-sm font-medium transition ${
                        relationshipType === opt.value
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {t(opt.labelKey, locale)}
                    </button>
                  ))}
                </div>
              </label>

              <label className="flex flex-col gap-2 text-sm font-semibold text-gray-700">
                {t("observer.durationLabel", locale)}
                <div className="flex flex-wrap gap-2">
                  {DURATION_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setKnownDuration(opt.value)}
                      className={`min-h-[44px] rounded-lg border px-4 text-sm font-medium transition ${
                        knownDuration === opt.value
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                      }`}
                    >
                      {t(opt.labelKey, locale)}
                    </button>
                  ))}
                </div>
              </label>
            </div>

            {!canStart && (
              <p className="mt-4 text-center text-xs text-amber-600">
                {t("observer.selectBothFields", locale)}
              </p>
            )}
            <button
              type="button"
              onClick={() => setPhase("assessment")}
              disabled={!canStart}
              className={`mt-4 min-h-[48px] w-full rounded-lg px-6 text-sm font-semibold transition-all duration-300 ${
                canStart
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg hover:shadow-xl hover:scale-105"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
            >
              {tf("observer.start", locale, { count: totalQuestions })}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "inactive") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">😕</div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {t("observer.inactiveTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {t("observer.inactiveBody", locale)}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "done") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto flex min-h-dvh max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="w-full rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="text-5xl leading-none">🙏</div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900">
              {t("observer.doneTitle", locale)}
            </h1>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              {t("observer.doneBody", locale)}
            </p>
            {isSignedIn ? (
              <>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">
                  {t("observer.doneSignedInHint", locale)}
                </p>
                <a
                  href="/dashboard"
                  className="mt-4 inline-block min-h-[48px] rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:scale-105 hover:shadow-xl"
                >
                  {t("observer.goDashboard", locale)}
                </a>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">
                  {t("observer.doneSignedOutHint", locale)}
                </p>
                <a
                  href={`/sign-in?observeToken=${token}`}
                  className="mt-4 inline-block min-h-[44px] rounded-lg border border-indigo-600 bg-transparent px-6 py-3 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
                >
                  {t("observer.signInCta", locale)}
                </a>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        <div className="sticky top-2 z-20 mb-6 rounded-2xl border border-indigo-100/60 bg-white/90 px-4 py-3 shadow-sm backdrop-blur">
          <ProgressBar current={answeredCount} total={totalQuestions} />
          {phase === "assessment" && (
            <div className="mt-2 overflow-x-auto">
              <div className="flex min-w-max items-center gap-2 text-xs text-gray-600">
                <div className="whitespace-nowrap rounded-md bg-gray-50 px-2 py-1">
                  {tf("assessment.etaRemaining", locale, { minutes: etaMinutes })}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="mb-6 hidden rounded-2xl border border-gray-100 bg-white p-4 sm:block">
          <div className="h-36 w-full">
            <AssessmentDoodle src={doodleSrc} />
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-700">
          {tf("observer.thinkOf", locale, { inviter: inviterName })}
        </div>

        {phase === "assessment" && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => setFocusMode((prev) => !prev)}
              className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                focusMode
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {focusMode ? t("assessment.showAllQuestions", locale) : t("assessment.focusMode", locale)}
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(event) => setAutoAdvance(event.target.checked)}
                disabled={!focusMode}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600 disabled:opacity-40"
              />
              {t("assessment.autoAdvance", locale)}
            </label>
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div
            key={
              phase === "confidence"
                ? "observer-confidence"
                : checkpointActive
                  ? `observer-checkpoint-${checkpoint}`
                  : focusMode
                    ? `observer-${currentPage}-${activeQuestion?.id ?? "none"}`
                    : `observer-${currentPage}`
            }
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col gap-6"
          >
            {phase === "confidence" ? (
              <>
                <QuestionCard
                  testName={testName}
                  format="likert"
                  question={t("observer.confidenceLabel", locale)}
                  value={confidence}
                  onChange={(v) => setConfidence(v)}
                />
                <p className="text-center text-sm text-gray-400">
                  {t("observer.confidenceHint", locale)}
                </p>
              </>
            ) : checkpointActive ? (
              <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center md:min-h-[19rem] md:p-8">
                <div className="text-5xl leading-none">
                  {checkpoint === 25 ? '🌱' : checkpoint === 50 ? '💡' : '🏁'}
                </div>
                <p className="mt-3 text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  {t("assessment.journeyMilestone", locale)}
                </p>
                <p className="mt-2 text-xl font-bold text-emerald-800 md:text-2xl">
                  {t(
                    checkpoint === 25 ? "assessment.journeyMilestone25"
                    : checkpoint === 50 ? "assessment.journeyMilestone50"
                    : "assessment.journeyMilestone75",
                    locale
                  )}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-emerald-700">
                  {t(
                    checkpoint === 25 ? "assessment.journeyMilestone25Hint"
                    : checkpoint === 50 ? "assessment.journeyMilestone50Hint"
                    : "assessment.journeyMilestone75Hint",
                    locale
                  )}
                </p>
              </div>
            ) : focusMode ? (
              activeQuestion && isLikertQuestion(activeQuestion) ? (
                <>
                  <div key={activeQuestion.id} id={`observer-question-${activeQuestion.id}`}>
                    <QuestionCard
                      testName={testName}
                      dimension={activeQuestion.dimension}
                      format="likert"
                      question={activeQuestion.textObserver ?? activeQuestion.text}
                      value={(answers[activeQuestion.id] as number) ?? null}
                      onChange={(v) => handleAnswer(activeQuestion.id, v)}
                      highlight={highlightQuestionId === activeQuestion.id}
                    />
                  </div>
                </>
              ) : (
                <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                  {t("assessment.loadingQuestions", locale)}
                </div>
              )
            ) : (
              pageQuestions.map((question) =>
                isLikertQuestion(question) ? (
                  <div key={question.id} id={`observer-question-${question.id}`}>
                    <QuestionCard
                      testName={testName}
                      dimension={question.dimension}
                      format="likert"
                      question={question.textObserver ?? question.text}
                      value={(answers[question.id] as number) ?? null}
                      onChange={(v) => handleAnswer(question.id, v)}
                      highlight={highlightQuestionId === question.id}
                    />
                  </div>
                ) : null,
              )
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center justify-between gap-4">
          <motion.button
            onClick={handlePrevStep}
            disabled={!canGoPrev}
            className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
              !canGoPrev
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-white text-gray-700 shadow-md hover:shadow-lg"
            }`}
            whileHover={canGoPrev ? { scale: 1.02 } : {}}
            whileTap={canGoPrev ? { scale: 0.98 } : {}}
          >
            {t("assessment.prevCta", locale)}
          </motion.button>

          {phase === "confidence" ? (
            <motion.button
              onClick={handleFinish}
              disabled={isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                !isSubmitting
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
              whileHover={!isSubmitting ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? t("observer.submitLoading", locale) : t("observer.submit", locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleNextStep}
              disabled={!canProceed || isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                canProceed && !isSubmitting
                  ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
              whileHover={canProceed && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={canProceed && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {t("assessment.nextCta", locale)}
            </motion.button>
          )}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 text-center text-sm text-gray-500"
        >
          {helpText}
        </motion.p>
      </div>
    </div>
  );
}
