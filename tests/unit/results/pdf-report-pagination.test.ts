import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import path from "node:path";

// ─────────────────────────────────────────────────────────────────────────────
// Tördelési szerződés (éles riport-visszajelzés, 2026-08-18).
//
// Két, egymással rokon hiba jött vissza egy valódi Plus riportból:
//
//   1. ÜRESEN LEBEGŐ LAP. Az utolsó kártya `marginBottom`-ja éppen túllógott a
//      tartalom-dobozon (a törzs 795,9 pt-nál ért véget, +12 pt margó = 808 =
//      a doboz alja), és a react-pdf tartalom nélküli folytatás-lapot nyitott.
//      Javítás: a kártya-közöket a konténer `gap`-je adja, így az utolsó elem
//      után nincs margó (styles.ts → `s.body`).
//
//   2. ÁRVA KÁRTYAFEJLÉC. Egy törhető (`wrap`) kártya fejléce még kifért a lap
//      aljára, a tartalma viszont már a következőre került — üres kártyahéj
//      maradt a lap alján. A react-pdf törhető gyereknél a `minPresenceAhead`
//      orphan-védelmet NEM alkalmazza, ezért a helyes viselkedés az, hogy a
//      kártya EGYBEN csúszik le. Javítás: a riport kártyái nem törhetnek.
//
// Ez a fájl a SZERKEZETI okokat őrzi (forrás-szinten). A tényleges
// rendereléssel dolgozó ellenőrzés a client rétegben fut
// (tests/client/results/pdf-report-blank-pages.test.ts): a unit réteg
// `--conditions=react-server` alatt indul, ahol a react-pdf reconcilere nem
// működik.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();

test("a lap-törzs gap-pel tartja a kártya-közöket, nem alsó margóval", () => {
  // Ez a KONKRÉT mechanizmus, ami az üresen lebegő lapot okozta: ha a kártya
  // saját `marginBottom`-ot visz, az utolsó kártya margója túllóghat a
  // tartalom-dobozon, és a react-pdf tartalom nélküli lapot nyit. A konténer
  // `gap`-je után nincs záró margó, tehát a hiba szerkezetileg kizárt.
  const source = readFileSync(path.join(ROOT, "src/components/pdf/styles.ts"), "utf8");

  const bodyBlock = source.match(/\n {2}body: \{[\s\S]*?\n {2}\},/)?.[0] ?? "";
  assert.match(bodyBlock, /gap: cardShape\.gap/, "a lap-törzs nem gap-pel tartja a közöket");

  const cardBlock = source.match(/\n {2}card: \{[\s\S]*?\n {2}\},/)?.[0] ?? "";
  assert.ok(cardBlock.length > 0, "nem találom a `card` stílust");
  assert.doesNotMatch(
    cardBlock,
    /marginBottom/,
    "a kártya visszakapta az alsó margót – ez szüli az üresen lebegő lapot",
  );
});

test("a riport kártyái nem törhetnek oldalhatáron", () => {
  // A `wrap` prop visszacsempészése hozná vissza az árva kártyafejlécet: a
  // fejléc kifér a lap aljára, a tartalom már nem. A riport minden kártyája
  // bőven egy lapnál kisebb, tehát az egészben-lecsúszás a helyes viselkedés.
  // Ha valaha lesz olyan blokk, amely ÖNMAGÁBAN meghaladhat egy lapot, ezt a
  // tesztet tudatosan kell bővíteni — nem véletlenül.
  const pagesDir = path.join(ROOT, "src/components/pdf/pages");
  const offenders: string[] = [];

  for (const file of readdirSync(pagesDir).filter((f) => f.endsWith(".tsx"))) {
    const source = readFileSync(path.join(pagesDir, file), "utf8");
    source.split("\n").forEach((line, index) => {
      if (/<PdfCard[^>]*\bwrap\b/.test(line)) {
        offenders.push(`src/components/pdf/pages/${file}:${index + 1}`);
      }
    });
  }

  assert.deepEqual(
    offenders,
    [],
    `törhető kártya került vissza a riportba:\n${offenders.join("\n")}`,
  );
});
