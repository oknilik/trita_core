import "server-only";

import { prisma } from "@/lib/prisma";
import { TRITAN_ORDER } from "@/lib/tritan";
import type { ScoreResult } from "@/lib/scoring";
import {
  DOSSIER_OBSERVER_MIN,
  computeObserverAverage,
  computeDimComparisons,
  topGapDims,
  type SerializedMemberDossier,
  type DossierEdge,
  type DossierEdgeType,
  type DossierFeedbackItem,
  type DossierMeasurementStatus,
} from "@/lib/member-dossier";
import {
  assessRaterQuality,
  buildRaterQualityItemMeta,
  extractRaterAnswers,
} from "@/lib/observer/rater-quality";
import { getTestConfig } from "@/lib/questions";
import { aggregatePeerRoleScores } from "@/lib/team-role-peer";
import { getTopRoles, type TeamRoleScores } from "@/lib/team-role-scoring";
import type { TeamRoleSelections } from "@/lib/team-role-questions";
import { buildTeamTrustNetwork } from "@/lib/trust-network.server";
import type { TrustEdgeType } from "@/lib/trust-network";
import { calculatePairFriction, frictionToEdgeType } from "@/lib/team-stats";
import { getCurrentStepType, getCampaignSteps } from "@/lib/campaign-steps-core";

// ─────────────────────────────────────────────────────────────────────
// Tag-dossié szerver-assembler. A meglévő libek személyre szűrt
// összeszerelése — NEM új mérés. Láthatósági vörös vonalak betartva:
//   · trust: csak pár-/csomópont-aggregátum, self-sor kizárva, irányított
//     válasz SOHA; · observer: aggregátum, min. DOSSIER_OBSERVER_MIN;
//   · anonim peer feedback: csak darabszám, tartalom SOHA;
//   · pszich. biztonság pulse: itt egyáltalán nem szerepel.
// ─────────────────────────────────────────────────────────────────────

function dimsOf(scores: unknown): Record<string, number> {
  const dims = (scores as ScoreResult | null)?.dimensions;
  return dims && typeof dims === "object" ? dims : {};
}

function messageOf(payload: unknown): string {
  const m = (payload as { message?: unknown } | null)?.message;
  return typeof m === "string" ? m : "";
}

// A "disconnected" (nincs működő kapcsolat a pár között) NEM konfliktus —
// élként nem jelenítjük meg, ezért nincs a leképezésben.
const TRUST_TO_DOSSIER: Record<Exclude<TrustEdgeType, "disconnected">, DossierEdgeType> = {
  strong_trust: "aligned",
  moderate: "complementary",
  weak_trust: "friction",
};

function latestIso(dates: (Date | null | undefined)[]): string | null {
  const times = dates.filter((d): d is Date => Boolean(d)).map((d) => d.getTime());
  return times.length ? new Date(Math.max(...times)).toISOString() : null;
}

/**
 * Egy szervezeti tag READ-ONLY dossziéja. A hívó (page) ellenőrzi a
 * jogosultságot (canViewMemberDossier) ÉS a null-t 404-ként kezeli.
 * Kilépett (leftAt) vagy nem-tag targetre null.
 */
