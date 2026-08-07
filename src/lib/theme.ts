// Színséma — közös típusok és a festés előtt futó script.
//
// HATÓKÖR: a `.theme-scope` osztály, amit MINDEN route-csoport shellje
// felvesz — (app), (marketing) és (auth) —, plusz a gyökér-hibahatár. Így a
// landing, a blog, az árazás és a belépő is követi a színsémát.
// (Az első körben csak az app-fa kapta meg; a marketing akkor törött volt
// sötéten. A 2026-08-07-i UX-audit tokenizálta a maradékot, azóta él a
// teljes hatókör. Guard: scripts/check-colors.mjs (h).)
//
// A leszármazott-hatókörnek ára van: a `--color-x: var(--palette-x)` aliasok
// a :root-on vannak deklarálva, és a var() a DEKLARÁLÓ elemen
// helyettesítődik be — ezért a scope-elemen MINDKÉT réteget újra kell
// deklarálni (globals.css sötét blokkja). A szinkront a
// scripts/check-colors.mjs (d) ellenőrzése őrzi, kétirányban.
//
// Indoklás és a hátralévő lépések:
// docs/development/dark-mode-feasibility-2026-08.md

export const THEME_PREFERENCES = ["system", "light", "dark"] as const;
export type ThemePreference = (typeof THEME_PREFERENCES)[number];

/** A ténylegesen kirajzolt séma — a "system" ebből az egyikre oldódik fel. */
export type ResolvedTheme = "light" | "dark";

export const THEME_COOKIE = "trita_theme";
export const DEFAULT_THEME: ThemePreference = "system";

/** Egy évig él — a `trita_locale` preferencia-süti mintájára. */
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function normalizeTheme(value: string | undefined | null): ThemePreference {
  return THEME_PREFERENCES.includes(value as ThemePreference)
    ? (value as ThemePreference)
    : DEFAULT_THEME;
}

/**
 * A böngésző-króm (mobil címsáv / státuszsáv) színe sémánként. Ugyanaz a két
 * érték, mint a `--background` a globals.css-ben — ott a vászon, itt a
 * böngésző felülete; a kettőnek egyeznie kell, különben látszik a varrat.
 */
export const THEME_BROWSER_CHROME: Record<ResolvedTheme, string> = {
  light: "#f7f4ef",
  dark: "#141418",
};

/**
 * A festés ELŐTT futó, blokkoló script a <head>-ben.
 *
 * Miért nem szerver-oldalon: a gyökér-layout süti-olvasása az EGÉSZ
 * marketing-fát dinamikussá tenné (a statikus render elveszne). Ez a
 * ~400 bájt viszont még az első festés előtt lefut, tehát nincs
 * téma-villanás.
 *
 * Ennek AZ ÁRA, hogy a szerver-HTML-ben nincs `data-theme`, a kliensen meg
 * van — a gyökér-layout `<html>` eleme ezért kap `suppressHydrationWarning`-ot.
 *
 * A `theme-color` metát is INNEN tesszük ki: a mobil címsáv színét a
 * böngésző az első festéskor olvassa. A Next `viewport.themeColor` exportja
 * csak `prefers-color-scheme`-mel tud médiát adni — a mi témánk viszont
 * SÜTI-vezérelt, tehát az a rendszertől eltérő választásnál hazudna.
 *
 * Hibatűrés: bármi hiba esetén némán világos marad (try/catch).
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);
var p=m?decodeURIComponent(m[1]):"${DEFAULT_THEME}";
if(p!=="light"&&p!=="dark"){p=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}
document.documentElement.setAttribute("data-theme",p);
var t=document.createElement("meta");
t.name="theme-color";t.content=p==="dark"?"${THEME_BROWSER_CHROME.dark}":"${THEME_BROWSER_CHROME.light}";
document.head.appendChild(t);
}catch(e){}})();`;
