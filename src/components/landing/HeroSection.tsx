"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { ModeSwitcher, type SiteMode } from "@/components/landing/ModeSwitcher";
import { hasAssessmentDraftInStorage } from "@/lib/assessment-draft";
import { getDimensionLabel } from "@/lib/dimension-utils";
import { dimColorsCss } from "@/lib/color-system";
import { TEAM_ROLES, type TeamRoleCode } from "@/lib/team-role-scoring";
import { ClockIcon, FlaskIcon, BoltIcon, GiftIcon, CheckIcon } from "@/components/landing/icons";
import { track } from "@/lib/analytics/client";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

// A hajtás feletti kísérőelemek CSS-keyframe-mel úsznak be. A H1 szándékosan
// NEM kapja meg: ez az oldal LCP-eleme, és az opacity: 0 kezdőállapot még
// nulla animation-delay mellett is későbbre tolja, mikor tekinti a böngésző
// teljesen kirajzoltnak. A mozgás a kapcsolón, eyebrow-n és a H1 alatti
// blokkokon marad meg, így a hero karaktere nem változik.
const riseIn = "animate-rise-in";

// ─── Self panel – a valódi eredménynézet kicsinyített mása ──────────────────

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

  const strengths = [
    { code: "A", name: t("landing.selfDim4", locale) },
    { code: "H", name: t("landing.selfDim1", locale) },
  ];
  // Ugyanezen profil kanonikus team-role-estimate rangsorának két legerősebb
  // eleme: CS 69, KO 68. Nem munkaterületeket nevezünk csapatszerepnek,
  // hanem a tényleges riport 9 szerepes modelljének becslését mutatjuk.
  const likelyRoles: TeamRoleCode[] = ["CS", "KO"];
  const roleRanks = [
    t("landing.selfTeamRoleRank1", locale),
    t("landing.selfTeamRoleRank2", locale),
  ];
  // A sávok a rangsor vizuális hierarchiáját mutatják, nem százalékos
  // pontszámok: a becslésnél a riport sem kommunikál álprecizitást.
  const roleRankVisuals = [
    { color: "var(--color-layer-team-accent)", width: "92%" },
    { color: "var(--color-sage)", width: "79%" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-card shadow-lg shadow-black/[0.08] md:flex md:h-[674px] md:flex-col">
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
          {/* Valós riport-állítás: elsődleges csapatszerep-hajlam chip –
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
      <div className="bg-surface-card px-5 pb-5 pt-6">
        <div className="overflow-hidden rounded-xl border border-[var(--color-border-soft)]">
          <div className="grid grid-cols-3">
            {dims.map((dim, i) => {
              const colors = dimColorsCss(dim.code);
              return (
                <div
                  key={dim.name}
                  className={`min-w-0 px-1 py-4 text-center md:px-2 ${i % 3 < 2 ? "border-r border-[var(--color-border-soft)]" : ""} ${i < 3 ? "border-b border-[var(--color-border-soft)]" : ""}`}
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
        <div className="mt-5 flex flex-wrap items-center gap-2">
          <span className="text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
            {t("landing.selfStrLabel", locale)}:
          </span>
          {strengths.map((dim) => {
            const colors = dimColorsCss(dim.code);
            return (
              <span
                key={dim.code}
                className="rounded px-2 py-0.5 text-micro font-medium"
                style={{ backgroundColor: colors.soft, color: colors.strong }}
              >
                {dim.name}
              </span>
            );
          })}
        </div>

        {/* A tényleges riport csapatszerep-modelljének két legerősebb becslése. */}
        <div className="mb-1 mt-5">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <p className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
              {t("landing.selfTeamRolesEyebrow", locale)}
            </p>
            <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-micro font-semibold text-[var(--color-text-muted)]">
              {t("landing.selfTeamRolesSource", locale)}
            </span>
          </div>
          <div className="overflow-hidden rounded-xl border border-[var(--color-border-soft)] bg-surface-card">
            {likelyRoles.map((role, index) => {
              const rankVisual = roleRankVisuals[index];
              return (
                <div
                  key={role}
                  className={`relative grid min-w-0 grid-cols-[1.75rem_minmax(0,1fr)] items-center gap-x-2.5 px-3 py-2.5 pl-3.5 sm:grid-cols-[1.75rem_minmax(7rem,0.8fr)_minmax(5rem,1fr)] ${index < likelyRoles.length - 1 ? "border-b border-[var(--color-border-soft)]" : ""} ${index === 0 ? "bg-[var(--color-surface-subtle)]/45" : ""}`}
                >
                  <span
                    aria-hidden
                    className="absolute inset-y-0 left-0 w-[3px] opacity-70"
                    style={{ backgroundColor: rankVisual.color }}
                  />
                  <span
                    aria-hidden
                    className="flex h-6 w-6 items-center justify-center rounded-full text-micro font-bold text-white opacity-90"
                    style={{ backgroundColor: rankVisual.color }}
                  >
                    {index + 1}
                  </span>
                  <div className="flex min-w-0 flex-col">
                    <p className="order-1 truncate font-fraunces text-note font-semibold leading-tight text-[var(--color-text-primary)]">
                      {TEAM_ROLES[role][locale]}
                    </p>
                    <span
                      className="order-2 mt-0.5 block truncate text-micro font-semibold uppercase tracking-wide opacity-60"
                      style={{ color: rankVisual.color }}
                    >
                      {roleRanks[index]}
                    </span>
                  </div>
                  <div
                    aria-hidden
                    className="col-start-2 mt-1.5 h-1 overflow-hidden rounded-full bg-[var(--color-surface-subtle)] sm:col-start-3 sm:row-start-1 sm:mt-0"
                  >
                    <div
                      className="h-full rounded-full opacity-70"
                      style={{ backgroundColor: rankVisual.color, width: rankVisual.width }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <p className="mt-3 flex items-start gap-1.5 text-micro leading-relaxed text-[var(--color-text-muted)]">
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.75"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mt-px h-3.5 w-3.5 shrink-0"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M12 11v5" />
              <path d="M12 8h.01" />
            </svg>
            <span>{t("landing.selfTeamRolesNote", locale)}</span>
          </p>
        </div>
      </div>

      {/* ═══ VISSZAFOGOTT PANEL-LÁBLÉC ═══ */}
      <div className="mt-auto flex h-11 shrink-0 items-center justify-center border-t border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)]">
        <span className="text-note font-medium text-[var(--color-action-primary-bg)]">
          {t("landing.selfFadeCta", locale)}
        </span>
      </div>
    </div>
  );
}

// ─── Team panel – a valódi publikált riport kicsinyített mása ───────────────

function TeamPanel() {
  const { locale } = useLocale();

  // A showcase seed ötfős Értékesítés csapatának tényleges aggregátumai
  // (scripts/seed-showcase-org.ts). A négy érték ugyanaz a mintázatmotor-
  // bemenet, amely ECFP-re, vagyis „Családi Vállalkozásra” értékelődik.
  const dims = [
    { name: t("landing.teamAxisDrive", locale), mean: 81, color: "var(--color-layer-team-accent)" },
    { name: t("landing.teamAxisCohesion", locale), mean: 64, color: "var(--color-sage)" },
    { name: t("landing.teamAxisDiscipline", locale), mean: 55, color: "var(--color-bronze)" },
    { name: t("landing.teamAxisOpenness", locale), mean: 56, color: "#555c9e" },
  ];

  return (
    <div className="overflow-hidden rounded-2xl bg-surface-card shadow-lg shadow-black/[0.08] md:flex md:h-[674px] md:flex-col">
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
        <div className="flex items-center justify-between gap-3">
          <p className="text-micro uppercase tracking-widest text-muted">
            {t("landing.teamDualViewEyebrow", locale)}
          </p>
          <div className="flex shrink-0 gap-1.5">
            <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-micro text-muted">
              5 {locale === "hu" ? "tag" : "members"}
            </span>
            <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-1 text-micro text-muted">
              100%
            </span>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-2 gap-2">
          <div className="min-w-0 rounded-xl bg-[var(--color-surface-subtle)] p-3">
            <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-layer-team-accent)]">
              {t("landing.teamPrinciplesTitle", locale)}
            </p>
            <div className="mt-4 flex flex-col gap-3.5">
              {dims.map((d) => (
                <div key={d.name} className="grid grid-cols-[3.5rem_minmax(0,1fr)_1.25rem] items-center gap-1.5">
                  <span className="truncate text-micro text-ink-body">{d.name}</span>
                  <div className="h-1.5 min-w-0 overflow-hidden rounded-full bg-sand">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.mean}%`, backgroundColor: d.color }}
                    />
                  </div>
                  <span className="text-right font-mono text-micro tabular-nums text-ink">
                    {d.mean}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="min-w-0 rounded-xl bg-[var(--color-surface-subtle)] p-3">
            <p className="text-micro font-semibold uppercase tracking-widest text-[var(--color-layer-team-accent)]">
              {t("landing.teamRelationshipsTitle", locale)}
            </p>
            <svg
              className="mx-auto mt-1 h-[132px] w-full max-w-[172px]"
              viewBox="0 0 180 145"
              role="img"
              aria-labelledby="team-network-title team-network-description"
            >
              <title id="team-network-title">{t("landing.teamRelationshipsA11yTitle", locale)}</title>
              <desc id="team-network-description">{t("landing.teamRelationshipsA11yDescription", locale)}</desc>
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

        <p className="mt-3 text-micro text-muted">
          {t("landing.teamPrivacyNote", locale)}
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3.5">
            <p className="flex items-center gap-1.5 text-micro font-bold uppercase tracking-wide text-[var(--color-sage-dark)]">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-sage)]" />
              {t("landing.teamStrengthLabel", locale)}
            </p>
            <p className="mt-1.5 text-micro leading-relaxed text-ink-body">
              {t("landing.teamStrengthText", locale)}
            </p>
          </div>
          <div className="rounded-xl bg-[var(--color-surface-subtle)] p-3.5">
            <p className="flex items-center gap-1.5 text-micro font-bold uppercase tracking-wide text-[var(--color-bronze-dark)]">
              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-bronze)]" />
              {t("landing.teamWatchLabel", locale)}
            </p>
            <p className="mt-1.5 text-micro leading-relaxed text-ink-body">
              {t("landing.teamWatchText", locale)}
            </p>
          </div>
        </div>

        <div
          className="mt-3 rounded-r-[14px] p-3.5"
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

      <div className="flex h-11 shrink-0 items-center justify-center border-t border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)]">
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
  // Kontraszt (a11y): az alap bronz krém háttéren 3.0:1 – nagy szövegnek épp
  // a határon. A H1 em ezért a bronz-skála középső fokát kapja (3.9:1, nagy
  // szöveg); az eyebrow kontrasztját a SectionEyebrow tónusai kezelik.
  const headlineAccentColor = isSelf ? "var(--color-accent-primary-mid)" : accentColor;
  // Tömör CTA-felület: self módban bronze-dark, team módban a valódi team
  // hero első gradiens-stopja. Így a CTA a megfelelő réteghez tartozik, de
  // mindkét módban megtartja ugyanazt a gomb-anatómiát.
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

          <div className="contents md:col-start-1 md:row-start-1 md:flex md:flex-col md:gap-6">

          {/* 1. Switcher + Eyebrow + Headline. A H1 az LCP-elem, ezért statikus
              és az első festéskor teljesen látható; csak a kísérőelemek
              animálnak. */}
          <div className="order-1 flex flex-col md:order-none">
            <div className={`${riseIn} mb-4 lg:mb-5`}>
              <ModeSwitcher mode={mode} />
            </div>

            <SectionEyebrow
              tone={isSelf ? "bronze" : "team"}
              className={`${riseIn} mb-4`}
            >
              {isSelf ? t("landing.selfEyebrow", locale) : t("landing.teamEyebrow", locale)}
            </SectionEyebrow>

            <h1 className="text-balance font-fraunces text-fluid-display font-medium tracking-tight text-ink">
              {isSelf ? t("landing.selfHeadlineBefore", locale) : t("landing.teamHeadlineBefore", locale)}
              <em className="italic" style={{ color: headlineAccentColor }}>
                {isSelf ? t("landing.selfHeadlineEm", locale) : t("landing.teamHeadlineEm", locale)}
              </em>
            </h1>
          </div>

          {/* 3. Sub + CTA + Microcopy – a H1 alatt, itt megmarad a 0.1s-os
              lépcsőzés (nem az LCP-elem, nem késleltet festést). */}
          <div className="order-3 flex flex-col md:order-none">
            <p className={`${riseIn} mb-7 text-balance text-base font-light leading-relaxed text-ink-body`}>
              {isSelf ? t("landing.selfSub", locale) : t("landing.teamSub", locale)}
            </p>

            <div
              className={`${riseIn} mb-4 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center`}
              style={{ animationDelay: "0.1s" }}
            >
              <Link
                href={isSelf ? "/try" : "/pilot"}
                // P2: a hero elsődleges CTA-ja módonként külön mérve – ebből
                // derül ki, melyik ígéret működik.
                onClick={() =>
                  track("cta.click", {
                    cta_id: "hero_primary",
                    surface: "landing",
                    mode: isSelf ? "self" : "team",
                  })
                }
                className={`inline-flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl px-7 py-3 text-base font-semibold text-[var(--color-text-on-accent-deep)] shadow-md transition-all duration-150 hover:-translate-y-px hover:shadow-lg hover:brightness-[1.06] sm:w-auto sm:min-w-[280px] ${FOCUS_RING_CLASS}`}
                style={{
                  background: ctaBackground,
                  boxShadow: isSelf
                    ? "0 4px 14px color-mix(in srgb, var(--color-bronze-dark) 25%, transparent)"
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
                  className={`group inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-semibold text-[var(--color-action-secondary-fg)] transition-colors hover:text-[var(--color-layer-team-accent)] ${FOCUS_RING_CLASS}`}
                >
                  {t("landing.teamSecondaryCta", locale)}
                  <ChevronRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

          {/* 2. Preview panel – mobilon a cím és a CTA-k közé, asztali nézetben
              a teljes, önálló bal oszlop mellé kerül. */}
          {isSelf ? (
            <div className="order-2 md:col-start-2 md:row-start-1 md:mt-8 md:order-none">
              <div className="mx-auto w-full max-w-[460px]">
                <SelfPanel />
              </div>
            </div>
          ) : (
            <div className="order-2 md:col-start-2 md:row-start-1 md:mt-8 md:order-none">
              <div className="mx-auto w-full max-w-[460px]">
                <TeamPanel />
              </div>
            </div>
          )}

        </div>

      </div>
    </section>
  );
}
