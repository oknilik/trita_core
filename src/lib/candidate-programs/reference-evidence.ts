import { z } from "zod";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { TEAM_ROLES } from "@/lib/team-role-scoring";
const counts = z
  .record(z.number().int().nonnegative())
  .refine((v) => Object.keys(v).every((k) => k in TEAM_ROLES));
export const referenceEvidenceSchema = z.object({
  spread: z.record(z.number().finite().min(0).max(100)).optional(),
  roles: z
    .object({
      counts,
      secondaryCounts: counts.optional(),
      questionnaireCount: z.number().int().nonnegative(),
      estimateCount: z.number().int().nonnegative(),
    })
    .optional(),
});
export type ReferenceEvidence = z.infer<typeof referenceEvidenceSchema>;
/** Whitelist from the exact published report, never from live team member records. */
export function referenceEvidence(value: unknown): ReferenceEvidence {
  const a = value as {
    dimensionSpread?: unknown;
    roleDistribution?: unknown;
  } | null;
  const spread = referenceEvidenceSchema.shape.spread.safeParse(
    a?.dimensionSpread ?? undefined,
  );
  const roles = referenceEvidenceSchema.shape.roles.safeParse(
    a?.roleDistribution ?? undefined,
  );
  return {
    ...(spread.success && spread.data
      ? {
          spread: Object.fromEntries(
            HEXACO_ORDER.filter((d) => Number.isFinite(spread.data![d])).map(
              (d) => [d, spread.data![d]],
            ),
          ),
        }
      : {}),
    ...(roles.success && roles.data ? { roles: roles.data } : {}),
  };
}
