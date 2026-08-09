"use client";

import { useState } from "react";
import { dimColors } from "@/lib/color-system";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { SimpleDimension } from "@/lib/results/simple-summary";

// ─────────────────────────────────────────────────────────────────────
// Kétpólusú dimenzió-skála — az egyszerű nézet vizuális magja.
//
// MIÉRT NEM 0–100-AS SÁV: a kitöltött sáv teljesítménynek olvasódik
// („38 = megbuktam"). A két végén megnevezett skála viselkedést jelöl,
// és az alacsony érték is állít valamit („higgadt távolságtartás").
//
// MOBIL (A + B hibrid): a magyarázó mondat `md` alatt egy koppintásra
// nyílik, `md`-től mindig látszik. Egy DOM, JS nélküli asztali
// viselkedés — a `hidden md:block` osztálypár intézi.
// ─────────────────────────────────────────────────────────────────────

/** A pötty a sáv 5–95%-os sávjában mozog, hogy a széleken se lógjon ki. */
function dotPosition(score: number): number {
  const clamped = Math.max(0, Math.min(100, score));
  return 5 + (clamped / 100) * 90;
}

function SpectrumRow({
  dimension,
  showNumbers,
  locale,
}: {
  dimension: SimpleDimension;
  showNumbers: boolean;
  locale: Locale;
}) {
  const [open, setOpen] = useState(false);
  const colors = dimColors(dimension.code);

  return (
    <div className="border-b border-[var(--color-border-soft)] py-4 last:border-b-0">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-micro font-bold"
          style={{ backgroundColor: colors.soft, color: colors.strong }}
        >
          {dimension.letter}
        </span>
        <span className="text-caption font-semibold text-[var(--color-text-primary)]">
          {dimension.label}
        </span>
        {showNumbers && (
          <span
            className="ml-auto font-fraunces text-caption font-semibold tabular-nums"
            style={{ color: colors.strong }}
          >
            {dimension.score}
          </span>
        )}
      </div>

      <div
        className="relative my-2.5 h-1.5 rounded-full bg-gradient-to-r from-[var(--color-cream-300)] to-[var(--color-sand)]"
        role="img"
        aria-label={`${dimension.label}: ${dimension.poleLow} — ${dimension.poleHigh}`}
      >
        <span className="absolute -top-1 bottom-[-4px] left-1/2 w-px bg-[var(--color-sand)]" />
        <span
          className="absolute top-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[var(--color-surface-card)] shadow-[var(--ui-shadow-sm)]"
          style={{ left: `${dotPosition(dimension.score)}%`, backgroundColor: colors.base }}
        />
      </div>

      <div className="flex items-start justify-between gap-3 text-micro">
        <span
          className={
            dimension.near === "low"
              ? "font-medium text-[var(--color-text-secondary)]"
              : "text-[var(--color-text-muted)]"
          }
        >
          {dimension.poleLow}
        </span>
        <span
          className={
            dimension.near === "high"
              ? "text-right font-medium text-[var(--color-text-secondary)]"
              : "text-right text-[var(--color-text-muted)]"
          }
        >
          {dimension.poleHigh}
        </span>
      </div>

      {/* Mobilon nyitható, md-től mindig látszik. */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2 flex min-h-[44px] w-full items-center gap-1.5 text-left text-micro text-[var(--color-accent-primary-strong)] md:hidden"
      >
        {t("results.simpleDimExpand", locale)}
        <svg
          viewBox="0 0 12 12"
          aria-hidden
          className={`h-3 w-3 transition-transform ${open ? "rotate-90" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M4.5 2.5 8 6l-3.5 3.5" />
        </svg>
      </button>
      <p
        className={`text-caption leading-relaxed text-[var(--color-text-secondary)] ${
          open ? "mt-1 block" : "hidden md:mt-2 md:block"
        }`}
      >
        {dimension.sentence}
      </p>
    </div>
  );
}

export function DimensionSpectrum({
  dimensions,
  showNumbers,
  locale,
}: {
  dimensions: SimpleDimension[];
  showNumbers: boolean;
  locale: Locale;
}) {
  return (
    <div>
      <div className="rounded-[18px] border border-[var(--color-border-default)] bg-surface-card px-5 py-1 shadow-[var(--ui-shadow-sm)] md:px-6">
        {dimensions.map((dimension) => (
          <SpectrumRow
            key={dimension.code}
            dimension={dimension}
            showNumbers={showNumbers}
            locale={locale}
          />
        ))}
      </div>
      <p className="mt-2.5 text-micro leading-relaxed text-[var(--color-text-muted)]">
        {t("results.simpleDimsNote", locale)}
      </p>
    </div>
  );
}
