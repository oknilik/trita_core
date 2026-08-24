import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getProfileCoreById } from "@/lib/profile.server";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { getCapabilityGateCopy } from "@/lib/policy-ux";
import { getOrgPageData } from "@/lib/org-stats";
import { OrgPageShell } from "@/components/org/OrgPageShell";
import { CompletionIndicator } from "@/components/ui/CompletionIndicator";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { CampaignPacingTile } from "@/components/org/CampaignPacingTile";
import { OrgOverviewNextAction } from "@/components/org/OrgOverviewNextAction";
import { isConsultantSurface, canViewMemberDossier } from "@/lib/measurement-auth";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { ChevronRightIcon } from "@/components/ui/icons";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import {
  DashboardMetricCard,
  DashboardPanel,
} from "@/components/dashboard/DashboardPrimitives";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { resolveOrgOverviewFocus } from "@/lib/org-overview-focus";
import { isPortfolioSurfaceActive } from "@/lib/portfolio-parking";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Szervezet | trita" : "Organization | trita",
    robots: { index: false },
  };
}

// ─────────────────────────────────────────────────────────────────────
// Szervezet-oldal — szándékosan egyszerű (2026-07-17 felület-diéta).
//
// Egyetlen kompakt váz mindenkinek: fejléc + fülek.
//   · admin/manager: Csapatok (alap) + Tagok
//   · tanácsadó (ORG_CONSULTANT vagy platform-admin): + Kampányok fül
// A korábbi dashboard-szekciók (hero/insight/állapot/rétegek/CTA-sáv)
// kivezetve — a tanácsadói elemzés a csapat-riportban él.
// ─────────────────────────────────────────────────────────────────────
export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);
  if (!org) notFound();
  // Közös, kérés-szinten memoizált profil (a requireOrgContext már betöltötte).
  const viewer = await getProfileCoreById(profileId);
  // Tanácsadói felület: ORG_CONSULTANT szerep, platform-tanácsadó vagy platform-admin.
  const isConsultantView = isConsultantSurface(
    memberRole,
    viewer?.email,
    viewer?.isConsultant,
  );
  // A fallback-cél a teljes journey-motort futtatja (~25 query) — csak a
  // redirect-ágban kell, ezért CSAK akkor számoljuk ki. A kapu maga
  // változatlan: ORG_MANAGER alatt továbbra is elirányítunk.
  if (!hasOrgRole(memberRole, "ORG_MANAGER")) {
    redirect(await resolveJourneyFallbackForProfileId(profileId));
  }

  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: memberRole,
  });
  const policy = policySnapshot.policy;

  // Lazy trial notification check via orchestrator (fire-and-forget)
  if (hasOrgRole(memberRole, "ORG_ADMIN")) {
    import("@/lib/notifications/orchestrator").then(({ checkTrialNotifications }) =>
      checkTrialNotifications(orgId).catch(() => {}),
    );
  }

  const launchCampaignDecision = resolveOrgCapabilityDecision(
    policySnapshot,
    "launchCampaign",
  );
  const createTeamDecision = resolveOrgCapabilityDecision(policySnapshot, "create");
  const inviteDecision = resolveOrgCapabilityDecision(policySnapshot, "invite");

  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isRestricted = toOrgSubscriptionBannerState(policy.policyState) === "restricted";
  const isNone = toOrgSubscriptionBannerState(policy.policyState) === "none";
  const isFrozen = policy.policyState === "frozen";
  const canManageOrgActions = policy.capabilities.has("manage");
  const canCreateTeamActions = policy.capabilities.has("create");
  const canLaunchCampaignActions = policy.capabilities.has("launchCampaign");
  const canInviteMemberActions = policy.capabilities.has("invite");
  const isAdminForActions = policy.capabilities.has("orgAdminManage");
  const isManagerForActions = canManageOrgActions;
  const showActionGate = isManager && !canManageOrgActions;
  const actionGateCopy = showActionGate
    ? getCapabilityGateCopy({
        locale,
        reason:
          launchCampaignDecision.reason ??
          createTeamDecision.reason ??
          inviteDecision.reason,
        upgradeHintCode:
          launchCampaignDecision.upgradeHint?.code ??
          createTeamDecision.upgradeHint?.code ??
          inviteDecision.upgradeHint?.code,
      })
    : null;
  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  if (isFrozen) {
    const [memberCount, teamCount, activeCampaignCount, latestTeam, latestCampaign] =
      await Promise.all([
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

    const latestActivity =
      [latestTeam?.createdAt, latestCampaign?.createdAt]
        .filter((value): value is Date => Boolean(value))
        .sort((a, b) => b.getTime() - a.getTime())[0] ?? null;

    return (
      <PlatformPageShell surface="org" contentClassName="max-w-4xl gap-6 px-4 py-10">
        <OrgSubscriptionBanner state="frozen" locale={locale} />
        <DashboardPanel className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {isHu ? "Szervezeti összegző" : "Organization summary"}
          </p>
          <h1 className="mt-2 font-fraunces text-3xl text-ink">{org.name}</h1>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <DashboardMetricCard
              accent="var(--color-action-primary-bg)"
              title={isHu ? "Tagok" : "Members"}
              value={String(memberCount)}
              sub={isHu ? "Aktív szervezeti tagságok" : "Active org memberships"}
            />
            <DashboardMetricCard
              accent="var(--color-accent-primary)"
              title={isHu ? "Csapatok" : "Teams"}
              value={String(teamCount)}
              sub={isHu ? "Szervezethez tartozó csapatok" : "Teams in this organization"}
            />
            <DashboardMetricCard
              accent="#74877d"
              title={isHu ? "Aktív mérés" : "Active measurements"}
              value={String(activeCampaignCount)}
              sub={isHu ? "Futó observer körök" : "Running observer rounds"}
            />
          </div>
          <p className="mt-4 text-xs text-muted">
            {isHu ? "Utolsó aktivitás:" : "Last activity:"}{" "}
            {latestActivity
              ? latestActivity.toLocaleDateString(dateLocale)
              : isHu
                ? "nincs adat"
                : "no activity yet"}
          </p>
        </DashboardPanel>
      </PlatformPageShell>
    );
  }

  const [pageData, members, pendingInvites, teams] = await Promise.all([
    getOrgPageData(orgId),
    prisma.organizationMember.findMany({
      where: { orgId, leftAt: null },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        userId: true,
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
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    }),
  ]);

  // ── Futó mérés-sorozat csempe (lépés-ütemezés) ────────────────────────────
  // A legutóbbi aktív, csapat-célzású kampány: mi van épp nyitva, illetve
  // mikor nyílik a következő ütemezett kérdőív (visszaszámlálóhoz).
  const pacingCampaign = await prisma.campaign.findFirst({
    where: { orgId, status: "ACTIVE", teamId: { not: null } },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      type: true,
      steps: true,
      stepIntervalHours: true,
      teamId: true,
      participants: {
        select: { currentStep: true, nextStepOpensAt: true },
      },
    },
  });
  const pacingTeam = pacingCampaign?.teamId
    ? await prisma.team.findUnique({
        where: { id: pacingCampaign.teamId },
        select: { name: true },
      })
    : null;
  let pacingTile = null;
  if (pacingCampaign && pacingCampaign.participants.length > 0) {
    const steps =
      pacingCampaign.steps.length > 0 ? pacingCampaign.steps : [pacingCampaign.type];
    const now = Date.now();
    let doneCount = 0;
    let scheduledCount = 0;
    let nextReleaseAt: Date | null = null;
    const openStepCounts = new Map<string, number>();
    for (const p of pacingCampaign.participants) {
      const stepType = steps[p.currentStep];
      if (!stepType) {
        doneCount += 1;
        continue;
      }
      if (p.nextStepOpensAt && p.nextStepOpensAt.getTime() > now) {
        scheduledCount += 1;
        if (!nextReleaseAt || p.nextStepOpensAt < nextReleaseAt) {
          nextReleaseAt = p.nextStepOpensAt;
        }
        continue;
      }
      openStepCounts.set(stepType, (openStepCounts.get(stepType) ?? 0) + 1);
    }
    const openStepType =
      [...openStepCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
    const openCount = [...openStepCounts.values()].reduce((a, b) => a + b, 0);
    pacingTile = {
      orgId,
      campaignId: pacingCampaign.id,
      campaignName: pacingCampaign.name,
      teamName: pacingTeam?.name ?? null,
      stepIntervalHours: pacingCampaign.stepIntervalHours,
      totalParticipants: pacingCampaign.participants.length,
      doneCount,
      openCount,
      openStepType,
      scheduledCount,
      nextReleaseAt: nextReleaseAt ? nextReleaseAt.toISOString() : null,
    };
  }

  // Jelöltek — csak tanácsadói felületen (Jelöltek fül)
  const candidateInvites = isConsultantView && isPortfolioSurfaceActive("hiring")
    ? await prisma.candidateInvite.findMany({
        where: { OR: [{ orgId }, { team: { orgId } }] },
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          status: true,
          createdAt: true,
          team: { select: { name: true } },
          result: { select: { id: true } },
        },
      })
    : null;

  // Beérkezett kérdések — csak tanácsadói felületen (Kérdések fül)
  const inquiries = isConsultantView
    ? await prisma.inquiry.findMany({
        where: { organizationId: orgId },
        orderBy: [{ status: "asc" }, { createdAt: "desc" }],
        take: 100,
        select: {
          id: true,
          name: true,
          email: true,
          topic: true,
          message: true,
          status: true,
          adminNote: true,
          source: true,
          createdAt: true,
          userProfile: { select: { username: true, email: true } },
        },
      })
    : null;

  const serializedMembers = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: {
      id: m.user.id,
      email: m.user.email ?? null,
      username: m.user.username ?? null,
    },
  }));
  const serializedPendingInvites = pendingInvites.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    createdAt: inv.createdAt.toISOString(),
  }));
  const serializedTeams = teams.map((tm) => ({
    id: tm.id,
    name: tm.name,
    createdAt: tm.createdAt.toISOString(),
    _count: { members: tm._count.members },
  }));

  // Élő aggregátum (tritanAvg) csak tanácsadónak — mindenki más a
  // publikált riportban kapja (docs/product/team-report-gating-plan.md)
  if (!isConsultantView) {
    pageData.tritanAvg = null;
  }

  const completionPct =
    pageData.activeTotalParticipants > 0
      ? Math.round((pageData.activeSelfDone / pageData.activeTotalParticipants) * 100)
      : 0;
  const orgCompletionPct =
    pageData.memberCount > 0
      ? Math.round((pageData.completedMemberCount / pageData.memberCount) * 100)
      : 0;
  const orgRemainingCount = Math.max(
    pageData.memberCount - pageData.completedMemberCount,
    0,
  );
  const overviewFocus = resolveOrgOverviewFocus({
    locale: isHu ? "hu" : "en",
    orgId,
    teamCount: pageData.teamCount,
    memberCount: pageData.memberCount,
    completedMemberCount: pageData.completedMemberCount,
    pendingInviteCount: pendingInvites.length,
    activeCampaignCount: pageData.activeCampaignCount,
    canCreateTeam: canCreateTeamActions,
    canInviteMembers: canInviteMemberActions,
    canLaunchCampaign: canLaunchCampaignActions,
    canViewCampaigns: isConsultantView,
  });
  const activeRemainingCount = Math.max(
    pageData.activeTotalParticipants - pageData.activeSelfDone,
    0,
  );
  const orgHeroTheme = SURFACE_HERO_THEME.org;

  return (
    <PlatformPageShell surface="org" contentClassName="max-w-5xl gap-6 px-4 py-8">
      {isRestricted || isNone ? (
        <OrgSubscriptionBanner state={isNone ? "none" : "restricted"} locale={locale} />
      ) : null}

      {/* ═══ HERO — a megszokott designnyelv, egyszerű tartalommal ═══ */}
      <SurfaceHero
        variant="org"
        eyebrow={(
          <SectionEyebrow tone="onDark">
            {isConsultantView
              ? isHu
                ? "Szervezet · tanácsadói nézet"
                : "Organization · consultant view"
              : t("org.eyebrow", locale)}
          </SectionEyebrow>
        )}
        title={(
          <h1 className="font-fraunces text-title tracking-tight text-[var(--color-text-on-inverse)] md:text-hero">
            {org.name}
          </h1>
        )}
        summary={
          isConsultantView
            ? isHu
              ? "Mérések indítása és kísérése, csapatképek validálása — minden csapat egy helyen."
              : "Launch and guide measurements, validate team pictures — every team in one place."
            : isHu
              ? "A csapataid és a publikált csapatképek egy helyen."
              : "Your teams and published team pictures in one place."
        }
        summaryClassName="max-w-[560px] text-[var(--color-text-on-inverse-muted)]"
        badge={
          // Szám-chipek TÖRÖLVE (UX-audit #1): a tag/csapat/aktív mérés hármas
          // már ott van az aside „ÉLŐ PILLANATKÉP" csempéin — a heroban minden
          // szám pontosan egyszer szerepel. A setup-badge itt a badge-slotban
          // él, és csak VALÓDI hiánynál látszik (UX-audit #21a).
          org.status === "PENDING_SETUP" &&
          (pageData.teamCount === 0 || pageData.memberCount <= 1) ? (
            <span
              className="inline-flex items-center rounded-md px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide"
              style={{ backgroundColor: orgHeroTheme.badgeBg, color: orgHeroTheme.badgeText }}
            >
              {t("org.setupPending", locale)}
            </span>
          ) : undefined
        }
        actions={(
          <>
            {isConsultantView ? (
              <Link
                href={`/org/${orgId}/campaigns/new`}
                // Sötét tinta a glow-hátterén: a fehér itt 2,3:1 volt (AA-bukás
                // mindkét színsémán), a hero-gradiens viszont fix, ezért a
                // kontrasztot a szövegszín fordításával nyerjük vissza.
                className="flex min-h-[44px] items-center rounded-[9px] px-5 py-2 text-xs font-semibold text-[var(--color-text-on-accent)] transition hover:brightness-110"
                style={{ backgroundColor: orgHeroTheme.primary }}
              >
                {isHu ? "Új mérés indítása" : "Start a measurement"}
              </Link>
            ) : (
              <Link
                href={`/org/${orgId}?tab=teams`}
                className="flex min-h-[44px] items-center rounded-[9px] px-5 py-2 text-xs font-semibold text-[var(--color-text-on-accent)] transition hover:brightness-110"
                style={{ backgroundColor: orgHeroTheme.primary }}
              >
                {isHu ? "Csapatok" : "Teams"}
              </Link>
            )}
            <Link
              href={`/org/${orgId}?tab=members`}
              className="flex min-h-[44px] items-center rounded-[9px] bg-white/[0.07] px-5 py-2 text-xs font-medium text-[var(--color-text-on-inverse-muted)] transition hover:bg-white/[0.12]"
            >
              {isHu ? "Tagok" : "Members"}
            </Link>
          </>
        )}
        footer={
          isAdminForActions ? (
            <Link
              href={`/org/${orgId}/settings`}
              className="inline-flex text-xs font-semibold text-[var(--color-text-on-inverse-muted)] transition hover:text-white"
            >
              {t("org.settingsLink", locale)}
              <ChevronRightIcon className="ml-1 h-3.5 w-3.5" />
            </Link>
          ) : undefined
        }
        aside={(
          <>
            <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
              {t("orgHero.liveSnapshot", locale)}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="min-h-10 text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{t("orgHero.membersLabel", locale)}</p>
                <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-[var(--color-text-on-inverse)]">{pageData.memberCount}</p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="min-h-10 text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{t("orgHero.teamsLabel", locale)}</p>
                <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-[var(--color-text-on-inverse)]">{pageData.teamCount}</p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="min-h-10 text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{t("orgHero.activeLabel", locale)}</p>
                <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-[var(--color-text-on-inverse)]">{pageData.activeCampaignCount}</p>
              </div>
            </div>

            {/* Haladás-gyűrűk (F3) — a kitöltöttség kör-formában: a 75%
                látványa húz a 100% felé. */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-3 text-center">
                <CompletionIndicator percent={orgCompletionPct} size={76} color="var(--color-sage-300)" />
                <p className="flex min-h-8 items-start justify-center text-micro leading-tight text-[var(--color-text-on-inverse-muted)]">
                  {t("orgHero.orgCompletion", locale)}
                </p>
                <p className="text-micro text-[var(--color-text-on-inverse-muted)]">
                  {pageData.completedMemberCount} {t("orgHero.done", locale)} · {orgRemainingCount} {t("orgHero.remaining", locale)}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-3 text-center">
                <CompletionIndicator percent={completionPct} size={76} color={orgHeroTheme.primary} />
                <p className="flex min-h-8 items-start justify-center text-micro leading-tight text-[var(--color-text-on-inverse-muted)]">
                  {t("orgHero.activeCampaignCompletion", locale)}
                </p>
                <p className="text-micro text-[var(--color-text-on-inverse-muted)]">
                  {pageData.activeSelfDone} {t("orgHero.done", locale)} · {activeRemainingCount} {t("orgHero.remaining", locale)}
                </p>
              </div>
            </div>
          </>
        )}
      />

      {/* Élő pillanatkép mobilra/tabletre: a hero aside-ja csak lg-től
          renderel, így 1024px alatt sehol nem látszott az org-szintű és az
          aktív mérés kitöltöttsége. Ugyanaz a tartalom, világos témán. */}
      <section className="rounded-2xl border border-sand bg-surface-card p-4 shadow-sm lg:hidden">
        <p className="text-micro uppercase tracking-widest text-muted">
          {t("orgHero.liveSnapshot", locale)}
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-cream px-3 py-2">
            <p className="min-h-10 text-micro uppercase tracking-widest text-muted">{t("orgHero.membersLabel", locale)}</p>
            <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-ink">{pageData.memberCount}</p>
          </div>
          <div className="rounded-xl bg-cream px-3 py-2">
            <p className="min-h-10 text-micro uppercase tracking-widest text-muted">{t("orgHero.teamsLabel", locale)}</p>
            <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-ink">{pageData.teamCount}</p>
          </div>
          <div className="rounded-xl bg-cream px-3 py-2">
            <p className="min-h-10 text-micro uppercase tracking-widest text-muted">{t("orgHero.activeLabel", locale)}</p>
            <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-ink">{pageData.activeCampaignCount}</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="flex flex-col items-center gap-1.5 rounded-xl bg-cream px-2 py-3 text-center">
            <ProgressRing
              percent={orgCompletionPct}
              size={68}
              label={`${orgCompletionPct}%`}
              color="var(--color-sage)"
              trackColor="var(--color-sand)"
              labelClassName="fill-ink"
            />
            <p className="flex min-h-8 items-start justify-center text-micro leading-tight text-ink-body">
              {t("orgHero.orgCompletion", locale)}
            </p>
            <p className="text-micro text-muted">
              {pageData.completedMemberCount} {t("orgHero.done", locale)} · {orgRemainingCount} {t("orgHero.remaining", locale)}
            </p>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl bg-cream px-2 py-3 text-center">
            <ProgressRing
              percent={completionPct}
              size={68}
              label={`${completionPct}%`}
              color="var(--color-bronze)"
              trackColor="var(--color-sand)"
              labelClassName="fill-ink"
            />
            <p className="flex min-h-8 items-start justify-center text-micro leading-tight text-ink-body">
              {t("orgHero.activeCampaignCompletion", locale)}
            </p>
            <p className="text-micro text-muted">
              {pageData.activeSelfDone} {t("orgHero.done", locale)} · {activeRemainingCount} {t("orgHero.remaining", locale)}
            </p>
          </div>
        </div>
      </section>

      <OrgOverviewNextAction focus={overviewFocus} isHu={isHu} />

      {pacingTile ? (
        <CampaignPacingTile
          data={pacingTile}
          canManagePacing={false}
          managementHref={
            isConsultantView
              ? `/org/${orgId}/campaigns/${pacingTile.campaignId}`
              : undefined
          }
          isHu={isHu}
        />
      ) : null}

      <Suspense fallback={<div className="h-10 animate-pulse rounded-lg bg-sand/40" />}>
        <OrgPageShell
          orgId={orgId}
          orgName={org.name}
          profileId={profileId}
          isAdmin={isAdminForActions}
          isManager={isManagerForActions}
          canCreateTeam={canCreateTeamActions}
          canInviteMembers={canInviteMemberActions}
          canManageCampaigns={isConsultantView && canLaunchCampaignActions}
          canManageMeasurements={isConsultantView}
          actionGateCopy={actionGateCopy}
          dossierBaseHref={
            canViewMemberDossier(memberRole, viewer?.email, viewer?.isConsultant)
              ? `/org/${orgId}/members`
              : null
          }
          isHu={isHu}
          locale={locale}
          dateLocale={dateLocale}
          pageData={pageData}
          members={serializedMembers}
          pendingInvites={serializedPendingInvites}
          teams={serializedTeams}
          candidates={
            candidateInvites
              ? candidateInvites.map((row) => ({
                  id: row.id,
                  name: row.name,
                  email: row.email,
                  position: row.position,
                  status: row.status,
                  teamName: row.team?.name ?? null,
                  hasResult: Boolean(row.result),
                  createdAt: row.createdAt.toISOString(),
                }))
              : null
          }
          inquiries={
            inquiries
              ? inquiries.map((row) => ({
                  id: row.id,
                  name: row.name,
                  email: row.email,
                  topic: row.topic,
                  message: row.message,
                  status: row.status,
                  adminNote: row.adminNote,
                  source: row.source,
                  createdAt: row.createdAt.toISOString(),
                  user: row.userProfile,
                }))
              : null
          }
        />
      </Suspense>
    </PlatformPageShell>
  );
}
