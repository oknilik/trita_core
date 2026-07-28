import { prisma } from "./prisma";
import type { ScoreResult } from "./scoring";
import { calculateTeamPattern, type TeamPatternResult, type TritanScores } from "./team-pattern";
import { buildTeamTrustNetwork } from "./trust-network.server";
import type { TrustEdgeType } from "./trust-network";

const DIM_ORDER = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;
export type DynamicsEdgeType = "aligned" | "complementary" | "friction";

const DIM_COLORS: Record<string, string> = {
  INTE: "#6366F1",
  RESO: "#EC4899",
  TEMP: "#F59E0B",
  ADAP: "#10B981",
  THOR: "#8B5CF6",
  OPEN: "#06B6D4",
};

const DIM_LABELS_HU: Record<string, string> = {
  INTE: "Integritás",
  RESO: "Rezonancia",
  TEMP: "Társas energia",
  ADAP: "Alkalmazkodás",
  THOR: "Tervezettség",
  OPEN: "Nyitottság",
};

const DIM_LABELS_EN: Record<string, string> = {
  INTE: "Integrity",
  RESO: "Resonance",
  TEMP: "Tempo",
  ADAP: "Adaptability",
  THOR: "Thoroughness",
  OPEN: "Openness",
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
  /** Completed team-role questionnaire result; null → fall back to TRITAN estimate */
  teamRoleScores: Record<string, number> | null;
  teamRoleSource: "questionnaire" | "estimate" | null;
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

export interface TeamDynamicsEdge {
  fromUserId: string;
  toUserId: string;
  type: DynamicsEdgeType;
  source: "observer" | "profile_estimate" | "trust_round";
  relationshipType: string | null;
  confidence: number | null;
  dimensionDelta: number | null;
  createdAt: string;
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
  dynamicsEdges: TeamDynamicsEdge[];
  members: SerializedTeamMember[];
  pendingInvites: Array<{ id: string; email: string; createdAt: string }>;
  heatmapRows: Array<{
    memberId: string;
    displayName: string;
    scores: Record<string, number | null>;
    testType: string | null;
  }>;
  dimConfigs: Array<{ code: string; label: string; color: string }>;
  patternResult: TeamPatternResult | null;
}

// ── Profile-based friction estimate ─────────────────────────────────────────
// Weighted TRITAN dimension gaps predict interpersonal friction potential.
// Weights based on established personality psychology research:
//   C (conscientiousness) and A (agreeableness) gaps are the strongest work
//   friction predictors; H (honesty-humility) follows; E, X, O are weaker.

export const FRICTION_WEIGHTS: Record<string, number> = {
  THOR: 0.30,  // deadline/quality/follow-through tension
  ADAP: 0.25,  // communication style conflicts
  INTE: 0.20,  // trust and motive attribution
  RESO: 0.15,  // emotional thermostat mismatch
  TEMP: 0.05,  // communication frequency mismatch
  OPEN: 0.05,  // innovation vs pragmatism
};

export function calculatePairFriction(
  scoresA: Record<string, number>,
  scoresB: Record<string, number>,
): number {
  let weightedSum = 0;
  for (const dim of DIM_ORDER) {
    const a = scoresA[dim];
    const b = scoresB[dim];
    if (typeof a !== "number" || typeof b !== "number") continue;
    weightedSum += (FRICTION_WEIGHTS[dim] ?? 0) * Math.abs(a - b);
  }
  return Math.round(weightedSum);
}

export function frictionToEdgeType(frictionScore: number): DynamicsEdgeType {
  if (frictionScore < 12) return "aligned";
  if (frictionScore < 22) return "complementary";
  return "friction";
}

function buildProfileBasedEdges(
  members: SerializedTeamMember[],
): TeamDynamicsEdge[] {
  const assessed = members.filter((m) => m.scores !== null);
  const edges: TeamDynamicsEdge[] = [];

  for (let i = 0; i < assessed.length; i++) {
    for (let j = i + 1; j < assessed.length; j++) {
      const a = assessed[i];
      const b = assessed[j];
      const friction = calculatePairFriction(a.scores!, b.scores!);
      const type = frictionToEdgeType(friction);

      edges.push({
        fromUserId: a.userId,
        toUserId: b.userId,
        type,
        source: "profile_estimate",
        relationshipType: null,
        confidence: null,
        dimensionDelta: friction,
        createdAt: new Date().toISOString(),
      });
    }
  }

  return edges;
}

/** Mért trust-él → dinamika-él típus (a térkép háromfokú skálájára). */
const TRUST_TO_DYNAMICS: Record<TrustEdgeType, DynamicsEdgeType> = {
  strong_trust: "aligned",
  moderate: "complementary",
  weak_trust: "friction",
  disconnected: "friction",
};

function mergeTrustEdges(
  profileEdges: TeamDynamicsEdge[],
  trust: Awaited<ReturnType<typeof buildTeamTrustNetwork>> | null,
): TeamDynamicsEdge[] {
  if (!trust || trust.edges.length === 0) return profileEdges;

  const measured = new Map(
    trust.edges.map((e) => [[e.a, e.b].sort().join("|"), e]),
  );
  const merged = profileEdges.map((edge) => {
    const key = [edge.fromUserId, edge.toUserId].sort().join("|");
    const trustEdge = measured.get(key);
    if (!trustEdge) return edge;
    measured.delete(key);
    return {
      ...edge,
      type: TRUST_TO_DYNAMICS[trustEdge.type],
      source: "trust_round" as const,
      confidence: trustEdge.mutual ? 100 : 50,
    };
  });

  // Mért pár, amihez nincs profil-él (pl. hiányzó önértékelés) — így is
  // felkerül a térképre, becslés nélkül.
  for (const trustEdge of measured.values()) {
    merged.push({
      fromUserId: trustEdge.a,
      toUserId: trustEdge.b,
      type: TRUST_TO_DYNAMICS[trustEdge.type],
      source: "trust_round",
      relationshipType: null,
      confidence: trustEdge.mutual ? 100 : 50,
      dimensionDelta: null,
      createdAt: new Date().toISOString(),
    });
  }
  return merged;
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
              teamRoleScore: {
                select: { scores: true, source: true },
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
      teamRoleScores: m.user.teamRoleScore
        ? (m.user.teamRoleScore.scores as Record<string, number>)
        : null,
      teamRoleSource: m.user.teamRoleScore
        ? (m.user.teamRoleScore.source as "questionnaire" | "estimate")
        : null,
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

  // ── Profile-based friction edges (pairwise TRITAN gap analysis) ──────────
  // Ahol van mért trust-kör adat, az felülírja a profil-alapú becslést
  // (feature-ideas #1: edge source csere profile_estimate → trust_round;
  // a becslés fallbackként megmarad a nem mért párokra).
  const dynamicsEdges = mergeTrustEdges(
    buildProfileBasedEdges(members),
    await buildTeamTrustNetwork(teamId).catch(() => null),
  );

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

  // Compute team pattern (requires at least 3 members with full TRITAN scores)
  const tritanMembers: Array<{ userId: string; scores: TritanScores }> = [];
  for (const m of members) {
    const s = m.scores;
    if (
      s &&
      s.H !== undefined && s.E !== undefined && s.X !== undefined &&
      s.A !== undefined && s.C !== undefined && s.O !== undefined
    ) {
      tritanMembers.push({
        userId: m.userId,
        scores: { INTE: s.H, RESO: s.E, TEMP: s.X, ADAP: s.A, THOR: s.C, OPEN: s.O },
      });
    }
  }

  const corePattern = calculateTeamPattern(tritanMembers);
  const patternResult: TeamPatternResult | null = corePattern
    ? {
        ...corePattern,
        memberCount:           members.length,
        membersWithAssessment: tritanMembers.length,
        missingMembers:        members.length - tritanMembers.length,
      }
    : null;

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
    dynamicsEdges,
    members,
    pendingInvites,
    heatmapRows,
    dimConfigs,
    patternResult,
  };
}
