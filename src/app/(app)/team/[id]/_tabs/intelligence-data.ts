import { t, type Locale } from "@/lib/i18n";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import type { DynamicsEdge, IntelligenceMember } from "@/components/team/TeamIntelligence";
import {
  buildTeamIntelligenceEvidence,
  buildTeamIntelligencePriorities,
  MIN_INTELLIGENCE_ASSESSMENTS,
  resolveContributionPlacement,
  resolveTeamIntelligenceQuality,
} from "@/lib/team-intelligence";
import type { TeamPageData } from "./types";

const ZONE_NAMES_EN: Record<string, string> = {
  "3_1": "Emerging talent",
  "3_2": "High growth",
  "3_3": "Future leader",
  "2_1": "Developing",
  "2_2": "Solid contributor",
  "2_3": "High performer",
  "1_1": "Development focus",
  "1_2": "Stable contributor",
  "1_3": "Senior expert",
};

const ZONE_NAMES_HU: Record<string, string> = {
  "3_1": "Feltörekvő tehetség",
  "3_2": "Magas növekedés",
  "3_3": "Jövő vezetője",
  "2_1": "Fejlődik",
  "2_2": "Megbízható tag",
  "2_3": "Kiváló teljesítő",
  "1_1": "Fejlesztési fókusz",
  "1_2": "Stabil hozzájáruló",
  "1_3": "Senior szakértő",
};

function getZoneName(skill: 1 | 2 | 3, potential: 1 | 2 | 3, isHu: boolean): string {
  const names = isHu ? ZONE_NAMES_HU : ZONE_NAMES_EN;
  return names[`${potential}_${skill}`] ?? (isHu ? "Megbízható tag" : "Solid contributor");
}

/**
 * A csapatintelligencia nézet derivált adatai — tiszta számítás a
 * teamData-ból. Az intelligence tab ÉS az overview intelligencia-szekciója
 * is ezt hívja (olcsó, kétszeri hívás rendben).
 */
export function buildIntelligenceViewData(params: {
  teamData: TeamPageData;
  teamId: string;
  locale: Locale;
  isHu: boolean;
  canReachOrgCampaigns: boolean;
}) {
  const { teamData, teamId, locale, isHu, canReachOrgCampaigns } = params;

  const intelligenceMembers: IntelligenceMember[] = teamData.members.map((m) => {
    const tritan = m.scores
      ? {
          INTE: Math.round(m.scores.INTE ?? 50),
          RESO: Math.round(m.scores.RESO ?? 50),
          TEMP: Math.round(m.scores.TEMP ?? 50),
          ADAP: Math.round(m.scores.ADAP ?? 50),
          THOR: Math.round(m.scores.THOR ?? 50),
          OPEN: Math.round(m.scores.OPEN ?? 50),
        }
      : { INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50 };

    const placement = resolveContributionPlacement(tritan);

    return {
      id: m.userId,
      name: m.displayName,
      initials: getAvatarMonogram(m.displayName, { length: 2 }),
      tritan,
      measuredRoleScores:
        m.teamRoleSource === "questionnaire" && m.teamRoleScores
          ? m.teamRoleScores
          : null,
      hasAssessmentData: !!m.scores,
      skillLevel: placement.skillLevel,
      growthPotential: placement.growthPotential,
      deliveryScore: placement.deliveryScore,
      growthScore: placement.growthScore,
      placementConfidence: placement.confidence,
      zone: !m.scores
        ? t("teamComp.noDataZone", locale)
        : getZoneName(placement.skillLevel, placement.growthPotential, isHu),
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
  }));
  const hasDynamicsData = teamDynamicsEdges.length > 0;
  const mapQuality = resolveTeamIntelligenceQuality(assessedCount, totalCount);
  const intelligenceEvidenceBySub = buildTeamIntelligenceEvidence({
    assessedCount,
    totalCount,
    hasDynamicsData,
    locale: locale as "hu" | "en",
  });
  const intelligencePriorities = buildTeamIntelligencePriorities({
    members: teamData.members,
    completedCount: teamData.completedCount,
    memberCount: teamData.memberCount,
    teamId,
    orgId: teamData.orgId,
    hasObserverRound: !!teamData.activeCampaign,
    // Az observer-CTA az org kampány-oldalára visz → org-szerep dönt.
    canManageTeamActions: canReachOrgCampaigns,
    locale: locale as "hu" | "en",
  });
  const missingForStableIntelligence = Math.max(MIN_INTELLIGENCE_ASSESSMENTS - assessedCount, 0);
  const hasSufficientIntelligenceData = assessedCount >= MIN_INTELLIGENCE_ASSESSMENTS;
  const membersWithoutAssessment = teamData.members.filter((member) => !member.scores);
  const intelligenceQualityLabel =
    mapQuality === "sufficient"
      ? isHu ? "elegendő adat" : "sufficient data"
      : mapQuality === "partial"
        ? isHu ? "részleges adat" : "partial data"
        : isHu ? "nincs adat" : "no data";
  const dynamicsStateLabel =
    teamDynamicsEdges.length > 0
      ? (isHu ? "profil becslés" : "profile estimate")
      : (isHu ? "nincs adat" : "no data");

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
