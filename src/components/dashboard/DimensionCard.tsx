"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AnimatedBar } from "@/components/dashboard/AnimatedBar";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface DimensionCardProps {
  code: string;
  label: string;
  color: string;
  score: number;
  insight: string;
  description: string;
  insights: { low: string; mid: string; high: string };
  delay?: number;
}

function getLevel(score: number): "low" | "mid" | "high" {
  return score < 40 ? "low" : score < 70 ? "mid" : "high";
}

export function DimensionCard({
  code,
  label,
  color,
  score,
  insight,
  description,
  insights,
  delay = 0,
}: DimensionCardProps) {
  const { locale } = useLocale();
  const [isOpen, setIsOpen] = useState(false);
  const level = getLevel(score);

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
                {label}
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
        <p className="mt-3 text-sm text-gray-600">{insight}</p>
        <p className="mt-2 text-xs text-gray-400 transition group-hover:text-gray-500">
          {t("dashboard.dimensionHint", locale)}
        </p>
      </button>

      {/* Detail overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />

            {/* Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, rotateY: 90 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              exit={{ opacity: 0, scale: 0.95, rotateY: 90 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              style={{ perspective: 1000 }}
              className="relative h-full w-full overflow-y-auto bg-white md:h-auto md:max-h-[85vh] md:w-full md:max-w-lg md:rounded-xl md:border md:border-gray-100 md:shadow-xl"
            >
              {/* Close button */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="absolute right-3 top-3 z-10 flex h-10 w-10 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  className="h-5 w-5"
                >
                  <path d="M5 5 C7 6, 9 8, 10 10 C11 8, 13 6, 15 5" />
                  <path d="M5 15 C7 14, 9 12, 10 10 C11 12, 13 14, 15 15" />
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
                      {label}
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
                    {description}
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
                          {insights[l.key]}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
