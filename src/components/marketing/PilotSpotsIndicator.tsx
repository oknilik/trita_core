"use client";

import { ChevronRightIcon } from "@/components/ui/icons";
import { track } from "@/lib/analytics/client";
import { t, tf, type Locale } from "@/lib/i18n/public";
import { PILOT_SPOTS_LEFT, PILOT_TOTAL_TEAMS } from "@/lib/pilot-config";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

/** Shared availability card for /pilot, /pricing and /team-dynamics. */
export function PilotSpotsIndicator({
  locale,
  href,
  ctaId,
  surface,
  className = "",
}: {
  locale: Locale;
  href: string;
  ctaId: string;
  surface: "pilot" | "pricing" | "team";
  className?: string;
}) {
  if (PILOT_SPOTS_LEFT <= 0) return null;

  const taken = PILOT_TOTAL_TEAMS - PILOT_SPOTS_LEFT;
  const vars = { total: PILOT_TOTAL_TEAMS, left: PILOT_SPOTS_LEFT, taken };

  return (
    <div
      data-pilot-availability
      className={`group max-w-[600px] rounded-[22px] bg-gradient-to-br from-[var(--color-layer-team-hero-from)] to-[var(--color-layer-team-hero-to)] p-5 text-[var(--color-text-on-inverse)] shadow-[0_18px_44px_color-mix(in_srgb,var(--color-layer-team-hero-to)_22%,transparent)] sm:p-6 ${className}`}
    >
      <a
        href={href}
        data-pilot-spots
        aria-label={`${t("pilot.spotsPanelCta", locale)}: ${tf("pilot.spotsA11y", locale, vars)}`}
        onClick={() => track("cta.click", { cta_id: ctaId, surface })}
        className={`block rounded-lg ${FOCUS_RING_CLASS}`}
      >
        <span className="flex flex-wrap items-center gap-x-4 gap-y-2 sm:gap-x-5">
          <span className="shrink-0 font-fraunces text-display leading-none tracking-[-0.06em] text-[var(--color-layer-team-badge)] tabular-nums md:text-hero">
            {PILOT_SPOTS_LEFT}
          </span>
          <span className="min-w-0 flex-[1_1_10rem]">
            <span className="block text-base font-semibold leading-snug text-[var(--color-text-on-inverse)] sm:text-lg">
              {t("pilot.spotsPanelTitle", locale)}
            </span>
            <span className="mt-1.5 block text-note leading-relaxed text-[var(--color-text-on-inverse-muted)]">
              {t("pilot.spotsPanelInvitation", locale)}
            </span>
          </span>
          <span className="ml-auto inline-flex min-h-11 shrink-0 items-center gap-1 text-sm font-semibold text-[var(--color-layer-team-badge)]">
            {t("pilot.spotsPanelCta", locale)}
            <ChevronRightIcon className="h-4 w-4" />
          </span>
        </span>
      </a>
      <span
        role="progressbar"
        aria-label={t("pilot.spotsProgressLabel", locale)}
        aria-valuemin={0}
        aria-valuemax={PILOT_TOTAL_TEAMS}
        aria-valuenow={taken}
        aria-valuetext={tf("pilot.spotsProgressValue", locale, vars)}
        className="mt-5 block h-[5px] overflow-hidden rounded-full bg-[var(--color-text-on-inverse)]/25"
      >
        <span
          className="block h-full rounded-full bg-[var(--color-layer-team-badge)]"
          style={{ width: `${(taken / PILOT_TOTAL_TEAMS) * 100}%` }}
        />
      </span>
      <span className="mt-2.5 flex justify-between gap-4 text-note leading-relaxed text-[var(--color-text-on-inverse-muted)]">
        <span>{tf("pilot.spotsPanelTaken", locale, vars)}</span>
        <span className="text-right">{tf("pilot.spotsPanelTotal", locale, vars)}</span>
      </span>
    </div>
  );
}
