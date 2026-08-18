"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { getDimensionLabel } from "@/lib/dimension-utils";
import { dimColorsCss } from "@/lib/color-system";

interface AltruismCardProps {
  value: number;
  description: string;
}

// A Segítőkészség kiegészítő skála: a kártya saját bannere mondja ki, hogy
// nem számít bele a hat főfaktorba. A szint-címke a kanonikus szótárból jön
// (getDimensionLabel) — 2026-08-18 óta az maga is valencia-mentes, ezért a
// kártyának nincs többé szüksége saját szint-szavakra.
export function AltruismCard({ value, description }: AltruismCardProps) {
  const { locale } = useLocale();
  // A SZÍN nem értékel: a Segítőkészség nem a hat főfaktor egyike, ezért
  // nincs saját identitás-hue-ja sem — semleges tintát kap (dimColorsCss
  // fallback).
  const colors = dimColorsCss("I");

  return (
    <section className="mt-6 overflow-hidden rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card">
      <div className="flex items-start gap-2.5 border-b border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] px-[18px] py-3.5">
        <span aria-hidden="true" className="mt-0.5 shrink-0 text-sm text-[var(--color-text-muted)]">ℹ</span>
        <div>
          <p className="text-xs font-semibold text-[var(--color-text-primary)]">
            {t("content.altruismName", locale)} · {t("content.altruismTitle", locale)}
          </p>
          <p className="mt-0.5 text-note leading-relaxed text-[var(--color-text-muted)]">
            {t("content.altruismInfo", locale)}
          </p>
        </div>
      </div>
      <div className="p-4 px-[18px]">
        <div className="flex items-center gap-3">
          <div
            className="h-2 w-2 shrink-0 rounded-full"
            style={{ backgroundColor: colors.base }}
          />
          <span className="flex-1 text-sm font-medium text-[var(--color-text-primary)]">
            {t("content.altruismName", locale)}
          </span>
          {/* Szöveges besorolás — 0 közeli értéknél a szám önmagában
              adathibának tűnne (design-akciólista #13). A KANONIKUS szint-szó
              (getDimensionLabel), semleges stílussal. A kártya korábbi saját
              szótára (content.altruismLevel*) azért létezett, hogy elkerülje a
              valenciás badge-et — 2026-08-18 óta a kanonikus címke maga
              valencia-mentes, a különszótár csak szó-driftet okozott
              („mérsékelt" vs. „közepes"). */}
          <span className="shrink-0 rounded bg-[var(--color-surface-subtle)] px-1.5 py-[2px] text-micro font-semibold text-[var(--color-text-muted)]">
            {getDimensionLabel(value, locale)}
          </span>
          <div className="h-1.5 w-14 shrink-0 overflow-hidden rounded-sm bg-[var(--color-border-default)] md:w-[120px]">
            {/* Min. 2% sávszélesség, hogy a 0 is szándékos értéknek látsszon */}
            <div
              className="h-full rounded-sm"
              style={{ width: `${Math.max(value, 2)}%`, backgroundColor: colors.base }}
            />
          </div>
          <span
            className="w-10 shrink-0 text-right font-fraunces text-base tabular-nums"
            style={{ color: colors.strong }}
          >
            {tf("results.scoreOutOfHundred", locale, { value })}
          </span>
        </div>
        <p className="mt-2.5 max-w-prose text-body text-[var(--color-text-secondary)]">{description}</p>
      </div>
    </section>
  );
}
