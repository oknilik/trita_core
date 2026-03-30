"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, type Locale, SUPPORTED_LOCALES } from "@/lib/i18n";

export function LanguageSwitcher({ variant = "dropdown" }: { variant?: "dropdown" | "pills" }) {
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
              loc === locale
                ? "bg-[#3d6b5e] text-white"
                : "bg-[#f2ede6] text-[#8a8a9a] hover:bg-[#e8e0d3]",
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
        aria-label={t("locale.label", locale)}
        aria-expanded={open}
        className={[
          "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] text-[#8a8a9a] transition-all",
          "hover:bg-[#f2ede6] hover:text-[#4a4a5e]",
          open ? "bg-[#f2ede6] text-[#4a4a5e]" : "",
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
        <div className="absolute right-0 top-full z-50 mt-1.5 w-36 overflow-hidden rounded-xl border border-[#e8e0d3] bg-white py-1 shadow-lg shadow-black/[0.04]">
          {SUPPORTED_LOCALES.map((loc) => {
            const isActive = loc === locale;
            return (
              <button
                key={loc}
                type="button"
                onClick={() => { setLocale(loc as Locale); setOpen(false); }}
                className={[
                  "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-[13px] transition-colors",
                  isActive
                    ? "bg-[#e8f2f0] font-medium text-[#3d6b5e]"
                    : "text-[#4a4a5e] hover:bg-[#f2ede6]",
                ].join(" ")}
              >
                <span>{t(`locale.${loc}` as const, locale)}</span>
                {isActive && (
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3d6b5e]">
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
