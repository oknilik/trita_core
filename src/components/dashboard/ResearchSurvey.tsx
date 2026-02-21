"use client";

import { useState } from "react";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

interface ResearchSurveyProps {
  locale: Locale;
  hasObserverFeedback: boolean;
  occupationStatus: string | null;
}

// ── Emoji Likert scale ────────────────────────────────────────────────────────

const EMOJIS = ["😕", "😐", "🙂", "😊", "🤩"] as const;

function LikertScale({
  value,
  onChange,
  locale,
}: {
  value: number | null;
  onChange: (v: number) => void;
  locale: Locale;
}) {
  const labels = [
    t("dashboard.feedbackScaleVeryLow", locale),
    t("dashboard.feedbackScaleLow", locale),
    t("dashboard.feedbackScaleNeutral", locale),
    t("dashboard.feedbackScaleHigh", locale),
    t("dashboard.feedbackScaleVeryHigh", locale),
  ];

  return (
    <div className="flex justify-center gap-2 pt-2 flex-wrap">
      {EMOJIS.map((emoji, idx) => {
        const score = idx + 1;
        const active = value === score;
        return (
          <button
            key={score}
            type="button"
            title={labels[idx]}
            onClick={() => onChange(score)}
            className={`flex flex-col items-center gap-1 rounded-xl border-2 px-3 py-2 text-2xl transition-all duration-150 ${
              active
                ? "border-indigo-400 bg-indigo-50 shadow-md scale-110"
                : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
            }`}
          >
            {emoji}
            <span className="text-[10px] font-medium text-gray-500 leading-tight max-w-[3.5rem] text-center">
              {labels[idx]}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Bubble option ─────────────────────────────────────────────────────────────

function Bubble({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-[44px] rounded-xl border-2 px-4 py-2 text-sm font-medium transition-all duration-150 ${
        active
          ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/40"
      }`}
    >
      {label}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function ResearchSurvey({
  locale,
  hasObserverFeedback,
  occupationStatus,
}: ResearchSurveyProps) {
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Q1
  const [selfAccuracy, setSelfAccuracy] = useState<number | null>(null);
  // Q2
  const [priorTest, setPriorTest] = useState<string | null>(null);
  // Q3a / Q3b
  const [positionLevel, setPositionLevel] = useState<string | null>(null);
  const [studyField, setStudyField] = useState<string | null>(null);
  // Q4 industry
  const [industry, setIndustry] = useState<string | null>(null);
  // Q5 motivation
  const [motivation, setMotivation] = useState<string[]>([]);
  // Q6 sharing
  const [sharing, setSharing] = useState<string[]>([]);
  // Q7 feedback sources
  const [feedbackSources, setFeedbackSources] = useState<string[]>([]);
  // Q8 360 process
  const [has360, setHas360] = useState<string | null>(null);
  // Q9 personality importance
  const [personalityImportance, setPersonalityImportance] = useState<number | null>(null);
  // Q10 observer usefulness
  const [observerUsefulness, setObserverUsefulness] = useState<number | null>(null);

  const isEmployed = occupationStatus === "employed";
  const isSelfEmployed = occupationStatus === "self_employed";
  const isStudent = occupationStatus === "student";
  const hasWorkContext = isEmployed || isSelfEmployed;

  type StepId =
    | "q1" | "q2" | "q3a" | "q3b" | "q4industry"
    | "q5motivation" | "q6sharing" | "q7feedbackSources"
    | "q8has360" | "q9personalityImportance" | "q10observerUsefulness";

  const steps: StepId[] = ["q1", "q2"];
  if (isEmployed) steps.push("q3a");
  else if (isStudent) steps.push("q3b");
  if (isEmployed || isStudent) steps.push("q4industry");
  steps.push("q5motivation", "q6sharing");
  if (hasWorkContext) steps.push("q7feedbackSources", "q8has360");
  steps.push("q9personalityImportance");
  if (hasObserverFeedback) steps.push("q10observerUsefulness");

  const totalSteps = steps.length;
  const currentStepId = steps[step];
  const isLastStep = step === totalSteps - 1;

  const canAdvance = (): boolean => {
    switch (currentStepId) {
      case "q1": return selfAccuracy !== null;
      case "q2": return priorTest !== null;
      case "q3a": return positionLevel !== null;
      case "q3b": return studyField !== null;
      case "q4industry": return industry !== null;
      case "q5motivation": return motivation.length > 0;
      case "q6sharing": return sharing.length > 0;
      case "q7feedbackSources": return feedbackSources.length > 0;
      case "q8has360": return has360 !== null;
      case "q9personalityImportance": return personalityImportance !== null;
      case "q10observerUsefulness": return observerUsefulness !== null;
    }
  };

  const handleNext = () => {
    if (!canAdvance()) return;
    if (isLastStep) handleSubmit();
    else setStep((s) => s + 1);
  };

  const handleSkip = () => {
    if (isLastStep) handleSubmit(true);
    else setStep((s) => s + 1);
  };

  const handleSubmit = async (skippedLast = false) => {
    setIsSubmitting(true);
    try {
      const payload = {
        selfAccuracy: selfAccuracy ?? 3,
        priorTest: priorTest ?? "none",
        positionLevel: positionLevel ?? undefined,
        studyField: studyField ?? undefined,
        industry: industry ?? undefined,
        motivation: motivation.length > 0 ? motivation.join(",") : "curiosity",
        sharingIntent: sharing.length > 0 ? sharing.join(",") : "nobody",
        feedbackSources: feedbackSources.length > 0 ? feedbackSources.join(",") : undefined,
        has360Process: has360 ?? undefined,
        personalityImportance: !skippedLast && currentStepId === "q9personalityImportance"
          ? (personalityImportance ?? undefined)
          : personalityImportance ?? undefined,
        observerUsefulness: !skippedLast && currentStepId === "q10observerUsefulness"
          ? (observerUsefulness ?? undefined)
          : observerUsefulness ?? undefined,
      };

      const res = await fetch("/api/survey", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("SUBMIT_FAILED");
      setSubmitted(true);
    } catch {
      showToast(t("dashboard.surveyError", locale), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // ── Submitted ──────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-6 md:p-8 text-center">
        <div className="flex items-center justify-center gap-3">
          <span className="text-2xl">🙏</span>
          <span className="text-sm text-gray-600">{t("dashboard.surveyThanks", locale)}</span>
        </div>
      </div>
    );
  }

  // ── Question content ───────────────────────────────────────────────────────

  return (
    <div className="rounded-2xl border border-indigo-100/50 bg-gradient-to-br from-white to-indigo-50/20 p-6 md:p-8 shadow-md">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
            {t("dashboard.surveyTitle", locale)}
          </p>
          <p className="mt-0.5 text-xs text-gray-500">{t("dashboard.surveySubtitle", locale)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-indigo-100 px-3 py-1 text-xs font-semibold text-indigo-700">
          {step + 1} / {totalSteps}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
          style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Questions */}
      <div className="min-h-[13rem] flex flex-col justify-center">

        {currentStepId === "q1" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ1Label", locale)}</p>
            <LikertScale value={selfAccuracy} onChange={setSelfAccuracy} locale={locale} />
          </div>
        )}

        {currentStepId === "q2" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ2Label", locale)}</p>
            <div className="flex flex-wrap gap-2">
              {(["mbti", "bigfive", "other", "none"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ2${v.charAt(0).toUpperCase() + v.slice(1)}` as never, locale)} active={priorTest === v} onClick={() => setPriorTest(v)} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q3a" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ3aLabel", locale)}</p>
            <div className="flex flex-wrap gap-2">
              {(["Junior", "Middle", "Senior", "Independent"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ3a${v}` as never, locale)} active={positionLevel === v.toLowerCase()} onClick={() => setPositionLevel(v.toLowerCase())} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q3b" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ3bLabel", locale)}</p>
            <div className="flex flex-wrap gap-2">
              {(["Business", "Stem", "Humanities", "Health", "Other"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ3b${v}` as never, locale)} active={studyField === v.toLowerCase()} onClick={() => setStudyField(v.toLowerCase())} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q4industry" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ4iLabel", locale)}</p>
            <div className="flex flex-wrap gap-2">
              {(["Tech", "Finance", "Health", "Education", "Retail", "Manufacturing", "Consulting", "Public", "Other"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ4i${v}` as never, locale)} active={industry === v.toLowerCase()} onClick={() => setIndustry(v.toLowerCase())} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q5motivation" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ5Label", locale)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("dashboard.surveyMultiHint", locale)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["SelfKnowledge", "Career", "Study", "Recommended", "Curiosity"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ5${v}` as never, locale)} active={motivation.includes(v.toLowerCase())} onClick={() => toggle(motivation, setMotivation, v.toLowerCase())} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q6sharing" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ6Label", locale)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("dashboard.surveyMultiHint", locale)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Manager", "Hr", "Colleagues", "Friends", "Nobody"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ6${v}` as never, locale)} active={sharing.includes(v.toLowerCase())} onClick={() => {
                  if (v === "Nobody") {
                    setSharing(sharing.includes("nobody") ? [] : ["nobody"]);
                  } else {
                    setSharing((prev) => {
                      const without = prev.filter((x) => x !== "nobody");
                      return without.includes(v.toLowerCase()) ? without.filter((x) => x !== v.toLowerCase()) : [...without, v.toLowerCase()];
                    });
                  }
                }} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q7feedbackSources" && (
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ7Label", locale)}</p>
              <p className="text-xs text-gray-500 mt-0.5">{t("dashboard.surveyMultiHint", locale)}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(["Manager", "Peers", "Reports", "Clients", "None"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ7${v}` as never, locale)} active={feedbackSources.includes(v.toLowerCase())} onClick={() => {
                  if (v === "None") {
                    setFeedbackSources(feedbackSources.includes("none") ? [] : ["none"]);
                  } else {
                    setFeedbackSources((prev) => {
                      const without = prev.filter((x) => x !== "none");
                      return without.includes(v.toLowerCase()) ? without.filter((x) => x !== v.toLowerCase()) : [...without, v.toLowerCase()];
                    });
                  }
                }} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q8has360" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ8Label", locale)}</p>
            <div className="flex flex-wrap gap-2">
              {(["Yes", "No", "Unknown"] as const).map((v) => (
                <Bubble key={v} label={t(`dashboard.surveyQ8${v}` as never, locale)} active={has360 === v.toLowerCase()} onClick={() => setHas360(v.toLowerCase())} />
              ))}
            </div>
          </div>
        )}

        {currentStepId === "q9personalityImportance" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ9Label", locale)}</p>
            <LikertScale value={personalityImportance} onChange={setPersonalityImportance} locale={locale} />
          </div>
        )}

        {currentStepId === "q10observerUsefulness" && (
          <div className="flex flex-col gap-4">
            <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ10Label", locale)}</p>
            <LikertScale value={observerUsefulness} onChange={setObserverUsefulness} locale={locale} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isSubmitting}
          className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
        >
          {t("dashboard.surveySkip", locale)}
        </button>
        <button
          type="button"
          onClick={handleNext}
          disabled={!canAdvance() || isSubmitting}
          className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-6 text-sm font-semibold transition-all duration-200 ${
            canAdvance() && !isSubmitting
              ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md hover:shadow-lg hover:scale-[1.02]"
              : "cursor-not-allowed bg-gray-100 text-gray-400"
          }`}
        >
          {isSubmitting
            ? t("dashboard.surveySubmitting", locale)
            : isLastStep
              ? t("dashboard.surveySubmit", locale)
              : t("dashboard.surveyNext", locale)}
        </button>
      </div>
    </div>
  );
}
