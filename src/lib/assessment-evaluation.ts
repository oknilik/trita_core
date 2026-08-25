import type { Locale } from "@/lib/i18n";

export type EvaluationPhase = 0 | 1 | 2;

const PHASE_MESSAGES: Record<Locale, readonly [string, string, string]> = {
  hu: [
    "Megnézzük, hogyan kapcsolódsz másokhoz…",
    "Összekötjük a döntési és munkastílusod jelzéseit…",
    "Megfogalmazzuk, mire érdemes építened…",
  ],
  en: [
    "Looking at how you connect with others…",
    "Connecting signals in your decisions and work style…",
    "Turning the patterns into strengths you can use…",
  ],
};

export function clampEvaluationProgress(progress: number): number {
  if (!Number.isFinite(progress)) return 0;
  return Math.min(Math.max(progress, 0), 100);
}

export function getEvaluationPhase(progress: number): EvaluationPhase {
  const safeProgress = clampEvaluationProgress(progress);
  if (safeProgress < 36) return 0;
  if (safeProgress < 72) return 1;
  return 2;
}

export function buildEvaluationViewModel(progress: number, locale: Locale) {
  const safeProgress = clampEvaluationProgress(progress);
  const phase = getEvaluationPhase(safeProgress);
  return {
    safeProgress,
    roundedProgress: Math.round(safeProgress),
    phase,
    phaseMessage: PHASE_MESSAGES[locale][phase],
    kicker: locale === "hu"
      ? "A személyes eredményed készül"
      : "Your personal result is taking shape",
    body: locale === "hu"
      ? "Nem csak pontszámokat, hanem használható összefüggéseket keresünk."
      : "We look beyond scores to find patterns you can actually use.",
    status: locale === "hu" ? "Mintázatok összekapcsolása" : "Connecting patterns",
  };
}
