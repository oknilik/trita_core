"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import { track } from "@/lib/analytics/client";

interface ResultClarityFeedbackProps {
  initialSubmitted: boolean;
  locale: Locale;
}

const OPTIONS = [
  { value: 1, key: "results.summaryClarityNo" },
  { value: 3, key: "results.summaryClarityPartly" },
  { value: 5, key: "results.summaryClarityYes" },
] as const;

export function ResultClarityFeedback({ initialSubmitted, locale }: ResultClarityFeedbackProps) {
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(false);

  const submit = async (rating: number) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(false);
    track("form.start", { form_id: "result_clarity" });

    try {
      const response = await fetch("/api/feedback/result-clarity", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      if (!response.ok) throw new Error("submit_failed");
      track("form.submit", { form_id: "result_clarity", outcome: "success" });
      setSubmitted(true);
    } catch {
      track("form.submit", { form_id: "result_clarity", outcome: "error" });
      setError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <p role="status" className="rounded-xl border border-sage-ring bg-sage-ghost px-4 py-3 text-caption text-ink-body">
        {t("results.summaryClarityThanks", locale)}
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h3 className="text-sm font-semibold text-ink">{t("results.summaryClarityQuestion", locale)}</h3>
        <p className="mt-0.5 text-micro text-muted">{t("results.summaryClarityBody", locale)}</p>
        {error ? <p role="alert" className="mt-1 text-micro text-state-error-fg">{t("results.summaryClarityError", locale)}</p> : null}
      </div>
      <div className="grid grid-cols-3 gap-2" role="group" aria-label={t("results.summaryClarityQuestion", locale)}>
        {OPTIONS.map((option) => (
          <button
            key={option.value}
            type="button"
            disabled={isSubmitting}
            onClick={() => void submit(option.value)}
            className="min-h-[40px] rounded-lg border border-sand bg-surface-card px-3 text-xs font-semibold text-ink-body transition hover:border-sage-ring hover:bg-sage-ghost disabled:opacity-50"
          >
            {t(option.key, locale)}
          </button>
        ))}
      </div>
    </section>
  );
}
