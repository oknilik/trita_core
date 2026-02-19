"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const [relationshipType, setRelationshipType] = useState(initialDraft?.relationshipType ?? "");
  const [knownDuration, setKnownDuration] = useState(initialDraft?.knownDuration ?? "");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [answers, setAnswers] = useState<Record<number, number>>(sanitizedInitialAnswers);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null);
  const [highlightConfidence, setHighlightConfidence] = useState(false);
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const [doodleSrc, setDoodleSrc] = useState<string>(DOODLE_SOURCES[0]);
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

  const DRAFT_KEY = `trita_observer_draft_${token}`;

  useEffect(() => {
    latestDraftRef.current = { phase, relationshipType, knownDuration, answers, currentPage };
  }, [phase, relationshipType, knownDuration, answers, currentPage]);

  useEffect(() => { setDoodleSrc(pickRandomDoodle()); }, []);

  useEffect(() => {
    if (initialDraft) {
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
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [canGoNext, pageQuestions, answers, highlightMissing, isLastPage]);

  const handlePreviousPage = useCallback(() => {
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
          window.scrollTo({ top: 0, behavior: "smooth" });
        }
        return;
      }

      if (isLastPage) {
        handleGoToConfidence();
        return;
      }
      setCurrentPage((prev) => prev + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
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
      setDoodleSrc((prev) => pickRandomDoodle(prev));
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
  const thinkOfText = tf("observer.thinkOf", locale, { inviter: inviterName });
  const thinkOfParts = thinkOfText.split(inviterName);

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
              {tf("observer.introBody", locale, { inviter: inviterName, testName })}
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

        <div className="mb-4 rounded-xl border border-indigo-300/70 bg-gradient-to-r from-indigo-500 via-violet-500 to-fuchsia-500 px-4 py-2 text-center text-sm font-medium text-white shadow-sm">
          {thinkOfParts.length > 1 ? (
            thinkOfParts.map((part, index) => (
              <span key={`thinkof-${index}`}>
                {part}
                {index < thinkOfParts.length - 1 ? <strong className="font-bold italic">{inviterName}</strong> : null}
              </span>
            ))
          ) : (
            thinkOfText
          )}
        </div>

        {phase === "assessment" && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs text-gray-600">
              <input
                type="checkbox"
                checked={autoAdvance}
                onChange={(event) => setAutoAdvance(event.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-indigo-600"
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
                  : `observer-${currentPage}-${activeQuestion?.id ?? "none"}`
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
                  highlight={highlightConfidence}
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
            ) : activeQuestion && isLikertQuestion(activeQuestion) ? (
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
            ) : (
              <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center text-sm text-gray-500">
                {t("assessment.loadingQuestions", locale)}
              </div>
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
                !isSubmitting && confidence !== null
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
                  : "bg-gray-200 text-gray-400"
              }`}
              whileHover={!isSubmitting && confidence !== null ? { scale: 1.02 } : {}}
              whileTap={!isSubmitting ? { scale: 0.98 } : {}}
            >
              {isSubmitting ? t("observer.submitLoading", locale) : t("observer.submit", locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleNextStep}
              disabled={isSubmitting}
              aria-disabled={!canProceed || isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                canProceed && !isSubmitting
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
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
