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

interface ObserverClientProps {
  token: string;
  inviterName: string;
  testName: string;
  questions: Question[];
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
const DOODLE_SOURCES = [
  "/doodles/chilling.svg",
  "/doodles/coffee.svg",
  "/doodles/float.svg",
  "/doodles/groovy.svg",
  "/doodles/jumping.svg",
  "/doodles/laying.svg",
  "/doodles/loving.svg",
  "/doodles/meditating.svg",
  "/doodles/plant.svg",
  "/doodles/reading-side.svg",
  "/doodles/roller-skating.svg",
  "/doodles/running.svg",
  "/doodles/selfie.svg",
  "/doodles/sitting-reading.svg",
  "/doodles/sleek.svg",
  "/doodles/strolling.svg",
  "/doodles/swinging.svg",
  "/doodles/unboxing.svg",
] as const;

function pickRandomDoodle(current?: string) {
  const pool = current
    ? DOODLE_SOURCES.filter((src) => src !== current)
    : DOODLE_SOURCES;
  return pool[Math.floor(Math.random() * pool.length)] ?? DOODLE_SOURCES[0];
}

export function ObserverClient({
  token,
  inviterName,
  testName,
  questions,
}: ObserverClientProps) {
  const { isSignedIn } = useUser();
  const { locale } = useLocale();
  const { showToast } = useToast();

  const [phase, setPhase] = useState<
    "intro" | "assessment" | "confidence" | "done" | "inactive"
  >("intro");
  const [relationshipType, setRelationshipType] = useState("");
  const [knownDuration, setKnownDuration] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [focusMode, setFocusMode] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [highlightQuestionId, setHighlightQuestionId] = useState<number | null>(null);
  const [checkpoint, setCheckpoint] = useState<number | null>(null);
  const [doodleSrc, setDoodleSrc] = useState<string>(() => pickRandomDoodle());
  const reachedCheckpoints = useRef<Set<number>>(new Set());
  const initializedFocusPage = useRef<number | null>(null);

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
  const canGoPrev = focusMode ? canGoBackWithinPage || currentPage > 0 : currentPage > 0;
  const canGoNext = pageQuestions.every((q) => answers[q.id] !== undefined);
  const currentQuestionAnswered =
    !focusMode || !activeQuestion ? true : answers[activeQuestion.id] !== undefined;
  const checkpointActive = checkpoint !== null;
  const canProceed = checkpointActive || (focusMode ? currentQuestionAnswered : canGoNext);

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
    setActiveQuestionIndex(firstUnanswered === -1 ? 0 : firstUnanswered);
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

  const handleAnswer = useCallback((questionId: number, value: number) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    if (
      focusMode &&
      autoAdvance &&
      activeQuestion &&
      activeQuestion.id === questionId &&
      canGoForwardWithinPage
    ) {
      window.setTimeout(() => {
        setActiveQuestionIndex((idx) => Math.min(idx + 1, pageQuestions.length - 1));
      }, 130);
    }
  }, [focusMode, autoAdvance, activeQuestion, canGoForwardWithinPage, pageQuestions.length]);

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
    if (!canGoNext) {
      const missing = pageQuestions.find((q) => answers[q.id] === undefined);
      if (missing) highlightMissing(missing.id);
      return;
    }
    setPhase("confidence");
  }, [canGoNext, pageQuestions, answers, highlightMissing]);

  const handlePrevStep = useCallback(() => {
    if (checkpointActive) {
      setCheckpoint(null);
      return;
    }
    if (focusMode && canGoBackWithinPage) {
      setActiveQuestionIndex((idx) => idx - 1);
      return;
    }
    handlePreviousPage();
  }, [checkpointActive, focusMode, canGoBackWithinPage, handlePreviousPage]);

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
      setActiveQuestionIndex((idx) => idx + 1);
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

            <button
              type="button"
              onClick={() => setPhase("assessment")}
              disabled={!canStart}
              className={`mt-8 min-h-[48px] w-full rounded-lg px-6 text-sm font-semibold transition ${
                canStart
                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
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
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="rounded-2xl border border-gray-100 bg-white p-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("observer.inactiveTitle", locale)}
            </h1>
            <p className="mt-3 text-sm text-gray-600">
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
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-16 text-center">
          <div className="rounded-2xl border border-gray-100 bg-white p-8">
            <h1 className="text-2xl font-bold text-gray-900">
              {t("observer.doneTitle", locale)}
            </h1>
            <p className="mt-3 text-sm text-gray-600">
              {t("observer.doneBody", locale)}
            </p>
            {isSignedIn ? (
              <>
                <p className="mt-4 text-sm text-gray-500">
                  {t("observer.doneSignedInHint", locale)}
                </p>
                <a
                  href="/dashboard"
                  className="mt-4 inline-block min-h-[48px] rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105"
                >
                  {t("observer.goDashboard", locale)}
                </a>
              </>
            ) : (
              <>
                <p className="mt-4 text-sm text-gray-500">
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

  if (phase === "confidence") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="mx-auto max-w-2xl px-4 py-8 md:py-12">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8">
            <h2 className="text-xl font-bold text-gray-900">
              {t("observer.confidenceLabel", locale)}
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              {t("observer.confidenceHint", locale)}
            </p>

            <div className="mt-6 flex justify-center gap-3">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setConfidence(v)}
                  className={`flex h-12 w-12 items-center justify-center rounded-lg border text-lg font-semibold transition ${
                    confidence === v
                      ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>

            <div className="mt-8 flex items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setPhase("assessment")}
                className="min-h-[48px] rounded-lg bg-white px-6 font-semibold text-gray-700 shadow-md transition-all hover:shadow-lg"
              >
                {t("assessment.prevCta", locale)}
              </button>

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
            </div>
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
          <div className="mt-2 overflow-x-auto">
            <div className="flex min-w-max items-center gap-2 text-xs text-gray-600">
              <p className="whitespace-nowrap rounded-md bg-gray-50 px-2 py-1">
                {t("assessment.pageProgress", locale)
                  .replace("{current}", String(currentPage + 1))
                  .replace("{total}", String(totalPages))}
              </p>
              <div className="whitespace-nowrap rounded-md bg-gray-50 px-2 py-1">
                {tf("assessment.etaRemaining", locale, { minutes: etaMinutes })}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-6 hidden rounded-2xl border border-gray-100 bg-white p-4 sm:block">
          <div className="h-36 w-full">
            <AssessmentDoodle src={doodleSrc} />
          </div>
        </div>

        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-700">
          {tf("observer.thinkOf", locale, { inviter: inviterName })}
        </div>

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
          <span className="text-xs text-gray-500">{t("assessment.keyboardHint", locale)}</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={
              checkpointActive
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
            {checkpointActive ? (
              <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center md:min-h-[19rem] md:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-600">
                  {t("assessment.journeyMilestone", locale)}
                </p>
                <p className="mt-3 text-xl font-bold text-emerald-800 md:text-2xl">
                  {tf("assessment.checkpointReached", locale, { percent: checkpoint ?? 0 })}
                </p>
                <p className="mt-3 text-sm text-emerald-700">
                  {t("assessment.journeyMilestoneHint", locale)}
                </p>
              </div>
            ) : focusMode ? (
              activeQuestion && isLikertQuestion(activeQuestion) ? (
                <>
                  <p className="text-center text-xs font-medium text-gray-500">
                    {tf("assessment.pageQuestionCounter", locale, {
                      current: activeQuestionIndex + 1,
                      total: pageQuestions.length,
                    })}
                  </p>
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
