"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronRightIcon } from "@/components/ui/icons";
import { track } from "@/lib/analytics/client";
import { t, tf, type Locale } from "@/lib/i18n/public";
import { PILOT_SPOTS_LEFT, PILOT_TOTAL_TEAMS } from "@/lib/pilot-config";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

type SpotsPhase = "rest" | "play" | "idle";

/**
 * Közös pilot-kapacitásjelző a publikus oldalakon. A helyek és a szöveg
 * ugyanabból a forrásból érkeznek, ezért a /pilot és /how-we-work jelzése
 * mindig együtt frissül.
 */
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
  surface: "pilot" | "pricing";
  className?: string;
}) {
  const cardRef = useRef<HTMLAnchorElement>(null);
  const [phase, setPhase] = useState<SpotsPhase>("rest");
  const [count, setCount] = useState(PILOT_SPOTS_LEFT);

  useEffect(() => {
    const card = cardRef.current;
    if (!card || PILOT_SPOTS_LEFT <= 0) return;
    if (
      typeof IntersectionObserver === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    let timers: number[] = [];
    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        observer.disconnect();
        setPhase("play");
        setCount(PILOT_TOTAL_TEAMS);
        for (let n = PILOT_TOTAL_TEAMS - 1; n >= PILOT_SPOTS_LEFT; n -= 1) {
          const step = PILOT_TOTAL_TEAMS - n;
          timers.push(window.setTimeout(() => setCount(n), 550 + step * 190));
        }
        timers.push(window.setTimeout(() => setPhase("idle"), 2800));
      },
      { threshold: 0.6 },
    );
    observer.observe(card);

    return () => {
      observer.disconnect();
      timers.forEach((id) => window.clearTimeout(id));
      timers = [];
    };
  }, []);

  if (PILOT_SPOTS_LEFT <= 0) return null;

  const taken = PILOT_TOTAL_TEAMS - PILOT_SPOTS_LEFT;
  const vars = { total: PILOT_TOTAL_TEAMS, left: PILOT_SPOTS_LEFT, taken };

  return (
    <a
      ref={cardRef}
      href={href}
      data-pilot-spots
      data-pilot-spots-phase={phase}
      aria-label={tf("pilot.spotsA11y", locale, vars)}
      onClick={() => track("cta.click", { cta_id: ctaId, surface })}
      className={`group relative grid max-w-[600px] grid-cols-[auto_minmax(0,1fr)] items-center gap-4 overflow-hidden rounded-[22px] bg-gradient-to-br from-[var(--color-layer-team-hero-from)] to-[var(--color-layer-team-hero-to)] p-4 text-[var(--color-text-on-inverse)] shadow-[0_18px_44px_color-mix(in_srgb,var(--color-layer-team-hero-to)_22%,transparent)] transition-[translate,box-shadow,filter] duration-200 hover:-translate-y-0.5 hover:brightness-[1.04] hover:shadow-[0_24px_56px_color-mix(in_srgb,var(--color-layer-team-hero-to)_28%,transparent)] sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:gap-5 sm:p-5 ${FOCUS_RING_CLASS} ${className}`}
    >
      <span className="shrink-0 font-fraunces text-display leading-none tracking-[-0.06em] text-[var(--color-layer-team-badge)] tabular-nums md:text-hero">
        {count}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-[var(--color-text-on-inverse)] sm:text-base">
          {tf("pilot.spotsPanelTitle", locale, vars)}
        </span>
        <span className="mt-1 block text-note leading-relaxed text-[var(--color-text-on-inverse-muted)]">
          {tf("pilot.spotsPanelUrgency", locale, vars)}
        </span>
        <span aria-hidden="true" className="mt-5 grid grid-cols-10 gap-1.5">
          {Array.from({ length: PILOT_TOTAL_TEAMS }, (_, i) => (
            <span
              key={i}
              data-pilot-spot={i < taken ? "taken" : i === taken ? "next" : "open"}
              data-pilot-spot-effect={i === taken ? "star-arrival" : undefined}
              style={{ ["--i" as string]: i }}
              className={
                i < taken
                  ? "pilot-spot h-1.5 rounded-full bg-[var(--color-text-on-inverse)]/25"
                  : i === taken
                    ? "pilot-spot pilot-spot-next h-1.5 rounded-full bg-[var(--color-layer-team-badge)]"
                    : "pilot-spot pilot-spot-open h-1.5 rounded-full bg-[var(--color-layer-team-badge)]"
              }
            />
          ))}
        </span>
      </span>
      <span className="col-span-2 inline-flex shrink-0 items-center justify-self-end gap-1 text-sm font-semibold text-[var(--color-layer-team-badge)] sm:col-span-1">
        {t("pilot.spotsPanelCta", locale)}
        <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </span>
    </a>
  );
}
