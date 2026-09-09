/**
 * A GYIK-tételek sorszámai (i18n-kulcs: `pricing.faqQ<n>` / `pricing.faqA<n>`).
 *
 * MIÉRT KÜLÖN, KERETMENTES MODUL: a szerver-oldali `page.tsx` és a kliens-
 * oldali `FaqList` is ebből dolgozik — a szerver a FAQPage strukturált
 * adatot építi belőle, a kliens a látható GYIK-et. Egy `"use client"`
 * modulból importált érték a szerveren NEM a valódi érték, hanem kliens-
 * referencia proxy (a build a `.map is not a function` hibán bukik el),
 * ezért a közös adatnak keretmentes modulban a helye.
 *
 * A Google FAQ-irányelve szerint a JSON-LD-ben szereplő kérdés-válasznak
 * láthatónak kell lennie az oldalon — egy forrás, hogy ne csúszhasson szét:
 * új GYIK-tétel = új i18n-kulcs + egy szám az egyik tömbben.
 *
 * 2026-09-08: két oldal két GYIK-je ugyanabból a kulcstérből. Az árról
 * szóló tételek az /pricing oldalon, a programról szólók a /team-dynamics
 * oldalon élnek — egy kérdés csak egy helyen.
 */

import { referencePerHead } from "@/lib/pricing/team-ladder";
import type { Locale } from "@/lib/i18n/core";
import { PILOT_TOTAL_TEAMS } from "@/lib/pilot-config";
import { formatMoney } from "@/lib/pricing/fx";
import { PUBLIC_HEADCOUNT_MAX, type PublicLadder } from "@/lib/pricing/team-ladder";

/**
 * A GYIK válaszaiba behelyettesített számok — egy helyen, hogy a szerver
 * (JSON-LD) és a kliens (FaqList) azonos szöveget adjon. Itt, és nem a
 * kliens-komponensben: egy `"use client"` modulból exportált függvény a
 * szerveren nem hívható (a build elhasal rajta).
 */
export function pricingFaqVars(ladder: PublicLadder, locale: Locale = "hu"): Record<string, string | number> {
  return {
    // Pénznemmel együtt (hu: „35 000 Ft", en: „€88"): az angol felület
    // euróban, a napi középárfolyamon mutatja a forint-árat.
    kepBase: formatMoney(referencePerHead(ladder, "kep"), locale, ladder.fx),
    progBase: formatMoney(referencePerHead(ladder, "prog"), locale, ladder.fx),
    kepTeam: formatMoney(ladder.tiers.kep.teamBaseFee, locale, ladder.fx),
    progTeam: formatMoney(ladder.tiers.prog.teamBaseFee, locale, ladder.fx),
    band: ladder.firstBandHeads,
    // A sáv feletti díj ma mindkét csomagnál azonos; ha valaha eltérnek, a
    // GYIK a magasabbat mondja, hogy ne ígérjünk a valóságosnál olcsóbbat.
    over: formatMoney(
      Math.max(ladder.tiers.kep.perHeadOver, ladder.tiers.prog.perHeadOver),
      locale,
      ladder.fx,
    ),
    max: PUBLIC_HEADCOUNT_MAX,
    total: PILOT_TOTAL_TEAMS,
    pct: ladder.pilotDiscountPct,
  };
}

/** /pricing — csak az árról: mennyibe kerül, mit tartalmaz, mitől függ, fizetés, több csapat, kedvezmény, mi ingyenes. */
export const PRICING_PAGE_FAQ_INDEXES = [1, 2, 9, 10, 11, 12, 4] as const;

/** /team-dynamics — a programról: indulás, ki látja, időigény, ha valaki nem tölti ki, módszertan. */
export const TEAM_PAGE_FAQ_INDEXES = [3, 5, 6, 7, 8] as const;
