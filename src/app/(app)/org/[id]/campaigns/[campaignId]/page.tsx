import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { getCapabilityGateCopy } from "@/lib/policy-ux";
import { CampaignStatusButton } from "@/components/org/CampaignStatusButton";
import { CampaignDeleteButton } from "@/components/org/CampaignDeleteButton";
import { AddParticipantButton } from "@/components/org/AddParticipantButton";
import { DraftCampaignEditor } from "@/components/org/DraftCampaignEditor";
import { CampaignPacingTile } from "@/components/org/CampaignPacingTile";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import {
  StatusChip,
  type StatusChipVariant,
} from "@/components/ui/primitives/StatusChip";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_MIN_RESPONSES,
  aggregatePsychSafety,
} from "@/lib/psych-safety";
import {
  CAMPAIGN_STEP_LABELS,
  countCampaignStepsDone,
  getCampaignTeamIds,
  isCampaignStepDone,
  isCampaignStepType,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";
import { DIMENSION_BASE } from "@/lib/color-system";
import { extractDimensionScores } from "@/lib/scoring";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Mérés | trita", robots: { index: false } };
}

const STATUS_TRANSITIONS: Record<string, string | null> = {
  DRAFT: "ACTIVE",
  ACTIVE: "CLOSED",
  CLOSED: null,
};

const TRITAN_DIMS = ["H", "E", "X", "A", "C", "O"] as const;

// Kanonikus HEXACO-paletta (color-system.ts) — a korábbi kevert (státusz-
// színeket kölcsönző, O=hiba-piros) helyi térkép kivezetve.
const TRITAN_COLORS: Record<string, string> = DIMENSION_BASE;

const TRITAN_LABEL_KEYS: Record<string, string> = {
  H: "org.campaign.tritanINTE",
  E: "org.campaign.tritanRESO",
  X: "org.campaign.tritanTEMP",
  A: "org.campaign.tritanADAP",
  C: "org.campaign.tritanTHOR",
  O: "org.campaign.tritanOPEN",
};

function statusLabel(status: string, locale: "hu" | "en") {
  if (status === "ACTIVE") return t("org.campaign.statusActive", locale);
  if (status === "CLOSED") return t("org.campaign.statusClosed", locale);
  return t("org.campaign.statusDraft", locale);
}

function statusBadgeVariant(status: string): StatusChipVariant {
  if (status === "ACTIVE") return "success";
  if (status === "CLOSED") return "neutral";
  return "warning";
}

function nextStatusLabel(status: string, locale: "hu" | "en") {
  if (status === "ACTIVE") return t("org.campaign.activateCampaign", locale);
  if (status === "CLOSED") return t("org.campaign.closeCampaign", locale);
  return "";
}

function eyebrowLabel(status: string, locale: "hu" | "en") {
  if (status === "ACTIVE") return t("org.campaign.eyebrowActive", locale);
  if (status === "CLOSED") return t("org.campaign.eyebrowClosed", locale);
  return t("org.campaign.eyebrowDraft", locale);
}

