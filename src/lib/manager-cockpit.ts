import "server-only";

import { prisma } from "@/lib/prisma";
import { getTeamPageData, type TeamPageData } from "@/lib/team-stats";
import { getManageableTeamIds } from "@/lib/team-auth";
import { getActiveOrgMembership } from "@/lib/org-context";

export interface ManagerTeamSummary {
  teamId: string;
  teamName: string;
  memberCount: number;
  completedCount: number;
  completionPct: number;
  pendingInviteCount: number;
  hasPattern: boolean;
  activeCampaign: TeamPageData["activeCampaign"];
  frictionCount: number;
  alignedCount: number;
  complementaryCount: number;
}

export interface ManagerCockpitData {
  orgId: string;
  orgName: string;
  profileId: string;
  teams: ManagerTeamSummary[];
  /** Full data for the primary (first) team — used for detailed rendering */
  primaryTeamData: TeamPageData | null;
  totalMembers: number;
  totalCompleted: number;
  totalPendingInvites: number;
}

export async function getManagerCockpitData(
  profileId: string,
  locale: "hu" | "en",
): Promise<ManagerCockpitData | null> {
  const membership = await getActiveOrgMembership(profileId);
  if (!membership) return null;

  const org = await prisma.organization.findUnique({
    where: { id: membership.orgId },
    select: { id: true, name: true },
  });
  if (!org) return null;

  const managedTeamIds = await getManageableTeamIds(
    profileId,
    membership.orgId,
    membership.role,
  );

  if (managedTeamIds.length === 0) return null;

  // Load full data for all managed teams (parallel)
  const teamDataResults = await Promise.all(
    managedTeamIds.map((teamId) => getTeamPageData(teamId, locale)),
  );
  const loadedTeams = teamDataResults.filter(
    (td): td is TeamPageData => td !== null,
  );

  if (loadedTeams.length === 0) return null;

  const teams: ManagerTeamSummary[] = loadedTeams.map((td) => {
    const frictionCount = td.dynamicsEdges.filter((e) => e.type === "friction").length;
    const alignedCount = td.dynamicsEdges.filter((e) => e.type === "aligned").length;
    const complementaryCount = td.dynamicsEdges.filter((e) => e.type === "complementary").length;

    return {
      teamId: td.teamId,
      teamName: td.teamName,
      memberCount: td.memberCount,
      completedCount: td.completedCount,
      completionPct: td.memberCount > 0 ? Math.round((td.completedCount / td.memberCount) * 100) : 0,
      pendingInviteCount: td.pendingInvites.length,
      hasPattern: td.completedCount >= 3,
      activeCampaign: td.activeCampaign,
      frictionCount,
      alignedCount,
      complementaryCount,
    };
  });

  // Sort: lowest completion first (where attention is needed most)
  teams.sort((a, b) => a.completionPct - b.completionPct);

  return {
    orgId: org.id,
    orgName: org.name,
    profileId,
    teams,
    primaryTeamData: loadedTeams[0],
    totalMembers: teams.reduce((s, t) => s + t.memberCount, 0),
    totalCompleted: teams.reduce((s, t) => s + t.completedCount, 0),
    totalPendingInvites: teams.reduce((s, t) => s + t.pendingInviteCount, 0),
  };
}
