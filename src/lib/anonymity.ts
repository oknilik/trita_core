// ─────────────────────────────────────────────────────────────────────
// A termék ANONIMITÁS-PADLÓJA — EGYETLEN igazságforrás.
//
// Ennyi különböző értékelő/kitöltő kell egy anonimizált aggregátum
// megjelenítéséhez. Ez alatt egy egyéni válasz közvetve is visszafejthető
// lenne (két értékelőnél a kitöltő félig beazonosítható), ami visszahat az
// őszinteségre — ezért az aggregátorok küszöb alatt SZÁNDÉKOSAN null-t adnak.
//
// A domain-nevű konstansok (observer-reveal, trust-kör, peer-szerep,
// pszichológiai biztonság, org-szintű aggregátum) erre hivatkoznak, így a
// padló egyetlen helyen emelhető. Prisma-mentes, kliens-oldalon is
// importálható — a hivatkozó tiszta modulok emiatt maradhatnak azok.
// ─────────────────────────────────────────────────────────────────────

export const MIN_RATERS_FOR_ANONYMOUS_AGGREGATE = 3;
