import test from "node:test";
import assert from "node:assert/strict";
import {
  EDITORIAL_SHAPES,
  EDITORIAL_SHAPE_ORDER,
  buildCompactShape,
  buildConstellation,
} from "@/lib/editorial-art";
import {
  ART_COLORS,
  ART_COLORS_ON_INVERSE,
  ART_COMPACT_MAX_PX,
  accompanimentLayout,
  groundPath,
  hashString,
  mulberry32,
  resolveArtScale,
  starGeometry,
} from "@/lib/miro-primitives";
import { DIMENSION_GLYPHS, GLYPH_DIMENSION_ORDER } from "@/lib/type-glyph";

// A formanyelv három szintje (miro-primitives.ts fejléc) csak akkor tartható,
// ha a szerkesztői készlet SOHA nem kerül át a jelentő formák terébe, és ha
// az ábrák determinisztikusak maradnak (SSG + hidratálás).

test("a szerkesztői készlet minden tagja rajzolható elemet ad", () => {
  for (const id of EDITORIAL_SHAPE_ORDER) {
    const shape = EDITORIAL_SHAPES[id];
    assert.ok(shape, `nincs geometria a(z) ${id} formához`);
    if (shape.kind === "fill") {
      assert.ok(shape.path.trim().length > 0, `${id}: üres path`);
      // Zárt forma kell: a nyitott path kitöltése böngészőnként eltér.
      assert.match(shape.path.trim(), /z$/i, `${id}: a kitöltött formának zártnak kell lennie`);
    } else if (shape.kind === "line") {
      assert.ok(shape.paths.length > 0, `${id}: nincs vonal`);
    } else {
      assert.ok(shape.dots.length > 0, `${id}: nincs pont`);
    }
  }
});

test("a szerkesztői formanevek nem ütköznek a jelentő formákéval", () => {
  // A hat alapforma (arch/drop/comet/discs/block/eye) FOGLALT: ha egy
  // szerkesztői forma átvenné a nevét, előbb-utóbb a geometria is átcsúszna.
  const reserved = new Set(GLYPH_DIMENSION_ORDER.map((code) => DIMENSION_GLYPHS[code].form as string));
  for (const id of EDITORIAL_SHAPE_ORDER) {
    assert.ok(!reserved.has(id), `a(z) ${id} név a jelentő formák közül való`);
  }
});

test("a szerkesztői paletta csak CSS-változót használ (ui-hex-guardrail)", () => {
  for (const palette of [ART_COLORS, ART_COLORS_ON_INVERSE]) {
    for (const [role, value] of Object.entries(palette)) {
      assert.match(value, /^var\(--color-[a-z0-9-]+\)$/, `${role}: nem token-hivatkozás`);
    }
  }
});

test("a sötét panel készlete külön vonal- és ellensúlyszínt ad", () => {
  // Ez a konkrét regresszió: a fix ink és a brand-zsálya a sage-deep
  // hero-gradiensen olvashatatlan (UX-audit 2026-08-07).
  assert.notEqual(ART_COLORS.line, ART_COLORS_ON_INVERSE.line);
  assert.notEqual(ART_COLORS.counterweight, ART_COLORS_ON_INVERSE.counterweight);
});

test("a kompozíció determinisztikus — ugyanaz a kulcs ugyanazt adja", () => {
  const a = buildConstellation("landing:how-features:self", 1120, 96);
  const b = buildConstellation("landing:how-features:self", 1120, 96);
  assert.deepEqual(a, b);
  const other = buildConstellation("landing:how-features:team", 1120, 96);
  assert.notDeepEqual(a, other);
});

test("textSafeCorner: kevesebb forma, és egyik sem lóg a bal alsó negyedbe", () => {
  const width = 420;
  const height = 260;
  for (const key of ["a", "b", "c", "d", "e", "f", "g", "h"]) {
    const c = buildConstellation(key, width, height, { textSafeCorner: true });
    assert.equal(c.shapes.length, 2);
    for (const shape of c.shapes) {
      const intrudes = shape.x - shape.size / 2 < width * 0.5 && shape.y + shape.size / 2 > height * 0.5;
      assert.ok(!intrudes, `${key}/${shape.id}: ráfut a szöveg-negyedre`);
    }
  }
});

test("kis méreten egyetlen forma marad, kíséret nélkül", () => {
  assert.equal(resolveArtScale(72, 72), "compact");
  assert.equal(resolveArtScale(ART_COMPACT_MAX_PX, ART_COMPACT_MAX_PX), "compact");
  assert.equal(resolveArtScale(ART_COMPACT_MAX_PX + 1, 80), "card");
  assert.equal(resolveArtScale(72, 72, true), "hero", "a hero sosem esik compactba");

  assert.equal(accompanimentLayout(1, 100, 100, 30, "compact"), null);
  assert.ok(accompanimentLayout(1, 400, 120, 30, "card"));

  const shape = buildCompactShape("slug", 100, 100);
  assert.ok(shape.size > 0 && shape.size <= 100);
  assert.deepEqual(shape, buildCompactShape("slug", 100, 100));
});

test("a széles, lapos sáv NEM compact — ott van hely a teljes kompozíciónak", () => {
  // Regresszió: a küszöb a rövidebb oldalra nézett, ezért az 1120×96-os
  // landing-átkötőből egyetlen apró forma maradt (2026-08-09).
  assert.equal(resolveArtScale(1120, 96), "card");
  assert.equal(resolveArtScale(840, 120), "card");
  const band = buildConstellation("landing:how-features:self", 1120, 96);
  assert.equal(band.shapes.length, 3);
  // A formák szét is terülnek: nem kupacolódnak a vászon egyharmadára.
  const xs = band.shapes.map((s) => s.x);
  assert.ok(Math.max(...xs) - Math.min(...xs) > 1120 * 0.4, "a sáv formái egy helyre kerültek");
});

test("a kíséretben a csillag és a nap ellentétes oldalra kerül", () => {
  // Egymásra csúszva a felső sáv olvashatatlan kupaccá válik.
  for (let seed = 0; seed < 40; seed += 1) {
    const parts = accompanimentLayout(seed, 400, 120, 30, "card");
    assert.ok(parts);
    const starRight = parts.star.x > 200;
    const sunRight = parts.sun.x > 200;
    assert.notEqual(starRight, sunRight, `seed ${seed}: a csillag és a nap egy oldalon`);
  }
});

test("a csillag négy szára középpont-szimmetrikus", () => {
  const { lines } = starGeometry(50, 60, 10);
  assert.equal(lines.length, 4);
  for (const l of lines) {
    assert.ok(Math.abs((l.x1 + l.x2) / 2 - 50) < 0.01);
    assert.ok(Math.abs((l.y1 + l.y2) / 2 - 60) < 0.01);
  }
});

test("a talajvonal túlfut a vásznon, hogy vágásnál ne legyen látható vége", () => {
  const d = groundPath(3, 400, 100, 20);
  assert.match(d, /^M -6 100/);
  const lastX = Number(d.trim().split(/[\s,]+/).at(-2));
  assert.ok(lastX >= 400, `a talajvonal a jobb szélen belül ér véget (${lastX})`);
});

test("a PRNG seedből indul, tehát az újrarender ugyanazt rajzolja", () => {
  const first = Array.from({ length: 5 }, mulberry32(hashString("slug")));
  const second = Array.from({ length: 5 }, mulberry32(hashString("slug")));
  assert.deepEqual(first, second);
  assert.notDeepEqual(first, Array.from({ length: 5 }, mulberry32(hashString("slug#2"))));
});
