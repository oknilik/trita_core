"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { hexLetter } from "@/lib/hexaco";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
import type { SerializedDimension } from "@/components/profile/ProfileTabs";
import { AlertIcon, CheckIcon } from "@/components/ui/icons";

// Önkép–külső kép eltérés-kapu: a kanonikus DIFF_MIN_GAP (= round(√2·SEM)) —
// két hiba-terhelt pontszám KÜLÖNBSÉGÉNEK mérési hibája, nem egy ponté. A
// korábbi hardkódolt 10 (1×SEM) a kapu alatti gap-eket már „eltérésnek"
// osztályozta, miközben a dossziè/PDF a kanonikus kaput használta — a két
// felület ellentmondott egymásnak (motor-audit v6, M1).

interface ComparisonTabProps {
  dimensions: SerializedDimension[];
  hasObserverData: boolean;
  observerCount: number;
  /** Az értékelők átlagos magabiztossága (1–5) — null, ha nincs adat. */
  avgConfidence?: number | null;
  /** Self facet-pontszámok (dim → facetkód → 0–100) — null örökség-eredménynél. */
  selfFacetScores?: Record<string, Record<string, number>> | null;
  /** Facet-szintű observer-átlag (facetenként ≥2 értékelő) — null küszöb alatt. */
  observerFacetAverages?: Record<string, Record<string, number>> | null;
  /** Kerekített facet-SEM (± pont) az egyezés-küszöbhöz — szerverről jön. */
  facetSem?: number | null;
}

// ─── Insight texts for gaps ──────────────────────────────────────────────────

const GAP_INSIGHTS: Record<string, { hu: string; en: string }> = {
  H_higher: { hu: "Mások őszintébbnek és alázatosabbnak látnak, mint ahogyan magad érzed.", en: "Others see you as more honest and humble than you feel yourself." },
  H_lower: { hu: "Az értékrended erősebb lehet, mint amennyire azt kifelé kommunikálod.", en: "Your value system may be stronger than what you communicate outwardly." },
  E_higher: { hu: "Mások érzékenyebbnek látnak, mint ahogyan te érzed magad. Ez stresszes helyzetben válhat láthatóvá.", en: "Others see you as more sensitive than you feel. This may become visible under stress." },
  E_lower: { hu: "Stabilabbnak tűnsz kifelé, mint amennyire azt belülről érzed.", en: "You appear more stable outwardly than you feel internally." },
  X_higher: { hu: "Mások energikusabbnak és társaságibbnak látnak.", en: "Others see you as more energetic and sociable." },
  X_lower: { hu: "Kifelé visszafogottabbnak tűnsz, mint amennyire belül energikus vagy.", en: "You appear more reserved outwardly than you feel inside." },
  A_higher: { hu: "Mások barátságosabbnak értékelnek, mint ahogy magad látod. Lehet, hogy a belső feszültséged kevésbé látszik kifelé.", en: "Others rate you as more agreeable than you see yourself. Your internal tension may be less visible." },
  A_lower: { hu: "Az egyenességed erősebben jön át kifelé, mint amennyire azt érzékeled.", en: "Your directness comes across more strongly than you realize." },
  C_higher: { hu: "Mások szervezettebbnek és megbízhatóbbnak látnak.", en: "Others see you as more organized and reliable." },
  C_lower: { hu: "A belső rendszered kevésbé látszik kifelé – lehet, hogy többet is kommunikálhatnál a módszertanodból.", en: "Your internal structure is less visible – you could communicate more about your methods." },
  O_higher: { hu: "Mások nyitottabbnak látnak az új ötletekre és tapasztalatokra.", en: "Others see you as more open to new ideas and experiences." },
  O_lower: { hu: "A belső kíváncsiságod kevésbé nyilvánvaló kifelé.", en: "Your inner curiosity is less obvious to others." },
};

// ─── Summary generation ──────────────────────────────────────────────────────

