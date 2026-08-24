import { listTeamReports } from "@/lib/team-report";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamReportEditor } from "@/components/team/TeamReportEditor";
import { TeamReportView } from "@/components/team/TeamReportView";
import { TeamReportMemberView } from "@/components/team/TeamReportMemberView";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";
import { prisma } from "@/lib/prisma";

export async function ReportTabView({
  ctx,
  campaignId: requestedCampaignId,
}: {
  ctx: TeamTabContext;
  campaignId?: string;
}) {
  const { teamId, teamData, isHu, canViewRaw, isOrgManager, publishedReport, profile } = ctx;
  const [consultantReports, reportCampaign] = canViewRaw
    ? await Promise.all([
        listTeamReports(teamId),
        prisma.campaign.findFirst({
          where: {
            ...(requestedCampaignId ? { id: requestedCampaignId } : {}),
            orgId: teamData.orgId ?? undefined,
            status: "CLOSED",
            presetId: "SCAN_V1",
            OR: [{ teamId }, { teamIds: { has: teamId } }],
          },
          orderBy: { closedAt: "desc" },
          select: { id: true },
        }),
      ])
    : [[], null];

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamHeroBlock ctx={ctx} active="report" />

      {canViewRaw ? (
        <TeamReportEditor
          teamId={teamId}
          orgId={teamData.orgId}
          reports={consultantReports}
          campaignId={reportCampaign?.id ?? null}
          isHu={isHu}
        />
      ) : publishedReport ? (
        // Szerep-metszet: menedzser/admin (teamManage) a teljes riportot
        // látja; a sima ORG_MEMBER a szűkebb, saját szemszögű tag-nézetet.
        // Terv: docs/product/feature-ideas.md #4.
        isOrgManager ? (
          <TeamReportView report={publishedReport} isHu={isHu} canManageActions />
        ) : (
          <TeamReportMemberView
            report={publishedReport}
            viewer={teamData.members.find((m) => m.userId === profile.id) ?? null}
            isHu={isHu}
            teamName={teamData.teamName}
          />
        )
      ) : null}
    </PlatformPageShell>
  );
}
