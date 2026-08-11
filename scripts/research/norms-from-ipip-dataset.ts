/**
 * KÖZELÍTŐ NORMA-REFERENCIA az OpenPsychometrics IPIP–HEXACO nyers
 * adatából — CSAK BELSŐ KALIBRÁCIÓRA (termékdöntés, 2026-08-11).
 *
 *   npx tsx scripts/research/norms-from-ipip-dataset.ts --download
 *   npx tsx scripts/research/norms-from-ipip-dataset.ts --csv <adatfájl> \
 *     [--codebook <fájl>] [--form=short|full|both] [--json <fájl>] \
 *     [--screen <oszlop><op><érték>] [--dump-codebook]
 *
 * A doksi számait előállító futtatás (2026-08-11, n=21 681 / 21 675):
 *   --csv .../data.csv --codebook .../codebook.txt --form=both \
 *   --screen "V1>=5" --screen "V2>=5"
 * Eredmény + forrás-URL + MD5: docs/research/ipip-reference-2026-08.md
 *
 * MIT CSINÁL
 *  - Az openpsychometrics.org/_rawdata/ „IPIP HEXACO” adatcsomagjából
 *    (240 item, N≈22e) kiválogatja a TSFI-be átvett itemeket (a codebook
 *    oszlop→itemszöveg térképe alapján, normalizált szövegegyezéssel —
 *    a provenance-doksi 5 adaptált itemjére explicit felülírással).
 *  - A válaszokból a scoring.ts-szel AZONOS POMP-pontozással (a motort
 *    importálja, nem másolja) kiszámolja a dimenzió- és facet-pontokat a
 *    TSFI-S (60 itemes) és a teljes (100−8 itemes) formára.
 *  - Dimenziónként: n, átlag, mintavételi szórás, decilisek, VALÓDI
 *    Cronbach-α + átlagos item-item korreláció + implikált SEM — a
 *    psychometrics.ts konstansai mellett (FIGYELEM: 2026-08-11 óta ezek maguk
 *    is EBBŐL a mintából származnak, tehát az összevetés mért-vs-mért),
 *    hogy a kalibrációs delta explicit legyen. Sáv-kihasználtság a két élő
 *    vágásrendszerre (40/70 és 35/65) — a norms-from-results.ts mintája.
 *  - A végén NormTable-kompatibilis JSON-blokkot ír ki
 *    (version = "ipip-ref-<dátum>").
 *
 * AMIT NEM SZABAD VELE
 *  - A kimenet NEM kerülhet a src/lib/norms.ts ACTIVE_NORM_TABLE-jébe:
 *    a minta nemzetközi, ANGOL nyelvű, önszelektált online kitöltőkből
 *    áll — a magyar/ügyfél-populációra percentilist állítani belőle
 *    hiteltelen (termékdöntés: 2026-08-11). Belső kalibrációs referencia:
 *    küszöb-ellenőrzés, α/SEM-priorok, sáv-kihasználtsági sanity-check.
 *
 * A script DB-t nem érint (DATABASE_URL nem kell), hálózatot csak a
 * --download mód használ. A letöltött nyers adat a scripts/research/.data/
 * alá kerül, ami gitignore-olt — se a zip, se a CSV nem commitolható.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { TestType } from "@prisma/client";
import { calculateScores } from "../../src/lib/scoring";
import { tritanConfig } from "../../src/lib/questions/tritan";
import type { AssessmentForm, LikertQuestion } from "../../src/lib/questions/types";
import type { DimNorm, NormTable } from "../../src/lib/norms";
import {
  alphaFromItems,
  dimStandardError,
  ITEMS_PER_DIM,
  MEAN_ITEM_R,
  SCORE_SD,
} from "../../src/lib/psychometrics";
import { getDimensionTier } from "../../src/lib/dimension-utils";
import {
  PROFILE_HIGH_THRESHOLD,
  PROFILE_LOW_THRESHOLD,
} from "../../src/lib/profile-engine";
import {
  HEXACO_DIMENSIONS,
  HEXACO_ORDER,
  type HexacoCode,
} from "../../src/lib/hexaco";
import { fmt, mean, pct, percentile, roundTo, sampleSd } from "./stats";

// A scoring-motor TestType-ot vár; a bank kulcsa a "TRITAN" string —
// a Prisma-kliens betöltése nélkül (type-only import, futásidőben törlődik).
const TEST_TYPE = "TRITAN" as TestType;

const RAWDATA_INDEX_URL = "https://openpsychometrics.org/_rawdata/";
const DATA_DIR = path.resolve(process.cwd(), "scripts/research/.data");

// Tükör-fallback: az openpsychometrics.org felé sok futtatókörnyezet proxyja
// tiltó (2026-08-11: 403 CONNECT). A haghish/openpsychometrics repo az
// eredeti _rawdata/ klónja („solely for research purpose"), a HEXACO-csomag
// kicsomagolva érhető el — ellenőrzött MD5-ökkel, ld.
// docs/research/ipip-reference-2026-08.md.
const MIRROR_BASE =
  "https://raw.githubusercontent.com/haghish/openpsychometrics/main/HEXACO";

// ── Az 5 adaptált item (docs/product/tsfi-item-provenance.md táblája):
// a TSFI-szöveg eltér az IPIP-eredetitől, ezért a szövegegyezéshez az
// EREDETI IPIP-tételt használjuk. (12/36 az E/1+would-vágással is menne,
// de az explicit térkép a provenance-doksival tart tükröt.)
const IPIP_TEXT_OVERRIDES: Record<number, string> = {
  12: "Admire a really clever scam.",
  36: "Cheat to get ahead.",
  41: "Seek support.",
  50: "Leave a mess in my room.",
  78: "Tell other people what they want to hear so that they will do what I want them to do.",
};

// ── CLI ────────────────────────────────────────────────────────────────

interface Args {
  download: boolean;
  csvPath: string | null;
  codebookPath: string | null;
  forms: AssessmentForm[];
  jsonPath: string | null;
  dumpCodebook: boolean;
  manualScreens: ScreenSpec[];
}

/** `--screen COL>=5` / `COL=1` / `COL!=0` … — a megtartott sorok feltétele. */
type ScreenOp = ">=" | "<=" | "!=" | ">" | "<" | "=";
interface ScreenSpec {
  column: string;
  op: ScreenOp;
  value: string;
}

