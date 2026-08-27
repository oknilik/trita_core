import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

import { type } from "@/components/pdf/styles";

// ─────────────────────────────────────────────────────────────────────────────
// Tipográfia- és glyph-guardrail az egyéni és szervezeti riport-PDF-re
// (PDF-audit 2026-08-18, P1/10 + P0-hibák).
//
// A riportban korábban a lényegi szöveg zöme 5,5–7,5 pt volt: képernyőn és A4
// nyomtatásban egyaránt olvashatatlan. A skála mostantól tokenizált
// (components/pdf/styles.ts → `type`), és a lapok/komponensek nem tehetnek
// vissza apró inline méreteket.
//
// SCOPE: a közös riport-rendszer (pages/ + components/), valamint a szervezeti
// riport dokumentum-komponense. Mindkét kimenet ugyanazt a tipográfiai skálát
// használja; egyikben sem térhet vissza a régi mikroszöveg.
// ─────────────────────────────────────────────────────────────────────────────

const ROOT = process.cwd();
const SCOPE = [
  "src/components/pdf/pages",
  "src/components/pdf/components",
];

/** A legkisebb megengedett méret lényegi szövegre. */
const MIN_CONTENT_SIZE = 8;

function collectFiles(dir: string): string[] {
  const abs = path.join(ROOT, dir);
  return readdirSync(abs).flatMap((entry) => {
    const full = path.join(abs, entry);
    if (statSync(full).isDirectory()) return collectFiles(path.join(dir, entry));
    return entry.endsWith(".tsx") || entry.endsWith(".ts") ? [path.join(dir, entry)] : [];
  });
}

const FILES = SCOPE.flatMap(collectFiles);
FILES.push("src/components/pdf/TeamReportPdf.tsx");

test("a riport-komponensekben nincs 8 pt alatti inline betűméret", () => {
  assert.ok(FILES.length > 0, "nem találtam riport-komponenseket");
  const violations: string[] = [];

  for (const file of FILES) {
    const source = readFileSync(path.join(ROOT, file), "utf8");
    source.split("\n").forEach((line, index) => {
      // A `type.micro` (6 pt) KIZÁRÓLAG a láblécben él — az nem lényegi szöveg.
      if (line.includes("type.micro")) return;
      for (const match of line.matchAll(/fontSize:\s*([0-9]+(?:\.[0-9]+)?)/g)) {
        const size = Number(match[1]);
        if (size < MIN_CONTENT_SIZE) {
          violations.push(`${file}:${index + 1} → ${size} pt`);
        }
      }
    });
  }

  assert.deepEqual(
    violations,
    [],
    `8 pt alatti lényegi szöveg került vissza a riportba:\n${violations.join("\n")}`,
  );
});

test("a tipográfiai skála tokenjei a megbeszélt sávban maradnak", () => {
  // A sávok az audit elfogadási feltételeiből jönnek – a tokenek elmozdulhatnak
  // finomhangoláskor, de nem eshetnek vissza a korábbi mikro-méretekre.
  assert.ok(type.chapter >= 22 && type.chapter <= 26, "fejezetcím: 22–26 pt");
  assert.ok(type.section >= 14 && type.section <= 17, "szekciócím: 14–17 pt");
  assert.ok(type.cardTitle >= 9 && type.cardTitle <= 11, "kártyacím: 9–11 pt");
  assert.ok(type.body >= 9 && type.body <= 10, "törzsszöveg: 9–10 pt");
  assert.ok(
    type.lineHeight.body >= 1.4 && type.lineHeight.body <= 1.55,
    "törzsszöveg sorköz: 1,4–1,55",
  );
  assert.ok(type.caption >= 7.5 && type.caption <= 8.5, "caption/meta: 7,5–8,5 pt");
  assert.ok(type.micro <= 6, "a micro token csak láblécre való");
});

// ── Glyph-lefedettség a tényleges TTF-ekből ──────────────────────────────────
//
// A riport két családot regisztrál (styles.ts): Fraunces és DM Sans. Ha egy
// forrásban leírt karakterre EGYIKBEN sincs glyph, a böngészőben tofu jelenik
// meg, node-ban (persona-dosszié, snapshot-készlet) pedig a szöveg-mérés
// elszáll rajta („Cannot read properties of null (reading 'unitsPerEm')").
// Pontosan ez történt a korábbi „✓ / ⚠" állapotjelekkel – a helyes minta a
// View-alapú jel (ld. PdfAltruism info-jele).

