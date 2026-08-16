import type { AssessmentForm } from "../../src/lib/questions/types";

export const PILOT_NORM_MIN_N = 200;

/** Tiszta, tesztelhető fail-closed kapu az aktív pilot-norma jelöltjéhez. */
export function pilotNormActivationBlockers(input: {
  campaignCount: number;
  form: AssessmentForm | null;
  sourceLabel: string | null;
  n: number;
  invalidSdCodes: string[];
}): string[] {
  const blockers: string[] = [];
  if (input.campaignCount === 0) {
    blockers.push("nincs explicit pilot-kampány scope");
  }
  if (input.form !== "short") {
    blockers.push("az élő instrumentumhoz --form=short szükséges");
  }
  if (!input.sourceLabel?.trim()) {
    blockers.push("hiányzik a review-olható --source kohorszleírás");
  }
  if (!Number.isInteger(input.n) || input.n < PILOT_NORM_MIN_N) {
    blockers.push(`n=${input.n}, minimum ${PILOT_NORM_MIN_N}`);
  }
  if (input.invalidSdCodes.length > 0) {
    blockers.push(`nem pozitív szórás: ${input.invalidSdCodes.join(", ")}`);
  }
  return blockers;
}

