import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { getCapabilityGateCopy } from "@/lib/policy-ux";
import { CampaignStatusButton } from "@/components/org/CampaignStatusButton";
import { AddParticipantButton } from "@/components/org/AddParticipantButton";
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
import { CAMPAIGN_STEP_LABELS, isCampaignStepType } from "@/lib/campaign-steps-core";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Kampány | Trita", robots: { index: false } };
}

const STATUS_TRANSITIONS: Record<string, string | null> = {
  DRAFT: "ACTIVE",
  ACTIVE: "CLOSED",
  CLOSED: null,
};

const TRITAN_DIMS = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;

const TRITAN_COLORS: Record<string, string> = {
  INTE: "var(--color-visual-gradient-indigo)",
  RESO: "var(--color-visual-gradient-violet)",
  TEMP: "#06B6D4",
  ADAP: "var(--color-state-success-strong)",
  THOR: "var(--color-state-warning-strong)",
  OPEN: "#EF4444",
};

const TRITAN_LABEL_KEYS: Record<string, string> = {
  INTE: "org.campaign.tritanINTE",
  RESO: "org.campaign.tritanRESO",
  TEMP: "org.campaign.tritanTEMP",
  ADAP: "org.campaign.tritanADAP",
  THOR: "org.campaign.tritanTHOR",
  OPEN: "org.campaign.tritanOPEN",
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
  const sums: Record<string, number> = { INTE: 0, RESO: 0, TEMP: 0, ADAP: 0, THOR: 0, OPEN: 0 };
  let count = 0;
  for (const r of results) {
    const scores = r.scores as Record<string, number>;
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

  const [campaign, orgMembers] = await Promise.all([
    prisma.campaign.findUnique({
      where: { id: campaignId, orgId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        type: true,
        steps: true,
        teamId: true,
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
            stepCompletions: true,
            user: { select: { id: true, username: true, email: true } },
          },
        },
      },
    }),
    prisma.organizationMember.findMany({
      where: { orgId },
      select: {
        userId: true,
        user: { select: { username: true, email: true } },
      },
    }),
  ]);

  if (!campaign) notFound();

  if (isFrozen) {
    return (
      <div className="min-h-dvh bg-cream">
        <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10">
          <OrgSubscriptionBanner state="frozen" locale={locale} />
          <div className="rounded-2xl border border-sand bg-white p-6 shadow-sm">
            <p className="font-mono text-xs uppercase tracking-widest text-muted">
              {isHu ? "Kampány összegző" : "Campaign summary"}
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
  const isMultiStep = campaignSteps.length > 1;
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

  // Self-assessment completion
  const selfDoneResults = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: participantUserIds },
      isSelfAssessment: true,
    },
    select: { userProfileId: true, scores: true },
    distinct: ["userProfileId"],
  });
  const selfDoneSet = new Set(
    selfDoneResults.map((r) => r.userProfileId).filter(Boolean) as string[]
  );

  // Observer completion
  const observerResults = await prisma.observerInvitation.findMany({
    where: {
      inviterId: { in: participantUserIds },
      status: "COMPLETED",
    },
    select: { inviterId: true },
  });
  const observerCountMap = new Map<string, number>();
  for (const inv of observerResults) {
    observerCountMap.set(inv.inviterId, (observerCountMap.get(inv.inviterId) ?? 0) + 1);
  }

  // Derived stats
  const selfDoneCount = participantUserIds.filter((id) => selfDoneSet.has(id)).length;
  const observerDoneCount = participantUserIds.filter(
    (id) => (observerCountMap.get(id) ?? 0) > 0
  ).length;
  const fullyDoneCount = participantUserIds.filter(
    (id) => selfDoneSet.has(id) && (observerCountMap.get(id) ?? 0) > 0
  ).length;
  const totalCount = participantUserIds.length;

  const completionPct =
    totalCount > 0
      ? Math.round(((isPsychOnly ? psCompletedCount : selfDoneCount) / totalCount) * 100)
      : 0;

  // For CLOSED: compute TRITAN averages + previous campaign comparison
  let currentAvgScores: Record<string, number> | null = null;
  let previousAvgScores: Record<string, number> | null = null;
  let previousCampaignName: string | null = null;

  if (campaign.status === "CLOSED" && selfDoneResults.length > 0) {
    currentAvgScores = computeAvgScores(selfDoneResults);

    // Find the previous CLOSED campaign (before this one)
    const prevCampaign = await prisma.campaign.findFirst({
      where: {
        orgId,
        status: "CLOSED",
        id: { not: campaignId },
        closedAt: { lt: campaign.closedAt ?? new Date() },
      },
      orderBy: { closedAt: "desc" },
      select: {
        id: true,
        name: true,
        participants: {
          select: { userId: true },
        },
      },
    });

    if (prevCampaign) {
      const prevParticipantIds = prevCampaign.participants.map((p) => p.userId);
      if (prevParticipantIds.length > 0) {
        const prevResults = await prisma.assessmentResult.findMany({
          where: {
            userProfileId: { in: prevParticipantIds },
            isSelfAssessment: true,
          },
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
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10">
        {isRestricted || isPastDue || isNone ? (
          <OrgSubscriptionBanner
            state={isNone ? "none" : "restricted"}
            locale={locale}
          />
        ) : null}

        {/* Back link */}
        <Link
          href={`/org/${orgId}?tab=campaigns`}
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-bronze"
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
          <p className="font-mono text-xs uppercase tracking-widest text-bronze">
            {eyebrowLabel(campaign.status, locale)}
          </p>
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

        {/* Több-lépéses kampány: lépésenkénti haladás */}
        {isMultiStep && totalCount > 0 && (
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
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
                const doneCount = campaign.participants.filter((p) => {
                  const sc = p.stepCompletions;
                  return (
                    sc &&
                    typeof sc === "object" &&
                    !Array.isArray(sc) &&
                    Boolean((sc as Record<string, unknown>)[stepType])
                  );
                }).length;
                const hereCount = campaign.participants.filter(
                  (p) => p.currentStep === idx,
                ).length;
                const pct = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;
                return (
                  <div key={stepType} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage/15 font-mono text-[11px] font-bold text-sage-dark">
                      {idx + 1}
                    </span>
                    <span className="w-56 shrink-0 text-[13px] font-medium text-ink md:w-72">
                      {label}
                    </span>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-sand">
                      <div
                        className="h-full rounded-full bg-sage transition-all duration-700"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted">
                      {doneCount}/{totalCount} {isHu ? "kész" : "done"}
                      {hereCount > 0 ? (
                        <span className="text-bronze"> · {hereCount} {isHu ? "itt tart" : "here"}</span>
                      ) : null}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Summary stat cards */}
        {!isPsychOnly && totalCount > 0 && (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Self-assessment */}
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ backgroundColor: "var(--color-sage)" }}
              />
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
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
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ backgroundColor: "#059669" }}
              />
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
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

            {/* Fully done */}
            <div className="relative overflow-hidden rounded-2xl border border-sand bg-white p-5 shadow-sm">
              <div
                className="absolute left-0 right-0 top-0 h-[3px]"
                style={{ backgroundColor: "var(--color-visual-gradient-indigo)" }}
              />
              <p
                className="font-mono text-[10px] uppercase tracking-widest"
                style={{ color: "var(--color-muted)" }}
              >
                {t("org.campaign.fullyComplete", locale)}
              </p>
              <p className="mt-1 font-fraunces text-3xl text-ink">
                {fullyDoneCount}
                <span className="ml-1 font-sans text-sm font-normal text-muted">
                  / {totalCount}
                </span>
              </p>
              <p className="mt-1 text-xs text-ink-body">
                {Math.round((fullyDoneCount / totalCount) * 100)}%{" "}
                {t("org.campaign.bothDone", locale)}
              </p>
            </div>
          </div>
        )}

        {/* Pszich. biztonság: anonim csapatszintű összkép */}
        {hasPsychStep && (
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
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
                  <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-muted">
                    {t("org.campaign.psItemsTitle", locale)}
                  </p>
                  <div className="flex flex-col gap-2.5">
                    {PSYCH_SAFETY_ITEMS.map((item) => {
                      const mean = psAggregate.itemMeans[item.id] ?? 0;
                      const pct = ((mean - 1) / 4) * 100;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          <span className="w-64 shrink-0 text-xs leading-snug text-ink-body md:w-80">
                            {item.text[isHu ? "hu" : "en"]}
                          </span>
                          <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-sand">
                            <div
                              className="h-full rounded-full bg-sage transition-all duration-700"
                              style={{ width: `${Math.max(0, Math.min(100, pct))}%` }}
                            />
                          </div>
                          <span className="w-10 text-right text-xs tabular-nums text-muted">
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
            <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
              <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
                {t("org.campaign.devArcEyebrow", locale)}
              </p>
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
                    <div key={d} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-xs text-ink-body truncate">
                        {label}
                      </span>
                      <div className="flex-1 h-[6px] rounded-full overflow-hidden bg-sand">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${curr}%`,
                            backgroundColor: TRITAN_COLORS[d],
                          }}
                        />
                      </div>
                      <span
                        className={`w-14 text-right text-xs tabular-nums font-semibold ${
                          delta > 0
                            ? "text-emerald-600"
                            : delta < 0
                              ? "text-rose-600"
                              : "text-muted"
                        }`}
                      >
                        {delta > 0 ? `+${delta}` : delta === 0 ? "=" : delta}
                      </span>
                      <span className="w-8 text-right text-xs tabular-nums text-muted">
                        {curr}
                      </span>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

        {/* Participants */}
        <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
          <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
            {t("org.campaign.participantsEyebrow", locale)}
          </p>
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
                const isSelfDone = selfDoneSet.has(p.userId);
                const obsCount = observerCountMap.get(p.userId) ?? 0;
                const isFullyDone = isSelfDone && obsCount > 0;

                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-ink">
                        {p.user.username ?? p.user.email ?? "—"}
                      </p>
                      {p.user.username && (
                        <p className="truncate text-xs text-ink-body/60">{p.user.email}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      {isPsychOnly ? null : isFullyDone ? (
                        <StatusChip variant="success">
                          {t("org.campaign.participantDone", locale)}
                        </StatusChip>
                      ) : isSelfDone ? (
                        <StatusChip variant="info">
                          {t("org.campaign.participantSelfDone", locale)}
                        </StatusChip>
                      ) : (
                        <StatusChip variant="neutral">
                          {t("org.campaign.participantNotStarted", locale)}
                        </StatusChip>
                      )}
                      {!isPsychOnly && obsCount > 0 && (
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
                  className="mt-3 inline-flex min-h-[36px] items-center rounded-lg border border-sand bg-white px-3 text-xs font-semibold text-ink-body transition hover:border-sage/30 hover:text-bronze"
                >
                  {manageGateCopy.ctaLabel}
                </a>
              </div>
            </div>
          ) : null}
        </section>

        {/* Status transition */}
        {canManageCampaign && nextStatus && (
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              {t("org.campaign.statusEyebrow", locale)}
            </p>
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
          </section>
        )}

        {/* Lezárt kampány → riport-híd */}
        {campaign.status === "CLOSED" && campaign.teamId && canManageCampaign ? (
          <section className="rounded-2xl border border-sage/40 bg-sage/5 p-5">
            <Link
              href={`/team/${campaign.teamId}?tab=report`}
              className="text-sm font-semibold text-sage-dark transition hover:text-ink"
            >
              {t("campaignWiz.closedReportCta", locale)}
            </Link>
          </section>
        ) : null}
        {!canManageCampaign && isManagerRole && manageGateCopy ? (
          <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
            <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
              {t("org.campaign.statusEyebrow", locale)}
            </p>
            <h2 className="mb-2 text-sm font-semibold text-ink">{manageGateCopy.title}</h2>
            <p className="text-xs text-ink-body/70">{manageGateCopy.description}</p>
          </section>
        ) : null}

      </main>
    </div>
  );
}
