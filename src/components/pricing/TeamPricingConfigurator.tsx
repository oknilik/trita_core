"use client";

import Link from "next/link";
import { useId, useMemo, useRef, useState, type CSSProperties } from "react";
import { CheckIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { track } from "@/lib/analytics/client";
import { t, tf, type Locale } from "@/lib/i18n/public";
import { PILOT_TOTAL_TEAMS } from "@/lib/pilot-config";
import { formatMoney, moneyDisplay } from "@/lib/pricing/fx";
import {
  PUBLIC_HEADCOUNT_DEFAULT,
  PUBLIC_HEADCOUNT_MAX,
  PUBLIC_HEADCOUNT_MIN,
  PUBLIC_HEADCOUNT_OVER,
  headcountBand,
  isOverPublicMax,
  ladderPrice,
  type PublicLadder,
} from "@/lib/pricing/team-ladder";
import { QUOTE_TIERS, type QuoteTier } from "@/lib/quote/rate-card";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

/**
 * Publikus árblokk az /pricing oldal „Kalkulátor" szekciójában.
 *
 * Váltó a két szint (Csapatkép / Csapatprogram) közt, létszám- és
 * csapatszám-beállítás,
 * jobb oldalon a fejenkénti ár és a teljes létszámra jutó összeg. A számok a
 * díjkártyából jönnek (`ladder` prop, szerverről), a tartalom-lista az
 * i18n-kulcsokból — a két helyet együtt kell karbantartani
 * (`QUOTE_TIER_INCLUDES` az admin/PDF oldalon).
 *
 * Analitika: az első beállítás-változás `pricing.configure` eseményt küld
 * szinttel és létszám-SÁVVAL (nem pontos számmal) — csak mintázatra.
 */

const KEP_ITEMS = [1, 2, 3, 4, 5, 6, 7] as const;
const PROG_ITEMS = [1, 2] as const;

// A csúszka fogantyújának mérete (globals.css: .pricing-slider thumb) — a
// natív range a fogantyú KÖZÉPPONTJÁT a [félszélesség, szélesség −
// félszélesség] sávban mozgatja, ezért a skálafeliratok és a kitöltés is
// ezzel a korrekcióval kerül a helyére.
const SLIDER_THUMB_PX = 26;
const SLIDER_TICKS = [PUBLIC_HEADCOUNT_MIN, 10, 20, 30, PUBLIC_HEADCOUNT_OVER] as const;

/** A csúszka-érték helye a sávon, 0..1. */
function sliderRatio(value: number): number {
  return (value - PUBLIC_HEADCOUNT_MIN) / (PUBLIC_HEADCOUNT_OVER - PUBLIC_HEADCOUNT_MIN);
}

/** A fogantyú-középponthoz igazított bal pozíció (CSS calc). */
function sliderLeft(value: number): string {
  return `calc(${SLIDER_THUMB_PX / 2}px + (100% - ${SLIDER_THUMB_PX}px) * ${sliderRatio(value)})`;
}

export function TeamPricingConfigurator({
  ladder,
  locale,
}: {
  ladder: PublicLadder;
  locale: Locale;
}) {
  const [tier, setTier] = useState<QuoteTier>("kep");
  const [headcount, setHeadcount] = useState(PUBLIC_HEADCOUNT_DEFAULT);
  const [teamCount, setTeamCount] = useState(1);
  const sliderId = useId();
  const teamCountId = useId();
  const noteId = useId();
  const tracked = useRef(false);

  const price = useMemo(
    () => ladderPrice(ladder, tier, headcount, teamCount),
    [ladder, tier, headcount, teamCount],
  );
  const tierRate = ladder.tiers[tier];
  const tierName = t(`pricing.tier_${tier}_name`, locale);
  // A csúszka utolsó foka („40+"): nincs szám, egyedi ajánlat.
  const over = isOverPublicMax(headcount);
  const perHeadMoney = moneyDisplay(
    price.perHeadAverage ?? tierRate.perHead,
    locale,
    ladder.fx,
    `${t("pricing.perHeadUnit", locale)} ${t("pricing.plusVat", locale)}`,
  );
  const headcountLabel = over
    ? tf("pricing.headcountOver", locale, { max: PUBLIC_HEADCOUNT_MAX })
    : String(headcount);

  const configure = (nextTier: QuoteTier, nextHeads: number, nextTeams = teamCount) => {
    setTier(nextTier);
    setHeadcount(nextHeads);
    setTeamCount(nextTeams);
    if (tracked.current) return;
    tracked.current = true;
    track("pricing.configure", {
      tier: nextTier,
      heads_band: headcountBand(nextHeads),
    });
  };


  return (
    <div
      className="grid overflow-hidden rounded-[24px] border border-sand bg-surface-card shadow-[0_20px_50px_rgba(26,26,46,0.12)] md:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)]"
      aria-label={t("pricing.configuratorA11y", locale)}
    >
      {/* ── Beállítás ─────────────────────────────────────────── */}
      <div className="flex flex-col gap-6 p-6 md:col-start-1 md:row-start-1 md:p-7 md:pb-0">
        {/* Mobilon egymás alatt: két hasábban a „Csapatprogram" szó (Fraunces
            20px) szélesebb, mint a hasáb, és kilógott a kártyából. */}
        <div
          role="group"
          aria-label={t("pricing.tierGroupLabel", locale)}
          className="grid gap-1 rounded-2xl border border-sand bg-warm p-1 sm:grid-cols-2"
        >
          {QUOTE_TIERS.map((option) => {
            const active = option === tier;
            return (
              <button
                key={option}
                type="button"
                aria-pressed={active}
                onClick={() => configure(option, headcount)}
                className={`grid min-h-[60px] min-w-0 gap-0.5 rounded-xl px-3.5 py-2.5 text-left transition ${
                  active
                    ? "bg-surface-card shadow-[0_6px_18px_rgba(26,26,46,0.08)]"
                    : "hover:bg-surface-card/60"
                } ${FOCUS_RING_CLASS}`}
              >
                <span
                  className={`font-fraunces text-heading ${
                    active
                      ? "text-[var(--color-layer-team-accent)]"
                      : "text-ink"
                  }`}
                >
                  {t(`pricing.tier_${option}_name`, locale)}
                </span>
                <span className="text-caption text-ink-body">
                  {t(`pricing.tier_${option}_short`, locale)}
                </span>
              </button>
            );
          })}
        </div>

        <div>
          <div className="flex items-baseline justify-between gap-3">
            <label
              htmlFor={sliderId}
              className="text-sm font-semibold text-ink"
            >
              {t("pricing.headcountLabel", locale)}
            </label>
            <output
              htmlFor={sliderId}
              className="text-right font-fraunces text-title leading-none tabular-nums text-ink"
            >
              {headcountLabel}
              <span className="ml-1 font-sans text-caption text-ink-body">
                {t("pricing.headcountUnit", locale)}
              </span>
            </output>
          </div>
          <input
            id={sliderId}
            type="range"
            min={PUBLIC_HEADCOUNT_MIN}
            max={PUBLIC_HEADCOUNT_OVER}
            step={1}
            value={headcount}
            aria-describedby={noteId}
            aria-valuetext={`${headcountLabel} ${t("pricing.headcountUnit", locale)}`}
            onChange={(event) => configure(tier, Number(event.target.value))}
            style={{ "--pos": sliderRatio(headcount) } as CSSProperties}
            className="pricing-slider mt-2 w-full"
          />
          <div
            aria-hidden
            data-pricing-slider-ticks
            className="relative mt-1 h-4 text-micro tabular-nums text-ink-body"
          >
            {SLIDER_TICKS.map((tick) => (
              <span
                key={tick}
                className="absolute -translate-x-1/2"
                style={{ left: sliderLeft(tick) }}
              >
                {tick === PUBLIC_HEADCOUNT_OVER
                  ? tf("pricing.headcountOver", locale, { max: PUBLIC_HEADCOUNT_MAX })
                  : tick}
              </span>
            ))}
          </div>
          <p
            id={noteId}
            className="mt-2 text-caption leading-relaxed text-ink-body"
          >
            {tf("pricing.headcountNote", locale, {
              band: ladder.firstBandHeads,
              next: ladder.firstBandHeads + 1,
              base: formatMoney(tierRate.perHead, locale, ladder.fx),
              over: formatMoney(tierRate.perHeadOver, locale, ladder.fx),
            })}
          </p>
        </div>

        <div className="grid grid-cols-[minmax(0,1fr)_120px] items-center gap-4 rounded-2xl border border-sand bg-warm px-4 py-3">
          <div>
            <label htmlFor={teamCountId} className="text-sm font-semibold text-ink">
              {t("pricing.teamCountLabel", locale)}
            </label>
            <p className="mt-0.5 text-caption leading-relaxed text-ink-body">
              {tf("pricing.teamCountNote", locale, {
                fee: formatMoney(tierRate.teamBaseFee, locale, ladder.fx),
              })}
            </p>
          </div>
          <select
            id={teamCountId}
            value={teamCount}
            onChange={(event) => configure(tier, headcount, Number(event.target.value))}
            className={`min-h-11 rounded-xl border border-sand bg-surface-card px-3 text-sm font-semibold text-ink ${FOCUS_RING_CLASS}`}
          >
            {[1, 2, 3, 4, 5].map((count) => (
              <option key={count} value={count}>
                {tf("pricing.teamCountOption", locale, { count })}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* ── Ár ─────────────────────────────────────────────────
          Mobilon KÖZVETLENÜL a csúszka után jön (a tartalom-lista utána):
          a beállítás eredménye legyen látható görgetés nélkül. */}
      <div
        aria-live="polite"
        className="relative flex flex-col gap-4 overflow-hidden bg-gradient-to-br from-[var(--color-layer-team-hero-from)] to-[var(--color-layer-team-hero-to)] p-6 text-[var(--color-text-on-inverse)] md:col-start-2 md:row-span-2 md:row-start-1 md:p-7"
      >
        <div
          aria-hidden
          className="absolute -right-14 -top-14 size-48 rounded-full border border-white/10"
        />
        <div
          aria-hidden
          className="absolute -bottom-20 -right-6 size-56 rounded-full border border-white/[0.07]"
        />
        <SectionEyebrow tone="onDark" className="relative">
          {tierName} · {headcountLabel} {t("pricing.headcountUnit", locale)} · {tf("pricing.teamCountOption", locale, { count: teamCount })}
        </SectionEyebrow>
        {over ? (
          <>
            <p className="relative font-fraunces text-fluid-title leading-tight tracking-tight">
              {t("pricing.customTitle", locale)}
            </p>
            <p className="relative max-w-[38ch] text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">
              {tf("pricing.customBody", locale, { max: PUBLIC_HEADCOUNT_MAX })}
            </p>
            <Link
              href="/contact"
              onClick={() =>
                track("cta.click", {
                  cta_id: "pricing_configurator_custom",
                  surface: "pricing",
                })
              }
              className={`relative mt-1 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-layer-team-badge)] px-5 text-center text-caption font-semibold text-[var(--color-layer-team-hero-to)] transition hover:-translate-y-0.5 hover:brightness-105 ${FOCUS_RING_CLASS}`}
            >
              {t("pricing.customCta", locale)}
            </Link>
            <p className="relative text-caption text-[var(--color-text-on-inverse-muted)]">
              {t("pricing.customNote", locale)}
            </p>
          </>
        ) : (
          <>
            <p className="relative text-caption text-[var(--color-text-on-inverse-muted)]">
              {t("pricing.perHeadAverageLabel", locale)}
            </p>
            <p className="relative font-fraunces text-fluid-display leading-none tracking-tight tabular-nums">
              {perHeadMoney.big}
              <span className="ml-1.5 font-sans text-base text-[var(--color-text-on-inverse-muted)]">
                {perHeadMoney.small}
              </span>
            </p>
            <p className="relative text-sm text-[var(--color-text-on-inverse-muted)]">
              {tf("pricing.totalForTeam", locale, {
                total: formatMoney(price.total, locale, ladder.fx),
              })}
            </p>
            <p className="relative text-caption text-[var(--color-text-on-inverse-muted)]">
              {tf("pricing.teamsLine", locale, {
                fee: formatMoney(tierRate.teamBaseFee, locale, ladder.fx),
              })}
            </p>
            <p className="relative text-caption text-[var(--color-text-on-inverse-muted)]">
              {t("pricing.vatNote", locale)}
            </p>
            <dl className="relative grid grid-cols-[minmax(0,1fr)_auto] gap-x-4 gap-y-1.5 border-t border-white/15 pt-4 text-caption">
              <dt className="text-[var(--color-text-on-inverse-muted)]">
                {tf("pricing.breakdownBase", locale, {
                  band: teamCount,
                })}
              </dt>
              <dd className="m-0 text-right tabular-nums">
                {formatMoney(price.baseFee, locale, ladder.fx)}
              </dd>
              {price.overHeads > 0 && (
                <>
                  <dt className="text-[var(--color-text-on-inverse-muted)]">
                    {t("pricing.breakdownOver", locale)}
                  </dt>
                  <dd className="m-0 text-right tabular-nums">
                    {price.overHeads} × {formatMoney(tierRate.perHeadOver, locale, ladder.fx)}
                  </dd>
                </>
              )}
              {price.firstHeads > 0 && (
                <>
                  <dt className="text-[var(--color-text-on-inverse-muted)]">
                    {t("pricing.breakdownParticipants", locale)}
                  </dt>
                  <dd className="m-0 text-right tabular-nums">
                    {price.firstHeads} × {formatMoney(tierRate.perHead, locale, ladder.fx)}
                  </dd>
                </>
              )}
            </dl>
            {/* Az időigény mondat hosszúságú (kérdőívek + csapatonkénti
                alkalmak): saját, balra zárt soron olvasható, nem a
                jobbra zárt szám-oszlopban. */}
            <div className="relative text-caption">
              <p className="text-[var(--color-text-on-inverse-muted)]">{t("pricing.timeLabel", locale)}</p>
              <p className="mt-1 leading-relaxed">{t(`pricing.tier_${tier}_time`, locale)}</p>
            </div>
            <Link
              href="/contact"
              onClick={() =>
                track("cta.click", {
                  cta_id: "pricing_configurator",
                  surface: "pricing",
                })
              }
              className={`relative mt-1 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-layer-team-badge)] px-5 text-center text-caption font-semibold text-[var(--color-layer-team-hero-to)] transition hover:-translate-y-0.5 hover:brightness-105 ${FOCUS_RING_CLASS}`}
            >
              {t("pricing.teamCta", locale)}
            </Link>
            <p className="relative text-caption text-[var(--color-text-on-inverse-muted)]">
              {t("pricing.ctaNote", locale)}
            </p>
            {/* A pilotkedvezmény a Csapatprogramra érvényes: a Csapatkép
                mellett nem hivatkozhatunk a „fenti díjra". */}
            <p className="relative rounded-xl bg-white/[0.07] px-3 py-2.5 text-caption text-[var(--color-text-on-inverse-muted)]">
              {tf(tier === "prog" ? "pricing.pilotNote" : "pricing.pilotNoteOtherTier", locale, {
                pct: ladder.pilotDiscountPct,
                total: PILOT_TOTAL_TEAMS,
              })}
            </p>
          </>
        )}
      </div>

      <div className="p-6 md:col-start-1 md:row-start-2 md:p-7 md:pt-6">
        <h3 className="text-sm font-semibold text-ink">
          {tf("pricing.includesTitle", locale, { tier: tierName })}
        </h3>
        <ul className="mt-3 space-y-2">
          {KEP_ITEMS.map((item) => (
            <li
              key={`kep-${item}`}
              className="flex gap-2.5 text-caption leading-relaxed text-ink-body"
            >
              <CheckIcon className="mt-0.5 h-4 w-4 shrink-0 text-sage" />
              {t(`pricing.tier_kep_item${item}`, locale)}
            </li>
          ))}
          {PROG_ITEMS.map((item) => {
            const on = tier === "prog";
            return (
              <li
                key={`prog-${item}`}
                // A nem választott szint tétele NEM halványítva (a kontraszt
                // 4,5:1 alá esne, axe): a homok-pipa és a szint-jelvény jelzi.
                className="flex gap-2.5 text-caption leading-relaxed text-ink-body"
              >
                <CheckIcon
                  className={`mt-0.5 h-4 w-4 shrink-0 ${on ? "text-sage" : "text-sand"}`}
                />
                <span>
                  {t(`pricing.tier_prog_item${item}`, locale)}
                  {!on && (
                    <span className="ml-1.5 whitespace-nowrap rounded-full bg-[var(--color-layer-team-soft)] px-2 py-0.5 text-micro uppercase tracking-wide text-[var(--color-layer-team-accent)]">
                      {t("pricing.tier_prog_name", locale)}
                    </span>
                  )}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
