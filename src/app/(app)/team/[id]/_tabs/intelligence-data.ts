import { t, type Locale } from "@/lib/i18n";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import type { DynamicsEdge, IntelligenceMember } from "@/components/team/TeamIntelligence";
import {
  buildTeamIntelligenceEvidence,
  buildTeamIntelligencePriorities,
  MIN_INTELLIGENCE_ASSESSMENTS,
  resolveTeamIntelligenceQuality,
} from "@/lib/team-intelligence";
import { isMeasuredDynamicsSource } from "@/lib/friction-model";
import { hasCompleteTritanDims } from "@/lib/team-role-estimate";
import type { TritanDimCode } from "@/lib/tritan";
import type { TeamPageData } from "./types";

const TRITAN_DIM_CODES: readonly TritanDimCode[] = [
  "INTE",
  "RESO",
  "TEMP",
  "ADAP",
  "THOR",
  "OPEN",
];

/**
 * A csapatintelligencia nézet derivált adatai — tiszta számítás a
 * teamData-ból. Az intelligence tab ÉS az overview intelligencia-szekciója
 * is ezt hívja (olcsó, kétszeri hívás rendben).
 */
export function buildIntelligenceViewData(params: {
  teamData: TeamPageData;
  teamId: string;
  locale: Locale;
  canReachOrgCampaigns: boolean;
}) {
  const { teamData, teamId, locale, canReachOrgCampaigns } = params;

  const intelligenceMembers: IntelligenceMember[] = teamData.members.map((m) => {
    // Csak a TÉNYLEGESEN mért dimenziók mennek tovább — a korábbi `?? 50`
    // default kitalált profilt gyártott (kitöltetlen tagnál „E 50%" badge,
    // becsült szerepprofil, hamis pár-bontás a dinamika-térképen), és a
    // hasCompleteTritanDims downstream kapuit is kijátszotta.
    const tritan: IntelligenceMember["tritan"] = {};
    for (const code of TRITAN_DIM_CODES) {
      const value = m.scores?.[code];
      if (typeof value === "number") tritan[code] = Math.round(value);
    }
    return {
      id: m.userId,
      name: m.displayName,
      initials: getAvatarMonogram(m.displayName, { length: 2 }),
      tritan,
      measuredRoleScores:
        m.teamRoleSource === "questionnaire" && m.teamRoleScores
          ? m.teamRoleScores
          : null,
      // Assessment-adat csak TELJES fő-dimenzió-készletnél „van" — részleges
      // (örökség/sérült) score-sorból nem állítunk profilt.
      hasAssessmentData: hasCompleteTritanDims(m.scores),
      isTrustHub: teamData.trustHubUserIds.includes(m.userId),
      color: getAvatarGradient(m.displayName)[0],
      textColor: "var(--color-neutral-white)",
    };
  });

  const assessedCount = intelligenceMembers.filter((m) => m.hasAssessmentData).length;
  const totalCount = intelligenceMembers.length;
  const teamDynamicsEdges: DynamicsEdge[] = teamData.dynamicsEdges.map((edge) => ({
    from: edge.fromUserId,
    to: edge.toUserId,
    type: edge.type as DynamicsEdge["type"],
    source: edge.source,
    confidence: edge.confidence,
  }));
  const hasDynamicsData = teamDynamicsEdges.length > 0;
  // Mért = trust-kör (vagy legacy observer) forrású él; a többi profil-becslés.
  // Közös definíció a friction-model.ts-ből (a DynamicsMap és a cockpit is ezt hívja).
  const measuredDynamicsEdgeCount = teamDynamicsEdges.filter((e) =>
    isMeasuredDynamicsSource(e.source),
  ).length;
  const estimatedDynamicsEdgeCount = teamDynamicsEdges.length - measuredDynamicsEdgeCount;
  const mapQuality = resolveTeamIntelligenceQuality(assessedCount, totalCount);
  const intelligenceEvidenceBySub = buildTeamIntelligenceEvidence({
    assessedCount,
    totalCount,
    dynamicsEdgeCount: teamDynamicsEdges.length,
    measuredDynamicsEdgeCount,
    locale: locale as "hu" | "en",
  });
  // Observer-kör: a kampány mérés-lépései közt van külső/relációs kör —
  // a puszta kampány-lét (pl. csak pulse) még nem az.
  const campaignStepTypes =
    teamData.activeCampaign?.stepProgress.map((s) => s.type) ?? [];
  const hasObserverRound =
    campaignStepTypes.includes("OBSERVER_360") ||
    campaignStepTypes.includes("TRUST_360");
  const intelligencePriorities = buildTeamIntelligencePriorities({
    members: teamData.members,
    completedCount: teamData.completedCount,
    memberCount: teamData.memberCount,
    teamId,
    orgId: teamData.orgId,
    hasObserverRound,
    // Az observer-CTA az org kampány-oldalára visz → org-szerep dönt.
    canManageTeamActions: canReachOrgCampaigns,
    locale: locale as "hu" | "en",
  });
  const missingForStableIntelligence = Math.max(MIN_INTELLIGENCE_ASSESSMENTS - assessedCount, 0);
  const hasSufficientIntelligenceData = assessedCount >= MIN_INTELLIGENCE_ASSESSMENTS;
  const membersWithoutAssessment = teamData.members.filter((member) => !member.scores);
  const intelligenceQualityLabel =
    mapQuality === "sufficient"
      ? t("teamComp.mapStateSufficient", locale)
      : mapQuality === "partial"
        ? t("teamComp.mapStatePartial", locale)
        : t("teamComp.mapStateNone", locale);
  const dynamicsStateLabel = !hasDynamicsData
    ? t("teamComp.dynamicsStateNone", locale)
    : measuredDynamicsEdgeCount === 0
      ? t("teamComp.dynamicsStateEstimated", locale)
      : estimatedDynamicsEdgeCount === 0
        ? t("teamComp.dynamicsStateMeasured", locale)
        : t("teamComp.dynamicsStateMixed", locale);

  return {
    intelligenceMembers,
    assessedCount,
    totalCount,
    teamDynamicsEdges,
    hasDynamicsData,
    intelligenceEvidenceBySub,
    intelligencePriorities,
    missingForStableIntelligence,
    hasSufficientIntelligenceData,
    membersWithoutAssessment,
    intelligenceQualityLabel,
    dynamicsStateLabel,
  };
}
