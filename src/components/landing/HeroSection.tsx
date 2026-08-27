"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { ModeSwitcher, type SiteMode } from "@/components/landing/ModeSwitcher";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { getDimensionLabel } from "@/lib/dimension-utils";
import { dimColorsCss } from "@/lib/color-system";
import { ClockIcon, FlaskIcon, BoltIcon, GiftIcon, CheckIcon } from "@/components/landing/icons";
import { track } from "@/lib/analytics/client";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

// A hajtás feletti kísérőelemek CSS-keyframe-mel úsznak be. A H1 szándékosan
// NEM kapja meg: ez az oldal LCP-eleme, és az opacity: 0 kezdőállapot még
// nulla animation-delay mellett is későbbre tolja, mikor tekinti a böngésző
// teljesen kirajzoltnak. A mozgás a kapcsolón, eyebrow-n és a H1 alatti
// blokkokon marad meg, így a hero karaktere nem változik.
const riseIn = "animate-rise-in";

// ─── Self panel — a valódi eredménynézet kicsinyített mása ──────────────────

function SelfPanel() {
  const { locale } = useLocale();

  // A kanonikus archetípus-prototípus (interaction-engine.ts) A-domináns,
  // H-másodlagos változata: 86 / 74 / 50. A landing a domináns dimenzió
  // közös főnévi címkéjét mutatja (Hídépítő), a teljes riport a mérési
  // bizonytalanság alapján egészíti ki melléknévi színezettel.
  const dims = [
    { code: "H", name: t("landing.selfDim1", locale), value: 74 },
    { code: "E", name: t("landing.selfDim2", locale), value: 50 },
    { code: "X", name: t("landing.selfDim3", locale), value: 50 },
    { code: "A", name: t("landing.selfDim4", locale), value: 86 },
    { code: "C", name: t("landing.selfDim5", locale), value: 50 },
    { code: "O", name: t("landing.selfDim6", locale), value: 50 },
  ];

  const strengths = [t("landing.selfDim4", locale), t("landing.selfDim1", locale)];

  return (
    <div className="overflow-hidden rounded-2xl shadow-lg shadow-black/[0.08] md:flex md:min-h-[590px] md:flex-col">
      {/* ═══ SÖTÉT HERO FEJLÉC ═══ */}
      <div className="relative bg-gradient-to-br from-[var(--color-layer-self-hero-from)] via-[var(--color-layer-self-hero-mid)] to-[var(--color-layer-self-hero-to)] px-6 pb-6 pt-6">
        <p className="text-micro uppercase tracking-widest text-white/70">
          {t("landing.selfPanelEyebrow", locale)}
        </p>
        <p className="mt-1.5 font-fraunces text-body text-white/80">
          {t("landing.selfPanelName", locale)}
        </p>
        <div className="mt-0.5 flex items-center gap-2.5">
          <p className="font-fraunces text-heading font-medium italic text-[var(--color-accent-primary-soft)]">
            {t("landing.selfPanelType", locale)}
          </p>
          {/* Valós riport-állítás: elsődleges csapatszerep-hajlam chip —
              az ál-percentilis („Top 25%") badge kivezetve (B17). */}
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-micro font-medium text-white/85">
            {t("landing.selfPanelRole", locale)}
          </span>
        </div>
        <p className="mt-2 max-w-[360px] text-note leading-[1.55] text-white/75">
          {t("landing.selfPanelInsight", locale)}
        </p>
      </div>

      {/* ═══ DIMENZIÓ-SÁV ═══ */}
      <div className="bg-surface-card px-5 pt-5 md:flex-1">
        <div className="overflow-hidden rounded-xl border border-[var(--color-border-soft)]">
          <div className="grid grid-cols-3">
            {dims.map((dim, i) => {
              const colors = dimColorsCss(dim.code);
              return (
                <div
                  key={dim.name}
                  className={`min-w-0 px-1 py-3.5 text-center md:px-2 ${i % 3 < 2 ? "border-r border-[var(--color-border-soft)]" : ""} ${i < 3 ? "border-b border-[var(--color-border-soft)]" : ""}`}
                >
                  <p className="mb-1 truncate text-micro text-[var(--color-text-muted)]">{dim.name}</p>
                  <p
                    className="mb-1 font-fraunces text-heading leading-none"
                    style={{ color: colors.strong }}
                  >
                    {dim.value}
                  </p>
                  <span
                    className="inline-block max-w-full truncate rounded px-1 py-[2px] text-micro font-semibold md:px-1.5"
                    style={{ backgroundColor: colors.soft, color: colors.strong }}
                  >
                    {getDimensionLabel(dim.value, locale)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* A prototípushoz ténylegesen rendelt két erősség. A négy 50-es
            dimenzió semleges, ezért nem gyártunk melléjük „figyelendő” címkét. */}
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
            {t("landing.selfStrLabel", locale)}:
          </span>
          {strengths.map((d) => (
            <span key={d} className="rounded bg-[var(--color-surface-self-accent-soft)] px-2 py-0.5 text-micro font-medium text-[var(--color-accent-self-deep)]">
              {d}
            </span>
          ))}
        </div>

        {/* Szerepkör-illeszkedés — a valódi RoleFitSection "erős" sora */}
        <div className="mb-1 mt-4">
          <p className="mb-2 text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("landing.selfRoleFitEyebrow", locale)}
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
      <div className="flex h-11 items-center justify-center rounded-b-2xl bg-gradient-to-b from-[var(--color-surface-card)] to-[var(--color-surface-subtle)]">
        <span className="text-note font-medium text-[var(--color-action-primary-bg)]">
          {t("landing.selfFadeCta", locale)}
        </span>
      </div>
    </div>
  );
}

// ─── Team panel — a valódi publikált riport kicsinyített mása ───────────────

function TeamPanel() {
  const { locale } = useLocale();

  // A showcase seed ötfős Értékesítés csapatának tényleges aggregátumai
  // (scripts/seed-showcase-org.ts). A négy érték ugyanaz a mintázatmotor-
  // bemenet, amely ECFP-re, vagyis „Családi Vállalkozásra” értékelődik.
  const dims = [
    { name: t("landing.teamAxisDrive", locale), mean: 81 },
    { name: t("landing.teamAxisCohesion", locale), mean: 64 },
    { name: t("landing.teamAxisDiscipline", locale), mean: 55 },
    { name: t("landing.teamAxisOpenness", locale), mean: 56 },
  ];

  return (
    <div className="overflow-hidden rounded-2xl shadow-lg shadow-black/[0.08] md:flex md:min-h-[590px] md:flex-col">
      {/* A valódi team hero szilva-gradiensét használó közös riportfejléc. */}
      <div className="bg-gradient-to-br from-[var(--color-layer-team-hero-from)] via-[var(--color-layer-team-hero-mid)] to-[var(--color-layer-team-hero-to)] px-6 pb-6 pt-6 text-[var(--color-text-on-inverse)]">
        <p className="text-micro uppercase tracking-widest text-white/70">
          {t("landing.teamPanelEyebrow", locale)}
        </p>
        <p className="mt-2 font-fraunces text-heading font-medium text-white">
          {t("landing.teamPanelTitle", locale)}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2.5">
          <p className="font-fraunces text-heading font-medium italic text-[var(--color-layer-team-glow)]">
            {t("landing.teamPatternName", locale)}
          </p>
          <span className="rounded-md bg-white/15 px-2 py-0.5 text-micro font-medium text-white/85">
            {t("landing.teamPanelPublished", locale)}
          </span>
        </div>
        <p className="mt-2 text-note leading-[1.55] text-white/75">
          {t("landing.teamPanelValidated", locale)}
        </p>
      </div>

      <div className="bg-surface-card px-5 pb-5 pt-5 md:flex-1">
        {/* Ugyanaz a keretezett adatblokk-anatómia, mint a self mintakártyán. */}
        <div className="grid grid-cols-3 overflow-hidden rounded-xl border border-[var(--color-border-soft)]">
          <div className="min-w-0 border-r border-[var(--color-border-soft)] px-2 py-3.5">
            <p className="truncate font-mono text-micro uppercase tracking-widest text-muted">
              {t("landing.teamStatMembersLabel", locale)}
            </p>
            <p className="mt-1 font-fraunces text-heading leading-none text-ink">5</p>
          </div>
          <div className="min-w-0 border-r border-[var(--color-border-soft)] px-2 py-3.5">
            <p className="truncate font-mono text-micro uppercase tracking-widest text-muted">
              {t("landing.teamStatCompletionLabel", locale)}
            </p>
            <p className="mt-1 font-fraunces text-heading leading-none text-ink">100%</p>
          </div>
          <div className="min-w-0 px-2 py-3.5">
            <p className="truncate font-mono text-micro uppercase tracking-widest text-muted">
              {t("landing.teamPatternLabel", locale)}
            </p>
            <p className="mt-1 font-fraunces text-caption leading-tight text-ink">
              {t("landing.teamPatternName", locale)}
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          {dims.map((d) => (
            <div key={d.name} className="flex items-center gap-2 md:gap-3">
              <span className="w-[92px] shrink-0 truncate text-note text-ink-body md:w-[118px]">{d.name}</span>
              <div className="h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-sand">
                <div
                  className="h-full rounded-full bg-[var(--color-layer-team-accent)]"
                  style={{ width: `${d.mean}%` }}
                />
              </div>
              <span className="w-8 shrink-0 text-right font-mono text-note tabular-nums text-ink">
                {d.mean}
              </span>
            </div>
          ))}
          <p className="mt-0.5 text-micro text-muted">{t("landing.teamPrivacyNote", locale)}</p>
        </div>

        <div
          className="mt-4 rounded-r-[14px] p-3.5 px-4"
          style={{
            borderLeft: "4px solid var(--color-layer-team-accent)",
            background: "color-mix(in srgb, var(--color-layer-team-accent) 10%, var(--color-surface-card))",
          }}
        >
          <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-layer-team-accent)]">
            {t("landing.teamNarrativeLabel", locale)}
          </p>
          <p className="text-note leading-relaxed text-ink-body">
            {t("landing.teamNarrativeText", locale)}
          </p>
        </div>
      </div>

      <div className="flex h-11 items-center justify-center rounded-b-2xl bg-gradient-to-b from-[var(--color-surface-card)] to-[var(--color-surface-subtle)]">
        <span className="text-note font-medium text-[var(--color-layer-team-accent)]">
          {t("landing.teamFadeCta", locale)}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function HeroSection({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const isSelf = mode === "self";
  const accentColor = isSelf ? "var(--color-accent-primary)" : "var(--color-layer-team-accent)";
  // Kontraszt (a11y): az alap bronz krém háttéren 3.0:1 — nagy szövegnek épp
  // a határon, 11px-es feliratnak bukó. Szöveghez ezért a bronz-skála
  // sötétebb fokait használjuk; team módban a kanonikus réteg-akcent dolgozik:
  //   eyebrow (11px)  → accent-primary-strong (bronze-700) — 5.5:1
  //   H1 em (nagy)    → accent-primary-mid                 — 3.9:1
  const eyebrowColor = isSelf ? "var(--color-accent-primary-strong)" : accentColor;
  const headlineAccentColor = isSelf ? "var(--color-accent-primary-mid)" : accentColor;
  // Tömör CTA-felület fehér szöveggel: self módban bronze-dark, team módban
  // a valódi team hero első gradiens-stopja. Így a CTA a megfelelő réteghez
  // tartozik, de mindkét módban megtartja ugyanazt a gomb-anatómiát.
  const ctaBackground = isSelf ? "var(--color-bronze-dark)" : "var(--color-layer-team-hero-from)";

  // Detect existing localStorage draft for guest users.
  // Must run in useEffect to avoid hydration mismatch (localStorage is client-only).
  const [hasDraft, setHasDraft] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- localStorage csak kliensen olvasható, hydration-biztos minta
  useEffect(() => { setHasDraft(hasAssessmentDraftInStorage("TRITAN")); }, []);

  return (
    <section className="bg-cream">
      <div className="mx-auto max-w-[1120px] px-7 pb-6 pt-12">
        <div className="flex flex-col gap-6 md:grid md:grid-cols-2 md:items-start md:gap-10">

          {/* 1. Switcher + Eyebrow + Headline. A H1 az LCP-elem, ezért statikus
              és az első festéskor teljesen látható; csak a kísérőelemek
              animálnak. */}
          <div className="order-1 flex flex-col">
            <div className={`${riseIn} mb-4 lg:mb-5`}>
              <ModeSwitcher mode={mode} />
            </div>

            <div className={`${riseIn} mb-4 flex items-center gap-3`}>
              {/* A vonalka és a felirat EGY tipográfiai egység — ugyanabból a
                  bronz-fokból kell jönniük, különben a sötétebb szöveg mellett
                  a világosabb vonal elszíneződésnek látszik. */}
              <div className="h-[1.5px] w-5 shrink-0" style={{ background: eyebrowColor }} />
              <span
                className="font-dm-sans text-label uppercase"
                style={{ color: eyebrowColor }}
              >
                {isSelf ? t("landing.selfEyebrow", locale) : t("landing.teamEyebrow", locale)}
              </span>
            </div>

            <h1 className="font-fraunces text-fluid-display font-medium tracking-tight text-ink">
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
            <div className="order-2 md:col-start-2 md:row-span-2 md:row-start-1 md:mt-8 md:self-stretch">
              <div className="mx-auto w-full max-w-[460px] md:flex md:h-full md:flex-col">
                <TeamPanel />
              </div>
            </div>
          )}

          {/* 3. Sub + CTA + Microcopy — a H1 alatt, itt megmarad a 0.1s-os
              lépcsőzés (nem az LCP-elem, nem késleltet festést). */}
          <div className="order-3 flex flex-col md:col-start-1 md:row-start-2">
            <p className={`${riseIn} mb-7 text-base font-light leading-relaxed text-ink-body`}>
              {isSelf ? t("landing.selfSub", locale) : t("landing.teamSub", locale)}
            </p>

            <div
              className={`${riseIn} mb-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center`}
              style={{ animationDelay: "0.1s" }}
            >
              <Link
                href={isSelf ? "/try" : "/pilot"}
                // P2: a hero elsődleges CTA-ja módonként külön mérve — ebből
                // derül ki, melyik ígéret működik.
                onClick={() =>
                  track("cta.click", {
                    cta_id: "hero_primary",
                    surface: "landing",
                    mode: isSelf ? "self" : "team",
                  })
                }
                className={`inline-flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl px-7 py-3 text-base font-bold text-white shadow-md transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:brightness-[1.06] sm:w-auto sm:min-w-[280px] ${FOCUS_RING_CLASS}`}
                style={{
                  background: ctaBackground,
                  boxShadow: isSelf
                    ? "0 4px 14px rgba(154,101,56,0.25)"
                    : "0 4px 14px color-mix(in srgb, var(--color-layer-team-hero-from) 28%, transparent)",
                }}
              >
                <span>
                  {isSelf
                    ? (hasDraft ? t("landing.selfCtaContinue", locale) : t("landing.selfCta", locale))
                    : t("landing.teamCta", locale)}
                </span>
              </Link>
              {!isSelf ? (
                <Link
                  href="/contact"
                  onClick={() =>
                    track("cta.click", {
                      cta_id: "hero_secondary",
                      surface: "landing",
                      mode: "team",
                    })
                  }
                  className={`inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[var(--color-action-secondary-fg)] transition-colors hover:text-[var(--color-layer-team-accent)] ${FOCUS_RING_CLASS}`}
                >
                  {t("landing.teamSecondaryCta", locale)}
                </Link>
              ) : null}
            </div>

            {isSelf ? (
              <div className={`${riseIn} flex flex-wrap items-center gap-2`} style={{ animationDelay: "0.2s" }}>
                {[
                  { Icon: ClockIcon, text: t("landing.selfMetaTime", locale) },
                  { Icon: FlaskIcon, text: t("landing.selfMetaMethod", locale) },
                  { Icon: BoltIcon, text: t("landing.selfMetaInstant", locale) },
                  { Icon: GiftIcon, text: t("landing.selfMetaFree", locale) },
                ].map((m) => (
                  <span key={m.text} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-card)]/60 px-3 py-1.5 text-note text-[var(--color-text-secondary)]">
                    <m.Icon className="h-3 w-3 shrink-0 text-[var(--color-accent-primary)]" />
                    {m.text}
                  </span>
                ))}
              </div>
            ) : (
              <div className={`${riseIn} flex flex-wrap items-center gap-2`} style={{ animationDelay: "0.2s" }}>
                <div className="flex flex-wrap items-center gap-2">
                  {[
                    { Icon: CheckIcon, text: t("landing.teamMetaOnboarding", locale) },
                    { Icon: ClockIcon, text: t("landing.teamMetaTiming", locale) },
                    { Icon: GiftIcon, text: t("landing.teamMetaOffer", locale) },
                  ].map((m) => (
                    <span key={m.text} className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-card)]/60 px-3 py-1.5 text-note text-[var(--color-text-secondary)]">
                      <m.Icon className="h-3 w-3 shrink-0 text-[var(--color-layer-team-accent)]" />
                      {m.text}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </section>
  );
}