const FONT_FILES = [
  "public/fonts/Fraunces-Regular.ttf",
  "public/fonts/Fraunces-Italic.ttf",
  "public/fonts/Fraunces-SemiBold.ttf",
  "public/fonts/DMSans-Regular.ttf",
  "public/fonts/DMSans-Medium.ttf",
  "public/fonts/DMSans-SemiBold.ttf",
];

/** A TTF `cmap` (format 4) kódpont-halmaza – külső függőség nélkül. */
function readCodepoints(file: string): Set<number> {
  const buf = readFileSync(path.join(ROOT, file));
  const tableCount = buf.readUInt16BE(4);
  let cmapOffset: number | null = null;
  for (let i = 0; i < tableCount; i++) {
    const record = 12 + i * 16;
    if (buf.toString("ascii", record, record + 4) === "cmap") {
      cmapOffset = buf.readUInt32BE(record + 8);
    }
  }
  assert.ok(cmapOffset !== null, `${file}: nincs cmap tábla`);

  const subtableCount = buf.readUInt16BE(cmapOffset + 2);
  let subtable: number | null = null;
  for (let i = 0; i < subtableCount; i++) {
    const record = cmapOffset + 4 + i * 8;
    const platform = buf.readUInt16BE(record);
    const encoding = buf.readUInt16BE(record + 2);
    if ((platform === 3 && (encoding === 1 || encoding === 10)) || platform === 0) {
      subtable = cmapOffset + buf.readUInt32BE(record + 4);
    }
  }
  assert.ok(subtable !== null, `${file}: nincs unicode cmap altábla`);
  assert.equal(buf.readUInt16BE(subtable), 4, `${file}: nem format 4 cmap`);

  const segCountX2 = buf.readUInt16BE(subtable + 6);
  const segCount = segCountX2 / 2;
  const endOffset = subtable + 14;
  const startOffset = endOffset + segCountX2 + 2;
  const deltaOffset = startOffset + segCountX2;
  const rangeOffset = deltaOffset + segCountX2;

  const codepoints = new Set<number>();
  for (let i = 0; i < segCount; i++) {
    const end = buf.readUInt16BE(endOffset + i * 2);
    const start = buf.readUInt16BE(startOffset + i * 2);
    if (start === 0xffff) continue;
    const delta = buf.readInt16BE(deltaOffset + i * 2);
    const range = buf.readUInt16BE(rangeOffset + i * 2);
    for (let cp = start; cp <= end; cp++) {
      let glyph: number;
      if (range === 0) {
        glyph = (cp + delta) & 0xffff;
      } else {
        const index = rangeOffset + i * 2 + range + (cp - start) * 2;
        if (index + 1 >= buf.length) continue;
        const raw = buf.readUInt16BE(index);
        glyph = raw === 0 ? 0 : (raw + delta) & 0xffff;
      }
      if (glyph !== 0) codepoints.add(cp);
    }
  }
  return codepoints;
}

test("a riport minden leírt karakterére van glyph a regisztrált fontokban", () => {
  const covered = new Set<number>();
  for (const file of FONT_FILES) {
    for (const cp of readCodepoints(file)) covered.add(cp);
  }
  // Épeszűségi horgony: a magyar ő/ű és a tipográfiai gondolatjel mind megvan.
  for (const ch of ["ő", "ű", "–", "·"]) {
    assert.ok(covered.has(ch.codePointAt(0)!), `a horgony-karakter (${ch}) hiányzik a fontokból`);
  }

  const violations: string[] = [];
  for (const file of FILES) {
    const source = readFileSync(path.join(ROOT, file), "utf8");
    // A kommentek nem kerülnek a kimenetre – csak a kódtörzset nézzük.
    const code = source.replace(/\/\*[\s\S]*?\*\//g, "").replace(/\/\/.*$/gm, "");
    code.split("\n").forEach((line, index) => {
      for (const ch of line) {
        const cp = ch.codePointAt(0)!;
        if (cp < 0x80) continue;
        if (covered.has(cp)) continue;
        violations.push(`${file}:${index + 1} → ${JSON.stringify(ch)} (U+${cp.toString(16)})`);
      }
    });
  }

  assert.deepEqual(
    violations,
    [],
    `nem renderelhető karakter került a riportba:\n${violations.join("\n")}`,
  );
});
