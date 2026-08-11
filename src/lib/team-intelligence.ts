import { TEAM_ROLES, getTopRoles } from "@/lib/team-role-scoring";
import { resolveDisplayRoleScores } from "@/lib/team-role-estimate";
import { tf } from "@/lib/i18n";
import type { SerializedTeamMember } from "@/lib/team-stats";
import { isTeamManagerRole } from "@/lib/org-roles";
import { withHuArticle } from "@/lib/hu-grammar";
import { HEXACO_DIMENSIONS, HEXACO_DIMENSIONS_LOWER } from "@/lib/hexaco";
import { mean, sampleStdDev } from "@/lib/stats/dimension-stats";

export const MIN_INTELLIGENCE_ASSESSMENTS = 3;
export type TeamIntelligenceSubTab = "map" | "dynamics" | "roles";
// FORRÁS-CÍMKÉK. A `self_plus_trust` néven futó érték korábban
// `self_plus_observer` volt, és „Önértékelés + külső visszajelzés"-ként
// renderelt — csakhogy a mért dinamika-élt a BIZALMI KÖR adja
// (isMeasuredDynamicsSource, friction-model), az observer-kör nem járul
// hozzá. A badge tehát olyan evidenciát állított, ami nincs mögötte. Egy
// olyan termékben, ahol a forrás-jelölés a hitelességi alapelv, ez nem
// kozmetikai hiba. (2026-08-11)
export type TeamIntelligenceEvidenceSource = "self" | "self_plus_trust" | "inferred";
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

