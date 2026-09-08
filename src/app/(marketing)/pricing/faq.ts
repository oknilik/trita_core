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

/** /pricing — csak az árról: mennyibe kerül, mit tartalmaz, mitől függ, fizetés, több csapat, kedvezmény, mi ingyenes. */
export const PRICING_PAGE_FAQ_INDEXES = [1, 2, 9, 10, 11, 12, 4] as const;

/** /team-dynamics — a programról: indulás, ki látja, időigény, ha valaki nem tölti ki, módszertan. */
export const TEAM_PAGE_FAQ_INDEXES = [3, 5, 6, 7, 8] as const;
