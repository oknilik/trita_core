import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { getOrgSubscription, getSubscriptionState } from "@/lib/subscription";
import { getOrgPageData } from "@/lib/org-stats";
import { evaluateProductLayersForScope } from "@/lib/domain/layers-4plus2";
import { OrgPageShell } from "@/components/org/OrgPageShell";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
  DashboardStatusChip,
} from "@/components/dashboard/DashboardPrimitives";
import { createOrgDashboardIA, type DashboardRiskAttentionItem } from "@/lib/dashboard/ia-contract";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Szervezet | trita" : "Organization | trita",
    robots: { index: false },
  };
}

// ── Avatar color (shared with UserMenu) ─────────────────────────────────────
const AVATAR_COLORS = [
  ["#2a5244", "#1e3d34"],
  ["#8a5530", "#6b3f22"],
  ["#4a4a5e", "#33334a"],
  ["#6366F1", "#4F46E5"],
  ["#0E7490", "#0C5E75"],
  ["#9333EA", "#7C22CB"],
] as const;

const ORG_HERO_GRADIENT =
  "linear-gradient(135deg, #2f4863 0%, #22374d 60%, #172737 100%)";
const ORG_HERO_PRIMARY = "#d2a36a";
const ORG_HERO_BADGE_BG = "rgba(210,163,106,0.22)";
const ORG_HERO_BADGE_TEXT = "#f4c792";

