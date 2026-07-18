import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import { estimateTeamRolesFromTritan } from "@/lib/team-role-estimate";
import type { SerializedTeamMember } from "@/lib/team-stats";

export const MIN_INTELLIGENCE_ASSESSMENTS = 3;
export type TeamIntelligenceSubTab = "map" | "dynamics" | "roles";
export type TeamIntelligenceEvidenceSource = "self" | "self_plus_observer" | "inferred";
export type TeamIntelligenceEvidenceQuality = "none" | "partial" | "sufficient";
export type TeamIntelligenceEvidenceConfidence = "low" | "medium" | "high";

export interface TeamIntelligenceEvidence {
  source: TeamIntelligenceEvidenceSource;
  quality: TeamIntelligenceEvidenceQuality;
  confidence: TeamIntelligenceEvidenceConfidence;
  note?: string;
}

export type TeamIntelligenceEvidenceBySub = Record<TeamIntelligenceSubTab, TeamIntelligenceEvidence>;

export interface TeamIntelligencePriority {
  id:
    | "missing_assessments"
    | "missing_observer_round"
    | "role_coverage_gap"
    | "cohesion_risk"
    | "dimension_spread"
    | "leader_team_mismatch";
  tone: "sage" | "amber" | "violet" | "rose";
  title: string;
  reason: string;
  ctaLabel: string;
  ctaHref: string;
}

export function resolveTeamTabRedirect(tab: string | undefined): "intelligence" | null {
  if (tab === "roles") return "intelligence";
  return null;
}

interface BuildEvidenceInput {
  assessedCount: number;
  totalCount: number;
  hasDynamicsData: boolean;
  locale: "hu" | "en";
}

interface BuildPrioritiesInput {
  members: SerializedTeamMember[];
  completedCount: number;
  memberCount: number;
  teamId: string;
  orgId: string | null;
  hasObserverRound: boolean;
  canManageTeamActions: boolean;
  locale: "hu" | "en";
}

function tr(locale: "hu" | "en", hu: string, en: string): string {
  return locale === "hu" ? hu : en;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function stdDev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  const variance = mean(values.map((value) => (value - avg) ** 2));
  return Math.sqrt(variance);
}

function isLikelyLeaderRole(role: string): boolean {
  const normalized = role.trim().toLowerCase();
  return (
    normalized.includes("manager") ||
    normalized.includes("lead") ||
    normalized.includes("owner") ||
    normalized.includes("admin")
  );
}

export function resolveTeamIntelligenceQuality(
  assessedCount: number,
  totalCount: number,
): TeamIntelligenceEvidenceQuality {
  if (assessedCount === 0 || totalCount === 0) return "none";
  if (assessedCount < MIN_INTELLIGENCE_ASSESSMENTS) return "partial";
  return "sufficient";
}

// ─── Contribution placement (team map) ──────────────────────────────────────
//
// Replaces the earlier single-dimension threshold heuristic (C → skill,
// (O+X)/2 → growth) with weighted composites over the TRITAN profile.
// Weights are a documented starting point, not a validated calibration:
// - delivery reliability: Conscientiousness dominates (planning, follow-
//   through), Honesty-Humility adds dependability, low Emotionality adds
//   stability under pressure.
// - growth/adaptability: Openness dominates (learning orientation),
//   eXtraversion adds approach energy, low Emotionality adds resilience.
// Confidence reflects distance from the banding thresholds: placements
// near a band edge are explicitly low-confidence.

export interface TritanProfile {
  INTE: number;
  RESO: number;
  TEMP: number;
  ADAP: number;
  THOR: number;
  OPEN: number;
}

export type PlacementLevel = 1 | 2 | 3;
export type PlacementConfidence = "low" | "medium" | "high";

export interface ContributionPlacement {
  /** 0-100 weighted composite: how reliably this person ships/delivers */
  deliveryScore: number;
  /** 0-100 weighted composite: learning/adaptability orientation */
  growthScore: number;
  skillLevel: PlacementLevel;
  growthPotential: PlacementLevel;
  confidence: PlacementConfidence;
  source: "self_estimate";
}

const DELIVERY_WEIGHTS: Partial<Record<keyof TritanProfile, number>> = {
  THOR: 0.6,
  INTE: 0.25,
  RESO: 0.15, // inverted: stability = 100 - E
};

