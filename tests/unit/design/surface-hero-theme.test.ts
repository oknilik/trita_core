import test from "node:test";
import assert from "node:assert/strict";
import { SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";

// A hero-szín a FELÜLET azonosítója: self = zsálya, team = szilva,
// org = pala. Két dolgot véd ez a fájl:
//
//  1. Az alapok tényleg különböznek. Ha kettő egymásra csúszna, a
//     felhasználó nem tudná ránézésre, melyik felületen jár.
//  2. A világos akcentus olvasható marad a saját alapján.
//
// A karrier-felület NEM ebből a készletből dolgozik: a mérőoldal hero-ja
// tervlap (világos zsálya papír, sötét zsálya tinta), a záró blokkja pedig
// semleges ink. Volt egy agyag `career` variáns is — a tervlap-döntés után
// használat nélkül maradt, ezért kivezettük.

/** Egyetlen sRGB csatorna lineáris értéke (WCAG). */
function channel(value: number): number {
  const c = value / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const match = /^#([0-9a-f]{6})$/i.exec(hex);
  assert.ok(match, `nem hex szín: ${hex}`);
  const int = parseInt(match[1], 16);
  return (
    0.2126 * channel((int >> 16) & 255) +
    0.7152 * channel((int >> 8) & 255) +
    0.0722 * channel(int & 255)
  );
}

function contrast(a: string, b: string): number {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

/** A gradiens ELSŐ megállója – a szöveg zöme ezen a sávon ül. */
function firstStop(background: string): string | null {
  // A self téma CSS-változókból építi a gradienst – ott nincs mit számolni.
  return /#[0-9a-f]{6}/i.exec(background)?.[0] ?? null;
}

test("minden felület saját alapszínt kap", () => {
  const backgrounds = Object.values(SURFACE_HERO_THEME).map(
    (theme) => firstStop(theme.background) ?? theme.background,
  );
  assert.equal(new Set(backgrounds).size, backgrounds.length);
});

test("a hex akcentus olvasható a saját alapján (WCAG AA)", () => {
  for (const [variant, theme] of Object.entries(SURFACE_HERO_THEME)) {
    // A self téma CSS-változót használ, azt itt nem tudjuk kiszámolni –
    // a hexszel megadott témák viszont ellenőrizhetők.
    const ground = firstStop(theme.background);
    if (!theme.badgeText.startsWith("#") || !ground) continue;
    const ratio = contrast(theme.badgeText, ground);
    assert.ok(
      ratio >= 4.5,
      `${variant}: a badge-szöveg kontrasztja csak ${ratio.toFixed(2)}:1`,
    );
  }
});
