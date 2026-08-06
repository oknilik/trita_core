/**
 * Az adatkezelő (cég) azonosító adatai — a jogi oldalak EGYETLEN forrása.
 *
 * ⚠️ FIGYELEM — PLACEHOLDER ADATOK ⚠️
 * A cégnév, székhely, cégjegyzékszám, adószám és a képviselő MÉG NEM VALÓS.
 * Amíg a `LEGAL_DOCS_ARE_DRAFT` értéke `true`, az adatvédelmi tájékoztató
 * látható „tervezet" jelölést kap — mert egy joginak látszó, de kitalált
 * cégadatokat közlő oldal félrevezeti az érintettet, és a GDPR 13. cikke
 * szerinti tájékoztatási kötelezettséget sem teljesíti.
 *
 * ÉLESÍTÉS (egy menetben, ebben a fájlban):
 *   1. valós cégadatok bevezetése lentebb,
 *   2. a `privacyEmail` postafiók tényleges létrehozása,
 *   3. `LEGAL_DOCS_ARE_DRAFT = false`,
 *   4. a tájékoztató `lastUpdated` / `effectiveFrom` dátumának frissítése
 *      (`src/lib/legal/privacy-policy.ts`).
 *
 * A `hello@trita.io` cím VALÓS és él (a /contact oldalon is ez szerepel) —
 * ezért a tájékoztató érdemi elérhetőségként ezt adja meg; a `privacyEmail`
 * addig ugyanide mutat, amíg dedikált postafiók nem készül.
 */

export const LEGAL_DOCS_ARE_DRAFT = true;

export const COMPANY = {
  /** Teljes cégnév (placeholder). */
  legalName: "Trita Technologies Kft.",
  /** Rövid, márkanév. */
  brandName: "Trita",
  /** Székhely (placeholder). */
  address: "1075 Budapest, Példa utca 12. 3. em. 4.",
  /** Cégjegyzékszám (placeholder). */
  registrationNumber: "01-09-999999",
  /** Adószám (placeholder). */
  taxNumber: "99999999-2-42",
  /** Képviselő (placeholder). */
  representative: "Példa Péter ügyvezető",
  /** Valós, élő kapcsolati cím. */
  contactEmail: "hello@trita.io",
  /** Adatvédelmi ügyekre — jelenleg a fenti postafiókra fut be. */
  privacyEmail: "hello@trita.io",
  /** Adatvédelmi tisztviselő: nem kötelező és nincs kijelölve (ld. GDPR 37. cikk). */
  hasDataProtectionOfficer: false,
} as const;

/**
 * A NAIH (felügyeleti hatóság) nyilvános elérhetőségei — a GDPR 13. cikk
 * (2) d) pontja szerint kötelező feltüntetni a panasztételi jogot és a
 * hatóságot. Ezek VALÓS, nyilvános adatok.
 */
export const SUPERVISORY_AUTHORITY = {
  name: "Nemzeti Adatvédelmi és Információszabadság Hatóság (NAIH)",
  nameEn: "Hungarian National Authority for Data Protection and Freedom of Information (NAIH)",
  address: "1055 Budapest, Falk Miksa utca 9-11.",
  postalAddress: "1363 Budapest, Pf. 9.",
  phone: "+36 1 391 1400",
  email: "ugyfelszolgalat@naih.hu",
  website: "https://naih.hu",
} as const;