const GROWTH_WEIGHTS: Partial<Record<keyof TritanProfile, number>> = {
  OPEN: 0.5,
  TEMP: 0.3,
  RESO: 0.2, // inverted: resilience = 100 - E
};

const INVERTED_DIMS: ReadonlySet<keyof TritanProfile> = new Set(["RESO"]);

const BAND_LOW = 40;
const BAND_HIGH = 60;
// Composite within this distance of a band edge → placement is uncertain
const LOW_CONFIDENCE_MARGIN = 5;
const MEDIUM_CONFIDENCE_MARGIN = 10;

function weightedComposite(
  tritan: TritanProfile,
  weights: Partial<Record<keyof TritanProfile, number>>,
): number {
  let sum = 0;
  let totalWeight = 0;
  for (const [dim, weight] of Object.entries(weights) as Array<
    [keyof TritanProfile, number]
  >) {
    const raw = tritan[dim];
    if (typeof raw !== "number" || Number.isNaN(raw)) continue;
    const value = INVERTED_DIMS.has(dim) ? 100 - raw : raw;
    sum += value * weight;
    totalWeight += weight;
  }
  if (totalWeight <= 0) return 50;
  return Math.round(sum / totalWeight);
}

function toBand(score: number): PlacementLevel {
  if (score >= BAND_HIGH) return 3;
  if (score >= BAND_LOW) return 2;
  return 1;
}

function boundaryDistance(score: number): number {
  return Math.min(Math.abs(score - BAND_LOW), Math.abs(score - BAND_HIGH));
}

export function resolveContributionPlacement(
  tritan: TritanProfile,
): ContributionPlacement {
  const deliveryScore = weightedComposite(tritan, DELIVERY_WEIGHTS);
  const growthScore = weightedComposite(tritan, GROWTH_WEIGHTS);

  const minDistance = Math.min(
    boundaryDistance(deliveryScore),
    boundaryDistance(growthScore),
  );
  const confidence: PlacementConfidence =
    minDistance < LOW_CONFIDENCE_MARGIN
      ? "low"
      : minDistance < MEDIUM_CONFIDENCE_MARGIN
        ? "medium"
        : "high";

  return {
    deliveryScore,
    growthScore,
    skillLevel: toBand(deliveryScore),
    growthPotential: toBand(growthScore),
    confidence,
    source: "self_estimate",
  };
}

export function resolveTeamIntelligenceConfidence(
  quality: TeamIntelligenceEvidenceQuality,
): TeamIntelligenceEvidenceConfidence {
  if (quality === "sufficient") return "high";
  if (quality === "partial") return "medium";
  return "low";
}

export function buildTeamIntelligenceEvidence({
  assessedCount,
  totalCount,
  hasDynamicsData,
  locale,
}: BuildEvidenceInput): TeamIntelligenceEvidenceBySub {
  const mapQuality = resolveTeamIntelligenceQuality(assessedCount, totalCount);
  const roleQuality = resolveTeamIntelligenceQuality(assessedCount, totalCount);

  return {
    map: {
      source: "self",
      quality: mapQuality,
      confidence: resolveTeamIntelligenceConfidence(mapQuality),
      note: tr(
        locale,
        "A pozíciók az önértékelő személyiségfelmérésből számolt becslések.",
        "Positions are estimated from self-assessment data.",
      ),
    },
    dynamics: {
      source: "self_plus_observer",
      quality: hasDynamicsData ? "partial" : "none",
      confidence: hasDynamicsData ? "medium" : "low",
      note: tr(
        locale,
        hasDynamicsData
          ? "A kapcsolati minta observer/peer adatokból épül."
          : "A kapcsolati nézethez observer vagy peer-kapcsolati adat szükséges.",
        hasDynamicsData
          ? "Relationship map is based on observer/peer data."
          : "Relationship view requires observer or peer-connection data.",
      ),
    },
    roles: {
      source: "inferred",
      quality: roleQuality,
      confidence: roleQuality === "sufficient" ? "medium" : "low",
      note: tr(
        locale,
        "A csapatszerep illeszkedés személyiség-alapú becslés.",
        "Role fit is a personality-based estimate.",
      ),
    },
  };
}

