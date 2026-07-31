// Karrier-modul kereslet-mérés (painted door).
//
// A karrier-modul még NEM kész: a `/career` a működő iránytű helyett az
// ajánlót mutatja. Azt mérjük, van-e rá igény és milyen áron — becsületesen:
// az oldal kimondja, hogy készül, nincs fizetési folyamat, és bankkártya-
// adatot sehol nem kérünk.
//
// A mérés HÁROM lépcsős, hogy a lemorzsolódás látszódjon:
//   1. `cta_view`  — látta az ajánlót a riport-oldal alján
//   2. `page_view` — átkattintott a karrier-oldalra
//   3. `choice`    — nyilatkozott: érdekli (rating 1) vagy nem (rating 0)
//
// Tárolás a meglévő generikus `Feedback` modellben (`kind` + `targetKey` +
// `rating`) — nincs új tábla, és az admin-felület már tud ilyet listázni.

export const CAREER_PROBE_KIND = "career_deep_probe";

export const CAREER_PROBE_STEPS = ["cta_view", "page_view", "choice"] as const;
export type CareerProbeStep = (typeof CAREER_PROBE_STEPS)[number];

export function isCareerProbeStep(value: string): value is CareerProbeStep {
  return (CAREER_PROBE_STEPS as readonly string[]).includes(value);
}

/**
 * Kész-e a karrier-modul. false = a `/career` az AJÁNLÓT mutatja a
 * működő iránytű helyett; a modul kódja érintetlenül a helyén marad.
 *
 * ÉLESÍTÉS: állítsd true-ra — a `/career` visszakapja a CareerCompass-t, a
 * kereslet-mérés magától kikapcsol (a mért adat megmarad).
 */
export const CAREER_MODULE_READY = false;

/**
 * Kereslet-mérés kapcsolója. Csak addig fut, amíg a modul nincs kész —
 * utána nincs mit mérni.
 */
export const CAREER_PROBE_ENABLED = !CAREER_MODULE_READY;

/**
 * A kimondott ár. Szándékosan EGY konstans: a mérés lényege, hogy ezt az
 * árat lássa a felhasználó, amikor nyilatkozik — ha változtatod, a korábbi
 * válaszok más kérdésre adott válaszok, és külön kell őket kezelni.
 *
 * A 9 900 Ft munkahipotézis: a fizetési súrlódást még megéri (a néhány ezres
 * sávban a számlázás adminja többe kerül, mint a bevétel), de még nem
 * tanácsadói csomag-kategória — ott már embert is várna mellé a vevő.
 */
export const CAREER_PROBE_PRICE_HUF = 9900;

/** Az ár-verzió a válaszok mellé kerül: árváltásnál elkülöníthető a két minta. */
export const CAREER_PROBE_PRICE_VERSION = "v1-9900";
