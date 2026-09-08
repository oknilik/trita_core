"use client";

import Link from "next/link";
import { ChevronRightIcon } from "@/components/ui/icons";
import { track } from "@/lib/analytics/client";
import { t, tf, type Locale } from "@/lib/i18n/public";
import { formatHuf, ladderEntryPerHead, type PublicLadder } from "@/lib/pricing/team-ladder";
import { FOCUS_RING_CLASS } from "@/lib/ui/focus";

/**
 * Ár-horgony: krém árkártya egyetlen belépő számmal („35 000 Ft / fő-től*"),
 * csillagos lábjegyzettel és „Részletes árak" linkkel az /pricing oldalra.
 *
 * A /team-dynamics ár-szekciójában él (a főoldal csapat-blokkjáról
 * 2026-09-08-án lekerült: ott nem kell ár). A szám a díjkártyából jön
 * (`ladder`), a „-től" a szintekre vonatkozik: a belépő szint fejenkénti
 * ára, ami a sávon belül a legalacsonyabb is.
 */
export function PriceAnchorCard({
  ladder,
  locale,
  ctaId,
  surface,
  className = "",
}: {
  ladder: PublicLadder;
  locale: Locale;
  /** Analitika: melyik felületről kattintanak az árakra. */
  ctaId: string;
  surface: string;
  className?: string;
}) {
  const entry = ladderEntryPerHead(ladder);
  return (
    <div
      data-price-anchor
      className={`flex max-w-[440px] flex-col gap-1.5 rounded-2xl bg-cream px-5 py-4 text-ink shadow-[0_14px_34px_rgba(0,0,0,0.22)] ${className}`}
    >
      <p className="text-micro font-semibold uppercase tracking-wide text-[var(--color-layer-team-accent)]">
        {t("landing.teamPriceLead", locale)}
      </p>
      <p className="flex items-baseline gap-x-2">
        <span className="font-fraunces text-display leading-none tabular-nums text-[var(--color-layer-team-accent)]">
          {formatHuf(entry.perHead)}
        </span>
        <span className="text-sm text-ink-body">{t("landing.teamPriceFrom", locale)}</span>
      </p>
      {/* Nincs csillag és nettó-lábjegyzet (2026-09-08): az ÁFA az ár mellett áll. */}
      <p className="max-w-[46ch] text-note leading-relaxed text-ink-body">
        {tf("landing.teamPriceFootnote", locale, { band: ladder.firstBandHeads })}
      </p>
      <Link
        href="/pricing"
        onClick={() => track("cta.click", { cta_id: ctaId, surface, mode: "team" })}
        className={`group mt-1 inline-flex min-h-[44px] items-center gap-1 self-start rounded-lg text-sm font-semibold text-[var(--color-layer-team-accent)] transition-opacity hover:opacity-80 ${FOCUS_RING_CLASS}`}
      >
        {t("landing.teamPriceDetails", locale)}
        <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}