function getSummaryPoints(
  dims: { name: string; self: number; observer: number }[],
  locale: Locale,
): string[] {
  const points: string[] = [];
  const matching = dims.filter((d) => Math.abs(d.self - d.observer) < DIFF_MIN_GAP);
  const differing = dims.filter((d) => Math.abs(d.self - d.observer) >= DIFF_MIN_GAP);

  if (matching.length >= 4) {
    points.push(
      tf("comparison.summaryMatchMany", locale, { count: matching.length }),
    );
  }

  for (const d of differing) {
    const key = d.observer > d.self ? "comparison.summaryDiffStronger" : "comparison.summaryDiffWeaker";
    points.push(
      tf(key, locale, { name: d.name, gap: Math.abs(d.self - d.observer) }),
    );
  }

  if (dims.length > 0 && differing.length === 0) {
    points.push(t("comparison.summaryPerfectMatch", locale));
  }

  return points;
}

// ─── Facet-szintű önkép–külső kép összevetés ─────────────────────────────────

interface FacetComparisonRow {
  code: string;
  label: string;
  self: number;
  observer: number;
  delta: number; // observer − self
}

function FacetComparisonSection({
  dims,
  selfFacetScores,
  observerFacetAverages,
  facetSem,
  locale,
}: {
  dims: SerializedDimension[];
  selfFacetScores: Record<string, Record<string, number>> | null;
  observerFacetAverages: Record<string, Record<string, number>> | null;
  facetSem: number | null;
  locale: Locale;
}) {
  // Alapból tömör: csak a mérési hibán túli eltérések (a showLess kulcs
  // szövege szerint) — a showAll a teljes lefedett listát nyitja.
  const [showAll, setShowAll] = useState(false);

  // Az egyezés-küszöb a facet-SEM — nélküle a jelölés nem értelmezhető.
  if (!selfFacetScores || !observerFacetAverages || typeof facetSem !== "number") {
    return null;
  }

  // Csak a MINDKÉT oldalról lefedett facetek; a facet-nevek a szerveren
  // lokalizált serialized dimenziókból jönnek (accordionnal azonos forrás).
  const groups = dims.flatMap((dim) => {
    const selfDim = selfFacetScores[dim.code];
    const obsDim = observerFacetAverages[dim.code];
    if (!selfDim || !obsDim) return [];
    const rows: FacetComparisonRow[] = dim.facets.flatMap((f) => {
      const self = selfDim[f.code];
      const observer = obsDim[f.code];
      if (typeof self !== "number" || typeof observer !== "number") return [];
      const selfRounded = Math.round(self);
      const observerRounded = Math.round(observer);
      return [
        {
          code: f.code,
          label: f.label,
          self: selfRounded,
          observer: observerRounded,
          delta: observerRounded - selfRounded,
        },
      ];
    });
    if (rows.length === 0) return [];
    return [{ code: dim.code, label: dim.label, rows }];
  });

  if (groups.length === 0) return null;

  const isGap = (row: FacetComparisonRow) => Math.abs(row.delta) >= facetSem;
  const totalRows = groups.reduce((sum, g) => sum + g.rows.length, 0);
  const gapCount = groups.reduce(
    (sum, g) => sum + g.rows.filter(isGap).length,
    0,
  );

  const visibleGroups = showAll
    ? groups
    : groups
        .map((g) => ({ ...g, rows: g.rows.filter(isGap) }))
        .filter((g) => g.rows.length > 0);

  const legendChip = (
    symbol: string,
    labelKey: string,
    tone: "match" | "gap",
  ) => (
    <span className="flex items-center gap-1.5 text-micro text-[var(--color-text-muted)]">
      <span
        className="inline-flex min-w-[22px] justify-center rounded px-1 py-0.5 font-semibold"
        style={{
          backgroundColor:
            tone === "match"
              ? "var(--color-surface-self-accent-soft)"
              : "var(--color-surface-highlight-warm)",
          color:
            tone === "match"
              ? "var(--color-accent-self-deep)"
              : "var(--color-accent-primary-strong)",
        }}
      >
        {symbol}
      </span>
      {t(labelKey, locale)}
    </span>
  );

  return (
    <div>
      <h3 className="font-fraunces text-lg text-[var(--color-text-primary)]">
        {t("comparison.facetMapTitle", locale)}
      </h3>
      <p className="mt-1 text-caption leading-relaxed text-[var(--color-text-muted)]">
        {t("comparison.facetMapSubtitle", locale)}
      </p>

      {/* Jelölés-legenda — a delta-jelvény három állapota */}
      <div className="mb-4 mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
        {legendChip("≈", "comparison.heatmapMatch", "match")}
        {legendChip("+", "comparison.heatmapObsHigher", "gap")}
        {legendChip("−", "comparison.heatmapSelfHigher", "gap")}
      </div>

      {visibleGroups.length === 0 ? (
        <div className="rounded-xl border-[1.5px] border-[var(--color-action-primary-bg)]/20 bg-[var(--color-surface-self-accent-soft)] p-4 px-[18px]">
          <p className="text-caption leading-relaxed text-[var(--color-accent-self-deep)]">
            {t("comparison.facetMapAllMatch", locale)}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {visibleGroups.map((group) => (
            <div
              key={group.code}
              className="rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card p-4 px-[18px]"
            >
              {/* Csoport-fejléc: dimenzió-név + oszlopcímek */}
              <div className="flex items-center gap-2.5 border-b border-[var(--color-border-soft)] pb-2 text-micro uppercase tracking-wide text-[var(--color-text-muted)]">
                <span className="min-w-0 flex-1 font-semibold text-[var(--color-text-secondary)]">
                  {group.label}
                </span>
                <span className="w-9 shrink-0 text-right">
                  {t("comparison.self", locale)}
                </span>
                <span className="w-9 shrink-0 text-right">
                  {t("comparison.others", locale)}
                </span>
                <span className="w-14 shrink-0 text-right">
                  {t("comparison.gapDiff", locale)}
                </span>
              </div>
              {group.rows.map((row) => {
                const match = !isGap(row);
                const directionText = match
                  ? t("comparison.deltaDirectionMatch", locale)
                  : row.delta > 0
                    ? t("comparison.deltaDirectionHigher", locale)
                    : t("comparison.deltaDirectionLower", locale);
                return (
                  <div
                    key={row.code}
                    className="flex min-h-[44px] items-center gap-2.5 border-b border-[var(--color-border-soft)] py-1.5 last:border-b-0 last:pb-0"
                  >
                    <span className="min-w-0 flex-1 text-caption text-[var(--color-text-primary)]">
                      {row.label}
                    </span>
                    <span
                      className="w-9 shrink-0 text-right text-caption font-semibold tabular-nums"
                      style={{ color: "var(--color-action-primary-bg)" }}
                    >
                      {row.self}
                    </span>
                    <span
                      className="w-9 shrink-0 text-right text-caption font-semibold tabular-nums"
                      style={{ color: "var(--color-accent-primary)" }}
                    >
                      {row.observer}
                    </span>
                    <span className="w-14 shrink-0 text-right">
                      <span
                        title={directionText}
                        aria-label={directionText}
                        className="inline-flex min-w-[38px] justify-center rounded px-1.5 py-0.5 text-micro font-semibold tabular-nums"
                        style={{
                          backgroundColor: match
                            ? "var(--color-surface-self-accent-soft)"
                            : "var(--color-surface-highlight-warm)",
                          color: match
                            ? "var(--color-accent-self-deep)"
                            : "var(--color-accent-primary-strong)",
                        }}
                      >
                        {match ? "≈" : row.delta > 0 ? `+${row.delta}` : `−${Math.abs(row.delta)}`}
                      </span>
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {/* Váltó: tömör (csak eltérések) ↔ teljes lista – csak ha van különbség */}
      {gapCount < totalRows && (
        <button
          type="button"
          onClick={() => setShowAll((v) => !v)}
          className="mt-3 inline-flex min-h-[44px] w-full items-center justify-center rounded-[10px] border border-[var(--color-border-soft)] bg-surface-card px-4 text-caption font-semibold text-[var(--color-text-secondary)] transition hover:bg-[var(--color-surface-subtle)] md:w-auto"
        >
          {showAll
            ? t("comparison.showLess", locale)
            : t("comparison.showAll", locale)}
        </button>
      )}

      {/* Módszertani mikro-jegyzet – a becsült vs mért jelölés alapelve.
          A facetSem BELSŐ küszöbként él tovább (isGap) – számként nem
          jelenik meg (2026-08-11 termékdöntés). */}
      <p className="mt-3 text-micro leading-relaxed text-[var(--color-text-muted)]">
        {t("comparison.facetMethodNote", locale)}
      </p>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ComparisonTab({
  dimensions,
  hasObserverData,
  observerCount,
  avgConfidence,
  selfFacetScores = null,
  observerFacetAverages = null,
  facetSem = null,
}: ComparisonTabProps) {
  const { locale } = useLocale();

  const mainDims = dimensions.filter((d) => d.code !== "I");

  // observer: null = az adott dimenzióra nincs (elég) külső adat – az ilyen
  // sor a gap-számításokból és a számlálókból kimarad, a kártyán jelzést kap.
  const dimData = mainDims.map((d) => ({
    code: d.code,
    name: d.label,
    self: d.score,
    observer: d.observerScore ?? null,
  }));
  const covered = dimData.filter(
    (d): d is (typeof dimData)[number] & { observer: number } => d.observer !== null,
  );

  const matchingCount = covered.filter((d) => Math.abs(d.self - d.observer) < DIFF_MIN_GAP).length;
  const differingCount = covered.length - matchingCount;
  const avgGapPct = Math.round(
    covered.reduce((sum, d) => sum + Math.abs(d.self - d.observer), 0) / (covered.length || 1),
  );
  const isGoodMatch = differingCount <= 2;

  const blindspots = covered.filter((d) => Math.abs(d.self - d.observer) >= DIFF_MIN_GAP);
  const noBlindspotDims = covered.filter((d) => Math.abs(d.self - d.observer) < DIFF_MIN_GAP).map((d) => d.name);

  const summaryPoints = getSummaryPoints(covered, locale);

  const getInsight = (code: string, self: number, observer: number): string | null => {
    const gap = Math.abs(self - observer);
    if (gap < DIFF_MIN_GAP) return null;
    const dir = observer > self ? "higher" : "lower";
    // A tábla HEXACO-betűkkel kulcsol – a belső dimenziókódot betűre képezzük.
    const letter = hexLetter(code);
    if (!letter) return null;
    const key = `${letter}_${dir}`;
    const lang = locale === "hu" ? "hu" : "en";
    return GAP_INSIGHTS[key]?.[lang] ?? null;
  };

  if (!hasObserverData) {
    return (
      <div className="rounded-2xl border-[1.5px] border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-8 text-center">
        <span className="mb-2.5 inline-block text-display opacity-20">📊</span>
        <h3 className="mb-1.5 font-fraunces text-heading text-[var(--color-text-primary)]">
          {t("comparison.noDataTitle", locale)}
        </h3>
        <p className="mx-auto max-w-[380px] text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("comparison.noDataBody", locale)}
        </p>
        <p className="mx-auto mt-2 max-w-[380px] text-xs leading-relaxed text-[var(--color-ink-warm)]">
          {locale === "hu"
            ? "Következő lépés: kérj observer visszajelzést, vagy kapcsolódj csapathoz a közös kép felépítéséhez."
            : "Next step: request observer feedback or connect to a team to build a shared picture."}
        </p>
        <div className="mt-4 flex justify-center">
          {/* UX-B15: a meghívó-blokk ugyanezen a tabon, lejjebb van – link
              helyett görgetünk, nem navigálunk önmagunkra. */}
          <button
            type="button"
            onClick={() =>
              document
                .getElementById("invitations")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
            className="inline-flex min-h-[42px] items-center rounded-[10px] bg-[var(--color-action-primary-bg)] px-5 text-xs font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
          >
            {locale === "hu" ? "Observer meghívása" : "Invite observers"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8" data-testid="observer-comparison-surface">
      {/* 1–2. Új observer-nyitóblokk: narratíva + mérési összegzés. */}
      <div
        data-testid="observer-comparison-hero"
        className="grid overflow-hidden rounded-[22px] border border-[var(--color-border-default)] bg-surface-card shadow-[0_18px_48px_rgba(26,26,46,0.10)] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]"
      >
        <section className="relative overflow-hidden bg-gradient-to-br from-[var(--color-layer-self-hero-from)] via-[var(--color-layer-self-hero-mid)] to-[var(--color-layer-self-hero-to)] px-6 py-8 text-[var(--color-text-on-inverse)] sm:px-9 sm:py-10 lg:px-10 lg:py-11">
          <div aria-hidden="true" className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full bg-white/[0.05]" />
          <div aria-hidden="true" className="pointer-events-none absolute -bottom-20 -left-16 h-44 w-44 rounded-full bg-white/[0.05]" />
          <div className="relative z-10">
            <p className="text-label uppercase tracking-[0.16em] text-[var(--color-accent-primary-soft)]">
              {t("comparison.headerEyebrow", locale)}
            </p>
            <h2 className="mt-4 max-w-[430px] font-fraunces text-title font-medium leading-[1.08] tracking-[-0.03em] text-[var(--color-text-on-inverse)] sm:text-display">
              {t("comparison.headerTitle", locale)}
            </h2>
            <p className="mt-4 max-w-[440px] text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">
              {t("comparison.headerBody", locale)}
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-note font-medium text-[var(--color-text-on-inverse)] ring-1 ring-white/15">
                {tf("comparison.observerBadge", locale, { count: observerCount })}
              </span>
              {avgConfidence != null && (
                <span
                  title={t("comparison.confidenceLabel", locale)}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-note font-medium text-[var(--color-text-on-inverse-muted)] ring-1 ring-white/15"
                >
                  {tf("comparison.avgConfidence", locale, {
                    value:
                      locale === "hu"
                        ? String(avgConfidence).replace(".", ",")
                        : String(avgConfidence),
                  })}
                </span>
              )}
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-center px-5 py-7 sm:px-8 sm:py-9 lg:px-9">
        <div className="mb-4 flex items-center gap-3">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg"
            style={{
              backgroundColor: isGoodMatch ? "var(--color-surface-self-accent-soft)" : "var(--color-surface-highlight-warm)",
              color: isGoodMatch ? "var(--color-action-primary-bg)" : "var(--color-accent-primary)",
            }}
          >
            {isGoodMatch ? <CheckIcon className="h-5 w-5" /> : <AlertIcon className="h-5 w-5" />}
          </div>
          <div>
            <p className="font-fraunces text-base text-[var(--color-text-primary)]">
              {isGoodMatch
                ? t("comparison.overviewGoodMatch", locale)
                : t("comparison.overviewMixed", locale)}
            </p>
            <p className="text-xs leading-relaxed text-[var(--color-text-muted)]">
              {isGoodMatch
                ? t("comparison.overviewGoodMatchBody", locale)
                : t("comparison.overviewMixedBody", locale)}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-2.5 min-[420px]:grid-cols-3">
          <div className="rounded-[10px] bg-[var(--color-surface-subtle)] p-3 text-center">
            <p className="font-fraunces text-heading leading-none" style={{ color: "var(--color-action-primary-bg)" }}>{matchingCount}</p>
            <p className="mt-1 text-micro text-[var(--color-text-muted)]">{t("comparison.matchingDims", locale)}</p>
          </div>
          <div className="rounded-[10px] bg-[var(--color-surface-subtle)] p-3 text-center">
            <p className="font-fraunces text-heading leading-none" style={{ color: "var(--color-accent-primary)" }}>{differingCount}</p>
            <p className="mt-1 text-micro text-[var(--color-text-muted)]">{t("comparison.differingDims", locale)}</p>
          </div>
          <div className="rounded-[10px] bg-[var(--color-surface-subtle)] p-3 text-center">
            {/* Skála-PONT, nem százalék: az átlagos |önkép−külső| gap 0–100-as
                skálapontban értendő – a korábbi „%" suffix hamis mértékegység
                volt (a kártya-szintű gap-ek is „pont"-ban jelennek meg). */}
            <p className="font-fraunces text-heading leading-none text-[var(--color-text-primary)]">
              {avgGapPct} {t("comparison.pointsUnitShort", locale)}
            </p>
            <p className="mt-1 text-micro text-[var(--color-text-muted)]">{t("comparison.avgGap", locale)}</p>
          </div>
        </div>
        </section>
      </div>

      {/* 3. Dimension comparison cards */}
      <div>
        <div className="mb-4 flex gap-4">
          <span className="flex items-center gap-1.5 text-note text-[var(--color-text-muted)]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
            {t("comparison.legendSelf", locale)}
          </span>
          <span className="flex items-center gap-1.5 text-note text-[var(--color-text-muted)]">
            <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: "var(--color-accent-primary-soft)" }} />
            {t("comparison.legendObserver", locale)}
          </span>
        </div>

        <div className="flex flex-col gap-3">
          {dimData.map((dim) => {
            const gap = dim.observer === null ? null : Math.abs(dim.self - dim.observer);
            const hasGap = gap !== null && gap >= DIFF_MIN_GAP;
            const insight =
              dim.observer === null ? null : getInsight(dim.code, dim.self, dim.observer);

            return (
              <div
                key={dim.code}
                className={`rounded-xl border-[1.5px] p-4 px-[18px] ${
                  hasGap ? "border-[var(--color-accent-primary)]/30 bg-[var(--color-surface-highlight-warm)]" : "border-[var(--color-action-primary-bg)]/20 bg-surface-card"
                }`}
              >
                <div className="mb-2.5 flex flex-wrap items-center justify-between gap-1.5">
                  <span className="text-caption font-semibold text-[var(--color-text-primary)]">{dim.name}</span>
                  {gap !== null && (
                    // Sima eltérés-szám, ± nélkül – a ± mérési-hiba jelölésnek
                    // olvasható, az pedig nem jelenik meg a felületen
                    // (2026-08-11 termékdöntés); az irány a sávokból látszik.
                    // Bronz magnitúdó-rámpa a PDF DeltaIndicatorral egyezően
                    // (zsálya egyezés → bronz → mély bronz): a nagy eltérés
                    // „figyelemre érdemes vakfolt", nem hiba – a korábbi piros
                    // (state-error) szégyen-jelzés kivezetve.
                    <span
                      className="rounded px-2 py-0.5 text-note font-medium"
                      style={{
                        backgroundColor: gap < DIFF_MIN_GAP ? "var(--color-surface-self-accent-soft)" : "var(--color-surface-highlight-warm)",
                        color: gap < DIFF_MIN_GAP ? "var(--color-accent-self-deep)" : gap < 20 ? "var(--color-bronze-dark)" : "var(--color-accent-primary-strong)",
                      }}
                    >
                      {gap} {t("comparison.pointsUnitShort", locale)} – {gap < DIFF_MIN_GAP ? t("comparison.gapMatch", locale) : t("comparison.gapDiff", locale)}
                    </span>
                  )}
                </div>

                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-[50px] shrink-0 text-micro text-[var(--color-text-muted)]">{t("comparison.self", locale)}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                      <div className="h-full rounded-sm" style={{ width: `${dim.self}%`, backgroundColor: "var(--color-action-primary-bg)" }} />
                    </div>
                    <span className="w-7 shrink-0 text-right text-micro font-semibold" style={{ color: "var(--color-action-primary-bg)" }}>{dim.self}</span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="w-[50px] shrink-0 text-micro text-[var(--color-text-muted)]">{t("comparison.others", locale)}</span>
                    {dim.observer === null ? (
                      <span className="flex-1 text-micro italic text-[var(--color-text-muted)]">
                        {t("comparison.noObserverDim", locale)}
                      </span>
                    ) : (
                      <>
                        <div className="h-1.5 flex-1 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                          <div className="h-full rounded-sm" style={{ width: `${dim.observer}%`, backgroundColor: "var(--color-accent-primary-soft)" }} />
                        </div>
                        <span className="w-7 shrink-0 text-right text-micro font-semibold" style={{ color: "var(--color-accent-primary)" }}>{dim.observer}</span>
                      </>
                    )}
                  </div>
                </div>

                {hasGap && insight && (
                  <div className="mt-2.5 flex items-start gap-2 rounded-lg bg-[var(--color-surface-subtle)] p-2.5 px-3">
                    <span className="mt-px shrink-0 text-xs" style={{ color: "var(--color-accent-primary)" }}>💡</span>
                    <span className="text-xs leading-relaxed text-[var(--color-text-secondary)]">{insight}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3.5 Facet-szintű összevetés – a ténylegesen akcionálható szint;
          csak a mindkét oldalról lefedett alskálák, facet-SEM küszöbbel */}
      <FacetComparisonSection
        dims={mainDims}
        selfFacetScores={selfFacetScores}
        observerFacetAverages={observerFacetAverages}
        facetSem={facetSem}
        locale={locale}
      />

      {/* 4. Blind spot analysis */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <div className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
          <span className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("comparison.blindSpotEyebrow", locale)}
          </span>
        </div>
        <h3 className="font-fraunces text-lg text-[var(--color-text-primary)]">
          {t("comparison.blindSpotTitle", locale)}
        </h3>
        <p className="mb-3 mt-1 text-caption leading-relaxed text-[var(--color-text-muted)]">
          {t("comparison.blindSpotBody", locale)}
        </p>

        <div className="flex flex-col gap-2.5">
          {blindspots.map((bs) => {
            const dir = bs.observer > bs.self;
            const insight = getInsight(bs.code, bs.self, bs.observer);
            return (
              <div key={bs.code} className="rounded-xl border-l-4 bg-[var(--color-surface-highlight-warm)] p-4 px-[18px]" style={{ borderLeftColor: "var(--color-accent-primary)" }}>
                <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-primary-strong)]">
                  {t("comparison.possibleBlindSpot", locale)}
                </p>
                <p className="font-fraunces text-body text-[var(--color-text-primary)]">
                  {bs.name} – {dir
                    ? t("comparison.blindSpotStronger", locale)
                    : t("comparison.blindSpotWeaker", locale)}
                </p>
                {insight && (
                  <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">{insight}</p>
                )}
                <div className="mt-2 flex gap-3">
                  <span className="flex items-center gap-1 text-note text-[var(--color-text-muted)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-action-primary-bg)" }} />
                    {t("comparison.selfAssessment", locale)}: {bs.self}
                  </span>
                  <span className="flex items-center gap-1 text-note text-[var(--color-text-muted)]">
                    <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "var(--color-accent-primary-soft)" }} />
                    {t("comparison.others", locale)}: {bs.observer}
                  </span>
                </div>
              </div>
            );
          })}

          {noBlindspotDims.length > 0 && (
            <div className="rounded-xl border-l-4 bg-[var(--color-surface-self-accent-soft)] p-4 px-[18px]" style={{ borderLeftColor: "var(--color-action-primary-bg)" }}>
              <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-accent-self-deep)]">
                {t("comparison.noBlindSpot", locale)}
              </p>
              <p className="font-fraunces text-body text-[var(--color-text-primary)]">
                {noBlindspotDims.join(", ")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-accent-self-deep)]">
                {t("comparison.noBlindSpotBody", locale)}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* 5. Dark summary card */}
      <div
        className="rounded-2xl p-6 px-7"
        style={{ background: "linear-gradient(135deg, var(--color-surface-inverse), var(--color-surface-inverse-soft))" }}
      >
        <p className="mb-2 text-micro uppercase tracking-widest" style={{ color: "var(--color-accent-primary-soft)" }}>
          {t("comparison.summaryEyebrow", locale)}
        </p>
        <p className="mb-3 font-fraunces text-lg text-white">
          {t("comparison.summaryTitle", locale)}
        </p>
        <div className="flex flex-col gap-2">
          {summaryPoints.map((point, i) => (
            <div key={i} className="flex items-start gap-2.5">
              <div className="mt-[6px] h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: "var(--color-accent-self)" }} />
              <p className="text-caption leading-[1.6] text-white/[0.55]">{point}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
