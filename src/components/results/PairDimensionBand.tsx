"use client";

import { t, tf } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";
import { hexLetter } from "@/lib/hexaco";
import type { PairDimensionView } from "@/lib/interaction-view";

interface PairDimensionBandProps {
  rows: PairDimensionView[];
  otherName: string;
}

/**
 * Hat dimenziós összevetés-sáv a valódi páros nézetben.
 *
 * MIÉRT: a szöveges dinamika a legmarkánsabb néhány pontot mondja el, tehát
 * szükségképpen válogat. Enélkül a felhasználó nem tudja megkülönböztetni a
 * „nem néztük meg" és a „megnéztük, és nincs róla mit mondani" esetet — a
 * lefedettség-mérés szerint korábban a párok harmada egyetlen mondatot sem
 * kapott, és ez hibának látszott (docs/audits/interaction-pair-coverage-
 * 2026-08-18.md). Ez a sáv mind a hatról nyilatkozik.
 *
 * ADATVÉDELEM: PONTSZÁM NEM JELENIK MEG. A pár-nézet határa az, hogy a
 * partner nyers értékei nem hagyják el a szervert — a szerver a KÉSZ
 * összevetést küldi (dimenziónként egy állapot + ki a magasabb), nem a
 * számokat, amikből a kliens kiszámolná.
 */
export function PairDimensionBand({ rows, otherName }: PairDimensionBandProps) {
  const { locale } = useLocale();
  if (rows.length === 0) return null;

  const stateLabel = (row: PairDimensionView): string => {
    if (row.state === "aligned") return t("results.pairBandAligned", locale);
    return row.higher === "self"
      ? t("results.pairBandSelfHigher", locale)
      : t("results.pairBandOtherHigher", locale);
  };

  return (
    <section className="rounded-2xl border border-[var(--color-border-soft)] bg-surface-card p-5 md:p-6">
      <h2 className="font-fraunces text-heading leading-snug text-[var(--color-text-primary)]">
        {t("results.pairBandTitle", locale)}
      </h2>
      <p className="mt-1.5 max-w-prose text-caption leading-relaxed text-[var(--color-text-secondary)]">
        {t("results.pairBandSubtitle", locale)}
      </p>

      <ul className="mt-4 flex flex-col">
        {rows.map((row) => {
          const differs = row.state === "differs";
          return (
            <li
              key={row.dim}
              className="flex min-h-[44px] items-center gap-3 border-b border-[var(--color-border-soft)] py-2 last:border-b-0"
            >
              <span
                aria-hidden="true"
                className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-soft)] text-micro font-semibold text-[var(--color-text-muted)]"
              >
                {hexLetter(row.dim)}
              </span>
              <span className="min-w-0 flex-1 text-caption font-semibold text-[var(--color-text-secondary)]">
                {row.dimLabel}
              </span>
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-micro font-semibold ${
                  differs
                    ? "bg-[var(--color-surface-subtle)] text-[var(--color-text-primary)]"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {stateLabel(row)}
              </span>
            </li>
          );
        })}
      </ul>

      {/* A magyar ragozás miatt a sor nem a nevet mondja („Katalinnál"),
          hanem a semleges „nála" alakot – a feloldás itt áll egyszer. */}
      <p className="mt-3 text-micro text-[var(--color-text-muted)]">
        {tf("results.pairBandLegend", locale, { name: otherName })}
      </p>
      <p className="mt-2 max-w-prose text-micro leading-relaxed text-[var(--color-text-muted)]">
        {t("results.pairBandNote", locale)}
      </p>
    </section>
  );
}
