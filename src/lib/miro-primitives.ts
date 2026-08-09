// ─────────────────────────────────────────────────────────────────────
// A formanyelv közös kézírása (2026-08-09).
//
// A rendszer HÁROM szinten él; ez a modul a 2. és 3. szintet szolgálja ki:
//
//   1. JELENTŐ formák  — a hat alapforma + hat motívum (type-glyph.ts).
//      Csak ott rajzolható, ahol valódi mérési eredmény áll mögötte.
//      SZÁNDÉKOSAN nem innen dolgozik: a level-1 geometria befagyasztva
//      él a saját moduljában, hogy egy szerkesztői hangolás soha ne
//      tudja elmozdítani a profil-ábrát.
//   2. SZERKESZTŐI formák — nem foglalt alakzatok ugyanebben a
//      palettában (editorial-art.ts).
//   3. KÍSÉRŐ jelek — csillag, nap, ellensúly, talajvonal. Ez a modul.
//      Önmagukban nem állítanak semmit, tehát szabadon használhatók.
//
// Szín kizárólag CSS-változóból (ui-hex-guardrail): palettacserénél és
// színsémaváltásnál együtt mozog a felülettel.
// ─────────────────────────────────────────────────────────────────────

/**
 * A formanyelv színszerepei.
 *
 * A `line` szándékosan `text-primary`: az sötét sémán VILÁGOSSÁ fordul,
 * tehát a tintavonal a sötét kártyán is látszik. Ami viszont mindkét
 * sémán sötét marad (a kiemelt hero-panel), az `onInverse` készletet
 * kéri — ott a fix ink olvashatatlan lenne. Ez a hiba a réteg-hero
 * tokeneknél egyszer már megvolt (UX-audit 2026-08-07).
 */
export const ART_COLORS = {
  line: "var(--color-text-primary)",
  form: "var(--color-accent-primary)",
  sun: "var(--color-accent-primary-soft)",
  counterweight: "var(--color-action-primary-bg)",
} as const;

/** Ugyanaz a készlet olyan panelen, ami MINDKÉT sémán sötét. */
export const ART_COLORS_ON_INVERSE = {
  line: "var(--color-text-on-inverse)",
  form: "var(--color-accent-primary)",
  sun: "var(--color-accent-primary-soft)",
  // A brand-zsálya a sage-deep gradiensen gyakorlatilag eltűnne.
  counterweight: "var(--color-sage-300)",
} as const;

export type ArtPalette = typeof ART_COLORS | typeof ART_COLORS_ON_INVERSE;

/**
 * Méret-mód. A kompozíció nem skálázódik lineárisan: 72 pixelen a
 * kíséret masszává olvad, ezért ott CSAK a tárgy marad, nagyobbra véve.
 */
export type ArtScale = "compact" | "card" | "hero";

/** A `compact` szabály küszöbe pixelben — e alatt nincs kíséret. */
export const ART_COMPACT_MAX_PX = 140;

/**
 * Méret-mód a vászon befoglaló méretéből.
 *
 * A küszöb a NAGYOBBIK oldalra néz, nem a kisebbikre: egy 1120×96-os
 * landing-átkötő nem apró jel, csak lapos — a rövidebb oldalra nézve
 * viszont „compact"-nak minősült volna, és a háromelemű kompozícióból
 * egyetlen forma maradt (2026-08-09).
 */
export function resolveArtScale(width: number, height: number, isHero = false): ArtScale {
  if (isHero) return "hero";
  return Math.max(width, height) <= ART_COMPACT_MAX_PX ? "compact" : "card";
}

// ── Determinizmus ─────────────────────────────────────────────────────
// Az ábrák build-stabilak kell legyenek (SSG), és a szerver–kliens
// rendernek bitre egyeznie kell.

export function hashString(input: string): number {
  let h = 1779033703;
  for (let i = 0; i < input.length; i += 1) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/**
 * mulberry32 — determinisztikus PRNG.
 *
 * FONTOS: a hívó SEEDET adjon át, ne kész generátort. A PRNG állapotot
 * hordoz; ha egy alkompozíció a szülőben létrehozott generátort fogyasztja,
 * egy különálló újrarender (dev StrictMode, memoizáció) elcsúsztatja a
 * sorozatot, és a szerver más geometriát rajzol, mint a kliens →
 * hidratálási hiba (2026-08-07).
 */
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** SVG-koordináta kerekítés — rövidebb markup, stabil szerver/kliens string. */
export function r2(value: number): number {
  return Math.round(value * 100) / 100;
}

// ── Kísérő jelek (3. szint) ───────────────────────────────────────────

export interface StarGeometry {
  /** Négy átlós/egyenes szár végpontjai. */
  lines: Array<{ x1: number; y1: number; x2: number; y2: number }>;
}

/** Nyolcágú tinta-csillag — a formanyelv leggyakoribb kísérőjele. */
export function starGeometry(cx: number, cy: number, radius: number): StarGeometry {
  const d = radius * 0.71;
  return {
    lines: [
      { x1: r2(cx - radius), y1: r2(cy), x2: r2(cx + radius), y2: r2(cy) },
      { x1: r2(cx), y1: r2(cy - radius), x2: r2(cx), y2: r2(cy + radius) },
      { x1: r2(cx - d), y1: r2(cy - d), x2: r2(cx + d), y2: r2(cy + d) },
      { x1: r2(cx + d), y1: r2(cy - d), x2: r2(cx - d), y2: r2(cy + d) },
    ],
  };
}

/**
 * Vándorló talajvonal — a kompozíciót a lap aljához horgonyozza.
 * A vászon két szélén túlfut, hogy vágásnál ne legyen látható vége.
 */
export function groundPath(seed: number, width: number, baseY: number, amplitude = 20): string {
  const rnd = mulberry32(seed);
  const step = width / 4;
  let d = `M ${r2(-6)} ${r2(baseY)}`;
  for (let x = 0; x <= width + 20; x += step) {
    const control = baseY + (rnd() - 0.5) * amplitude * 2;
    const end = baseY + (rnd() - 0.5) * amplitude;
    d += ` S ${r2(x + step / 2)} ${r2(control)}, ${r2(x + step)} ${r2(end)}`;
  }
  return d;
}

/**
 * A kíséret elhelyezése. A csillag és a nap MINDIG ellentétes oldalra
 * kerül, különben a kompozíció felső sávja egymásra csúszik — ugyanaz a
 * szabály, mint a típus-ábránál.
 */
export interface Accompaniment {
  star: { x: number; y: number; r: number };
  sun: { x: number; y: number; r: number };
  counterweight: { x: number; y: number; r: number };
  groundY: number;
}

export function accompanimentLayout(
  seed: number,
  width: number,
  height: number,
  unit: number,
  scale: ArtScale,
): Accompaniment | null {
  if (scale === "compact") return null;
  const rnd = mulberry32(seed);
  const starLeft = rnd() > 0.5;
  const topBand = scale === "hero" ? 0.2 : 0.25;
  return {
    star: {
      x: r2(width * (starLeft ? 0.13 : 0.87)),
      y: r2(height * topBand),
      r: r2(unit * 0.52),
    },
    sun: {
      x: r2(width * (starLeft ? 0.86 : 0.13)),
      y: r2(height * (topBand - 0.01)),
      r: r2(unit * 0.62),
    },
    counterweight: {
      x: r2(width * (rnd() > 0.5 ? 0.9 : 0.09)),
      y: r2(height * 0.68),
      r: r2(Math.max(3.5, unit * 0.13)),
    },
    groundY: r2(height * 0.88),
  };
}
