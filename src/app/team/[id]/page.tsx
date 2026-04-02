import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { canAccessTeam, canManageTeam } from "@/lib/team-auth";
import { getCapabilityGateCopy } from "@/lib/policy-ux";
import { getTeamPageData } from "@/lib/team-stats";
import { createTeamDashboardIA } from "@/lib/dashboard/ia-contract";
import { evaluateProductLayersForScope } from "@/lib/domain/layers-4plus2";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/components/dashboard/DashboardPrimitives";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import { ProgressChecklist } from "@/components/journey/ProgressChecklist";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import { TeamProfileTab } from "@/components/team/TeamProfileTab";
import { TeamMembersTab } from "@/components/team/TeamMembersTab";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("teamDetail.metaTitle", locale),
    robots: { index: false },
  };
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [locale, { userId }, { id: teamId }, resolvedSearchParams] = await Promise.all([
    getServerLocale(), getServerAuth(), params, searchParams,
  ]);
  const activeTab = resolvedSearchParams.tab ?? "overview";
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId }, select: { id: true },
  });
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);
  const deepLinkFallback = await resolveJourneyFallbackForProfileId(profile.id);

  const team = await prisma.team.findUnique({
    where: { id: teamId }, select: { id: true, name: true, orgId: true },
  });
  if (!team) notFound();

  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;
  const orgMemberRole = orgMembership?.role ?? null;
  if (!orgMemberRole) redirect(deepLinkFallback);
  const orgId = team.orgId;
  if (!orgId) redirect(deepLinkFallback);

  const hasTeamAccess = await canAccessTeam(profile.id, teamId, orgMemberRole);
  if (!hasTeamAccess) redirect(deepLinkFallback);
  const isOrgManager = await canManageTeam(profile.id, teamId, orgMemberRole);
  const isHu = locale !== "en";
  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: orgMemberRole,
    teamId,
    hasTeamMembership: true,
  });
  const policy = policySnapshot.policy;
  const manageDecision = resolveOrgCapabilityDecision(policySnapshot, "manage");

  const isRestricted = toOrgSubscriptionBannerState(policy.policyState) === "restricted";
  const isNone = toOrgSubscriptionBannerState(policy.policyState) === "none";
  const isFrozen = policy.policyState === "frozen";
  const canManageTeamActions = isOrgManager && policy.capabilities.has("manage");
  const manageGateCopy =
    isOrgManager && !canManageTeamActions
      ? getCapabilityGateCopy({
          locale,
          reason: manageDecision.reason,
          upgradeHintCode: manageDecision.upgradeHint?.code,
        })
      : null;

  if (isFrozen) {
    const [memberCount, pendingInviteCount] = await Promise.all([
      prisma.teamMember.count({ where: { teamId } }),
      prisma.teamPendingInvite.count({ where: { teamId } }),
    ]);

    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-4xl gap-6 px-4 py-10"
      >
        <OrgSubscriptionBanner state="frozen" locale={locale} />
        <DashboardPanel className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {isHu ? "Csapat összegző" : "Team summary"}
          </p>
          <h1 className="mt-2 font-fraunces text-3xl text-ink">{team.name}</h1>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DashboardMetricCard
              accent="#66455d"
              title={isHu ? "Tagok" : "Members"}
              value={String(memberCount)}
              sub={isHu ? "Aktív csapattagok" : "Active team members"}
            />
            <DashboardMetricCard
              accent="#a66a8c"
              title={isHu ? "Függő meghívók" : "Pending invites"}
              value={String(pendingInviteCount)}
              sub={isHu ? "Még el nem fogadott meghívások" : "Invites waiting for acceptance"}
            />
          </div>
        </DashboardPanel>
      </PlatformPageShell>
    );
  }

  const teamData = await getTeamPageData(teamId, locale as "hu" | "en");
  if (!teamData) notFound();

  // ── Profile tab: heatmap + insights ──────────────────────────────────────
  if (activeTab === "profile") {
    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/team/${teamId}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {teamData.teamName}
          </Link>
        </div>
        <TeamProfileTab
          heatmapRows={teamData.heatmapRows}
          dimConfigs={teamData.dimConfigs}
          locale={locale}
          isHu={isHu}
        />
      </PlatformPageShell>
    );
  }

  // ── Members tab: member list + invites + invite form ────────────────────
  if (activeTab === "members") {
    const membersForTab = teamData.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      displayName: m.displayName,
      email: m.email,
      role: m.role,
      joinedAt: m.joinedAt,
      hasAssessment: m.scores !== null,
      testType: m.testType,
    }));
    const pendingForTab = teamData.pendingInvites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      createdAt: inv.createdAt,
    }));

    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <div className="flex items-center gap-3">
          <Link
            href={`/team/${teamId}`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {teamData.teamName}
          </Link>
        </div>
        <TeamMembersTab
          members={membersForTab}
          pendingInvites={pendingForTab}
          teamId={teamId}
          teamName={teamData.teamName}
          profileId={profile.id}
          isOrgManager={isOrgManager}
          isHu={isHu}
          locale={locale}
          dateLocale={isHu ? "hu-HU" : "en-US"}
        />
      </PlatformPageShell>
    );
  }

  const completedCount = teamData.completedCount;
  const inProgressCount = teamData.members.filter((m) => m.scores === null && m.joinedAt).length;
  const waitingCount = teamData.memberCount - completedCount - inProgressCount;
  const completionPct = teamData.memberCount > 0 ? Math.round((completedCount / teamData.memberCount) * 100) : 0;
  const hasPattern = completedCount >= 3;
  const hasObserver = !!teamData.activeCampaign;
  const patternTarget = 3;
  const patternProgressPct = Math.min(
    Math.round((completedCount / patternTarget) * 100),
    100,
  );
  const observerCoveragePct =
    hasObserver && teamData.activeCampaign!.teamParticipantCount > 0
      ? Math.round(
          (teamData.activeCampaign!.teamObserverDoneCount /
            teamData.activeCampaign!.teamParticipantCount) *
            100,
        )
      : 0;
  const secondaryLabel = hasObserver
    ? t("teamDetail.secondaryFeedbackRound", locale)
    : t("teamDetail.secondaryPatternReadiness", locale);
  const secondaryPct = hasObserver ? observerCoveragePct : patternProgressPct;
  const secondaryText = hasObserver
    ? tf("teamDetail.secondaryObserverProgress", locale, {
        done: teamData.activeCampaign!.teamObserverDoneCount,
        remaining: Math.max(teamData.activeCampaign!.teamParticipantCount - teamData.activeCampaign!.teamObserverDoneCount, 0),
      })
    : hasPattern
      ? t("teamDetail.secondaryPatternAvailable", locale)
      : tf("teamDetail.secondaryPatternProgress", locale, {
          done: Math.min(completedCount, patternTarget),
          target: patternTarget,
        });
  const recommendedAction = (() => {
    if (canManageTeamActions && teamData.orgId) {
      return {
        title: t("teamDetail.nextStep", locale),
        description: hasObserver
          ? t("teamDetail.actionObserverActive", locale)
          : hasPattern
            ? t("teamDetail.actionPatternReady", locale)
            : t("teamDetail.actionCloseMissing", locale),
        primary: {
          label: hasObserver
            ? t("teamDetail.actionManageRound", locale)
            : t("teamDetail.actionStartRound", locale),
          href: `/org/${teamData.orgId}?tab=campaigns`,
        },
        secondary: hasPattern
          ? {
              label: t("teamDetail.actionViewPattern", locale),
              href: `/team/${teamId}?tab=profile`,
            }
          : null,
      };
    }

    return {
      title: t("teamDetail.nextStep", locale),
      description: hasPattern
        ? t("teamDetail.actionPatternAvailable", locale)
        : t("teamDetail.actionNeedMore", locale),
      primary: {
        label: hasPattern
          ? t("teamDetail.actionViewPatternAlt", locale)
          : t("teamDetail.actionOpenMembers", locale),
        href: hasPattern ? `/team/${teamId}?tab=profile` : `/team/${teamId}?tab=members`,
      },
      secondary: null,
    };
  })();
  const teamDashboardVm = createTeamDashboardIA({
    locale: isHu ? "hu" : "en",
    teamName: teamData.teamName,
    memberCount: teamData.memberCount,
    completedCount,
    inProgressCount,
    waitingCount,
    hasPattern,
    hasActiveObserverRound: hasObserver,
    observerDoneCount: teamData.activeCampaign?.teamObserverDoneCount,
    observerParticipantCount: teamData.activeCampaign?.teamParticipantCount,
    pendingInviteCount: teamData.pendingInvites.length,
    recommendedAction,
  });
  const teamLayerStatuses = evaluateProductLayersForScope(isHu ? "hu" : "en", {
    hasSelfAssessmentStarted: teamData.memberCount > 0,
    hasSelfAssessment: completedCount > 0,
    hasBelbinStarted: completedCount > 0,
    hasBelbin: hasPattern,
    hasStrengthProfile: completedCount > 0,
    hasObserverFeedback:
      hasObserver && teamData.activeCampaign!.teamObserverDoneCount > 0,
    hasTeamInsights: hasPattern,
    hasOrgCampaign: hasObserver,
    hasValuesLayerStarted: false,
    hasValuesLayer: false,
    hasConflictLayerStarted: false,
    hasConflictLayer: false,
    hasPlusAccess: true,
  }, "dashboard", "team");
  const teamLayerCompletedCount = teamLayerStatuses.filter(
    (layer) => layer.status === "COMPLETED",
  ).length;
  const statusLine = teamDashboardVm.heroSummary.summary;
  const heroChips = teamDashboardVm.heroSummary.chips;
  const teamHeroTheme = SURFACE_HERO_THEME.team;
  const teamChecklistItems = [
    {
      id: "team-membership",
      title: t("teamDetail.checkCoreTeam", locale),
      detail: tf("teamDetail.checkCoreTeamDetail", locale, { count: teamData.memberCount }),
      done: teamData.memberCount >= 3,
      cta: teamData.memberCount >= 3
        ? undefined
        : {
            label: t("teamDetail.checkCoreTeamCta", locale),
            href: `/team/${teamId}?tab=members`,
          },
    },
    {
      id: "team-assessment",
      title: t("teamDetail.checkAssessments", locale),
      detail: tf("teamDetail.checkAssessmentsDetail", locale, { done: completedCount }),
      done: completedCount >= 3,
      cta: completedCount >= 3
        ? undefined
        : {
            label: t("teamDetail.checkAssessmentsCta", locale),
            href: `/team/${teamId}?tab=members`,
          },
    },
    {
      id: "team-feedback-round",
      title: t("teamDetail.checkFeedbackRound", locale),
      detail: hasObserver
        ? t("teamDetail.checkFeedbackActive", locale)
        : t("teamDetail.checkFeedbackNone", locale),
      done: hasObserver,
      cta: hasObserver || !teamData.orgId
        ? undefined
        : {
            label: t("teamDetail.checkFeedbackCta", locale),
            href: `/org/${teamData.orgId}?tab=campaigns`,
          },
    },
  ];

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
        {/* ═══ HERO ═══ */}
        <SurfaceHero
          variant="team"
          eyebrow={(
            <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
              {t("teamDetail.heroEyebrow", locale)}
            </p>
          )}
          badge={
            hasPattern ? (
              <span
                className="rounded-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: teamHeroTheme.badgeBg, color: teamHeroTheme.badgeText }}
              >
                {t("teamDetail.heroPatternReady", locale)}
              </span>
            ) : undefined
          }
          title={<h1 className="font-fraunces text-[34px] tracking-tight text-white md:text-[40px]">{teamData.teamName}</h1>}
          summary={statusLine}
          chips={heroChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.62]"
            >
              {chip}
            </span>
          ))}
          actions={(
            <>
              {hasPattern ? (
                <Link
                  href={`/team/${teamId}?tab=profile`}
                  className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                  style={{ backgroundColor: teamHeroTheme.primary }}
                >
                  {t("teamDetail.heroViewPattern", locale)}
                </Link>
              ) : null}
              {canManageTeamActions && teamData.orgId ? (
                <Link
                  href={`/org/${teamData.orgId}?tab=campaigns`}
                  className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.62] transition hover:bg-white/[0.12]"
                >
                  {hasObserver
                    ? t("teamDetail.heroManageRound", locale)
                    : t("teamDetail.heroStartRound", locale)}
                </Link>
              ) : null}
              {!canManageTeamActions && isOrgManager && teamData.orgId ? (
                <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.45]">
                  {hasObserver
                    ? t("teamDetail.heroManageRound", locale)
                    : t("teamDetail.heroStartRound", locale)}
                </span>
              ) : null}
            </>
          )}
          footer={
            manageGateCopy ? (
              <p className="text-[12px] text-white/[0.5]">
                {manageGateCopy.description}
              </p>
            ) : undefined
          }
          aside={(
            <>
              <p className="text-[9px] uppercase tracking-[2px] text-white/[0.34]">
                {t("teamDetail.snapshotLabel", locale)}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("teamDetail.snapshotMembers", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{teamData.memberCount}</p>
                </div>
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("teamDetail.snapshotDone", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{completedCount}</p>
                </div>
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("teamDetail.snapshotWait", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{waitingCount}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                    <span>{t("teamDetail.snapshotCompletionRate", locale)}</span>
                    <span className="font-semibold text-white/[0.7]">{completionPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${completionPct}%`, backgroundColor: "#8ad0b4" }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-white/[0.45]">
                    {tf("teamDetail.snapshotDoneInProgress", locale, { done: completedCount, inProgress: inProgressCount })}
                  </p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                    <span>{secondaryLabel}</span>
                    <span className="font-semibold text-white/[0.7]">{secondaryPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${secondaryPct}%`, backgroundColor: teamHeroTheme.primary }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-white/[0.45]">
                    {secondaryText}
                  </p>
                </div>
              </div>
            </>
          )}
        />

        {isRestricted || isNone ? (
          <OrgSubscriptionBanner
            state={isNone ? "none" : "restricted"}
            locale={locale}
          />
        ) : null}

        {/* ═══ ÖSSZEFOGLALÓ ═══ */}
        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionSnapshot", locale)} className="mb-4" />
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {t("teamDetail.summaryLabel", locale)}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Kitöltési arány */}
            <DashboardMetricCard
              accent="var(--color-action-primary-bg)"
              title={t("teamDetail.completionRateTitle", locale)}
              value={`${completionPct}%`}
              sub={tf("teamDetail.completionRateSub", locale, { done: completedCount, inProgress: inProgressCount, waiting: waitingCount })}
            >
              <div className="flex gap-1.5">
                {completedCount > 0 && <div className="h-1.5 rounded-full bg-sage" style={{ flex: completedCount }} />}
                {inProgressCount > 0 && <div className="h-1.5 rounded-full bg-[#d8a253]" style={{ flex: inProgressCount }} />}
                {waitingCount > 0 && <div className="h-1.5 rounded-full bg-bronze/65" style={{ flex: waitingCount }} />}
              </div>
            </DashboardMetricCard>

            {/* Csapatmintázat */}
            <DashboardMetricCard
              accent="var(--color-accent-primary)"
              title={t("teamDetail.teamPatternTitle", locale)}
              value={hasPattern ? t("teamDetail.teamPatternAvailable", locale) : t("teamDetail.teamPatternNotYet", locale)}
              sub={hasPattern
                ? teamData.patternResult?.fullLabel
                : tf("teamDetail.teamPatternProgress", locale, { pct: completionPct })}
            >
              {hasPattern ? (
                <Link
                  href={`/team/${teamId}?tab=profile`}
                  className="inline-flex text-[11px] font-semibold text-sage transition-colors hover:text-sage-dark"
                >
                  {t("teamDetail.teamPatternViewCta", locale)}
                </Link>
              ) : null}
            </DashboardMetricCard>
          </div>
        </section>

        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionJourney", locale)} className="mb-4" />
          <ProgressChecklist
            eyebrow={t("teamDetail.journeyProgress", locale)}
            title={t("teamDetail.journeyTitle", locale)}
            description={t("teamDetail.journeyDescription", locale)}
            items={teamChecklistItems}
            nextStepLabel={t("teamDetail.journeyNextStep", locale)}
          />
        </section>

        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionLayers", locale)} className="mb-4" />
          <DashboardPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {t("teamDetail.layersLabel", locale)}
              </p>
              <DashboardStatusChip
                label={`${teamLayerCompletedCount}/${teamLayerStatuses.length} ${t("teamDetail.layersDoneSuffix", locale)}`}
                tone="sage"
              />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {teamLayerStatuses.map((layer) => {
                const tone =
                  layer.status === "COMPLETED"
                    ? "sage"
                    : layer.status === "IN_PROGRESS"
                      ? "bronze"
                      : layer.status === "AVAILABLE"
                        ? "warm"
                        : "muted";
                const statusLabel = layer.status === "COMPLETED"
                  ? t("teamDetail.statusCompleted", locale)
                  : layer.status === "IN_PROGRESS"
                    ? t("teamDetail.statusInProgress", locale)
                    : layer.status === "AVAILABLE"
                      ? t("teamDetail.statusAvailable", locale)
                      : t("teamDetail.statusLocked", locale);

                return (
                  <div key={layer.id} className="rounded-[14px] border border-sand bg-cream px-3 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-semibold text-ink">{layer.label}</p>
                      <DashboardStatusChip label={statusLabel} tone={tone} />
                    </div>
                    <p className="mt-1 text-[11px] leading-relaxed text-ink-body">
                      {layer.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </DashboardPanel>
        </section>

        {/* ═══ TAGOK ═══ */}
        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionPeople", locale)} className="mb-4" />
          <p className="mb-2 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {t("teamDetail.membersLabel", locale)}
          </p>
          <div className="divide-y divide-[var(--color-border-default)] rounded-[24px] border border-sand bg-white shadow-[0_16px_40px_rgba(26,26,46,0.04)]">
            {teamData.members.map((member) => {
              const isDone = member.scores !== null;
              const avgScore = isDone && member.scores
                ? Math.round(Object.values(member.scores).reduce((s, v) => s + v, 0) / Object.values(member.scores).length)
                : null;
              const [from, to] = getAvatarGradient(member.displayName);
              const initial = getAvatarMonogram(member.displayName, {
                length: 1,
              });

              return (
                <div key={member.id} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-cream/65">
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                  >
                    {initial}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-ink">{member.displayName}</p>
                    <p className="text-[10px] text-ink-body">{member.role}</p>
                  </div>
                  {/* Status badge */}
                  {isDone ? (
                    <DashboardStatusChip label={t("teamDetail.memberDone", locale)} tone="sage" />
                  ) : member.joinedAt ? (
                    <DashboardStatusChip label={t("teamDetail.memberInProgress", locale)} tone="warm" />
                  ) : (
                    <DashboardStatusChip label={t("teamDetail.memberWaiting", locale)} tone="bronze" />
                  )}
                  {/* Score */}
                  <span className="w-8 text-right text-[11px] font-medium text-ink">
                    {avgScore ?? "—"}
                  </span>
                  {/* TODO: wire member profile link and remind action when backend supports it */}
                </div>
              );
            })}
          </div>
        </section>

        {/* ═══ VISSZAJELZÉSI KÖR ═══ */}
        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionNextStep", locale)} className="mb-4" />
          <JourneyNextStepCard
            eyebrow={teamDashboardVm.recommendedAction.title}
            title={hasObserver
              ? tf("teamDetail.nextStepActiveFeedback", locale, { count: teamData.activeCampaign!.teamObserverDoneCount })
              : t("teamDetail.nextStepFocusInsight", locale)}
            description={teamDashboardVm.recommendedAction.description}
            primary={teamDashboardVm.recommendedAction.primary}
            secondary={teamDashboardVm.recommendedAction.secondary}
          />
        </section>

    </PlatformPageShell>
  );
}
