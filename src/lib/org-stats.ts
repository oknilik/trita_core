import { prisma } from "./prisma";

export interface ParticipantStat {
  userId: string;
  username: string | null;
  email: string | null;
  selfDone: boolean;
  observerCount: number;
}

export interface CampaignWithStats {
  id: string;
  name: string;
  description: string | null;
  status: string;
  createdAt: string;
  closedAt: string | null;
  creator: { username: string | null };
  participants: ParticipantStat[];
  selfDoneCount: number;
  observerDoneCount: number;
  totalCount: number;
}

export interface SerializedMember {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: { id: string; email: string | null; username: string | null };
}

export interface SerializedPendingInvite {
  id: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface SerializedTeam {
  id: string;
  name: string;
  createdAt: string;
  _count: { members: number };
}

export interface OrgPageData {
  campaigns: CampaignWithStats[];
  hexacoAvg: Record<string, number> | null;
  memberCount: number;
  pendingCount: number;
  teamCount: number;
  activeCampaignCount: number;
  closedCampaignCount: number;
  activeSelfDone: number;
  activeTotalParticipants: number;
  completedMemberCount: number;
}

export async function getOrgPageData(orgId: string): Promise<OrgPageData> {
  // Fetch all campaigns with participants
  const rawCampaigns = await prisma.campaign.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      closedAt: true,
      creator: { select: { username: true } },
      participants: {
        select: {
          userId: true,
          user: { select: { username: true, email: true } },
        },
      },
    },
  });

  // Fetch org member IDs for HEXACO averages
  const [memberRows, pendingRows, teamRows] = await Promise.all([
    prisma.organizationMember.count({ where: { orgId } }),
    prisma.organizationPendingInvite.count({ where: { orgId } }),
    prisma.team.count({ where: { orgId } }),
  ]);

  // Collect all participant userIds across all campaigns
  const allParticipantUserIds = Array.from(
    new Set(rawCampaigns.flatMap((c) => c.participants.map((p) => p.userId)))
  );

  // Fetch self-assessment completion for all participant userIds
  const selfDoneResults = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: allParticipantUserIds },
      isSelfAssessment: true,
    },
    select: { userProfileId: true },
    distinct: ["userProfileId"],
  });
  const selfDoneSet = new Set(
    selfDoneResults.map((r) => r.userProfileId).filter(Boolean) as string[]
  );

  // Fetch completed observer invitations for all participant userIds
  const observerResults = await prisma.observerInvitation.findMany({
    where: {
      inviterId: { in: allParticipantUserIds },
      status: "COMPLETED",
    },
    select: { inviterId: true },
  });
  const observerCountMap = new Map<string, number>();
  for (const inv of observerResults) {
    observerCountMap.set(inv.inviterId, (observerCountMap.get(inv.inviterId) ?? 0) + 1);
  }

  // Build CampaignWithStats
  const campaigns: CampaignWithStats[] = rawCampaigns.map((c) => {
    const participants: ParticipantStat[] = c.participants.map((p) => ({
      userId: p.userId,
      username: p.user.username ?? null,
      email: p.user.email ?? null,
      selfDone: selfDoneSet.has(p.userId),
      observerCount: observerCountMap.get(p.userId) ?? 0,
    }));

    const selfDoneCount = participants.filter((p) => p.selfDone).length;
    const observerDoneCount = participants.filter((p) => p.observerCount > 0).length;

    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      status: c.status,
      createdAt: c.createdAt.toISOString(),
      closedAt: c.closedAt?.toISOString() ?? null,
      creator: { username: c.creator.username ?? null },
      participants,
      selfDoneCount,
      observerDoneCount,
      totalCount: participants.length,
    };
  });

  // HEXACO averages: fetch all org member userIds and their assessments
  const orgMembers = await prisma.organizationMember.findMany({
    where: { orgId },
    select: { userId: true },
  });
  const orgMemberIds = orgMembers.map((m) => m.userId);

  let hexacoAvg: Record<string, number> | null = null;
  let completedMemberCount = 0;
  if (orgMemberIds.length > 0) {
    const assessmentResults = await prisma.assessmentResult.findMany({
      where: {
        userProfileId: { in: orgMemberIds },
        isSelfAssessment: true,
      },
      select: { userProfileId: true, scores: true },
      distinct: ["userProfileId"],
    });

    const dims = ["H", "E", "X", "A", "C", "O"];
    const sums: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0 };

    for (const ar of assessmentResults) {
      const scores = ar.scores as Record<string, number>;
      const hasAllDims = dims.every((d) => typeof scores[d] === "number");
      if (hasAllDims) {
        for (const d of dims) {
          sums[d] += scores[d];
        }
        completedMemberCount++;
      }
    }

    if (completedMemberCount >= 3) {
      hexacoAvg = {};
      for (const d of dims) {
        hexacoAvg[d] = Math.round(sums[d] / completedMemberCount);
      }
    }
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const closedCampaigns = campaigns.filter((c) => c.status === "CLOSED");

  const activeSelfDone = activeCampaigns.reduce((sum, c) => sum + c.selfDoneCount, 0);
  const activeTotalParticipants = activeCampaigns.reduce((sum, c) => sum + c.totalCount, 0);

  return {
    campaigns,
    hexacoAvg,
    memberCount: memberRows,
    pendingCount: pendingRows,
    teamCount: teamRows,
    activeCampaignCount: activeCampaigns.length,
    closedCampaignCount: closedCampaigns.length,
    activeSelfDone,
    activeTotalParticipants,
    completedMemberCount,
  };
}
