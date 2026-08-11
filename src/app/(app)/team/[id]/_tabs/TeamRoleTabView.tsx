import { prisma } from "@/lib/prisma";
import { hasCompleteTritanDims } from "@/lib/team-role-estimate";
import { buildTeamPeerRoleProfiles } from "@/lib/team-role-peer.server";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamRoleSection } from "@/components/team/TeamRoleSection";
import { TeamRoleRoundCard } from "@/components/team/TeamRoleRoundCard";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";

// ── TeamRole tab ───────────────────────────────────────────────────────────
export async function TeamRoleTabView({ ctx }: { ctx: TeamTabContext }) {
  const { teamId, teamData, isHu, isOrgManager } = ctx;

  const teamRoleTeam = await prisma.team.findUnique({
    where: { id: teamId },
    select: { teamRoleRoundActive: true, teamRoleRoundStartedAt: true },
  });
  // A becslés SOSEM perzisztálódik (számított fallback), ezért a korábbi
  // source === "estimate" DB-szűrés mindig 0-t adott. A valós állapot a
  // megjelenítési szabályból jön: kitöltött kérdőív > TRITAN-becslés >
  // nincs adat — a teamData.members már hordozza mindkét forrást.
  const teamRoleMemberStatus = teamData.members.map((m) => {
    const hasQuestionnaire = m.teamRoleSource === "questionnaire";
    return {
      userId: m.userId,
      name: m.displayName,
      hasQuestionnaire,
      // Ugyanaz a teljességi kapu, mint a lenti TeamRoleSection-ben
      // (resolveDisplayRoleScores): részleges profilból NINCS becslés —
      // a sima truthiness-ellenőrzés „Becslés" chipet mutatna ott, ahol a
      // szekció „Nincs adat"-ot.
      hasEstimate: !hasQuestionnaire && hasCompleteTritanDims(m.scores),
    };
  });
  const teamRoleCompletedCount = teamRoleMemberStatus.filter((m) => m.hasQuestionnaire).length;
  const teamRoleEstimateCount = teamRoleMemberStatus.filter((m) => m.hasEstimate).length;

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
      <TeamHeroBlock ctx={ctx} active="teamRole" />
      <TeamRoleRoundCard
        teamId={teamId}
        isRoundActive={teamRoleTeam?.teamRoleRoundActive ?? false}
        totalMembers={teamData.members.length}
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
