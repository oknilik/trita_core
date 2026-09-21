import { CANDIDATE_LEADER_ROLES } from "@/lib/candidate-programs/share.server";
import { candidateSuggestions } from "@/lib/candidate-programs/suggestions";
import { referenceEvidence } from "@/lib/candidate-programs/reference-evidence";
import { isValidTeamRoleSelectionSet } from "@/lib/team-role-questions";
import { notFound } from "next/navigation";
import { getServerAuth } from "@/lib/auth-server";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import {
  requireCandidateConsultant,
  CandidateProgramError,
} from "@/lib/candidate-programs/service.server";
import { readCandidateProgram } from "@/lib/candidate-programs/core";
import { extractDimensionScores } from "@/lib/scoring";
import { CandidateReportWorkspace } from "@/components/candidate/CandidateReportWorkspace";
import { readComparisons } from "@/lib/candidate-programs/comparisons";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { t } from "@/lib/i18n";
import {
  calculateTeamRoleScores,
  getTopRoles,
  TEAM_ROLES,
} from "@/lib/team-role-scoring";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Jelölti profil | trita",
  robots: { index: false, follow: false },
};
export default async function CandidateResultPage({
  params,
}: {
  params: Promise<{ orgId: string; inviteId: string }>;
}) {
  const { orgId, inviteId } = await params;
  const { userId } = await getServerAuth();
  const locale = await getServerLocale();
  try {
    await requireCandidateConsultant(userId, orgId);
  } catch (e) {
    if (e instanceof CandidateProgramError) notFound();
    throw e;
  }
  const invite = await prisma.candidateInvite.findFirst({
    where: { id: inviteId, orgId },
    include: { result: true, report: true },
  });
  if (!invite) notFound();
  const p = readCandidateProgram(invite.programSnapshot);
  if (!p) notFound();
  const dimensions = extractDimensionScores(invite.result?.scores) ?? {};
  const comparisons = readComparisons(invite.report?.comparisons, p);
  if (!comparisons) notFound();
  const leaders = await prisma.organizationMember.findMany({
    where: {
      orgId,
      leftAt: null,
      role: { in: CANDIDATE_LEADER_ROLES },
      user: { deleted: false, clerkId: { not: null } },
    },
    select: { user: { select: { id: true, username: true, email: true } } },
    orderBy: { userId: "asc" },
  });
  const reports = await prisma.teamReport.findMany({
    where: {
      orgId,
      status: "PUBLISHED",
      campaign: {
        status: "CLOSED",
        OR: [
          { programKey: "TEAM_SCAN" },
          { programKey: null, presetId: "SCAN_STYLE_V1" },
        ],
      },
    },
    include: { team: { select: { name: true } } },
    orderBy: { publishedAt: "desc" },
  });
  const sources = reports.flatMap((r) => {
    const aggregate = r.aggregates as {
      completedCount?: number;
      dimensionAverages?: Record<string, number>;
    } | null;
    const values = extractDimensionScores(aggregate?.dimensionAverages ?? {});
    if (
      !r.publishedAt ||
      !Number.isInteger(aggregate?.completedCount) ||
      (aggregate?.completedCount ?? 0) < 3 ||
      !values ||
      !HEXACO_ORDER.every(
        (d) => Number.isFinite(values[d]) && values[d] >= 0 && values[d] <= 100,
      )
    )
      return [];
    return [
      {
        reportId: r.id,
        teamId: r.teamId,
        teamName: r.team.name,
        publishedAt: r.publishedAt.toISOString(),
        revision: r.revision,
        count: aggregate!.completedCount!,
      },
    ];
  });
  const invalidSources = comparisons
    .filter(
      (c) =>
        !sources.some(
          (s) => s.reportId === c.reportId && s.revision === c.revision,
        ),
    )
    .map((c) => c.reportId);
  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-7xl space-y-6 px-4 py-8"
    >
      <Link className="text-caption text-sage" href={`/hiring/${orgId}`}>
        {t("candidateProgram.title", locale)}
      </Link>
      {invite.result && invite.report ? (
        <CandidateReportWorkspace
          leaderRecipients={leaders.map(({ user }) => ({
            id: user.id,
            label: user.username || user.email || user.id,
          }))}
          suggestions={candidateSuggestions({
            dimensions,
            measuredAt: invite.completedAt?.toISOString().slice(0, 10) ?? "",
            locale,
            roleCompleted: invite.teamRoleState === "COMPLETED",
            roleSelections: invite.result.teamRoleSelections,
          })}
          comparisonSuggestions={Object.fromEntries(
            comparisons.map((c) => {
              const frozen = reports.find(
                (r) =>
                  r.id === c.reportId &&
                  r.teamId === c.teamId &&
                  r.revision === c.revision,
              );
              return [
                c.teamId,
                !frozen || invalidSources.includes(c.reportId)
                  ? []
                  : candidateSuggestions({
                      dimensions,
                      measuredAt:
                        invite.completedAt?.toISOString().slice(0, 10) ?? "",
                      locale,
                      roleCompleted: invite.teamRoleState === "COMPLETED",
                      roleSelections: invite.result!.teamRoleSelections,
                      comparison: {
                        ...c,
                        teamName: c.teamName || frozen.team.name,
                        evidence:
                          c.evidence ?? referenceEvidence(frozen.aggregates),
                      },
                    }),
              ];
            }),
          )}
          inviteId={invite.id}
          name={invite.name ?? t("candidateProgram.title", locale)}
          position={invite.position ?? ""}
          measuredAt={
            invite.completedAt?.toLocaleDateString(
              locale === "hu" ? "hu-HU" : "en-GB",
            ) ?? ""
          }
          dimensions={dimensions}
          comparisons={comparisons.map((c) => ({
            ...c,
            teamName:
              c.teamName ||
              sources.find((s) => s.teamId === c.teamId)?.teamName ||
              t("candidateProgram.team", locale),
          }))}
          sources={sources}
          invalidSources={invalidSources}
          report={{
            revision: invite.report.revision,
            reviewedRevision: invite.report.reviewedRevision,
            candidateSummary: invite.report.candidateSummary,
            managerSummary: invite.report.managerSummary,
            internalNotes: invite.report.internalNotes,
          }}
          locale={locale}
          focus={p.focus}
          rolePending={invite.teamRoleState === "PENDING"}
          roleLabel={
            p.includeTeamRole
              ? t(
                  invite.teamRoleState === "SKIPPED"
                    ? "candidateProgram.skipped"
                    : invite.teamRoleState === "COMPLETED"
                      ? "candidateProgram.completed"
                      : "candidateProgram.pending",
                  locale,
                )
              : undefined
          }
          roles={
            invite.teamRoleState === "COMPLETED" &&
            isValidTeamRoleSelectionSet(invite.result.teamRoleSelections)
              ? getTopRoles(
                  calculateTeamRoleScores(
                    invite.result.teamRoleSelections as TeamRoleSelections,
                  ),
                ).map((role) => TEAM_ROLES[role.role][locale])
              : []
          }
        />
      ) : (
        <p>{t("candidateProgram.reportPending", locale)}</p>
      )}
    </PlatformPageShell>
  );
}
