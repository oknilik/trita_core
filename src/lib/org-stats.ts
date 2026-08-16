import { prisma } from "./prisma";
import { extractDimensionScores } from "./scoring";
import {
  getCampaignSteps,
  isCampaignStepDone,
  isSelfResultForCampaign,
} from "./campaign-steps-core";
import { getOrgPendingInviteCount, getOrgTeamCount } from "./org-counts.server";
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "./anonymity";

export interface ParticipantStat {
  userId: string;
  username: string | null;
  email: string | null;
  // Fresh-tudatos: újrafelvételi körben (requireFreshResults) csak az
  // aktiválás UTÁNI self-eredmény / observer-kitöltés számít.
  selfDone: boolean;
  observerCount: number;
  // Kampány-lépés haladás: hány lépést teljesített / mind kész-e.
  stepsDone: number;
  doneAll: boolean;
}

export interface CampaignWithStats {
  id: string;
  name: string;
  description: string | null;
  status: string;
  requireFreshResults: boolean;
  createdAt: string;
  closedAt: string | null;
  creator: { username: string | null };
  participants: ParticipantStat[];
  selfDoneCount: number;
  observerDoneCount: number;
  totalCount: number;
  // A kampány effektív mérés-lépései + lépésenkénti kész-számok.
  steps: string[];
  stepProgress: { type: string; done: number }[];
  fullyDoneCount: number;
  hasObserverStep: boolean;
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
  tritanAvg: Record<string, number> | null;
  memberCount: number;
  pendingCount: number;
  teamCount: number;
  activeCampaignCount: number;
  closedCampaignCount: number;
  // Aktív kampányok „kész" résztvevői — MINDEN kampány-lépést teljesítők
  // (2026-07-29 előtt tévesen a self-teszt kitöltöttsége volt).
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
      type: true,
      steps: true,
      requireFreshResults: true,
      activatedAt: true,
      createdAt: true,
      closedAt: true,
      creator: { select: { username: true } },
      participants: {
        select: {
          userId: true,
          currentStep: true,
          stepCompletions: true,
          user: { select: { username: true, email: true } },
        },
      },
    },
  });

  // Elvetett körök kiszűrése a „Lezárt körök" listából: a CLOSED-ba került,
  // soha nem aktivált ÉS haladás nélküli kampány elvetett vázlat (a régi
  // elvetés-út a lezárás volt; az új a DELETE, a DRAFT→CLOSED átmenet
  // tiltva). A legacy, ténylegesen futott körök activatedAt-ja NULL —
  // őket a résztvevő-haladás (currentStep/stepCompletions) menti meg.
  const visibleCampaigns = rawCampaigns.filter((c) => {
    if (c.status !== "CLOSED" || c.activatedAt) return true;
    return c.participants.some(
      (p) =>
        p.currentStep > 0 ||
        (p.stepCompletions &&
          typeof p.stepCompletions === "object" &&
          !Array.isArray(p.stepCompletions) &&
          Object.keys(p.stepCompletions as Record<string, unknown>).length > 0),
    );
  });

  // Fetch org member IDs for TRITAN averages
  // A pending-invite és team darabszámot a journey completionSummary is
  // kiszámolta ugyanerre az org-ra — közös, kérés-szinten memoizált forrás
  // (org-counts.server.ts), így renderenként egyszer megy ki.
  // A kilépett tagok (leftAt) nem számítanak — a testvér-hívóhelyek
  // (journey/context, org-context, notifications) mintája.
  const [memberRows, pendingRows, teamRows] = await Promise.all([
    prisma.organizationMember.count({
      where: { orgId, leftAt: null, role: { not: "ORG_CONSULTANT" } },
    }),
    getOrgPendingInviteCount(orgId),
    getOrgTeamCount(orgId),
  ]);

  // Collect all participant userIds across all campaigns
  const allParticipantUserIds = Array.from(
    new Set(visibleCampaigns.flatMap((c) => c.participants.map((p) => p.userId)))
  );

  // Fetch self-assessment completion for all participant userIds.
  // Minden self-eredményt visszük, mert átfedő fresh kampányoknál nem
  // feltétlenül ugyanaz a legutolsó eredmény tartozik mindegyik körhöz.
  const selfDoneResults = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: allParticipantUserIds },
      isSelfAssessment: true,
    },
    select: { userProfileId: true, campaignId: true, createdAt: true },
  });
  const selfResultsMap = new Map<
    string,
    Array<{ campaignId: string | null; createdAt: Date }>
  >();
  for (const r of selfDoneResults) {
    if (!r.userProfileId) continue;
    const results = selfResultsMap.get(r.userProfileId) ?? [];
    results.push({ campaignId: r.campaignId, createdAt: r.createdAt });
    selfResultsMap.set(r.userProfileId, results);
  }

  // Fetch completed observer invitations for all participant userIds
  const observerResults = await prisma.observerInvitation.findMany({
    where: {
      inviterId: { in: allParticipantUserIds },
      status: "COMPLETED",
    },
    select: { inviterId: true, completedAt: true },
  });
  const observerCompletionsMap = new Map<string, Date[]>();
  for (const inv of observerResults) {
    const list = observerCompletionsMap.get(inv.inviterId) ?? [];
    list.push(inv.completedAt ?? new Date(0));
    observerCompletionsMap.set(inv.inviterId, list);
  }

  // Build CampaignWithStats
  const campaigns: CampaignWithStats[] = visibleCampaigns.map((c) => {
    const steps = getCampaignSteps(c);
    const hasObserverStep = steps.includes("OBSERVER_360");
    // Fresh-kapu: aktiválás előtti eredmény nem számít az újrafelvételi körben.
    const freshFrom =
      c.requireFreshResults && c.activatedAt ? c.activatedAt.getTime() : null;

    const stepDoneCounts = steps.map(() => 0);
    const participants: ParticipantStat[] = c.participants.map((p) => {
      const selfDone = (selfResultsMap.get(p.userId) ?? []).some((result) =>
        isSelfResultForCampaign(result, c),
      );
      const observerCount = (observerCompletionsMap.get(p.userId) ?? []).filter(
        (d) => freshFrom === null || d.getTime() >= freshFrom,
      ).length;
      // Lépés kész: közös helper (campaign-steps-core) — fresh-tudatos
      // selfDone-nal a legacy OBSERVER_360 fallback is helyes.
      let stepsDone = 0;
      steps.forEach((_stepType, idx) => {
        if (isCampaignStepDone(steps, idx, p, selfDone)) {
          stepsDone += 1;
          stepDoneCounts[idx] += 1;
        }
      });
      return {
        userId: p.userId,
        username: p.user.username ?? null,
        email: p.user.email ?? null,
        selfDone,
        observerCount,
        stepsDone,
        doneAll: stepsDone >= steps.length,
      };
    });

    const selfDoneCount = participants.filter((p) => p.selfDone).length;
    const observerDoneCount = participants.filter((p) => p.observerCount > 0).length;
    const stepProgress = steps.map((stepType, idx) => ({
      type: stepType,
      done: stepDoneCounts[idx],
    }));

    return {
      id: c.id,
      name: c.name,
      description: c.description ?? null,
      status: c.status,
      requireFreshResults: c.requireFreshResults,
      createdAt: c.createdAt.toISOString(),
      closedAt: c.closedAt?.toISOString() ?? null,
      creator: { username: c.creator.username ?? null },
      participants,
      selfDoneCount,
      observerDoneCount,
      totalCount: participants.length,
      steps,
      stepProgress,
      fullyDoneCount: participants.filter((p) => p.doneAll).length,
      hasObserverStep,
    };
  });

  // TRITAN averages: fetch all org member userIds and their assessments.
  // A kilépett tagok itt sem számítanak (leftAt: null) — különben a
  // completedMemberCount és a dimenzió-átlag távozott tagokat is tartalmazna.
  const orgMembers = await prisma.organizationMember.findMany({
    where: { orgId, leftAt: null, role: { not: "ORG_CONSULTANT" } },
    select: { userId: true },
  });
  const orgMemberIds = orgMembers.map((m) => m.userId);

  let tritanAvg: Record<string, number> | null = null;
  let completedMemberCount = 0;
  if (orgMemberIds.length > 0) {
    // A distinct profilonként a RENDEZETT eredmény első sorát tartja meg;
    // orderBy nélkül a legkorábbi kitöltésből számolna. A desc a legutolsó
    // kitöltést hozza — így a self-latest lekérdezéssel (~:143) konzisztens.
    const assessmentResults = await prisma.assessmentResult.findMany({
      where: {
        userProfileId: { in: orgMemberIds },
        isSelfAssessment: true,
      },
      orderBy: { createdAt: "desc" },
      select: { userProfileId: true, scores: true },
      distinct: ["userProfileId"],
    });

    const dims = ["H", "E", "X", "A", "C", "O"];
    const sums: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0 };

    for (const ar of assessmentResults) {
      // Közös score-olvasó (scoring.ts): a legacy FLAT score-sor is számít
      // kitöltésnek — a puszta `.dimensions` olvasás azt itt kihagyta,
      // miközben a hiring felület ugyanazt a sort kitöltöttnek vette.
      const dimScores = extractDimensionScores(ar.scores);
      if (!dimScores) continue;
      const hasAllDims = dims.every((d) => typeof dimScores[d] === "number");
      if (hasAllDims) {
        for (const d of dims) {
          sums[d] += dimScores[d];
        }
        completedMemberCount++;
      }
    }

    // Org-szintű dimenzió-átlag csak az anonimitás-padló felett jelenik meg:
    // ennél kevesebb kitöltőnél az aggregátum közvetve egyéni profilt fedne fel.
    if (completedMemberCount >= MIN_RATERS_FOR_ANONYMOUS_AGGREGATE) {
      tritanAvg = {};
      for (const d of dims) {
        tritanAvg[d] = Math.round(sums[d] / completedMemberCount);
      }
    }
  }

  const activeCampaigns = campaigns.filter((c) => c.status === "ACTIVE");
  const closedCampaigns = campaigns.filter((c) => c.status === "CLOSED");

  const activeSelfDone = activeCampaigns.reduce((sum, c) => sum + c.fullyDoneCount, 0);
  const activeTotalParticipants = activeCampaigns.reduce((sum, c) => sum + c.totalCount, 0);

  return {
    campaigns,
    tritanAvg,
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
