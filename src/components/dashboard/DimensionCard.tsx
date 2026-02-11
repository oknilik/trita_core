"use client";

import { useState, useEffect, useCallback } from "react";
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
}

function getLevel(score: number): "low" | "mid" | "high" {
  return score < 40 ? "low" : score < 70 ? "mid" : "high";
}

export function DimensionCard({
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
  delay = 0,
}: DimensionCardProps) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const level = getLevel(score);

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

      {/* Detail overlay */}
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

              <div className="p-6 md:p-8">
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
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
