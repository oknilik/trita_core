import { POLICY } from "@/lib/team-operating-style/scoring";
import { z } from "zod";

export const PROGRAM_KEYS = ["TEAM_SCAN", "FOLLOW_UP"] as const;
export type ProgramKey = typeof PROGRAM_KEYS[number];
export const ACTIVITY_KEYS = ["SELF_ASSESSMENT", "OBSERVER_360", "TEAM_OPERATING_STYLE", "PSYCH_SAFETY", "TRUST_360", "REPORT_GENERATION", "CONSULTANT_REVIEW", "PUBLISH"] as const;
export type ActivityKey = typeof ACTIVITY_KEYS[number];
export type ActivityState = "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "WAITING" | "COMPLETED" | "SKIPPED";
const activitySchema = z.object({
  key: z.enum(ACTIVITY_KEYS), scope: z.enum(["participant", "team"]),
  required: z.boolean(), dependencies: z.array(z.enum(ACTIVITY_KEYS)),
}).strict();
export const programSchema = z.object({
  key: z.enum(PROGRAM_KEYS), version: z.literal(1),
  activities: z.array(activitySchema).min(1),
  policy: z.object({ observerResponsesPerParticipant: z.number().int().min(1).max(100), minRespondents: z.number().int().min(POLICY.minRespondents).max(10000), minOperatingCoverage: z.number().min(POLICY.minCoverage).max(1) }).strict(),
}).strict();
export const DEFAULT_PROGRAM_POLICY = { observerResponsesPerParticipant: 3, minRespondents: POLICY.minRespondents, minOperatingCoverage: POLICY.minCoverage };
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
/** Read paths fail closed; write paths keep using strict parseProgram. Unknown versions are unsupported. */
export function safeParseProgram(value: unknown): ProgramSnapshot | null {
  try { return parseProgram(value); } catch { return null; }
}
export function createProgramSnapshot(key: ProgramKey, options: { includeTrustNetwork?: boolean } = {}): ProgramSnapshot {
  const measurement: ActivityKey[] = key === "TEAM_SCAN"
    ? ["SELF_ASSESSMENT", "TEAM_OPERATING_STYLE", "PSYCH_SAFETY", "OBSERVER_360"]
    : ["TEAM_OPERATING_STYLE", "PSYCH_SAFETY"];
  return parseProgram({ key, version: 1,
    activities: [
      ...measurement.map(k => ({ key: k, scope: "participant", required: true,
        dependencies: key === "TEAM_SCAN" && k !== "SELF_ASSESSMENT" ? ["SELF_ASSESSMENT"] : [] })),
      ...(options.includeTrustNetwork ? [{ key: "TRUST_360", scope: "participant", required: false, dependencies: key === "TEAM_SCAN" ? ["SELF_ASSESSMENT"] : [] }] : []),
      { key: "REPORT_GENERATION", scope: "team", required: true, dependencies: measurement },
      { key: "CONSULTANT_REVIEW", scope: "team", required: true, dependencies: ["REPORT_GENERATION"] },
      { key: "PUBLISH", scope: "team", required: true, dependencies: ["CONSULTANT_REVIEW"] },
    ], policy: { ...DEFAULT_PROGRAM_POLICY },
  })!;
}
export function participantActivities(p: ProgramSnapshot) {
  return p.activities.filter(a => a.scope === "participant");
}
export interface ProgramCompletions { v: 1; activities: Record<string, unknown> }
export function isProgramCompletions(value: unknown): boolean {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const raw = value as Record<string, unknown>;
  return raw.__program === 1 || "v" in raw;
}
export function completionMap(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  const raw = value as Record<string, unknown>;
  if ("v" in raw) return raw.v === 1 && raw.activities && typeof raw.activities === "object" && !Array.isArray(raw.activities) ? raw.activities as Record<string, unknown> : {};
  return Object.fromEntries(Object.entries(raw).filter(([key]) => key !== "__program"));
}
export function programCompletions(value: unknown, completed?: ActivityKey): ProgramCompletions {
  return { v: 1, activities: { ...completionMap(value), ...(completed ? { [completed]: new Date().toISOString() } : {}) } };
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
  const paths: Record<string, string> = { SELF_ASSESSMENT: "/assessment", TEAM_OPERATING_STYLE: "/assessment/team-operating-style", PSYCH_SAFETY: "/assessment/psych-safety", OBSERVER_360: "/tasks/observers", TRUST_360: "/assessment/trust" };
  return `${paths[key] ?? "/tasks"}?campaignId=${encodeURIComponent(campaignId)}`;
}
export const PROGRAM_LABELS = {
  TEAM_SCAN: { hu: "Team Scan", en: "Team Scan" }, FOLLOW_UP: { hu: "Follow-up", en: "Follow-up" },
};
export const PROGRAM_DESCRIPTIONS = {
  TEAM_SCAN: { hu: "Személyiség, külső visszajelzés, csapatműködés, pszichológiai biztonság és tanácsadó által jóváhagyott riport.", en: "Personality, observer feedback, operating style, psychological safety and a consultant-reviewed report." },
  FOLLOW_UP: { hu: "Csapatműködés és pszichológiai biztonság újramérése, összehasonlítva egy korábbi Team Scannel. Nem kér új személyiségtesztet vagy observert.", en: "Remeasure operating style and psychological safety against a previous Team Scan, without repeating personality or observer assessments." },
};
