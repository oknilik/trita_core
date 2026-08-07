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
    `flex min-h-[44px] items-center justify-center rounded-lg border transition-all duration-200 ${
      selected
        ? "border-sage bg-sage text-white shadow-md"
        : "border-sand bg-surface-card text-ink hover:-translate-y-0.5 hover:border-sage-ring hover:bg-sage-ghost hover:shadow-sm"
    }`;

  const renderScale = (
    selectedValue: number | null,
    onSelect: (value: number) => void,
  ) => (
    <>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {scale.map((item) => (
          <button
            key={item.value}
            type="button"
            onClick={() => onSelect(item.value)}
            aria-label={item.label}
            className={`${optionButtonClass(selectedValue === item.value)} font-fraunces text-lg tabular-nums`}
          >
            {item.value}
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex justify-between text-micro text-muted">
        <span>{scale[0].label}</span>
        <span>{scale[scale.length - 1].label}</span>
      </div>
    </>
  );

  // Köszönő állapot — csak közvetlenül a beküldés után, majd pár mp múlva eltűnik
  if (submitted && !thanksHidden) {
    return (
      <div className="animate-fade-in rounded-xl border border-sage-ring bg-gradient-to-br from-sage-ghost to-white p-6 md:p-8">
        <div className="flex items-center justify-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sage text-white shadow-sm">
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
          <span className="text-sm font-medium text-ink">
            {t("dashboard.feedbackThanks", locale)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-sage-ring bg-gradient-to-br from-sage-ghost to-white p-6 md:p-8">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">
            {t("dashboard.feedbackTitle", locale)}
          </h2>
          <p className="mt-1 text-sm text-ink-body">
            {t("dashboard.feedbackBody", locale)}
          </p>
        </div>
        {/* Lépésjelző pöttyök */}
        <div
          className="mt-1.5 flex shrink-0 items-center gap-1.5"
          aria-label={`${displayStep}/${totalSteps}`}
        >
          {Array.from({ length: totalSteps }, (_, i) => {
            const step = i + 1;
            return (
              <span
                key={step}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === displayStep
                    ? "w-6 bg-sage"
                    : step < displayStep
                      ? "w-1.5 bg-sage-ring"
                      : "w-1.5 bg-sand"
                }`}
              />
            );
          })}
        </div>
      </div>

      <form onSubmit={handleNext} className="mt-6 flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-state-error-bg bg-state-error-bg px-4 py-3 text-sm text-state-error-fg">
            {error}
          </div>
        )}

        {/* Question 1: Recognition */}
        {currentQuestion === 1 && (
          <div key="q1" className="animate-fade-in">
            <p className="text-sm font-semibold text-ink">
              {t("dashboard.feedbackAgreementLabel", locale)}
            </p>
            {renderScale(agreementScore, setAgreementScore)}
          </div>
        )}

        {/* Question 2: Observer feedback usefulness (only for users with observer feedback) */}
        {currentQuestion === 2 && hasObserverFeedback && (
          <div key="q2" className="animate-fade-in">
            <p className="text-sm font-semibold text-ink">
              {t("dashboard.feedbackObserverUsefulnessLabel", locale)}
            </p>
            {renderScale(observerUsefulness, setObserverUsefulness)}
          </div>
        )}

        {/* Question 3: Site usefulness */}
        {currentQuestion === 3 && (
          <div key="q3" className="animate-fade-in">
            <p className="text-sm font-semibold text-ink">
              {t("dashboard.feedbackSiteUsefulnessLabel", locale)}
            </p>
            {renderScale(siteUsefulness, setSiteUsefulness)}
          </div>
        )}

        {/* Question 4: Want updates */}
        {currentQuestion === 4 && (
          <div key="q4" className="animate-fade-in">
            <p className="text-sm font-semibold text-ink">
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
            <p className="text-sm font-semibold text-ink">
              {t("dashboard.feedbackFreeformLabel", locale)}
            </p>
            <textarea
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              rows={4}
              placeholder={t("dashboard.feedbackFreeformPlaceholder", locale)}
              className="mt-3 w-full resize-none rounded-lg border border-sand bg-surface-card px-3 py-2 text-sm text-ink transition-colors focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage-ring/60"
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
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-sage to-sage-deep px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:bg-sand/80 disabled:text-muted disabled:from-cream-300 disabled:to-cream-300 disabled:hover:scale-100"
        >
          {isSubmitting
            ? t("dashboard.feedbackSubmitLoading", locale)
            : currentQuestion === 5
              ? t("dashboard.feedbackSubmit", locale)
              : t("common.next", locale)
          }
        </button>
      </form>
    </div>
  );
}
