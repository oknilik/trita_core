"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { dimColorsCss } from "@/lib/color-system";
import { getDimensionLabel } from "@/lib/dimension-utils";
import { TEAM_ROLES, type TeamRoleCode } from "@/lib/team-role-scoring";
import { track } from "@/lib/analytics/client";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";
import { ClockIcon, FlaskIcon, ChatIcon } from "@/components/landing/icons";

const profileDimensions = [
  { code: "H", value: 74, key: "landing.selfDim1" },
  { code: "E", value: 50, key: "landing.selfDim2" },
  { code: "X", value: 50, key: "landing.selfDim3" },
  { code: "A", value: 86, key: "landing.selfDim4" },
  { code: "C", value: 50, key: "landing.selfDim5" },
  { code: "O", value: 50, key: "landing.selfDim6" },
] as const;

const likelyRoles: TeamRoleCode[] = ["CS", "KO"];

const teamPrinciples = [
  { key: "landing.teamAxisDrive", value: 81, color: "var(--color-layer-team-accent)" },
  { key: "landing.teamAxisCohesion", value: 64, color: "var(--color-sage)" },
  { key: "landing.teamAxisDiscipline", value: 55, color: "var(--color-bronze)" },
  { key: "landing.teamAxisOpenness", value: 56, color: "var(--color-dim-h-base)" },
] as const;