const SCREEN_OPS: ScreenOp[] = [">=", "<=", "!=", ">", "<", "="];

function parseScreen(raw: string): ScreenSpec | null {
  for (const op of SCREEN_OPS) {
    const at = raw.indexOf(op);
    if (at > 0) {
      return { column: raw.slice(0, at), op, value: raw.slice(at + op.length) };
    }
  }
  return null;
}

/** Igaz → a sor MEGMARAD. Számösszehasonlítás, ha mindkét oldal szám. */
function screenKeeps(spec: ScreenSpec, cell: string | undefined): boolean {
  const raw = cell ?? "";
  const lhs = Number(raw);
  const rhs = Number(spec.value);
  const numeric = raw !== "" && Number.isFinite(lhs) && Number.isFinite(rhs);
  switch (spec.op) {
    case "=":
      return numeric ? lhs === rhs : raw === spec.value;
    case "!=":
      return numeric ? lhs !== rhs : raw !== spec.value;
    case ">=":
      return numeric && lhs >= rhs;
    case "<=":
      return numeric && lhs <= rhs;
    case ">":
      return numeric && lhs > rhs;
    case "<":
      return numeric && lhs < rhs;
  }
}

function usage(): never {
  console.error(
    "Használat: npx tsx scripts/research/norms-from-ipip-dataset.ts " +
      "(--download | --csv <adatfájl>) [--codebook <fájl>] " +
      "[--form=short|full|both] [--json <fájl>] " +
      "[--screen <oszlop><op><érték>] [--dump-codebook]\n" +
      "  --screen operátorai: >= <= != > < =  (a feltétel a MEGTARTOTT sorokra igaz)\n" +
      '  pl. a HEXACO-csomag 7-fokú validitás-itemjeire: --screen "V1>=5" --screen "V2>=5"',
  );
  process.exit(2);
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const args: Args = {
    download: false,
    csvPath: null,
    codebookPath: null,
    forms: ["short", "full"],
    jsonPath: null,
    dumpCodebook: false,
    manualScreens: [],
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--download") {
      args.download = true;
    } else if (arg === "--csv") {
      args.csvPath = argv[++i] ?? null;
    } else if (arg === "--codebook") {
      args.codebookPath = argv[++i] ?? null;
    } else if (arg === "--json") {
      args.jsonPath = argv[++i] ?? null;
    } else if (arg === "--dump-codebook") {
      args.dumpCodebook = true;
    } else if (arg === "--screen") {
      const spec = parseScreen(argv[++i] ?? "");
      if (!spec) usage();
      args.manualScreens.push(spec);
    } else if (arg.startsWith("--form")) {
      const value = arg.includes("=") ? arg.split("=")[1] : argv[++i];
      if (value === "short" || value === "full") args.forms = [value];
      else if (value === "both") args.forms = ["short", "full"];
      else usage();
    } else {
      console.error(`Ismeretlen argumentum: ${arg}`);
      usage();
    }
  }
  if (!args.download && !args.csvPath) usage();
  return args;
}

// ── Letöltés (--download) ──────────────────────────────────────────────
// curl-lel megy (a shell-proxy env-et és CA-bundle-t a curl magától
// tiszteli — a Node fetch nem); siker esetén unzip a .data/ alá.

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const gitignore = path.join(DATA_DIR, ".gitignore");
  if (!fs.existsSync(gitignore)) {
    fs.writeFileSync(gitignore, "# nyers kutatási adat — SOHA nem commitoljuk\n*\n!.gitignore\n");
  }
}

function printManualDownloadHelp(reason: string) {
  console.log(`\nA letöltés nem sikerült: ${reason}`);
  console.log(`
KÉZI LETÖLTÉS
  1. Böngészőben nyisd meg: ${RAWDATA_INDEX_URL}
  2. Keresd a HEXACO sort ("IPIP HEXACO ... equivalence" — 240 item, N≈22 786)
     és töltsd le a zipet.
  3. Csomagold ki ide: scripts/research/.data/  (gitignore-olt — a zip és a
     CSV NEM kerülhet a repóba)
  4. Futtasd az elemzést:
     npx tsx scripts/research/norms-from-ipip-dataset.ts \\
       --csv scripts/research/.data/<kicsomagolt mappa>/data.csv
     (a codebookot a script az adatfájl mappájában magától megtalálja;
      ha máshol van: --codebook <fájl>)

  Ha az openpsychometrics.org felé a hálózat tiltott, a tükör közvetlenül:
     curl -sSL -o scripts/research/.data/data.csv ${MIRROR_BASE}/data.csv
     curl -sSL -o scripts/research/.data/codebook.txt ${MIRROR_BASE}/codebook.txt
`);
}

