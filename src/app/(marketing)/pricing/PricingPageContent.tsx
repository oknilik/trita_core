"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { FaqList } from "@/components/marketing/FaqList";
import { LocalizedPageMeta } from "@/components/marketing/LocalizedPageMeta";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { PilotSpotsIndicator } from "@/components/marketing/PilotSpotsIndicator";
import { TeamPricingConfigurator } from "@/components/pricing/TeamPricingConfigurator";
import { CheckIcon, ChevronRightIcon } from "@/components/ui/icons";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { track } from "@/lib/analytics/client";
import { t, tf, type Locale } from "@/lib/i18n/public";
import { PILOT_TOTAL_TEAMS } from "@/lib/pilot-config";
import { formatFxDate, formatMoney, moneyDisplay } from "@/lib/pricing/fx";
import {
  PUBLIC_HEADCOUNT_MAX,
  referencePerHead,
  pilotPerHead,
  type PublicLadder,
} from "@/lib/pricing/team-ladder";
import { QUOTE_TIERS, type QuoteTier } from "@/lib/quote/rate-card";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";
import { PRICING_PAGE_FAQ_INDEXES, pricingFaqVars } from "./faq";

/**
 * /pricing — az önálló Árak oldal (2026-09-08).
 *
 * Sorrend: a két szint egy pillantásra → kalkulátor → mit tartalmaz
 * (összehasonlító tábla) → ezen felül → pilot-ár → GYIK csak az árról →
 * záró CTA. Minden szám a díjkártyából jön (`ladder`), a szintek tartalma
 * a `pricing.tier_*` kulcsokból — az admin/PDF oldali QUOTE_TIER_INCLUDES-
 * szal együtt karbantartandó.
 */

const KEP_ITEMS = [1, 2, 3, 4, 5, 6, 7] as const;
const PROG_ITEMS = [1, 2] as const;

function TierTile({ tier, ladder, locale }: { tier: QuoteTier; ladder: PublicLadder; locale: Locale }) {
  const highlight = tier === "prog";
  const money = moneyDisplay(
    referencePerHead(ladder, tier),
    locale,
    ladder.fx,
    `${tf("pricing.baseTeamUnit", locale, { band: ladder.firstBandHeads })} ${t("pricing.plusVat", locale)}`,
  );
  return (
    <div
      data-pricing-tile={tier}
      className={`@container flex flex-col gap-1 rounded-[20px] border p-5 ${
        highlight
          ? "border-transparent bg-gradient-to-br from-[var(--color-layer-team-hero-from)] to-[var(--color-layer-team-hero-to)] text-[var(--color-text-on-inverse)]"
          : "border-sand bg-surface-card text-ink"
      }`}
    >
      <p className="font-fraunces text-heading">{t(`pricing.tier_${tier}_name`, locale)}</p>
      <p
        className={`mt-1 flex flex-nowrap items-baseline gap-x-1.5 whitespace-nowrap font-fraunces text-title leading-none tabular-nums @sm:text-display ${
          highlight ? "text-[var(--color-layer-team-badge)]" : "text-[var(--color-layer-team-accent)]"
        }`}
      >
        {money.big}
        <span className={`shrink-0 whitespace-nowrap font-sans text-micro @sm:text-caption ${highlight ? "text-[var(--color-text-on-inverse-muted)]" : "text-ink-body"}`}>
          {money.small}
          <sup>*</sup>
        </span>
      </p>
      <p className={`mt-2 text-caption leading-relaxed ${highlight ? "text-[var(--color-text-on-inverse-muted)]" : "text-ink-body"}`}>
        * {tf("pricing.referenceTeamNote", locale, { band: ladder.firstBandHeads })}
      </p>
      <p className={`text-caption leading-relaxed ${highlight ? "text-[var(--color-text-on-inverse-muted)]" : "text-ink-body"}`}>
        {t(`pricing.tier_${tier}_short`, locale)}
      </p>
    </div>
  );
}

