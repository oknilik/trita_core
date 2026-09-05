/**
 * A /team-dynamics pillar GYIK- és fogalomtár-tételeinek sorszámai
 * (i18n-kulcs: `teamDynamics.faqQ<n>` / `faqA<n>`, `term<n>Name` / `term<n>Desc`).
 *
 * MIÉRT KÜLÖN, KERETMENTES MODUL: a `page.tsx` (szerver) a FAQPage és a
 * DefinedTermSet JSON-LD-t építi belőle, a `"use client"` komponensek a
 * látható szekciókat. Egy `"use client"` modulból importált érték a szerveren
 * kliens-referencia proxy lenne (ld. `pricing/faq.ts`), ezért a közös adatnak
 * keretmentes modulban a helye.
 *
 * A Google irányelve szerint a JSON-LD-ben szereplő kérdés-válasznak és
 * fogalomnak LÁTHATÓNAK kell lennie az oldalon — egy forrás, hogy ne
 * csúszhasson szét: új tétel = új i18n-kulcs + egy szám ebben a tömbben.
 */
export const TEAM_FAQ_INDEXES = [1, 2, 3, 4, 5, 6] as const;

export const TEAM_TERM_INDEXES = [1, 2, 3, 4, 5, 6] as const;