/**
 * Tükör-letöltés: a kicsomagolt data.csv + codebook.txt közvetlenül.
 * Csak akkor fut, ha az eredeti forrás nem érhető el.
 */
function tryMirrorDownload(): { dataFile: string; codebook: string | null } | null {
  const dataFile = path.join(DATA_DIR, "data.csv");
  const codebook = path.join(DATA_DIR, "codebook.txt");
  console.log(`Tükör-letöltés: ${MIRROR_BASE}/{data.csv,codebook.txt}`);
  try {
    for (const [url, target] of [
      [`${MIRROR_BASE}/data.csv`, dataFile],
      [`${MIRROR_BASE}/codebook.txt`, codebook],
    ]) {
      execFileSync("curl", ["-sSL", "--fail", "--max-time", "600", "-o", target, url], {
        stdio: "inherit",
      });
    }
  } catch (error) {
    console.log(`A tükör sem érhető el — ${String(error).slice(0, 200)}`);
    return null;
  }
  return { dataFile, codebook };
}

function curlText(url: string): string {
  return execFileSync("curl", ["-sSL", "--max-time", "120", url], {
    encoding: "utf-8",
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** Eredeti forrás → tükör → kézi útmutató, ebben a sorrendben. */
function tryDownload(): { dataFile: string; codebook: string | null } | null {
  ensureDataDir();
  const direct = tryOriginalDownload();
  if (direct) return direct;
  const mirrored = tryMirrorDownload();
  if (mirrored) return mirrored;
  printManualDownloadHelp("sem az eredeti forrás, sem a tükör nem érhető el");
  return null;
}

/** Az openpsychometrics.org indexéről a HEXACO-zip; hiba esetén null (+ ok). */
function tryOriginalDownload(): { dataFile: string; codebook: string | null } | null {
  const fail = (reason: string) => {
    console.log(`Az eredeti forrás nem használható: ${reason}`);
    return null;
  };
  let indexHtml: string;
  try {
    indexHtml = curlText(RAWDATA_INDEX_URL);
  } catch (error) {
    return fail(
      `az index-oldal (${RAWDATA_INDEX_URL}) nem érhető el — ${String(error).slice(0, 200)}`,
    );
  }
  // Az indexben a HEXACO-csomag zip-hivatkozását keressük.
  const hrefs = [...indexHtml.matchAll(/href=["']([^"']+\.zip)["']/gi)].map((m) => m[1]);
  const zipHref = hrefs.find((h) => /hexaco/i.test(h)) ?? null;
  if (!zipHref) {
    return fail("az indexoldalon nem találtam HEXACO nevű .zip hivatkozást");
  }
  const zipUrl = new URL(zipHref, RAWDATA_INDEX_URL).toString();
  const zipPath = path.join(DATA_DIR, path.basename(zipHref));
  console.log(`Letöltés: ${zipUrl}`);
  try {
    execFileSync("curl", ["-sSL", "--fail", "--max-time", "600", "-o", zipPath, zipUrl], {
      stdio: "inherit",
    });
  } catch (error) {
    return fail(`a zip letöltése megszakadt — ${String(error).slice(0, 200)}`);
  }
  const extractDir = path.join(
    DATA_DIR,
    path.basename(zipHref).replace(/\.zip$/i, ""),
  );
  try {
    fs.mkdirSync(extractDir, { recursive: true });
    execFileSync("unzip", ["-o", zipPath, "-d", extractDir], { stdio: "inherit" });
  } catch (error) {
    return fail(`az unzip nem futott le — ${String(error).slice(0, 200)}`);
  }
  const located = locateDataFiles(extractDir);
  if (!located) {
    return fail(`a kicsomagolt mappában (${extractDir}) nem találtam adatfájlt`);
  }
  return located;
}

/** A kicsomagolt mappában a legnagyobb csv/tsv/txt az adat; a codebook névre megy. */
function locateDataFiles(dir: string): { dataFile: string; codebook: string | null } | null {
  const files: string[] = [];
  const walk = (d: string) => {
    for (const entry of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, entry.name);
      if (entry.isDirectory()) walk(full);
      else files.push(full);
    }
  };
  walk(dir);
  const codebook =
    files.find((f) => /codebook/i.test(path.basename(f))) ?? null;
  const candidates = files
    .filter((f) => /\.(csv|tsv|txt)$/i.test(f) && f !== codebook)
    .sort((a, b) => fs.statSync(b).size - fs.statSync(a).size);
  if (candidates.length === 0) return null;
  return { dataFile: candidates[0], codebook };
}

// ── Codebook-értelmezés → oszlopnév → itemszöveg ───────────────────────

/**
 * Item-szöveg normalizálás a TSFI↔codebook egyeztetéshez: kisbetűs,
 * írásjel-mentes, az E/1 alany („I " / „I would ") levágva — az IPIP
 * alany nélküli frázisokat közöl, a TSFI E/1-et (provenance-doksi).
 */
function normText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/\(r(everse[ds]?)?\)/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^i would /, "")
    .replace(/^i /, "");
}

/**
 * Codebook-sorok → {oszlopnév → itemszöveg}. Csak azok a sorok számítanak,
 * amelyek első tokenje TÉNYLEGES adatoszlop (a fejléc ellenőrzi) — így a
 * kísérőszöveg nem szennyez. Elfogadott formák:
 *   COL<TAB>szöveg · COL: szöveg · COL  "szöveg" · COL - szöveg
 * HTML-codebooknál a tageket előbb lecsupaszítja.
 */
