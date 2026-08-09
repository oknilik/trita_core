"use client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SimpleSummary } from "@/lib/results/simple-summary";
import { DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { StatementBlock } from "./StatementBlock";
import { DimensionSpectrum } from "./DimensionSpectrum";

// ─────────────────────────────────────────────────────────────────────
// Az EGYSZERŰ eredmény-nézet törzse (a hero fölötte, közösen a részletes
// nézettel — így a PDF/megosztás gomb egy helyen él).
//
// Négy réteg, ebben a sorrendben — a felismerés előbb jön, mint a
// magyarázat, és a magyarázat előbb, mint a mérés:
//   1. (hero) típus + egy mondat
//   2. három állítás, forrás-dimenzióval
//   3. hat kétpólusú skála
//   4. módszertani jegyzet + átvezetés a részletes nézetre
//
// Ami szándékosan NINCS itt: fülsáv, haladás-sáv, alskálák, csapatszerep,
// karrier, visszajelzés-űrlap. Mind ott van a részletes nézetben, egy
// kattintásra.
// ─────────────────────────────────────────────────────────────────────

export function SimpleResultsView({
  summary,
  showNumbers,
  locale,
  onOpenFull,
  onOpenComparison,
}: {
  summary: SimpleSummary;
  showNumbers: boolean;
  locale: Locale;
  onOpenFull: () => void;
  /** A „Külső kép" a részletes nézet füle — oda vezetünk át. */
  onOpenComparison: () => void;
}) {
  return (
    <div className="flex flex-col gap-8 md:gap-10">
      <section>
        <DashboardSectionHeader
          label={t("results.simpleStatementsTitle", locale)}
          className="mb-4"
        />
        <StatementBlock statements={summary.statements} locale={locale} />
      </section>

      <section>
        <DashboardSectionHeader label={t("results.simpleDimsTitle", locale)} className="mb-4" />
        <DimensionSpectrum
          dimensions={summary.dimensions}
          showNumbers={showNumbers}
          locale={locale}
        />
      </section>

      {/* Módszertani jegyzet — EGYSZER, jól láthatóan. A szekciónkénti
          jegyzetek a részletes nézetben maradnak; itt a sok figyelmeztetés
          maga is zaj lenne. */}
      <div className="flex items-start gap-3 rounded-[14px] border border-[var(--color-surface-self-border)] bg-[var(--color-surface-self-accent-soft)] px-4 py-4">
        <svg
          width="17"
          height="17"
          viewBox="0 0 24 24"
          aria-hidden
          className="mt-0.5 shrink-0"
          fill="none"
          stroke="var(--color-action-primary-bg)"
          strokeWidth="1.7"
          strokeLinecap="round"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.6v.1" />
        </svg>
        <p className="text-caption leading-relaxed text-[var(--color-accent-self-deep)]">
          <strong className="font-semibold">{t("results.simpleMethodTitle", locale)}</strong>{" "}
          — {t("results.simpleMethodBody", locale)}
        </p>
      </div>

      {/* Átvezetés a részletes nézetre + a „Külső kép" egyetlen sorként
          (a fülsáv az egyszerű nézetben szándékosan nincs). */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 rounded-[18px] border border-[var(--color-border-default)] bg-surface-card px-5 py-5 shadow-[var(--ui-shadow-sm)] sm:flex-row sm:items-center sm:justify-between md:px-6">
          <div>
            <h4 className="font-fraunces text-title font-medium text-[var(--color-text-primary)]">
              {t("results.simpleSwitchTitle", locale)}
            </h4>
            <p className="mt-1 max-w-[52ch] text-caption leading-relaxed text-[var(--color-text-secondary)]">
              {t("results.simpleSwitchBody", locale)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenFull}
            className={getButtonClassName({ variant: "primary", className: "shrink-0" })}
          >
            {t("results.simpleSwitchCta", locale)} →
          </button>
        </div>

        <button
          type="button"
          onClick={onOpenComparison}
          className="flex min-h-[44px] flex-col gap-1 rounded-[18px] border border-[var(--color-border-default)] bg-surface-card px-5 py-4 text-left shadow-[var(--ui-shadow-sm)] transition-colors hover:bg-[var(--color-surface-subtle)] sm:flex-row sm:items-center sm:justify-between md:px-6"
        >
          <span>
            <span className="block text-caption font-semibold text-[var(--color-text-primary)]">
              {t("results.simpleOutsideTitle", locale)}
            </span>
            <span className="mt-0.5 block text-micro leading-relaxed text-[var(--color-text-muted)]">
              {t("results.simpleOutsideBody", locale)}
            </span>
          </span>
          <span className="shrink-0 text-caption font-semibold text-[var(--color-accent-primary-strong)]">
            {t("results.simpleOutsideCta", locale)} →
          </span>
        </button>
      </div>
    </div>
  );
}
