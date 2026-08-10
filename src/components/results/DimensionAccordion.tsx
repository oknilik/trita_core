"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { getDimensionTier, tierColors } from "@/lib/dimension-utils";
import { dimensionFacetNames } from "@/lib/tritan";
import { percentileForScore } from "@/lib/norms";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { UpgradeButton } from "@/components/profile/UpgradeButton";

interface FacetEntry {
  code: string;
  label: string;
  score: number;
}

// LR-FACET: a „Szorongás" facet mellé nem-klinikai glossza kerül. A feltétel
// a kérdésbank facet-KÓDJÁRA megy (nem a megjelenített névre) — a név a
// tritan.ts-ből jön és lokalizált.
const ANXIETY_FACET_CODE = "anxiety";

interface DimensionEntry {
  code: string;
  name: string;
  value: number;
  description: string;
  insight: string;
  facets?: FacetEntry[];
}

interface DimensionAccordionProps {
  dimensions: DimensionEntry[];
  showUpsell?: boolean;
  /** Alapból nyitott elem indexe (pl. a legerősebb dimenzió) */
  defaultOpenIdx?: number | null;
  /**
   * A kérdőív-formához tartozó KEREKÍTETT mérési hiba (SEM) — a szerver
   * számolja (psychometrics.dimStandardError), mert a bank kliens-bundle-be
   * húzása nélkül itt nem származtatható. null/undefined → nincs ± jelzés.
   */
  sem?: number | null;
}

