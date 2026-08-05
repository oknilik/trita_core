"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { ModeSwitcher, type SiteMode } from "@/components/landing/ModeSwitcher";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { getDimensionTier, getDimensionLabel, tierColors } from "@/lib/dimension-utils";
import { ClockIcon, FlaskIcon, BoltIcon, GiftIcon } from "@/components/landing/icons";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as const } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } },
};

// ─── Self panel — a valódi eredménynézet kicsinyített mása ──────────────────

function SelfPanel() {
  const { locale } = useLocale();

  // A ProfileHero + DimensionStrip redukált változata, az élő tier-tokenekkel.
  // H E X A C O sorrend, mint a valódi riportban.
  const dims = [
    { name: t("landing.selfDim1", locale), value: 58 },
    { name: t("landing.selfDim2", locale), value: 46 },
    { name: t("landing.selfDim3", locale), value: 72 },
    { name: t("landing.selfDim4", locale), value: 34 },
    { name: t("landing.selfDim5", locale), value: 61 },
    { name: t("landing.selfDim6", locale), value: 79 },
  ];

  const strengths = [t("landing.selfDim6", locale), t("landing.selfDim3", locale)];
  const watch = [t("landing.selfDim4", locale)];

  return (
    <div className="overflow-hidden rounded-2xl shadow-lg shadow-black/[0.08] md:flex md:h-full md:flex-col">
      {/* ═══ SÖTÉT HERO FEJLÉC ═══ */}
      <div className="relative bg-gradient-to-br from-[var(--color-accent-self-strong)] via-[var(--color-accent-self-deep)] to-[var(--color-accent-self-deeper)] px-6 pb-6 pt-6">
        <div className="flex items-center justify-between gap-2">
          <p className="text-micro uppercase tracking-widest text-white/70">
            {t("landing.selfPanelEyebrow", locale)}
          </p>
          {/* Minta-jelölés — a kártya illusztráció, ne tűnjön valós adatnak */}
          <span className="rounded border border-white/25 px-1.5 py-[2px] text-micro uppercase tracking-wide text-white/70">
            {t("landing.sampleBadge", locale)}
          </span>
        </div>
        <p className="mt-1.5 font-fraunces text-body text-white/80">
          {t("landing.selfPanelName", locale)}
        </p>
        <div className="mt-0.5 flex items-center gap-2.5">
          <p className="font-fraunces text-[22px] font-medium italic text-[var(--color-accent-primary-soft)]">
            {t("landing.selfPanelType", locale)}
          </p>
          {/* Valós riport-állítás: elsődleges csapatszerep-hajlam chip —
              az ál-percentilis („Top 25%") badge kivezetve (B17). */}
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-micro font-medium text-white/85">
            {t("landing.selfPanelRole", locale)}
          </span>
        </div>
        <p className="mt-2 max-w-[360px] text-[11px] leading-[1.55] text-white/75">
          {t("landing.selfPanelInsight", locale)}
        </p>
      </div>

      {/* ═══ DIMENZIÓ-SÁV ═══ */}
      <div className="bg-white px-5 pt-5 md:flex-1">
        <div className="overflow-hidden rounded-xl border border-[var(--color-border-soft)]">
          <div className="grid grid-cols-3">
            {dims.map((dim, i) => {
              const colors = tierColors[getDimensionTier(dim.value)];
              return (
                <div
                  key={dim.name}
                  className={`px-2 py-3.5 text-center ${i % 3 < 2 ? "border-r border-[var(--color-border-soft)]" : ""} ${i < 3 ? "border-b border-[var(--color-border-soft)]" : ""}`}
                >
                  <p className="mb-1 truncate text-micro text-[var(--color-text-muted)]">{dim.name}</p>
                  <p className={`mb-1 font-fraunces text-[20px] leading-none ${colors.text}`}>{dim.value}</p>
                  <span className={`inline-block rounded px-1.5 py-[2px] text-micro font-semibold ${colors.tagBg} ${colors.tagText}`}>
                    {getDimensionLabel(dim.value, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Erősség / figyelendő chipek */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
            {t("landing.selfStrLabel", locale)}:
          </span>
          {strengths.map((d) => (
            <span key={d} className="rounded bg-[var(--color-surface-self-accent-soft)] px-2 py-0.5 text-micro font-medium text-[var(--color-accent-self-deep)]">
              {d}
            </span>
          ))}
          <span className="ml-1 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
            {t("landing.selfWatchLabel", locale)}:
          </span>
          {watch.map((d) => (
            <span key={d} className="rounded bg-[var(--color-surface-highlight-warm)] px-2 py-0.5 text-micro font-medium text-[var(--color-accent-primary-strong)]">
              {d}
            </span>
          ))}
        </div>

        {/* Szerepkör-illeszkedés — a valódi RoleFitSection "erős" sora */}
        <div className="mb-1 mt-4">
          <p className="mb-2 text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("results.roleFitEyebrow", locale)}
          </p>
          <div
            className="rounded-r-[14px] bg-[var(--color-surface-self-accent-soft)] p-3.5 px-4"
            style={{ borderLeft: "4px solid var(--color-action-primary-bg)" }}
          >
            <p className="mb-2 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-self-deep)]">
              {t("content.roleFitStrong", locale)}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {[t("landing.selfRole1", locale), t("landing.selfRole2", locale), t("landing.selfRole3", locale)].map((role) => (
                <span
                  key={role}
                  className="rounded-full bg-[var(--color-action-primary-bg)]/[0.15] px-2.5 py-1 text-micro text-[var(--color-action-primary-bg)]"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══ FADE-OUT CTA ═══ */}
      <div className="flex h-11 items-center justify-center rounded-b-2xl bg-gradient-to-b from-white to-[var(--color-surface-subtle)]">
        <span className="text-[11px] font-medium text-[var(--color-action-primary-bg)]">
          {t("landing.selfFadeCta", locale)}
        </span>
      </div>
    </div>
  );
}

// ─── Team panel — a valódi publikált riport kicsinyített mása ───────────────

function TeamPanel() {
  const { locale } = useLocale();

  // A TeamReportView redukált változata: aggregált értékek ± szórással,
  // egyéni adatok nélkül — a vezető a termékben is ezt a nézetet kapja.
  const dims = [
    { name: t("landing.teamDim1", locale), mean: 78, spread: 9 },
    { name: t("landing.teamDim2", locale), mean: 38, spread: 18 },
    { name: t("landing.teamDim3", locale), mean: 55, spread: 12 },
  ];

  return (
    <>
      {/* Publikált riport kártya */}
      <div className="rounded-2xl border border-sand bg-white p-5 shadow-lg shadow-black/[0.06] md:p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <SectionEyebrow>
              {t("landing.teamPanelEyebrow", locale)}
            </SectionEyebrow>
            <p className="mt-1 font-fraunces text-xl text-ink">{t("landing.teamPanelTitle", locale)}</p>
            <p className="mt-0.5 text-[11px] text-muted">{t("landing.teamPanelValidated", locale)}</p>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <span className="rounded border border-sand px-1.5 py-[2px] text-micro uppercase tracking-wide text-muted">
              {t("landing.sampleBadge", locale)}
            </span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-micro font-semibold text-emerald-700">
              {t("landing.teamPanelPublished", locale)}
            </span>
          </div>
        </div>

        {/* Aggregált statok */}
        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-sand pt-4">
          <div>
            <p className="font-mono text-micro uppercase tracking-widest text-muted">
              {t("landing.teamStatMembersLabel", locale)}
            </p>
            <p className="mt-0.5 font-fraunces text-xl text-ink">6</p>
          </div>
          <div>
            <p className="font-mono text-micro uppercase tracking-widest text-muted">
              {t("landing.teamStatCompletionLabel", locale)}
            </p>
            <p className="mt-0.5 font-fraunces text-xl text-ink">100%</p>
          </div>
          <div>
            <p className="font-mono text-micro uppercase tracking-widest text-muted">
              {t("landing.teamPatternLabel", locale)}
            </p>
            <p className="mt-0.5 font-fraunces text-body leading-tight text-ink">
              {t("landing.teamPatternName", locale)}
            </p>
          </div>
        </div>

        {/* Dimenzió-átlagok ± szórás */}
        <div className="mt-4 flex flex-col gap-2.5 border-t border-sand pt-4">
          {dims.map((d) => (
            <div key={d.name} className="flex items-center gap-3">
              <span className="w-[118px] shrink-0 truncate text-[11px] text-ink-body">{d.name}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-sand">
                <div className="h-full rounded-full bg-sage" style={{ width: `${d.mean}%` }} />
              </div>
              <span className="w-14 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink">
                {d.mean}
                <span className="text-muted"> ±{d.spread}</span>
              </span>
            </div>
          ))}
          <p className="mt-0.5 text-micro text-muted">{t("landing.teamPrivacyNote", locale)}</p>
        </div>

        {/* Tanácsadói narratíva */}
        <div className="mt-4 border-t border-sand pt-4">
          <p className="font-mono text-micro uppercase tracking-widest text-muted">
            {t("landing.teamNarrativeLabel", locale)}
          </p>
          <p className="mt-1.5 text-[12px] leading-relaxed text-ink-body">
            {t("landing.teamNarrativeText", locale)}
          </p>
        </div>
      </div>

      {/* Pilot kártya */}
      <Link
        href="/pilot"
        className="flex items-center justify-between gap-3 rounded-xl border border-bronze/20 bg-bronze/8 p-3.5 transition-colors hover:bg-bronze/15"
      >
        <div>
          <p className="font-dm-sans text-micro uppercase tracking-wide text-bronze">
            {t("landing.teamPilotLabel", locale)}
          </p>
          <p className="text-caption font-semibold text-ink">{t("landing.teamPilotTitle", locale)}</p>
          <p className="text-[11px] text-muted">{t("landing.teamPilotDesc", locale)}</p>
        </div>
        <span className="shrink-0 rounded-full bg-bronze px-3 py-1.5 text-micro font-semibold text-white">
          {t("landing.teamPilotCta", locale)}
        </span>
      </Link>
    </>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HeroSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";
  const accentColor = isSelf ? "var(--color-accent-primary)" : "var(--color-action-primary-bg)";

  // Detect existing localStorage draft for guest users.
  // Must run in useEffect to avoid hydration mismatch (localStorage is client-only).
  const [hasDraft, setHasDraft] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage csak kliensen olvasható, hydration-biztos minta
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("TRITAN")); }, []);

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1120px] px-7 pb-6 pt-12">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-10">

          {/* 1. Switcher + Eyebrow + Headline */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="order-1 flex flex-col"
          >
            <motion.div variants={fadeUp} className="mb-4 lg:mb-5">
              <ModeSwitcher />
            </motion.div>

            <motion.div variants={fadeUp} className="mb-4 flex items-center gap-3">
              <div className="h-[1.5px] w-5 shrink-0" style={{ background: accentColor }} />
              <span
                className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: accentColor }}
              >
                {isSelf ? t("landing.selfEyebrow", locale) : t("landing.teamEyebrow", locale)}
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="font-fraunces text-fluid-display font-medium tracking-tight text-ink"
            >
              {isSelf ? t("landing.selfHeadlineBefore", locale) : t("landing.teamHeadlineBefore", locale)}
              <em className="italic" style={{ color: accentColor }}>
                {isSelf ? t("landing.selfHeadlineEm", locale) : t("landing.teamHeadlineEm", locale)}
              </em>
            </motion.h1>
          </motion.div>

          {/* 2. Preview panel */}
          {isSelf ? (
            <div className="order-2 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-8 md:self-stretch">
              <div className="mx-auto w-full max-w-[460px] md:flex md:h-full md:flex-col">
                <SelfPanel />
              </div>
            </div>
          ) : (
            <div className="order-2 flex flex-col gap-4 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-8 md:self-stretch">
              <TeamPanel />
            </div>
          )}

          {/* 3. Sub + CTA + Microcopy */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="order-3 flex flex-col md:col-start-1 md:row-start-2"
          >
            <motion.p
              variants={fadeUp}
              className="mb-7 text-[16px] font-light leading-relaxed text-ink-body"
            >
              {isSelf ? t("landing.selfSub", locale) : t("landing.teamSub", locale)}
            </motion.p>

            <motion.div variants={fadeUp} className="mb-4">
              <Link
                href={isSelf ? "/try" : "/contact"}
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-md transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:brightness-[1.06] sm:w-auto"
                style={{
                  background: accentColor,
                  boxShadow: `0 4px 14px ${isSelf ? "rgba(193,127,74,0.25)" : "rgba(61,107,94,0.25)"}`,
                }}
              >
                {isSelf
                  ? (hasDraft ? t("landing.selfCtaContinue", locale) : t("landing.selfCta", locale))
                  : t("landing.teamCta", locale)}
              </Link>
            </motion.div>

            {isSelf ? (
              <motion.div variants={fadeUp} className="flex flex-wrap items-center gap-2">
                {[
                  { Icon: ClockIcon, text: t("landing.selfMetaTime", locale) },
                  { Icon: FlaskIcon, text: t("landing.selfMetaMethod", locale) },
                  { Icon: BoltIcon, text: t("landing.selfMetaInstant", locale) },
                  { Icon: GiftIcon, text: t("landing.selfMetaFree", locale) },
                ].map((m) => (
                  <span key={m.text} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-white/60 px-3 py-1.5 text-[11px] text-[var(--color-text-secondary)]">
                    <m.Icon className="h-3 w-3 shrink-0 text-[var(--color-accent-primary)]" />
                    {m.text}
                  </span>
                ))}
              </motion.div>
            ) : (
              <motion.p variants={fadeUp} className="text-center text-caption text-[var(--color-text-muted)] sm:text-left">
                {t("landing.teamMicrocopy", locale)}
              </motion.p>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  );
}
