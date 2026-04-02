import "server-only";

import { prisma } from "@/lib/prisma";
import { getTeamPageData, type TeamPageData } from "@/lib/team-stats";
import { getManageableTeamIds } from "@/lib/team-auth";
import { getActiveOrgMembership } from "@/lib/org-context";

export type TeamEventKind = "assessment_completed" | "observer_received" | "member_joined";

export interface TeamEvent {
  kind: TeamEventKind;
  memberName: string;
  teamName: string;
  teamId: string;
  timestamp: string;
}

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
  recentEvents: TeamEvent[];
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

  // ── Recent events across all managed teams ──────────────────────────────
  const allUserIds = loadedTeams.flatMap((td) => td.members.map((m) => m.userId));
  const uniqueUserIds = [...new Set(allUserIds)];
  const teamNameByUserId = new Map<string, { teamName: string; teamId: string }>();
  for (const td of loadedTeams) {
    for (const m of td.members) {
      if (!teamNameByUserId.has(m.userId)) {
        teamNameByUserId.set(m.userId, { teamName: td.teamName, teamId: td.teamId });
      }
    }
  }
  const userNameById = new Map<string, string>();
  for (const td of loadedTeams) {
    for (const m of td.members) {
      userNameById.set(m.userId, m.displayName);
    }
  }

  const EVENT_LIMIT = 15;
  const [recentAssessments, recentObservers, recentJoins] = await Promise.all([
    prisma.assessmentResult.findMany({
      where: { userProfileId: { in: uniqueUserIds }, isSelfAssessment: true },
      select: { userProfileId: true, createdAt: true },
      orderBy: { createdAt: "desc" },
      take: EVENT_LIMIT,
    }),
    prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: { in: uniqueUserIds } } },
      select: { createdAt: true, invitation: { select: { inviterId: true } } },
      orderBy: { createdAt: "desc" },
      take: EVENT_LIMIT,
    }),
    prisma.teamMember.findMany({
      where: { teamId: { in: managedTeamIds } },
      select: { userId: true, joinedAt: true, team: { select: { id: true, name: true } } },
      orderBy: { joinedAt: "desc" },
      take: EVENT_LIMIT,
    }),
  ]);

  const events: TeamEvent[] = [];

  for (const r of recentAssessments) {
    if (!r.userProfileId) continue;
    const ctx = teamNameByUserId.get(r.userProfileId);
    if (!ctx) continue;
    events.push({
      kind: "assessment_completed",
      memberName: userNameById.get(r.userProfileId) ?? "?",
      teamName: ctx.teamName,
      teamId: ctx.teamId,
      timestamp: r.createdAt.toISOString(),
    });
  }

  for (const o of recentObservers) {
    const uid = o.invitation.inviterId;
    const ctx = teamNameByUserId.get(uid);
    if (!ctx) continue;
    events.push({
      kind: "observer_received",
      memberName: userNameById.get(uid) ?? "?",
      teamName: ctx.teamName,
      teamId: ctx.teamId,
      timestamp: o.createdAt.toISOString(),
    });
  }

  for (const j of recentJoins) {
    events.push({
      kind: "member_joined",
      memberName: userNameById.get(j.userId) ?? "?",
      teamName: j.team.name,
      teamId: j.team.id,
      timestamp: j.joinedAt.toISOString(),
    });
  }

  // Sort by timestamp descending, take top 10
  events.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  const recentEvents = events.slice(0, 10);

  return {
    orgId: org.id,
    orgName: org.name,
    profileId,
    teams,
    primaryTeamData: loadedTeams[0],
    totalMembers: teams.reduce((s, t) => s + t.memberCount, 0),
    totalCompleted: teams.reduce((s, t) => s + t.completedCount, 0),
    totalPendingInvites: teams.reduce((s, t) => s + t.pendingInviteCount, 0),
    recentEvents,
  };
}
