// ─────────────────────────────────────────────────────────────────────
// Magyar nyelvtani segédek — jelenleg: határozott névelő feloldása.
//
// Kontextus (riport-javítási terv 2026-07, P1.2): a user-facing
// szövegekben több helyen „a(z) {név}" sablon szerepelt, ami feloldatlan
// template-műtermékként jelent meg a riportban („a(z) nyitottság").
// A hívó a lokalizált nevet ezen a helperen átfuttatva már kész,
// helyes névelős kifejezést ad át az i18n sablonnak.
// ─────────────────────────────────────────────────────────────────────

const HU_VOWELS = new Set("aáeéiíoóöőuúüűAÁEÉIÍOÓÖŐUÚÜŰ");

/** „a" vagy „az" a kifejezés első hangja alapján. */
export function huArticle(phrase: string): "a" | "az" {
  const first = phrase.trim().charAt(0);
  return HU_VOWELS.has(first) ? "az" : "a";
}

/**
 * A kifejezés határozott névelővel: „integritás" → „az integritás",
 * „tervezettség" → „a tervezettség". `capitalize` mondatkezdő
 * pozícióhoz: „Az integritás".
 */
export function withHuArticle(
  phrase: string,
  options?: { capitalize?: boolean },
): string {
  const trimmed = phrase.trim();
  if (!trimmed) return trimmed;
  const article = huArticle(trimmed);
  const resolved = options?.capitalize
    ? article.charAt(0).toUpperCase() + article.slice(1)
    : article;
  return `${resolved} ${trimmed}`;
}
