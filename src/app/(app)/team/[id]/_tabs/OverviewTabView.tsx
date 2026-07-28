import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { t, tf } from "@/lib/i18n";
import { CAMPAIGN_STEP_LABELS, CAMPAIGN_STEP_LINKS } from "@/lib/campaign-steps-core";
import { createTeamDashboardIA } from "@/lib/dashboard/ia-contract";
import { CompletionIndicator } from "@/components/ui/CompletionIndicator";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
} from "@/components/dashboard/DashboardPrimitives";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { TeamMeasurementTimeline } from "@/components/team/TeamMeasurementTimeline";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { buildIntelligenceViewData } from "./intelligence-data";
import type { TeamTabContext } from "./types";

// ── Overview: hero + állapotkép + szerep-függő szekciók ────────────────────
export async function OverviewTabView({ ctx }: { ctx: TeamTabContext }) {
  const {
    teamId, teamData, locale, isHu, profile,
    canViewRaw, isOrgManager, canManageTeamActions, canReachOrgCampaigns,
    isRestricted, isNone, manageGateCopy,
    publishedReport, hasPublishedReport, pendingMeasurement,
  } = ctx;

  const publishedPattern = publishedReport?.aggregates?.pattern ?? null;
  const { assessedCount, totalCount, intelligenceQualityLabel } =
    buildIntelligenceViewData({ teamData, teamId, locale, isHu, canReachOrgCampaigns });

  const supportingViews = [
    {
      key: "profile" as const,
      title: t("teamComp.tabProfile", locale),
      description: isHu
        ? "Személyiség-heatmap és csapat-szintű elemzés."
        : "Personality heatmap and team-level analysis.",
      badge: teamData.completedCount > 0 ? teamData.completedCount : undefined,
    },
    {
      key: "members" as const,
      title: t("teamComp.tabMembers", locale),
      description: isHu
        ? "Taglista, meghívók és kitöltési állapot."
        : "Members, invites and completion status.",
      badge: teamData.memberCount + teamData.pendingInvites.length,
    },
    {
      key: "teamRole" as const,
      title: isHu ? "Csapatszerepek" : "Team roles",
      description: isHu
        ? "Csapatszerepek és csapaton belüli egyensúly."
        : "Team-role balance and role-distribution details.",
      badge: undefined as number | undefined,
    },
  ];

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
    if (canViewRaw && canManageTeamActions && teamData.orgId) {
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
  const statusLine = teamDashboardVm.heroSummary.summary;
  const heroChips = teamDashboardVm.heroSummary.chips;
  const teamHeroTheme = SURFACE_HERO_THEME.team;

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
        {/* ═══ HERO ═══ */}
        <SurfaceHero
          variant="team"
          eyebrow={(
            <p className="text-micro uppercase tracking-widest text-white/[0.28]">
              {t("teamDetail.heroEyebrow", locale)}
            </p>
          )}
          badge={
            hasPattern ? (
              <span
                className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide"
                style={{ backgroundColor: teamHeroTheme.badgeBg, color: teamHeroTheme.badgeText }}
              >
                {/* Állapot-pötty: vizuálisan elválik a mellette álló eyebrow-tól (audit #13) */}
                <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
                {t("teamDetail.heroPatternReady", locale)}
              </span>
            ) : undefined
          }
          title={<h1 className="font-fraunces text-[34px] tracking-tight text-white md:text-[40px]">{teamData.teamName}</h1>}
          summary={statusLine}
          chips={heroChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.78]"
            >
              {chip}
            </span>
          ))}
          actions={(
            <>
              {/* Visszajelzés — kitüntetett belépő, csak csapattagnak */}
              {teamData.members.some((m) => m.userId === profile.id) ? (
                <Link
                  href={`/team/${teamId}?tab=feedback`}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                  style={{ backgroundColor: teamHeroTheme.primary }}
                >
                  <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    aria-hidden="true"
                    className="h-3.5 w-3.5 shrink-0"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14 10a1.5 1.5 0 0 1-1.5 1.5H8l-3 3v-3H3.5A1.5 1.5 0 0 1 2 10V4a1.5 1.5 0 0 1 1.5-1.5h9A1.5 1.5 0 0 1 14 4v6Z" />
                    <path d="M5.5 6h5M5.5 8.5H9" />
                  </svg>
                  {isHu ? "Visszajelzés" : "Feedback"}
                </Link>
              ) : null}
              {/* Tagok — mindenkinek */}
              <Link
                href={`/team/${teamId}?tab=members`}
                className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.78] transition hover:bg-white/[0.12]"
              >
                {isHu ? "Tagok" : "Members"}
              </Link>
              {canViewRaw ? (
                <Link
                  href={`/team/${teamId}?tab=report`}
                  className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.78] transition hover:bg-white/[0.12]"
                >
                  {isHu ? "Riport" : "Report"}
                </Link>
              ) : null}
              {hasPattern && canViewRaw ? (
                <Link
                  href={`/team/${teamId}?tab=profile`}
                  className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                  style={{ backgroundColor: teamHeroTheme.primary }}
                >
                  {t("teamDetail.heroViewPattern", locale)}
                </Link>
              ) : null}
              {canViewRaw && canManageTeamActions && teamData.orgId ? (
                <Link
                  href={
                    hasObserver
                      ? `/org/${teamData.orgId}?tab=campaigns`
                      : `/org/${teamData.orgId}/campaigns/new?team=${teamId}`
                  }
                  className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.78] transition hover:bg-white/[0.12]"
                >
                  {hasObserver
                    ? t("teamDetail.heroManageRound", locale)
                    : t("teamDetail.heroStartRound", locale)}
                </Link>
              ) : null}
              {canViewRaw && !canManageTeamActions && isOrgManager && teamData.orgId ? (
                <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.65]">
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
              <p className="text-micro uppercase tracking-widest text-white/[0.34]">
                {t("teamDetail.snapshotLabel", locale)}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-micro uppercase tracking-widest text-white/[0.35]">{t("teamDetail.snapshotMembers", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none tabular-nums text-white">{teamData.memberCount}</p>
                </div>
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-micro uppercase tracking-widest text-white/[0.35]">{t("teamDetail.snapshotDone", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none tabular-nums text-white">{completedCount}</p>
                </div>
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-micro uppercase tracking-widest text-white/[0.35]">{t("teamDetail.snapshotWait", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none tabular-nums text-white">{waitingCount}</p>
                </div>
              </div>

              {/* Haladás-gyűrűk — az org-hero élő pillanatképével azonos nyelv */}
              <div className="mt-4 grid grid-cols-2 gap-2">
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-3 text-center">
                  <CompletionIndicator percent={completionPct} size={76} color="#8ad0b4" />
                  <p className="text-micro leading-tight text-white/[0.72]">
                    {t("teamDetail.snapshotCompletionRate", locale)}
                  </p>
                  <p className="text-micro text-white/[0.65]">
                    {tf("teamDetail.snapshotDoneInProgress", locale, { done: completedCount, inProgress: inProgressCount })}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-3 text-center">
                  <CompletionIndicator percent={secondaryPct} size={76} color={teamHeroTheme.primary} />
                  <p className="text-micro leading-tight text-white/[0.72]">
                    {secondaryLabel}
                  </p>
                  <p className="text-micro text-white/[0.65]">
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

        {/* A következő nyitott mérés-lépés — kitöltés-felhívás */}
        {pendingMeasurement ? (
          <section>
            <div className="flex flex-col gap-3 rounded-[18px] border border-sage/35 bg-sage/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-micro uppercase tracking-widest text-sage-dark">
                  {isHu
                    ? CAMPAIGN_STEP_LABELS[pendingMeasurement.stepType].hu
                    : CAMPAIGN_STEP_LABELS[pendingMeasurement.stepType].en}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {pendingMeasurement.campaignName}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-body">
                  {pendingMeasurement.stepType === "PSYCH_SAFETY"
                    ? isHu
                      ? "8 rövid állítás, ~2 perc. A válaszaid névtelenek — csak a csapatszintű összesítés látszik, legalább 3 kitöltéstől."
                      : "8 short statements, ~2 minutes. Your answers are anonymous — only the team-level aggregate is shown, from at least 3 responses."
                    : pendingMeasurement.stepType === "TRUST_360"
                      ? isHu
                        ? "5 rövid kérdés csapattársanként az együttműködésetekről (~2-3 perc) — a dinamika-térkép becslései helyére mért kapcsolati adat kerül."
                        : "5 short questions per teammate about how you work together (~2-3 minutes) — measured relationship data replaces the dynamics map estimates."
                      : pendingMeasurement.stepType === "TEAM_ROLE_360"
                        ? isHu
                          ? "Jelöld ki csapattársanként a rájuk leginkább jellemző állításokat (~3-4 perc/fő) — a csapatkép legalább 3 értékelőnél áll össze."
                          : "Pick the statements that best describe each teammate (~3-4 minutes each) — the team view forms with at least 3 raters."
                        : pendingMeasurement.stepType === "TEAM_ROLE"
                          ? isHu
                            ? "Rövid kérdőív arról, milyen szerepeket viszel a csapatban — a becslés helyett mért szerep-térkép készül."
                            : "A short questionnaire about the roles you play in the team — a measured role map replaces the estimate."
                          : pendingMeasurement.stepType === "PEER_FEEDBACK"
                            ? isHu
                              ? "Adj rövid, jövő-irányú visszajelzést a csapattársaidnak (~5-10 perc) — a visszajelzés nevesített, a címzett látja, kitől jött."
                              : "Give each teammate a short, future-focused piece of feedback (~5-10 minutes) — feedback is attributed, recipients see who it came from."
                            : isHu
                              ? "Töltsd ki az önértékelést (~10 perc) — ez az alapja a csapatképnek, és utána nyílnak a további mérések."
                              : "Complete the self-assessment (~10 minutes) — it is the basis of the team picture, and further measurements open after it."}
                </p>
              </div>
              {pendingMeasurement.opensAt ? (
                <div className="shrink-0 rounded-[10px] border border-sand bg-white px-4 py-2.5 text-center">
                  <p className="font-mono text-micro uppercase tracking-wide text-muted">
                    {isHu ? "Érkezik" : "Arriving"}
                  </p>
                  <p className="text-caption font-semibold tabular-nums text-ink">
                    {pendingMeasurement.opensAt.toLocaleString(isHu ? "hu-HU" : "en-GB", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ) : (
                <Link
                  href={CAMPAIGN_STEP_LINKS[pendingMeasurement.stepType]}
                  className="inline-flex min-h-[44px] shrink-0 items-center rounded-[10px] bg-action-primary-bg px-5 text-caption font-semibold text-white transition hover:brightness-110"
                >
                  {pendingMeasurement.stepType === "PEER_FEEDBACK"
                    ? isHu ? "Visszajelzést adok" : "Give feedback"
                    : isHu ? "Kitöltöm most" : "Fill it in now"}
                </Link>
              )}
            </div>
          </section>
        ) : null}

        {/* ═══ ÖSSZEFOGLALÓ ═══ */}
        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionSnapshot", locale)} className="mb-4" />
          <p className="mb-3 text-micro font-medium uppercase tracking-widest text-ink-body">
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

            {/* Csapatmintázat — publikált riport után a VALIDÁLT (befagyasztott)
                mintázat látszik a nem-tanácsadóknak is; addig „validálás alatt". */}
            <DashboardMetricCard
              accent="var(--color-accent-primary)"
              title={t("teamDetail.teamPatternTitle", locale)}
              value={
                hasPattern
                  ? canViewRaw || hasPublishedReport
                    ? t("teamDetail.teamPatternAvailable", locale)
                    : isHu ? "Validálás alatt" : "Pending validation"
                  : hasPublishedReport
                    ? t("teamDetail.teamPatternAvailable", locale)
                    : t("teamDetail.teamPatternNotYet", locale)
              }
              sub={
                canViewRaw
                  ? hasPattern
                    ? teamData.patternResult?.fullLabel
                    : tf("teamDetail.teamPatternProgress", locale, { pct: completionPct })
                  : hasPublishedReport
                    ? publishedPattern?.label ??
                      (isHu ? "A validált csapatképben" : "In the validated team picture")
                    : hasPattern
                      ? isHu ? "A tanácsadó véglegesítése után elérhető" : "Available after consultant validation"
                      : tf("teamDetail.teamPatternProgress", locale, { pct: completionPct })
              }
            >
              {/* CTA NINCS (UX-audit #3): a csapatkép-megnyitás egyetlen útja
                  tanácsadónál a hero elsődleges gombja, tagnál a lenti
                  validált-csapatkép panel — ez a csempe csak információ. */}
            </DashboardMetricCard>
          </div>
        </section>

        {canViewRaw ? (
        <section id="team-intelligence">
          <DashboardSectionHeader
            label={t("teamComp.tabIntelligence", locale)}
            className="mb-4"
          />
          <Link
            href={`/team/${teamId}?tab=intelligence`}
            className="group block rounded-[22px] border border-sand bg-[linear-gradient(140deg,#fffdf7_0%,#f6f1e8_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] transition-all hover:-translate-y-0.5 hover:border-bronze/40 hover:shadow-[0_18px_36px_rgba(26,26,46,0.09)] md:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="font-mono text-micro uppercase tracking-widest text-muted">
                  {isHu ? "Külön nézet" : "Dedicated view"}
                </p>
                <h3 className="mt-1 font-fraunces text-[26px] leading-tight text-ink md:text-[31px]">
                  {t("teamComp.tabIntelligence", locale)}
                </h3>
                <p className="mt-2 text-caption leading-relaxed text-ink-body">
                  {isHu
                    ? "Potenciál- és szerepilleszkedési térkép egy oldalon, adatminőség-jelzéssel. A nézetet külön oldalon nyithatod meg, hogy fókuszáltan elemezhető legyen."
                    : "Potential and role-fit maps in one dedicated view with data-quality markers. Open separately for focused analysis."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
                    {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
                    <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
                  </span>
                  <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
                    {isHu ? "Adatállapot" : "Data status"}:{" "}
                    <span className="font-semibold text-ink">{intelligenceQualityLabel}</span>
                  </span>
                </div>
              </div>
              <span className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-action-primary-bg px-5 py-2 text-[12px] font-semibold text-white transition-colors group-hover:bg-action-primary-bg-hover">
                {isHu ? "Csapatintelligencia megnyitása" : "Open team intelligence"}
              </span>
            </div>
          </Link>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {supportingViews.map((card) => (
              <Link
                key={card.key}
                href={`/team/${teamId}?tab=${card.key}`}
                className="group rounded-[16px] border border-sand bg-white p-4 transition-colors hover:border-bronze/35 hover:bg-cream"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-caption font-semibold text-ink">{card.title}</p>
                  {card.badge ? (
                    <span className="rounded-full bg-warm-mid px-2 py-0.5 text-micro font-semibold text-ink">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-body">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
        ) : null}

        {/* Team-manager gyorsműveletek — a menedzser belépői a saját csapatán
            (két menedzser-szint modell, 2026-07-22). A tanácsadó fent kap
            saját kártyákat; a sima tag ezt nem látja. */}
        {!canViewRaw && isOrgManager ? (
          <section>
            <DashboardSectionHeader
              label={isHu ? "Csapat kezelése" : "Manage team"}
              className="mb-4"
            />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                href={`/team/${teamId}?tab=members`}
                className="group rounded-[16px] border border-sand bg-white p-4 transition-colors hover:border-bronze/35 hover:bg-cream"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-caption font-semibold text-ink">
                    {isHu ? "Tagok kezelése" : "Manage members"}
                  </p>
                  <span className="rounded-full bg-warm-mid px-2 py-0.5 text-micro font-semibold text-ink">
                    {teamData.memberCount}
                  </span>
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-body">
                  {isHu
                    ? "Tag hozzáadása a szervezet taglistájából, szerepek állítása, eltávolítás."
                    : "Add members from the organization's list, set roles, remove."}
                </p>
              </Link>
              {hasPublishedReport ? (
                <Link
                  href={`/team/${teamId}?tab=report`}
                  className="group rounded-[16px] border border-sand bg-white p-4 transition-colors hover:border-bronze/35 hover:bg-cream"
                >
                  <p className="text-caption font-semibold text-ink">
                    {isHu ? "Csapat riport" : "Team report"}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-ink-body">
                    {isHu
                      ? "A validált csapatkép vezetői nézete — erősségek, kockázatok, akcióterv."
                      : "The leadership view of the validated team picture — strengths, risks, action plan."}
                  </p>
                </Link>
              ) : (
                <div className="rounded-[16px] border border-dashed border-sand bg-cream/40 p-4">
                  <p className="text-caption font-semibold text-muted">
                    {isHu ? "Csapat riport" : "Team report"}
                  </p>
                  <p className="mt-1.5 text-[12px] leading-relaxed text-muted">
                    {isHu
                      ? "Még nincs publikált csapatkép — a tanácsadói validálás után itt nyílik meg."
                      : "No published team picture yet — it opens here after consultant validation."}
                  </p>
                </div>
              )}
            </div>
          </section>
        ) : null}

        {!canViewRaw ? (
        <section>
          <DashboardSectionHeader label={t("teamComp.teamPatternEyebrow", locale)} className="mb-4" />
          {(
            <DashboardPanel className="p-6">
              {publishedReport ? (
                // Vizuális csapatkép-pillanatkép a publikált (befagyasztott)
                // aggregátumból: mini radar + mintázat + kulcs-chipek. Ez az
                // EGYETLEN mintázat-CTA a nem-tanácsadói overview-n (a fenti
                // metric-csempe linkje ezért került ki — redundáns volt).
                publishedReport.aggregates?.dimensionAverages ? (
                  <div className="grid grid-cols-1 items-center gap-5 md:grid-cols-[220px_1fr]">
                    <div className="mx-auto w-full max-w-[220px]">
                      <RadarChart
                        dimensions={teamData.dimConfigs
                          .filter((dc) =>
                            typeof publishedReport.aggregates!.dimensionAverages![dc.code] === "number",
                          )
                          .map((dc) => ({
                            code: dc.code,
                            color: dc.color,
                            score: publishedReport.aggregates!.dimensionAverages![dc.code],
                          }))}
                        uid={`overview-${teamId}`}
                      />
                    </div>
                    <div>
                      <p className="font-mono text-micro uppercase tracking-widest text-bronze">
                        {isHu ? "// validált csapatkép" : "// validated team picture"}
                      </p>
                      {publishedPattern?.label ? (
                        <p className="mt-1 font-fraunces text-2xl leading-tight text-ink">
                          {publishedPattern.label}
                        </p>
                      ) : (
                        <p className="mt-1 font-fraunces text-xl leading-tight text-ink">
                          {isHu ? "A csapat validált profilja" : "The team's validated profile"}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] text-ink-body">
                          {publishedReport.aggregates!.memberCount}{" "}
                          {isHu ? "tag" : "members"}
                        </span>
                        <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] text-ink-body">
                          {publishedReport.aggregates!.completionPct}%{" "}
                          {isHu ? "kitöltöttség" : "completion"}
                        </span>
                        {typeof publishedReport.aggregates!.evidence?.measuredEdgeCount === "number" &&
                          publishedReport.aggregates!.evidence!.measuredEdgeCount > 0 && (
                            <span className="rounded-full bg-sage/15 px-2.5 py-1 text-[11px] font-medium text-sage-dark">
                              {publishedReport.aggregates!.evidence!.measuredEdgeCount}{" "}
                              {isHu ? "mért kapcsolati adat" : "measured relationship data points"}
                            </span>
                          )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-body">
                        {isHu
                          ? "A tanácsadó által validált, aggregált kép — egyéni eredmények nélkül."
                          : "Aggregate picture validated by your consultant — without individual results."}
                      </p>
                      <Link
                        href={`/team/${teamId}?tab=report`}
                        className="mt-3 inline-flex min-h-[38px] items-center rounded-[10px] bg-sage px-4 text-[12px] font-semibold text-white transition hover:bg-sage-dark"
                      >
                        {isHu ? "Csapatkép megnyitása →" : "Open team picture →"}
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8.5l3 3 7-7" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {isHu ? "A validált csapatkép elérhető" : "The validated team picture is available"}
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-body">
                        {isHu
                          ? "A tanácsadó véglegesítette a csapatképet — aggregált eredmények és értékelés."
                          : "Your consultant has finalized the team picture — aggregate results and assessment."}
                      </p>
                      <Link
                        href={`/team/${teamId}?tab=report`}
                        className="mt-2 inline-flex text-xs font-semibold text-sage transition-colors hover:text-sage-dark"
                      >
                        {isHu ? "Csapatkép megnyitása →" : "Open team picture →"}
                      </Link>
                    </div>
                  </div>
                )
              ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {isHu ? "A csapatkép validálás alatt" : "Team picture pending validation"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-body">
                    {isHu
                      ? "A csapatszintű eredményeket a tanácsadó összesíti és validálja — a személyes beszélgetések tanulságaival együtt, aggregált formában lesznek elérhetők. Addig a kitöltés haladását követheted ezen az oldalon."
                      : "Team-level results are aggregated and validated by your consultant — they become available in aggregate form, together with insights from the personal interviews. Until then you can track completion progress on this page."}
                  </p>
                </div>
              </div>
              )}
            </DashboardPanel>
          )}
        </section>
        ) : null}

        {canViewRaw && teamData.orgId ? (
          <TeamMeasurementTimeline
            items={(
              await prisma.campaign.findMany({
                where: { teamId },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                  id: true,
                  orgId: true,
                  name: true,
                  type: true,
                  status: true,
                  createdAt: true,
                  closedAt: true,
                },
              })
            ).map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              closedAt: c.closedAt?.toISOString() ?? null,
            }))}
            isHu={isHu}
          />
        ) : null}

    </PlatformPageShell>
  );
}
