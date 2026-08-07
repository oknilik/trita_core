"use client";

import { useLocale } from "@/components/LocaleProvider";
import { useTheme } from "@/components/ThemeProvider";
import { t } from "@/lib/i18n/public";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";

// Séma-választó — három állapot, mert a „rendszer" is választás, nem a
// kapcsoló hiánya. Szegmentált vezérlő, nem toggle: a kapcsoló nem tudná
// megmutatni, hogy épp a rendszert követjük-e.
//
// A sötét mód hatóköre a bejelentkezett app-fa; a marketing világos marad.

const ICON: Record<ThemePreference, string> = {
  system: "◐",
  light: "☀",
  dark: "☾",
};

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { locale } = useLocale();
  const { preference, setPreference } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label={t("theme.label", locale)}
      className={`inline-flex items-center gap-0.5 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-muted)] p-0.5 ${className}`}
    >
      {THEME_PREFERENCES.map((option) => {
        const active = preference === option;
        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            title={t(`theme.${option}`, locale)}
            onClick={() => setPreference(option)}
            className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md px-2 text-caption transition ${
              active
                ? "bg-[var(--color-surface-card)] text-[var(--color-text-primary)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <span aria-hidden="true">{ICON[option]}</span>
            <span className="sr-only">{t(`theme.${option}`, locale)}</span>
          </button>
        );
      })}
    </div>
  );
}