export async function buildMemberDossier(
  orgId: string,
  targetUserId: string,
): Promise<SerializedMemberDossier | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: targetUserId } },
    select: {
      role: true,
      joinedAt: true,
      leftAt: true,
      user: { select: { id: true, username: true, email: true } },
    },
  });
  if (!membership || membership.leftAt) return null;

  const teamRows = await prisma.teamMember.findMany({
    where: { userId: targetUserId, team: { orgId } },
    select: { team: { select: { id: true, name: true } } },
    orderBy: { team: { name: "asc" } },
  });
  const teams = teamRows.map((r) => r.team);
  const teamIds = teams.map((t) => t.id);

  const [
    selfLatest,
    selfCount,
    observers,
    roleSelf,
    roleSelfCount,
    rolePeerObs,
    trustGiven,
    peerFeedback,
    activeParticipants,
  ] = await Promise.all([
    prisma.assessmentResult.findFirst({
      where: { userProfileId: targetUserId, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { scores: true, createdAt: true },
    }),
    prisma.assessmentResult.count({
      where: { userProfileId: targetUserId, isSelfAssessment: true },
    }),
    prisma.observerAssessment.findMany({
      where: { invitation: { inviterId: targetUserId, status: "COMPLETED" } },
      orderBy: { createdAt: "desc" },
      select: { scores: true, createdAt: true },
    }),
    prisma.teamRoleScore.findFirst({
      where: { userProfileId: targetUserId, source: "questionnaire" },
      orderBy: { createdAt: "desc" },
      select: { scores: true, createdAt: true },
    }),
    prisma.teamRoleScore.count({
      where: { userProfileId: targetUserId, source: "questionnaire" },
    }),
    prisma.teamRoleObservation.findMany({
      // Csak a tag EBBEN a szervezetben lévő csapataiban, és a self-sor
      // (rater === about) kizárva — pontosan úgy, mint a trustObservation-nél
      // alább. Korábban az aboutUserId-re szűrt, scope nélkül: másik org
      // peer-visszajelzése is beszivárgott a dossiéba, és egy self-értékelés a
      // min-3 anonimitás-padlóba számított (motor-audit).
      where: {
        aboutUserId: targetUserId,
        NOT: { raterUserId: targetUserId },
        teamId: { in: teamIds },
      },
      orderBy: { updatedAt: "asc" },
      select: { raterUserId: true, selections: true, updatedAt: true },
    }),
    prisma.trustObservation.findMany({
      // self-sor (aboutUserId === raterUserId) kizárva; csak a tag csapataiban.
      where: {
        raterUserId: targetUserId,
        NOT: { aboutUserId: targetUserId },
        teamId: { in: teamIds },
      },
      orderBy: { updatedAt: "desc" },
      select: { aboutUserId: true, updatedAt: true },
    }),
    prisma.peerFeedbackItem.findMany({
      where: { toUserId: targetUserId, team: { orgId } },
      orderBy: { createdAt: "desc" },
      select: {
        kind: true,
        visibility: true,
        payload: true,
        createdAt: true,
        from: { select: { username: true, email: true } },
        team: { select: { name: true } },
      },
    }),
    prisma.campaignParticipant.findMany({
      where: { userId: targetUserId, campaign: { orgId, status: "ACTIVE" } },
      select: {
        currentStep: true,
        campaign: { select: { id: true, name: true, type: true, steps: true } },
      },
    }),
  ]);

  // ── Önkép vs. külső kép ────────────────────────────────────────────
  const selfDims = selfLatest ? dimsOf(selfLatest.scores) : {};
  const observerAvg = computeObserverAverage(
    TRITAN_ORDER,
    observers.map((o) => dimsOf(o.scores)),
  );
  const dims = computeDimComparisons(TRITAN_ORDER, selfDims, observerAvg);
  const topGaps = topGapDims(dims);

  // Rater-minőség (halo / straight-line / fordított-item konzisztencia) a
  // tárolt nyers itemválaszokból. CSAK darabszám kerül ki — raterenkénti
  // flag nevesítve soha; nem kizárási szabály, csak olvasási óvatosság.
  // A bank fix (TestType.TRITAN az egyedüli érték); a teljes konfig itemei
  // a rövid (TSFI-S) kitöltéseket is lefedik.
  const raterQualityMeta = buildRaterQualityItemMeta(getTestConfig("TRITAN").questions);
  const observerSuspectCount = observers.reduce((count, o) => {
    const answers = extractRaterAnswers(o.scores);
    if (!answers) return count; // örökség-sor tárolt válaszok nélkül — nem értékelhető
    return assessRaterQuality(answers, raterQualityMeta).suspect ? count + 1 : count;
  }, 0);

  // Csapatszerep peer: raterenként a legutolsó készlet (updatedAt asc → felülír).
  // A rátereket a tag JELENLEGI csapattársaira szűrjük: egy azóta KILÉPETT
  // értékelő régi véleménye nem számíthat a min-3 anonimitás-padlóba, sem az
  // átlagba (motor-audit v6 — a v5 dossier-scope csak a teamId-t + a self-sort
  // zárta, a leaver-rátert nem). A team-tab ugyanezt teszi (S4).
  const currentPeerMemberIds = new Set(
    (
      await prisma.teamMember.findMany({
        where: { teamId: { in: teamIds } },
        select: { userId: true },
      })
    ).map((m) => m.userId),
  );
  const peerByRater = new Map<string, TeamRoleSelections>();
  for (const obs of rolePeerObs) {
    if (!currentPeerMemberIds.has(obs.raterUserId)) continue; // kilépett rater
    peerByRater.set(obs.raterUserId, obs.selections as TeamRoleSelections);
  }
  const peerAgg = aggregatePeerRoleScores([...peerByRater.values()]);
  const roleSelfTop = roleSelf
    ? getTopRoles(roleSelf.scores as TeamRoleScores)
    : null;

  // ── Kapcsolati beágyazottság csapatonként ──────────────────────────
  const embeddedness = [];
  for (const team of teams) {
    const network = await buildTeamTrustNetwork(team.id).catch(() => null);
    const members = await prisma.teamMember.findMany({
      where: { teamId: team.id },
      select: {
        userId: true,
        user: {
          select: {
            username: true,
            email: true,
            assessmentResults: {
              where: { isSelfAssessment: true },
              orderBy: { createdAt: "desc" },
              take: 1,
              select: { scores: true },
            },
          },
        },
      },
    });

    const nameOf = (userId: string): string => {
      const m = members.find((x) => x.userId === userId);
      return m?.user.username ?? m?.user.email ?? userId;
    };
    const selfScoresOf = (userId: string): Record<string, number> | null => {
      const m = members.find((x) => x.userId === userId);
      const s = m?.user.assessmentResults[0]?.scores;
      return s ? dimsOf(s) : null;
    };

    const edges: DossierEdge[] = [];
    const measuredOtherIds = new Set<string>();

    // Mért élek a trust-körből (a tagot érintő párok). A "disconnected"
    // pár mértnek számít (a becslés nem írja felül), de él nem lesz belőle.
    for (const e of network?.edges ?? []) {
      if (e.a !== targetUserId && e.b !== targetUserId) continue;
      const otherUserId = e.a === targetUserId ? e.b : e.a;
      measuredOtherIds.add(otherUserId);
      if (e.type === "disconnected") continue;
      edges.push({
        otherUserId,
        otherName: nameOf(otherUserId),
        type: TRUST_TO_DOSSIER[e.type],
        measured: true,
        mutual: e.mutual,
      });
    }

    // Becsült élek a NEM mért párokra (mindkét félnek legyen self-scoreja).
    const targetSelf = selfScoresOf(targetUserId);
    if (targetSelf) {
      for (const m of members) {
        if (m.userId === targetUserId || measuredOtherIds.has(m.userId)) continue;
        const otherSelf = selfScoresOf(m.userId);
        if (!otherSelf) continue;
        const friction = calculatePairFriction(targetSelf, otherSelf);
        if (friction === null) continue;
        edges.push({
          otherUserId: m.userId,
          otherName: nameOf(m.userId),
          type: frictionToEdgeType(friction) as DossierEdgeType,
          measured: false,
          mutual: null,
        });
      }
    }

    const node = network?.nodes.find((n) => n.userId === targetUserId) ?? null;
    embeddedness.push({
      teamId: team.id,
      teamName: team.name,
      inboundCount: node?.inboundCount ?? 0,
      inboundMean: node?.inboundMean ?? null,
      strongEdgeCount: node?.strongEdgeCount ?? 0,
      isHub: network?.hubUserIds.includes(targetUserId) ?? false,
      isIsolated: network?.isolatedUserIds.includes(targetUserId) ?? false,
      edges,
    });
  }

  // ── Kapott visszajelzések (nevesített tételek + anonim darabszám) ──
  const namedItems: DossierFeedbackItem[] = peerFeedback
    .filter((f) => f.visibility === "named")
    .slice(0, 20)
    .map((f) => ({
      kind: f.kind,
      message: messageOf(f.payload),
      fromName: f.from.username ?? f.from.email ?? "—",
      teamName: f.team.name,
      createdAt: f.createdAt.toISOString(),
    }));
  const anonymousCount = peerFeedback.filter((f) => f.visibility !== "named").length;

  // ── Részvétel-mátrix ───────────────────────────────────────────────
  const trustGivenTargets = new Set(trustGiven.map((t) => t.aboutUserId));
  const statuses: DossierMeasurementStatus[] = [
    { key: "self", lastAt: selfLatest?.createdAt.toISOString() ?? null, count: selfCount },
    {
      key: "observer",
      lastAt: observers[0]?.createdAt.toISOString() ?? null,
      count: observers.length,
    },
    {
      key: "teamRoleSelf",
      lastAt: roleSelf?.createdAt.toISOString() ?? null,
      count: roleSelfCount,
    },
    {
      key: "teamRolePeer",
      lastAt: latestIso(rolePeerObs.map((o) => o.updatedAt)),
      count: peerByRater.size,
    },
    {
      key: "trustGiven",
      lastAt: trustGiven[0]?.updatedAt.toISOString() ?? null,
      count: trustGivenTargets.size,
    },
    {
      key: "peerFeedback",
      lastAt: peerFeedback[0]?.createdAt.toISOString() ?? null,
      count: peerFeedback.length,
    },
  ];

  const activeCampaigns = activeParticipants.map((p) => {
    const steps = getCampaignSteps(p.campaign);
    return {
      campaignId: p.campaign.id,
      name: p.campaign.name,
      currentStepType: getCurrentStepType(p.campaign, { currentStep: p.currentStep }),
      stepIndex: p.currentStep,
      stepCount: steps.length,
    };
  });

  return {
    header: {
      userId: membership.user.id,
      displayName: membership.user.username ?? membership.user.email ?? targetUserId,
      email: membership.user.email,
      orgRole: membership.role,
      joinedAt: membership.joinedAt?.toISOString() ?? null,
      teams,
    },
    participation: { statuses, activeCampaigns },
    selfVsExternal: {
      hasSelf: Boolean(selfLatest),
      selfCompletedAt: selfLatest?.createdAt.toISOString() ?? null,
      selfRoundCount: selfCount,
      observerCount: observers.length,
      observerSuspectCount,
      observerShown: observers.length >= DOSSIER_OBSERVER_MIN,
      dims,
      topGaps,
      teamRole: {
        selfTop: roleSelfTop,
        selfCompletedAt: roleSelf?.createdAt.toISOString() ?? null,
        peerRaterCount: peerAgg.raterCount,
        peerTop: peerAgg.topRoles,
      },
    },
    embeddedness,
    feedback: { namedItems, anonymousCount },
    generatedAt: new Date().toISOString(),
  };
}
