import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import { createTeamDashboardIA } from "@/lib/dashboard/ia-contract";
import { CompletionIndicator } from "@/components/ui/CompletionIndicator";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { TeamSwitcher } from "@/components/team/TeamSwitcher";
import { TeamTabBar } from "./TeamTabBar";
import { MIN_INTELLIGENCE_ASSESSMENTS } from "@/lib/team-intelligence";
import { computeTeamCompletionBuckets } from "@/lib/team-stats";
import type { TeamTabContext } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Közös csapat-fejblokk: a hero (felső kép) + a fül-sor MINDEN fülön
// azonos — fülváltáskor csak az alatta lévő tartalom cserélődik, a
// „külön oldal nyílik" érzés megszűnik (2026-07-29 UX-kérés). A hero
// adatai a ctx-ből olcsón számolódnak, extra lekérdezés nincs.
// ─────────────────────────────────────────────────────────────────────

export function TeamHeroBlock({
  ctx,
  active,
}: {
  ctx: TeamTabContext;
  active: string;
}) {
  const {
    teamId, teamData, locale, isHu, profile,
    canViewRaw, isOrgManager, canManageTeamActions, manageGateCopy,
    memberTeams,
  } = ctx;

  // Közös vödör-számítás (team-stats): folyamatban = van vázlat, de nincs
  // eredmény; vár = el sem kezdte. Az OverviewTabView ugyanezt hívja.
  const { completedCount, inProgressCount, waitingCount } =
    computeTeamCompletionBuckets(teamData.members);
  const completionPct = teamData.memberCount > 0 ? Math.round((completedCount / teamData.memberCount) * 100) : 0;
  const hasPattern = completedCount >= MIN_INTELLIGENCE_ASSESSMENTS;
  const hasObserver = !!teamData.activeCampaign;
  const patternTarget = MIN_INTELLIGENCE_ASSESSMENTS;
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
              href: `/team/${teamId}?tab=intelligence#team-profile`,
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
        href: hasPattern ? `/team/${teamId}?tab=intelligence#team-profile` : `/team/${teamId}?tab=members`,
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

  // ── Hero CTA-kezelések ─────────────────────────────────────────────
  // A hero ELSŐDLEGES CTA-ja mindig a tömör, világos (glow-háttér + sötét
  // tinta) kezelést kapja — a 8%-os fehér szellem-gomb a sötét réteg-
  // gradiensen gyakorlatilag eltűnik, az CSAK másodlagos akcióként állhat
  // egy tömör gomb MELLETT. Ha a kör-kezelés az egyetlen renderelt akció
  // (nem-tag vezető/tanácsadó, még nincs csapatkép), az örökli az
  // elsődleges kezelést. Az org/manager cockpit hero-CTA-i ugyanezt a
  // tömör mintát használják.
  const isTeamMember = teamData.members.some((m) => m.userId === profile.id);
  const showPatternCta = hasPattern && canViewRaw;
  const manageRoundIsPrimary = !isTeamMember && !showPatternCta;
  const heroCtaSolidClass =
    "inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-xs font-semibold text-[var(--color-text-on-accent)] transition hover:brightness-110";
  const heroCtaGhostClass =
    "inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-xs font-medium text-[var(--color-text-on-inverse-muted)] transition hover:bg-white/[0.12]";

  return (
    <>
      {/* ═══ HERO — minden fülön azonos ═══ */}
      <SurfaceHero
        variant="team"
        eyebrow={(
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
              {t("teamDetail.heroEyebrow", locale)}
            </p>
            {/* Csapat-váltó: több csapatnál a kijelölés a Vezérlő célja is */}
            <TeamSwitcher teams={memberTeams} activeTeamId={teamId} isHu={isHu} />
          </div>
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
        title={<h1 className="font-fraunces text-title tracking-tight text-[var(--color-text-on-inverse)] md:text-hero">{teamData.teamName}</h1>}
        summary={statusLine}
        chips={heroChips.map((chip) => (
          <span
            key={chip}
            className="rounded-full bg-white/[0.08] px-3 py-1.5 text-note font-medium text-[var(--color-text-on-inverse-muted)]"
          >
            {chip}
          </span>
        ))}
        actions={(
          <>
            {/* Visszajelzés — kitüntetett belépő, csak csapattagnak */}
            {isTeamMember && active !== "feedback" ? (
              <Link
                href={`/team/${teamId}?tab=feedback`}
                scroll={false}
                // Sötét tinta a glow-hátterén — ld. org cockpit: a fehér
                // 2,7:1-et adott, ami AA alatt van mindkét színsémán.
                className={`${heroCtaSolidClass} gap-1.5`}
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
            {showPatternCta ? (
              <Link
                href={`/team/${teamId}?tab=intelligence#team-profile`}
                scroll={false}
                className={heroCtaSolidClass}
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
                className={manageRoundIsPrimary ? heroCtaSolidClass : heroCtaGhostClass}
                style={
                  manageRoundIsPrimary
                    ? { backgroundColor: teamHeroTheme.primary }
                    : undefined
                }
              >
                {hasObserver
                  ? t("teamDetail.heroManageRound", locale)
                  : t("teamDetail.heroStartRound", locale)}
              </Link>
            ) : null}
            {canViewRaw && !canManageTeamActions && isOrgManager && teamData.orgId ? (
              <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-xs font-medium text-[var(--color-text-on-inverse-muted)]">
                {hasObserver
                  ? t("teamDetail.heroManageRound", locale)
                  : t("teamDetail.heroStartRound", locale)}
              </span>
            ) : null}
          </>
        )}
        footer={
          manageGateCopy ? (
            <p className="text-xs text-[var(--color-text-on-inverse-muted)]">
              {manageGateCopy.description}
            </p>
          ) : undefined
        }
        aside={(
          <>
            <p className="text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">
              {t("teamDetail.snapshotLabel", locale)}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-2">
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="min-h-10 text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{t("teamDetail.snapshotMembers", locale)}</p>
                <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-[var(--color-text-on-inverse)]">{teamData.memberCount}</p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="min-h-10 text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{t("teamDetail.snapshotDone", locale)}</p>
                <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-[var(--color-text-on-inverse)]">{completedCount}</p>
              </div>
              <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                <p className="min-h-10 text-micro uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{t("teamDetail.snapshotWait", locale)}</p>
                <p className="mt-1 font-fraunces text-heading leading-none tabular-nums text-[var(--color-text-on-inverse)]">{waitingCount}</p>
              </div>
            </div>

            {/* Haladás-gyűrűk — az org-hero élő pillanatképével azonos nyelv */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-3 text-center">
                <CompletionIndicator percent={completionPct} size={76} color="var(--color-sage-300)" />
                <p className="flex min-h-8 items-start justify-center text-micro leading-tight text-[var(--color-text-on-inverse-muted)]">
                  {t("teamDetail.snapshotCompletionRate", locale)}
                </p>
                <p className="text-micro text-[var(--color-text-on-inverse-muted)]">
                  {tf("teamDetail.snapshotDoneInProgress", locale, { done: completedCount, inProgress: inProgressCount })}
                </p>
              </div>
              <div className="flex flex-col items-center gap-1.5 rounded-xl bg-white/[0.06] px-2 py-3 text-center">
                <CompletionIndicator percent={secondaryPct} size={76} color={teamHeroTheme.primary} />
                <p className="flex min-h-8 items-start justify-center text-micro leading-tight text-[var(--color-text-on-inverse-muted)]">
                  {secondaryLabel}
                </p>
                <p className="text-micro text-[var(--color-text-on-inverse-muted)]">
                  {secondaryText}
                </p>
              </div>
            </div>
          </>
        )}
      />

      <TeamTabBar ctx={ctx} active={active} />
    </>
  );
}
