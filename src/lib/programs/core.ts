import { z } from "zod";

export const PROGRAM_KEYS = ["TEAM_SCAN", "FOLLOW_UP"] as const;
export type ProgramKey = typeof PROGRAM_KEYS[number];
export const ACTIVITY_KEYS = ["SELF_ASSESSMENT", "OBSERVER_360", "TEAM_OPERATING_STYLE", "PSYCH_SAFETY", "REPORT_GENERATION", "CONSULTANT_REVIEW", "PUBLISH"] as const;
export type ActivityKey = typeof ACTIVITY_KEYS[number];
export type ActivityState = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "WAITING" | "COMPLETED" | "SKIPPED";
const activitySchema = z.object({
  key: z.enum(ACTIVITY_KEYS), scope: z.enum(["participant", "team"]),
  required: z.boolean(), dependencies: z.array(z.enum(ACTIVITY_KEYS)),
}).strict();
export const programSchema = z.object({
  key: z.enum(PROGRAM_KEYS), version: z.number().int().positive(),
  activities: z.array(activitySchema).min(1),
  policy: z.object({ observerResponsesPerParticipant: z.literal(3), minRespondents: z.literal(3), minOperatingCoverage: z.literal(0.6) }).strict(),
}).strict();
export type ProgramSnapshot = z.infer<typeof programSchema>;
export function parseProgram(value: unknown): ProgramSnapshot | null {
  if (value == null) return null;
  const p = programSchema.parse(value);
  const keys = new Set(p.activities.map(a => a.key));
  if (keys.size !== p.activities.length) throw new Error("PROGRAM_DUPLICATE_ACTIVITY");
  const visiting = new Set<string>(), visited = new Set<string>();
  function visit(key: ActivityKey) {
    if (visiting.has(key)) throw new Error("PROGRAM_DEPENDENCY_CYCLE");
    if (visited.has(key)) return;
    const a = p.activities.find(a => a.key === key);
    if (!a) throw new Error("PROGRAM_UNKNOWN_DEPENDENCY");
    visiting.add(key);
    for (const dep of a.dependencies) {
      if (a.scope === "participant" && p.activities.find(a => a.key === dep)?.scope === "team") throw new Error("PROGRAM_INVALID_SCOPE");
      visit(dep);
    }
    visiting.delete(key); visited.add(key);
  }
  p.activities.forEach(a => visit(a.key));
  return p;
}
export function createProgramSnapshot(key: ProgramKey): ProgramSnapshot {
  const measurement: ActivityKey[] = key === "TEAM_SCAN"
    ? ["SELF_ASSESSMENT", "TEAM_OPERATING_STYLE", "PSYCH_SAFETY", "OBSERVER_360"]
    : ["TEAM_OPERATING_STYLE", "PSYCH_SAFETY"];
  return parseProgram({ key, version: 1,
    activities: [
      ...measurement.map(k => ({ key: k, scope: "participant", required: true,
        dependencies: key === "TEAM_SCAN" && k !== "SELF_ASSESSMENT" ? ["SELF_ASSESSMENT"] : [] })),
      { key: "REPORT_GENERATION", scope: "team", required: true, dependencies: measurement },
      { key: "CONSULTANT_REVIEW", scope: "team", required: true, dependencies: ["REPORT_GENERATION"] },
      { key: "PUBLISH", scope: "team", required: true, dependencies: ["CONSULTANT_REVIEW"] },
    ], policy: { observerResponsesPerParticipant: 3, minRespondents: 3, minOperatingCoverage: 0.6 },
  })!;
}
export function participantActivities(p: ProgramSnapshot) {
  return p.activities.filter(a => a.scope === "participant");
}
export function completionMap(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}
export function activityStates(p: ProgramSnapshot, completions: unknown, facts: {
  started?: string[]; observerSent?: number; observerResponses?: number;
} = {}): Array<{ key: ActivityKey; state: ActivityState }> {
  const done = completionMap(completions);
  return participantActivities(p).map(a => {
    if (done[a.key] || (a.key === "OBSERVER_360" && (facts.observerResponses ?? 0) >= p.policy.observerResponsesPerParticipant)) return { key: a.key, state: "COMPLETED" };
    if (a.dependencies.some(d => !done[d])) return { key: a.key, state: "LOCKED" };
    if (a.key === "OBSERVER_360" && (facts.observerSent ?? 0) > 0) return { key: a.key, state: "WAITING" };
    return { key: a.key, state: facts.started?.includes(a.key) ? "IN_PROGRESS" : "AVAILABLE" };
  });
}
export function programActivityLink(key: string, campaignId: string) {
  const paths: Record<string, string> = { SELF_ASSESSMENT: "/assessment", TEAM_OPERATING_STYLE: "/assessment/team-operating-style", PSYCH_SAFETY: "/assessment/psych-safety", OBSERVER_360: "/tasks/observers" };
  return `${paths[key] ?? "/tasks"}?campaignId=${encodeURIComponent(campaignId)}`;
}
export const PROGRAM_LABELS = {
  TEAM_SCAN: { hu: "Team Scan", en: "Team Scan" }, FOLLOW_UP: { hu: "Follow-up", en: "Follow-up" },
};
export const PROGRAM_DESCRIPTIONS = {
  TEAM_SCAN: { hu: "Személyiség, külső visszajelzés, csapatműködés, pszichológiai biztonság és tanácsadó által jóváhagyott riport.", en: "Personality, observer feedback, operating style, psychological safety and a consultant-reviewed report." },
  FOLLOW_UP: { hu: "Csapatműködés és pszichológiai biztonság újramérése, összehasonlítva egy korábbi Team Scannel. Nem kér új személyiségtesztet vagy observert.", en: "Remeasure operating style and psychological safety against a previous Team Scan, without repeating personality or observer assessments." },
};