function parseCodebook(
  raw: string,
  headerColumns: readonly string[],
): Map<string, string> {
  const byLower = new Map(headerColumns.map((c) => [c.toLowerCase(), c]));
  const text = raw.replace(/<[^>]+>/g, " ").replace(/&quot;/g, '"');
  const map = new Map<string, string>();
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*"?([A-Za-z][A-Za-z0-9_.]{0,40})"?\s*[:\t\-–]?\s+(.+?)\s*$/);
    if (!m) continue;
    const column = byLower.get(m[1].toLowerCase());
    if (!column || map.has(column)) continue;
    const itemText = m[2].replace(/^["“]+|["”]+$/g, "").trim();
    if (itemText.length < 3) continue;
    map.set(column, itemText);
  }
  return map;
}

// ── Adatfájl-beolvasás ─────────────────────────────────────────────────

function detectDelimiter(headerLine: string): string {
  const counts: Array<[string, number]> = [
    ["\t", (headerLine.match(/\t/g) ?? []).length],
    [",", (headerLine.match(/,/g) ?? []).length],
    [";", (headerLine.match(/;/g) ?? []).length],
  ];
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0][1] > 0 ? counts[0][0] : "\t";
}

function splitLine(line: string, delim: string): string[] {
  // Az OP-adatok nem tartalmaznak idézőjeles-vesszős mezőket; a sima split
  // elég — az esetleges körbeidézőjelet mezőnként vágjuk.
  return line.split(delim).map((cell) => cell.replace(/^"|"$/g, "").trim());
}

// ── Statisztikai segédek (csak itt kellenek) ───────────────────────────

/** Mintavételi variancia (n−1); n < 2 → NaN. */
function sampleVar(values: readonly number[]): number {
  const sd = sampleSd(values);
  return sd * sd;
}

/** Cronbach-α item-oszlopokból (komplett mátrix, sorok = kitöltők). */
function cronbachAlpha(itemColumns: readonly number[][]): number {
  const k = itemColumns.length;
  if (k < 2) return Number.NaN;
  const n = itemColumns[0].length;
  if (n < 2) return Number.NaN;
  const itemVarSum = itemColumns.reduce((sum, col) => sum + sampleVar(col), 0);
  const totals = new Array<number>(n).fill(0);
  for (const col of itemColumns) {
    for (let i = 0; i < n; i += 1) totals[i] += col[i];
  }
  const totalVar = sampleVar(totals);
  if (!(totalVar > 0)) return Number.NaN;
  return (k / (k - 1)) * (1 - itemVarSum / totalVar);
}

