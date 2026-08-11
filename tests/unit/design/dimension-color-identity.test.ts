import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { DIMENSION_COLORS, EVAL_RAMP, dimColors, dimColorsCss } from "@/lib/color-system";
import { HEXACO_ORDER } from "@/lib/hexaco";
import { dimStandardError } from "@/lib/psychometrics";
import { getDimensionTier } from "@/lib/dimension-utils";

// SZÍN = IDENTITÁS, NEM ÉRTÉK (2026-08-11).
//
// A dimenzió-felületek korábban az ÉRTÉKELŐ rampot (EVAL_RAMP / tierColors:
// ≥70 zsálya, 40–69 bronz, <40 homok) használták a kártyára, a keretre, a
// pöttyre, a sávra és a számra. Ez három szinten volt hibás — mindhármat
// teszt rögzíti, hogy ne szivárogjon vissza:
//
//  1. a 70-es vágás a MÉRÉSI HIBÁN BELÜL járt;
//  2. a színrendszer doksija szerint egy hue csak EGY jelentés-osztályban
//     élhet — a dimenzió az „adat-identitás", nem az „értékelő ramp";
//  3. a score-valence.ts termékdöntése szerint az Emocionalitás mindkét
//     pólusa valencia-mentes, mégis ugyanazt a zöld/bronz/homok kezelést
//     kapta, mint bármely más dimenzió.

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

/** Kommentmentes forrás: a tiltott mintát MAGYARÁZÓ kommentek ne bukjanak el. */
const readCode = (relative: string) =>
  read(relative)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ");

test("a tier-küszöb a mérési hibán belül vágott — ezért nem színez többé", () => {
  // A vágópont (70) és a szomszédos sáv távolsága kisebb, mint a dimenzió
  // mérési hibája az ALAPÉRTELMEZETT rövid formán. Vagyis egy 68-as és egy
  // 72-es érték kategorikusan más színt kapott volna, miközben a két igazi
  // pontszám a hibahatáron belül akár azonos is lehet.
  const sem = dimStandardError("short");
  assert.ok(sem > 4, `a dimenzió-SEM váratlanul kicsi (${sem.toFixed(2)})`);

  // Konkrét eset a bejelentésből: 68 vs 82 — egy tier-lépés.
  assert.equal(getDimensionTier(68), "mid");
  assert.equal(getDimensionTier(82), "high");
  // A 68 hibasávja átfedi a 70-es vágást, tehát a határ nem állítható.
  assert.ok(
    68 + sem > 70,
    `a 68 hibasávja (±${sem.toFixed(2)}) nem éri el a 70-es vágást — ` +
      "az indoklás számszerű alapja megdőlt, a teszt frissítendő",
  );
});

test("a dimenzió-paletta és az értékelő ramp nem fedi egymást", () => {
  // Egy hue csak egy jelentés-osztályban élhet (color-system doksi):
  // ha a dimenzió-paletta bármely színe megegyezne egy EVAL_RAMP stoppal, a
  // felületen ugyanaz a szín egyszer identitást, egyszer értéket jelentene.
  const evalColors = new Set(
    Object.values(EVAL_RAMP).flatMap((stop) =>
      [stop.fg, stop.accent, stop.bg].map((c) => c.toLowerCase()),
    ),
  );
  for (const code of HEXACO_ORDER) {
    for (const key of ["base", "strong", "soft"] as const) {
      const value = DIMENSION_COLORS[code][key].toLowerCase();
      assert.equal(
        evalColors.has(value),
        false,
        `${code}.${key} (${value}) az értékelő ramp színe is — a jelentés-osztályok összemosódnak`,
      );
    }
  }
});

test("minden fő dimenzió külön identitás-színt kap", () => {
  const bases = HEXACO_ORDER.map((code) => DIMENSION_COLORS[code].base);
  assert.equal(new Set(bases).size, HEXACO_ORDER.length, "két dimenzió azonos hue-t visel");
  // A kiegészítő Segítőkészség-skála NEM főfaktor: semleges tintet kap,
  // nem a hat hue egyikét (a kártya bannere ezt szövegben is állítja).
  const altruism = dimColorsCss("I");
  for (const code of HEXACO_ORDER) {
    assert.notEqual(
      altruism.base,
      dimColorsCss(code).base,
      "a Segítőkészség egy főfaktor hue-ját viseli",
    );
  }
});

test("a fordított skálájú E ugyanolyan semleges kezelést kap, mint a többi", () => {
  // A valencia-mentesség szerkezeti garanciája: az E színe a pontszámtól
  // FÜGGETLEN — nincs az az érték, amelyre „figyelendő" tintet kapna.
  const low = dimColorsCss("E");
  const high = dimColorsCss("E");
  assert.deepEqual(low, high);
  assert.deepEqual(dimColors("E"), DIMENSION_COLORS.E);
});

// ── Forrás-szintű szerződés ────────────────────────────────────────────────
//
// A dimenziót/facetet rendelő felületek nem nyúlhatnak az értékelő ramphoz.
const DIMENSION_SURFACES = [
  "src/components/results/DimensionAccordion.tsx",
  "src/components/results/AltruismCard.tsx",
  "src/components/profile/ProfileTabs.tsx",
  "src/components/landing/HeroSection.tsx",
  "src/app/(app)/share/[token]/page.tsx",
  "src/components/pdf/components/PdfDimStrip.tsx",
  "src/components/pdf/components/PdfDimDetails.tsx",
  "src/components/pdf/components/PdfFacets.tsx",
  "src/components/pdf/components/PdfDimensionChart.tsx",
];

test("a dimenzió-felületek nem használnak értékelő színt", () => {
  // A kivezetett Tailwind-térkép neve és az eval-tokenek is tiltottak.
  const forbidden = [/\btierColors\b/, /--color-eval-/];
  for (const file of DIMENSION_SURFACES) {
    const source = readCode(file);
    for (const pattern of forbidden) {
      assert.equal(
        pattern.test(source),
        false,
        `${file}: értékelő szín (${pattern}) egy leíró dimenzió-felületen`,
      );
    }
  }
});

test("a dimenzió-felületek a kanonikus identitás-palettából dolgoznak", () => {
  for (const file of DIMENSION_SURFACES) {
    const source = readCode(file);
    assert.ok(
      /\bdimColors(Css)?\(/.test(source),
      `${file}: nem a kanonikus dimColors/dimColorsCss lookupot hívja`,
    );
  }
});

test("a kivezetett tierColors nem születik újra", () => {
  const source = read("src/lib/dimension-utils.ts");
  assert.equal(
    /export\s+const\s+tierColors/.test(source),
    false,
    "a tierColors export visszakerült — a színezés újra értékelő rámpán futna",
  );
  // A szöveges tier-címke ELLENBEN szándékosan megmarad.
  assert.ok(source.includes("export function getDimensionTier"));
  assert.ok(source.includes("export function getDimensionLabel"));
});
