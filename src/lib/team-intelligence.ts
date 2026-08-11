import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import type { SerializedTeamMember } from "@/lib/team-stats";
import { isTeamManagerRole } from "@/lib/org-roles";
import { withHuArticle } from "@/lib/hu-grammar";
import { TRITAN_DIMENSIONS, TRITAN_DIMENSIONS_LOWER } from "@/lib/tritan";
import { mean, sampleStdDev } from "@/lib/stats/dimension-stats";

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
    | "leader_team_mismatch"
    | "healthy_baseline";
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
  /** Dinamika-élek száma összesen (mért + becsült). */
  dynamicsEdgeCount: number;
  /** Mért (trust_round / legacy observer forrású) élek száma. */
  measuredDynamicsEdgeCount: number;
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

// A dimenzió-szórás a közös, Bessel-korrekciós stats-helperből (sampleStdDev).

/**
 * A csapatkép „elégségessége" NEM csak abszolút kitöltés-szám kérdése:
 * a lefedettséget (kitöltő / tag) is figyelembe kell venni. 3/50 tag is
 * elérné az abszolút küszöböt, de a csapatnak 6%-a — ez legfeljebb részleges
 * kép. „sufficient" csak akkor, ha van legalább MIN_INTELLIGENCE_ASSESSMENTS
 * kitöltés ÉS a lefedettség a küszöb felett van; egyébként „partial".
 */
export const SUFFICIENT_COVERAGE_MIN = 0.5; // a tagok legalább fele

