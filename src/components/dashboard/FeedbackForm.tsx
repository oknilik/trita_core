"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

type FeedbackFormProps = {
  initialSubmitted: boolean;
};

export function FeedbackForm({ initialSubmitted }: FeedbackFormProps) {
  const { locale } = useLocale();
  const router = useRouter();

  // Emoji scale for overall feedback (same as dimension feedback)
  const emojiScale = [
    { value: 1, emoji: "😕", label: t("dashboard.feedbackScaleVeryLow", locale) },
    { value: 2, emoji: "😐", label: t("dashboard.feedbackScaleLow", locale) },
    { value: 3, emoji: "🙂", label: t("dashboard.feedbackScaleNeutral", locale) },
    { value: 4, emoji: "😊", label: t("dashboard.feedbackScaleHigh", locale) },
    { value: 5, emoji: "🤩", label: t("dashboard.feedbackScaleVeryHigh", locale) },
  ];
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(initialSubmitted);
  const [currentQuestion, setCurrentQuestion] = useState(1);

  // Question responses
  const [agreementScore, setAgreementScore] = useState<number | null>(null);
  const [observerUsefulness, setObserverUsefulness] = useState<number | null>(null);
  const [siteUsefulness, setSiteUsefulness] = useState<number | null>(null);
  const [freeform, setFreeform] = useState("");
  const [interested, setInterested] = useState<boolean | null>(null);

  const [error, setError] = useState<string | null>(null);

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate current question
    if (currentQuestion === 1 && agreementScore == null) return;
    if (currentQuestion === 2 && observerUsefulness == null) return;
    if (currentQuestion === 3 && siteUsefulness == null) return;
    if (currentQuestion === 4 && interested == null) return;

    // Move to next question
    if (currentQuestion < 5) {
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

  // Final submitted state
  if (submitted) {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-6 md:p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">🙏</span>
          <span className="text-sm text-gray-600">
            {t("dashboard.feedbackThanks", locale)}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-6 md:p-8">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            {t("dashboard.feedbackTitle", locale)}
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            {t("dashboard.feedbackBody", locale)}
          </p>
        </div>
        <span className="text-xs font-medium text-gray-500">
          {currentQuestion}/5
        </span>
      </div>

      <form onSubmit={handleNext} className="mt-6 flex flex-col gap-5">
        {error && (
          <div className="rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        )}

        {/* Question 1: Recognition */}
        {currentQuestion === 1 && (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t("dashboard.feedbackAgreementLabel", locale)}
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {emojiScale.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAgreementScore(item.value)}
                  aria-label={item.label}
                  className={`flex min-h-[44px] items-center justify-center rounded-lg border text-2xl transition ${
                    agreementScore === item.value
                      ? "border-2 border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question 2: Observer feedback usefulness */}
        {currentQuestion === 2 && (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t("dashboard.feedbackObserverUsefulnessLabel", locale)}
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {emojiScale.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setObserverUsefulness(item.value)}
                  aria-label={item.label}
                  className={`flex min-h-[44px] items-center justify-center rounded-lg border text-2xl transition ${
                    observerUsefulness === item.value
                      ? "border-2 border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question 3: Site usefulness */}
        {currentQuestion === 3 && (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t("dashboard.feedbackSiteUsefulnessLabel", locale)}
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {emojiScale.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setSiteUsefulness(item.value)}
                  aria-label={item.label}
                  className={`flex min-h-[44px] items-center justify-center rounded-lg border text-2xl transition ${
                    siteUsefulness === item.value
                      ? "border-2 border-indigo-600 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  {item.emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question 4: Want updates */}
        {currentQuestion === 4 && (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t("dashboard.feedbackUpdatesLabel", locale)}
            </p>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setInterested(true)}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-lg transition ${
                  interested === true
                    ? "border-2 border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                <span className="text-2xl">👍</span>
                <span className="text-sm font-semibold">{t("dashboard.feedbackWantsUpdatesYes", locale)}</span>
              </button>
              <button
                type="button"
                onClick={() => setInterested(false)}
                className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg border text-lg transition ${
                  interested === false
                    ? "border-2 border-indigo-600 bg-indigo-50"
                    : "border-gray-200 hover:border-indigo-300"
                }`}
              >
                <span className="text-2xl">👎</span>
                <span className="text-sm font-semibold">{t("dashboard.feedbackWantsUpdatesNo", locale)}</span>
              </button>
            </div>
          </div>
        )}

        {/* Question 5: Free text feedback */}
        {currentQuestion === 5 && (
          <div>
            <p className="text-sm font-semibold text-gray-900">
              {t("dashboard.feedbackFreeformLabel", locale)}
            </p>
            <textarea
              value={freeform}
              onChange={(e) => setFreeform(e.target.value)}
              rows={4}
              placeholder={t("dashboard.feedbackFreeformPlaceholder", locale)}
              className="mt-3 w-full resize-none rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-900 focus:border-indigo-300 focus:outline-none"
            />
          </div>
        )}

        {/* Next/Submit button */}
        <button
          type="submit"
          disabled={
            isSubmitting ||
            (currentQuestion === 1 && agreementScore == null) ||
            (currentQuestion === 2 && observerUsefulness == null) ||
            (currentQuestion === 3 && siteUsefulness == null) ||
            (currentQuestion === 4 && interested == null)
          }
          className="inline-flex min-h-[48px] w-full items-center justify-center rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-5 text-sm font-semibold text-white shadow-lg transition-all duration-300 hover:shadow-xl hover:scale-105 disabled:cursor-not-allowed disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200 disabled:hover:scale-100"
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
