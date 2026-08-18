"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { useTheme } from "@/components/ThemeProvider";
import { t } from "@/lib/i18n/public";
import { THEME_PREFERENCES, type ThemePreference } from "@/lib/theme";
import { FOCUS_RING_CLASS, FOCUS_RING_ON_INVERSE_CLASS } from "@/lib/ui/focus";

type ThemeToggleVariant = "menu" | "compact" | "footer";

interface ThemeToggleProps {
  className?: string;
  /**
   * compact: egyetlen, aktuális sémát mutató ikon + popover a fejlécben.
   * menu: a három választás teljes szélességű listája menükben/drawerekben.
   */
  variant?: ThemeToggleVariant;
}

function MonitorIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}

function SunIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
      <circle cx="12" cy="12" r="3.75" />
      <path d="M12 2v2.25M12 19.75V22M2 12h2.25M19.75 12H22M4.93 4.93l1.59 1.59M17.48 17.48l1.59 1.59M19.07 4.93l-1.59 1.59M6.52 17.48l-1.59 1.59" />
    </svg>
  );
}

function MoonIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.2 15.15A8.75 8.75 0 0 1 8.85 3.8 8.75 8.75 0 1 0 20.2 15.15Z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="m3 8.25 3.1 3.1L13 4.75" />
    </svg>
  );
}

const ICON: Record<ThemePreference, typeof MonitorIcon> = {
  system: MonitorIcon,
  light: SunIcon,
  dark: MoonIcon,
};

function ThemeOptions({
  preference,
  onSelect,
  className = "",
}: {
  preference: ThemePreference;
  onSelect: (next: ThemePreference) => void;
  className?: string;
}) {
  const { locale } = useLocale();

  return (
    <div
      role="radiogroup"
      aria-label={t("theme.label", locale)}
      className={`flex w-full flex-col gap-1 ${className}`}
    >
      {THEME_PREFERENCES.map((option) => {
        const active = preference === option;
        const OptionIcon = ICON[option];

        return (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onSelect(option)}
            className={`group flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-caption transition-colors ${FOCUS_RING_CLASS} ${active
              ? "bg-[var(--color-surface-self-accent-soft)] font-semibold text-[var(--color-text-primary)]"
              : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
            }`}
          >
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${active
              ? "text-[var(--color-accent-self-deep)]"
              : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)]"
            }`}>
              <OptionIcon className="h-[18px] w-[18px]" />
            </span>
            <span className="flex-1">{t(`theme.${option}`, locale)}</span>
            {active ? (
              <span className="text-[var(--color-accent-primary-strong)]">
                <CheckIcon />
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Megjelenésválasztó.
 *
 * A fejlécben a három nagy szegmens helyett egyetlen halk ikon él; a
 * részletes választás csak szándékos kattintásra nyílik ki. Menükben és
 * mobil drawerben a választások közvetlenül látszanak.
 */
export function ThemeToggle({
  className = "",
  variant = "menu",
}: ThemeToggleProps) {
  const { locale } = useLocale();
  const { preference, resolved, setPreference } = useTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const ResolvedIcon = resolved === "dark" ? MoonIcon : SunIcon;
  const preferenceLabel = t(`theme.${preference}`, locale);
  const accessibleLabel = `${t("theme.label", locale)}: ${preferenceLabel}`;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      triggerRef.current?.focus();
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (variant === "menu") {
    return (
      <ThemeOptions
        preference={preference}
        onSelect={setPreference}
        className={className}
      />
    );
  }

  if (variant === "footer") {
    return (
      <div
        role="radiogroup"
        aria-label={t("theme.label", locale)}
        className={`flex items-center gap-1.5 text-[var(--color-text-on-inverse-muted)] ${className}`}
      >
        <span className="mr-1.5 text-micro uppercase tracking-[0.14em] opacity-70">
          {t("theme.label", locale)}
        </span>
        {THEME_PREFERENCES.map((option) => {
          const active = preference === option;
          const OptionIcon = ICON[option];
          const optionLabel = t(`theme.${option}`, locale);
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-label={optionLabel}
              aria-checked={active}
              title={optionLabel}
              onClick={() => setPreference(option)}
              className={`flex h-10 w-10 items-center justify-center rounded-lg border transition-[color,background-color,border-color] ${FOCUS_RING_ON_INVERSE_CLASS} ${active
                ? "border-[var(--color-text-on-inverse)]/20 bg-[var(--color-text-on-inverse)]/10 text-[var(--color-text-on-inverse)]"
                : "border-transparent text-[var(--color-text-on-inverse-muted)] hover:border-[var(--color-text-on-inverse)]/10 hover:bg-[var(--color-text-on-inverse)]/5 hover:text-[var(--color-text-on-inverse)]"
              }`}
            >
              <OptionIcon className="h-[18px] w-[18px]" />
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div ref={rootRef} className={`relative inline-flex ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={accessibleLabel}
        title={accessibleLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? popoverId : undefined}
        onClick={() => setOpen((current) => !current)}
        className={`flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg border transition-all ${FOCUS_RING_CLASS} ${open
          ? "border-[var(--color-border-default)] bg-[var(--color-surface-card)] text-[var(--color-accent-self-deep)] shadow-sm"
          : "border-transparent text-[var(--color-text-muted)] hover:border-[var(--color-border-soft)] hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-primary)]"
        }`}
      >
        <ResolvedIcon />
      </button>

      {open ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label={t("theme.label", locale)}
          className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-[var(--color-surface-card)] p-1.5 shadow-[var(--ui-shadow-lg)]"
        >
          <p className="px-3 pb-2 pt-2 font-fraunces text-base text-[var(--color-text-primary)]">
            {t("theme.label", locale)}
          </p>
          <ThemeOptions
            preference={preference}
            onSelect={(next) => {
              setPreference(next);
              setOpen(false);
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