export function buildTeamIntelligencePriorities({
  members,
  completedCount,
  memberCount,
  teamId,
  orgId,
  hasObserverRound,
  canManageTeamActions,
  locale,
}: BuildPrioritiesInput): TeamIntelligencePriority[] {
  const priorities: TeamIntelligencePriority[] = [];
  const missingAssessments = Math.max(memberCount - completedCount, 0);

  if (memberCount > 0 && completedCount < 3) {
    priorities.push({
      id: "missing_assessments",
      tone: "amber",
      title: tr(locale, "Hiányzó assessment kitöltések", "Missing assessment completions"),
      reason: tr(
        locale,
        `A stabil csapatképhez legalább ${MIN_INTELLIGENCE_ASSESSMENTS} kitöltés kell. Jelenleg még ${Math.max(MIN_INTELLIGENCE_ASSESSMENTS - completedCount, 0)} hiányzik.`,
        `At least ${MIN_INTELLIGENCE_ASSESSMENTS} completions are needed for a stable team view. ${Math.max(MIN_INTELLIGENCE_ASSESSMENTS - completedCount, 0)} still missing.`,
      ),
      ctaLabel: tr(locale, "Tagok és állapot megnyitása", "Open members and status"),
      ctaHref: `/team/${teamId}?tab=members`,
    });
  }

  if (
    !hasObserverRound &&
    orgId &&
    canManageTeamActions &&
    completedCount >= MIN_INTELLIGENCE_ASSESSMENTS
  ) {
    priorities.push({
      id: "missing_observer_round",
      tone: "violet",
      title: tr(locale, "Observer kör indítása", "Start observer round"),
      reason: tr(
        locale,
        "A csapatdinamikához observer visszajelzés kell, ez még nem aktív.",
        "Observer feedback is needed for team dynamics, and it is not active yet.",
      ),
      ctaLabel: tr(locale, "Visszajelzési kör indítása", "Start feedback round"),
      ctaHref: `/org/${orgId}?tab=campaigns`,
    });
  }

  const membersWithScores = members.filter(
    (member) =>
      !!member.scores &&
      member.scores.INTE !== undefined &&
      member.scores.RESO !== undefined &&
      member.scores.TEMP !== undefined &&
      member.scores.ADAP !== undefined &&
      member.scores.THOR !== undefined &&
      member.scores.OPEN !== undefined,
  );

  if (membersWithScores.length >= 4) {
    const keyRoles: Array<keyof typeof TEAM_ROLES> = ["CO", "SH", "ME"];
    const presentTopRoles = new Set<keyof typeof TEAM_ROLES>();
    membersWithScores.forEach((member) => {
      // Prefer the real questionnaire result; estimate only as fallback
      const scores =
        member.teamRoleSource === "questionnaire" && member.teamRoleScores
          ? (member.teamRoleScores as Record<keyof typeof TEAM_ROLES, number>)
          : estimateTeamRolesFromTritan({
              INTE: member.scores!.INTE,
              RESO: member.scores!.RESO,
              TEMP: member.scores!.TEMP,
              ADAP: member.scores!.ADAP,
              THOR: member.scores!.THOR,
              OPEN: member.scores!.OPEN,
            });
      const top = getTopRoles(scores, 1)[0]?.role;
      if (top) presentTopRoles.add(top);
    });

    const missingKeyRoles = keyRoles.filter((role) => !presentTopRoles.has(role));
    if (missingKeyRoles.length > 0) {
      const roleNames = missingKeyRoles
        .map((role) => (locale === "hu" ? TEAM_ROLES[role].hu : TEAM_ROLES[role].en))
        .join(", ");
      priorities.push({
        id: "role_coverage_gap",
        tone: "sage",
        title: tr(locale, "Hiányzó kulcsszerep", "Missing key role"),
        reason: tr(
          locale,
          `A becsült szerepképben nem látszik: ${roleNames}.`,
          `Estimated role map is missing: ${roleNames}.`,
        ),
        ctaLabel: tr(locale, "Részletes csapatszerepek", "Open detailed team roles"),
        ctaHref: `/team/${teamId}?tab=teamRole`,
      });
    }

    const cohesionValues = membersWithScores.map((member) =>
      (member.scores!.ADAP + member.scores!.INTE) / 2,
    );
    const cohesionAverage = mean(cohesionValues);
    const cohesionSpread = stdDev(cohesionValues);
    if (cohesionAverage < 45 || cohesionSpread > 18) {
      priorities.push({
        id: "cohesion_risk",
        tone: "rose",
        title: tr(locale, "Kohéziós kockázat", "Cohesion risk"),
        reason: tr(
          locale,
          `A kohézió átlag ${Math.round(clamp(cohesionAverage, 0, 100))}% (szórás: ±${Math.round(
            clamp(cohesionSpread, 0, 100),
          )}).`,
          `Cohesion average is ${Math.round(clamp(cohesionAverage, 0, 100))}% (spread: ±${Math.round(
            clamp(cohesionSpread, 0, 100),
          )}).`,
        ),
        ctaLabel: tr(locale, "Személyiségprofil megnyitása", "Open personality profile"),
        ctaHref: `/team/${teamId}?tab=profile`,
      });
    }

    const dimensions = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;
    const maxSpread = dimensions.reduce(
      (best, dim) => {
        const values = membersWithScores
          .map((member) => member.scores?.[dim])
          .filter((value): value is number => typeof value === "number");
        if (values.length < 2) return best;
        const currentMin = Math.min(...values);
        const currentMax = Math.max(...values);
        const currentRange = currentMax - currentMin;
        if (currentRange > best.range) {
          return { dim, range: currentRange };
        }
        return best;
      },
      { dim: "TEMP" as (typeof dimensions)[number], range: 0 },
    );

    if (maxSpread.range >= 32) {
      priorities.push({
        id: "dimension_spread",
        tone: "rose",
        title: tr(locale, "Magas dimenzió-szórás", "High dimension spread"),
        reason: tr(
          locale,
          `A(z) ${maxSpread.dim} tengelyen szélsőséges a szórás (${Math.round(maxSpread.range)} pont), ami együttműködési feszültséget jelezhet.`,
          `${maxSpread.dim} shows a wide spread (${Math.round(maxSpread.range)} points), which may create collaboration friction.`,
        ),
        ctaLabel: tr(locale, "Csapatprofil megnyitása", "Open team profile"),
        ctaHref: `/team/${teamId}?tab=profile`,
      });
    }

    const leaderWithScores = membersWithScores.find((member) =>
      isLikelyLeaderRole(member.role),
    );
    if (leaderWithScores) {
      const teamAverageH = mean(
        membersWithScores
          .map((member) => member.scores?.INTE)
          .filter((value): value is number => typeof value === "number"),
      );
      const teamAverageA = mean(
        membersWithScores
          .map((member) => member.scores?.ADAP)
          .filter((value): value is number => typeof value === "number"),
      );
      const leaderDeltaH = Math.abs((leaderWithScores.scores?.INTE ?? teamAverageH) - teamAverageH);
      const leaderDeltaA = Math.abs((leaderWithScores.scores?.ADAP ?? teamAverageA) - teamAverageA);

      if (leaderDeltaH >= 18 || leaderDeltaA >= 18) {
        priorities.push({
          id: "leader_team_mismatch",
          tone: "amber",
          title: tr(
            locale,
            "Vezető-csapat értékrend eltérés",
            "Leader-team value mismatch",
          ),
          reason: tr(
            locale,
            `A vezető H/A profilja szignifikánsan eltér a csapatátlagtól (ΔH: ${Math.round(
              leaderDeltaH,
            )}, ΔA: ${Math.round(leaderDeltaA)}).`,
            `Leader H/A profile deviates from team average (ΔH: ${Math.round(
              leaderDeltaH,
            )}, ΔA: ${Math.round(leaderDeltaA)}).`,
          ),
          ctaLabel: tr(locale, "Részletes csapatszerepek", "Open detailed team roles"),
          ctaHref: `/team/${teamId}?tab=teamRole`,
        });
      }
    }
  }

  if (priorities.length === 0 && missingAssessments === 0) {
    priorities.push({
      id: "role_coverage_gap",
      tone: "sage",
      title: tr(locale, "Jó állapot", "Healthy baseline"),
      reason: tr(
        locale,
        "A jelenlegi adatok alapján nincs kritikus teendő; érdemes a következő observer körre készülni.",
        "No critical action detected from current data; plan the next observer round.",
      ),
      ctaLabel: tr(locale, "Csapatprofil megnyitása", "Open team profile"),
      ctaHref: `/team/${teamId}?tab=profile`,
    });
  }

  return priorities.slice(0, 3);
}
