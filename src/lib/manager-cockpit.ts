import "server-only";

import { prisma } from "@/lib/prisma";
import type { ScoreResult } from "@/lib/scoring";
import {
  buildProfileBasedEdges,
  computeTeamActiveCampaign,
  getTeamPageData,
  mergeTrustEdges,
  type TeamActiveCampaign,
  type TeamDynamicsEdge,
  type TeamPageData,
} from "@/lib/team-stats";
import {
  computeTrustNetwork,
  dedupeLatestTrustObservations,
  type TrustAnswerSet,
} from "@/lib/trust-network";
import {
  pickPrimaryTeam,
  sortTeamsByCompletion,
  splitDynamicsEdges,
} from "@/lib/manager-cockpit-core";
import { getCampaignTeamIds } from "@/lib/campaign-steps-core";
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
  /** Mért dinamika-élek — trust-kör (vagy örökség observer) forrásból. */
  measuredEdgeCount: number;
  /** Becsült dinamika-élek — profil-alapú (profile_estimate) forrásból. */
  estimatedEdgeCount: number;
}

export interface ManagerCockpitData {
  orgId: string;
  orgName: string;
  profileId: string;
  teams: ManagerTeamSummary[];
  /** Full data for the primary team — the SORTED list's first element */
  primaryTeamData: TeamPageData | null;
  totalMembers: number;
  totalCompleted: number;
  totalPendingInvites: number;
  recentEvents: TeamEvent[];
}

/** A cockpit-összegzéshez szükséges minimum egy csapatról. */
export interface ManagerCockpitTeamStats {
  teamId: string;
  teamName: string;
  members: Array<{
    userId: string;
    displayName: string;
    scores: Record<string, number> | null;
  }>;
  completedCount: number;
  pendingInviteCount: number;
  dynamicsEdges: TeamDynamicsEdge[];
  activeCampaign: TeamActiveCampaign | null;
}

/**
 * Kötegelt cockpit-statisztika az ÖSSZES kezelt csapatra, KONSTANS számú
 * lekérdezéssel. Korábban csapatonként a teljes getTeamPageData pipeline
 * futott (trust-háló + mintázat + heatmap, csapatonként ~6 lekérdezés —
 * N+1 minta, audit 2026-08-10 P2); a cockpitnak ennél sokkal kevesebb kell.
 *
 * Lekérdezések: (1) csapatok+tagok · (2) tagonkénti legutolsó self-eredmény
 * (org-stats.ts distinct+orderBy mintája) · (3) trust-megfigyelések ·
 * (4) függő csapat-meghívó darabszámok · (5) a kezelt csapatokat célzó aktív
 * kampányok · (6) kampány-résztvevők COMPLETED observer-meghívói (feltételes).
 * Az élek in-memory épülnek a meglévő lib-függvényekkel.
 */