function getAvatarColor(name: string): readonly [string, string] {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);
  if (!org) notFound();
  if (!hasOrgRole(memberRole, "ORG_ADMIN")) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const subscription = await getOrgSubscription(orgId);
  const subscriptionState = getSubscriptionState(subscription);
  if (subscriptionState === "none") redirect("/billing/upgrade");

  const isAdmin = hasOrgRole(memberRole, "ORG_ADMIN");
  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isRestricted = subscriptionState === "restricted";
  const isFrozen = subscriptionState === "frozen";
  const canManageOrgActions = subscriptionState === "active";
  const isAdminForActions = isAdmin && canManageOrgActions;
  const isManagerForActions = isManager && canManageOrgActions;
  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  if (isFrozen) {
    const [memberCount, teamCount, activeCampaignCount, latestTeam, latestCampaign] = await Promise.all([
      prisma.organizationMember.count({ where: { orgId, leftAt: null } }),
      prisma.team.count({ where: { orgId } }),
      prisma.campaign.count({ where: { orgId, status: "ACTIVE" } }),
      prisma.team.findFirst({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      prisma.campaign.findFirst({
        where: { orgId },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
    ]);

    const latestActivity = [latestTeam?.createdAt, latestCampaign?.createdAt]
      .filter((value): value is Date => Boolean(value))
      .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return (
      <PlatformPageShell
        surface="org"
        contentClassName="max-w-4xl gap-6 px-4 py-10"
      >
        <OrgSubscriptionBanner state="frozen" locale={locale} />
        <DashboardPanel className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {isHu ? "Szervezeti összegző" : "Organization summary"}
          </p>
          <h1 className="mt-2 font-fraunces text-3xl text-ink">{org.name}</h1>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DashboardMetricCard
              accent="#3d6b5e"
              title={isHu ? "Tagok" : "Members"}
              value={String(memberCount)}
              sub={isHu ? "Aktív szervezeti tagságok" : "Active org memberships"}
            />
            <DashboardMetricCard
              accent="#c17f4a"
              title={isHu ? "Csapatok" : "Teams"}
              value={String(teamCount)}
              sub={isHu ? "Szervezethez tartozó csapatok" : "Teams in this organization"}
            />
            <DashboardMetricCard
              accent="#74877d"
              title={isHu ? "Aktív kampány" : "Active campaigns"}
              value={String(activeCampaignCount)}
              sub={isHu ? "Futó observer körök" : "Running observer rounds"}
            />
          </div>
          <p className="mt-4 text-xs text-muted">
            {isHu ? "Utolsó aktivitás:" : "Last activity:"}{" "}
            {latestActivity
              ? latestActivity.toLocaleDateString(dateLocale)
              : (isHu ? "nincs adat" : "no activity yet")}
          </p>
        </DashboardPanel>
      </PlatformPageShell>
    );
  }

  const [pageData, members, pendingInvites, teams] = await Promise.all([
    getOrgPageData(orgId),
    prisma.organizationMember.findMany({
      where: { orgId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true, role: true, joinedAt: true, userId: true,
        user: { select: { id: true, email: true, username: true } },
      },
    }),
    prisma.organizationPendingInvite.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, role: true, createdAt: true },
    }),
    prisma.team.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: { id: true, name: true, createdAt: true, _count: { select: { members: true } } },
    }),
  ]);

  const serializedMembers = members.map((m) => ({
    id: m.id, userId: m.userId, role: m.role, joinedAt: m.joinedAt.toISOString(),
    user: { id: m.user.id, email: m.user.email ?? null, username: m.user.username ?? null },
  }));
  const serializedPendingInvites = pendingInvites.map((inv) => ({
    id: inv.id, email: inv.email, role: inv.role, createdAt: inv.createdAt.toISOString(),
  }));
  const serializedTeams = teams.map((tm) => ({
    id: tm.id, name: tm.name, createdAt: tm.createdAt.toISOString(), _count: { members: tm._count.members },
  }));

  const completionPct = pageData.activeTotalParticipants > 0
    ? Math.round((pageData.activeSelfDone / pageData.activeTotalParticipants) * 100)
    : 0;
  const orgCompletionPct = pageData.memberCount > 0
    ? Math.round((pageData.completedMemberCount / pageData.memberCount) * 100)
    : 0;
  const orgRemainingCount = Math.max(pageData.memberCount - pageData.completedMemberCount, 0);
  const activeRemainingCount = Math.max(pageData.activeTotalParticipants - pageData.activeSelfDone, 0);

  const orgRiskItems: DashboardRiskAttentionItem[] = [];
  if (pageData.pendingCount > 0) {
    orgRiskItems.push({
      id: "pending-members",
      severity: "high",
      title: t("orgRisk.pendingTitle", locale),
      description: tf("orgRisk.pendingDesc", locale, { count: String(pageData.pendingCount) }),
      cta: {
        label: t("orgRisk.pendingCta", locale),
        href: `/org/${orgId}?tab=members`,
      },
    });
  }
  if (pageData.activeCampaignCount === 0) {
    orgRiskItems.push({
      id: "no-active-campaign",
      severity: "medium",
      title: t("orgRisk.noActiveTitle", locale),
      description: t("orgRisk.noActiveDesc", locale),
      cta: {
        label: t("orgRisk.noActiveCta", locale),
        href: `/org/${orgId}?tab=campaigns`,
      },
    });
  }
  const teamsReadyCount = teams.filter((teamItem) => teamItem._count.members >= 3).length;
  const hasObserverFeedback = pageData.campaigns.some(
    (campaign) => campaign.observerDoneCount > 0,
  );
  const orgLayerStatuses = evaluateProductLayersForScope(locale === "en" ? "en" : "hu", {
    hasSelfAssessmentStarted: pageData.memberCount > 0,
    hasSelfAssessment: pageData.completedMemberCount > 0,
    hasBelbinStarted: pageData.completedMemberCount > 0,
    hasBelbin: teamsReadyCount > 0,
    hasStrengthProfile: pageData.completedMemberCount > 0,
    hasObserverFeedback,
    hasTeamInsights: teamsReadyCount > 0,
    hasOrgCampaign: pageData.activeCampaignCount > 0,
    hasValuesLayerStarted: false,
    hasValuesLayer: false,
    hasConflictLayerStarted: false,
    hasConflictLayer: false,
    hasPlusAccess: true,
  }, "dashboard", "org");
  const orgLayerCompletedCount = orgLayerStatuses.filter(
    (layer) => layer.status === "COMPLETED",
  ).length;
  const orgDashboardVm = createOrgDashboardIA({
    locale: isHu ? "hu" : "en",
    orgName: org.name,
    totalMembers: pageData.memberCount,
    completedMembers: pageData.completedMemberCount,
    teamCount: pageData.teamCount,
    teamsReadyCount,
    pendingAttentionCount: orgRiskItems.length,
    activeCampaignCount: pageData.activeCampaignCount,
    recommendedAction: pageData.pendingCount > 0
      ? {
          title: t("orgRisk.recommendedTitle", locale),
          description: t("orgRisk.recommendedPendingDesc", locale),
          primary: {
            label: t("orgRisk.recommendedPendingPrimary", locale),
            href: `/org/${orgId}?tab=members`,
          },
          secondary: {
            label: t("orgRisk.recommendedPendingSecondary", locale),
            href: `/org/${orgId}?tab=teams`,
          },
        }
      : {
          title: t("orgRisk.recommendedTitle", locale),
          description: t("orgRisk.recommendedCampaignDesc", locale),
          primary: {
            label: t("orgRisk.recommendedCampaignPrimary", locale),
            href: `/org/${orgId}?tab=campaigns`,
          },
          secondary: {
            label: t("orgRisk.recommendedCampaignSecondary", locale),
            href: `/org/${orgId}?tab=teams`,
          },
        },
    riskItems: orgRiskItems,
    recentActivity: teams.slice(0, 3).map((teamItem, index) => ({
      id: `team-activity-${index}`,
      kind: "system",
      title: tf("orgRisk.teamUpdated", locale, { name: teamItem.name }),
      meta: tf("orgRisk.teamMembersMeta", locale, { count: String(teamItem._count.members) }),
      timestampLabel: teamItem.createdAt.toISOString(),
    })),
  });
  const heroSub = orgDashboardVm.heroSummary.summary;
  const heroChips = orgDashboardVm.heroSummary.chips;

  return (
    <PlatformPageShell
      surface="org"
      contentClassName="max-w-5xl gap-10 px-4 py-10 md:gap-14"
    >

        {/* ═══ 1. ORG HERO ═══ */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: ORG_HERO_GRADIENT }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />
          <div className="px-7 py-7 md:px-9 md:py-8">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
              <div>
                <p className="mb-3 text-[9px] uppercase tracking-[2px] text-white/[0.28]">
                  {t("org.eyebrow", locale)}
                </p>

                <h1 className="font-fraunces text-[34px] tracking-tight text-white md:text-[40px]">
                  {org.name}
                </h1>

                <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-white/[0.4]">
                  {heroSub}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  {heroChips.map((chip) => (
                    <span
                      key={chip}
                      className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.62]"
                    >
                      {chip}
                    </span>
                  ))}
                  {org.status === "PENDING_SETUP" && (
                    <span
                      className="rounded-full px-3 py-1.5 text-[11px] font-semibold"
                      style={{ backgroundColor: ORG_HERO_BADGE_BG, color: ORG_HERO_BADGE_TEXT }}
                    >
                      {t("org.setupPending", locale)}
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap gap-2">
                  {canManageOrgActions ? (
                    <>
                      <Link
                        href={orgDashboardVm.recommendedAction.primary.href}
                        className="flex min-h-[44px] items-center rounded-[9px] px-5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                        style={{ backgroundColor: ORG_HERO_PRIMARY }}
                      >
                        {orgDashboardVm.recommendedAction.primary.label}
                      </Link>
                      <Link
                        href={orgDashboardVm.recommendedAction.secondary?.href ?? `/org/${orgId}?tab=teams`}
                        className="flex min-h-[44px] items-center rounded-[9px] bg-white/[0.07] px-5 py-2 text-[12px] font-medium text-white/[0.55] transition hover:bg-white/[0.12]"
                      >
                        {orgDashboardVm.recommendedAction.secondary?.label ?? t("org.heroCta2", locale)}
                      </Link>
                    </>
                  ) : (
                    <>
                      <span className="flex min-h-[44px] cursor-not-allowed items-center rounded-[9px] bg-white/[0.12] px-5 py-2 text-[12px] font-semibold text-white/55">
                        {orgDashboardVm.recommendedAction.primary.label}
                      </span>
                      <span className="flex min-h-[44px] cursor-not-allowed items-center rounded-[9px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.45]">
                        {orgDashboardVm.recommendedAction.secondary?.label ?? t("org.heroCta2", locale)}
                      </span>
                    </>
                  )}
                </div>
                {isAdminForActions ? (
                  <Link
                    href={`/org/${orgId}/settings`}
                    className="mt-3 inline-flex text-[12px] font-semibold text-white/[0.65] transition hover:text-white"
                  >
                    {t("org.settingsLink", locale)} →
                  </Link>
                ) : null}
              </div>

              <aside className="hidden rounded-2xl border border-white/15 bg-white/[0.06] p-4 backdrop-blur-[2px] lg:block">
                <p className="text-[9px] uppercase tracking-[2px] text-white/[0.34]">
                  {t("orgHero.liveSnapshot", locale)}
                </p>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("orgHero.membersLabel", locale)}</p>
                    <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{pageData.memberCount}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("orgHero.teamsLabel", locale)}</p>
                    <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{pageData.teamCount}</p>
                  </div>
                  <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                    <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("orgHero.activeLabel", locale)}</p>
                    <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{pageData.activeCampaignCount}</p>
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                      <span>{t("orgHero.orgCompletion", locale)}</span>
                      <span className="font-semibold text-white/[0.7]">{orgCompletionPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${orgCompletionPct}%`, backgroundColor: "#8ad0b4" }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-white/[0.45]">
                      {pageData.completedMemberCount} {t("orgHero.done", locale)} · {orgRemainingCount} {t("orgHero.remaining", locale)}
                    </p>
                  </div>

                  <div>
                    <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                      <span>{t("orgHero.activeCampaignCompletion", locale)}</span>
                      <span className="font-semibold text-white/[0.7]">{completionPct}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${completionPct}%`, backgroundColor: ORG_HERO_PRIMARY }}
                      />
                    </div>
                    <p className="mt-1.5 text-[10px] text-white/[0.45]">
                      {pageData.activeSelfDone} {t("orgHero.done", locale)} · {activeRemainingCount} {t("orgHero.remaining", locale)}
                    </p>
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>

        {isRestricted ? (
          <OrgSubscriptionBanner state="restricted" locale={locale} />
        ) : null}

        {/* ═══ 2. INSIGHT CARDS ("Most érdemes figyelni") ═══ */}
        <section>
          <DashboardSectionHeader label={t("org.insightEyebrow", locale)} className="mb-5" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* Activity */}
            <DashboardPanel className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-sage" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-sage-dark">
                  {t("org.insightActivityTitle", locale)}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-body">
                {pageData.activeCampaignCount > 0
                  ? tf("org.insightFeedbackActive", locale, { count: String(pageData.activeCampaignCount) })
                  : t("org.insightActivityNone", locale)}
              </p>
            </DashboardPanel>
            {/* Feedback */}
            <DashboardPanel className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-bronze" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-bronze-dark">
                  {t("org.insightFeedbackTitle", locale)}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-body">
                {pageData.activeCampaignCount > 0
                  ? tf("org.insightFeedbackActive", locale, { count: String(pageData.activeCampaignCount) })
                  : t("org.insightFeedbackNone", locale)}
              </p>
            </DashboardPanel>
            {/* Action */}
            <DashboardPanel className="p-5">
              <div className="mb-2 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#6f7d75]" />
                <p className="text-[11px] font-semibold uppercase tracking-wide text-[#5c665f]">
                  {t("org.insightActionTitle", locale)}
                </p>
              </div>
              <p className="text-sm leading-relaxed text-ink-body">
                {pageData.pendingCount > 0
                  ? tf("org.insightActionInvite", locale, { count: String(pageData.pendingCount) })
                  : t("org.insightActionStart", locale)}
              </p>
            </DashboardPanel>
          </div>
        </section>

        {/* ═══ 3. STATE CARDS ═══ */}
        <section>
          <DashboardSectionHeader label={t("org.stateEyebrow", locale)} className="mb-5" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <DashboardMetricCard
              accent="#3d6b5e"
              title={t("org.stateMembersTitle", locale)}
              value={String(pageData.memberCount)}
              sub={tf("org.stateMembersSub", locale, { count: String(pageData.memberCount) })}
            />
            <DashboardMetricCard
              accent="#c17f4a"
              title={t("org.stateTeamsTitle", locale)}
              value={String(pageData.teamCount)}
              sub={tf("org.stateTeamsSub", locale, { count: String(pageData.teamCount) })}
            />
            <DashboardMetricCard
              accent="#d4a15a"
              title={t("org.stateCompletionTitle", locale)}
              value={`${completionPct}%`}
              sub={tf("org.stateCompletionSub", locale, { done: String(pageData.activeSelfDone), total: String(pageData.activeTotalParticipants || pageData.memberCount) })}
            />
            <DashboardMetricCard
              accent="#74877d"
              title={t("org.stateCampaignsTitle", locale)}
              value={String(pageData.activeCampaignCount)}
              sub={tf("org.stateCampaignsSub", locale, { active: String(pageData.activeCampaignCount), closed: String(pageData.closedCampaignCount) })}
            />
          </div>
        </section>

        <section>
          <DashboardSectionHeader label={t("orgLayers.eyebrow", locale)} className="mb-5" />
          <DashboardPanel className="p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="font-dm-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
                {t("orgLayers.layersTitle", locale)}
              </p>
              <DashboardStatusChip
                label={`${orgLayerCompletedCount}/${orgLayerStatuses.length} ${t("orgHero.done", locale)}`}
                tone="sage"
              />
            </div>
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {orgLayerStatuses.map((layer) => {
                const tone =
                  layer.status === "COMPLETED"
                    ? "sage"
                    : layer.status === "IN_PROGRESS"
                      ? "bronze"
                      : layer.status === "AVAILABLE"
                        ? "warm"
                        : "muted";
                const statusLabel = layer.status === "COMPLETED"
                  ? t("orgLayers.statusCompleted", locale)
                  : layer.status === "IN_PROGRESS"
                    ? t("orgLayers.statusInProgress", locale)
                    : layer.status === "AVAILABLE"
                      ? t("orgLayers.statusAvailable", locale)
                      : t("orgLayers.statusLocked", locale);

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

        {/* ═══ 4. TEAM SUMMARY CARDS ═══ */}
        <section>
          <DashboardSectionHeader label={t("org.teamsEyebrow", locale)} className="mb-5" />
          {teams.length === 0 ? (
            <DashboardPanel className="rounded-2xl border-dashed p-10 text-center">
              <p className="text-sm text-muted">{t("org.teamCardNoTeams", locale)}</p>
            </DashboardPanel>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {teams.map((tm) => {
                const [from, to] = getAvatarColor(tm.name);
                return (
                  <Link
                    key={tm.id}
                    href={`/team/${tm.id}`}
                    className="group flex items-center gap-4 rounded-2xl border border-sand bg-white p-5 transition-all hover:border-sage/40 hover:shadow-md hover:shadow-sage/5"
                  >
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-[15px] font-bold text-white"
                      style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
                    >
                      {tm.name[0]?.toUpperCase() ?? "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink transition-colors group-hover:text-sage">
                        {tm.name}
                      </p>
                      <p className="text-xs text-muted">
                        {tf("org.teamCardMembers", locale, { count: String(tm._count.members) })}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-bronze opacity-0 transition-opacity group-hover:opacity-100">
                      {t("org.teamCardOpen", locale)}
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* ═══ 5. BOTTOM CTA BAND ═══ */}
        <section
          className="rounded-[28px] p-8 md:p-12"
          style={{
            background:
              "linear-gradient(135deg, #2a5244 0%, #1e3d34 60%, #1a2e28 100%)",
          }}
        >
          <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
            <div className="flex-1">
              <h2 className="font-fraunces text-2xl text-white lg:text-3xl">
                {t("org.ctaBandTitle", locale)}
              </h2>
              <p className="mt-2 text-sm text-white/[0.35]">
                {t("org.ctaBandSub", locale)}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              {canManageOrgActions ? (
                <>
                  <Link
                    href={`/org/${orgId}?tab=campaigns`}
                    className="rounded-[10px] bg-[#c17f4a] px-6 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-[1.06]"
                  >
                    {t("org.ctaBandCta1", locale)}
                  </Link>
                  <Link
                    href={`/org/${orgId}?tab=teams`}
                    className="rounded-[10px] border border-white/20 px-6 py-3 text-sm font-semibold text-white/60 transition-all hover:bg-white/5"
                  >
                    {t("org.ctaBandCta2", locale)}
                  </Link>
                </>
              ) : (
                <>
                  <span className="cursor-not-allowed rounded-[10px] bg-white/15 px-6 py-3 text-sm font-semibold text-white/50">
                    {t("org.ctaBandCta1", locale)}
                  </span>
                  <span className="cursor-not-allowed rounded-[10px] border border-white/15 px-6 py-3 text-sm font-semibold text-white/45">
                    {t("org.ctaBandCta2", locale)}
                  </span>
                </>
              )}
            </div>
          </div>
        </section>

        {/* ═══ 6. TABS (Campaigns, Teams, Members) ═══ */}
        <Suspense fallback={<div className="h-10 rounded-lg bg-sand/40 animate-pulse" />}>
          <OrgPageShell
            orgId={orgId}
            orgName={org.name}
            profileId={profileId}
            isAdmin={isAdminForActions}
            isManager={isManagerForActions}
            isHu={isHu}
            locale={locale}
            dateLocale={dateLocale}
            pageData={pageData}
            members={serializedMembers}
            pendingInvites={serializedPendingInvites}
            teams={serializedTeams}
          />
        </Suspense>

    </PlatformPageShell>
  );
}
