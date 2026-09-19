import { z } from "zod";
import { mean as average, sampleStdDev as sampleSd } from "@/lib/stats/dimension-stats";
import { AXES, ITEMS, OPERATING_STYLE_VERSION, type OperatingAxis } from "./questions";
import { OPERATING_PATTERNS, type OperatingPatternCode } from "./patterns";

export const AnswerSchema = z.record(z.number().int().min(1).max(5).nullable())
  .superRefine((answers, ctx) => {
    for (const id of Object.keys(answers)) {
      if (!ITEMS.some((item) => item.id === id)) ctx.addIssue({ code: "custom", message: `Unknown item: ${id}` });
    }
  });
export type OperatingAnswers = z.infer<typeof AnswerSchema>;
const InputSchema = z.object({
  teamId: z.string().min(1), roundId: z.string().min(1),
  instrumentVersion: z.literal(OPERATING_STYLE_VERSION),
  eligibleRespondentIds: z.array(z.string().min(1)),
  responses: z.array(z.object({
    respondentId: z.string().min(1), answers: AnswerSchema,
  }).strict()),
}).strict();
export type OperatingInput = z.infer<typeof InputSchema>;

export { POLICY } from "./policy";
import { POLICY } from "./policy";
export interface AxisSummary {
  n: number;
  coverage: number;
  status: "available" | "insufficient_data";
  mean: number | null;
  sd: number | null;
  leftFrequency: number | null;
  rightFrequency: number | null;
  pole: "left" | "right" | "mixed" | null;
  flags: Array<"low_coverage" | "near_midpoint" | "disagreement" | "both_frequent" | "neither_frequent">;
}
export interface OperatingResult {
  instrumentVersion: typeof OPERATING_STYLE_VERSION;
  scoringVersion: "tos-score-1";
  source: "team_behavior_questionnaire";
  evidenceStatus: "experimental";
  teamId: string;
  roundId: string;
  eligibleCount: number;
  responseCount: number;
  axes: Record<OperatingAxis, AxisSummary>;
  patternUnavailableReason: "insufficient_data" | "low_coverage" | "different_cohorts" | "pole_cooccurrence" | null;
  pattern: null | {
    code: OperatingPatternCode;
    name: (typeof OPERATING_PATTERNS)[OperatingPatternCode];
    status: "descriptive" | "tentative";
    alternativeCodes: OperatingPatternCode[];
  };
}

/** One selected final response per eligible member in ONE team/round/version. */
export function calculateOperatingStyle(raw: OperatingInput): OperatingResult {
  const input = InputSchema.parse(raw);
  const eligible = new Set(input.eligibleRespondentIds);
  if (eligible.size !== input.eligibleRespondentIds.length) throw new Error("DUPLICATE_ELIGIBLE_MEMBER");
  const seen = new Set<string>();
  for (const response of input.responses) {
    if (!eligible.has(response.respondentId)) throw new Error("INELIGIBLE_RESPONDENT");
    if (seen.has(response.respondentId)) throw new Error("DUPLICATE_RESPONSE");
    seen.add(response.respondentId);
  }
  const axes = {} as Record<OperatingAxis, AxisSummary>;
  const cohorts: string[] = [];
  for (const axis of AXES) {
    const included: string[] = [];
    const scores = input.responses.flatMap(({ respondentId, answers }) => {
      const left: number[] = [], right: number[] = [];
      for (const item of ITEMS.filter((i) => i.axis === axis)) {
        const value = answers[item.id];
        if (typeof value === "number") (item.pole === "left" ? left : right).push(value);
      }
      if (left.length + right.length < POLICY.minItemsPerAxis ||
          Math.min(left.length, right.length) < POLICY.minItemsPerPole) return [];
      // Equal pole weighting even when one item is missing. Then equal member weighting.
      const l = average(left), r = average(right);
      included.push(respondentId);
      return [{ value: 50 + 12.5 * (r - l), left: l, right: r }];
    });
    cohorts.push(JSON.stringify(included.sort()));
    const n = scores.length;
    const coverage = eligible.size ? n / eligible.size : 0;
    const flags: AxisSummary["flags"] = coverage < POLICY.minCoverage ? ["low_coverage"] : [];
    if (n < POLICY.minRespondents) {
      axes[axis] = { n, coverage, status: "insufficient_data", mean: null, sd: null,
        leftFrequency: null, rightFrequency: null, pole: null, flags };
      continue;
    }
    const values = scores.map((s) => s.value);
    const mean = average(values), sd = sampleSd(values);
    const leftFrequency = average(scores.map((s) => s.left));
    const rightFrequency = average(scores.map((s) => s.right));
    const nearMidpoint = Math.abs(mean - 50) <= POLICY.neutralHalfWidth;
    if (nearMidpoint) flags.push("near_midpoint");
    if (sd >= POLICY.disagreementSd) flags.push("disagreement");
    if (leftFrequency >= 4 && rightFrequency >= 4) flags.push("both_frequent");
    if (leftFrequency <= 2 && rightFrequency <= 2) flags.push("neither_frequent");
    axes[axis] = { n, coverage, status: "available", mean, sd, leftFrequency, rightFrequency,
      pole: nearMidpoint ? "mixed" : mean < 50 ? "left" : "right", flags };
  }
  const patternUnavailableReason: OperatingResult["patternUnavailableReason"] =
    AXES.some((axis) => axes[axis].status !== "available") ? "insufficient_data" :
    AXES.some((axis) => axes[axis].flags.includes("low_coverage")) ? "low_coverage" :
    new Set(cohorts).size !== 1 ? "different_cohorts" :
    AXES.some((axis) => axes[axis].flags.some((f) => f === "both_frequent" || f === "neither_frequent")) ? "pole_cooccurrence" : null;
  let pattern: OperatingResult["pattern"] = null;
  if (patternUnavailableReason === null) {
    // Midpoint ties map to 0 only as a deterministic catalogue lookup, never a confident pole.
    const code = AXES.map((axis) => axes[axis].mean! > 50 ? "1" : "0").join("") as OperatingPatternCode;
    const alternativeCodes = (Object.keys(OPERATING_PATTERNS) as OperatingPatternCode[])
      .filter((candidate) => candidate !== code && AXES.every((axis, i) =>
        axes[axis].flags.some((f) => f === "near_midpoint" || f === "disagreement") || candidate[i] === code[i]));
    pattern = { code, name: OPERATING_PATTERNS[code],
      status: AXES.some((axis) => axes[axis].flags.length) ? "tentative" : "descriptive", alternativeCodes };
  }
  return { instrumentVersion: OPERATING_STYLE_VERSION, scoringVersion: "tos-score-1",
    source: "team_behavior_questionnaire", evidenceStatus: "experimental",
    teamId: input.teamId, roundId: input.roundId, eligibleCount: eligible.size,
    responseCount: input.responses.length, axes, patternUnavailableReason, pattern };
}
