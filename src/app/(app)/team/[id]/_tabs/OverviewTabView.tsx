import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { t, tf } from "@/lib/i18n";
import { MIN_INTELLIGENCE_ASSESSMENTS } from "@/lib/team-intelligence";
import { computeTeamCompletionBuckets } from "@/lib/team-stats";
import {
  CAMPAIGN_STEP_LABELS,
  isCampaignStepType,
} from "@/lib/campaign-steps-core";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
} from "@/components/dashboard/DashboardPrimitives";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { TeamMeasurementTimeline } from "@/components/team/TeamMeasurementTimeline";
import { TeamOverviewNextAction } from "@/components/team/TeamOverviewNextAction";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";
import { ChevronRightIcon } from "@/components/ui/icons";

// ── Overview: hero + állapotkép + szerep-függő szekciók ────────────────────
export async function OverviewTabView({ ctx }: { ctx: TeamTabContext }) {
  const {
    teamId, teamData, locale, isHu,
    canViewRaw,
    isRestricted, isNone,
    publishedReport, pendingMeasurement, observerGathering,
    receivedFeedbackRequests,
  } = ctx;

  const publishedPattern = publishedReport?.aggregates?.pattern ?? null;

  // Közös vödör-számítás (team-stats) — a TeamHeroBlock-kal azonos definíció:
  // folyamatban = van vázlat, de nincs eredmény; vár = el sem kezdte.
  const { completedCount, inProgressCount, waitingCount } =
    computeTeamCompletionBuckets(teamData.members);
  const completionPct = teamData.memberCount > 0 ? Math.round((completedCount / teamData.memberCount) * 100) : 0;
  const hasPattern = completedCount >= MIN_INTELLIGENCE_ASSESSMENTS;

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
        {/* Hero + fül-sor: közös blokk minden fülön (TeamHeroBlock) —
            fülváltásnál csak az alatta lévő tartalom cserélődik. */}
        <TeamHeroBlock ctx={ctx} active="overview" />

        {isRestricted || isNone ? (
          <OrgSubscriptionBanner
            state={isNone ? "none" : "restricted"}
            locale={locale}
          />
        ) : null}

        {/* Egyetlen fókuszált teendő: a helyi blokkok nem versenyeznek
            egymással; a teljes mérési backlog kanonikus helye a /tasks. */}
        <TeamOverviewNextAction
          isHu={isHu}
          pendingMeasurement={pendingMeasurement}
          observerGathering={observerGathering}
          receivedFeedbackRequests={receivedFeedbackRequests}
        />

        {/* ═══ ÖSSZEFOGLALÓ ═══ */}
        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionSnapshot", locale)} className="mb-4" />
          <p className="mb-3 text-micro font-medium uppercase tracking-widest text-ink-body">
            {t("teamDetail.summaryLabel", locale)}
          </p>
          <div className={`grid grid-cols-1 gap-3 ${canViewRaw ? "sm:grid-cols-2" : ""}`}>
            {/* Kitöltési arány */}
            <DashboardMetricCard
              accent="var(--color-action-primary-bg)"
              title={t("teamDetail.completionRateTitle", locale)}
              value={`${completionPct}%`}
              sub={tf("teamDetail.completionRateSub", locale, { done: completedCount, inProgress: inProgressCount, waiting: waitingCount })}
            >
              <div className="flex gap-1.5">
                {completedCount > 0 && <div className="h-1.5 rounded-full bg-sage" style={{ flex: completedCount }} />}
                {inProgressCount > 0 && <div className="h-1.5 rounded-full bg-[var(--color-layer-org-glow)]" style={{ flex: inProgressCount }} />}
                {waitingCount > 0 && <div className="h-1.5 rounded-full bg-bronze/65" style={{ flex: waitingCount }} />}
              </div>
            </DashboardMetricCard>

            {/* Csapatmintázat-állapot CSAK tanácsadónak (UX-audit #7) —
                és NEM metrika-kártyaként (UX-audit #28): az „Elérhető" nem
                mennyiség, hanem státusz, ezért chip hordozza, nem nagy szám.
                CTA nincs (UX-audit #3): a megnyitás útja a hero gombja. */}
            {canViewRaw ? (
              <div className="rounded-[24px] border border-sand bg-surface-card p-5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-micro font-medium uppercase tracking-widest text-ink-body">
                    {t("teamDetail.teamPatternTitle", locale)}
                  </p>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-micro font-semibold ${
                      hasPattern
                        ? "bg-sage/15 text-sage-dark"
                        : "bg-state-warning-bg text-state-warning-fg"
                    }`}
                  >
                    {hasPattern
                      ? t("teamDetail.teamPatternAvailable", locale)
                      : t("teamDetail.teamPatternNotYet", locale)}
                  </span>
                </div>
                <p className="mt-2 text-caption leading-relaxed text-ink-body">
                  {hasPattern
                    ? teamData.patternResult?.fullLabel
                    : tf("teamDetail.teamPatternProgress", locale, { pct: completionPct })}
                </p>
              </div>
            ) : null}
          </div>

          {/* Mérés-bontás: a kitöltési arány csak a személyiség-profilt méri —
              futó kampánynál mérésenként is megmutatjuk, hol tart a csapat.
              A számok a kampány-részletezővel azonos lépés-logikából jönnek. */}
          {teamData.activeCampaign && teamData.activeCampaign.stepProgress.length > 0 ? (
            <div className="mt-3 rounded-[24px] border border-sand bg-surface-card p-5">
              <p className="text-micro font-medium uppercase tracking-widest text-ink-body">
                {t("teamDetail.measurementBreakdownTitle", locale)}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-muted">
                {tf("teamDetail.measurementBreakdownHint", locale, {
                  name: teamData.activeCampaign.name,
                })}
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                {teamData.activeCampaign.stepProgress.map((step) => {
                  const label = isCampaignStepType(step.type)
                    ? CAMPAIGN_STEP_LABELS[step.type][isHu ? "hu" : "en"]
                    : step.type;
                  const pct = step.total > 0 ? Math.round((step.done / step.total) * 100) : 0;
                  return (
                    <div
                      key={step.type}
                      className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3"
                    >
                      <span className="truncate text-xs text-ink-body md:w-56 md:shrink-0">
                        {label}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                          <div
                            className="h-full rounded-full bg-sage transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-note tabular-nums text-muted">
                          {tf("teamDetail.measurementBreakdownDone", locale, {
                            done: step.done,
                            total: step.total,
                          })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : null}
        </section>

        {/* A korábbi „Csapatintelligencia" CTA-kártya és a nézet-linkkártyák
            (profil/tagok/szerepek) kikerültek (2026-07-29): a TeamTabBar a
            navigáció egyetlen, kanonikus helye — a kártyák ugyanazokat a
            célokat duplikálták. Az adatminőség-infó az Intelligencia fülön él. */}


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
                      <SectionEyebrow>
                        {isHu ? "tanácsadó által jóváhagyott csapatkép" : "consultant-approved team picture"}
                      </SectionEyebrow>
                      {publishedPattern?.label ? (
                        <p className="mt-1 font-fraunces text-2xl leading-tight text-ink">
                          {publishedPattern.label}
                        </p>
                      ) : (
                        <p className="mt-1 font-fraunces text-xl leading-tight text-ink">
                          {isHu ? "A csapat jóváhagyott profilja" : "The team's approved profile"}
                        </p>
                      )}
                      {/* Szám-definíció (UX-audit #8): a chipek a PUBLIKÁLÁSKOR
                          befagyasztott aggregátumot mutatják — az élő taglétszám
                          (hero) ettől eltérhet, a címke ezt kimondja. */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-note text-ink-body">
                          {publishedReport.aggregates!.memberCount}{" "}
                          {isHu ? "tag a jóváhagyott képben" : "members in the approved picture"}
                        </span>
                        <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-note text-ink-body">
                          {publishedReport.aggregates!.completionPct}%{" "}
                          {isHu ? "kitöltöttség" : "completion"}
                        </span>
                        {typeof publishedReport.aggregates!.evidence?.measuredEdgeCount === "number" &&
                          publishedReport.aggregates!.evidence!.measuredEdgeCount > 0 && (
                            <span className="rounded-full bg-sage/15 px-2.5 py-1 text-note font-medium text-sage-dark">
                              {publishedReport.aggregates!.evidence!.measuredEdgeCount}{" "}
                              {isHu ? "mért kapcsolati adat" : "measured relationship data points"}
                            </span>
                          )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-ink-body">
                        {isHu
                          ? "A tanácsadó által jóváhagyott, aggregált kép — egyéni eredmények nélkül, a publikálás pillanatában rögzítve."
                          : "Aggregate picture approved by your consultant — without individual results, frozen at publication."}
                      </p>
                      <Link
                        href={`/team/${teamId}?tab=report`}
                        className="mt-3 inline-flex min-h-[38px] items-center rounded-[10px] bg-sage px-4 text-xs font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
                      >
                        {isHu ? "Csapatkép megnyitása" : "Open team picture"}
                        <ChevronRightIcon className="ml-1 inline h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-state-success-bg text-state-success-fg">
                      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 8.5l3 3 7-7" />
                      </svg>
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-ink">
                        {isHu ? "A jóváhagyott csapatkép elérhető" : "The approved team picture is available"}
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
                        {isHu ? "Csapatkép megnyitása" : "Open team picture"}
                        <ChevronRightIcon className="ml-1 inline h-3.5 w-3.5" />
                      </Link>
                    </div>
                  </div>
                )
              ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-state-warning-bg text-state-warning-fg">
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {isHu ? "A csapatkép tanácsadói jóváhagyásra vár" : "Team picture awaiting consultant approval"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-body">
                    {isHu
                      ? "A csapatszintű eredményeket a tanácsadó összesíti és jóváhagyja — a személyes beszélgetések tanulságaival együtt, aggregált formában lesznek elérhetők. Addig a kitöltés haladását követheted ezen az oldalon."
                      : "Team-level results are aggregated and approved by your consultant — they become available in aggregate form, together with insights from the personal interviews. Until then you can track completion progress on this page."}
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
