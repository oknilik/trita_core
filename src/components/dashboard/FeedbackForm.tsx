"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

type FeedbackFormProps = {
  initialSubmitted: boolean;
  hasObserverFeedback?: boolean;
};

export function FeedbackForm({ initialSubmitted, hasObserverFeedback = false }: FeedbackFormProps) {
  const { locale } = useLocale();
  const router = useRouter();

  const scale = [
    { value: 1, label: t("dashboard.feedbackScaleVeryLow", locale) },
    { value: 2, label: t("dashboard.feedbackScaleLow", locale) },
    { value: 3, label: t("dashboard.feedbackScaleNeutral", locale) },
    { value: 4, label: t("dashboard.feedbackScaleHigh", locale) },
    { value: 5, label: t("dashboard.feedbackScaleVeryHigh", locale) },
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  // Köszönet pár másodperc után eltűnik; visszatéréskor amúgy sem renderelődik.
  const [thanksHidden, setThanksHidden] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  // Question responses
  const [agreementScore, setAgreementScore] = useState<number | null>(null);
  const [observerUsefulness, setObserverUsefulness] = useState<number | null>(null);
  const [siteUsefulness, setSiteUsefulness] = useState<number | null>(null);
  const [freeform, setFreeform] = useState("");
  const [interested, setInterested] = useState<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Beküldés után a köszönet ~5 mp-ig látszik, majd eltűnik.
  useEffect(() => {
    if (!submitted) return;
    const timer = setTimeout(() => setThanksHidden(true), 5000);
    return () => clearTimeout(timer);
  }, [submitted]);

  // Korábbi látogatáskor már beküldte → nem mutatjuk többé a szekciót.
  // (A `submitted` kivétel: közvetlenül beküldés után még látszik a köszönet,
  // akkor is, ha a router.refresh() már frissítette az initialSubmitted-et.)
  if (initialSubmitted && !submitted) {
    return null;
  }

  // Beküldés utáni köszönet lejárt → szekció eltűnik (nem esik vissza a formra).
  if (submitted && thanksHidden) {
    return null;
  }

  const totalSteps = hasObserverFeedback ? 5 : 4;
  const displayStep = hasObserverFeedback
    ? currentQuestion
    : currentQuestion <= 1
      ? currentQuestion
      : currentQuestion - 1;

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate current question
    if (currentQuestion === 1 && agreementScore == null) return;
    if (currentQuestion === 2 && observerUsefulness == null) return;
    if (currentQuestion === 3 && siteUsefulness == null) return;
    if (currentQuestion === 4 && interested == null) return;

    // Move to next question (skip question 2 if no observer feedback)
    if (currentQuestion === 1 && !hasObserverFeedback) {
      setCurrentQuestion(3);
    } else if (currentQuestion < 5) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleFinalSubmit = async () => {
    if (isSubmitting) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreementScore,
          observerFeedbackUsefulness: observerUsefulness,
          siteUsefulness,
          freeformFeedback: freeform.trim(),
          interestedInUpdates: interested ?? false,
        }),
      });
      if (!res.ok) {
        throw new Error("submit_failed");
      }
      setSubmitted(true);
      router.refresh();
    } catch {
      setError(t("dashboard.feedbackError", locale));
    } finally {
      setIsSubmitting(false);
    }
  };

  const optionButtonClass = (selected: boolean) =>
    `flex min-h-[48px] items-center justify-center rounded-[10px] border transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-ring focus-visible:ring-offset-2 ${
      selected
        ? "border-sage bg-sage text-[var(--color-action-primary-fg)]"
        : "border-sand bg-cream/55 text-ink hover:border-sage-ring hover:bg-sage-ghost"
    }`;

  const renderScale = (
    selectedValue: number | null,
    onSelect: (value: number) => void,
  ) => (
    <>
      <div className="mt-5 grid grid-cols-5 gap-1.5 sm:gap-2.5">
        {scale.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            aria-label={item.label}
            aria-pressed={selectedValue === item.value}
            className={`${optionButtonClass(selectedValue === item.value)} font-fraunces text-xl tabular-nums sm:text-lg`}
          >
            {item.value}
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between gap-4 text-micro leading-snug text-muted">
        <span>{scale[0].label}</span>
        <span className="text-right">{scale[scale.length - 1].label}</span>
      </div>
    </>
  );

  // Köszönő állapot — csak közvetlenül a beküldés után, majd pár mp múlva eltűnik
  if (submitted && !thanksHidden) {
    return (
      <div className="animate-fade-in rounded-[22px] border border-sage/30 bg-sage-ghost/70 p-6 md:p-8">
        <div className="flex items-center justify-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sage text-[var(--color-action-primary-fg)]">
            <svg
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
              className="h-[18px] w-[18px]"
            >
              <path
                d="M4.5 10.5l3.5 3.5 7.5-8"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="font-fraunces text-lg text-ink">
            {t("dashboard.feedbackThanks", locale)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[22px] border border-sand bg-surface-card px-5 py-6 shadow-sm md:px-8 md:py-8">
      <div className="absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r from-bronze via-sage to-sage-deep" />

      <div className="flex items-start justify-between gap-5">
        <div>
          <h2 className="font-fraunces text-2xl leading-tight text-ink md:text-3xl">
            {t("dashboard.feedbackTitle", locale)}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-body">
            {t("dashboard.feedbackBody", locale)}
          </p>
        </div>
        <span className="shrink-0 font-mono text-micro tracking-wide text-[var(--color-accent-primary-strong)]">
          {String(displayStep).padStart(2, "0")} / {String(totalSteps).padStart(2, "0")}
        </span>
      </div>

      <div
        className="mt-5 h-1 overflow-hidden rounded-full bg-sand/80"
        role="progressbar"
        aria-label={`${displayStep}/${totalSteps}`}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
        aria-valuenow={displayStep}
      >
        <div
          className="h-full rounded-full bg-sage transition-[width] duration-300"
          style={{ width: `${(displayStep / totalSteps) * 100}%` }}
        />
      </div>

      <form onSubmit={handleNext} className="mt-7 flex flex-col gap-6">
        {error && (
          <div className="rounded-lg border border-state-error-border bg-state-error-bg px-4 py-3 text-sm text-state-error-fg">
            {error}
          </div>
        )}

        {/* Question 1: Recognition */}
        {currentQuestion === 1 && (
          <div key="q1" className="animate-fade-in">
            <p className="font-fraunces text-lg leading-snug text-ink">
              {t("dashboard.feedbackAgreementLabel", locale)}
            </p>
            {renderScale(agreementScore, setAgreementScore)}
          </div>
        )}

        {/* Question 2: Observer feedback usefulness (only for users with observer feedback) */}
        {currentQuestion === 2 && hasObserverFeedback && (
          <div key="q2" className="animate-fade-in">
            <p className="font-fraunces text-lg leading-snug text-ink">
              {t("dashboard.feedbackObserverUsefulnessLabel", locale)}
            </p>
            {renderScale(observerUsefulness, setObserverUsefulness)}
          </div>
        )}

        {/* Question 3: Site usefulness */}
        {currentQuestion === 3 && (
          <div key="q3" className="animate-fade-in">
            <p className="font-fraunces text-lg leading-snug text-ink">
              {t("dashboard.feedbackSiteUsefulnessLabel", locale)}
            </p>
            {renderScale(siteUsefulness, setSiteUsefulness)}
          </div>
        )}

        {/* Question 4: Want updates */}
        {currentQuestion === 4 && (
          <div key="q4" className="animate-fade-in">
            <p className="font-fraunces text-lg leading-snug text-ink">
              {t("dashboard.feedbackUpdatesLabel", locale)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInterested(true)}
                className={optionButtonClass(interested === true)}
              >
                <span className="text-sm font-semibold">{t("dashboard.feedbackWantsUpdatesYes", locale)}</span>
              </button>
              <button
                type="button"
                onClick={() => setInterested(false)}
                className={optionButtonClass(interested === false)}
              >
                <span className="text-sm font-semibold">{t("dashboard.feedbackWantsUpdatesNo", locale)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Question 5: Free text feedback */}
        {currentQuestion === 5 && (
          <div key="q5" className="animate-fade-in">
            <p className="font-fraunces text-lg leading-snug text-ink">
              {t("dashboard.feedbackFreeformLabel", locale)}
            </p>
            <textarea
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              rows={4}
              placeholder={t("dashboard.feedbackFreeformPlaceholder", locale)}
              className="mt-4 w-full resize-none rounded-[12px] border border-sand bg-cream/40 px-4 py-3 text-sm leading-relaxed text-ink transition-colors placeholder:text-muted focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage-ring/60"
            />
          </div>
        )}

        {/* Next/Submit button */}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (currentQuestion === 1 && agreementScore == null) ||
            (currentQuestion === 2 && hasObserverFeedback && observerUsefulness == null) ||
            (currentQuestion === 3 && siteUsefulness == null) ||
            (currentQuestion === 4 && interested == null)
          }
          className="inline-flex min-h-[50px] w-full items-center justify-center rounded-[10px] bg-action-primary-bg px-5 text-sm font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:bg-sand/80 disabled:text-muted disabled:hover:brightness-100"
        >
          {isSubmitting
            ? t("dashboard.feedbackSubmitLoading", locale)
            : currentQuestion === 5
              ? t("dashboard.feedbackSubmit", locale)
              : t("common.next", locale)
          }
        </button>
      </form>
    </section>
  );
}