function pearson(xs: readonly number[], ys: readonly number[]): number {
  const n = xs.length;
  if (n < 2) return Number.NaN;
  const mx = mean(xs);
  const my = mean(ys);
  let sxy = 0;
  let sxx = 0;
  let syy = 0;
  for (let i = 0; i < n; i += 1) {
    const dx = xs[i] - mx;
    const dy = ys[i] - my;
    sxy += dx * dy;
    sxx += dx * dx;
    syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return Number.NaN;
  return sxy / Math.sqrt(sxx * syy);
}

/** Átlagos item-item (páronkénti Pearson) korreláció. */
function meanInterItemR(itemColumns: readonly number[][]): number {
  const rs: number[] = [];
  for (let a = 0; a < itemColumns.length; a += 1) {
    for (let b = a + 1; b < itemColumns.length; b += 1) {
      const r = pearson(itemColumns[a], itemColumns[b]);
      if (Number.isFinite(r)) rs.push(r);
    }
  }
  return mean(rs);
}

/** 35/65-ös pólus-sáv — a profile-engine categorize (szigorú >/<) tükre. */
function poleBand(score: number): "low" | "mid" | "high" {
  if (score > PROFILE_HIGH_THRESHOLD) return "high";
  if (score < PROFILE_LOW_THRESHOLD) return "low";
  return "mid";
}

function dimLabel(code: HexacoCode): string {
  const dim = HEXACO_DIMENSIONS[code];
  return `${dim.letter} ${dim.hu} (${code})`;
}

const DECILE_PS = [10, 20, 30, 40, 50, 60, 70, 80, 90] as const;

// ── Fő pipeline ────────────────────────────────────────────────────────

interface MappedItem {
  question: LikertQuestion;
  column: string;
  columnIndex: number;
}

interface FormReport {
  form: AssessmentForm;
  n: number;
  excludedIncomplete: number;
  dims: Array<{
    code: HexacoCode;
    kMapped: number;
    kBank: number;
    n: number;
    mean: number;
    sd: number;
    deciles: number[];
    alphaObserved: number;
    alphaPriorMappedK: number;
    meanItemR: number;
    semObserved: number;
    bands4070: { low: number; mid: number; high: number };
    bands3565: { low: number; mid: number; high: number };
  }>;
  alphaPriorForm: number;
  semPriorForm: number;
  facets: Array<{
    dim: HexacoCode;
    facet: string;
    itemsMapped: number;
    itemsTotal: number;
    n: number;
    mean: number;
    sd: number;
  }>;
  normTable: NormTable;
}

function main() {
  const args = parseArgs();

  // ── bemeneti fájlok ──
  let dataFile: string;
  let codebookFile: string | null = args.codebookPath;
  if (args.download) {
    const located = tryDownload();
    if (!located) {
      // Kézi útmutató már kiment — a feladat-konvenció szerint exit 0.
      process.exit(0);
    }
    dataFile = located.dataFile;
    codebookFile = codebookFile ?? located.codebook;
    console.log(`\nAdatfájl: ${dataFile}`);
  } else {
    dataFile = path.resolve(args.csvPath!);
    if (!fs.existsSync(dataFile)) {
      console.error(`Nincs ilyen adatfájl: ${dataFile}`);
      process.exit(1);
    }
    if (!codebookFile) {
      const sibling = locateDataFiles(path.dirname(dataFile));
      codebookFile = sibling?.codebook ?? null;
    }
  }
  if (!codebookFile || !fs.existsSync(codebookFile)) {
    console.error(
      "Nem találtam codebookot (az oszlop→itemszöveg térképhez kell) — add meg: --codebook <fájl>.",
    );
    process.exit(1);
  }

  // ── beolvasás ──
  const rawData = fs.readFileSync(dataFile, "utf-8");
  const lines = rawData.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length < 2) {
    console.error("Az adatfájl üres vagy csak fejlécet tartalmaz.");
    process.exit(1);
  }
  const delim = detectDelimiter(lines[0]);
  const header = splitLine(lines[0], delim);
  const headerIndex = new Map(header.map((c, i) => [c, i]));

  const codebookMap = parseCodebook(fs.readFileSync(codebookFile, "utf-8"), header);
  if (args.dumpCodebook) {
    console.log("── Codebookból értelmezett oszlop→szöveg párok ──");
    for (const [col, text] of codebookMap) console.log(`${col}\t${text}`);
    console.log(`(${codebookMap.size} pár)\n`);
  }
  if (codebookMap.size === 0) {
    console.error(
      "A codebookból egyetlen oszlop→itemszöveg pár sem jött ki — nézd meg a " +
        "formátumát (--dump-codebook), és igazítsd a parseCodebook mintáit.",
    );
    process.exit(1);
  }

  // ── TSFI-item → adatoszlop egyeztetés ──
  const normToColumn = new Map<string, string>();
  for (const [col, text] of codebookMap) {
    const key = normText(text);
    if (key && !normToColumn.has(key)) normToColumn.set(key, col);
  }

  const questions = tritanConfig.questions as LikertQuestion[];
  const mapped: MappedItem[] = [];
  const unmapped: LikertQuestion[] = [];
  for (const q of questions) {
    const en = IPIP_TEXT_OVERRIDES[q.id] ?? q.textByLocale?.en ?? q.text;
    const column = normToColumn.get(normText(en));
    const columnIndex = column != null ? headerIndex.get(column) : undefined;
    if (column != null && columnIndex != null) {
      mapped.push({ question: q, column, columnIndex });
    } else {
      unmapped.push(q);
    }
  }

  console.log("── IPIP–HEXACO referencia-normák (openpsychometrics.org) ──────");
  console.log(`adatfájl: ${dataFile}`);
  console.log(`codebook: ${codebookFile} (${codebookMap.size} oszlop-leírás)`);
  console.log(
    `TSFI-item lefedettség: ${mapped.length}/${questions.length} item talált oszlopot`,
  );
  if (unmapped.length > 0) {
    console.log("\n── Nem leképezett TSFI-itemek ──");
    for (const q of unmapped) {
      console.log(
        `  #${q.id} [${q.dimension}/${q.facet ?? "-"}]${q.short ? " (TSFI-S)" : ""}: ` +
          `${q.textByLocale?.en ?? q.text}`,
      );
    }
    console.log(
      "  (A 8 kiegészítő item — social_self_esteem ×4, altruizmus ×4 — nem az\n" +
        "  IPIP–HEXACO 240-es poolból jön, ezekre ez várt kimenet. Bármi MÁS\n" +
        "  hiány szövegegyeztetési gond — ld. --dump-codebook.)",
    );
  }

  // Ha a magnak számító 92 IPIP–HEXACO itemből sok hiányzik, az egyeztetés
  // romlott el — hangosan szólunk, de lefutunk (részleges kép is informatív).
  if (mapped.length < 80) {
    console.log(
      `\nFIGYELEM: csak ${mapped.length} item képződött le (várt: 92) — a codebook-` +
        "egyeztetés valószínűleg hiányos, az eredmény torzult.",
    );
  }

  // ── sorok beolvasása + minőség-szűrés ──
  const mappedIndices = mapped.map((m) => m.columnIndex);

  // Ismert szűrő-oszlopok. Az OP-csomagokban előforduló minták:
  //  - VCL1..VCL16 szókincs-ellenőrzés: a VCL6/VCL9/VCL12 NEM létező szavak —
  //    aki ismerni állítja (=1), azt kizárjuk (standard OP-screen).
  //  - explicit komolyság-oszlop (pl. "seriousness"): csak kézzel, a codebook
  //    elolvasása után: --screen seriousness=<megtartott érték>.
  const vclFakeCols = ["VCL6", "VCL9", "VCL12"]
    .map((c) => headerIndex.get(c))
    .filter((i): i is number => i != null);
  // A jelöltek közé a validitás-itemek (OP-konvenció: V1, V2 …) is beleférnek —
  // a HEXACO-csomagban ezek az „értem az instrukciót" / „pontosan válaszoltam"
  // sorok, 7-fokú skálán, ezért kell a --screen-hez az operátor (pl. V1>=5).
  const screenCandidates = header.filter(
    (c) =>
      (/serious|attent|check|valid/i.test(c) || /^V\d+$/.test(c)) &&
      !mapped.some((m) => m.column === c),
  );
  const manualScreenIdx = args.manualScreens.map((spec) => {
    const idx = headerIndex.get(spec.column);
    if (idx == null) {
      console.error(`--screen: nincs "${spec.column}" nevű oszlop az adatban.`);
      process.exit(1);
    }
    return { ...spec, idx };
  });

  const appliedScreens: string[] = [];
  if (vclFakeCols.length > 0) {
    appliedScreens.push(
      "VCL-szókincsellenőrzés: VCL6/VCL9/VCL12 (nem létező szavak) = 1 → kizárva",
    );
  }
  for (const s of manualScreenIdx) {
    appliedScreens.push(`kézi szűrő: ${s.column} ${s.op} ${s.value} megtartva`);
  }

  interface Row {
    // csak a leképezett item-oszlopok értékei, item-sorrendben; NaN = hiányzó
    values: Float64Array;
  }
  const rows: Row[] = [];
  let totalRows = 0;
  let screenedOut = 0;
  const responseValueTally = new Map<number, number>();

  for (let li = 1; li < lines.length; li += 1) {
    const cells = splitLine(lines[li], delim);
    if (cells.length < header.length * 0.5) continue; // torzult sor
    totalRows += 1;
    if (vclFakeCols.some((i) => cells[i] === "1")) {
      screenedOut += 1;
      continue;
    }
    if (manualScreenIdx.some((s) => !screenKeeps(s, cells[s.idx]))) {
      screenedOut += 1;
      continue;
    }
    const values = new Float64Array(mappedIndices.length);
    for (let mi = 0; mi < mappedIndices.length; mi += 1) {
      const raw = cells[mappedIndices[mi]];
      const v = raw === "" || raw == null ? Number.NaN : Number(raw);
      values[mi] = Number.isFinite(v) ? v : Number.NaN;
      if (Number.isFinite(v) && Number.isInteger(v) && v >= 1 && v <= 9) {
        responseValueTally.set(v, (responseValueTally.get(v) ?? 0) + 1);
      }
    }
    rows.push({ values });
  }

  // ── válaszskála-detektálás (várt: 1..5; 0/üres = hiányzó az OP-konvenció) ──
  const totalResponses = [...responseValueTally.values()].reduce((a, b) => a + b, 0);
  let scaleMax = 5;
  for (const [value, count] of responseValueTally) {
    if (value > scaleMax && count > totalResponses * 0.001) scaleMax = value;
  }
  if (scaleMax !== 5) {
    console.log(
      `\nFIGYELEM: a válaszskála 1..${scaleMax}-nek tűnik (nem 1..5) — a pontozás ` +
        "előtt lineárisan 1..5-re képezzük, hogy a POMP-formula változatlan maradjon.",
    );
  }

  console.log(`\nsorok: ${totalRows} · minőség-szűrőn kiesett: ${screenedOut}`);
  console.log(
    `alkalmazott szűrés: ${appliedScreens.length > 0 ? appliedScreens.join(" · ") : "nincs (a csomagban nem találtam ismert szűrő-oszlopot)"}`,
  );
  if (screenCandidates.length > 0) {
    console.log(
      `szűrő-jelölt oszlopok az adatban (kézi --screen-hez): ${screenCandidates.join(", ")}`,
    );
  }

  // ── formánkénti pontozás + statisztika ──
  const reports: FormReport[] = [];
  for (const form of args.forms) {
    reports.push(
      analyzeForm(form, mapped, rows, scaleMax, questions),
    );
  }

  for (const report of reports) printFormReport(report);

  // ── NormTable-blokk + hangos figyelmeztetés ──
  const primary =
    reports.find((r) => r.form === "short") ?? reports[0];
  console.log(`
╔══════════════════════════════════════════════════════════════════════╗
║  FIGYELEM — TERMÉKDÖNTÉS (2026-08-11):                               ║
║  Ez a tábla NEM kerülhet a src/lib/norms.ts ACTIVE_NORM_TABLE-jébe.  ║
║  Nemzetközi, ANGOL nyelvű, önszelektált online minta — a felületen   ║
║  percentilist mutatni belőle hiteltelen. KIZÁRÓLAG belső kalibrációs ║
║  referencia (küszöbök, Cronbach-α, SEM-priorok ellenőrzése).         ║
╚══════════════════════════════════════════════════════════════════════╝`);
  console.log(
    `\n── NormTable-kompatibilis blokk (form=${primary.form}) — BELSŐ REFERENCIA ──`,
  );
  console.log(JSON.stringify(primary.normTable, null, 2));

  if (args.jsonPath) {
    const jsonReport = {
      generatedAt: new Date().toISOString(),
      dataFile,
      codebookFile,
      screens: appliedScreens,
      screenCandidates,
      rows: { total: totalRows, screenedOut },
      scaleMax,
      mapping: {
        mapped: mapped.map((m) => ({ id: m.question.id, column: m.column })),
        unmapped: unmapped.map((q) => ({
          id: q.id,
          dimension: q.dimension,
          facet: q.facet ?? null,
          short: q.short === true,
        })),
      },
      priors: { MEAN_ITEM_R, SCORE_SD },
      forms: reports,
    };
    fs.writeFileSync(args.jsonPath, JSON.stringify(jsonReport, null, 2));
    console.log(`\nJSON: ${args.jsonPath}`);
  }
}

