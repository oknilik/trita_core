"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { setSiteMode, useSiteMode, type SiteMode } from "@/components/landing/site-mode";
import { track } from "@/lib/analytics/client";

export type { SiteMode };

// A mód forrása az URL, de NEM useSearchParams-on át (az a statikus
// prerendert CSR-re kényszerítette, és ezzel az egész landinget kivette a
// szerver-HTML-ből — ld. site-mode.ts). Így a switcher valódi állapota már
// a prerenderelt HTML-ben benne van, Suspense-fallback nélkül.
export function ModeSwitcher() {
  const { locale } = useLocale();
  const mode = useSiteMode();

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-card)]/80 p-1 backdrop-blur-sm">
      {(["self", "team"] as SiteMode[]).map((m) => {
        const isActive = mode === m;
        return (
          <button
            key={m}
            type="button"
            onClick={() => {
              // P2: melyik módot választják, és váltanak-e egyáltalán.
              track("landing.mode_switch", { to: m });
              setSiteMode(m);
            }}
            aria-pressed={isActive}
            className={[
              "flex min-h-[44px] items-center gap-1.5 rounded-full px-5 py-2 text-xs font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary-bg)] focus-visible:ring-offset-2",
              isActive
                ? "bg-[var(--color-action-primary-bg)] text-[var(--color-action-primary-fg)] shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
            ].join(" ")}
          >
            {m === "self" ? (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke={isActive ? "var(--color-accent-primary-soft)" : "var(--color-accent-primary)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="5" r="3" />
                <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke={isActive ? "var(--color-accent-primary-soft)" : "var(--color-accent-primary)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="5" r="2.5" />
                <circle cx="11" cy="5" r="2.5" />
                <path d="M1 14c0-2.5 2-4.5 5-4.5 1 0 1.8.2 2.5.6M8.5 14c0-2.5 2-4.5 5-4.5" />
              </svg>
            )}
            {m === "self" ? t("nav.modeSelf", locale) : t("nav.modeTeam", locale)}
          </button>
        );
      })}
    </div>
  );
}
