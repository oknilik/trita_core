import { HEXACO_DIMENSIONS, HEXACO_ORDER } from "@/lib/hexaco";
import { dimStandardError } from "@/lib/psychometrics";
import { deficitSlotEligible, strengthSlotEligible } from "@/lib/score-valence";
import { tf, type Locale } from "@/lib/i18n";

// Individual score uncertainty only: a team mean is not a second individual.
// No fit rankings or automatic strength/deficit classifications are produced.
export function CandidateMeasurementNote({ locale }: { locale: Locale }) {
  return (
    <div className="mt-4 space-y-2 text-caption text-muted">
      <p>
        {tf("programReview.uncertainty", locale, {
          margin: (1.96 * dimStandardError("short")).toFixed(1),
        })}
      </p>
      {HEXACO_ORDER.filter(
        (dim) =>
          !strengthSlotEligible(dim, "evaluative") && !deficitSlotEligible(dim),
      ).map((dim) => (
        <p key={dim}>
          {tf("programReview.neutral", locale, {
            dimension: HEXACO_DIMENSIONS[dim][locale],
          })}
        </p>
      ))}
    </div>
  );
}
