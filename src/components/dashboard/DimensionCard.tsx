"use client";

import { useState, useEffect, useCallback, memo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBar } from "@/components/dashboard/AnimatedBar";
import { useLocale } from "@/components/LocaleProvider";
import { useToast } from "@/components/ui/Toast";
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
  return score < 33 ? "low" : score < 67 ? "mid" : "high";
}

export const DimensionCard = memo(function DimensionCard({
  code,
  label,
  labelByLocale,
  color,
  score,
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
  const { showToast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
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
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const presetTags: Record<string, string[]> = {
    hu: ["Nagyon találó", "Túl általános", "Nem illik rám", "Felismerem magam benne", "Meglepett", "Részben igaz"],
    en: ["Very accurate", "Too generic", "Doesn't fit me", "I recognize myself", "Surprised me", "Partially true"],
    de: ["Sehr treffend", "Zu allgemein", "Passt nicht zu mir", "Ich erkenne mich", "Hat mich überrascht", "Teilweise zutreffend"],
  };
  const tags = presetTags[locale] ?? presetTags.en;

  const toggleTag = (tag: string) =>
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );

  const subScales = facets || aspects;
  const hasSubScales = subScales && subScales.length > 0;
  const subScaleType = facets ? "facets" : "aspects";

  const resolvedLabel = labelByLocale?.[locale] ?? label;
  const resolvedDescription = descriptionByLocale?.[locale] ?? description;
  const resolvedInsights = insightsByLocale?.[locale] ?? insights;
  const resolvedInsight = resolvedInsights[level];

  // Close handler — shows feedback gate if feedback not yet submitted
  const handleClose = useCallback(() => {
    if (feedbackSubmitted) {
      setIsOpen(false);
      setShowFeedback(false);
    } else {
      setShowFeedback(true);
    }
  }, [feedbackSubmitted]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    },
    [handleClose]
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

  const emojiScale = [
    { value: 1, emoji: "😕", label: t("dashboard.dimension.feedbackVeryInaccurate", locale) },
    { value: 2, emoji: "😐", label: t("dashboard.dimension.feedbackSomewhatInaccurate", locale) },
    { value: 3, emoji: "🙂", label: t("dashboard.dimension.feedbackNeutral", locale) },
    { value: 4, emoji: "😊", label: t("dashboard.dimension.feedbackAccurate", locale) },
    { value: 5, emoji: "🤩", label: t("dashboard.dimension.feedbackVeryAccurate", locale) },
  ];

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
          comment: [selectedTags.join(" · "), feedbackComment.trim()].filter(Boolean).join("\n\n") || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "SUBMIT_FAILED");
      }

      setFeedbackSubmitted(true);
      // Brief thank-you flash before closing
      setTimeout(() => {
        setIsOpen(false);
        setShowFeedback(false);
      }, 700);
    } catch (error) {
      console.error("Feedback submission failed:", error);
      showToast(t("dashboard.dimension.feedbackError", locale), "error");
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <>
      {/* Card front */}
      <button
        type="button"
        onClick={() => { setShowFeedback(false); setIsOpen(true); }}
        className="ambient-glow group w-full cursor-pointer rounded-2xl border border-gray-100/50 bg-gradient-to-br from-white to-gray-50/30 p-6 text-left shadow-sm transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/40 focus-visible:ring-offset-2"
        style={{ borderLeftWidth: "4px", borderLeftColor: color }}
        aria-label={`${t("dashboard.openDetails", locale)}: ${resolvedLabel}`}
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
              <div className="flex shrink-0 items-center gap-2">
                <p className="text-lg font-bold" style={{ color }}>
                  {score}%
                </p>
                <svg
                  viewBox="0 0 16 16"
                  className="h-4 w-4 text-gray-300 transition-all duration-300 group-hover:translate-x-0.5 group-hover:text-indigo-500"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M6 3l5 5-5 5" />
                </svg>
              </div>
            </div>
            <div className="mt-2">
              <AnimatedBar value={score} color={color} delay={delay} />
            </div>
          </div>
        </div>
        <p className="mt-3 text-sm text-gray-600">{resolvedInsight}</p>
        <div className="mt-3 flex items-center justify-end">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600 transition group-hover:bg-indigo-50 group-hover:text-indigo-700">
            {t("dashboard.openDetails", locale)}
            <svg
              viewBox="0 0 16 16"
              className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-0.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M6 3l5 5-5 5" />
            </svg>
          </span>
        </div>
      </button>

      {/* Detail overlay - Portal to body for proper full-screen backdrop */}
      {mounted && createPortal(
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
            >
              {/* Backdrop */}
              <div
                onClick={handleClose}
                className="absolute inset-0 bg-black/40 glass-effect"
              />

              {/* Content panel */}
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 40, mass: 0.8 }}
                className="relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-2xl bg-white/95 glass-effect md:max-h-[85vh] md:max-w-lg md:rounded-2xl md:border md:border-gray-100/50 md:shadow-2xl"
              >
                {/* Drag handle (mobile only) */}
                <div className="pointer-events-none absolute inset-x-0 top-0 flex justify-center pt-3 md:hidden">
                  <div className="h-1 w-10 rounded-full bg-gray-300" />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                  {!showFeedback ? (
                    // ── Details view ──
                    <motion.div
                      key="details"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.18 }}
                    >
                      {/* Close button */}
                      <button
                        type="button"
                        onClick={handleClose}
                        className="absolute right-4 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition-all duration-300 hover:bg-gray-100 hover:text-gray-600 hover:scale-110 hover:rotate-90"
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

                      <div className="px-6 pb-12 pt-8 md:px-8 md:pb-16 md:pt-8">
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
                                style={isActive ? { borderLeftColor: color } : undefined}
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
                                    isActive ? "font-medium text-gray-700" : "text-gray-500"
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
                              {t(
                                subScaleType === "facets"
                                  ? "dashboard.facetsTitle"
                                  : "dashboard.aspectsTitle",
                                locale
                              )}
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
                      </div>
                    </motion.div>
                  ) : (
                    // ── Feedback gate view ──
                    <motion.div
                      key="feedback"
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 24 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 pb-10 md:p-8 md:pb-12"
                    >
                      {/* Header — hidden in thank-you state */}
                      {!feedbackSubmitted && (
                        <>
                          <div className="mb-4">
                            <button
                              type="button"
                              onClick={() => setShowFeedback(false)}
                              className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 hover:brightness-95 active:brightness-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                              style={
                                {
                                  backgroundColor: color,
                                  // Tailwind ring uses --tw-ring-color; set it dynamically to match the dimension.
                                  "--tw-ring-color": `${color}66`,
                                } as React.CSSProperties & Record<string, string>
                              }
                            >
                              {t("dashboard.dimension.feedbackBackToDetails", locale)}
                            </button>
                          </div>

                          <div className="mb-6 flex items-center gap-3">
                            <span
                              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white"
                              style={{ backgroundColor: color }}
                            >
                              {code}
                            </span>
                            <div>
                              <p className="text-xs text-gray-400">{resolvedLabel}</p>
                              <h2 className="text-base font-bold text-gray-900">
                                {t("dashboard.dimension.feedbackTitle", locale)}
                              </h2>
                            </div>
                          </div>
                        </>
                      )}

                      {feedbackSubmitted ? (
                        // Thank-you state (visible for ~700 ms before close)
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <div className="text-5xl leading-none">🙏</div>
                          <p className="mt-4 text-base font-semibold text-indigo-700">
                            {t("dashboard.dimension.feedbackThankYou", locale)}
                          </p>
                          <div className="mt-5 h-2 w-64 overflow-hidden rounded-full bg-gray-100">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: "100%" }}
                              transition={{ duration: 0.7, ease: "linear" }}
                              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <p className="mb-4 text-sm text-gray-600">
                            {t("dashboard.dimension.feedbackPrompt", locale)}
                          </p>

                          {/* Preset tags */}
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {t("dashboard.dimension.feedbackTagsLabel", locale)}
                          </p>
                          <div className="mb-5 flex flex-wrap gap-2">
                            {tags.map((tag) => (
                              <button
                                key={tag}
                                type="button"
                                onClick={() => toggleTag(tag)}
                                className={`min-h-[36px] rounded-full border px-4 py-1.5 text-sm font-medium transition ${
                                  selectedTags.includes(tag)
                                    ? "border-transparent bg-gradient-to-r from-indigo-600 to-purple-600 text-white"
                                    : "border-gray-200 bg-white text-gray-600 hover:border-indigo-300 hover:text-indigo-600"
                                }`}
                              >
                                {tag}
                              </button>
                            ))}
                          </div>

                          {/* Emoji rating */}
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                            {t("dashboard.dimension.feedbackRatingLabel", locale)}
                          </p>
                          <div className="grid grid-cols-5 gap-2">
                            {emojiScale.map((item) => (
                              <button
                                key={item.value}
                                type="button"
                                onClick={() => setFeedbackRating(item.value)}
                                aria-label={item.label}
                                className={`flex min-h-[44px] items-center justify-center rounded-lg border text-2xl transition ${
                                  feedbackRating === item.value
                                    ? "border-transparent bg-gradient-to-r from-indigo-600 to-purple-600"
                                    : "border-gray-200 hover:border-indigo-300"
                                }`}
                              >
                                {item.emoji}
                              </button>
                            ))}
                          </div>

                          {/* Collapsible comment */}
                          <div className="mt-4">
                            <button
                              type="button"
                              onClick={() => setIsCommentExpanded(!isCommentExpanded)}
                              className="text-sm text-indigo-600 hover:text-indigo-700"
                            >
                              {isCommentExpanded
                                ? t("dashboard.dimension.feedbackHideComment", locale)
                                : t("dashboard.dimension.feedbackAddComment", locale)}
                            </button>
                            {isCommentExpanded && (
                              <textarea
                                value={feedbackComment}
                                onChange={(e) => setFeedbackComment(e.target.value)}
                                rows={3}
                                maxLength={2000}
                                placeholder={t(
                                  "dashboard.dimension.feedbackCommentPlaceholder",
                                  locale
                                )}
                                className="mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none"
                              />
                            )}
                          </div>

                          {/* Submit */}
                          <button
                            type="button"
                            onClick={handleSubmitFeedback}
                            disabled={feedbackRating === null || selectedTags.length === 0 || isSubmittingFeedback}
                            className="mt-5 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-6 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200 disabled:hover:scale-100"
                          >
                            {isSubmittingFeedback
                              ? t("dashboard.dimension.feedbackSubmitting", locale)
                              : t("dashboard.dimension.feedbackSubmit", locale)}
                          </button>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
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