function analyzeForm(
  form: AssessmentForm,
  mapped: MappedItem[],
  rows: Array<{ values: Float64Array }>,
  scaleMax: number,
  allQuestions: LikertQuestion[],
): FormReport {
  const formItems = mapped
    .map((m, mi) => ({ ...m, mi }))
    .filter((m) => (form === "short" ? m.question.short === true : true));

  // 1..scaleMax → 1..5 (skála-eltérésnél); a POMP-formula változatlan marad.
  const rescale = (v: number) =>
    scaleMax === 5 ? v : 1 + (4 * (v - 1)) / (scaleMax - 1);

  // Komplett kitöltés-elv: a formára leképezett MINDEN item megválaszolva
  // (1..scaleMax) — N≈22e mellett megengedhető a szigorú teljesség, és így
  // az α/korreláció ugyanazon a mátrixon számolódik, mint a pontszám.
  const complete: Array<Map<number, number>> = [];
  let excludedIncomplete = 0;
  for (const row of rows) {
    const answers = new Map<number, number>();
    let ok = true;
    for (const item of formItems) {
      const v = row.values[item.mi];
      if (!Number.isFinite(v) || v < 1 || v > scaleMax) {
        ok = false;
        break;
      }
      answers.set(item.question.id, rescale(v));
    }
    if (ok) complete.push(answers);
    else excludedIncomplete += 1;
  }

  // ── pontozás a scoring.ts motorral (AZONOS POMP-logika, nem másolat) ──
  const dimScores = new Map<HexacoCode, number[]>(
    HEXACO_ORDER.map((c) => [c, []]),
  );
  const facetScores = new Map<string, number[]>();
  for (const answers of complete) {
    const result = calculateScores(
      TEST_TYPE,
      [...answers.entries()].map(([questionId, value]) => ({ questionId, value })),
    );
    for (const code of HEXACO_ORDER) {
      const v = result.dimensions[code];
      if (typeof v === "number") dimScores.get(code)?.push(v);
    }
    for (const [dimCode, facets] of Object.entries(result.facets ?? {})) {
      for (const [facetCode, v] of Object.entries(facets)) {
        // Csak azok a facetek, ahová tényleg esett leképezett item.
        if (!formItems.some((i) => i.question.dimension === dimCode && i.question.facet === facetCode)) {
          continue;
        }
        const key = `${dimCode}:${facetCode}`;
        if (!facetScores.has(key)) facetScores.set(key, []);
        facetScores.get(key)!.push(v);
      }
    }
  }

  const n = complete.length;

  // ── dimenziónkénti α / r̄ / SEM az item-mátrixból ──
  const dims = HEXACO_ORDER.map((code) => {
    const items = formItems.filter((i) => i.question.dimension === code);
    // Fordított itemek kulcsirányba állítva (6−v) — a scoring.ts tükre.
    const itemColumns = items.map((item) =>
      complete.map((answers) => {
        const v = answers.get(item.question.id)!;
        return item.question.reversed ? 6 - v : v;
      }),
    );
    const scores = dimScores.get(code) ?? [];
    const alphaObserved = cronbachAlpha(itemColumns);
    const sd = sampleSd(scores);
    const bands4070 = { low: 0, mid: 0, high: 0 };
    const bands3565 = { low: 0, mid: 0, high: 0 };
    for (const v of scores) {
      bands4070[getDimensionTier(v)] += 1;
      bands3565[poleBand(v)] += 1;
    }
    const kBank = allQuestions.filter(
      (q) => q.dimension === code && (form === "short" ? q.short === true : true),
    ).length;
    return {
      code,
      kMapped: items.length,
      kBank,
      n: scores.length,
      mean: mean(scores),
      sd,
      deciles: DECILE_PS.map((p) => percentile(scores, p)),
      alphaObserved,
      alphaPriorMappedK: alphaFromItems(items.length),
      meanItemR: meanInterItemR(itemColumns),
      semObserved: Number.isFinite(alphaObserved)
        ? sd * Math.sqrt(Math.max(0, 1 - alphaObserved))
        : Number.NaN,
      bands4070,
      bands3565,
    };
  });

  // ── facet-lefedettség + leíró ──
  const facetReports: FormReport["facets"] = [];
  const facetDefs = new Map<string, { dim: HexacoCode; total: number }>();
  for (const q of allQuestions) {
    if (!q.facet || !HEXACO_ORDER.includes(q.dimension as HexacoCode)) continue;
    if (form === "short" && q.short !== true) continue;
    const key = `${q.dimension}:${q.facet}`;
    const entry = facetDefs.get(key) ?? { dim: q.dimension as HexacoCode, total: 0 };
    entry.total += 1;
    facetDefs.set(key, entry);
  }
  for (const [key, def] of facetDefs) {
    const [dimCode, facetCode] = key.split(":");
    const itemsMapped = formItems.filter(
      (i) => i.question.dimension === dimCode && i.question.facet === facetCode,
    ).length;
    const scores = facetScores.get(key) ?? [];
    facetReports.push({
      dim: def.dim,
      facet: facetCode,
      itemsMapped,
      itemsTotal: def.total,
      n: scores.length,
      mean: mean(scores),
      sd: sampleSd(scores),
    });
  }
  facetReports.sort(
    (a, b) =>
      HEXACO_ORDER.indexOf(a.dim) - HEXACO_ORDER.indexOf(b.dim) ||
      a.facet.localeCompare(b.facet),
  );

  const normTable: NormTable = {
    version: `ipip-ref-${new Date().toISOString().slice(0, 10)}${form === "full" ? "-full" : ""}`,
    source:
      "IPIP-HEXACO nemzetközi online minta (openpsychometrics.org), angol nyelvű, önszelektált — közelítő referencia, CSAK belső kalibrációra",
    n,
    dims: Object.fromEntries(
      dims.map((d) => [d.code, { mean: roundTo(d.mean, 2), sd: roundTo(d.sd, 2) }]),
    ) as Record<HexacoCode, DimNorm>,
  };

  return {
    form,
    n,
    excludedIncomplete,
    dims,
    alphaPriorForm: alphaFromItems(ITEMS_PER_DIM[form]),
    semPriorForm: dimStandardError(form),
    facets: facetReports,
    normTable,
  };
}

