/**
 * HÍRLEVÉL-LINKÉPÍTŐK — tiszta függvények, `server-only` NÉLKÜL.
 *
 * MIÉRT KÜLÖN MODUL (2026-08-21): ezek csak sztringet raknak össze — se DB, se
 * titok. A `newsletter.ts` viszont `server-only`, ezért onnan a Playwright
 * (és bármilyen nem-RSC futtató) nem tudja importálni őket. Ez pont a
 * route-regressziós tesztet lehetetlenítette el: a teszt kénytelen lett volna
 * kézzel másolt útvonalat használni — vagyis épp azt nem ellenőrizné, hogy a
 * levélbe írt URL feloldható-e.
 *
 * A `newsletter.ts` re-exportálja mindet, így a hívási helyek változatlanok.
 */

/** Embernek látható leiratkozó link: GET csak megerősítő oldalt nyit. */
export function unsubscribeUrl(appUrl: string, unsubToken: string): string {
  return `${appUrl.replace(/\/+$/, "")}/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
}

/** RFC 8058: ezt a POST-végpontot tesszük a List-Unsubscribe fejlécbe. */
export function unsubscribePostUrl(appUrl: string, unsubToken: string): string {
  return `${appUrl.replace(/\/+$/, "")}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubToken)}`;
}

/**
 * Kattintás-követő link a levélbeli cikk-hivatkozásokhoz.
 *
 * A `to` a cikk SLUGJA, nem teljes URL – a cél-URL-t a végpont építi fel a
 * publikált cikkek közül. Így a paraméter nem tud nyílt átirányítássá válni.
 */
export function clickUrl(appUrl: string, deliveryId: string, slug: string): string {
  const base = appUrl.replace(/\/+$/, "");
  return `${base}/api/newsletter/click?d=${encodeURIComponent(deliveryId)}&to=${encodeURIComponent(slug)}`;
}

/** A megerősítő link – a double opt-in levél egyetlen gombja. */
export function confirmUrl(appUrl: string, confirmToken: string): string {
  return `${appUrl.replace(/\/+$/, "")}/newsletter/confirm?token=${encodeURIComponent(confirmToken)}`;
}

/**
 * A cikk borítója a levélben – STABIL, nem build-hashelt route-ról.
 *
 * NE a blog `…/opengraph-image` útját használd: azt a Next build-generált
 * utótaggal szolgálja ki, az utótag nélküli alak 404 (mérve; a
 * `blog/[slug]/page.tsx` JSON-LD-megjegyzése is ezt rögzíti). A levél
 * hónapokkal a küldés után tölti be a képet, ezért kell neki saját route.
 */
export function blogImageUrl(appUrl: string, slug: string): string {
  return `${appUrl.replace(/\/+$/, "")}/api/newsletter/cover/${encodeURIComponent(slug)}`;
}
