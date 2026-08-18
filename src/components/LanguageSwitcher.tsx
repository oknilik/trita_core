"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n/public";
import { FOCUS_RING_CLASS, FOCUS_RING_ON_INVERSE_CLASS } from "@/lib/ui/focus";

export function LanguageSwitcher({ variant = "dropdown" }: { variant?: "dropdown" | "pills" | "footer" }) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest("[data-lang-menu]")) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (variant === "footer") {
    return (
      <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-on-inverse-muted)]">
        <span className="mr-1 text-micro uppercase tracking-[0.14em] opacity-70">
          {t("locale.label", locale)}
        </span>
        {SUPPORTED_LOCALES.map((loc, index) => (
          <div key={loc} className="contents">
            {index > 0 ? <span aria-hidden="true" className="opacity-40">·</span> : null}
            <button
              type="button"
              aria-pressed={loc === locale}
              onClick={() => setLocale(loc as Locale)}
              className={`rounded px-1 py-1 transition-colors hover:text-[var(--color-text-on-inverse)] ${FOCUS_RING_ON_INVERSE_CLASS} ${
                loc === locale
                  ? "font-semibold text-[var(--color-text-on-inverse)]"
                  : "text-[var(--color-text-on-inverse-muted)]"
              }`}
            >
              {t(`locale.${loc}` as const, locale)}
            </button>
          </div>
        ))}
      </div>
    );
  }

  if (variant === "pills") {
    return (
      <div className="flex gap-2">
        {SUPPORTED_LOCALES.map((loc) => (
          <button
            key={loc}
            type="button"
            onClick={() => setLocale(loc as Locale)}
            className={[
              "rounded-full px-4 py-1.5 text-[12px] font-medium transition-all",
              FOCUS_RING_CLASS,
              loc === locale
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)]"
                : "bg-[var(--color-surface-subtle)] text-[var(--color-text-muted)] hover:bg-[var(--color-border-default)]",
            ].join(" ")}
          >
            {t(`locale.${loc}` as const, locale)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="relative" data-lang-menu>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        // A11y (label-content-name-mismatch): a gomb LÁTHATÓ szövege a
        // nyelvkód ("HU"/"EN"), ezért az akadálymentes névnek EZZEL kell
        // kezdődnie — különben a hangvezérlés („kattints a HU-ra") nem
        // találja meg. A kód után jön a szerep-címke az i18n-kulcsból.
        aria-label={`${locale.toUpperCase()} – ${t("locale.label", locale)}`}
        aria-expanded={open}
        className={[
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-[var(--color-text-muted)] transition-all",
          FOCUS_RING_CLASS,
          "hover:bg-[var(--color-surface-subtle)] hover:text-[var(--color-text-secondary)]",
          open ? "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]" : "",
        ].join(" ")}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="opacity-50">
          <circle cx="12" cy="12" r="10" />
          <path d="M2 12h20" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
        <span className="font-semibold uppercase tracking-wide">{locale.toUpperCase()}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-[var(--color-border-default)] bg-surface-card py-1 shadow-lg shadow-black/[0.04]">
          {SUPPORTED_LOCALES.map((loc) => {
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => { setLocale(loc as Locale); setOpen(false); }}
                className={[
                  "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-caption transition-colors",
                  FOCUS_RING_CLASS,
                  isActive
                    ? "bg-[var(--color-surface-self-accent-soft)] font-medium text-[var(--color-action-primary-bg)]"
                    : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-subtle)]",
                ].join(" ")}
              >
                <span>{t(`locale.${loc}` as const, locale)}</span>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-action-primary-bg)]">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