export function resolveTeamIntelligenceQuality(
  assessedCount: number,
  totalCount: number,
): TeamIntelligenceEvidenceQuality {
  if (assessedCount === 0 || totalCount === 0) return "none";
  if (assessedCount < MIN_INTELLIGENCE_ASSESSMENTS) return "partial";
  if (assessedCount / totalCount < SUFFICIENT_COVERAGE_MIN) return "partial";
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
  dynamicsEdgeCount,
  measuredDynamicsEdgeCount,
  locale,
}: BuildEvidenceInput): TeamIntelligenceEvidenceBySub {
  const mapQuality = resolveTeamIntelligenceQuality(assessedCount, totalCount);
  const roleQuality = resolveTeamIntelligenceQuality(assessedCount, totalCount);
  const hasDynamicsData = dynamicsEdgeCount > 0;
  // Csak MÉRT él emeli az evidenciát önértékelés fölé — a tisztán
  // profil-alapú becslés forrása "self", konfidenciája alacsony.
  const hasMeasuredDynamics = measuredDynamicsEdgeCount > 0;

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
      source: hasMeasuredDynamics ? "self_plus_observer" : "self",
      quality: hasDynamicsData ? "partial" : "none",
      confidence: hasMeasuredDynamics ? "medium" : "low",
      note: tr(
        locale,
        hasMeasuredDynamics
          ? "A kapcsolati minta részben mért bizalmi kör adatból épül."
          : hasDynamicsData
            ? "A kapcsolati minta profil-alapú becslés — mért adathoz bizalmi kör szükséges."
            : "A kapcsolati nézethez observer vagy peer-kapcsolati adat szükséges.",
        hasMeasuredDynamics
          ? "The relationship map partly builds on measured trust-round data."
          : hasDynamicsData
            ? "The relationship map is a profile-based estimate — a trust round provides measured data."
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

  if (memberCount > 0 && completedCount < MIN_INTELLIGENCE_ASSESSMENTS) {
    priorities.push({
      id: "missing_assessments",
      tone: "amber",
      title: tr(locale, "Hiányzó kitöltések", "Missing completions"),
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
      title: tr(locale, "Visszajelzési kör indítása", "Start feedback round"),
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
    const keyRoles: Array<keyof typeof TEAM_ROLES> = ["KO", "HA", "ER"];
    const presentTopRoles = new Set<keyof typeof TEAM_ROLES>();
    membersWithScores.forEach((member) => {
      // Precedencia a kanonikus szabályból (team-role-estimate):
      // kitöltött kérdőív > TRITAN-becslés; részleges score-ból nincs becslés.
      const resolved = resolveDisplayRoleScores(
        member.teamRoleSource === "questionnaire" ? member.teamRoleScores : null,
        member.scores,
      );
      if (!resolved) return;
      // S2: becslés-ágon az exact (kerekítetlen összeg) a holtverseny-
      // evidencia — enélkül a hash-fallback más elsődleges szerepet adhatna,
      // mint a többi felület.
      const top = getTopRoles(resolved.scores, 1, resolved.exact)[0]?.role;
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
    const cohesionSpread = sampleStdDev(cohesionValues);
    if (cohesionAverage < 45 || cohesionSpread > 18) {
      priorities.push({
        id: "cohesion_risk",
        tone: "rose",
        title: tr(locale, "Kohéziós kockázat", "Cohesion risk"),
        reason: tr(
          locale,
          `A kohézió-közelítő jelző átlaga ${Math.round(clamp(cohesionAverage, 0, 100))}% (szórás ±${Math.round(
            clamp(cohesionSpread, 0, 100),
          )}) — a barátságosság és a becsületesség-alázat átlagából számolt becslés.`,
          `The cohesion proxy averages ${Math.round(clamp(cohesionAverage, 0, 100))}% (spread ±${Math.round(
            clamp(cohesionSpread, 0, 100),
          )}) — an estimate computed from the agreeableness and honesty-humility averages.`,
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
          `${withHuArticle(TRITAN_DIMENSIONS_LOWER[maxSpread.dim].hu, { capitalize: true })} — ezen a tengelyen nagy a csapaton belüli eltérés (${Math.round(maxSpread.range)} pont), ami eltérő munkastílusokra utalhat.`,
          `${TRITAN_DIMENSIONS[maxSpread.dim].en} — this axis shows a wide spread within the team (${Math.round(maxSpread.range)} points), which may point to differing work styles.`,
        ),
        ctaLabel: tr(locale, "Csapatprofil megnyitása", "Open team profile"),
        ctaHref: `/team/${teamId}?tab=profile`,
      });
    }

    // A TeamMember.role kötött értékkészletű ("member" | "manager" | "admin",
    // ld. prisma séma) — a vezető a csapat-szintű kezelő szerep viselője.
    const leaderWithScores = membersWithScores.find((member) =>
      isTeamManagerRole(member.role),
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
            `A vezető becsületesség-alázat és barátságosság értéke láthatóan eltér a csapatátlagtól (${Math.round(
              leaderDeltaH,
            )}, illetve ${Math.round(leaderDeltaA)} pont). Ez becslés — érdemes beszélgetéssel validálni.`,
            `The leader's honesty-humility and agreeableness scores visibly differ from the team average (${Math.round(
              leaderDeltaH,
            )} and ${Math.round(leaderDeltaA)} points). This is an estimate — worth validating in conversation.`,
          ),
          ctaLabel: tr(locale, "Részletes csapatszerepek", "Open detailed team roles"),
          ctaHref: `/team/${teamId}?tab=teamRole`,
        });
      }
    }
  }

  if (priorities.length === 0 && missingAssessments === 0) {
    priorities.push({
      id: "healthy_baseline",
      tone: "sage",
      title: tr(locale, "Jó állapot", "Healthy baseline"),
      reason: tr(
        locale,
        "A jelenlegi adatok alapján nincs kritikus teendő; érdemes a következő visszajelzési körre készülni.",
        "No critical action detected from current data; plan the next observer round.",
      ),
      ctaLabel: tr(locale, "Csapatprofil megnyitása", "Open team profile"),
      ctaHref: `/team/${teamId}?tab=profile`,
    });
  }

  return priorities.slice(0, 3);
}
