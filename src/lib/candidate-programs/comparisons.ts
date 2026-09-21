import { HEXACO_ORDER } from "@/lib/hexaco";
import { z } from "zod";
import { candidateProgramSchema, type CandidateProgram } from "./core";
import { MAX_CANDIDATE_COMPARISONS } from "./limits";
export const comparisonSchema = candidateProgramSchema.shape.baseline
  .unwrap()
  .extend({
    revision: z.number().int().positive(),
    count: z.number().int().min(3),
    dimensions: z
      .record(z.string(), z.number().min(0).max(100))
      .refine((d) => HEXACO_ORDER.every((k) => typeof d[k] === "number")),
    teamName: z.string(),
    connection: z.string().max(2000),
    difference: z.string().max(2000),
    prompt: z.string().max(2000),
  });
export const comparisonsSchema = z
  .array(comparisonSchema)
  .max(MAX_CANDIDATE_COMPARISONS)
  .refine((items) => new Set(items.map((i) => i.teamId)).size === items.length);
export type CandidateComparison = z.infer<typeof comparisonSchema>;
export function readComparisons(
  value: unknown,
  program: CandidateProgram,
): CandidateComparison[] | null {
  if (value === null || value === undefined)
    return program.baseline
      ? [
          {
            ...program.baseline,
            teamName: "",
            connection: "",
            difference: "",
            prompt: "",
          },
        ]
      : [];
  const parsed = comparisonsSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}