function printFormReport(report: FormReport) {
  const labelWidth =
    Math.max(...HEXACO_ORDER.map((c) => dimLabel(c).length)) + 2;

  console.log(
    `\n══ FORMA: ${report.form === "short" ? "TSFI-S (60 item)" : "teljes (100 item)"} — a leképezett itemekből ══`,
  );
  console.log(
    `n = ${report.n} komplett kitöltő · hiányos (kizárt): ${report.excludedIncomplete}`,
  );
  if (report.n === 0) {
    console.log("Nincs komplett kitöltés ezen a formán — a statisztika kimarad.");
    return;
  }
  if (report.n < 30) {
    console.log("FIGYELEM: n < 30 — kalibrációhoz kevés, a számok jelzésértékűek.");
  }

  console.log("\n── Leíró statisztika (0–100 POMP skála) ──");
  console.log(
    `${"dim".padEnd(labelWidth)}${"k".padStart(6)}${"átlag".padStart(8)}` +
      `${"szórás".padStart(8)}${DECILE_PS.map((p) => `P${p}`.padStart(7)).join("")}`,
  );
  for (const d of report.dims) {
    console.log(
      `${dimLabel(d.code).padEnd(labelWidth)}${`${d.kMapped}/${d.kBank}`.padStart(6)}` +
        `${fmt(d.mean).padStart(8)}${fmt(d.sd).padStart(8)}` +
        `${d.deciles.map((v) => fmt(v).padStart(7)).join("")}`,
    );
  }

  console.log("\n── Megbízhatóság: MÉRT vs PRIOR ──");
  console.log(
    `prior (psychometrics.ts): r̄=${MEAN_ITEM_R} → α(forma)=${fmt(report.alphaPriorForm, 3)} · ` +
      `SD=${SCORE_SD} → SEM≈${fmt(report.semPriorForm, 2)}`,
  );
  console.log(
    `${"dim".padEnd(labelWidth)}${"α mért".padStart(8)}${"α prior".padStart(9)}` +
      `${"r̄ mért".padStart(9)}${"r̄ prior".padStart(9)}${"SD mért".padStart(9)}` +
      `${"SD prior".padStart(9)}${"SEM mért".padStart(9)}${"SEM prior".padStart(10)}`,
  );
  for (const d of report.dims) {
    console.log(
      `${dimLabel(d.code).padEnd(labelWidth)}` +
        `${fmt(d.alphaObserved, 3).padStart(8)}${fmt(d.alphaPriorMappedK, 3).padStart(9)}` +
        `${fmt(d.meanItemR, 3).padStart(9)}${fmt(MEAN_ITEM_R, 3).padStart(9)}` +
        `${fmt(d.sd, 1).padStart(9)}${fmt(SCORE_SD, 1).padStart(9)}` +
        `${fmt(d.semObserved, 2).padStart(9)}${fmt(report.semPriorForm, 2).padStart(10)}`,
    );
  }
  console.log(
    "(α prior = alphaFromItems a LEKÉPEZETT itemszámmal; SEM mért = SD·√(1−α) a mért SD-vel)",
  );

  console.log("\n── Sáv-kihasználtság ──");
  console.log(
    `${"dim".padEnd(labelWidth)}${"40/70 (dimension-utils)".padStart(28)}` +
      `${"35/65 (profil-pólus)".padStart(28)}`,
  );
  console.log(
    `${"".padEnd(labelWidth)}${"low".padStart(10)}${"mid".padStart(9)}${"high".padStart(9)}` +
      `${"low".padStart(10)}${"mid".padStart(9)}${"high".padStart(9)}`,
  );
  for (const d of report.dims) {
    console.log(
      `${dimLabel(d.code).padEnd(labelWidth)}` +
        `${pct(d.bands4070.low, d.n).padStart(10)}${pct(d.bands4070.mid, d.n).padStart(9)}` +
        `${pct(d.bands4070.high, d.n).padStart(9)}` +
        `${pct(d.bands3565.low, d.n).padStart(10)}${pct(d.bands3565.mid, d.n).padStart(9)}` +
        `${pct(d.bands3565.high, d.n).padStart(9)}`,
    );
  }

  console.log("\n── Facet-lefedettség és leíró (részleges facet jelölve) ──");
  for (const f of report.facets) {
    const partial = f.itemsMapped < f.itemsTotal;
    console.log(
      `  ${HEXACO_DIMENSIONS[f.dim].letter} ${f.facet.padEnd(24)} ` +
        `${`${f.itemsMapped}/${f.itemsTotal}`.padStart(5)} item ` +
        `${partial ? (f.itemsMapped === 0 ? "NINCS LEFEDVE " : "RÉSZLEGES     ") : "teljes        "}` +
        `n=${String(f.n).padStart(6)}  átlag=${fmt(f.mean).padStart(6)}  szórás=${fmt(f.sd).padStart(6)}`,
    );
  }
}

main();
