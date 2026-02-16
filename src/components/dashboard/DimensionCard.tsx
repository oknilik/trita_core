"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBar } from "@/components/dashboard/AnimatedBar";
import { useLocale } from "@/components/LocaleProvider";
import { t, type Locale } from "@/lib/i18n";

type InsightLevels = { low: string; mid: string; high: string };

interface DimensionCardProps {
  code: string;
  label: string;
  labelByLocale?: Partial<Record<Locale, string>>;
  color: string;
  score: number;
  insight: string;
  description: string;
  descriptionByLocale?: Partial<Record<Locale, string>>;
  insights: InsightLevels;
  insightsByLocale?: Partial<Record<Locale, InsightLevels>>;
  facets?: Array<{ code: string; label: string; score: number }>;
  aspects?: Array<{ code: string; label: string; score: number }>;
  delay?: number;
  assessmentResultId: string;
  existingFeedback?: {
    accuracyRating: number;
    comment: string | null;
  } | null;
}

function getLevel(score: number): "low" | "mid" | "high" {
  return score < 40 ? "low" : score < 70 ? "mid" : "high";
}

export const DimensionCard = memo(function DimensionCard({
  code,
  label,
  labelByLocale,
  color,
  score,
  insight,
  description,
  descriptionByLocale,
  insights,
  insightsByLocale,
  facets,
  aspects,
  delay = 0,
  assessmentResultId,
  existingFeedback,
}: DimensionCardProps) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const level = getLevel(score);

  // Feedback state
  const [feedbackRating, setFeedbackRating] = useState<number | null>(
    existingFeedback?.accuracyRating ?? null
  );
  const [feedbackComment, setFeedbackComment] = useState(
    existingFeedback?.comment ?? ""
  );
  const [isCommentExpanded, setIsCommentExpanded] = useState(false);
  const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(!!existingFeedback);

  const subScales = facets || aspects;
  const hasSubScales = subScales && subScales.length > 0;
  const subScaleType = facets ? "facets" : "aspects";

  const resolvedLabel = labelByLocale?.[locale] ?? label;
  const resolvedDescription = descriptionByLocale?.[locale] ?? description;
  const resolvedInsights = insightsByLocale?.[locale] ?? insights;
  const resolvedInsight = resolvedInsights[level];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    },
    []
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleKeyDown]);

  const levels: { key: "low" | "mid" | "high"; labelKey: string }[] = [
    { key: "low", labelKey: "dashboard.dimensionLow" },
    { key: "mid", labelKey: "dashboard.dimensionMid" },
    { key: "high", labelKey: "dashboard.dimensionHigh" },
  ];

  // Emoji scale for feedback
  const emojiScale = [
    { value: 1, emoji: "😕", label: t("dashboard.dimension.feedbackVeryInaccurate", locale) },
    { value: 2, emoji: "😐", label: t("dashboard.dimension.feedbackSomewhatInaccurate", locale) },
    { value: 3, emoji: "🙂", label: t("dashboard.dimension.feedbackNeutral", locale) },
    { value: 4, emoji: "😊", label: t("dashboard.dimension.feedbackAccurate", locale) },
    { value: 5, emoji: "🤩", label: t("dashboard.dimension.feedbackVeryAccurate", locale) },
  ];

  // Submit feedback handler
  const handleSubmitFeedback = async () => {
    if (feedbackRating === null || isSubmittingFeedback) return;
    setIsSubmittingFeedback(true);

    try {
      const res = await fetch("/api/feedback/dimension", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          assessmentResultId,
          dimensionCode: code,
          accuracyRating: feedbackRating,
          comment: feedbackComment.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "SUBMIT_FAILED");
      }

      setFeedbackSubmitted(true);
    } catch (error) {
      console.error("Feedback submission failed:", error);
      alert(t("dashboard.dimension.feedbackError", locale));
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      {/* Card front */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group w-full cursor-pointer rounded-xl border border-gray-100 bg-white p-4 text-left transition hover:shadow-md"
        style={{ borderLeftWidth: "4px", borderLeftColor: color }}
      >
        <div className="flex items-center gap-3">
          <span
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white"
            style={{ backgroundColor: color }}
          >
            {code}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-sm font-semibold text-gray-900">
                {resolvedLabel}
              </p>
              <p
                className="shrink-0 text-lg font-bold"
                style={{ color }}
              >
                {score}%
              </p>
            </div>
            <div className="mt-2">
              <AnimatedBar value={score} color={color} delay={delay} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">{resolvedInsight}</p>
        <p className="mt-2 text-xs text-gray-400 transition group-hover:text-gray-500">
          {t("dashboard.dimensionHint", locale)}
        </p>
      </button>

      {/* Detail overlay - Portal to body for proper full-screen backdrop */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
            >
              {/* Backdrop */}
              <div
                onClick={() => setIsOpen(false)}
                className="absolute inset-0 bg-black/40"
              />

            {/* Content */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 400, damping: 35 }}
              className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white md:max-h-[85vh] md:max-w-lg md:rounded-xl md:border md:border-gray-100 md:shadow-xl"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-5 w-5"
                >
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>

              <div className="p-6 pb-12 md:p-8 md:pb-16">
                {/* Header */}
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {code}
                  </span>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {resolvedLabel}
                    </h2>
                    <p className="text-2xl font-bold" style={{ color }}>
                      {score}%
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <AnimatedBar value={score} color={color} height="h-3" />
                </div>

                {/* Description */}
                <div className="mt-6">
                  <h3 className="text-sm font-semibold text-gray-900">
                    {t("dashboard.dimensionWhat", locale)}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">
                    {resolvedDescription}
                  </p>
                </div>

                <div className="my-6 h-px bg-gray-100" />

                {/* All insight levels */}
                <h3 className="text-sm font-semibold text-gray-900">
                  {t("dashboard.dimensionInterpretation", locale)}
                </h3>
                <div className="mt-4 flex flex-col gap-3">
                  {levels.map((l) => {
                    const isActive = l.key === level;
                    return (
                      <div
                        key={l.key}
                        className={`rounded-lg border p-3 transition ${
                          isActive
                            ? "border-l-4 bg-gray-50"
                            : "border-gray-100 opacity-50"
                        }`}
                        style={
                          isActive
                            ? { borderLeftColor: color }
                            : undefined
                        }
                      >
                        <p
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            isActive ? "text-gray-900" : "text-gray-400"
                          }`}
                          style={isActive ? { color } : undefined}
                        >
                          {t(l.labelKey, locale)}
                        </p>
                        <p
                          className={`mt-1 text-sm ${
                            isActive
                              ? "font-medium text-gray-700"
                              : "text-gray-500"
                          }`}
                        >
                          {resolvedInsights[l.key]}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Facets / Aspects section */}
                {hasSubScales && (
                  <>
                    <div className="my-6 h-px bg-gray-100" />

                    <h3 className="text-sm font-semibold text-gray-900">
                      {t(subScaleType === "facets" ? "dashboard.facetsTitle" : "dashboard.aspectsTitle", locale)}
                    </h3>
                    <div className="mt-4 flex flex-col gap-3">
                      {subScales.map((sub) => (
                        <div key={sub.code} className="flex items-center gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="mb-1 flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-medium text-gray-700">
                                {sub.label}
                              </p>
                              <p className="shrink-0 text-xs font-semibold text-gray-500">
                                {sub.score}%
                              </p>
                            </div>
                            <AnimatedBar value={sub.score} color={color} height="h-2" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* Dimension Feedback Section */}
                <div className="my-6 h-px bg-gray-100" />

                {feedbackSubmitted ? (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-6 text-center">
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-2xl">🙏</span>
                      <span className="text-sm text-gray-600">
                        {t("dashboard.dimension.feedbackThankYou", locale)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg border border-indigo-100 bg-indigo-50/30 p-4">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {t("dashboard.dimension.feedbackTitle", locale)}
                    </h3>
                    <p className="mt-1 text-xs text-gray-600">
                      {t("dashboard.dimension.feedbackPrompt", locale)}
                    </p>

                    {/* Emoji rating buttons */}
                    <div className="mt-4 grid grid-cols-5 gap-2">
                      {emojiScale.map((item) => (
                        <button
                          key={item.value}
                          type="button"
                          onClick={() => setFeedbackRating(item.value)}
                          aria-label={item.label}
                          className={`flex min-h-[44px] items-center justify-center rounded-lg border text-2xl transition ${
                            feedbackRating === item.value
                              ? "border-2 border-indigo-600 bg-indigo-50"
                              : "border-gray-200 hover:border-indigo-300"
                          }`}
                        >
                          {item.emoji}
                        </button>
                      ))}
                    </div>

                    {/* Collapsible comment field */}
                    <div className="mt-3">
                      <button
                        type="button"
                        onClick={() => setIsCommentExpanded(!isCommentExpanded)}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        {isCommentExpanded
                          ? t("dashboard.dimension.feedbackHideComment", locale)
                          : t("dashboard.dimension.feedbackAddComment", locale)
                        }
                      </button>

                      {isCommentExpanded && (
                        <textarea
                          value={feedbackComment}
                          onChange={(e) => setFeedbackComment(e.target.value)}
                          rows={3}
                          maxLength={2000}
                          placeholder={t("dashboard.dimension.feedbackCommentPlaceholder", locale)}
                          className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none"
                        />
                      )}
                    </div>

                    {/* Submit button */}
                    <button
                      type="button"
                      onClick={handleSubmitFeedback}
                      disabled={feedbackRating === null || isSubmittingFeedback}
                      className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-indigo-600 px-5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400"
                    >
                      {isSubmittingFeedback
                        ? t("dashboard.dimension.feedbackSubmitting", locale)
                        : t("dashboard.dimension.feedbackSubmit", locale)
                      }
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body
    )}
    </>
  );
});