function computeAvgScores(
  results: { userProfileId: string | null; scores: unknown }[]
): Record<string, number> | null {
  const sums: Record<string, number> = { H: 0, E: 0, X: 0, A: 0, C: 0, O: 0 };
  let count = 0;
  for (const r of results) {
    // Közös score-olvasó (scoring.ts): a tárolt sor BEÁGYAZOTT
    // ({dimensions:{...}}) — a korábbi flat-record cast miatt egyetlen
    // modern sor sem számított, így a „Fejlődési ív" sosem renderelt.
    const scores = extractDimensionScores(r.scores);
    if (!scores) continue;
    const hasAll = TRITAN_DIMS.every((d) => typeof scores[d] === "number");
    if (hasAll) {
      for (const d of TRITAN_DIMS) {
        sums[d] += scores[d];
      }
      count++;
    }
  }
  if (count === 0) return null;
  const avg: Record<string, number> = {};
  for (const d of TRITAN_DIMS) {
    avg[d] = Math.round(sums[d] / count);
  }
  return avg;
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string; campaignId: string }>;
}) {
  const [locale, { id: orgId, campaignId }] = await Promise.all([
    getServerLocale(),
    params,
  ]);

  const { profileId, role: memberRole } = await requireOrgContext(orgId);
  // Kampány-felület: csak tanácsadó (ORG_CONSULTANT vagy platform-admin).
  const viewer = await prisma.userProfile.findUnique({
    where: { id: profileId },
    select: { email: true, isConsultant: true },
  });
  if (!isConsultantSurface(memberRole, viewer?.email, viewer?.isConsultant)) {
    redirect(`/org/${orgId}`);
  }
  const isHu = locale !== "en";
  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: memberRole,
  });
  const bannerState = toOrgSubscriptionBannerState(policySnapshot.policy.policyState);
  const isManagerRole = hasOrgRole(memberRole, "ORG_MANAGER");
  const manageDecision = resolveOrgCapabilityDecision(
    policySnapshot,
    "manage",
  );
  const isFrozen = policySnapshot.policy.policyState === "frozen";
  const isNone = bannerState === "none";
  const isRestricted = bannerState === "restricted";
  const isPastDue = policySnapshot.policy.policyState === "past_due";
  const canManageCampaign = isManagerRole && manageDecision.allowed;
  const manageGateCopy =
    isManagerRole && !canManageCampaign
      ? getCapabilityGateCopy({
          locale,
          reason: manageDecision.reason,
          upgradeHintCode: manageDecision.upgradeHint?.code,
        })
      : null;
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  const [campaign, orgMembers, orgTeams] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId, orgId },
      select: {
        id: true,
        name: true,
        description: true,
        presetId: true,
        status: true,
        type: true,
        steps: true,
        teamId: true,
        teamIds: true,
        stepIntervalHours: true,
        requireFreshResults: true,
        activatedAt: true,
        createdAt: true,
        closedAt: true,
        creator: { select: { username: true } },
        participants: {
          orderBy: { addedAt: "asc" },
          select: {
            id: true,
            addedAt: true,
            userId: true,
            completedAt: true,
            currentStep: true,
            nextStepOpensAt: true,
            stepCompletions: true,
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
    }),
    prisma.organizationMember.findMany({
      where: { orgId, leftAt: null },
      select: {
        userId: true,
        user: { select: { username: true, email: true } },
      },
    }),
    prisma.team.findMany({
      where: { orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, _count: { select: { members: true } } },
    }),
  ]);

  if (!campaign) notFound();

  if (isFrozen) {
    return (
      <div className="min-h-dvh bg-cream">
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-10 pb-20">
          <OrgSubscriptionBanner state="frozen" locale={locale} />
          <div className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {isHu ? "Mérés összegző" : "Measurement summary"}
            </p>
            <h1 className="mt-2 font-fraunces text-3xl text-ink">{campaign.name}</h1>
            <p className="mt-2 text-sm text-ink-body">
              {campaign.description ?? (isHu ? "Nincs leírás." : "No description.")}
            </p>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div className="rounded-xl border border-sand bg-cream px-4 py-3">
                <p className="text-xs text-muted">{isHu ? "Állapot" : "Status"}</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {statusLabel(campaign.status, locale)}
                </p>
              </div>
              <div className="rounded-xl border border-sand bg-cream px-4 py-3">
                <p className="text-xs text-muted">{isHu ? "Résztvevők" : "Participants"}</p>
                <p className="mt-1 text-sm font-semibold text-ink">{campaign.participants.length}</p>
              </div>
              <div className="rounded-xl border border-sand bg-cream px-4 py-3">
                <p className="text-xs text-muted">{isHu ? "Létrehozva" : "Created"}</p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {campaign.createdAt.toLocaleDateString(dateLocale)}
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const participantUserIds = campaign.participants.map((p) => p.userId);

  // Több-lépéses kampány: effektív lépések + pulse-jelenlét.
  const campaignSteps =
    campaign.steps.length > 0 ? campaign.steps : [campaign.type];
  // Lépés-haladás szekció: minden kampánynál, kivéve ahol redundáns lenne
  // (egy-lépéses observer → summary-kártyák; egy-lépéses pulse → pulse-blokk).
  const showStepSection =
    campaignSteps.length > 1 ||
    (campaignSteps.length === 1 &&
      campaignSteps[0] !== "SELF_ASSESSMENT" &&
      campaignSteps[0] !== "OBSERVER_360" &&
      campaignSteps[0] !== "PSYCH_SAFETY");
  const hasPsychStep = campaignSteps.includes("PSYCH_SAFETY");
  // Csak-pulse kampánynál a self/observer statok nem értelmezettek.
  const isPsychOnly = campaignSteps.length === 1 && campaignSteps[0] === "PSYCH_SAFETY";

  // Pszich. biztonság pulse: anonim válaszok aggregálása (csak ≥3 válasznál).
  const psCompletedCount = campaign.participants.filter((p) => p.completedAt).length;
  const psAggregate = hasPsychStep
    ? aggregatePsychSafety(
        (
          await prisma.psychSafetyResponse.findMany({
            where: { campaignId },
            select: { answers: true },
          })
        ).map((r) => r.answers),
      )
    : null;

  // A self stat az önálló és az observerrel kombinált self-lépésnél is
  // értelmezett. Az observer stat csak a kombinált körhöz tartozik.
  const hasObserverStep = campaignSteps.includes("OBSERVER_360");
  const hasSelfAssessmentStep =
    campaignSteps.includes("SELF_ASSESSMENT") || hasObserverStep;
  // Újrafelvételi kör: csak az aktiválás UTÁNI kitöltés számít késznek.
  const freshFrom =
    campaign.requireFreshResults && campaign.activatedAt
      ? campaign.activatedAt
      : null;

  // Self-assessment completion (fresh-tudatos). A distinct a RENDEZETT
  // eredmény első sorát tartja meg — orderBy nélkül nem determinisztikus,
  // melyik kitöltés számítana (org-stats mintája: legutolsó nyer).
  const selfDoneResults = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: participantUserIds },
      isSelfAssessment: true,
      ...(campaign.requireFreshResults
        ? freshFrom
          ? {
              OR: [
                { campaignId: campaign.id },
                { campaignId: null, createdAt: { gte: freshFrom } },
              ],
            }
          : { campaignId: campaign.id }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    select: { userProfileId: true, scores: true },
    distinct: ["userProfileId"],
  });
  const selfDoneSet = new Set(
    selfDoneResults.map((r) => r.userProfileId).filter(Boolean) as string[]
  );

  // Observer completion (fresh-tudatos)
  const observerResults = await prisma.observerInvitation.findMany({
    where: {
      inviterId: { in: participantUserIds },
      status: "COMPLETED",
      ...(freshFrom ? { completedAt: { gte: freshFrom } } : {}),
    },
    select: { inviterId: true },
  });
  const observerCountMap = new Map<string, number>();
  for (const inv of observerResults) {
    observerCountMap.set(inv.inviterId, (observerCountMap.get(inv.inviterId) ?? 0) + 1);
  }

  // Lépés-teljesítés: közös helper (campaign-steps-core) — a selfDoneSet
  // már fresh-tudatos, így a legacy OBSERVER_360 fallback is az.
  const isStepDoneFor = (
    p: (typeof campaign.participants)[number],
    idx: number,
  ): boolean => isCampaignStepDone(campaignSteps, idx, p, selfDoneSet.has(p.userId));
  const stepsDoneFor = (p: (typeof campaign.participants)[number]): number =>
    countCampaignStepsDone(campaignSteps, p, selfDoneSet.has(p.userId));

  // Lépésen belüli rész-haladás (értékelős lépések): ki hány csapattársat
  // értékelt már — a „megkezdte, de nem fejezte be" állapot is látszik.
  const partialTeamIds = getCampaignTeamIds(campaign);
  const teamMemberRows =
    partialTeamIds.length > 0
      ? await prisma.teamMember.findMany({
          where: { teamId: { in: partialTeamIds } },
          select: { teamId: true, userId: true },
        })
      : [];
  const memberTeamMap = new Map<string, string>();
  const teamSizeMap = new Map<string, number>();
  for (const row of teamMemberRows) {
    teamSizeMap.set(row.teamId, (teamSizeMap.get(row.teamId) ?? 0) + 1);
    // Kampány-csapatsorrend: az első találat nyer.
    if (!memberTeamMap.has(row.userId)) memberTeamMap.set(row.userId, row.teamId);
  }
  const [roleObsCounts, trustObsCounts, pfGivenPairs] = await Promise.all([
    campaignSteps.includes("TEAM_ROLE_360")
      ? prisma.teamRoleObservation.groupBy({
          by: ["raterUserId"],
          where: { campaignId },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    campaignSteps.includes("TRUST_360")
      ? prisma.trustObservation.groupBy({
          by: ["raterUserId"],
          where: { campaignId },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    campaignSteps.includes("PEER_FEEDBACK")
      ? prisma.peerFeedbackItem.findMany({
          where: { campaignId, kind: "feedforward" },
          select: { fromUserId: true, toUserId: true },
          distinct: ["fromUserId", "toUserId"],
        })
      : Promise.resolve([]),
  ]);
  const partialCountFor = (userId: string, stepType: string): number => {
    if (stepType === "TEAM_ROLE_360")
      return roleObsCounts.find((r) => r.raterUserId === userId)?._count._all ?? 0;
    if (stepType === "TRUST_360")
      return trustObsCounts.find((r) => r.raterUserId === userId)?._count._all ?? 0;
    if (stepType === "PEER_FEEDBACK")
      return pfGivenPairs.filter((r) => r.fromUserId === userId).length;
    return 0;
  };
  const peerTotalFor = (userId: string): number => {
    const teamId = memberTeamMap.get(userId);
    if (!teamId) return 0;
    return Math.max((teamSizeMap.get(teamId) ?? 0) - 1, 0);
  };

  // Derived stats
  const selfDoneCount = participantUserIds.filter((id) => selfDoneSet.has(id)).length;
  const observerDoneCount = participantUserIds.filter(
    (id) => (observerCountMap.get(id) ?? 0) > 0
  ).length;
  const observerFullyDoneCount = participantUserIds.filter(
    (id) => selfDoneSet.has(id) && (observerCountMap.get(id) ?? 0) > 0
  ).length;
  const totalCount = participantUserIds.length;
  // Kampány-kész: aki a kampány MINDEN lépésével végzett.
  const fullyDoneCount = campaign.participants.filter(
    (p) => stepsDoneFor(p) >= campaignSteps.length,
  ).length;

  const completionPct =
    totalCount > 0 ? Math.round((fullyDoneCount / totalCount) * 100) : 0;

  let pacingTile = null;
  if (campaign.status === "ACTIVE" && totalCount > 0) {
    // Szerveroldali request-pillanatkép: ugyanaz az időreferencia dönt minden
    // résztvevő nyitott/ütemezett állapotáról ebben az egy renderben.
    // eslint-disable-next-line react-hooks/purity
    const pacingNow = Date.now();
    let doneCount = 0;
    let scheduledCount = 0;
    let nextReleaseAt: Date | null = null;
    const openStepCounts = new Map<string, number>();

    for (const participant of campaign.participants) {
      const stepType = campaignSteps[participant.currentStep];
      if (!stepType) {
        doneCount += 1;
        continue;
      }
      if (
        participant.nextStepOpensAt &&
        participant.nextStepOpensAt.getTime() > pacingNow
      ) {
        scheduledCount += 1;
        if (!nextReleaseAt || participant.nextStepOpensAt < nextReleaseAt) {
          nextReleaseAt = participant.nextStepOpensAt;
        }
        continue;
      }
      openStepCounts.set(stepType, (openStepCounts.get(stepType) ?? 0) + 1);
    }

    const openStepType =
      [...openStepCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const openCount = [...openStepCounts.values()].reduce((sum, count) => sum + count, 0);
    const targetTeamId = getCampaignTeamIds(campaign)[0] ?? null;

    pacingTile = {
      orgId,
      campaignId: campaign.id,
      campaignName: campaign.name,
      teamName: targetTeamId
        ? orgTeams.find((team) => team.id === targetTeamId)?.name ?? null
        : null,
      stepIntervalHours: campaign.stepIntervalHours,
      totalParticipants: totalCount,
      doneCount,
      openCount,
      openStepType,
      scheduledCount,
      nextReleaseAt: nextReleaseAt?.toISOString() ?? null,
    };
  }

  // For CLOSED: compute TRITAN averages + previous campaign comparison
  let currentAvgScores: Record<string, number> | null = null;
  let previousAvgScores: Record<string, number> | null = null;
  let previousCampaignName: string | null = null;

  if (campaign.status === "CLOSED" && selfDoneResults.length > 0) {
    currentAvgScores = computeAvgScores(selfDoneResults);

    // Find the previous CLOSED campaign (before this one). Elvetett
    // (nem aktivált ÉS haladás nélküli) kör nem összehasonlítási alap —
    // a legacy futott körök activatedAt-ja NULL, őket a résztvevő-haladás
    // azonosítja (ld. org-stats visibleCampaigns szűrő).
    const prevCandidates = await prisma.campaign.findMany({
      where: {
        orgId,
        status: "CLOSED",
        id: { not: campaignId },
        closedAt: { lt: campaign.closedAt ?? new Date() },
      },
      orderBy: { closedAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        activatedAt: true,
        participants: {
          select: { userId: true, currentStep: true },
        },
      },
    });
    const prevCampaign =
      prevCandidates.find(
        (c) => c.activatedAt || c.participants.some((p) => p.currentStep > 0),
      ) ?? null;

    if (prevCampaign) {
      const prevParticipantIds = prevCampaign.participants.map((p) => p.userId);
      if (prevParticipantIds.length > 0) {
        // A „korábbi" eredmény a JELENLEGI kör indulása ELŐTTI legutolsó
        // kitöltés. Időhatár + orderBy nélkül a distinct rendezetlen sort
        // adott vissza — a „korábbi" akár ugyanaz a sor lehetett, mint a
        // jelenlegi, és a fejlődési ív hamis nullát mutatott.
        const currentCampaignStart = campaign.activatedAt ?? campaign.createdAt;
        const prevResults = await prisma.assessmentResult.findMany({
          where: {
            userProfileId: { in: prevParticipantIds },
            isSelfAssessment: true,
            createdAt: { lt: currentCampaignStart },
          },
          orderBy: { createdAt: "desc" },
          select: { userProfileId: true, scores: true },
          distinct: ["userProfileId"],
        });
        previousAvgScores = computeAvgScores(prevResults);
        previousCampaignName = prevCampaign.name;
      }
    }
  }

  const nextStatus = STATUS_TRANSITIONS[campaign.status] ?? null;

  // Available members not yet in campaign
  const addedUserIds = new Set(campaign.participants.map((p) => p.user.id));
  const availableMembers = orgMembers
    .filter((m) => !addedUserIds.has(m.userId))
    .map((m) => ({
      userId: m.userId,
      username: m.user.username ?? null,
      email: m.user.email ?? null,
    }));

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 pt-10 pb-20 md:gap-10">
        {isRestricted || isPastDue || isNone ? (
          <OrgSubscriptionBanner
            state={isNone ? "none" : "restricted"}
            locale={locale}
          />
        ) : null}

        {/* Back link */}
        <Link
          href={`/org/${orgId}?tab=campaigns`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-[var(--color-accent-primary-strong)]"
        >
          <svg
            viewBox="0 0 16 16"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M10 3L5 8l5 5" />
          </svg>
          {t("org.backToOrg", locale)}
        </Link>

        {/* Header */}
        <div>
          <SectionEyebrow>
            {eyebrowLabel(campaign.status, locale)}
          </SectionEyebrow>
          <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
            {campaign.name}
          </h1>
          {campaign.description && (
            <p className="mt-1 text-sm text-ink-body">{campaign.description}</p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <StatusChip variant={statusBadgeVariant(campaign.status)}>
              {statusLabel(campaign.status, locale)}
            </StatusChip>
            {campaign.requireFreshResults && (
              <StatusChip variant="info">
                {t("org.card.freshRound", locale)}
              </StatusChip>
            )}
            <span className="text-xs text-ink-body/50">
              {t("org.campaign.createdAt", locale)}{" "}
              {campaign.createdAt.toLocaleDateString(dateLocale)}
            </span>
            {campaign.closedAt && (
              <span className="text-xs text-ink-body/50">
                {t("org.campaign.closedAt", locale)}{" "}
                {campaign.closedAt.toLocaleDateString(dateLocale)}
              </span>
            )}
            <span className="text-xs text-ink-body/50">
              {totalCount}{" "}
              {totalCount === 1
                ? t("org.campaign.participant", locale)
                : t("org.campaign.participants", locale)}
            </span>
            {totalCount > 0 && (
              <span className="text-xs text-ink-body/50">
                {completionPct}% {t("org.campaign.complete", locale)}
              </span>
            )}
          </div>
        </div>

        {pacingTile ? (
          <CampaignPacingTile
            data={pacingTile}
            canManagePacing={canManageCampaign}
            isHu={isHu}
          />
        ) : null}

        {/* Lépésenkénti haladás — a kampány SAJÁT mérései */}
        {showStepSection && totalCount > 0 && (
          <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
              {isHu ? "Mérés-lépések" : "Measurement steps"}
            </p>
            <p className="mb-5 text-xs text-ink-body/70">
              {isHu
                ? "A lépések tagonként, sorban nyílnak meg — aki végez az egyikkel, annak (értesítéssel) megnyílik a következő."
                : "Steps open per member, in order — when someone finishes one, the next opens for them (with a notification)."}
            </p>
            <div className="flex flex-col gap-3">
              {campaignSteps.map((stepType, idx) => {
                const label = isCampaignStepType(stepType)
                  ? isHu
                    ? CAMPAIGN_STEP_LABELS[stepType].hu
                    : CAMPAIGN_STEP_LABELS[stepType].en
                  : stepType;
                const doneCount = campaign.participants.filter((p) =>
                  isStepDoneFor(p, idx),
                ).length;
                const hereCount = campaign.participants.filter(
                  (p) => p.currentStep === idx,
                ).length;
                const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                return (
                  // Mobilon két sorba törik (címke fent, sáv + számláló lent),
                  // md-től az eredeti egysoros elrendezés.
                  <div key={stepType} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/15 font-mono text-[11px] font-bold text-sage-dark">
                      {idx + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-caption font-medium text-ink md:w-72 md:flex-none">
                      {label}
                    </span>
                    <div className="flex w-full min-w-0 items-center gap-3 md:w-auto md:flex-1">
                      <div className="h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-sand">
                        <div
                          className="h-full rounded-full bg-sage transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="shrink-0 text-right text-xs tabular-nums text-muted md:w-24">
                        {doneCount}/{totalCount} {isHu ? "kész" : "done"}
                        {hereCount > 0 ? (
                          <span className="text-[var(--color-accent-primary-strong)]"> · {hereCount} {isHu ? "itt tart" : "here"}</span>
                        ) : null}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Self stat az önálló Scan-lépésnél is; observer oszlopok csak a
            külső visszajelzést ténylegesen tartalmazó körben jelennek meg. */}
        {hasSelfAssessmentStep && totalCount > 0 && (
          <div
            className={`grid grid-cols-1 gap-4 ${
              hasObserverStep ? "md:grid-cols-3" : "md:grid-cols-1"
            }`}
          >
            {/* Self-assessment */}
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-surface-card p-5 shadow-sm">
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ backgroundColor: "var(--color-sage)" }}
              />
              <p
                className="font-mono text-micro uppercase tracking-widest"
                style={{ color: "var(--color-muted)" }}
              >
                {t("org.campaign.selfAssessment", locale)}
              </p>
              <p className="mt-1 font-fraunces text-3xl text-ink">
                {selfDoneCount}
                <span className="ml-1 font-sans text-sm font-normal text-muted">
                  / {totalCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-body">
                {Math.round((selfDoneCount / totalCount) * 100)}%{" "}
                {t("org.campaign.completed", locale)}
              </p>
            </div>

            {/* Observer */}
            {hasObserverStep && (
              <div className="relative overflow-hidden rounded-2xl border border-sand bg-surface-card p-5 shadow-sm">
                <div
                  className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ backgroundColor: "var(--color-state-success-solid)" }}
                />
                <p
                  className="font-mono text-micro uppercase tracking-widest"
                  style={{ color: "var(--color-muted)" }}
                >
                  {t("org.campaign.observerDone", locale)}
                </p>
                <p className="mt-1 font-fraunces text-3xl text-ink">
                  {observerDoneCount}
                  <span className="ml-1 font-sans text-sm font-normal text-muted">
                    / {totalCount}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-body">
                  {Math.round((observerDoneCount / totalCount) * 100)}%{" "}
                  {t("org.campaign.receivedFeedback", locale)}
                </p>
              </div>
            )}

            {/* Fully done */}
            {hasObserverStep && (
              <div className="relative overflow-hidden rounded-2xl border border-sand bg-surface-card p-5 shadow-sm">
                <div
                  className="absolute left-0 right-0 top-0 h-[3px]"
                  style={{ backgroundColor: "var(--color-layer-org-bright)" }}
                />
                <p
                  className="font-mono text-micro uppercase tracking-widest"
                  style={{ color: "var(--color-muted)" }}
                >
                  {t("org.campaign.fullyComplete", locale)}
                </p>
                <p className="mt-1 font-fraunces text-3xl text-ink">
                  {observerFullyDoneCount}
                  <span className="ml-1 font-sans text-sm font-normal text-muted">
                    / {totalCount}
                  </span>
                </p>
                <p className="mt-1 text-xs text-ink-body">
                  {Math.round((observerFullyDoneCount / totalCount) * 100)}%{" "}
                  {t("org.campaign.bothDone", locale)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Pszich. biztonság: anonim csapatszintű összkép */}
        {hasPsychStep && (
          <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
              {t("org.campaign.psEyebrow", locale)}
            </p>
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <h2 className="font-fraunces text-xl text-ink">
                {t("org.campaign.psIndexTitle", locale)}
              </h2>
              <span className="text-xs text-ink-body/60">
                {psCompletedCount} / {totalCount} {t("org.campaign.psCompleted", locale)}
              </span>
            </div>
            <p className="mt-2 max-w-2xl text-xs leading-relaxed text-ink-body/70">
              {t("org.campaign.psAnonNote", locale)}
            </p>

            {psAggregate ? (
              <div className="mt-6 flex flex-col gap-6">
                <div className="flex items-center gap-5">
                  <p className="font-fraunces text-5xl text-ink">
                    {psAggregate.index}
                    <span className="ml-1 font-sans text-sm font-normal text-muted">/ 100</span>
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {t(
                        psAggregate.band === "high"
                          ? "org.campaign.psBandHigh"
                          : psAggregate.band === "mid"
                            ? "org.campaign.psBandMid"
                            : "org.campaign.psBandLow",
                        locale,
                      )}
                    </p>
                    <p className="mt-0.5 text-xs text-ink-body/60">
                      {tf("org.campaign.psResponses", locale, { count: psAggregate.count })} ·{" "}
                      {tf("org.campaign.psSpread", locale, { spread: psAggregate.spread })}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="mb-3 font-mono text-micro uppercase tracking-widest text-muted">
                    {t("org.campaign.psItemsTitle", locale)}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {PSYCH_SAFETY_ITEMS.map((item) => {
                      const mean = psAggregate.itemMeans[item.id] ?? 0;
                      const pct = ((mean - 1) / 4) * 100;
                      return (
                        // Mobilon az item-szöveg saját sorba kerül, a sáv +
                        // átlag alá; md-től marad az egysoros elrendezés.
                        <div key={item.id} className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                          <span className="w-full text-xs leading-snug text-ink-body md:w-80 md:shrink-0">
                            {item.text[isHu ? "hu" : "en"]}
                          </span>
                          <div className="h-[6px] min-w-0 flex-1 overflow-hidden rounded-full bg-sand">
                            <div
                              className="h-full rounded-full bg-sage transition-all duration-700"
                              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                            />
                          </div>
                          <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">
                            {mean.toFixed(1)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="mt-6 rounded-xl border border-sand bg-cream px-4 py-4">
                <p className="text-sm text-ink-body">
                  {tf("org.campaign.psBelowThreshold", locale, {
                    min: PSYCH_SAFETY_MIN_RESPONSES,
                  })}
                </p>
              </div>
            )}
          </section>
        )}

        {/* Development arc (closed campaigns with previous data) */}
        {!isPsychOnly &&
          campaign.status === "CLOSED" &&
          currentAvgScores &&
          previousAvgScores &&
          previousCampaignName && (
            <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
              <SectionEyebrow className="mb-1">
                {t("org.campaign.devArcEyebrow", locale)}
              </SectionEyebrow>
              <h2 className="mb-1 font-fraunces text-xl text-ink">
                {t("org.campaign.devArcTitle", locale)}
              </h2>
              <p className="mb-5 text-xs text-ink-body">
                {tf("org.campaign.devArcCompare", locale, { name: previousCampaignName! })}
              </p>
              <div className="flex flex-col gap-3">
                {TRITAN_DIMS.map((d) => {
                  const curr = currentAvgScores![d] ?? 0;
                  const prev = previousAvgScores![d] ?? 0;
                  const delta = curr - prev;
                  const label = t(TRITAN_LABEL_KEYS[d], locale);
                  return (
                    <div key={d} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="w-full truncate text-xs text-ink-body md:w-36 md:shrink-0">
                        {label}
                      </span>
                      <div className="flex-1 min-w-0 h-[6px] rounded-full overflow-hidden bg-sand">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${curr}%`,
                            backgroundColor: TRITAN_COLORS[d],
                          }}
                        />
                      </div>
                      {/* Irány-jelzés moralizáló zöld/piros nélkül (a
                          személyiség-pontszám változása nem jó/rossz) —
                          zsálya/bronz + előjel hordozza az irányt. */}
                      <span
                        className={`w-14 shrink-0 text-right text-xs tabular-nums font-semibold ${
                          delta > 0
                            ? "text-sage-dark"
                            : delta < 0
                              ? "text-bronze-700"
                              : "text-muted"
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                      </span>
                      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-muted">
                        {curr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        {/* Participants */}
        <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
          <SectionEyebrow className="mb-1">
            {t("org.campaign.participantsEyebrow", locale)}
          </SectionEyebrow>
          <h2 className="mb-5 font-fraunces text-xl text-ink">
            {t("org.campaign.participantsTitle", locale)}{" "}
            <span className="font-sans text-sm font-normal text-ink-body/50">
              ({totalCount})
            </span>
          </h2>

          {totalCount === 0 ? (
            <p className="py-6 text-center text-sm text-ink-body/50">
              {t("org.campaign.noParticipants", locale)}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-sand">
              {campaign.participants.map((p) => {
                const obsCount = observerCountMap.get(p.userId) ?? 0;
                // Lépés-alapú állapot: hol tart a KAMPÁNY lépéseiben —
                // nem a személyiség-teszt kitöltöttségében.
                const stepsDone = stepsDoneFor(p);
                const isAllDone = stepsDone >= campaignSteps.length;
                const currentType = campaignSteps.find(
                  (_, idx) => !isStepDoneFor(p, idx),
                );
                const currentLabel =
                  currentType && isCampaignStepType(currentType)
                    ? isHu
                      ? CAMPAIGN_STEP_LABELS[currentType].hu
                      : CAMPAIGN_STEP_LABELS[currentType].en
                    : currentType;

                return (
                  <div
                    key={p.id}
                    className="flex flex-col gap-1.5 py-3 md:flex-row md:items-center md:justify-between md:gap-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {p.user.username ?? p.user.email ?? "—"}
                      </p>
                      {p.user.username && (
                        <p className="truncate text-xs text-ink-body/60">{p.user.email}</p>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:shrink-0">
                      {isPsychOnly ? null : isAllDone ? (
                        <StatusChip variant="success">
                          {t("org.campaign.participantDone", locale)}
                        </StatusChip>
                      ) : stepsDone > 0 ? (
                        <StatusChip variant="info">
                          {stepsDone}/{campaignSteps.length} {isHu ? "lépés" : "steps"}
                        </StatusChip>
                      ) : currentType && partialCountFor(p.userId, currentType) > 0 ? (
                        // Lépésen belüli rész-haladás: elkezdte, még nem zárta le.
                        <StatusChip variant="info">
                          {isHu ? "Elkezdte" : "Started"}
                        </StatusChip>
                      ) : (
                        <StatusChip variant="neutral">
                          {t("org.campaign.participantNotStarted", locale)}
                        </StatusChip>
                      )}
                      {!isPsychOnly && !isAllDone && currentLabel && (
                        <span className="hidden text-xs text-muted md:inline">
                          {isHu ? "most:" : "now:"} {currentLabel}
                          {(() => {
                            // Értékelős lépésen a rész-haladás is látszik (2/5).
                            const done = currentType ? partialCountFor(p.userId, currentType) : 0;
                            const total = peerTotalFor(p.userId);
                            return done > 0 && total > 0 ? (
                              <span className="ml-1 font-semibold text-[var(--color-accent-primary-strong)]">
                                · {Math.min(done, total)}/{total}
                              </span>
                            ) : null;
                          })()}
                        </span>
                      )}
                      {hasObserverStep && obsCount > 0 && (
                        <span className="text-xs text-muted">
                          {obsCount} obs.
                        </span>
                      )}
                      <span className="text-xs text-ink-body/50">
                        {p.addedAt.toLocaleDateString(dateLocale)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {canManageCampaign && campaign.status !== "CLOSED" && availableMembers.length > 0 && (
            <div className="mt-5 border-t border-sand pt-5">
              <AddParticipantButton
                orgId={orgId}
                campaignId={campaign.id}
                members={availableMembers}
                isHu={isHu}
              />
            </div>
          )}
          {!canManageCampaign && isManagerRole && manageGateCopy ? (
            <div className="mt-5 border-t border-sand pt-5">
              <div className="rounded-xl border border-sand bg-cream px-4 py-4">
                <p className="text-sm font-semibold text-ink">{manageGateCopy.title}</p>
                <p className="mt-1 text-xs text-ink-body">{manageGateCopy.description}</p>
                <a
                  href={manageGateCopy.ctaHref}
                  className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-sand bg-surface-card px-3 text-xs font-semibold text-ink-body transition hover:border-sage/30 hover:text-[var(--color-accent-primary-strong)]"
                >
                  {manageGateCopy.ctaLabel}
                </a>
              </div>
            </div>
          ) : null}
        </section>

        {/* Peer feedback kör — részvételi statisztika (F4, tartalom nélkül) */}
        {(campaign.steps.length > 0 ? campaign.steps : [campaign.type]).includes(
          "PEER_FEEDBACK",
        ) &&
          (await (async () => {
            const [givers, receivedCounts] = await Promise.all([
              prisma.peerFeedbackItem.groupBy({
                by: ["fromUserId"],
                where: { campaignId: campaign.id, kind: "feedforward" },
                _count: { _all: true },
              }),
              prisma.peerFeedbackItem.groupBy({
                by: ["toUserId"],
                where: { campaignId: campaign.id, kind: "feedforward" },
                _count: { _all: true },
              }),
            ]);
            const totalItems = givers.reduce((sum, g) => sum + g._count._all, 0);
            const atLeastThree = receivedCounts.filter((r) => r._count._all >= 3).length;
            return (
              <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
                <SectionEyebrow className="mb-1">
                  {t("org.campaign.peerFbStatsEyebrow", locale)}
                </SectionEyebrow>
                <h2 className="mb-3 text-sm font-semibold text-ink">
                  {t("org.campaign.peerFbStatsTitle", locale)}
                </h2>
                <p className="text-sm text-ink-body">
                  {tf("org.campaign.peerFbStatsBody", locale, {
                    givers: givers.length,
                    items: totalItems,
                    covered: atLeastThree,
                  })}
                </p>
                <p className="mt-2 text-xs text-muted">
                  {t("org.campaign.peerFbStatsNote", locale)}
                </p>
              </section>
            );
          })())}

        {/* DRAFT-szerkesztő: mérések + célzás + ütem, aktiválás előtt */}
        {canManageCampaign && campaign.status === "DRAFT" && (
          <DraftCampaignEditor
            orgId={orgId}
            campaignId={campaign.id}
            initialPresetId={campaign.presetId}
            initialSteps={
              (campaign.steps.length > 0
                ? campaign.steps
                : [campaign.type]) as CampaignStepType[]
            }
            initialTeamIds={getCampaignTeamIds(campaign)}
            initialIntervalHours={campaign.stepIntervalHours}
            teams={orgTeams.map((team) => ({
              id: team.id,
              name: team.name,
              memberCount: team._count.members,
            }))}
            locale={locale}
          />
        )}

        {/* Status transition */}
        {canManageCampaign && nextStatus && (
          <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
            <SectionEyebrow className="mb-1">
              {t("org.campaign.statusEyebrow", locale)}
            </SectionEyebrow>
            <h2 className="mb-3 text-sm font-semibold text-ink">
              {t("org.campaign.managementTitle", locale)}
            </h2>
            <p className="mb-4 text-xs text-ink-body/60">
              {campaign.status === "DRAFT"
                ? t("org.campaign.activateDescription", locale)
                : t("org.campaign.closeDescription", locale)}
            </p>
            <CampaignStatusButton
              orgId={orgId}
              campaignId={campaign.id}
              nextStatus={nextStatus}
              label={nextStatusLabel(nextStatus, locale)}
              isDanger={nextStatus === "CLOSED"}
              confirmMessage={t(
                nextStatus === "CLOSED"
                  ? "campaignWiz.closeConfirm"
                  : "campaignWiz.activateConfirm",
                locale,
              )}
            />
            {/* Mérés törlése — nem-DRAFT is (a vázlat-elvetés a szerkesztőben él) */}
            {campaign.status !== "DRAFT" && (
              <CampaignDeleteButton orgId={orgId} campaignId={campaign.id} locale={locale} />
            )}
          </section>
        )}

        {/* Lezárt mérésnél nincs státusz-átmenet — a törlés külön kártyán */}
        {canManageCampaign && campaign.status === "CLOSED" && (
          <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
            <SectionEyebrow className="mb-1">
              {t("org.campaign.statusEyebrow", locale)}
            </SectionEyebrow>
            <h2 className="text-sm font-semibold text-ink">
              {t("org.campaign.managementTitle", locale)}
            </h2>
            <CampaignDeleteButton orgId={orgId} campaignId={campaign.id} locale={locale} />
          </section>
        )}

        {/* Lezárt kampány → riport-híd (több-csapatos kampánynál csapatonként) */}
        {campaign.status === "CLOSED" && canManageCampaign && getCampaignTeamIds(campaign).length > 0 ? (
          <section className="flex flex-col gap-2 rounded-2xl border border-sage/40 bg-sage/5 p-5">
            {getCampaignTeamIds(campaign).map((tid) => {
              const team = orgTeams.find((tm) => tm.id === tid);
              return (
                <Link
                  key={tid}
                  href={`/team/${tid}?tab=report`}
                  className="text-sm font-semibold text-sage-dark transition hover:text-ink"
                >
                  {t("campaignWiz.closedReportCta", locale)}
                  {team && getCampaignTeamIds(campaign).length > 1 ? ` — ${team.name}` : ""}
                </Link>
              );
            })}
          </section>
        ) : null}
        {!canManageCampaign && isManagerRole && manageGateCopy ? (
          <section className="rounded-2xl border border-sand bg-surface-card p-6 shadow-sm md:p-8">
            <SectionEyebrow className="mb-1">
              {t("org.campaign.statusEyebrow", locale)}
            </SectionEyebrow>
            <h2 className="mb-2 text-sm font-semibold text-ink">{manageGateCopy.title}</h2>
            <p className="text-xs text-ink-body/70">{manageGateCopy.description}</p>
          </section>
        ) : null}

      </main>
    </div>
  );
}
