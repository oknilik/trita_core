import { prisma } from "@/lib/prisma";
import { getTeamPageData } from "@/lib/team-stats";
import { estimateTeamRolesFromHexaco } from "@/lib/team-role-estimate";
import { TEAM_ROLES, getTopRoles, type TeamRoleScores } from "@/lib/team-role-scoring";
import { MIN_INTELLIGENCE_ASSESSMENTS } from "@/lib/team-intelligence";

// A publikált csapatkép aggregátum-pillanatképe. Publikáláskor fagy be —
// a validált kép nem változhat utólagos kitöltésektől.
// Terv: docs/product/team-report-gating-plan.md

export interface TeamReportAggregates {
  generatedAt: string;
  memberCount: number;
  completedCount: number;
  completionPct: number;
  /** Dimenzió-átlagok (H/E/X/A/C/O, 0-100) — csak MIN_INTELLIGENCE_ASSESSMENTS felett */
  dimensionAverages: Record<string, number> | null;
  /** Dimenziónkénti szórás — a csapat heterogenitása */
  dimensionSpread: Record<string, number> | null;
  pattern: { label: string; confidence: string } | null;
  /** Elsődleges csapatszerep-eloszlás (szerepkód → fő) + lefedettség */
  roleDistribution: {
    counts: Record<string, number>;
    questionnaireCount: number;
    estimateCount: number;
  } | null;
}

export interface SerializedTeamReport {
  id: string;
  teamId: string;
  status: "DRAFT" | "PUBLISHED";
  title: string | null;
  aggregates: TeamReportAggregates | null;
  summary: string | null;
  strengths: string | null;
  risks: string | null;
  recommendations: string | null;
  interviewFindings: string | null;
  /** Csak tanácsadói nézetben kerül kitöltésre */
  internalNotes: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const DIMS = ["H", "E", "X", "A", "C", "O"] as const;

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

export async function buildTeamReportAggregates(
  teamId: string,
): Promise<TeamReportAggregates | null> {
  const teamData = await getTeamPageData(teamId, "hu");
  if (!teamData) return null;

  const assessed = teamData.members.filter((m) => m.scores !== null);
  const completedCount = assessed.length;
  const memberCount = teamData.members.length;
  const hasMinimum = completedCount >= MIN_INTELLIGENCE_ASSESSMENTS;

  let dimensionAverages: Record<string, number> | null = null;
  let dimensionSpread: Record<string, number> | null = null;
  if (hasMinimum) {
    dimensionAverages = {};
    dimensionSpread = {};
    for (const dim of DIMS) {
      const values = assessed
        .map((m) => m.scores![dim])
        .filter((v): v is number => typeof v === "number");
      if (values.length === 0) continue;
      const avg = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance =
        values.reduce((sum, v) => sum + (v - avg) ** 2, 0) / values.length;
      dimensionAverages[dim] = Math.round(avg);
      dimensionSpread[dim] = round1(Math.sqrt(variance));
    }
  }

  let roleDistribution: TeamReportAggregates["roleDistribution"] = null;
  if (hasMinimum) {
    const counts: Record<string, number> = {};
    let questionnaireCount = 0;
    let estimateCount = 0;
    for (const member of assessed) {
      let scores: TeamRoleScores | null = null;
      if (member.teamRoleSource === "questionnaire" && member.teamRoleScores) {
        scores = member.teamRoleScores as TeamRoleScores;
        questionnaireCount++;
      } else if (member.scores && "H" in member.scores && "X" in member.scores) {
        scores = estimateTeamRolesFromHexaco(
          member.scores as Record<"H" | "E" | "X" | "A" | "C" | "O", number>,
        );
        estimateCount++;
      }
      if (!scores) continue;
      const top = getTopRoles(scores, 1)[0]?.role;
      if (top && top in TEAM_ROLES) {
        counts[top] = (counts[top] ?? 0) + 1;
      }
    }
    roleDistribution = { counts, questionnaireCount, estimateCount };
  }

  return {
    generatedAt: new Date().toISOString(),
    memberCount,
    completedCount,
    completionPct:
      memberCount > 0 ? Math.round((completedCount / memberCount) * 100) : 0,
    dimensionAverages,
    dimensionSpread,
    pattern:
      hasMinimum && teamData.patternResult
        ? {
            label: teamData.patternResult.fullLabel,
            confidence: String(teamData.patternResult.confidence ?? ""),
          }
        : null,
    roleDistribution,
  };
}

type TeamReportRecord = {
  id: string;
  teamId: string;
  status: string;
  title: string | null;
  aggregates: unknown;
  summary: string | null;
  strengths: string | null;
  risks: string | null;
  recommendations: string | null;
  interviewFindings: string | null;
  internalNotes: string | null;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export function serializeTeamReport(
  report: TeamReportRecord,
  options: { includeInternalNotes: boolean },
): SerializedTeamReport {
  return {
    id: report.id,
    teamId: report.teamId,
    status: report.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
    title: report.title,
    aggregates: (report.aggregates as TeamReportAggregates | null) ?? null,
    summary: report.summary,
    strengths: report.strengths,
    risks: report.risks,
    recommendations: report.recommendations,
    interviewFindings: report.interviewFindings,
    internalNotes: options.includeInternalNotes ? report.internalNotes : null,
    publishedAt: report.publishedAt?.toISOString() ?? null,
    createdAt: report.createdAt.toISOString(),
    updatedAt: report.updatedAt.toISOString(),
  };
}

export async function getLatestPublishedReport(
  teamId: string,
): Promise<SerializedTeamReport | null> {
  const report = await prisma.teamReport.findFirst({
    where: { teamId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
  });
  if (!report) return null;
  return serializeTeamReport(report, { includeInternalNotes: false });
}

export async function listTeamReports(
  teamId: string,
): Promise<SerializedTeamReport[]> {
  const reports = await prisma.teamReport.findMany({
    where: { teamId },
    orderBy: { createdAt: "desc" },
  });
  return reports.map((r) => serializeTeamReport(r, { includeInternalNotes: true }));
}
