import { CandidateJourneyArtwork } from "./CandidateJourneyArtwork";
import { t, type Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { CandidateWorkshopNote } from "./CandidateWorkshopNote";

export function CandidateJourneyOverview({
  locale,
  withRoles,
}: {
  locale: Locale;
  withRoles: boolean;
}) {
  const steps = [
    "selfStep",
    ...(withRoles ? ["roleStep"] : []),
    "feedbackStep",
  ];
  return (
    <section
      className="mt-6 w-full"
      aria-label={t("candidateSuggestions.journey", locale)}
    >
      <SectionEyebrow tone="candidate" className="mb-4">
        {t("candidateSuggestions.journey", locale)}
      </SectionEyebrow>
      <ol
        className={`grid gap-3 ${withRoles ? "sm:grid-cols-3" : "sm:grid-cols-2"}`}
      >
        {steps.map((step, index) => (
          <li key={step} className="min-w-0">
            <CandidateWorkshopNote
              tone={
                step === "roleStep"
                  ? "role"
                  : step === "selfStep"
                    ? "connection"
                    : "neutral"
              }
              className="h-full"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <span
                  aria-hidden="true"
                  className="font-fraunces text-heading text-muted"
                >
                  0{index + 1}
                </span>
                <CandidateJourneyArtwork step={step} />
              </div>
              <h2 className="break-normal font-fraunces text-heading text-ink [overflow-wrap:normal] [hyphens:none]">
                {t(`candidateSuggestions.${step}`, locale)}
              </h2>
              {step === "roleStep" && (
                <p className="mt-2 text-caption text-muted">
                  {t("candidateSuggestions.optionalStep", locale)}
                </p>
              )}
            </CandidateWorkshopNote>
          </li>
        ))}
      </ol>
    </section>
  );
}
