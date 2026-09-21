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
          <li key={step}>
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
              <span
                aria-hidden="true"
                className="mb-3 block font-fraunces text-heading text-muted"
              >
                0{index + 1}
              </span>
              <h2 className="font-fraunces text-heading text-ink">
                {t(`candidateSuggestions.${step}`, locale)}
              </h2>
            </CandidateWorkshopNote>
          </li>
        ))}
      </ol>
    </section>
  );
}