function ComparisonTable({ locale }: { locale: Locale }) {
  const rows: Array<{ key: string; label: string; kep: boolean; prog: boolean }> = [
    ...KEP_ITEMS.map((i) => ({ key: `kep${i}`, label: t(`pricing.tier_kep_item${i}`, locale), kep: true, prog: true })),
    ...PROG_ITEMS.map((i) => ({ key: `prog${i}`, label: t(`pricing.tier_prog_item${i}`, locale), kep: false, prog: true })),
  ];
  // A cella jelentése felolvasva is érthető legyen: a „✓" és a „–" karakter
  // önmagában nem mondja meg, hogy az adott csomag tartalmazza-e az elemet.
  const cell = (on: boolean) =>
    on ? (
      <CheckIcon className="mx-auto h-4 w-4 text-sage" aria-label={t("pricing.compareIncluded", locale)} />
    ) : (
      <span className="text-ink-body" aria-label={t("pricing.compareExcluded", locale)}>
        –
      </span>
    );
  return (
    // Görgethető régió: fókuszálható, hogy billentyűzettel is végig lehessen
    // menni a táblán (axe: scrollable-region-focusable).
    <div
      role="region"
      aria-label={t("pricing.compareTitle", locale)}
      tabIndex={0}
      className={`overflow-x-auto rounded-[20px] border border-sand bg-surface-card ${FOCUS_RING_CLASS}`}
    >
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="bg-warm text-left">
            <th className="w-[52%] px-5 py-3 text-caption font-medium text-ink-body" />
            {QUOTE_TIERS.map((tier) => (
              <th key={tier} className="px-4 py-3 text-center font-fraunces text-heading font-medium text-ink">
                {t(`pricing.tier_${tier}_name`, locale)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-t border-sand">
              <td className="px-5 py-3 leading-relaxed text-ink-body">{row.label}</td>
              <td className="px-4 py-3 text-center">{cell(row.kep)}</td>
              <td className="px-4 py-3 text-center">{cell(row.prog)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function PricingPageContent({ ladder }: { ladder: PublicLadder }) {
  const { locale } = useLocale();
  const vars = pricingFaqVars(ladder, locale);
  const partnerFee = pilotPerHead(ladder, "prog");
  const partnerMoney = moneyDisplay(
    partnerFee,
    locale,
    ladder.fx,
    `${tf("pricing.baseTeamUnit", locale, { band: ladder.firstBandHeads })} ${t("pricing.plusVat", locale)}`,
  );
  // Az angol felület euróban mutat: egy sor mondja, hogy forintban
  // számlázunk, és melyik napi középárfolyamon váltottunk.
  const fxNote =
    locale === "hu"
      ? null
      : ladder.fx.date
        ? tf("pricing.fxNote", locale, {
            source: ladder.fx.source.toUpperCase(),
            rate: Math.round(ladder.fx.hufPerEur),
            date: formatFxDate(ladder.fx.date, locale),
          })
        : tf("pricing.fxNoteFallback", locale, { rate: Math.round(ladder.fx.hufPerEur) });

  return (
    <main className="overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      <LocalizedPageMeta titleKey="pricing.metaTitle" descriptionKey="pricing.metaDescription" />

      {/* ── Hero + a két szint ─────────────────────────────────── */}
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[4%] top-[8%] h-[70%] w-[44%] rounded-full bg-[var(--color-layer-team-soft)]/55 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1120px] gap-10 px-7 pb-16 pt-12 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)] lg:items-end">
          <div>
            <SectionEyebrow tone="team" className="mb-6">{t("pricing.pageEyebrow", locale)}</SectionEyebrow>
            <h1 className="max-w-[14ch] font-fraunces text-fluid-display tracking-tight text-ink">
              {t("pricing.pageTitle", locale)}
              <em className="not-italic text-[var(--color-layer-team-accent)]">{t("pricing.pageTitleEm", locale)}</em>
            </h1>
            <p className="mt-6 max-w-[58ch] text-base leading-relaxed text-ink-body">
              {t("pricing.pageLead", locale)}
            </p>
            <MarketingActions
              className="mt-8"
              primary={{ href: "/contact", label: t("pricing.offerCta", locale), onClick: () => track("cta.click", { cta_id: "pricing_hero", surface: "pricing" }) }}
              secondary={{ href: "#kalkulator", label: t("pricing.pageCalculatorLink", locale), iconRight: <ChevronRightIcon /> }}
            />
          </div>
          <div data-pricing-tiles className="grid gap-3 sm:grid-cols-2">
            {QUOTE_TIERS.map((tier) => (
              <TierTile key={tier} tier={tier} ladder={ladder} locale={locale} />
            ))}
            {fxNote && (
              <p data-pricing-fx-note className="px-1 text-note leading-relaxed text-ink-body sm:col-span-2">
                {fxNote}
              </p>
            )}
          </div>
        </div>
      </section>

      <PageWidthDivider />

      {/* ── Kalkulátor ────────────────────────────────────────── */}
      <section id="kalkulator" className="scroll-mt-24 bg-warm">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <SectionEyebrow>{t("pricing.calculatorEyebrow", locale)}</SectionEyebrow>
          <h2 className="mt-4 max-w-[17ch] font-fraunces text-fluid-title tracking-tight text-ink">{t("pricing.configuratorTitle", locale)}</h2>
          <p className="mt-5 max-w-[64ch] text-base leading-relaxed text-ink-body">{t("pricing.configuratorLead", locale)}</p>
          <div className="mt-9">
            <TeamPricingConfigurator ladder={ladder} locale={locale} />
          </div>
        </div>
      </section>

      {/* ── Pilot-ár ──────────────────────────────────────────
          Közvetlenül a kalkulátor után: a partneri ár ott a legerősebb,
          ahol a látogató épp kiszámolta a sajátját. A szabad helyek
          jelzője ugyanaz a kártya, mint a /pilot és a /team-dynamics
          oldalon — egy forrásból. */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <div
            data-pricing-pilot
            className="grid gap-8 rounded-[24px] border border-[var(--color-layer-team-accent)]/15 bg-[var(--color-layer-team-soft)]/60 px-6 py-8 md:px-9 md:py-10 lg:grid-cols-[minmax(0,1fr)_minmax(320px,auto)] lg:items-center"
          >
            <div>
              <SectionEyebrow tone="team">{tf("pricing.pilotStripEyebrow", locale, { total: PILOT_TOTAL_TEAMS })}</SectionEyebrow>
              <h2 className="mt-3 max-w-[20ch] font-fraunces text-fluid-title tracking-tight text-ink">
                {t("pricing.pilotSectionTitle", locale)}
              </h2>
              <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <s className="font-fraunces text-heading tabular-nums text-ink-body decoration-[var(--color-layer-team-glow)] decoration-[1.5px]">
                  {formatMoney(referencePerHead(ladder, "prog"), locale, ladder.fx)}
                </s>
                <span className="font-fraunces text-fluid-display leading-none tabular-nums text-[var(--color-layer-team-accent)]">
                  {partnerMoney.big}
                  <span className="ml-1.5 font-sans text-caption text-ink-body">{partnerMoney.small}</span>
                </span>
                {/* Körvonalas jelvény: kitöltve a sötét témában a világos
                    akcentuson nem érné el a 4,5:1-et (axe). */}
                <span className="inline-flex items-center rounded-full border border-[var(--color-layer-team-accent)] px-2.5 py-0.5 text-caption font-semibold text-[var(--color-layer-team-accent)]">
                  {tf("pilot.fact3Off", locale, { pct: ladder.pilotDiscountPct })}
                </span>
              </p>
              <p className="mt-2 text-caption leading-relaxed text-ink-body">
                {tf("pricing.referenceTeamNote", locale, { band: ladder.firstBandHeads })}
              </p>
              <p className="mt-4 max-w-[60ch] text-base leading-relaxed text-ink-body">
                {t("pricing.pilotStripBody", locale)}
              </p>
            </div>
            <PilotSpotsIndicator
              locale={locale}
              href="/pilot"
              ctaId="pricing_pilot"
              surface="pricing"
              className="lg:justify-self-end"
            />
          </div>
        </div>
      </section>

      {/* ── Mit tartalmaz + kiegészítők ───────────────────────── */}
      <section className="bg-warm">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <SectionEyebrow>{t("pricing.compareEyebrow", locale)}</SectionEyebrow>
          <h2 className="mt-4 max-w-[20ch] font-fraunces text-fluid-title tracking-tight text-ink">{t("pricing.compareTitle", locale)}</h2>
          <p className="mt-5 max-w-[64ch] text-base leading-relaxed text-ink-body">{t("pricing.compareLead", locale)}</p>
          <div className="mt-8">
            <ComparisonTable locale={locale} />
          </div>

          <div className="mt-12 grid gap-4 md:grid-cols-3">
            <div className="rounded-[18px] border border-sand bg-surface-card p-5">
              <p className="font-semibold text-ink">{t("pricing.belowWorkshopTitle", locale)}</p>
              <p className="mt-1 font-fraunces text-heading tabular-nums text-[var(--color-layer-team-accent)]">{formatMoney(ladder.extraWorkshopDayFee, locale, ladder.fx)}<span className="ml-1 font-sans text-caption text-ink-body">{t("pricing.plusVat", locale)} {t("pricing.belowWorkshopUnit", locale)}</span></p>
              <p className="mt-2 text-caption leading-relaxed text-ink-body">{t("pricing.belowWorkshopBody", locale)}</p>
            </div>
            <div className="rounded-[18px] border border-sand bg-surface-card p-5">
              <p className="font-semibold text-ink">{t("pricing.belowMultiTeamTitle", locale)}</p>
              <p className="mt-2 text-caption leading-relaxed text-ink-body">{tf("pricing.belowMultiTeamBody", locale, { max: PUBLIC_HEADCOUNT_MAX })}</p>
            </div>
            <div className="rounded-[18px] border border-sage/15 bg-sage-soft p-5">
              <p className="font-semibold text-ink">{t("pricing.selfFreeLine", locale)}</p>
              <p className="mt-1 font-fraunces text-heading text-sage-dark">{t("pricing.extraSelfValue", locale)}</p>
              <p className="mt-2 text-caption leading-relaxed text-ink-body">{t("pricing.selfFreeBody", locale)}</p>
              <Link href="/try" className={`mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-sage-dark transition-colors hover:text-sage ${FOCUS_RING_CLASS}`}>
                {t("pricing.selfFreeCta", locale)}<ChevronRightIcon className="ml-1 h-4 w-4 shrink-0" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── GYIK az árról ─────────────────────────────────────── */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <FaqList indexes={PRICING_PAGE_FAQ_INDEXES} locale={locale} surface="pricing" eyebrow={t("pricing.faqPriceEyebrow", locale)} vars={vars} />
        </div>
      </section>

      {/* ── Záró CTA ──────────────────────────────────────────── */}
      <section className="px-5 pb-8 lg:px-14">
        <div className="mx-auto max-w-[1060px] rounded-[28px] bg-gradient-to-br from-[var(--color-surface-inverse)] to-[var(--color-surface-inverse-soft)] px-6 py-12 text-center lg:px-10 lg:py-14">
          <SectionEyebrow tone="onDark">{t("pricing.endEyebrow", locale)}</SectionEyebrow>
          <h2 className="mx-auto mt-4 max-w-[22ch] font-fraunces text-fluid-title text-[var(--color-text-on-inverse)]">
            {t("pricing.endTitle", locale)}
          </h2>
          <p className="mx-auto mt-3 max-w-[52ch] text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">
            {t("pricing.bottomSub", locale)}
          </p>
          <Link
            href="/contact"
            onClick={() => track("cta.click", { cta_id: "pricing_bottom", surface: "pricing" })}
            className={`mt-7 inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--color-action-primary-bg)] px-6 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:-translate-y-0.5 hover:brightness-105 ${FOCUS_RING_CLASS}`}
          >
            {t("pricing.bottomCta", locale)}
          </Link>
        </div>
      </section>
    </main>
  );
}