export async function getManagerCockpitTeamStats(
  teamIds: string[],
  orgId: string,
): Promise<ManagerCockpitTeamStats[]> {
  if (teamIds.length === 0) return [];

  // (1) Csapatok + tagok — EGY findMany az összes csapatra.
  const teamsRaw = await prisma.team.findMany({
    where: { id: { in: teamIds } },
    select: {
      id: true,
      name: true,
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          user: { select: { id: true, email: true, username: true } },
        },
      },
    },
  });

  // A bemeneti (jogosultsági) sorrend megőrzése — a stabil kitöltöttség-
  // rendezés döntetlenjeinél ez adja a determinisztikus sorrendet.
  const orderIndex = new Map(teamIds.map((id, i) => [id, i]));
  teamsRaw.sort(
    (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
  );

  const allUserIds = [
    ...new Set(teamsRaw.flatMap((t) => t.members.map((m) => m.user.id))),
  ];

  // (2)–(5) Egymástól független batch-lekérdezések párhuzamosan.
  const [latestSelfResults, trustObservationsRaw, pendingInviteGroups, campaignsRaw] =
    await Promise.all([
      allUserIds.length > 0
        ? prisma.assessmentResult.findMany({
            where: { userProfileId: { in: allUserIds }, isSelfAssessment: true },
            orderBy: { createdAt: "desc" },
            select: { userProfileId: true, scores: true },
            distinct: ["userProfileId"],
          })
        : Promise.resolve([]),
      prisma.trustObservation.findMany({
        where: { teamId: { in: teamIds } },
        orderBy: { updatedAt: "asc" },
        select: { teamId: true, aboutUserId: true, raterUserId: true, answers: true },
      }),
      prisma.teamPendingInvite.groupBy({
        by: ["teamId"],
        where: { teamId: { in: teamIds } },
        _count: { _all: true },
      }),
      // A kezelt csapatok VALAMELYIKÉT célzó aktív kampányok. A csapat→kampány
      // párosítást lentebb a getCampaignTeamIds dönti el csapatonként — így egy
      // B csapatnak indított kampány nem jelenik meg A "aktív kampányaként".
      prisma.campaign.findMany({
        where: {
          orgId,
          status: "ACTIVE",
          OR: [{ teamId: { in: teamIds } }, { teamIds: { hasSome: teamIds } }],
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          orgId: true,
          createdAt: true,
          type: true,
          steps: true,
          teamId: true,
          teamIds: true,
          requireFreshResults: true,
          activatedAt: true,
          participants: {
            select: { userId: true, currentStep: true, stepCompletions: true },
          },
        },
      }),
    ]);

  // (6) Kampány-haladáshoz: mely résztvevőknek van COMPLETED observer-
  // meghívója — egyetlen lekérdezés az összes érintett kampány résztvevőire.
  let completedObserverInviterIds: ReadonlySet<string> = new Set<string>();
  if (campaignsRaw.length > 0) {
    const participantIds = new Set(
      campaignsRaw.flatMap((c) => c.participants.map((p) => p.userId)),
    );
    const relevantIds = allUserIds.filter((id) => participantIds.has(id));
    if (relevantIds.length > 0) {
      const completed = await prisma.observerInvitation.findMany({
        where: { inviterId: { in: relevantIds }, status: "COMPLETED" },
        select: { inviterId: true },
        distinct: ["inviterId"],
      });
      completedObserverInviterIds = new Set(completed.map((c) => c.inviterId));
    }
  }

  // In-memory csoportosítás és csapatonkénti összeállítás.
  const scoresByUserId = new Map<string, Record<string, number> | null>();
  for (const r of latestSelfResults) {
    if (!r.userProfileId) continue;
    scoresByUserId.set(r.userProfileId, (r.scores as ScoreResult).dimensions ?? null);
  }

  const observationsByTeamId = new Map<string, typeof trustObservationsRaw>();
  for (const obs of trustObservationsRaw) {
    const list = observationsByTeamId.get(obs.teamId) ?? [];
    list.push(obs);
    observationsByTeamId.set(obs.teamId, list);
  }

  const pendingCountByTeamId = new Map(
    pendingInviteGroups.map((g) => [g.teamId, g._count._all]),
  );

  return teamsRaw.map((team) => {
    const members = team.members.map((m) => ({
      userId: m.user.id,
      displayName: m.user.username ?? m.user.email ?? m.user.id,
      scores: scoresByUserId.get(m.user.id) ?? null,
    }));
    const completedCount = members.filter((m) => m.scores !== null).length;

    // Bizalmi háló a csapat megfigyeléseiből — a buildTeamTrustNetwork
    // szemantikájával (páronként a legutolsó kör nyer), de külön DB-kör nélkül.
    const teamObservations = (observationsByTeamId.get(team.id) ?? []).map((o) => ({
      aboutUserId: o.aboutUserId,
      raterUserId: o.raterUserId,
      answers: o.answers as TrustAnswerSet,
    }));
    const trust =
      teamObservations.length > 0
        ? computeTrustNetwork(
            dedupeLatestTrustObservations(teamObservations),
            members.map((m) => m.userId),
          )
        : null;

    const dynamicsEdges = mergeTrustEdges(buildProfileBasedEdges(members), trust);

    // Az EZT a csapatot célzó, legfrissebb aktív kampány (a lista createdAt
    // szerint csökkenő, a getCampaignTeamIds a pontos szabály). Csapat-célzású
    // kampány híján nincs aktív kampány — nem szivárog át más csapaté.
    const campaignRaw = campaignsRaw.find((c) =>
      getCampaignTeamIds(c).includes(team.id),
    );
    const activeCampaign = campaignRaw
      ? computeTeamActiveCampaign(campaignRaw, members, completedObserverInviterIds)
      : null;

    return {
      teamId: team.id,
      teamName: team.name,
      members,
      completedCount,
      pendingInviteCount: pendingCountByTeamId.get(team.id) ?? 0,
      dynamicsEdges,
      activeCampaign,
    };
  });
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

  // Kötegelt betöltés az összes kezelt csapatra (konstans lekérdezés-szám).
  const teamStats = await getManagerCockpitTeamStats(managedTeamIds, membership.orgId);
  if (teamStats.length === 0) return null;

  const teams: ManagerTeamSummary[] = teamStats.map((ts) => {
    const memberCount = ts.members.length;
    return {
      teamId: ts.teamId,
      teamName: ts.teamName,
      memberCount,
      completedCount: ts.completedCount,
      completionPct:
        memberCount > 0 ? Math.round((ts.completedCount / memberCount) * 100) : 0,
      pendingInviteCount: ts.pendingInviteCount,
      hasPattern: ts.completedCount >= 3,
      activeCampaign: ts.activeCampaign,
      ...splitDynamicsEdges(ts.dynamicsEdges),
    };
  });

  // Sort: lowest completion first (where attention is needed most)
  const sortedTeams = sortTeamsByCompletion(teams);

  // A primary (részletesen renderelt) csapat a RENDEZETT lista első eleme —
  // korábban a rendezés ELŐTTI [0] volt, így a tag-lista/dinamika szekció
  // eltérhetett a kártyalista elejétől. Teljes oldal-adat CSAK erre az egy
  // csapatra töltődik; a többinél elég a fenti összegzés.
  const primaryTeam = pickPrimaryTeam(teams);
  const primaryTeamData = primaryTeam
    ? await getTeamPageData(primaryTeam.teamId, locale)
    : null;

  // ── Recent events across all managed teams ──────────────────────────────
  const allUserIds = teamStats.flatMap((ts) => ts.members.map((m) => m.userId));
  const uniqueUserIds = [...new Set(allUserIds)];
  // Több csapatban is tag userek eseményei az ELSŐ kezelt csapatukhoz
  // könyvelődnek (first-team-wins) — tudatos korlát: az assessment/observer
  // eseménynek nincs valós csapat-kontextusa, a pontos attribúció külön
  // adatmodellt kívánna.
  const teamNameByUserId = new Map<string, { teamName: string; teamId: string }>();
  const userNameById = new Map<string, string>();
  for (const ts of teamStats) {
    for (const m of ts.members) {
      if (!teamNameByUserId.has(m.userId)) {
        teamNameByUserId.set(m.userId, { teamName: ts.teamName, teamId: ts.teamId });
      }
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
    teams: sortedTeams,
    primaryTeamData,
    totalMembers: sortedTeams.reduce((s, t) => s + t.memberCount, 0),
    totalCompleted: sortedTeams.reduce((s, t) => s + t.completedCount, 0),
    totalPendingInvites: sortedTeams.reduce((s, t) => s + t.pendingInviteCount, 0),
    recentEvents,
  };
}
