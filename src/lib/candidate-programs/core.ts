import { z } from "zod";
import { getTestConfig } from "@/lib/questions";
import type { Locale } from "@/lib/i18n";
export const candidateProgramSchema = z
  .object({
    key: z.literal("CANDIDATE_PROFILE"),
    version: z.literal(1),
    instrument: z.literal("TSFI_V2"),
    form: z.literal("short"),
    scoring: z.literal("candidate-score-1"),
    questionIds: z.array(z.number().int().positive()).min(1),
    includeTeamRole: z.boolean(),
    focus: z.string().max(2000),
    noticeVersion: z.literal(1),
    baseline: z
      .object({
        reportId: z.string(),
        teamId: z.string(),
        revision: z.number(),
        publishedAt: z.string(),
        count: z.number().min(3),
        dimensions: z.record(z.string(), z.number().min(0).max(100)),
      })
      .nullable(),
  })
  .strict();
export type CandidateProgram = z.infer<typeof candidateProgramSchema>;
export function createCandidateProgram(
  includeTeamRole = false,
  focus = "",
  baseline: CandidateProgram["baseline"] = null,
): CandidateProgram {
  return candidateProgramSchema.parse({
    key: "CANDIDATE_PROFILE",
    version: 1,
    instrument: "TSFI_V2",
    form: "short",
    scoring: "candidate-score-1",
    questionIds: getTestConfig("TRITAN", "hu", "short").questions.map(
      (q) => q.id,
    ),
    includeTeamRole,
    focus,
    baseline,
    noticeVersion: 1,
  });
}
export function readCandidateProgram(value: unknown): CandidateProgram | null {
  const result = candidateProgramSchema.safeParse(value);
  if (!result.success) return null;
  const ids = result.data.questionIds;
  const current = getTestConfig("TRITAN", "hu", "short").questions.map(
    (q) => q.id,
  );
  return new Set(ids).size === ids.length &&
    ids.length === current.length &&
    ids.every((id) => current.includes(id))
    ? result.data
    : null;
}
export function candidateQuestions(p: CandidateProgram, locale: Locale) {
  const bank = getTestConfig("TRITAN", locale, p.form).questions;
  return p.questionIds.map((id) => bank.find((q) => q.id === id)!);
}
export const draftSchema = z
  .object({
    expectedRevision: z.number().int().min(0),
    answers: z.record(z.string(), z.number().int().min(1).max(5)),
    acknowledge: z.boolean().optional(),
  })
  .strict();
export function validCandidateAnswers(
  p: CandidateProgram,
  answers: Record<string, number>,
  complete = false,
) {
  const keys = Object.keys(answers);
  return (
    keys.every(
      (id) =>
        p.questionIds.some((q) => String(q) === id) &&
        Number.isInteger(answers[id]) &&
        answers[id] >= 1 &&
        answers[id] <= 5,
    ) &&
    (!complete || keys.length === p.questionIds.length)
  );
}
