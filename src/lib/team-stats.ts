import { prisma } from "./prisma";
import type { ScoreResult } from "./scoring";

const DIM_ORDER = ["H", "E", "X", "A", "C", "O"] as const;
type DimCode = (typeof DIM_ORDER)[number];

const DIM_COLORS: Record<string, string> = {
  H: "#6366F1",
  E: "#EC4899",
  X: "#F59E0B",
  A: "#10B981",
  C: "#8B5CF6",
  O: "#06B6D4",
};

const DIM_LABELS_HU: Record<string, string> = {
  H: "Önzetlenség",
  E: "Érzelmi stabilitás",
  X: "Extraverzió",
  A: "Barátságosság",
  C: "Lelkiismeretesség",
  O: "Nyitottság",
};

const DIM_LABELS_EN: Record<string, string> = {
  H: "Honesty-Humility",
  E: "Emotionality",
  X: "Extraversion",
  A: "Agreeableness",
  C: "Conscientiousness",
  O: "Openness",
};

export interface SerializedTeamMember {
  id: string;
  userId: string;
  displayName: string;
  email: string | null;
  role: string;
  joinedAt: string;
  scores: Record<string, number> | null;
  testType: string | null;
  top3Dims: Array<{ code: string; value: number; color: string }>;
}

export interface TeamActiveCampaign {
  id: string;
  name: string;
  orgId: string;
  createdAt: string;
  teamParticipantCount: number;
  teamSelfDoneCount: number;
  teamObserverDoneCount: number;
  daysActive: number;
}

export interface TeamPageData {
  teamId: string;
  teamName: string;
  teamCreatedAt: string;
  orgId: string | null;
  orgName: string | null;
  memberCount: number;
  completedCount: number;
  dimAvg: Record<string, number> | null;
  topDim: { code: string; value: number } | null;
  bottomDim: { code: string; value: number } | null;
  activeCampaign: TeamActiveCampaign | null;
  members: SerializedTeamMember[];
  pendingInvites: Array<{ id: string; email: string; createdAt: string }>;
  heatmapRows: Array<{
    memberId: string;
    displayName: string;
    scores: Record<string, number | null>;
    testType: string | null;
  }>;
  dimConfigs: Array<{ code: string; label: string; color: string }>;
}

