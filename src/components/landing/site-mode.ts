"use client";

import { useSyncExternalStore } from "react";

export type SiteMode = "self" | "team";

export const SELF_LANDING_PATH = "/self-awareness";
export const TEAM_LANDING_PATH = "/team-dynamics";

/**
 * Landing self/team mód — URL-alapú, de `useSearchParams()` NÉLKÜL.
 *
 * Miért: a `useSearchParams()` egy statikusan prerenderelt oldalon
 * BAILOUT_TO_CLIENT_SIDE_RENDERING-et vált ki a legközelebbi Suspense
 * határig. A landingen ez a teljes oldalt jelentette: a build-elt HTML
 * `<main>`-je ÜRES volt, a hero H1 (az LCP-elem) csak a JS letöltése +
 * hidratálás után született meg → 7.0 s LCP.
 *
 * A `useSyncExternalStore` szerver-snapshotját az oldal adja át, a kliens-
 * snapshot pedig az útvonalból olvas. Így a /self-awareness és a
 * /team-dynamics is a saját H1-ével kerül a statikus HTML-be, miközben a
 * főoldali egyszeri tab-bemutató RSC-kérés nélkül tud módot váltani.
 */

const listeners = new Set<() => void>();
let previewMode: SiteMode | null = null;

function subscribe(onStoreChange: () => void): () => void {
  listeners.add(onStoreChange);
  window.addEventListener("popstate", onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
    window.removeEventListener("popstate", onStoreChange);
  };
}

function getSnapshot(): SiteMode {
  if (previewMode) return previewMode;
  if (window.location.pathname === TEAM_LANDING_PATH) return "team";
  if (window.location.pathname === SELF_LANDING_PATH) return "self";
  return new URLSearchParams(window.location.search).get("mode") === "team" ? "team" : "self";
}

const getSelfServerSnapshot = (): SiteMode => "self";
const getTeamServerSnapshot = (): SiteMode => "team";

export function useSiteMode(initialMode: SiteMode = "self"): SiteMode {
  return useSyncExternalStore(
    subscribe,
    getSnapshot,
    initialMode === "team" ? getTeamServerSnapshot : getSelfServerSnapshot,
  );
}

/**
 * A főoldali automatikus tab-bemutató átmeneti módja. Nem ír URL-t, így nem
 * generál hamis oldalmegtekintést az analitikában. A kézi váltás valódi Next
 * Linket használ, hogy mindkét landing URL bejárható és indexelhető maradjon.
 */
export function setSiteModePreview(mode: SiteMode | null): void {
  previewMode = mode;
  for (const listener of listeners) listener();
}
