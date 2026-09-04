#!/usr/bin/env node

// Szín-guardrail (2026-08 szín-rendszer — docs/development/color-system-2026-08.md)
//
// Ellenőrzések (a)–(h):
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
//  - sign-in/sign-up — Google-logó (harmadik fél brand-színei).
//  - opengraph-image.tsx — Satori által renderelt megosztási kép; a böngészős
//    CSS custom property-k itt nem oldódnak fel, ezért konkrét színek kellenek.
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
const RAW_HEX_BUDGET = 22;

const SCAN_EXTENSIONS = new Set([".ts", ".tsx", ".css"]);

const isExempt = (rel) =>
  rel === "src/app/globals.css" ||
  rel === "src/lib/design-tokens.ts" ||
  rel === "src/lib/color-system.ts" ||
  rel === "src/lib/riasec-content.ts" ||
  rel === "src/app/icon.tsx" ||
  rel === "src/app/apple-icon.tsx" ||
  rel === "src/app/opengraph-image.tsx" ||
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

// (c) Témázható alapréteg (2026-08). A @theme blokkban MINDEN --color-* token
//     var() hivatkozás kell legyen. A Tailwind v4 az itt literálként megadott
//     értéket BEÉGETI az utilitybe (.bg-sage { background-color: #3d6b5e }),
//     és onnantól futásidőben nem felülírható — vagyis a token kiesik a
//     témázásból. A nyers értékek helye a --palette-* réteg, egy sima :root
//     blokkban a @theme felett.
//     Vizsgálat: docs/development/dark-mode-feasibility-2026-08.md
const themeLiterals = [];
{
  const cssPath = "src/app/globals.css";
  const css = readFileSync(path.join(ROOT, cssPath), "utf8");
  // Sorkezdő @theme at-rule — a fenti magyarázó komment is említi a nevet,
  // sima indexOf azt találná meg előbb.
  const themeAt = css.search(/^@theme\b/m);
  if (themeAt === -1) {
    themeLiterals.push(`${cssPath}  nincs @theme blokk`);
  } else {
    const open = css.indexOf("{", themeAt);
    let depth = 0;
    let i = open;
    for (; i < css.length; i += 1) {
      if (css[i] === "{") depth += 1;
      else if (css[i] === "}") {
        depth -= 1;
        if (depth === 0) break;
      }
    }
    const firstLine = css.slice(0, open).split("\n").length;
    css
      .slice(open, i)
      .split("\n")
      .forEach((line, n) => {
        const m = line.match(/(--color-[a-z0-9-]+):\s*(#[0-9a-fA-F]{3,8})\s*;/);
        if (m) themeLiterals.push(`${cssPath}:${firstLine + n}  ${m[1]}: ${m[2]}`);
      });
  }
}

// (d) A sötét blokk alias-rétegének teljessége. A sötét mód hatóköre egy
//     leszármazott elem (.theme-scope), a var() viszont a DEKLARÁLÓ elemen
//     helyettesítődik be — ezért a @theme minden --color-* tokenjét ott újra
//     kell deklarálni. Ha a @theme-be új token kerül és ez kimarad, az a
//     token sötéten csendben a világos értékén ragad.
const missingInDark = [];
{
  const css = readFileSync(path.join(ROOT, "src/app/globals.css"), "utf8");
  const darkAt = css.search(/\[data-theme="dark"\]\s+\.theme-scope\s*\{/);
  const themeAt = css.search(/^@theme\b/m);
  if (darkAt !== -1 && themeAt !== -1) {
    const names = (source) =>
      new Set([...source.matchAll(/(--color-[a-z0-9-]+):/g)].map((m) => m[1]));
    const body = (from) => {
      const open = css.indexOf("{", from);
      let depth = 0;
      let i = open;
      for (; i < css.length; i += 1) {
        if (css[i] === "{") depth += 1;
        else if (css[i] === "}") {
          depth -= 1;
          if (depth === 0) break;
        }
      }
      return css.slice(open + 1, i);
    };
    const inDark = names(body(darkAt));
    const inTheme = names(body(themeAt));
    for (const token of inTheme) {
      if (!inDark.has(token)) missingInDark.push(`${token}  (hiányzik a sötét blokkból)`);
    }
    // Fordítva is: ha csak a sötétben van, az a @theme-ből maradt ki — a
    // token világosban feloldatlan lenne.
    for (const token of inDark) {
      if (!inTheme.has(token)) missingInDark.push(`${token}  (hiányzik a @theme-ből)`);
    }
  }
}

// (h) Minden route-csoport shellje felveszi a `.theme-scope`-ot. A sötét
//     készlet hatóköre ez az osztály; ami kimarad belőle, az VILÁGOS marad
//     akkor is, ha a látogató sötétre váltott — és ez némán történik, mert
//     a lap magától jól néz ki, csak épp a másik sémán.
//     Így maradt ki elsőre a marketing-fa, majd a belépő-fa (2026-08-07).
const scopelessLayouts = [];
{
  const groups = readdirSync(path.join(ROOT, "src/app"), { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith("(") && e.name.endsWith(")"));
  for (const group of groups) {
    const rel = `src/app/${group.name}/layout.tsx`;
    const abs = path.join(ROOT, rel);
    let content;
    try {
      content = readFileSync(abs, "utf8");
    } catch {
      scopelessLayouts.push(`${rel}  nincs layout — a csoport nem kap hatókört`);
      continue;
    }
    if (!content.includes("theme-scope")) {
      scopelessLayouts.push(`${rel}  hiányzik a .theme-scope wrapper`);
    }
  }
}

// (g) A @theme blokk `static`. A Tailwind v4 alapból KIGYOMLÁLJA azokat a
//     @theme-változókat, amelyekre egyetlen generált utility sem hivatkozik —
//     tehát a `--color-x` custom property ki sem kerül a :root-ba. A sötét
//     blokkot viszont kézzel írjuk, ott MINDEN token szerepel. Enélkül egy
//     futásidőben összerakott `var(--color-…)` (inline style, SVG-attribútum,
//     template-literál gradiens) VILÁGOSBAN üresen jön vissza, SÖTÉTEN pedig
//     működik — 2026-08-07-én 204-ből 50 token volt ilyen (böngészőben mérve).
//     A `static` mindet kiírja; a (d) ellenőrzés csak ezzel együtt jelent
//     tényleges szimmetriát a két séma között.
const themeNotStatic = [];
{
  const cssPath = "src/app/globals.css";
  const css = readFileSync(path.join(ROOT, cssPath), "utf8");
  const m = css.match(/^@theme([^{]*)\{/m);
  if (!m) themeNotStatic.push(`${cssPath}  nincs @theme blokk`);
  else if (!/\bstatic\b/.test(m[1])) {
    themeNotStatic.push(`${cssPath}  @theme${m[1].trimEnd()} — hiányzik a \`static\``);
  }
}

// (e) Témázhatatlan felület-osztályok. A `bg-white` a Tailwind BEÉPÍTETT
//     fehérje — nem a mi tokenünk, ezért kimarad a témázásból és sötéten
//     fehér marad. Ugyanez a hardkódolt `bg-[rgba(...)]`.
//     Az ÁTTETSZŐ fehér (bg-white/15, bg-white/[0.06]) viszont SZABAD: az
//     szándékos fátyol sötét herón, nem felület.
const untokenizedSurfaces = [];
{
  const PATTERNS = [
    [/\bbg-white\b(?!\/)/g, "bg-white → bg-surface-card"],
    // MAGAS alfájú fehér: az nem fátyol, hanem FELÜLET. A hero-fátylak
    // 2–22% között élnek (sötét herón, szándékosan); a 40% fölötti fehér
    // viszont a lapon ülő kártya/pirula — sötéten majdnem fehér blokk lesz,
    // a rajta lévő (témakövető) szöveg pedig olvashatatlan. Így buktak a
    // landing hero-chipjei és az egyén/csapat váltó (2026-08-07).
    [/\bbg-white\/(?:4[0-9]|[5-9][0-9]|100)\b/g,
     "bg-white/40+ felület → bg-[var(--color-surface-card)]/N"],
    // Gradiens-stopként ugyanaz a hiba, csak észrevétlenebb: a landing
    // hero-kártyája alatt egy `from-white` elhalványuló sáv világított
    // sötéten (2026-08-07). Az áttetsző alak (from-white/40) itt is szabad.
    [/\b(?:from|via|to)-white\b(?!\/)/g, "from/via/to-white → …-[var(--color-surface-card)]"],
    // A `-solid` a státusz GRAFIKAI változata (pötty, donut, él): a küszöbe
    // 3:1. Szövegként 4,5:1 kellene, amit a success/warning/info nem hoz
    // (3,77 / 3,19 / 3,68 fehér lapon — UX-audit 2026-08-07). A szöveg
    // szerep-tokenje a `-fg`.
    [/\btext-state-(?:success|warning|error|info)-solid\b/g,
     "text-state-*-solid → text-state-*-fg (a -solid grafikai token)"],
    // SZÖVEG-token HÁTTÉRKÉNT. A `text-primary` / `ink` sötéten VILÁGOSSÁ
    // fordul (ez a dolga), tehát a belőle épített „szándékosan sötét panel"
    // sötét sémán kivilágosodik, a fehér felirata olvashatatlan lesz. Az
    // invertált felület saját tokene: --color-surface-inverse(-soft), a
    // réteg-heróké a --color-layer-*-hero-*.
    // Az ÁTTETSZŐ változat (bg-ink/10) szabad: az fátyol, nem felület.
    [/\b(?:bg|from|via|to)-\[var\(--color-(?:text-primary|text-strong-[a-z]+|ink[a-z-]*)\)\](?!\/)/g,
     "szöveg-token háttérként → --color-surface-inverse / --color-layer-*-hero-*"],
    [/\b(?:bg|from|via|to)-ink(?:-body)?\b(?!\/)/g,
     "ink háttérként → --color-surface-inverse (sötéten megfordul)"],
    // Ugyanez SVG-attribútumban. A footer hullám-éle `fill="var(--color-ink)"`
    // volt: sötét sémán az ink VILÁGOS, tehát a hullám krém sávként világított
    // az oldal és a footer között (2026-08-07). Az SVG-ben lévő SZÖVEG a
    // finomabb `text-secondary` / `ink-body` fokozatokat használja, azokat
    // nem bántjuk — ez a szabály a két legerősebb tintára szól, ami a
    // gyakorlatban mindig kitöltés.
    [/\bfill=\{?"var\(--color-(?:ink|text-primary)\)"/g,
     "ink/text-primary SVG-kitöltésként → --color-surface-inverse"],
    // Csak az ÁTLÁTSZATLAN (alfa >= 0.9 vagy hiányzó) hardkódolt rgba a hiba.
    // Az áttetsző színezetek (alfa 0.04–0.22) szándékos fátylak — ugyanaz az
    // elv, mint a bg-white/15-nél: nem felület, hanem réteg.
    [/\bbg-\[rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(?:,\s*(?:0?\.9\d*|1(?:\.0+)?)\s*)?\)\]/g,
     "átlátszatlan bg-[rgba(...)] → tokenizáld"],
  ];
  for (const abs of walk(path.join(ROOT, "src"))) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    if (!rel.endsWith(".tsx") && !rel.endsWith(".ts")) continue;
    if (rel.startsWith("src/components/pdf/")) continue; // react-pdf, nem Tailwind
    const content = readFileSync(abs, "utf8");
    content.split("\n").forEach((line, i) => {
      for (const [re, hint] of PATTERNS) {
        re.lastIndex = 0;
        if (re.test(line)) untokenizedSurfaces.push(`${rel}:${i + 1}  ${hint}`);
      }
    });
  }
}

// (f) Tailwind ALAP-PALETTA költségkeret. A `bg-amber-50`, `text-rose-700`
//     stb. a Tailwind saját palettája — nem a mi tokenünk, ezért kimarad a
//     témázásból, és sötét módban világos marad.
//     A migráció LEZÁRVA (2026-08-07): mind a 677 előfordulás tokenre került.
//     A leképezés adatvezérelt volt — minden osztály a szemantikailag helyes
//     családon belül a perceptuálisan (OKLab) legközelebbi tokenre ment, hogy
//     a világos téma elmozdulása minimális legyen. Az `indigo` volt az egyetlen
//     nagy váltás: annak nincs Trita-jelentése (admin-felületi „kijelölt /
//     elsődleges akció"), ezért a zsálya-családra került.
//     A keret innentől 0: új Tailwind-paletta osztály nem kerülhet be.
const TW_PALETTE_BUDGET = 0;
let twPaletteCount = 0;
const twPaletteByFile = new Map();
{
  const RE =
    /\b(bg|text|border|ring|from|to|via|divide|outline|decoration|fill|stroke|accent|placeholder)-(slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-(50|100|200|300|400|500|600|700|800|900|950)\b/g;
  for (const abs of walk(path.join(ROOT, "src"))) {
    const rel = path.relative(ROOT, abs).split(path.sep).join("/");
    if (!rel.endsWith(".tsx")) continue;
    const hits = readFileSync(abs, "utf8").match(RE);
    if (hits) {
      twPaletteCount += hits.length;
      twPaletteByFile.set(rel, hits.length);
    }
  }
}

let failed = false;

if (twPaletteCount > TW_PALETTE_BUDGET) {
  failed = true;
  console.error(
    `\ncheck-colors: Tailwind alap-paletta osztály: ${twPaletteCount} > keret ` +
      `(${TW_PALETTE_BUDGET}). Ezek sötét módban világosak maradnak.`,
  );
  for (const [file, n] of [...twPaletteByFile.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10)) {
    console.error(`  ${String(n).padStart(3)}  ${file}`);
  }
  console.error(
    "\nHasználd a --color-state-* / --color-surface-* tokeneket; ha tudatos " +
      "kivétel, emeld a keretet indoklással ebben a scriptben.",
  );
}


if (untokenizedSurfaces.length > 0) {
  failed = true;
  console.error(
    "check-colors: témázhatatlan felület-osztály — sötét módban világos marad:\n",
  );
  for (const v of untokenizedSurfaces.slice(0, 25)) console.error("  " + v);
  if (untokenizedSurfaces.length > 25) {
    console.error(`  … és még ${untokenizedSurfaces.length - 25} hely`);
  }
}


if (missingInDark.length > 0) {
  failed = true;
  console.error(
    "check-colors: a sötét blokkból hiányzó szerep-token — sötéten a világos " +
      "értékén ragadna:\n",
  );
  for (const v of missingInDark) console.error("  " + v);
  console.error(
    "\nMásold be a @theme-ből a teljes sort a `[data-theme=\"dark\"] .theme-scope` " +
      "blokk alias-rétegébe (a var() a deklaráló elemen oldódik fel).",
  );
}

if (scopelessLayouts.length > 0) {
  failed = true;
  console.error(
    "check-colors: route-csoport a sötét mód hatókörén KÍVÜL — ott a világos " +
      "téma marad, akkor is, ha a látogató sötétre váltott:\n",
  );
  for (const v of scopelessLayouts) console.error("  " + v);
  console.error(
    '\nCsomagold a shell tartalmát: <div className="theme-scope">{children}</div>.',
  );
}

if (themeNotStatic.length > 0) {
  failed = true;
  console.error(
    "check-colors: a @theme blokk nem `static` — a nem hivatkozott szerep-tokenek " +
      "kimaradnak a VILÁGOS kimenetből, miközben sötéten (kézzel írt blokk) megvannak:\n",
  );
  for (const v of themeNotStatic) console.error("  " + v);
  console.error("\nÍrd `@theme static inline { … }` alakra.");
}

if (themeLiterals.length > 0) {
  failed = true;
  console.error(
    "check-colors: literál hex a @theme blokkban — ezek a tokenek NEM témázhatók:\n",
  );
  for (const v of themeLiterals) console.error("  " + v);
  console.error(
    "\nA nyers érték helye a --palette-* réteg (sima :root a @theme felett), " +
      "a @theme tokenje pedig hivatkozzon rá: --color-x: var(--palette-x).",
  );
}

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
  `check-colors OK — tiltólista tiszta, @theme static + témázható (0 literál), ` +
    `sötét alias-réteg teljes, minden route-csoport hatókörben, felületek tokenizálva, ` +
    `TW-paletta ${twPaletteCount}/${TW_PALETTE_BUDGET}, ` +
    `nyers hex a UI-scope-ban: ${rawHexCount}/${RAW_HEX_BUDGET}.`,
);
