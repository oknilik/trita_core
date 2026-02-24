"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { t, type Locale } from "@/lib/i18n";
import { useToast } from "@/components/ui/Toast";

interface ResearchSurveyProps {
  locale: Locale;
  hasObserverFeedback: boolean;
  occupationStatus: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// ── Emoji Likert scale ────────────────────────────────────────────────────────

const EMOJIS = ["😕", "😐", "🙂", "😊", "🤩"] as const;

function LikertScale({
  value,
  onChange,
  locale,
  labels: customLabels,
}: {
  value: number | null;
  onChange: (v: number) => void;
  locale: Locale;
  labels?: [string, string, string, string, string];
}) {
  const defaultLabels: [string, string, string, string, string] = [
    t("dashboard.feedbackScaleVeryLow", locale),
    t("dashboard.feedbackScaleLow", locale),
    t("dashboard.feedbackScaleNeutral", locale),
    t("dashboard.feedbackScaleHigh", locale),
    t("dashboard.feedbackScaleVeryHigh", locale),
  ];
  const labels = customLabels ?? defaultLabels;

  return (
    <div className="flex justify-center gap-1.5 pt-1 flex-wrap">
      {EMOJIS.map((emoji, idx) => {
        const score = idx + 1;
        const active = value === score;
        return (
          <button
            key={score}
            type="button"
            title={labels[idx]}
            onClick={() => onChange(score)}
            className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-2 py-1.5 text-2xl transition-all duration-150 ${
              active
                ? "border-indigo-400 bg-indigo-50 shadow-md scale-110"
                : "border-gray-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40"
            }`}
          >
            {emoji}
            <span className="text-[9px] font-medium text-gray-500 leading-tight max-w-[3rem] text-center">
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
      className={`min-h-[38px] rounded-xl border-2 px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
        active
          ? "border-indigo-400 bg-indigo-50 text-indigo-700 shadow-sm"
          : "border-gray-200 bg-white text-gray-600 hover:border-indigo-200 hover:bg-indigo-50/40"
      }`}
    >
      {label}
    </button>
  );
}

// ── Q2 options ────────────────────────────────────────────────────────────────

const Q2_OPTIONS = [
  { value: "mbti", key: "Mbti" },
  { value: "bigfive", key: "BigFive" },
  { value: "hexaco", key: "Hexaco" },
  { value: "disc", key: "Disc" },
  { value: "other", key: "Other" },
  { value: "none", key: "None" },
] as const;

// ── Main component ────────────────────────────────────────────────────────────

export function ResearchSurvey({
  locale,
  hasObserverFeedback,
  occupationStatus,
  isOpen,
  onClose,
}: ResearchSurveyProps) {
  const { showToast } = useToast();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Q1
  const [selfAccuracy, setSelfAccuracy] = useState<number | null>(null);
  // Q2
  const [priorTest, setPriorTest] = useState<string[]>([]);
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

  useEffect(() => { setMounted(true); }, []);

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
      case "q2": return priorTest.length > 0;
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
        priorTest: priorTest.length > 0 ? priorTest.join(",") : "none",
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
      window.dispatchEvent(new CustomEvent("dashboard:survey-submitted"));
      setTimeout(() => onClose(), 1500);
    } catch {
      showToast(t("dashboard.surveyError", locale), "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggle = (list: string[], setList: (v: string[]) => void, value: string) => {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  };

  // Custom scale labels for Q9/Q10
  const importanceLabels: [string, string, string, string, string] = [
    t("dashboard.feedbackScaleVeryLow", locale),
    t("dashboard.feedbackScaleLow", locale),
    t("dashboard.feedbackScaleNeutral", locale),
    t("dashboard.surveyScaleImportanceHigh", locale),
    t("dashboard.surveyScaleImportanceVeryHigh", locale),
  ];
  const usefulnessLabels: [string, string, string, string, string] = [
    t("dashboard.feedbackScaleVeryLow", locale),
    t("dashboard.feedbackScaleLow", locale),
    t("dashboard.feedbackScaleNeutral", locale),
    t("dashboard.surveyScaleUsefulnessHigh", locale),
    t("dashboard.surveyScaleUsefulnessVeryHigh", locale),
  ];

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-4"
        >
          {/* Backdrop — intentionally no onClick: cannot dismiss until submitted */}
          <div className="absolute inset-0 bg-black/40 glass-effect" />

          {/* Content panel */}
          <motion.div
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "100%", opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 40, mass: 0.8 }}
            className="relative max-h-[92dvh] w-full overflow-y-auto rounded-t-2xl bg-white/95 glass-effect md:max-h-[85vh] md:max-w-lg md:rounded-2xl md:border md:border-gray-100/50 md:shadow-2xl"
          >
            <AnimatePresence mode="wait">
              {submitted ? (
                // ── Thank-you state ──
                <motion.div
                  key="thankyou"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="flex flex-col items-center justify-center px-8 py-16 text-center"
                >
                  <div className="text-5xl leading-none">🙏</div>
                  <p className="mt-4 text-base font-semibold text-indigo-700">
                    {t("dashboard.surveyThanks", locale)}
                  </p>
                  <div className="mt-5 h-2 w-64 overflow-hidden rounded-full bg-gray-100">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: "100%" }}
                      transition={{ duration: 1.4, ease: "linear" }}
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
                    />
                  </div>
                </motion.div>
              ) : (
                // ── Survey content ──
                <motion.div
                  key="survey"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="p-5 md:p-6"
                >
                  {/* Header */}
                  <div className="mb-3 flex items-start justify-between gap-4">
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
                  <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                      style={{ width: `${((step + 1) / totalSteps) * 100}%` }}
                    />
                  </div>

                  {/* Questions */}
                  <div className="min-h-[10rem] flex flex-col justify-center">

                    {currentStepId === "q1" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ1Label", locale)}</p>
                        <LikertScale value={selfAccuracy} onChange={setSelfAccuracy} locale={locale} />
                      </div>
                    )}

                    {currentStepId === "q2" && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ2Label", locale)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t("dashboard.surveyMultiHint", locale)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {Q2_OPTIONS.filter((o) => !["other", "none"].includes(o.value)).map(({ value, key }) => (
                            <Bubble
                              key={value}
                              label={t(`dashboard.surveyQ2${key}` as never, locale)}
                              active={priorTest.includes(value)}
                              onClick={() => toggle(priorTest, setPriorTest, value)}
                            />
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-2">
                          {Q2_OPTIONS.filter((o) => ["other", "none"].includes(o.value)).map(({ value, key }) => (
                            <Bubble
                              key={value}
                              label={t(`dashboard.surveyQ2${key}` as never, locale)}
                              active={priorTest.includes(value)}
                              onClick={() => toggle(priorTest, setPriorTest, value)}
                            />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStepId === "q3a" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ3aLabel", locale)}</p>
                        <div className="flex flex-wrap gap-2">
                          {(["Junior", "Middle", "Senior", "Independent"] as const).map((v) => (
                            <Bubble key={v} label={t(`dashboard.surveyQ3a${v}` as never, locale)} active={positionLevel === v.toLowerCase()} onClick={() => setPositionLevel(v.toLowerCase())} />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStepId === "q3b" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ3bLabel", locale)}</p>
                        <div className="flex flex-wrap gap-2">
                          {(["Business", "Stem", "Humanities", "Health", "Other"] as const).map((v) => (
                            <Bubble key={v} label={t(`dashboard.surveyQ3b${v}` as never, locale)} active={studyField === v.toLowerCase()} onClick={() => setStudyField(v.toLowerCase())} />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStepId === "q4industry" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ4iLabel", locale)}</p>
                        <div className="flex flex-wrap gap-2">
                          {(["Tech", "Finance", "Health", "Education", "Retail", "Manufacturing", "Consulting", "Public", "Other"] as const).map((v) => (
                            <Bubble key={v} label={t(`dashboard.surveyQ4i${v}` as never, locale)} active={industry === v.toLowerCase()} onClick={() => setIndustry(v.toLowerCase())} />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStepId === "q5motivation" && (
                      <div className="flex flex-col gap-3">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ5Label", locale)}</p>
                          <p className="text-xs text-gray-500 mt-0.5">{t("dashboard.surveyMultiHint", locale)}</p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {(["SelfKnowledge", "Career", "ObserverFeedback", "HelpResearch", "Recommended", "Curiosity"] as const).map((v) => (
                            <Bubble key={v} label={t(`dashboard.surveyQ5${v}` as never, locale)} active={motivation.includes(v.toLowerCase())} onClick={() => toggle(motivation, setMotivation, v.toLowerCase())} />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStepId === "q6sharing" && (
                      <div className="flex flex-col gap-3">
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
                      <div className="flex flex-col gap-3">
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
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ8Label", locale)}</p>
                        <div className="flex flex-wrap gap-2">
                          {(["Yes", "No", "Unknown"] as const).map((v) => (
                            <Bubble key={v} label={t(`dashboard.surveyQ8${v}` as never, locale)} active={has360 === v.toLowerCase()} onClick={() => setHas360(v.toLowerCase())} />
                          ))}
                        </div>
                      </div>
                    )}

                    {currentStepId === "q9personalityImportance" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ9Label", locale)}</p>
                        <LikertScale value={personalityImportance} onChange={setPersonalityImportance} locale={locale} labels={importanceLabels} />
                      </div>
                    )}

                    {currentStepId === "q10observerUsefulness" && (
                      <div className="flex flex-col gap-3">
                        <p className="text-sm font-semibold text-gray-900">{t("dashboard.surveyQ10Label", locale)}</p>
                        <LikertScale value={observerUsefulness} onChange={setObserverUsefulness} locale={locale} labels={usefulnessLabels} />
                      </div>
                    )}
                  </div>

                  {/* Navigation */}
                  <div className="mt-4 flex items-center justify-between gap-3">
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
                      className={`inline-flex min-h-[40px] items-center justify-center rounded-lg px-5 text-sm font-semibold transition-all duration-200 ${
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
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
