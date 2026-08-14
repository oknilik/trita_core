/**
 * A kérdésbank dimenzió-leírása két részből áll: egy definíciós mondatból és
 * egy facet-felsorolásból („Négy facetje …" / „Its four facets are …"). A
 * publikus, megosztott nézet csak a definíciót adja ki — a facet-lista ott
 * zaj, a facetek amúgy is strukturáltan élnek (`dimension.facets`).
 *
 * A szétvágás SZÖVEGHEZ kötött, ezért nem a megjelenítőben él: a markert egy
 * helyen tartjuk, és unit-teszt őrzi, hogy a bank mind a hat dimenziójában,
 * mindkét nyelven megvan (tests/unit/results/dimension-description.test.ts).
 * Ha egy leírás átfogalmazása elveszíti a markert, a teszt bukik — nem a
 * publikus oldalra csúszik ki némán a teljes facet-felsorolás.
 */

const FACET_MARKERS = [" Négy facetje ", " Its four facets "] as const;

/** A leírás definíciós fele (facet-felsorolás nélkül). */
export function dimensionDefinition(description: string): string {
  for (const marker of FACET_MARKERS) {
    const index = description.indexOf(marker);
    if (index >= 0) return description.slice(0, index).trim();
  }
  return description.trim();
}

/** Teszt-guardrail: felismerhető-e a facet-felsorolás a leírásban. */
export function hasFacetMarker(description: string): boolean {
  return FACET_MARKERS.some((marker) => description.includes(marker));
}