export function resolveTeamTabRedirect(
  tab: string | undefined,
): { tab: "intelligence" | "members"; anchor?: string } | null {
  if (tab === "roles" || tab === "teamRole") {
    return { tab: "intelligence", anchor: "#team-roles" };
  }
  if (tab === "profile") {
    return { tab: "intelligence", anchor: "#team-profile" };
  }
  if (tab === "feedback") {
    return { tab: "members", anchor: "#feedback" };
  }
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
      source: hasMeasuredDynamics ? "self_plus_trust" : "self",
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
      member.scores.H !== undefined &&
      member.scores.E !== undefined &&
      member.scores.X !== undefined &&
      member.scores.A !== undefined &&
      member.scores.C !== undefined &&
      member.scores.O !== undefined,
  );

  if (membersWithScores.length >= 4) {
    const keyRoles: Array<keyof typeof TEAM_ROLES> = ["KO", "HA", "ER"];
    const presentTopRoles = new Set<keyof typeof TEAM_ROLES>();
    // Szerep-lefedettség MINDEN tagból: a MÉRT szerep-kérdőívhez nem kell
    // személyiség-teszt (korábban a scores-szűrt részhalmaz iterálódott, így
    // egy teszt nélküli tag mért szerepe kiesett → hamis „hiányzó
    // kulcsszerep" jelzés). A forrás-számláló a copy-változatot dönti el.
    let measuredRoleCount = 0;
    let estimatedRoleCount = 0;
    members.forEach((member) => {
      // Precedencia a kanonikus szabályból (team-role-estimate):
      // kitöltött kérdőív > TRITAN-becslés; részleges score-ból nincs becslés.
      const resolved = resolveDisplayRoleScores(
        member.teamRoleSource === "questionnaire" ? member.teamRoleScores : null,
        member.scores,
      );
      if (!resolved) return;
      if (resolved.source === "questionnaire") measuredRoleCount += 1;
      else estimatedRoleCount += 1;
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
      // Forrás-tudatos indoklás: tisztán mért szerepképre nem írhatjuk,
      // hogy „becsült" (hitelességi alapelv — forrás-jelölés kötelező).
      const roleGapReasonKey =
        measuredRoleCount > 0 && estimatedRoleCount === 0
          ? "teamComp.roleGapReasonMeasured"
          : measuredRoleCount > 0
            ? "teamComp.roleGapReasonMixed"
            : "teamComp.roleGapReasonEstimated";
      priorities.push({
        id: "role_coverage_gap",
        tone: "sage",
        title: tr(locale, "Hiányzó kulcsszerep", "Missing key role"),
        reason: tf(roleGapReasonKey, locale, { roles: roleNames }),
        ctaLabel: tr(locale, "Részletes csapatszerepek", "Open detailed team roles"),
        ctaHref: `/team/${teamId}?tab=intelligence#team-roles`,
      });
    }

    const cohesionValues = membersWithScores.map((member) =>
      (member.scores!.A + member.scores!.H) / 2,
    );
    const cohesionAverage = mean(cohesionValues);
    // A szórás továbbra is a kockázat-jelzés EGYIK kiváltója (magas belső
    // eltérés alacsony átlag nélkül is kohéziós kockázat), de számként nem
    // jelenik meg a szövegben — 2026-08-11 termékdöntés: ± szám nincs a UI-n.
    const cohesionSpread = sampleStdDev(cohesionValues);
    if (cohesionAverage < 45 || cohesionSpread > 18) {
      priorities.push({
        id: "cohesion_risk",
        tone: "rose",
        title: tr(locale, "Kohéziós kockázat", "Cohesion risk"),
        reason: tr(
          locale,
          `A kohézió-közelítő jelző átlaga ${Math.round(clamp(cohesionAverage, 0, 100))}% — a barátságosság és a becsületesség-alázat átlagából számolt becslés.`,
          `The cohesion proxy averages ${Math.round(clamp(cohesionAverage, 0, 100))}% — an estimate computed from the agreeableness and honesty-humility averages.`,
        ),
        ctaLabel: tr(locale, "Személyiségprofil megnyitása", "Open personality profile"),
        ctaHref: `/team/${teamId}?tab=intelligence#team-profile`,
      });
    }

    const dimensions = ["H", "E", "X", "A", "C", "O"] as const;
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
      { dim: "X" as (typeof dimensions)[number], range: 0 },
    );

    if (maxSpread.range >= 32) {
      priorities.push({
        id: "dimension_spread",
        tone: "rose",
        title: tr(locale, "Magas dimenzió-szórás", "High dimension spread"),
        // 2026-08-11 termékdöntés: dispersió/eltérés SZÁMKÉNT nem jelenik meg a
        // UI-n (mint a cohesion_risk-nél). A szórás továbbra is a kiváltó, de a
        // „(N pont)" kikerül a szövegből.
        reason: tr(
          locale,
          `${withHuArticle(HEXACO_DIMENSIONS_LOWER[maxSpread.dim].hu, { capitalize: true })} — ezen a tengelyen nagy a csapaton belüli eltérés, ami eltérő munkastílusokra utalhat.`,
          `${HEXACO_DIMENSIONS[maxSpread.dim].en} — this axis shows a wide spread within the team, which may point to differing work styles.`,
        ),
        ctaLabel: tr(locale, "Csapatprofil megnyitása", "Open team profile"),
        ctaHref: `/team/${teamId}?tab=intelligence#team-profile`,
      });
    }

    // A TeamMember.role kötött értékkészletű ("member" | "manager" | "admin",
    // ld. prisma séma) — a vezető a csapat-szintű kezelő szerep viselője.
    const leaderWithScores = membersWithScores.find((member) =>
      isTeamManagerRole(member.role),
    );
    if (leaderWithScores) {
      // A vezetőt KIZÁRJUK a bázisból: önmagával átlagolva tompítaná a deltát
      // (kis csapatban a vezető a bázis jelentős része). Csak akkor van értelmes
      // összevetés, ha van legalább egy nem-vezető tag.
      const nonLeaderMembers = membersWithScores.filter(
        (member) => member !== leaderWithScores,
      );
      const teamAverageH = mean(
        nonLeaderMembers
          .map((member) => member.scores?.H)
          .filter((value): value is number => typeof value === "number"),
      );
      const teamAverageA = mean(
        nonLeaderMembers
          .map((member) => member.scores?.A)
          .filter((value): value is number => typeof value === "number"),
      );
      const leaderDeltaH = Math.abs((leaderWithScores.scores?.H ?? teamAverageH) - teamAverageH);
      const leaderDeltaA = Math.abs((leaderWithScores.scores?.A ?? teamAverageA) - teamAverageA);

      if (nonLeaderMembers.length > 0 && (leaderDeltaH >= 18 || leaderDeltaA >= 18)) {
        priorities.push({
          id: "leader_team_mismatch",
          tone: "amber",
          title: tr(
            locale,
            "Vezető-csapat értékrend eltérés",
            "Leader-team value mismatch",
          ),
          // 2026-08-11 termékdöntés: a delta SZÁMKÉNT nem jelenik meg a UI-n.
          reason: tr(
            locale,
            `A vezető becsületesség-alázat és barátságosság értéke láthatóan eltér a csapatátlagtól. Ez becslés — érdemes beszélgetéssel validálni.`,
            `The leader's honesty-humility and agreeableness scores visibly differ from the team average. This is an estimate — worth validating in conversation.`,
          ),
          ctaLabel: tr(locale, "Részletes csapatszerepek", "Open detailed team roles"),
          ctaHref: `/team/${teamId}?tab=intelligence#team-roles`,
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
      ctaHref: `/team/${teamId}?tab=intelligence#team-profile`,
    });
  }

  return priorities.slice(0, 3);
}
