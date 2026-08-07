"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { ModeSwitcher, type SiteMode } from "@/components/landing/ModeSwitcher";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { getDimensionTier, getDimensionLabel, tierColors } from "@/lib/dimension-utils";
import { ClockIcon, FlaskIcon, BoltIcon, GiftIcon } from "@/components/landing/icons";
import { track } from "@/lib/analytics/client";

// A hajtás feletti beúszás CSS-keyframe (`.animate-rise-in`, globals.css):
// ugyanaz a 0.5s / y:20px / cubic-bezier(0.16,1,0.3,1) mozgás, mint a korábbi
// framer-motion `fadeUp`, de már az ELSŐ festéskor fut — nem a hidratálás
// után. A hero szövegoszlopa (benne az LCP-elem H1) ezért 0 késleltetést kap;
// a stagger csak a H1 ALATTI blokkban marad, ahol nem az LCP-t késlelteti.
const riseIn = "animate-rise-in";

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
      <div className="relative bg-gradient-to-br from-[var(--color-layer-self-hero-from)] via-[var(--color-layer-self-hero-mid)] to-[var(--color-layer-self-hero-to)] px-6 pb-6 pt-6">
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
      <div className="bg-surface-card px-5 pt-5 md:flex-1">
        <div className="overflow-hidden rounded-xl border border-[var(--color-border-soft)]">
          <div className="grid grid-cols-3">
            {dims.map((dim, i) => {
              const colors = tierColors[getDimensionTier(dim.value)];
              return (
                <div
                  key={dim.name}
                  className={`min-w-0 px-1 py-3.5 text-center md:px-2 ${i % 3 < 2 ? "border-r border-[var(--color-border-soft)]" : ""} ${i < 3 ? "border-b border-[var(--color-border-soft)]" : ""}`}
                >
                  <p className="mb-1 truncate text-micro text-[var(--color-text-muted)]">{dim.name}</p>
                  <p className={`mb-1 font-fraunces text-[20px] leading-none ${colors.text}`}>{dim.value}</p>
                  <span className={`inline-block max-w-full truncate rounded px-1 py-[2px] text-micro font-semibold md:px-1.5 ${colors.tagBg} ${colors.tagText}`}>
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
      <div className="rounded-2xl border border-sand bg-surface-card p-5 shadow-lg shadow-black/[0.06] md:p-6">
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
            <span className="rounded-full bg-state-success-bg px-2.5 py-1 text-micro font-semibold text-state-success-fg">
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
            <div key={d.name} className="flex items-center gap-2 md:gap-3">
              <span className="w-[92px] shrink-0 truncate text-[11px] text-ink-body md:w-[118px]">{d.name}</span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-sand">
                <div className="h-full rounded-full bg-sage" style={{ width: `${d.mean}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right font-mono text-[11px] tabular-nums text-ink md:w-14">
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
  // Kontraszt (a11y): az alap bronz krém háttéren 3.0:1 — nagy szövegnek épp
  // a határon, 11px-es feliratnak bukó. Szöveghez ezért a bronz-skála
  // sötétebb fokait használjuk (a zsálya team-módban 5.5:1, marad):
  //   eyebrow (11px)  → accent-primary-strong (bronze-700) — 5.5:1
  //   H1 em (nagy)    → accent-primary-mid                 — 3.9:1
  const eyebrowColor = isSelf ? "var(--color-accent-primary-strong)" : accentColor;
  const headlineAccentColor = isSelf ? "var(--color-accent-primary-mid)" : accentColor;
  // Tömör CTA-felület fehér szöveggel: bronze-dark (4.89:1) — ugyanaz a fok,
  // amire a NavBar sticky CTA-ja és a CtaSection gombja is beállt. A sticky
  // fejléc miatt a nav-CTA és a hero-CTA EGYSZERRE látszik: két különböző
  // bronz ugyanarra a gombszerepre elszíneződésnek olvasódna.
  const ctaBackground = isSelf ? "var(--color-bronze-dark)" : accentColor;

  // Detect existing localStorage draft for guest users.
  // Must run in useEffect to avoid hydration mismatch (localStorage is client-only).
  const [hasDraft, setHasDraft] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage csak kliensen olvasható, hydration-biztos minta
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("TRITAN")); }, []);

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1120px] px-7 pb-6 pt-12">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-10">

          {/* 1. Switcher + Eyebrow + Headline — 0 késleltetés: itt van az
              LCP-elem (H1), ezért semmi nem várhat rá JS-re. */}
          <div className="order-1 flex flex-col">
            <div className={`${riseIn} mb-4 lg:mb-5`}>
              <ModeSwitcher />
            </div>

            <div className={`${riseIn} mb-4 flex items-center gap-3`}>
              {/* A vonalka és a felirat EGY tipográfiai egység — ugyanabból a
                  bronz-fokból kell jönniük, különben a sötétebb szöveg mellett
                  a világosabb vonal elszíneződésnek látszik. */}
              <div className="h-[1.5px] w-5 shrink-0" style={{ background: eyebrowColor }} />
              <span
                className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest"
                style={{ color: eyebrowColor }}
              >
                {isSelf ? t("landing.selfEyebrow", locale) : t("landing.teamEyebrow", locale)}
              </span>
            </div>

            <h1 className={`${riseIn} font-fraunces text-fluid-display font-medium tracking-tight text-ink`}>
              {isSelf ? t("landing.selfHeadlineBefore", locale) : t("landing.teamHeadlineBefore", locale)}
              <em className="italic" style={{ color: headlineAccentColor }}>
                {isSelf ? t("landing.selfHeadlineEm", locale) : t("landing.teamHeadlineEm", locale)}
              </em>
            </h1>
          </div>

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

          {/* 3. Sub + CTA + Microcopy — a H1 alatt, itt megmarad a 0.1s-os
              lépcsőzés (nem az LCP-elem, nem késleltet festést). */}
          <div className="order-3 flex flex-col md:col-start-1 md:row-start-2">
            <p className={`${riseIn} mb-7 text-[16px] font-light leading-relaxed text-ink-body`}>
              {isSelf ? t("landing.selfSub", locale) : t("landing.teamSub", locale)}
            </p>

            <div className={`${riseIn} mb-4`} style={{ animationDelay: "0.1s" }}>
              <Link
                href={isSelf ? "/try" : "/contact"}
                // P2: a hero elsődleges CTA-ja módonként külön mérve — ebből
                // derül ki, melyik ígéret működik.
                onClick={() =>
                  track("cta.click", {
                    cta_id: "hero_primary",
                    surface: "landing",
                    mode: isSelf ? "self" : "team",
                  })
                }
                className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-xl px-8 py-4 text-base font-bold text-white shadow-md transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:brightness-[1.06] sm:w-auto"
                style={{
                  background: ctaBackground,
                  boxShadow: `0 4px 14px ${isSelf ? "rgba(154,101,56,0.25)" : "rgba(61,107,94,0.25)"}`,
                }}
              >
                {isSelf
                  ? (hasDraft ? t("landing.selfCtaContinue", locale) : t("landing.selfCta", locale))
                  : t("landing.teamCta", locale)}
              </Link>
            </div>

            {isSelf ? (
              <div className={`${riseIn} flex flex-wrap items-center gap-2`} style={{ animationDelay: "0.2s" }}>
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
              </div>
            ) : (
              <p className={`${riseIn} text-center text-caption text-[var(--color-text-muted)] sm:text-left`} style={{ animationDelay: "0.2s" }}>
                {t("landing.teamMicrocopy", locale)}
              </p>
            )}
          </div>

        </div>
      </div>
    </section>
  );
}
