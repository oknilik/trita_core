import { prisma } from "@/lib/prisma";
import { buildTeamPeerRoleProfiles } from "@/lib/team-role-peer.server";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamRoleSection } from "@/components/team/TeamRoleSection";
import { TeamRoleRoundCard } from "@/components/team/TeamRoleRoundCard";
import { TeamTabBar } from "./TeamTabBar";
import type { TeamTabContext } from "./types";

// ── TeamRole tab ───────────────────────────────────────────────────────────
export async function TeamRoleTabView({ ctx }: { ctx: TeamTabContext }) {
  const { teamId, teamData, isHu, isOrgManager } = ctx;

  const teamRoleTeam = await prisma.team.findUnique({
    where: { id: teamId },
    select: { teamRoleRoundActive: true, teamRoleRoundStartedAt: true },
  });
  const teamRoleMembers = await prisma.teamMember.findMany({
    where: { teamId },
    select: {
      userId: true,
      user: {
        select: {
          username: true,
          teamRoleScores: {
            orderBy: { createdAt: "desc" },
            take: 1,
            select: { source: true, updatedAt: true },
          },
        },
      },
    },
  });
  const teamRoleMemberStatus = teamRoleMembers.map((m) => ({
    userId: m.userId,
    name: m.user.username ?? "?",
    hasQuestionnaire: m.user.teamRoleScores[0]?.source === "questionnaire",
    hasEstimate: m.user.teamRoleScores[0]?.source === "estimate",
  }));
  const teamRoleCompletedCount = teamRoleMemberStatus.filter((m) => m.hasQuestionnaire).length;
  const teamRoleEstimateCount = teamRoleMemberStatus.filter((m) => m.hasEstimate).length;

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamTabBar ctx={ctx} active="teamRole" />
      <TeamRoleRoundCard
        teamId={teamId}
        isRoundActive={teamRoleTeam?.teamRoleRoundActive ?? false}
        totalMembers={teamRoleMembers.length}
        completedCount={teamRoleCompletedCount}
        estimateCount={teamRoleEstimateCount}
        members={teamRoleMemberStatus}
        canManage={isOrgManager}
        isHu={isHu}
      />
      <TeamRoleSection
        members={teamData.members}
        isHu={isHu}
        peerProfiles={Object.fromEntries(await buildTeamPeerRoleProfiles(teamId))}
      />
    </PlatformPageShell>
  );
}