export async function getTeamPageData(
  teamId: string,
  locale: "hu" | "en"
): Promise<TeamPageData | null> {
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: {
      id: true,
      name: true,
      createdAt: true,
      orgId: true,
      org: {
        select: { id: true, name: true },
      },
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          role: true,
          joinedAt: true,
          user: {
            select: {
              id: true,
              email: true,
              username: true,
              assessmentResults: {
                where: { isSelfAssessment: true },
                orderBy: { createdAt: "desc" },
                take: 1,
                select: { testType: true, scores: true },
              },
            },
          },
        },
      },
    },
  });

  if (!team) return null;

  const dimLabels = locale === "hu" ? DIM_LABELS_HU : DIM_LABELS_EN;

  // Build members with scores
  const members: SerializedTeamMember[] = team.members.map((m) => {
    const ar = m.user.assessmentResults[0];
    const rawDimensions = ar
      ? (ar.scores as ScoreResult).dimensions
      : null;

    // Compute top3Dims from DIM_ORDER dims
    const top3Dims: Array<{ code: string; value: number; color: string }> = [];
    if (rawDimensions) {
      const ordered = (DIM_ORDER as readonly string[])
        .filter((code) => rawDimensions[code] !== undefined)
        .map((code) => ({ code, value: rawDimensions[code], color: DIM_COLORS[code] ?? "#888" }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 3);
      top3Dims.push(...ordered);
    }

    return {
      id: m.id,
      userId: m.user.id,
      displayName: m.user.username ?? m.user.email ?? m.user.id,
      email: m.user.email,
      role: m.role,
      joinedAt: m.joinedAt.toISOString(),
      scores: rawDimensions ?? null,
      testType: ar?.testType ?? null,
      top3Dims,
    };
  });

  // Compute dimAvg
  const dimSums: Record<string, number> = {};
  const dimCounts: Record<string, number> = {};

  for (const code of DIM_ORDER) {
    dimSums[code] = 0;
    dimCounts[code] = 0;
  }

  for (const member of members) {
    if (!member.scores) continue;
    for (const code of DIM_ORDER) {
      const val = member.scores[code];
      if (val !== undefined && val !== null) {
        dimSums[code] += val;
        dimCounts[code]++;
      }
    }
  }

  const completedCount = members.filter((m) => m.scores !== null).length;

  let dimAvg: Record<string, number> | null = null;
  if (completedCount >= 1) {
    dimAvg = {};
    for (const code of DIM_ORDER) {
      if (dimCounts[code] > 0) {
        dimAvg[code] = Math.round(dimSums[code] / dimCounts[code]);
      }
    }
  }

  // topDim / bottomDim
  let topDim: { code: string; value: number } | null = null;
  let bottomDim: { code: string; value: number } | null = null;
  if (dimAvg) {
    const entries = (DIM_ORDER as readonly string[])
      .filter((code) => dimAvg![code] !== undefined)
      .map((code) => ({ code, value: dimAvg![code] }));
    if (entries.length > 0) {
      topDim = entries.reduce((best, e) => (e.value > best.value ? e : best));
      bottomDim = entries.reduce((worst, e) => (e.value < worst.value ? e : worst));
    }
  }

  // Parallelize: campaign lookup + pending invites
  const [campaignRaw, pendingInvitesRaw] = await Promise.all([
    team.orgId
      ? prisma.campaign.findFirst({
          where: { orgId: team.orgId, status: "ACTIVE" },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            orgId: true,
            createdAt: true,
            participants: { select: { userId: true } },
          },
        })
      : Promise.resolve(null),
    prisma.teamPendingInvite.findMany({
      where: { teamId },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, createdAt: true },
    }),
  ]);

  // Compute active campaign stats
  let activeCampaign: TeamActiveCampaign | null = null;
  if (campaignRaw) {
    const teamUserIds = new Set(team.members.map((m) => m.user.id));
    const teamParticipants = campaignRaw.participants.filter((p) =>
      teamUserIds.has(p.userId)
    );
    const teamParticipantCount = teamParticipants.length;

    const teamSelfDoneCount = members.filter(
      (m) =>
        teamParticipants.some((p) => p.userId === m.userId) &&
        m.scores !== null
    ).length;

    let teamObserverDoneCount = 0;
    if (teamParticipantCount > 0) {
      const participantUserIds = teamParticipants.map((p) => p.userId);
      const completedObserverInvitations = await prisma.observerInvitation.findMany({
        where: {
          inviterId: { in: participantUserIds },
          status: "COMPLETED",
        },
        select: { inviterId: true },
        distinct: ["inviterId"],
      });
      teamObserverDoneCount = completedObserverInvitations.length;
    }

    const daysActive = Math.floor(
      (Date.now() - campaignRaw.createdAt.getTime()) / (1000 * 60 * 60 * 24)
    );

    activeCampaign = {
      id: campaignRaw.id,
      name: campaignRaw.name,
      orgId: campaignRaw.orgId,
      createdAt: campaignRaw.createdAt.toISOString(),
      teamParticipantCount,
      teamSelfDoneCount,
      teamObserverDoneCount,
      daysActive,
    };
  }

  // Build dimConfigs: only dims that appear in at least one member's scores
  const presentDims = new Set<string>();
  for (const member of members) {
    if (!member.scores) continue;
    for (const code of DIM_ORDER) {
      if (member.scores[code] !== undefined) {
        presentDims.add(code);
      }
    }
  }

  // If no member has scores yet, include all dims by default for display
  const dimsToShow =
    presentDims.size > 0
      ? (DIM_ORDER as readonly string[]).filter((code) => presentDims.has(code))
      : (DIM_ORDER as readonly string[]);

  const dimConfigs = dimsToShow.map((code) => ({
    code,
    label: dimLabels[code] ?? code,
    color: DIM_COLORS[code] ?? "#888",
  }));

  // Build heatmap rows
  const heatmapRows = members.map((m) => {
    const scores: Record<string, number | null> = {};
    for (const dc of dimConfigs) {
      scores[dc.code] = m.scores?.[dc.code] ?? null;
    }
    return {
      memberId: m.id,
      displayName: m.displayName,
      scores,
      testType: m.testType,
    };
  });

  const pendingInvites = pendingInvitesRaw.map((inv) => ({
    id: inv.id,
    email: inv.email,
    createdAt: inv.createdAt.toISOString(),
  }));

  return {
    teamId: team.id,
    teamName: team.name,
    teamCreatedAt: team.createdAt.toISOString(),
    orgId: team.orgId,
    orgName: team.org?.name ?? null,
    memberCount: members.length,
    completedCount,
    dimAvg,
    topDim,
    bottomDim,
    activeCampaign,
    members,
    pendingInvites,
    heatmapRows,
    dimConfigs,
  };
}
