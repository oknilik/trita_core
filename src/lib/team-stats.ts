import { prisma } from "./prisma";
import type { ScoreResult } from "./scoring";
import { calculateTeamPattern, type TeamPatternResult, type TritanScores } from "./team-pattern";
import { buildTeamTrustNetwork } from "./trust-network.server";
import { getCampaignSteps, isCampaignStepDone } from "./campaign-steps-core";
import {
  EDGE_CONFIDENCE_MUTUAL,
  EDGE_CONFIDENCE_ONE_SIDED,
  type TrustEdgeType,
  type TrustNetwork,
} from "./trust-network";
import {
  FRICTION_WEIGHTS,
  calculatePairFriction,
  frictionToEdgeType,
  type DynamicsEdgeType,
} from "./friction-model";

const DIM_ORDER = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;
export type { DynamicsEdgeType };

// Kanonikus HEXACO-paletta (color-system.ts) — base a markokra (sáv, cella,
// radar), strong a fehér betűs kitöltött badge-ekre (AA).
import { DIMENSION_BASE, DIMENSION_STRONG } from "./color-system";

const DIM_COLORS: Record<string, string> = DIMENSION_BASE;

const DIM_LABELS_HU: Record<string, string> = {
  INTE: "Becsületesség-Alázat",
  RESO: "Emocionalitás",
  TEMP: "Extraverzió",
  ADAP: "Barátságosság",
  THOR: "Lelkiismeretesség",
  OPEN: "Nyitottság",
};