function ProfileMark() {
  return (
    <div
      aria-hidden
      className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-[var(--color-surface-subtle)] text-[var(--color-sage-dark)]"
    >
      <svg viewBox="0 0 64 64" fill="none" className="h-10 w-10" stroke="currentColor" strokeWidth="2">
        <path d="M9 45h46M14 45V24m36 21V24M19 24v9m26-9v9M14 31c10 10 26 10 36 0" />
        <path d="M10 20h8m28 0h8M14 20v4m36-4v4" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function ProfilePreview() {
  const { locale } = useLocale();
  const roleRanks = [
    t("landing.selfTeamRoleRank1", locale),
    t("landing.selfTeamRoleRank2", locale),
  ];

  return (
    <div
      data-focused-profile-preview
      className="relative overflow-hidden rounded-[28px] border border-[var(--color-border-soft)] bg-surface-card p-5 shadow-[0_24px_64px_rgba(26,26,46,0.10)] sm:p-7 lg:p-8"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h2 className="font-fraunces text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          {t("landing.focusedPreviewTitle", locale)}
        </h2>
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-3 py-1.5 text-micro font-medium text-[var(--color-text-muted)]">
          {t("landing.focusedPreviewBadge", locale)}
        </span>
      </div>

      <div className="mt-6 flex items-start gap-4">
        <ProfileMark />
        <div className="min-w-0">
          <p className="font-fraunces text-base text-ink-body">
            {t("landing.selfPanelName", locale)}
          </p>
          <div className="mt-0.5 flex flex-wrap items-center gap-2">
            <p className="font-fraunces text-2xl font-medium italic text-[var(--color-accent-primary-mid)] sm:text-3xl">
              {t("landing.selfPanelType", locale)}
            </p>
            <span className="rounded-md bg-[var(--color-surface-subtle)] px-2 py-1 text-micro font-semibold text-[var(--color-text-muted)]">
              {t("landing.selfPanelRole", locale)}
            </span>
          </div>
          <p className="mt-2 max-w-[520px] text-note leading-relaxed text-ink-body">
            {t("landing.selfPanelInsight", locale)}
          </p>
        </div>
      </div>

      <div className="mt-7 space-y-2.5">
        {profileDimensions.map((dimension) => {
          const colors = dimColorsCss(dimension.code);
          return (
            <div
              key={dimension.code}
              className="grid grid-cols-[minmax(6.5rem,0.9fr)_minmax(4.5rem,1.3fr)_2rem_auto] items-center gap-2 sm:gap-3"
            >
              <span className="truncate text-micro text-ink-body sm:text-note">
                {t(dimension.key, locale)}
              </span>
              <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-subtle)]">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${dimension.value}%`, backgroundColor: colors.strong }}
                />
              </div>
              <span className="text-right font-mono text-micro tabular-nums text-[var(--color-text-muted)]">
                {dimension.value}
              </span>
              <span
                className="rounded px-1.5 py-0.5 text-micro font-semibold"
                style={{ backgroundColor: colors.soft, color: colors.strong }}
              >
                {getDimensionLabel(dimension.value, locale)}
              </span>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <span className="text-micro font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          {t("landing.selfStrLabel", locale)}:
        </span>
        {profileDimensions.filter(({ code }) => code === "A" || code === "H").map((dimension) => {
          const colors = dimColorsCss(dimension.code);
          return (
            <span
              key={dimension.code}
              className="rounded px-2 py-1 text-micro font-medium"
              style={{ backgroundColor: colors.soft, color: colors.strong }}
            >
              {t(dimension.key, locale)}
            </span>
          );
        })}
      </div>

      <div data-landing-preview-detail="self-roles" className="mt-6 border-t border-[var(--color-border-soft)] pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("landing.selfTeamRolesEyebrow", locale)}
          </p>
          <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-micro font-semibold text-[var(--color-text-muted)]">
            {t("landing.selfTeamRolesSource", locale)}
          </span>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {likelyRoles.map((role, index) => {
            const isPrimary = index === 0;

            return (
              <div
                key={role}
                data-role-rank={isPrimary ? "primary" : "secondary"}
                className={`flex items-center gap-3 rounded-xl border p-3 ${
                  isPrimary
                    ? "border-[var(--color-sage-ring)] bg-[var(--color-sage-soft)]/55"
                    : "border-[var(--color-bronze-edge)] bg-[var(--color-bronze-soft)]/55"
                }`}
              >
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-micro font-bold text-[var(--color-text-on-inverse)] ${
                    isPrimary
                      ? "bg-[var(--color-sage)]"
                      : "bg-[var(--color-bronze)]"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate font-fraunces text-sm font-semibold text-ink">
                    {TEAM_ROLES[role][locale]}
                  </p>
                  <p
                    className={`mt-0.5 text-micro font-semibold uppercase tracking-wide ${
                      isPrimary
                        ? "text-[var(--color-sage-dark)]"
                        : "text-[var(--color-bronze-dark)]"
                    }`}
                  >
                    {roleRanks[index]}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-3 text-micro leading-relaxed text-[var(--color-text-muted)]">
          {t("landing.selfTeamRolesNote", locale)}
        </p>
      </div>
    </div>
  );
}

function InsightCard({
  icon,
  label,
  text,
  tone,
}: {
  icon: ReactNode;
  label: string;
  text: string;
  tone: "sage" | "bronze";
}) {
  const color = tone === "sage" ? "var(--color-sage-dark)" : "var(--color-bronze-dark)";

  return (
    <div className="rounded-2xl border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)]/55 p-4 sm:p-5">
      <p className="flex items-center gap-2 text-sm font-semibold" style={{ color }}>
        {icon}
        {label}
      </p>
      <p className="mt-2 text-note leading-relaxed text-ink-body">{text}</p>
    </div>
  );
}

function FocusedHero() {
  const { locale } = useLocale();
  const [hasDraft, setHasDraft] = useState(false);

  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage csak kliensen érhető el
  useEffect(() => setHasDraft(hasAssessmentDraftInStorage("TRITAN")), []);

  return (
    <section className="overflow-hidden bg-cream px-6 pb-14 pt-12 sm:px-8 sm:pb-16 sm:pt-16 lg:px-10 lg:pb-20 lg:pt-20">
      <div className="mx-auto grid max-w-[1180px] items-center gap-10 lg:grid-cols-[0.88fr_1.12fr] lg:gap-14 xl:gap-20">
        <div data-focused-hero-copy className="mx-auto max-w-[650px] text-center lg:mx-0 lg:text-left">
          <SectionEyebrow tone="bronze" className="mb-5">
            {t("landing.focusedEyebrow", locale)}
          </SectionEyebrow>
          <h1 className="text-balance font-fraunces text-fluid-display font-medium tracking-tight text-ink">
            {t("landing.ctaSelfHeadlineBefore", locale)}
            <em className="italic text-[var(--color-accent-primary-mid)]">
              {t("landing.ctaSelfHeadlineEm", locale)}
            </em>
          </h1>
          <p className="mx-auto mt-6 max-w-[580px] text-balance text-base font-light leading-relaxed text-ink-body sm:text-lg lg:mx-0">
            {t("landing.focusedHeroSub", locale)}
          </p>
          <div className="mt-8 flex flex-col items-stretch gap-3 sm:items-center lg:items-start">
            <Link
              href="/try"
              onClick={() => track("cta.click", { cta_id: "hero_primary", surface: "landing", mode: "self" })}
              className={getButtonClassName({
                size: "lg",
                className: "min-h-[54px] w-full px-8 text-base shadow-md hover:-translate-y-px hover:shadow-lg sm:w-auto sm:min-w-[310px]",
              })}
              style={{
                background: "var(--color-bronze-dark)",
                color: "var(--color-text-on-accent-deep)",
              }}
            >
              {hasDraft ? t("landing.selfCtaContinue", locale) : t("landing.focusedHeroCta", locale)}
            </Link>
            <p className="text-note text-[var(--color-text-muted)]">
              {t("landing.ctaSelfMicrocopy", locale)}
            </p>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[760px] lg:max-w-none">
          <div aria-hidden className="absolute -inset-x-20 top-1/2 -z-0 h-px bg-[var(--color-border-soft)]" />
          <div className="relative z-10">
            <ProfilePreview />
          </div>
        </div>
      </div>
    </section>
  );
}

function FocusedSteps() {
  const { locale } = useLocale();
  const steps = [
    { number: "01", title: t("landing.howSelf1Title", locale), text: t("landing.howSelf1Desc", locale) },
    { number: "02", title: t("landing.focusedStep2Title", locale), text: t("landing.howSelf2Desc", locale) },
    { number: "03", title: t("landing.focusedStep3Title", locale), text: t("landing.focusedStep3Desc", locale) },
  ];

  return (
    <section className="px-6 py-12 sm:px-8 sm:py-16 lg:px-10">
      <div className="mx-auto max-w-[1180px] rounded-[28px] border border-[var(--color-border-soft)] bg-surface-card p-6 shadow-sm sm:p-8 lg:p-10">
        <h2 className="font-fraunces text-3xl font-medium tracking-tight text-ink sm:text-4xl">
          {t("landing.focusedStepsTitle", locale)}
        </h2>
        <div className="mt-8 grid gap-6 md:grid-cols-3 md:gap-0">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className={`grid grid-cols-[4.25rem_1fr] gap-4 md:px-7 ${index === 0 ? "md:pl-0" : "md:border-l md:border-[var(--color-border-soft)]"}`}
            >
              <span className="font-fraunces text-5xl font-light leading-none text-[var(--color-bronze)]/65">
                {step.number}
              </span>
              <div>
                <h3 className="text-sm font-semibold text-ink">{step.title}</h3>
                <p className="mt-1 text-note leading-relaxed text-ink-body">{step.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TeamReportPreview() {
  const { locale } = useLocale();

  return (
    <div
      data-focused-team-preview
      className="overflow-hidden rounded-[24px] border border-white/15 bg-surface-card text-ink shadow-[0_18px_44px_rgba(15,10,25,0.28)]"
    >
      <div className="bg-[var(--color-surface-subtle)] px-5 py-5 sm:px-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-layer-team-accent)]">
              {t("landing.teamPanelEyebrow", locale)}
            </p>
            <p className="mt-2 font-fraunces text-2xl font-medium text-ink">
              {t("landing.teamPanelTitle", locale)}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-2">
              <p className="font-fraunces text-xl font-medium italic text-[var(--color-layer-team-accent)]">
                {t("landing.teamPatternName", locale)}
              </p>
              <span className="rounded-md bg-[var(--color-layer-team-soft)] px-2 py-0.5 text-micro font-semibold text-[var(--color-layer-team-accent)]">
                {t("landing.teamPanelPublished", locale)}
              </span>
            </div>
            <p className="mt-2 text-micro text-[var(--color-text-muted)]">
              {t("landing.teamPanelValidated", locale)}
            </p>
          </div>
          <div className="flex gap-1.5">
            <span className="rounded-full bg-surface-card px-2 py-1 text-micro text-[var(--color-text-muted)]">
              5 {locale === "hu" ? "tag" : "members"}
            </span>
            <span className="rounded-full bg-surface-card px-2 py-1 text-micro text-[var(--color-text-muted)]">
              100%
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 sm:p-5">
        <p className="mb-3 text-micro font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
          {t("landing.teamDualViewEyebrow", locale)}
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3.5">
            <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-layer-team-accent)]">
              {t("landing.teamPrinciplesTitle", locale)}
            </p>
            <div className="mt-4 space-y-3">
              {teamPrinciples.map((principle) => (
                <div key={principle.key} className="grid grid-cols-[4.5rem_minmax(0,1fr)_1.5rem] items-center gap-2">
                  <span className="truncate text-micro text-ink-body">{t(principle.key, locale)}</span>
                  <div className="h-1.5 overflow-hidden rounded-full bg-sand">
                    <div className="h-full rounded-full" style={{ width: `${principle.value}%`, backgroundColor: principle.color }} />
                  </div>
                  <span className="text-right font-mono text-micro tabular-nums text-ink">{principle.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3.5">
            <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-layer-team-accent)]">
              {t("landing.teamRelationshipsTitle", locale)}
            </p>
            <svg className="mx-auto mt-1 h-[128px] w-full max-w-[180px]" viewBox="0 0 180 145" role="img" aria-labelledby="focused-team-network-title focused-team-network-description">
              <title id="focused-team-network-title">{t("landing.teamRelationshipsA11yTitle", locale)}</title>
              <desc id="focused-team-network-description">{t("landing.teamRelationshipsA11yDescription", locale)}</desc>
              <g fill="none" strokeLinecap="round">
                <path d="M49 37 90 66 132 37 49 37" stroke="var(--color-sage)" strokeWidth="4" />
                <path d="M49 37 32 112M132 37l16 75" stroke="var(--color-layer-team-accent)" strokeWidth="2.5" opacity=".5" />
                <path d="M90 66l58 46M32 112h116" stroke="var(--color-bronze)" strokeWidth="2" strokeDasharray="6 5" />
              </g>
              {[
                { x: 49, y: 37, label: "A", r: 16 },
                { x: 132, y: 37, label: "C", r: 16 },
                { x: 32, y: 112, label: "D", r: 15 },
                { x: 148, y: 112, label: "E", r: 15 },
              ].map((node) => (
                <g key={node.label}>
                  <circle cx={node.x} cy={node.y} r={node.r} fill="var(--color-surface-card)" stroke="var(--color-layer-team-accent)" strokeWidth="2" />
                  <text x={node.x} y={node.y} dominantBaseline="middle" textAnchor="middle" className="fill-[var(--color-text-primary)] text-micro font-semibold">{node.label}</text>
                </g>
              ))}
              <circle cx="90" cy="66" r="18" fill="var(--color-sage)" stroke="var(--color-surface-card)" strokeWidth="3" />
              <text x="90" y="66" dominantBaseline="middle" textAnchor="middle" className="fill-white text-micro font-bold">B</text>
            </svg>
          </div>
        </div>

        <p className="mt-3 text-micro text-[var(--color-text-muted)]">
          {t("landing.teamPrivacyNote", locale)}
        </p>

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <InsightCard
            icon={<span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-sage)]" />}
            label={t("landing.teamStrengthLabel", locale)}
            text={t("landing.teamStrengthText", locale)}
            tone="sage"
          />
          <InsightCard
            icon={<span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[var(--color-bronze)]" />}
            label={t("landing.teamWatchLabel", locale)}
            text={t("landing.teamWatchText", locale)}
            tone="bronze"
          />
        </div>

        <div className="mt-3 rounded-r-xl border-l-4 border-[var(--color-layer-team-accent)] bg-[var(--color-layer-team-soft)] p-4">
          <p className="text-micro font-bold uppercase tracking-wide text-[var(--color-layer-team-accent)]">
            {t("landing.teamNarrativeLabel", locale)}
          </p>
          <p className="mt-1 text-note leading-relaxed text-ink-body">
            {t("landing.teamNarrativeText", locale)}
          </p>
        </div>
      </div>
    </div>
  );
}

function TeamPathway() {
  const { locale } = useLocale();

  return (
    <section className="px-6 pb-12 sm:px-8 sm:pb-16 lg:px-10 lg:pb-20">
      <div className="relative mx-auto grid max-w-[1180px] overflow-hidden rounded-[30px] bg-gradient-to-br from-[var(--color-layer-team-hero-from)] via-[var(--color-layer-team-hero-mid)] to-[var(--color-layer-team-hero-to)] p-7 text-[var(--color-text-on-inverse)] sm:p-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:gap-14 lg:p-12">
        <svg aria-hidden viewBox="0 0 600 180" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-32 w-full opacity-20">
          <path d="M-20 105C90 35 150 160 265 88S460 30 625 100" fill="none" stroke="var(--color-layer-team-glow)" />
          <path d="M-20 125C85 55 160 180 280 108S475 50 625 120" fill="none" stroke="var(--color-layer-team-glow)" />
        </svg>
        <div className="relative z-10">
          <span className="inline-flex rounded-md bg-white/12 px-3 py-1.5 text-micro font-semibold uppercase tracking-wide text-white/80">
            {t("landing.focusedTeamEyebrow", locale)}
          </span>
          <h2 className="mt-5 max-w-[12ch] font-fraunces text-4xl font-medium tracking-tight text-white sm:text-5xl">
            {t("landing.focusedTeamTitle", locale)}
          </h2>
          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/75">
            {t("landing.focusedTeamSub", locale)}
          </p>
          <Link
            href="/team-dynamics"
            onClick={() => track("cta.click", { cta_id: "team_pathway", surface: "landing", mode: "team" })}
            className="mt-7 inline-flex min-h-[52px] items-center justify-center rounded-xl bg-[var(--color-accent-primary-soft)] px-6 text-sm font-semibold text-[var(--color-layer-team-hero-from)] shadow-md transition-all hover:-translate-y-px hover:brightness-105 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-layer-team-hero-from)]"
          >
            {t("landing.focusedTeamCta", locale)}
            <ChevronRightIcon className="ml-2 h-4 w-4" />
          </Link>
        </div>
        <div className="relative z-10 mx-auto mt-9 w-full max-w-[560px] lg:mt-0">
          <TeamReportPreview />
        </div>
      </div>
    </section>
  );
}

function TrustStrip() {
  const { locale } = useLocale();
  const items = [
    { Icon: FlaskIcon, label: t("landing.focusedTrustScience", locale) },
    { Icon: ChatIcon, label: t("landing.focusedTrustClear", locale) },
    { Icon: ClockIcon, label: t("landing.focusedTrustPace", locale) },
  ];

  return (
    <section className="px-6 pb-16 sm:px-8 sm:pb-20 lg:px-10 lg:pb-24">
      <div className="mx-auto grid max-w-[920px] gap-4 rounded-[24px] border border-[var(--color-border-soft)] bg-surface-card px-6 py-5 sm:grid-cols-3 sm:gap-0">
        {items.map(({ Icon, label }, index) => (
          <div
            key={label}
            className={`flex items-center justify-center gap-3 py-2 text-sm font-medium text-ink-body ${index > 0 ? "sm:border-l sm:border-[var(--color-border-soft)]" : ""}`}
          >
            <Icon className="h-5 w-5 text-[var(--color-bronze-dark)]" />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}

export function FocusedLandingContent() {
  return (
    <>
      <FocusedHero />
      <div
        data-focused-brand-mark
        className="relative z-20 -my-7 sm:-my-8"
      >
        <SectionTransition
          artKey={artKeyFrom("landing", "focused-hero-steps", "self")}
        />
      </div>
      <FocusedSteps />
      <TeamPathway />
      <TrustStrip />
    </>
  );
}