function AccordionItem({
  code,
  name,
  value,
  description,
  insight,
  facets,
  isOpen,
  onToggle,
  showUpsell,
  locale,
  sem,
}: {
  code: string;
  name: string;
  value: number;
  description: string;
  insight: string;
  facets: FacetEntry[];
  isOpen: boolean;
  onToggle: () => void;
  showUpsell: boolean;
  locale: Locale;
  sem: number | null;
}) {
  const tier = getDimensionTier(value);
  const colors = tierColors[tier];
  // A teaser-nevek a kanonikus facet-térképből (tritan.ts) jönnek — így a
  // feloldás után látott alskála-nevekkel azonosak, lokalizáltan.
  const facetNames = dimensionFacetNames(code, locale);
  const hasFacetData = facets.length > 0 && !showUpsell;
  // Percentilis csak aktív norma-tábla mellett (ma null → nem renderel).
  const percentile = percentileForScore(code, value);

  return (
    <div
      className={`mb-2.5 overflow-hidden rounded-xl border-[1.5px] shadow-[0_1px_3px_rgba(0,0,0,0.03)] transition-shadow hover:shadow-[0_4px_12px_rgba(0,0,0,0.05)] ${colors.border}`}
    >
      {/* HEADER */}
      <button
        type="button"
        onClick={onToggle}
        className={`flex w-full items-center gap-3 px-[18px] py-3.5 text-left transition-colors ${colors.cardBg} ${colors.cardHover}`}
      >
        <div className={`h-2 w-2 shrink-0 rounded-full ${colors.dot}`} />
        <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
          {name}
        </span>
        <div className="h-1 w-14 shrink-0 overflow-hidden rounded-sm bg-[var(--color-border-default)] md:w-[120px]">
          <div
            className={`h-full rounded-sm ${colors.fill}`}
            style={{ width: `${value}%` }}
          />
        </div>
        <span
          className={`w-10 shrink-0 text-right font-fraunces text-base tabular-nums ${colors.text}`}
        >
          {value}%
        </span>
        {typeof sem === "number" && (
          <span
            className="shrink-0 text-micro tabular-nums text-[var(--color-text-muted)]"
            title={tf("results.scoreSemHint", locale, { sem })}
          >
            ±{sem}
          </span>
        )}
        <span
          className={`shrink-0 text-[11px] text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {/* BODY */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-[18px] pb-5">
              {/* 1. Mit jelent ez rólad? */}
              <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                {t("content.accPersonal", locale)}
              </p>
              <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
                {insight}
              </p>

              {/* 2. Munkahelyi helyzetekben — csak Plus+ */}
              {!showUpsell && description && (
                <>
                  <div className="my-3 h-px bg-[var(--color-border-default)]" />
                  <p className="mb-1 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {t("content.accWorkplace", locale)}
                  </p>
                  <p className="max-w-prose text-body text-[var(--color-text-secondary)]">
                    {description}
                  </p>
                </>
              )}

              {/* 3. Részletes bontás — alskálák, vizuálisan leválasztva */}
              {hasFacetData && (
                <>
                  <div className="my-3 h-px bg-[var(--color-border-default)]" />
                  <p className="mb-2 text-micro font-bold uppercase tracking-wide text-[var(--color-text-muted)]">
                    {t("content.accFacetDetail", locale)}
                  </p>
                  <div className="rounded-lg bg-[var(--color-surface-card)]/60 p-3">
                    {/* Mobilon egy oszlop — két oszlopban a skála+szám összecsúszna */}
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {facets.map((f) => {
                        const fTier = getDimensionTier(f.score);
                        const fColors = tierColors[fTier];
                        return (
                          <div
                            key={f.code}
                            className="flex items-center gap-2.5 rounded-[10px] border border-[var(--color-border-soft)] bg-surface-card px-3.5 py-3"
                          >
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-medium text-[var(--color-text-primary)]">
                                {f.label}
                              </span>
                              {f.code === ANXIETY_FACET_CODE && (
                                <span className="mt-0.5 block text-micro leading-snug text-[var(--color-text-muted)]">
                                  {t("results.facetAnxietyGloss", locale)}
                                </span>
                              )}
                            </span>
                            <div className="h-1 w-[60px] shrink-0 overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                              <div
                                className={`h-full rounded-sm ${fColors.fill}`}
                                style={{ width: `${f.score}%` }}
                              />
                            </div>
                            <span
                              className={`w-6 shrink-0 text-right text-[11px] font-semibold tabular-nums ${fColors.text}`}
                            >
                              {f.score}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {/* Módszertani jegyzet: ±SEM magyarázat + (aktív norma-tábla
                  esetén) percentilis-sor — a mért/becsült jelölés termék-
                  alapelvének megfelelően visszafogottan. */}
              {(typeof sem === "number" || percentile !== null) && (
                <p className="mt-3 text-micro leading-relaxed text-[var(--color-text-muted)]">
                  {typeof sem === "number"
                    ? tf("results.scoreSemHint", locale, { sem })
                    : null}
                  {typeof sem === "number" && percentile !== null ? " " : null}
                  {percentile !== null
                    ? tf("results.scorePercentileLine", locale, { p: percentile })
                    : null}
                </p>
              )}

              {/* Upsell teaser — Self Start only */}
              {showUpsell && facetNames.length > 0 && (
                <div className="mt-4 flex items-center gap-3 rounded-[10px] bg-[var(--color-surface-inverse)] px-4 py-3">
                  <div className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-[var(--color-accent-primary)]/[0.12] font-fraunces text-sm font-medium text-[var(--color-accent-primary-soft)]">
                    +{facetNames.length}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-white">
                      {facetNames.length} {t("results.facetLabel", locale)}
                    </p>
                    <p className="truncate text-micro text-white/[0.35]">
                      {facetNames.join(" · ")}
                    </p>
                  </div>
                  <UpgradeButton tier="self_plus" label={t("results.facetUnlock", locale)} />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DimensionAccordion({
  dimensions,
  showUpsell = false,
  defaultOpenIdx = 0,
  sem = null,
}: DimensionAccordionProps) {
  // Alapból egy elem nyitva (default: az első) — a tartalom ne legyen
  // teljesen rejtve az első ránézésre.
  const [openIdx, setOpenIdx] = useState<number | null>(defaultOpenIdx);
  const { locale } = useLocale();

  return (
    <section>
      <p className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
        {t("results.dimSectionEyebrow", locale)}
      </p>
      <h2 className="mt-1.5 font-fraunces text-[22px] tracking-tight text-[var(--color-text-primary)]">
        {t("results.dimSectionTitle", locale)}
      </h2>
      <p className="mb-6 mt-2 max-w-[540px] text-caption leading-relaxed text-[var(--color-text-muted)]">
        {t("results.dimSectionDesc", locale)}
      </p>

      {dimensions.map((dim, i) => (
        <AccordionItem
          key={dim.code}
          code={dim.code}
          name={dim.name}
          value={dim.value}
          description={dim.description}
          insight={dim.insight}
          facets={dim.facets ?? []}
          isOpen={openIdx === i}
          onToggle={() => setOpenIdx(openIdx === i ? null : i)}
          showUpsell={showUpsell}
          locale={locale}
          sem={sem ?? null}
        />
      ))}
    </section>
  );
}
