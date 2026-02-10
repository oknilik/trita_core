"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ProgressBar } from "@/components/assessment/ProgressBar";
import { QuestionCard } from "@/components/assessment/QuestionCard";
import { useToast } from "@/components/ui/Toast";
import { useUser } from "@clerk/nextjs";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import type { Question } from "@/lib/questions";
import { isMBTIQuestion, isLikertQuestion } from "@/lib/questions";

interface ObserverClientProps {
  token: string;
  inviterName: string;
  testName: string;
  format: "likert" | "binary";
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

export function ObserverClient({
  token,
  inviterName,
  testName,
  format,
  questions,
}: ObserverClientProps) {
  const { isSignedIn } = useUser();
  const { locale } = useLocale();
  const { showToast } = useToast();

  // Phase: "intro" -> "assessment" -> "confidence" -> "done" | "inactive"
  const [phase, setPhase] = useState<
    "intro" | "assessment" | "confidence" | "done" | "inactive"
  >("intro");
  const [relationshipType, setRelationshipType] = useState("");
  const [knownDuration, setKnownDuration] = useState("");
  const [confidence, setConfidence] = useState<number | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number | string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const question = questions[currentQuestion];
  const totalQuestions = questions.length;
  const isLastQuestion = currentQuestion === totalQuestions - 1;

  const handleAnswer = (value: number | string) => {
    setAnswers((prev) => ({ ...prev, [question.id]: value }));
  };

  const handleNext = () => {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
    }
  };

  const handleGoToConfidence = () => {
    setPhase("confidence");
  };

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
        throw new Error(message !== `error.${code}` ? message : t("observer.genericError", locale));
      }
      setPhase("done");
    } catch (error) {
      console.error(error);
      showToast(
        error instanceof Error ? error.message : t("observer.saveError", locale),
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const canGoNext = answers[question?.id] !== undefined;

  const helpText =
    format === "likert"
      ? tf("observer.helpLikertAbout", locale, { inviter: inviterName })
      : tf("observer.helpBinaryAbout", locale, { inviter: inviterName });

  // ===== INTRO PHASE =====
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

  // ===== INACTIVE PHASE =====
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

  // ===== DONE PHASE =====
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
                  className="mt-4 inline-block min-h-[44px] rounded-lg bg-indigo-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700"
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

  // ===== CONFIDENCE PHASE =====
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
                {t("observer.prev", locale)}
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

  // ===== ASSESSMENT PHASE =====
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <div className="mx-auto max-w-3xl px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8">
          <ProgressBar current={currentQuestion + 1} total={totalQuestions} />
        </div>

        <div className="mb-4 rounded-lg border border-indigo-100 bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-700">
          {tf("observer.thinkOf", locale, { inviter: inviterName })}
        </div>

        {/* Question card */}
        <div className="mb-8">
          <AnimatePresence mode="wait">
            {isLikertQuestion(question) ? (
              <QuestionCard
                key={question.id}
                testName={testName}
                dimension={question.dimension}
                format="likert"
                question={question.textObserver ?? question.text}
                value={(answers[question.id] as number) ?? null}
                onChange={(v) => handleAnswer(v)}
              />
            ) : isMBTIQuestion(question) ? (
              <QuestionCard
                key={question.id}
                testName={testName}
                dimension={question.dichotomy}
                format="binary"
                optionA={question.optionAObserver ?? question.optionA.text}
                optionB={question.optionBObserver ?? question.optionB.text}
                value={(answers[question.id] as string) ?? null}
                onChange={(v) => handleAnswer(v)}
              />
            ) : null}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between gap-4">
          <motion.button
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
              currentQuestion === 0
                ? "cursor-not-allowed bg-gray-200 text-gray-400"
                : "bg-white text-gray-700 shadow-md hover:shadow-lg"
            }`}
            whileHover={currentQuestion > 0 ? { scale: 1.02 } : {}}
            whileTap={currentQuestion > 0 ? { scale: 0.98 } : {}}
          >
            {t("observer.prev", locale)}
          </motion.button>

          <div className="text-sm text-gray-600 md:hidden">
            {currentQuestion + 1} / {totalQuestions}
          </div>

          {!isLastQuestion ? (
            <motion.button
              onClick={handleNext}
              disabled={!canGoNext || isSubmitting}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                canGoNext && !isSubmitting
                  ? "bg-indigo-600 text-white shadow-md hover:bg-indigo-700 hover:shadow-lg"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
              whileHover={canGoNext && !isSubmitting ? { scale: 1.02 } : {}}
              whileTap={canGoNext && !isSubmitting ? { scale: 0.98 } : {}}
            >
              {t("observer.next", locale)}
            </motion.button>
          ) : (
            <motion.button
              onClick={handleGoToConfidence}
              disabled={!canGoNext}
              className={`min-h-[48px] rounded-lg px-6 font-semibold transition-all ${
                canGoNext
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg"
                  : "cursor-not-allowed bg-gray-200 text-gray-400"
              }`}
              whileHover={canGoNext ? { scale: 1.02 } : {}}
              whileTap={canGoNext ? { scale: 0.98 } : {}}
            >
              {t("observer.next", locale)}
            </motion.button>
          )}
        </div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-center text-sm text-gray-500"
        >
          {helpText}
        </motion.p>
      </div>
    </div>
  );
}
