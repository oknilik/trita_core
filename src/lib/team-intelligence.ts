import { BELBIN_ROLES, getTopRoles } from "@/lib/belbin-scoring";
import { estimateBelbinFromHexaco } from "@/lib/belbin-estimate";
import type { SerializedTeamMember } from "@/lib/team-stats";

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
  id: "missing_assessments" | "missing_observer_round" | "role_coverage_gap" | "cohesion_risk";
  tone: "sage" | "amber" | "violet" | "rose";
  title: string;
  reason: string;
  ctaLabel: string;
  ctaHref: string;
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

export function resolveTeamIntelligenceQuality(
  assessedCount: number,
  totalCount: number,
): TeamIntelligenceEvidenceQuality {
  if (assessedCount === 0 || totalCount === 0) return "none";
  if (assessedCount < 3) return "partial";
  return "sufficient";
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
        "A pozíciók HEXACO self-assessmentből számolt becslések.",
        "Positions are estimated from HEXACO self-assessment data.",
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
        `A stabil csapatképhez legalább 3 kitöltés kell. Jelenleg még ${Math.max(3 - completedCount, 0)} hiányzik.`,
        `At least 3 completions are needed for a stable team view. ${Math.max(3 - completedCount, 0)} still missing.`,
      ),
      ctaLabel: tr(locale, "Tagok és állapot megnyitása", "Open members and status"),
      ctaHref: `/team/${teamId}?tab=members`,
    });
  }

  if (!hasObserverRound && orgId && canManageTeamActions && completedCount >= 3) {
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
      member.scores.H !== undefined &&
      member.scores.E !== undefined &&
      member.scores.X !== undefined &&
      member.scores.A !== undefined &&
      member.scores.C !== undefined &&
      member.scores.O !== undefined,
  );

  if (membersWithScores.length >= 4) {
    const keyRoles: Array<keyof typeof BELBIN_ROLES> = ["CO", "SH", "ME"];
    const presentTopRoles = new Set<keyof typeof BELBIN_ROLES>();
    membersWithScores.forEach((member) => {
      const scores = estimateBelbinFromHexaco({
        H: member.scores!.H,
        E: member.scores!.E,
        X: member.scores!.X,
        A: member.scores!.A,
        C: member.scores!.C,
        O: member.scores!.O,
      });
      const top = getTopRoles(scores, 1)[0]?.role;
      if (top) presentTopRoles.add(top);
    });

    const missingKeyRoles = keyRoles.filter((role) => !presentTopRoles.has(role));
    if (missingKeyRoles.length > 0) {
      const roleNames = missingKeyRoles
        .map((role) => (locale === "hu" ? BELBIN_ROLES[role].hu : BELBIN_ROLES[role].en))
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
        ctaHref: `/team/${teamId}?tab=belbin`,
      });
    }

    const cohesionValues = membersWithScores.map((member) =>
      (member.scores!.A + member.scores!.H) / 2,
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