const DIM_LABELS_EN: Record<string, string> = {
  INTE: "Honesty-Humility",
  RESO: "Emotionality",
  TEMP: "Extraversion",
  ADAP: "Agreeableness",
  THOR: "Conscientiousness",
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
  /**
   * Mérésenkénti haladás a csapat résztvevőire (2026-07-29): a hero
   * kitöltési aránya CSAK a személyiség-profilt méri — a kör többi
   * mérésének állását ez a bontás mutatja.
   */
  stepProgress: Array<{ type: string; done: number; total: number }>;
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
// A modell a `friction-model.ts`-ben él (tiszta, Prisma-mentes modul, hogy a
// kliens és az interakció-motor is importálhassa). Itt csak re-export, hogy a
// meglévő `@/lib/team-stats` importok változatlanul működjenek.
export { FRICTION_WEIGHTS, calculatePairFriction, frictionToEdgeType };

// Exportált a manager-cockpit kötegelt betöltőjének (in-memory él-építés
// csapatonkénti pipeline-futtatás helyett) — csak a userId+scores kell hozzá.
export function buildProfileBasedEdges(
  members: Array<Pick<SerializedTeamMember, "userId" | "scores">>,
): TeamDynamicsEdge[] {
  const assessed = members.filter((m) => m.scores !== null);
  const edges: TeamDynamicsEdge[] = [];

  for (let i = 0; i < assessed.length; i++) {
    for (let j = i + 1; j < assessed.length; j++) {
      const a = assessed[i];
      const b = assessed[j];
      const friction = calculatePairFriction(a.scores!, b.scores!);
      // Nincs közös dimenzió → nincs miből becsülni, él sem épül.
      if (friction === null) continue;
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

// Exportált a manager-cockpit kötegelt betöltőjének — ld. buildProfileBasedEdges.
export function mergeTrustEdges(
  profileEdges: TeamDynamicsEdge[],
  trust: TrustNetwork | null,
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
      confidence: trustEdge.mutual ? EDGE_CONFIDENCE_MUTUAL : EDGE_CONFIDENCE_ONE_SIDED,
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
      confidence: trustEdge.mutual ? EDGE_CONFIDENCE_MUTUAL : EDGE_CONFIDENCE_ONE_SIDED,
      dimensionDelta: null,
      createdAt: new Date().toISOString(),
    });
  }
  return merged;
}

/** Az aktív kampány nyers (Prisma-select) alakja a csapat-statisztikához. */
export interface ActiveCampaignSource {
  id: string;
  name: string;
  orgId: string;
  createdAt: Date;
  type: string;
  steps: string[];
  requireFreshResults: boolean;
  activatedAt: Date | null;
  participants: Array<{ userId: string; currentStep: number; stepCompletions: unknown }>;
}

/**
 * Aktív kampány csapat-szintű statisztikái — TISZTA rész (a getTeamPageData
 * és a manager-cockpit kötegelt betöltője közösen használja). A COMPLETED
 * observer-meghívóval rendelkező inviterek halmazát a hívó tölti be (DB).
 */
export function computeTeamActiveCampaign(
  campaignRaw: ActiveCampaignSource,
  members: Array<Pick<SerializedTeamMember, "userId" | "scores">>,
  completedObserverInviterIds: ReadonlySet<string>,
): TeamActiveCampaign {
  const teamUserIds = new Set(members.map((m) => m.userId));
  const teamParticipants = campaignRaw.participants.filter((p) =>
    teamUserIds.has(p.userId)
  );
  const teamParticipantCount = teamParticipants.length;

  const teamSelfDoneCount = members.filter(
    (m) =>
      teamParticipants.some((p) => p.userId === m.userId) &&
      m.scores !== null
  ).length;

  const teamObserverDoneCount = teamParticipants.filter((p) =>
    completedObserverInviterIds.has(p.userId),
  ).length;

  const daysActive = Math.floor(
    (Date.now() - campaignRaw.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Mérésenkénti haladás a csapat résztvevőire — a kampány-részletező
  // lépés-logikájával azonos (isCampaignStepDone), így a két felület
  // ugyanazt a számot mutatja. A self-fallback fresh-tudatos.
  const campaignSteps = getCampaignSteps(campaignRaw);
  const freshFrom =
    campaignRaw.requireFreshResults && campaignRaw.activatedAt
      ? campaignRaw.activatedAt.getTime()
      : null;
  const selfDoneAtMap = new Map(
    members.map((m) => [m.userId, m.scores !== null]),
  );
  // Ha a kampányban egyetlen csapattag sem résztvevő, a bontás 0/0 sorokat
  // adna — ilyenkor üres marad (a felület sem rendereli).
  const stepProgress =
    teamParticipantCount > 0
      ? campaignSteps.map((stepType, idx) => ({
          type: stepType,
          done: teamParticipants.filter((p) =>
            isCampaignStepDone(
              campaignSteps,
              idx,
              p,
              // freshFrom-nál a self-eredmény dátuma nem elérhető itt olcsón —
              // a fresh körben ezért a lépés-könyvelés (stepCompletions) dönt.
              freshFrom === null && (selfDoneAtMap.get(p.userId) ?? false),
            ),
          ).length,
          total: teamParticipantCount,
        }))
      : [];

  return {
    id: campaignRaw.id,
    name: campaignRaw.name,
    orgId: campaignRaw.orgId,
    createdAt: campaignRaw.createdAt.toISOString(),
    teamParticipantCount,
    teamSelfDoneCount,
    teamObserverDoneCount,
    daysActive,
    stepProgress,
  };
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
              teamRoleScores: {
                orderBy: { createdAt: "desc" },
                take: 1,
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
        // Fehér betűs mini-badge-ként renderel (manager) → strong kitöltés (AA)
        .map((code) => ({ code, value: rawDimensions[code], color: DIMENSION_STRONG[code as keyof typeof DIMENSION_STRONG] ?? DIM_COLORS[code] }))
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
      teamRoleScores: m.user.teamRoleScores[0]
        ? (m.user.teamRoleScores[0].scores as Record<string, number>)
        : null,
      teamRoleSource: m.user.teamRoleScores[0]
        ? (m.user.teamRoleScores[0].source as "questionnaire" | "estimate")
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
            type: true,
            steps: true,
            requireFreshResults: true,
            activatedAt: true,
            participants: {
              select: { userId: true, currentStep: true, stepCompletions: true },
            },
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

  // Compute active campaign stats — a tiszta rész a computeTeamActiveCampaign
  // helperben él (a manager-cockpit kötegelt betöltője is azt használja);
  // itt csak a COMPLETED observer-inviterek betöltése marad DB-munka.
  let activeCampaign: TeamActiveCampaign | null = null;
  if (campaignRaw) {
    const teamUserIds = new Set(team.members.map((m) => m.user.id));
    const participantUserIds = campaignRaw.participants
      .filter((p) => teamUserIds.has(p.userId))
      .map((p) => p.userId);

    let completedObserverInviterIds: ReadonlySet<string> = new Set<string>();
    if (participantUserIds.length > 0) {
      const completedObserverInvitations = await prisma.observerInvitation.findMany({
        where: {
          inviterId: { in: participantUserIds },
          status: "COMPLETED",
        },
        select: { inviterId: true },
        distinct: ["inviterId"],
      });
      completedObserverInviterIds = new Set(
        completedObserverInvitations.map((inv) => inv.inviterId),
      );
    }

    activeCampaign = computeTeamActiveCampaign(
      campaignRaw,
      members,
      completedObserverInviterIds,
    );
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
    color: DIM_COLORS[code] ?? "#8a8a9a",
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

  // Compute team pattern (requires at least 3 members with full TRITAN scores).
  // FONTOS: a member.scores a NYERS score-JSON dimenziói — a BELSŐ kódokkal
  // (INTE/RESO/TEMP/ADAP/THOR/OPEN), nem a HEXACO megjelenítési betűkkel
  // (H/E/X/A/C/O). A 2026-07-29-es HEXACO-átállás után itt tévesen a
  // display-betűket kerestük, ezért a mintázat mindig null lett.
  const tritanMembers: Array<{ userId: string; scores: TritanScores }> = [];
  for (const m of members) {
    const s = m.scores;
    if (
      s &&
      s.INTE !== undefined && s.RESO !== undefined && s.TEMP !== undefined &&
      s.ADAP !== undefined && s.THOR !== undefined && s.OPEN !== undefined
    ) {
      tritanMembers.push({
        userId: m.userId,
        scores: {
          INTE: s.INTE,
          RESO: s.RESO,
          TEMP: s.TEMP,
          ADAP: s.ADAP,
          THOR: s.THOR,
          OPEN: s.OPEN,
        },
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
