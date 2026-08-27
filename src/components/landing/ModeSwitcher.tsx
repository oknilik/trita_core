"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import {
  SELF_LANDING_PATH,
  TEAM_LANDING_PATH,
  setSiteModePreview,
  type SiteMode,
} from "@/components/landing/site-mode";
import { track } from "@/lib/analytics/client";

export type { SiteMode };

// A mód forrása az URL, de NEM useSearchParams-on át (az a statikus
// prerendert CSR-re kényszerítette, és ezzel az egész landinget kivette a
// szerver-HTML-ből — ld. site-mode.ts). Így a switcher valódi állapota már
// a prerenderelt HTML-ben benne van, Suspense-fallback nélkül.
export function ModeSwitcher({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();

  useEffect(() => {
    const url = new URL(window.location.href);
    if (
      url.pathname !== "/" ||
      url.searchParams.has("mode") ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const timeoutIds: number[] = [];
    const removePreviewListeners = () => {
      window.removeEventListener("pointerdown", cancelPreview);
      window.removeEventListener("keydown", cancelPreview);
      window.removeEventListener("scroll", cancelPreview);
    };
    const cancelPreview = () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      removePreviewListeners();
    };

    timeoutIds.push(
      window.setTimeout(() => {
        if (window.scrollY <= 8) {
          setSiteModePreview("team");
          timeoutIds.push(
            window.setTimeout(() => {
              removePreviewListeners();
              if (window.scrollY <= 8) setSiteModePreview(null);
            }, 2400),
          );
        }
      }, 1800),
    );

    window.addEventListener("pointerdown", cancelPreview, { once: true });
    window.addEventListener("keydown", cancelPreview, { once: true });
    window.addEventListener("scroll", cancelPreview, { once: true, passive: true });

    return () => {
      timeoutIds.forEach((timeoutId) => window.clearTimeout(timeoutId));
      removePreviewListeners();
      setSiteModePreview(null);
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-[var(--color-border-default)] bg-[var(--color-surface-card)]/80 p-1 backdrop-blur-sm">
      {(["self", "team"] as SiteMode[]).map((m) => {
        const isActive = mode === m;
        return (
          <Link
            key={m}
            href={m === "self" ? SELF_LANDING_PATH : TEAM_LANDING_PATH}
            onClick={() => {
              // P2: melyik módot választják, és váltanak-e egyáltalán.
              track("landing.mode_switch", { to: m });
            }}
            aria-current={isActive ? "page" : undefined}
            className={[
              "flex min-h-[44px] items-center gap-1.5 rounded-full px-5 py-2 text-xs font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-action-primary-bg)] focus-visible:ring-offset-2",
              isActive
                ? "shadow-sm"
                : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]",
            ].join(" ")}
            style={isActive ? {
              background: m === "team"
                ? "var(--color-layer-team-hero-from)"
                : "var(--color-action-primary-bg)",
              color: m === "team"
                ? "var(--color-text-on-inverse)"
                : "var(--color-action-primary-fg)",
            } : undefined}
          >
            {m === "self" ? (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke={isActive ? "var(--color-accent-primary-soft)" : "var(--color-accent-primary)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="5" r="3" />
                <path d="M2.5 14c0-3 2.5-5 5.5-5s5.5 2 5.5 5" />
              </svg>
            ) : (
              <svg viewBox="0 0 16 16" fill="none" className="h-3.5 w-3.5 shrink-0" stroke={isActive ? "var(--color-layer-team-glow)" : "var(--color-accent-primary)"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="6" cy="5" r="2.5" />
                <circle cx="11" cy="5" r="2.5" />
                <path d="M1 14c0-2.5 2-4.5 5-4.5 1 0 1.8.2 2.5.6M8.5 14c0-2.5 2-4.5 5-4.5" />
              </svg>
            )}
            {m === "self" ? t("nav.modeSelf", locale) : t("nav.modeTeam", locale)}
          </Link>
        );
      })}
    </div>
  );
}
