"use client";

import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import type { ResultsViewMode } from "@/lib/results/view-mode";

// ─────────────────────────────────────────────────────────────────────
// Egyszerű ⇄ Részletes váltó (+ a „Számok" kapcsoló az egyszerű nézetben).
//
// A váltó a felület állandó eleme, nem lapalji link: aki a részletes
// képet keresi, annak látnia kell, hogy létezik. A választást a
// UserProfile őrzi — ld. `lib/results/view-mode.ts`.
//
// A „Számok" alapból KI van kapcsolva: a pontszám olyan pontosságot
// ígér, amivel egy önjellemzés nem rendelkezik. Aki kéri, megkapja.
// ─────────────────────────────────────────────────────────────────────

export function ViewModeSwitch({
  mode,
  onChange,
  showNumbers,
  onToggleNumbers,
  locale,
}: {
  mode: ResultsViewMode;
  onChange: (mode: ResultsViewMode) => void;
  /** Ha nincs megadva, a „Számok" kapcsoló nem jelenik meg (részletes nézet). */
  showNumbers?: boolean;
  onToggleNumbers?: (next: boolean) => void;
  locale: Locale;
}) {
  const options: { id: ResultsViewMode; label: string }[] = [
    { id: "simple", label: t("results.viewModeSimple", locale) },
    { id: "full", label: t("results.viewModeFull", locale) },
  ];

  return (
    <div className="flex flex-wrap items-center justify-end gap-3">
      {onToggleNumbers && (
        <button
          type="button"
          role="switch"
          aria-checked={Boolean(showNumbers)}
          onClick={() => onToggleNumbers(!showNumbers)}
          title={t("results.viewModeNumbersHint", locale)}
          className="inline-flex min-h-[44px] items-center gap-2 text-caption text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-text-primary)]"
        >
          <span
            aria-hidden
            className={`relative block h-[19px] w-[34px] rounded-full transition-colors ${
              showNumbers ? "bg-[var(--color-action-primary-bg)]" : "bg-[var(--color-sand)]"
            }`}
          >
            <span
              className={`absolute left-0.5 top-0.5 block h-[15px] w-[15px] rounded-full bg-[var(--color-surface-card)] shadow-[var(--ui-shadow-sm)] transition-transform ${
                showNumbers ? "translate-x-[15px]" : ""
              }`}
            />
          </span>
          {t("results.viewModeNumbers", locale)}
        </button>
      )}

      <div
        role="group"
        aria-label={t("results.viewModeLabel", locale)}
        className="inline-flex gap-1 rounded-xl border border-[var(--color-border-default)] bg-surface-card p-[3px]"
      >
        {options.map((option) => {
          const active = option.id === mode;
          return (
            <button
              key={option.id}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(option.id)}
              className={[
                "min-h-[38px] rounded-lg px-4 text-caption font-medium transition-colors",
                active
                  ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)]"
                  : "text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]",
              ].join(" ")}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
