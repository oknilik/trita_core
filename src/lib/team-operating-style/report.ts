import { z } from "zod";
import type { TeamPatternResult } from "@/lib/team-pattern";
import { AXES, type Localized } from "./questions";
import { calculateOperatingStyle, POLICY, type OperatingInput } from "./scoring";

const COMPOSITION_AXES = ["drive", "cohesion", "discipline", "openness"] as const;
const ReflectionSchema = z.object({
  teamId: z.string().min(1), roundId: z.string().min(1),
  compositionSnapshotId: z.string().min(1),
  operatingAxis: z.enum(AXES), compositionAxis: z.enum(COMPOSITION_AXES),
  kind: z.enum(["possible_alignment", "possible_tension"]),
  statement: z.string().trim().min(1).max(1500),
  observedExample: z.string().trim().min(1).max(1500),
  discussionQuestion: z.string().trim().min(1).max(1500),
  reviewed: z.literal(true),
}).strict();
export type ReviewedReflection = z.infer<typeof ReflectionSchema>;
export const SECTION_TITLES: Record<string, Localized> = {
  operatingStyle: { hu: "Hogyan működtök együtt?", en: "How do you work together?" },
  composition: { hu: "Milyen az összetételetek?", en: "What is your team's composition?" },
  reflections: { hu: "Hol találkozik a működés és az összetétel?", en: "Where do practice and composition meet?" },
};

/** Experimental report contract, not yet wired into production report/UI/PDF. */
export function buildOperatingStyleReport(input: {
  operating: OperatingInput;
  composition: null | { teamId: string; snapshotId: string; result: TeamPatternResult };
  reflections?: readonly ReviewedReflection[];
}) {
  const operating = calculateOperatingStyle(input.operating);
  if (input.composition && input.composition.teamId !== operating.teamId) throw new Error("COMPOSITION_TEAM_MISMATCH");
  const reflections = (input.reflections ?? []).map((r) => ReflectionSchema.parse(r));
  for (const reflection of reflections) {
    if (!input.composition || reflection.teamId !== operating.teamId ||
        reflection.roundId !== operating.roundId ||
        reflection.compositionSnapshotId !== input.composition.snapshotId) throw new Error("REFLECTION_SOURCE_MISMATCH");
    if (operating.axes[reflection.operatingAxis].status !== "available" ||
        operating.axes[reflection.operatingAxis].coverage < POLICY.minCoverage) throw new Error("REFLECTION_INSUFFICIENT_DATA");
  }
  // Explicit whitelist. Never copy styleDistances (member IDs) into a published layer.
  const composition = input.composition ? {
    source: "personality_aggregate" as const,
    snapshotId: input.composition.snapshotId,
    patternCode: input.composition.result.patternCode,
    patternName: input.composition.result.patternName,
    axes: Object.fromEntries(COMPOSITION_AXES.map((axis) => {
      const detail = input.composition!.result.axes[axis];
      if (!detail || !Number.isFinite(detail.value) || !Number.isFinite(detail.diversity)) throw new Error("INVALID_COMPOSITION_AXIS");
      return [axis, { mean: detail.value, sd: detail.diversity, grade: detail.grade }];
    })),
  } : null;
  // No subtraction, correlation or compatibility percentage across unlike constructs.
  return structuredClone({
    version: "team-layers-pilot-1" as const,
    sections: [
      { kind: "operatingStyle" as const, data: operating },
      { kind: "composition" as const, data: composition },
      { kind: "reflections" as const, evidenceStatus: "discussion_hypotheses" as const,
        data: reflections.map(({ operatingAxis, compositionAxis, kind, statement, observedExample, discussionQuestion }) =>
          ({ operatingAxis, compositionAxis, kind, statement, observedExample, discussionQuestion })) },
    ] as const,
  });
}
