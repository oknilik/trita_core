import { readFileSync } from "node:fs";
import { join } from "node:path";

// Token-feloldó a globals.css-hez — a design-teszteknek közös alap.
//
// A színek két rétegben élnek (ld. color-system-2026-08.md 0/a.):
//   --palette-*  a nyers értékek (sima :root, ez a témázható réteg),
//   --color-*    a @theme szerep-tokenek, amik ide hivatkoznak.
// A feloldás végigmegy a láncon, amíg hexet nem kap:
//   --color-surface-canvas → --color-cream → --palette-cream → #f7f4ef
//
// A `theme` paraméter azt választja meg, MELYIK értékkészlet érvényes: a
// sötét téma ugyanazokat a --palette-* neveket írja felül egy
// :root[data-theme="dark"] blokkban. Ha az még nem létezik, a
// `hasTheme("dark")` hamis — a hívó teszt ilyenkor kihagyja magát.

export type ThemeName = "light" | "dark";

const CSS_PATH = join(process.cwd(), "src/app/globals.css");
const CSS = readFileSync(CSS_PATH, "utf8");

/** A nyers fájl — a jelenlét-ellenőrzésekhez (nem érték-feloldáshoz). */
export const RAW_CSS = CSS;

// A sötét blokk a :root-on ül: csak ott számítódnak ki helyesen a
// --color-* aliasok (a var() a deklaráló elemen helyettesítődik be).
const DARK_SELECTOR = /:root\[data-theme="dark"\]\s*\{/;

/** Egy `{`-tól a párját záró `}`-ig — beágyazott blokkokat is átugorva. */
function blockEnd(source: string, open: number): number {
  let depth = 0;
  for (let i = open; i < source.length; i += 1) {
    if (source[i] === "{") depth += 1;
    else if (source[i] === "}") {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return source.length;
}

function splitDarkBlock(): { base: string; dark: string | null } {
  const at = CSS.search(DARK_SELECTOR);
  if (at === -1) return { base: CSS, dark: null };
  const open = CSS.indexOf("{", at);
  const end = blockEnd(CSS, open);
  return {
    base: CSS.slice(0, at) + CSS.slice(end + 1),
    dark: CSS.slice(open + 1, end),
  };
}

const { base: BASE_CSS, dark: DARK_CSS } = splitDarkBlock();

function parseDefinitions(source: string, into: Map<string, string>): void {
  for (const match of source.matchAll(/(--[a-z0-9-]+):\s*([^;{}]+);/g)) {
    into.set(match[1], match[2].trim());
  }
}

function definitionsFor(theme: ThemeName): Map<string, string> {
  const defs = new Map<string, string>();
  parseDefinitions(BASE_CSS, defs);
  // A sötét blokk UTOLSÓNAK fut → felülírja az azonos nevű nyers értékeket.
  if (theme === "dark" && DARK_CSS) parseDefinitions(DARK_CSS, defs);
  return defs;
}

const CACHE = new Map<ThemeName, Map<string, string>>();

function defs(theme: ThemeName): Map<string, string> {
  const cached = CACHE.get(theme);
  if (cached) return cached;
  const fresh = definitionsFor(theme);
  CACHE.set(theme, fresh);
  return fresh;
}

/** Létezik-e egyáltalán ez a témakészlet a globals.css-ben. */
export function hasTheme(theme: ThemeName): boolean {
  return theme === "light" || DARK_CSS !== null;
}

/**
 * Egy token feloldása hexre. `name` lehet rövid (`sage` → `--color-sage`)
 * vagy teljes változónév (`--palette-sage`). `null`, ha a lánc nem ér hexbe.
 */
export function resolveToken(name: string, theme: ThemeName = "light"): string | null {
  const full = name.startsWith("--") ? name : `--color-${name}`;
  const table = defs(theme);

  let current = full;
  for (let depth = 0; depth < 12; depth += 1) {
    const value = table.get(current);
    if (!value) return null;
    const ref = value.match(/^var\((--[a-z0-9-]+)\)$/);
    if (ref) {
      current = ref[1];
      continue;
    }
    const hex = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
    return hex ? expandHex(value.toLowerCase()) : null;
  }
  return null;
}

function expandHex(hex: string): string {
  if (hex.length !== 4) return hex;
  const [, r, g, b] = hex;
  return `#${r}${r}${g}${g}${b}${b}`;
}

/** Egyetlen sRGB csatorna lineáris értéke (WCAG 2.x). */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!match) throw new Error(`nem hex szín: ${hex}`);
  const int = parseInt(match[1], 16);
  return (
    0.2126 * channel((int >> 16) & 255) +
    0.7152 * channel((int >> 8) & 255) +
    0.0722 * channel(int & 255)
  );
}

/** WCAG kontrasztarány két hex szín között (1–21). */
export function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}
