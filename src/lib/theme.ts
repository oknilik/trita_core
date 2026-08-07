// Színséma — közös típusok és a festés előtt futó script.
//
// HATÓKÖR: az egész dokumentum. Részleges (csak app-fa) hatókört
// megpróbáltunk — CSS-szemantikailag nem működik: a `--color-x:
// var(--palette-x)` aliasok a :root-on vannak deklarálva, és a var() a
// DEKLARÁLÓ elemen helyettesítődik be, tehát egy leszármazottra tett
// --palette-* felülírás az alias-réteget nem éri el (méréssel igazolva).
// Ezért a sötét blokk a :root[data-theme="dark"]-on ül, és a
// marketing-fa is átfordul — a paper-téma is kapott sötét készletet.
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
 * A festés ELŐTT futó, blokkoló script a <head>-ben.
 *
 * Miért nem szerver-oldalon: a gyökér-layout süti-olvasása az EGÉSZ
 * marketing-fát dinamikussá tenné (a statikus render elveszne). Ez a
 * ~400 bájt viszont még az első festés előtt lefut, tehát nincs
 * téma-villanás — és a marketing-oldalakon nincs hatása, mert ott nincs
 * `.theme-scope`.
 *
 * Hibatűrés: bármi hiba esetén némán világos marad (try/catch).
 */
export const THEME_INIT_SCRIPT = `(function(){try{
var m=document.cookie.match(/(?:^|;\\s*)${THEME_COOKIE}=([^;]*)/);
var p=m?decodeURIComponent(m[1]):"${DEFAULT_THEME}";
if(p!=="light"&&p!=="dark"){p=window.matchMedia&&window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";}
document.documentElement.setAttribute("data-theme",p);
}catch(e){}})();`;
