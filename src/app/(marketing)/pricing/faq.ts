/**
 * A GYIK-tételek sorszámai (i18n-kulcs: `pricing.faqQ<n>` / `pricing.faqA<n>`).
 *
 * MIÉRT KÜLÖN, KERETMENTES MODUL: a `page.tsx` (szerver) és a
 * `PricingContent.tsx` (`"use client"`) is ebből dolgozik — a szerver a
 * FAQPage strukturált adatot építi belőle, a kliens a látható GYIK-et. Egy
 * `"use client"` modulból importált érték a szerveren NEM a valódi érték,
 * hanem kliens-referencia proxy (a build a `.map is not a function` hibán
 * bukik el), ezért a közös adatnak keretmentes modulban a helye.
 *
 * A Google FAQ-irányelve szerint a JSON-LD-ben szereplő kérdés-válasznak
 * láthatónak kell lennie az oldalon — egy forrás, hogy ne csúszhasson szét:
 * új GYIK-tétel = új i18n-kulcs + egy szám ebben a tömbben.
 */
// Sorrend, nem sorszám: az 5-ös (Ki látja az egyéni eredményeket?) a
// „Mennyibe kerül?" mellé, a második helyre kerül (P0-4).
export const PRICING_FAQ_INDEXES = [1, 5, 2, 3, 4] as const;
