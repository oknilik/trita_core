import Link from "next/link";
import { t, tf } from "@/lib/i18n";
import { extractNarrativeHighlights } from "@/lib/team-report-presentation";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { resolveTeamReadiness, TEAM_READINESS_STAGES } from "@/lib/team-readiness";
import { reportPatternLabel } from "@/lib/team-report-compatibility";
import type { TeamReportAggregates } from "@/lib/team-report";
import { TEAM_ROLES, type TeamRoleCode } from "@/lib/team-role-scoring";
import { Card } from "@/components/ui/primitives/Card";
import {
  ChevronRightIcon,
  NetworkIcon,
  RoleClusterIcon,
  SparklesIcon,
} from "@/components/ui/icons";

interface StepProgress {
  type: string;
  done: number;
  total: number;
}

interface TeamMemberSnapshotProps {
  teamId: string;
  isHu: boolean;
  memberCount: number;
  completedCount: number;
  inProgressCount: number;
  waitingCount: number;
  stepProgress: StepProgress[];
  report: {
    aggregates: TeamReportAggregates | null;
    summary: string | null;
  } | null;
  hasPersonalTask: boolean;
}

function pct(done: number, total: number): number {
  return total > 0 ? Math.round((done / total) * 100) : 0;
}

function ProgressRow({
  label,
  done,
  total,
  emptyLabel,
  valueOverride,
}: {
  label: string;
  done: number | null;
  total: number | null;
  emptyLabel: string;
  valueOverride?: number | null;
}) {
  const value = valueOverride ?? (done !== null && total !== null ? pct(done, total) : 0);

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-note text-ink-body">
        <span>{label}</span>
        <strong className="font-semibold text-ink">
          {done !== null && total !== null ? `${done} / ${total}` : emptyLabel}
        </strong>
      </div>
      <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--color-layer-team-accent)]/10">
        <div
          className="h-full rounded-full bg-[var(--color-layer-team-accent)]/65 transition-[width] duration-700"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function TeamMemberSnapshot({
  teamId,
  isHu,
  memberCount,
  completedCount,
  inProgressCount,
  waitingCount,
  stepProgress,
  report,
  hasPersonalTask,
}: TeamMemberSnapshotProps) {
  const completionPct = pct(completedCount, memberCount);
  const roleStep = stepProgress.find((step) => step.type === "TEAM_ROLE");
  const trustStep = stepProgress.find((step) => step.type === "TRUST_360");
  const aggregates = report?.aggregates ?? null;
  const roleDistribution = aggregates?.roleDistribution ?? null;
  const reportReady = Boolean(report);
  const locale = isHu ? "hu" : "en";
  const readiness = resolveTeamReadiness({ memberCount, completedCount, stepProgress, hasPublishedReport: reportReady });
  const stageIndex = TEAM_READINESS_STAGES.indexOf(readiness.stage);
  const highlights = extractNarrativeHighlights(report?.summary, 3);
  const roleEntries = roleDistribution
    ? (Object.entries(roleDistribution.counts) as Array<[TeamRoleCode, number]>)
        .filter(([role, count]) => role in TEAM_ROLES && count > 0)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
    : [];
  const trustCoverage = aggregates?.trustHighlights?.source === "trust_round"
    ? aggregates.trustHighlights.coveragePct
    : null;

  const copy = isHu
    ? {
        title: t(readiness.profilesComplete ? "teamReadiness.profilesComplete" : "teamReadiness.profilesInProgress", locale),
        body: tf("teamReadiness.profileCounts", locale, { done: completedCount, inProgress: inProgressCount, waiting: waitingCount }),
        profile: "Személyiségprofil",
        roles: "Csapatszerepek",
        trust: "Bizalmi háló",
        noRound: "Nincs kör",
        roleTitle: "Csapatszerepek",
        roleCopy: "Milyen hozzájárulások tartják mozgásban a csapatot, és hol van tartalék.",
        patternTitle: "Működési mintázat",
        patternCopy: "A közös erősség és egy figyelendő együttműködési minta.",
        trustTitle: "Bizalmi háló",
        trustCopy: trustStep
          ? `Már ${trustStep.done} / ${trustStep.total} csapattárs kitöltötte a kapcsolati kört.`
          : trustCoverage !== null
            ? `A mért kapcsolati kép lefedettsége ${trustCoverage}%.`
            : "A kapcsolati kép akkor épül fel, amikor elindul a bizalmi kör.",
        lockedTitle: "A riporttal nyílik meg",
        lockedRoles: "A szerepegyensúly a jóváhagyott, aggregált csapatkép része.",
        lockedPattern: "A közös mintázat a riport publikálása után válik láthatóvá.",
        nextLabel: "Következő lépés",
        nextTask: "Van nyitott teendőd – a részleteket a fenti teendőkártyán találod.",
        nextReady: reportReady
          ? "A csapatriport elkészült – nézd meg a közös felismeréseket."
          : t(`teamReadiness.${readiness.stage}Description`, locale),
        taskCta: "Feladataim",
        reportCta: "Riport megnyitása",
        statusLabel: t(`teamReadiness.${readiness.stage}`, locale),
        roleFallback: "A szerepeloszlás a riportban jelenik meg.",
        patternFallback: "A jóváhagyott csapatmintázat",
      }
    : {
        title: t(readiness.profilesComplete ? "teamReadiness.profilesComplete" : "teamReadiness.profilesInProgress", locale),
        body: tf("teamReadiness.profileCounts", locale, { done: completedCount, inProgress: inProgressCount, waiting: waitingCount }),
        profile: "Personality profile",
        roles: "Team roles",
        trust: "Trust network",
        noRound: "No round",
        roleTitle: "Team roles",
        roleCopy: "Which contributions keep the team moving, and where there is backup coverage.",
        patternTitle: "Working pattern",
        patternCopy: "A shared strength and one collaboration pattern worth watching.",
        trustTitle: "Trust network",
        trustCopy: trustStep
          ? `${trustStep.done} / ${trustStep.total} teammates have completed the relationship round.`
          : trustCoverage !== null
            ? `The measured relationship picture has ${trustCoverage}% coverage.`
            : "The relationship picture starts taking shape when a trust round launches.",
        lockedTitle: "Unlocks with the report",
        lockedRoles: "Role balance is part of the approved, aggregate team picture.",
        lockedPattern: "The shared pattern becomes visible after the report is published.",
        nextLabel: "Next step",
        nextTask: "You have an open task – find the details in the action card above.",
        nextReady: reportReady
          ? "The team report is ready – explore the shared insights."
          : t(`teamReadiness.${readiness.stage}Description`, locale),
        taskCta: "My tasks",
        reportCta: "Open report",
        statusLabel: t(`teamReadiness.${readiness.stage}`, locale),
        roleFallback: "Role distribution appears in the report.",
        patternFallback: "The approved team pattern",
      };

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
        <div>
          <SectionEyebrow>{isHu ? "állapotkép" : "snapshot"}</SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-3xl text-ink">{reportReady ? t("teamHierarchy.reportEssentials", locale) : isHu ? "A közös kép állása" : "Your shared team picture"}</h2>
        </div>
        <span className={`inline-flex rounded-full px-3 py-1.5 text-caption font-semibold ${
          reportReady
            ? "bg-state-success-bg text-state-success-fg"
            : "bg-[var(--color-layer-team-soft)] text-[var(--color-layer-team-accent)]"
        }`}>
          {copy.statusLabel}
        </span>
      </div>

      {highlights.length > 0 && (
        <Card as="div" spacing="md" className="mb-4">
          <SectionEyebrow>{t("teamHierarchy.approvedInsights", locale)}</SectionEyebrow>
          <ol className="mt-3 space-y-3">
            {highlights.map((highlight, index) => (
              <li key={index} className="flex gap-3 text-body text-ink-body">
                <span className="font-semibold text-[var(--color-layer-team-accent)]" aria-hidden>{index + 1}.</span>
                <span>{highlight}</span>
              </li>
            ))}
          </ol>
        </Card>
      )}
      <div className="mt-4 flex flex-col gap-3 rounded-2xl bg-state-success-bg px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-micro font-semibold uppercase tracking-widest text-state-success-fg">{copy.nextLabel}</p>
          <p className="mt-1 text-caption font-semibold text-ink">{hasPersonalTask ? copy.nextTask : copy.nextReady}</p>
        </div>
        {hasPersonalTask || reportReady ? (
          <Link
            href={hasPersonalTask ? "/tasks" : `/team/${teamId}?tab=report`}
            className={getButtonClassName({ size: "sm", className: "gap-1 self-start sm:self-auto" })}
          >
            {hasPersonalTask ? copy.taskCta : copy.reportCta}
            <ChevronRightIcon />
          </Link>
        ) : null}
      </div>

      <details open={!reportReady && !readiness.profilesComplete} className="mt-4 rounded-2xl border border-sand bg-surface-card p-4">
        <summary className="min-h-11 cursor-pointer py-3 text-caption font-semibold text-ink">{t("teamHierarchy.readinessDetails", locale)}</summary>
        <div className="pt-3">
      <ol aria-label={t("teamReadiness.progressLabel", locale)} className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {TEAM_READINESS_STAGES.map((stage, index) => (
          <li
            key={stage}
            aria-current={stage === readiness.stage ? "step" : undefined}
            className={`rounded-xl border px-3 py-2 text-caption ${index <= stageIndex ? "border-surface-team-border bg-surface-team-accent-soft text-ink" : "border-sand text-ink-body"}`}
          >
            <span className="mr-2 font-semibold" aria-hidden>{index < stageIndex ? "✓" : index + 1}</span>
            {t(`teamReadiness.step${stage[0].toUpperCase()}${stage.slice(1)}`, locale)}
          </li>
        ))}
      </ol>

      <Card
        as="div"
        spacing="none"
        className="grid overflow-hidden border-surface-team-border md:grid-cols-[1.35fr_.65fr]"
      >
        <div className="relative grid grid-cols-[auto_1fr] items-center gap-5 px-5 py-6 sm:px-7 sm:py-7">
          <div
            className="grid h-24 w-24 place-items-center rounded-full p-2.5"
            style={{
              background: `conic-gradient(var(--color-layer-team-accent) ${completionPct}%, color-mix(in srgb, var(--color-layer-team-accent) 12%, transparent) 0)`,
            }}
          >
            <div className="grid h-full w-full place-items-center rounded-full bg-surface-card font-fraunces text-2xl text-ink">
              {completionPct}%
            </div>
          </div>
          <div>
            <p className="text-label uppercase text-[var(--color-layer-team-accent)]">{copy.profile}</p>
            <h3 className="mt-1.5 font-fraunces text-2xl text-ink">{copy.title}</h3>
            <p className="mt-2 text-caption leading-relaxed text-ink-body">{copy.body}</p>
          </div>
        </div>
        <div className="flex flex-col justify-center gap-4 bg-[var(--color-layer-team-soft)]/55 px-5 py-6 sm:px-6">
          <ProgressRow label={copy.profile} done={completedCount} total={memberCount} emptyLabel={copy.noRound} />
          <ProgressRow
            label={copy.roles}
            done={roleStep?.done ?? (roleDistribution?.questionnaireCount ?? null)}
            total={roleStep?.total ?? (roleDistribution ? memberCount : null)}
            emptyLabel={copy.noRound}
          />
          <ProgressRow
            label={copy.trust}
            done={trustStep?.done ?? null}
            total={trustStep?.total ?? null}
            emptyLabel={trustCoverage !== null ? `${trustCoverage}%` : copy.noRound}
            valueOverride={trustStep ? null : trustCoverage}
          />
        </div>
      </Card>

        </div>
      </details>

      {reportReady && <div className="mt-4 grid gap-4 md:grid-cols-3">
        <Card as="article" spacing="md" className="relative min-h-48 overflow-hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-layer-team-soft)] text-[var(--color-layer-team-accent)]"><RoleClusterIcon /></span>
          <h3 className="mt-4 font-fraunces text-xl text-ink">{copy.roleTitle}</h3>
          <p className="mt-1.5 text-caption leading-relaxed text-ink-body">{copy.roleCopy}</p>
          {roleDistribution && <p className="mt-2 text-caption text-ink-body">{tf("teamEvidence.roleCounts", locale, { measured: roleDistribution.questionnaireCount, estimated: roleDistribution.estimateCount })}</p>}
          {roleEntries.length > 0 ? (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {roleEntries.map(([role, count]) => (
                <span key={role} className="rounded-full bg-[var(--color-layer-team-soft)] px-2.5 py-1 text-note text-[var(--color-layer-team-accent)]">
                  {TEAM_ROLES[role][isHu ? "hu" : "en"]} · {count}
                </span>
              ))}
            </div>
          ) : <p className="mt-3 text-note text-muted">{copy.roleFallback}</p>}
        </Card>

        <Card as="article" spacing="md" className="relative min-h-48 overflow-hidden">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-layer-team-soft)] text-[var(--color-layer-team-accent)]"><SparklesIcon /></span>
          <h3 className="mt-4 font-fraunces text-xl text-ink">{copy.patternTitle}</h3>
          <p className="mt-1.5 text-note leading-relaxed text-ink-body">{copy.patternCopy}</p>
          <p className="mt-3 font-fraunces text-base text-[var(--color-layer-team-accent)]">
            {reportPatternLabel(aggregates?.pattern?.label) ?? copy.patternFallback}
          </p>
        </Card>

        <Card as="article" spacing="md" className="min-h-48">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-layer-team-soft)] text-[var(--color-layer-team-accent)]"><NetworkIcon /></span>
          <h3 className="mt-4 font-fraunces text-xl text-ink">{copy.trustTitle}</h3>
          <p className="mt-1.5 text-note leading-relaxed text-ink-body">{copy.trustCopy}</p>
          {trustStep ? (
            <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--color-layer-team-accent)]/10">
              <div className="h-full rounded-full bg-[var(--color-layer-team-accent)]" style={{ width: `${pct(trustStep.done, trustStep.total)}%` }} />
            </div>
          ) : null}
        </Card>
      </div>}
    </section>
  );
}
