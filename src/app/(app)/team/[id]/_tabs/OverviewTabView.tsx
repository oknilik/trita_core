import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { t, tf } from "@/lib/i18n";
import { MIN_INTELLIGENCE_ASSESSMENTS } from "@/lib/team-intelligence";
import { computeTeamCompletionBuckets } from "@/lib/team-stats";
import {
  CAMPAIGN_STEP_LABELS,
  CAMPAIGN_STEP_LINKS,
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
import { RadarChart } from "@/components/dashboard/RadarChart";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";

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
                <div className="shrink-0 rounded-[10px] border border-sand bg-surface-card px-4 py-2.5 text-center">
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
                  className="inline-flex min-h-[44px] shrink-0 items-center rounded-[10px] bg-action-primary-bg px-5 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
                >
                  {pendingMeasurement.started
                    ? isHu ? "Folytatom a kitöltést" : "Continue filling in"
                    : pendingMeasurement.stepType === "PEER_FEEDBACK"
                      ? isHu ? "Visszajelzést adok" : "Give feedback"
                      : isHu ? "Kitöltöm most" : "Fill it in now"}
                </Link>
              )}
            </div>
            {/* Tag-oldali kampány-nézet: teljes haladás + vissza a feladatokra */}
            <p className="mt-2 text-right">
              <Link
                href="/tasks"
                className="text-xs font-semibold text-sage-dark transition hover:text-ink"
              >
                {isHu ? "Összes mérési feladatom" : "All my measurement tasks"}
              </Link>
            </p>
          </section>
        ) : null}

        {/* Futó observer-kör: a self-kitöltés után is látszik a gyűjtés
            állapota — a meghívó-küldés a tag feladata, ne vesszen el. */}
        {observerGathering ? (
          <section>
            <div className="flex flex-col gap-3 rounded-[18px] border border-bronze/35 bg-bronze/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-micro uppercase tracking-widest text-[var(--color-accent-primary-strong)]">
                  {isHu ? "Külső visszajelzés — gyűjtés alatt" : "Outside feedback — collecting"}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {observerGathering.campaignName}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-body">
                  {isHu
                    ? `Te kéred fel az értékelőidet: küldj meghívót legalább ${observerGathering.min} kollégának vagy külső partnernek — az önkép–külső kép összevetésed ${observerGathering.min} beérkezett visszajelzésnél nyílik meg.`
                    : `You choose your raters: invite at least ${observerGathering.min} colleagues or external partners — your self vs. outside view comparison opens at ${observerGathering.min} received responses.`}
                </p>
                <p className="mt-2 font-mono text-xs tabular-nums text-[var(--color-accent-primary-strong)]">
                  {isHu
                    ? `${observerGathering.received}/${observerGathering.min} beérkezett · ${observerGathering.sent} meghívó elküldve`
                    : `${observerGathering.received}/${observerGathering.min} received · ${observerGathering.sent} invites sent`}
                </p>
              </div>
              <Link
                href="/profile/results?tab=comparison#observer-flow"
                className="inline-flex min-h-[44px] shrink-0 items-center rounded-[10px] bg-action-primary-bg px-5 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
              >
                {observerGathering.sent < observerGathering.min
                  ? isHu ? "Kérek visszajelzést" : "Request feedback"
                  : isHu ? "Meghívók kezelése" : "Manage invites"}
              </Link>
            </div>
          </section>
        ) : null}

        {/* Tőlem kért observer-visszajelzések (csapattársaktól) — innen
            indítható vagy folytatható a kitöltés. */}
        {receivedFeedbackRequests.length > 0 ? (
          <section>
            <div className="rounded-[18px] border border-sage/35 bg-sage/5 p-5">
              <p className="font-mono text-micro uppercase tracking-widest text-sage-dark">
                {isHu ? "Tőled kért visszajelzés" : "Feedback requested from you"}
              </p>
              <div className="mt-3 flex flex-col gap-2">
                {receivedFeedbackRequests.map((req) => (
                  <div
                    key={req.token}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-sand bg-surface-card px-3.5 py-2.5"
                  >
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] font-bold text-[var(--color-action-primary-fg)]">
                        ★
                      </span>
                      <span className="text-caption font-medium text-ink">
                        {isHu
                          ? `${req.inviterName} visszajelzést kér tőled`
                          : `${req.inviterName} asked you for feedback`}
                      </span>
                      {req.answered > 0 && (
                        <span className="rounded-full bg-sage/10 px-2 py-0.5 text-micro font-semibold text-sage-dark">
                          {req.answered}/{req.total}{" "}
                          {isHu ? "kérdés kész" : "questions done"}
                        </span>
                      )}
                    </span>
                    <Link
                      href={`/observe/${req.token}`}
                      className="inline-flex min-h-[36px] shrink-0 items-center rounded-lg bg-action-primary-bg px-3.5 text-xs font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
                    >
                      {req.answered > 0
                        ? isHu ? "Folytatom" : "Continue"
                        : isHu ? "Kitöltöm" : "Fill in"}
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </section>
        ) : null}

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
              <p className="mt-1 text-[12px] leading-relaxed text-muted">
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
                      <span className="truncate text-[12px] text-ink-body md:w-56 md:shrink-0">
                        {label}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sand">
                          <div
                            className="h-full rounded-full bg-sage transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-16 shrink-0 text-right text-[11px] tabular-nums text-muted">
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
                        {isHu ? "validált csapatkép" : "validated team picture"}
                      </SectionEyebrow>
                      {publishedPattern?.label ? (
                        <p className="mt-1 font-fraunces text-2xl leading-tight text-ink">
                          {publishedPattern.label}
                        </p>
                      ) : (
                        <p className="mt-1 font-fraunces text-xl leading-tight text-ink">
                          {isHu ? "A csapat validált profilja" : "The team's validated profile"}
                        </p>
                      )}
                      {/* Szám-definíció (UX-audit #8): a chipek a PUBLIKÁLÁSKOR
                          befagyasztott aggregátumot mutatják — az élő taglétszám
                          (hero) ettől eltérhet, a címke ezt kimondja. */}
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] text-ink-body">
                          {publishedReport.aggregates!.memberCount}{" "}
                          {isHu ? "tag a validált képben" : "members in the validated picture"}
                        </span>
                        <span className="rounded-full border border-sand bg-surface-card px-2.5 py-1 text-[11px] text-ink-body">
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
                          ? "A tanácsadó által validált, aggregált kép — egyéni eredmények nélkül, a publikálás pillanatában rögzítve."
                          : "Aggregate picture validated by your consultant — without individual results, frozen at publication."}
                      </p>
                      <Link
                        href={`/team/${teamId}?tab=report`}
                        className="mt-3 inline-flex min-h-[38px] items-center rounded-[10px] bg-sage px-4 text-[12px] font-semibold text-[var(--color-action-primary-fg)] transition hover:bg-sage-dark"
                      >
                        {isHu ? "Csapatkép megnyitása →" : "Open team picture →"}
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
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-state-warning-bg text-state-warning-fg">
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
