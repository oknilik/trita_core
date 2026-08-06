#!/usr/bin/env node

// Szín-guardrail (2026-08 szín-rendszer — docs/development/color-system-2026-08.md)
//
// Két ellenőrzés:
//  (a) KIVEZETETT hexek tiltólistája — a migrációban megszüntetett színek
//      (kevert dimenzió-paletták, státusz-kölcsönzések, destruktív-terrakotta,
//      hideg slate/indigó ködök) nem szivároghatnak vissza. Hard fail.
//  (b) Nyers-hex költségkeret a UI-scope-ban (src/components + src/app) —
//      a sweep utáni maradék (kurátori minta-atlasz akcentek, PDF-fehérek,
//      hover-tintek) rögzített keret; új nyers hex csak tudatos döntéssel,
//      a keret emelésével kerülhet be. A cél a csökkenés, nem a befagyás.
//
// Kivételek (dokumentált döntések):
//  - src/lib/riasec-content.ts — C-döntés: a RIASEC-paletta a karrier-réteg
//    élesítéséig parkolva, nem migráljuk.
//  - src/app/icon.tsx, src/app/apple-icon.tsx — E-döntés: a favicon/app-ikon
//    palettája brand-döntésig marad.
//  - sign-in/sign-up — Google-logó (harmadik fél brand-színei).
//  - src/app/globals.css, src/lib/design-tokens.ts, src/lib/color-system.ts —
//    token-definíciós fájlok (itt ÉLNEK a hexek).

import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

/** Kivezetett hexek — kisbetűs alakban. */
const BANNED_HEXES = [
  // P1 kérdésbank-paletta (Tailwind 400-as sor)
  "#818cf8", "#fb7185", "#34d399", "#a78bfa", "#38bdf8",
  // P2 team-paletta (Tailwind 500-as sor) + rokonai
  "#6366f1", "#ec4899", "#f59e0b", "#10b981", "#8b5cf6", "#06b6d4",
  "#4f46e5", "#9333ea", "#7c22cb", "#0e7490", "#0c5e75",
  // P3 jelölt-oldali keverék (O = hiba-piros!)
  "#ef4444",
  // radar/marketing „kozmikus" színek és hideg slate/indigó ködök
  "#d946ef", "#eef2ff", "#c7d2fe", "#ddd6fe", "#a5b4fc", "#94a3b8",
  // szerep-színek (9 hue-s készlet maradéka)
  "#0ea5e9", "#14b8a6", "#f97316", "#84cc16",
  // destruktív-terrakotta és az ötödik piros-család
  "#8c4a31", "#7a3f2a", "#c0392b", "#a93226",
  // dinamika-bézs (egy fogalom — egy szín)
  "#d3cfc6",
  // arany-négyes kivezetett tagjai (→ org-glow)
  "#d8a253", "#d4a15a",
  // zöld-görgeteg kivezetett tagjai (→ sage-skála)
  "#217a55", "#2e6b50",
  // egyszeri kivezetett akcentek
  "#8b2f09", "#a83508", "#92400e",
  // ink-közeli hideg szürkék (→ ink-body / ink-300 / muted)
  "#5a5a6e", "#8a8a98",
];

/** Nyers-hex költségkeret a UI-scope-ban (b ellenőrzés). */
const RAW_HEX_BUDGET = 23;

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

const isExempt = (rel) =>
  rel === "src/app/globals.css" ||
  rel === "src/lib/design-tokens.ts" ||
  rel === "src/lib/color-system.ts" ||
  rel === "src/lib/riasec-content.ts" ||
  rel === "src/app/icon.tsx" ||
  rel === "src/app/apple-icon.tsx" ||
  rel.includes("(auth)/sign-in/") ||
  rel.includes("(auth)/sign-up/");

const isUiScope = (rel) =>
  rel.startsWith("src/components/") || rel.startsWith("src/app/");

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const abs = path.join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      if (entry === "node_modules" || entry.startsWith(".")) continue;
      yield* walk(abs);
    } else if (SCAN_EXTENSIONS.has(path.extname(entry))) {
      yield abs;
    }
  }
}

const HEX_RE = /#[0-9a-fA-F]{6}\b/g;

const bannedViolations = [];
let rawHexCount = 0;
const rawHexByFile = new Map();

for (const abs of walk(path.join(ROOT, "src"))) {
  const rel = path.relative(ROOT, abs).split(path.sep).join("/");
  if (isExempt(rel)) continue;
  const content = readFileSync(abs, "utf8");
  const lines = content.split("\n");
  lines.forEach((line, i) => {
    const matches = line.match(HEX_RE);
    if (!matches) return;
    for (const raw of matches) {
      const hex = raw.toLowerCase();
      if (BANNED_HEXES.includes(hex)) {
        bannedViolations.push(`${rel}:${i + 1}  ${hex}  ${line.trim().slice(0, 100)}`);
      }
      if (isUiScope(rel)) {
        rawHexCount += 1;
        rawHexByFile.set(rel, (rawHexByFile.get(rel) ?? 0) + 1);
      }
    }
  });
}

let failed = false;

if (bannedViolations.length > 0) {
  failed = true;
  console.error("check-colors: KIVEZETETT hex került a kódba (color-system-2026-08.md):\n");
  for (const v of bannedViolations) console.error("  " + v);
  console.error(
    "\nHasználd a token-készletet: globals.css --color-dim/layer/eval/state-* " +
      "vagy a src/lib/color-system.ts térképeit.",
  );
}

if (rawHexCount > RAW_HEX_BUDGET) {
  failed = true;
  console.error(
    `\ncheck-colors: nyers hexek a UI-scope-ban: ${rawHexCount} > keret (${RAW_HEX_BUDGET}).`,
  );
  console.error("Fájlonként:");
  for (const [file, count] of [...rawHexByFile.entries()].sort((a, b) => b[1] - a[1])) {
    console.error(`  ${String(count).padStart(3)}  ${file}`);
  }
  console.error(
    "\nÚj színt tokenként vegyél fel (globals.css + color-system.ts + " +
      "design-tokens-sync teszt); ha tudatos kivétel, emeld a keretet " +
      "indoklással ebben a scriptben.",
  );
}

if (failed) process.exit(1);

console.log(
  `check-colors OK — tiltólista tiszta, nyers hex a UI-scope-ban: ${rawHexCount}/${RAW_HEX_BUDGET}.`,
);
