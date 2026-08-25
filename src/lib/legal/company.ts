/**
 * Az adatkezelő (cég) azonosító adatai — a jogi oldalak EGYETLEN forrása.
 * A nyilvános cégadatok forrása a Nemzeti Cégtár, ellenőrizve: 2026-08-25.
 *
 * A `hello@trita.io` cím VALÓS és él (a /contact oldalon is ez szerepel) —
 * ezért a tájékoztató érdemi elérhetőségként ezt adja meg; a `privacyEmail`
 * addig ugyanide mutat, amíg dedikált postafiók nem készül.
 */

export const COMPANY = {
  /** Rövidített, bejegyzett cégnév. */
  legalName: "OKNILIK Kft.",
  /** Rövid, márkanév. */
  brandName: "Trita",
  /** Székhely. */
  address: "7632 Pécs, Tüskésréti út 5.",
  /** Cégjegyzékszám. */
  registrationNumber: "02-09-086218",
  /** Adószám. */
  taxNumber: "27455764-2-02",
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
