import test from "node:test";
import assert from "node:assert/strict";
import {
  DIMENSION_COLORS,
  DIMENSION_COLORS_CSS,
  DYNAMICS_COLORS,
  DYNAMICS_COLORS_CSS,
} from "@/lib/color-system";
import { GLYPH_COLORS, GLYPH_COLORS_CSS } from "@/lib/type-glyph";
import { resolveToken } from "./css-tokens";

// A TS-oldali színtérképek KÉT alakban élnek:
//   · literál hex — a fix médiumoknak (PDF, email, OG-kép): ott nincs
//     CSS-változó, a satori/react-pdf nem tudja feloldani;
//   · CSS-változó — a DOM-nak (inline style, SVG-attribútum): ez követi a
//     színsémát, tehát sötét módban is helyes.
//
// A kettő elcsúszása néma hiba lenne: a felület és az exportált kép
// eltérő színt mutatna ugyanarra a fogalomra. Ez a teszt köti össze őket —
// a CSS-alakot feloldja a globals.css VILÁGOS értékkészletén, és a literál
// alakhoz méri.

function resolveCssValue(value: string): string | null {
  const match = value.match(/^var\((--[a-z0-9-]+)\)$/);
  assert.ok(match, `nem egyszerű var() hivatkozás: ${value}`);
  return resolveToken(match[1], "light");
}

function assertSameMap(
  literal: Record<string, string>,
  css: Record<string, string>,
  label: string,
) {
  assert.deepEqual(
    Object.keys(css).sort(),
    Object.keys(literal).sort(),
    `${label}: a két térkép kulcsai eltérnek`,
  );
  for (const [key, cssValue] of Object.entries(css)) {
    const resolved = resolveCssValue(cssValue);
    assert.ok(resolved, `${label}.${key}: a(z) ${cssValue} nem oldható fel hexre`);
    assert.equal(
      resolved,
      literal[key].toLowerCase(),
      `${label}.${key}: a CSS-alak (${cssValue} → ${resolved}) ≠ a literál (${literal[key]}) – ` +
        "a fix médiumok és a felület elcsúszna",
    );
  }
}

test("DYNAMICS_COLORS_CSS a literál térkép pontos tükre", () => {
  assertSameMap(DYNAMICS_COLORS, DYNAMICS_COLORS_CSS, "DYNAMICS_COLORS");
});

test("GLYPH_COLORS_CSS a literál térkép pontos tükre", () => {
  assertSameMap(GLYPH_COLORS, GLYPH_COLORS_CSS, "GLYPH_COLORS");
});

test("DIMENSION_COLORS_CSS a literál paletta pontos tükre", () => {
  // A dimenzió-paletta hármas (base/strong/soft) – laposítva mérjük, hogy
  // ugyanaz az összevetés fusson rá, mint a többi térképre.
  const flatten = (map: Record<string, { base: string; strong: string; soft: string }>) =>
    Object.fromEntries(
      Object.entries(map).flatMap(([code, triple]) =>
        (["base", "strong", "soft"] as const).map((key) => [
          `${code}.${key}`,
          triple[key],
        ]),
      ),
    );
  assertSameMap(
    flatten(DIMENSION_COLORS),
    flatten(DIMENSION_COLORS_CSS),
    "DIMENSION_COLORS",
  );
});
