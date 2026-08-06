"use client";

import { useSyncExternalStore } from "react";

export type SiteMode = "self" | "team";

/**
 * Landing self/team mód — URL-alapú, de `useSearchParams()` NÉLKÜL.
 *
 * Miért: a `useSearchParams()` egy statikusan prerenderelt oldalon
 * BAILOUT_TO_CLIENT_SIDE_RENDERING-et vált ki a legközelebbi Suspense
 * határig. A landingen ez a teljes oldalt jelentette: a build-elt HTML
 * `<main>`-je ÜRES volt, a hero H1 (az LCP-elem) csak a JS letöltése +
 * hidratálás után született meg → 7.0 s LCP.
 *
 * A `useSyncExternalStore` szerver-snapshotja "self" (ez kerül a statikus
 * HTML-be), a kliens-snapshot az URL-ből olvas. Így a landing prerenderelhető
 * marad, a `?mode=team` mélylink pedig hidratálás után áll be — React által
 * támogatott módon, hydration-mismatch nélkül.
 */

const listeners = new Set<() => void>();

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getSnapshot(): SiteMode {
  return new URLSearchParams(window.location.search).get("mode") === "team"
    ? "team"
    : "self";
}

function getServerSnapshot(): SiteMode {
  return "self";
}

export function useSiteMode(): SiteMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

/**
 * Módváltás: az URL-t natív `history.replaceState`-tel frissítjük (a Next
 * router ezt hivatalosan támogatja, és nem indít RSC-kérést), majd értesítjük
 * a feliratkozókat. `replace` — a korábbi `router.replace` viselkedés:
 * a váltás nem hagy history-bejegyzést.
 */
export function setSiteMode(mode: SiteMode): void {
  const url = new URL(window.location.href);
  url.searchParams.set("mode", mode);
  window.history.replaceState(window.history.state, "", url);
  for (const listener of listeners) listener();
  // A korábbi `router.replace(..., { scroll: true })` a lap tetejére ugrott.
  window.scrollTo({ top: 0 });
}
