/**
 * Levél-eszköz generátor (fejlesztői eszköz, ritkán fut).
 *
 * Futtatás: pnpm build:email-art
 *
 * Két PNG-t állít elő a `public/email/` alá, és melléjük egy generált
 * konstans-modult (`src/lib/email-art.ts`) a megjelenítési méretekkel:
 *
 *   · wordmark.png — a KANONIKUS Trita szójel: egyszínű „trıta" Fraunces-ben,
 *     egyetlen bronz akcentussal a pontatlan i fölött. Ugyanaz a jel, mint a
 *     weben (`TritaLogo.tsx`) és a PDF-ben (`PdfWordmark.tsx`).
 *   · mark.png — a formanyelv 3. szintje: tinta-csillag, bronz nap, zsálya
 *     ellensúly. A geometria a KÖZÖS `miro-primitives.ts`-ből jön, tehát a
 *     levél jele nem tud elcsúszni a felület jelétől.
 *
 * MIÉRT KÉP, ÉS MIÉRT HOSZTOLT:
 *
 *   · A szójelet élő szövegként nem lehet hűen kirakni: a bronz i-pont
 *     `position:absolute`-ot igényelne, amit a Gmail eltávolít, a Fraunces
 *     pedig a kliensek többségében nem töltődik be (Georgia renderelne).
 *   · A `data:` URI-t a Gmail kidobja képforrásként, az inline SVG-t sem
 *     rendereli — marad a hosztolt PNG vagy a cid-melléklet. A melléklet
 *     minden levélre gemkapcsot tenne, ezért hosztolt fájl.
 *   · Kikapcsolt képeknél a szójel `alt` szövege lép a helyére, a
 *     `<img>`-en megadott betű- és színstílusokkal; a dekoratív jel
 *     (`alt=""`) nyomtalanul eltűnik.
 *
 * A renderelés Chromiumban megy (Playwright), a helyi TTF-ekkel — nincs
 * hálózati függés, és a kimenet determinisztikus.
 */

import { chromium } from "@playwright/test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { COLORS } from "../src/lib/design-tokens";
import { starArms, r2 } from "../src/lib/miro-primitives";

const ROOT = process.cwd();
const OUT_DIR = join(ROOT, "public", "email");
const MODULE_PATH = join(ROOT, "src", "lib", "email-art.ts");

/** A PNG-k 2× felbontásban készülnek a retina-inboxokhoz. */
const SCALE = 2;

// ─── Szójel ──────────────────────────────────────────────────────────────────

/**
 * A megjelenítési betűméret. A `TritaWordmark` a weben `font-black` (900), de
 * a repóban a Fraunces SemiBold statikus vágata él — a PDF-szójel ugyanezért
 * rajzol 600-zal. A levél a PDF-et követi: egy médium, egy elérhető vágat.
 */
const WORDMARK_FONT_PX = 26;

function wordmarkHtml(fontDataUri: string): string {
  const size = WORDMARK_FONT_PX * SCALE;
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    @font-face {
      font-family: 'FrauncesLocal';
      src: url('${fontDataUri}') format('truetype');
      font-weight: 600;
      font-style: normal;
    }
    html, body { margin: 0; padding: 0; background: transparent; }
    #wm {
      display: inline-block;
      /* A pont a betűdoboz FÖLÉ lóg (top: -0.045em), ezért kell felül hely —
         különben az elem-screenshot levágná. */
      padding: ${Math.ceil(size * 0.1)}px ${Math.ceil(size * 0.04)}px ${Math.ceil(size * 0.04)}px;
      font-family: 'FrauncesLocal', Georgia, serif;
      font-weight: 600;
      font-size: ${size}px;
      line-height: 1;
      letter-spacing: -0.03em;
      color: ${COLORS.ink};
      white-space: nowrap;
    }
    #wm .i { position: relative; display: inline-block; }
    #wm .dot {
      position: absolute;
      left: 50%;
      top: -0.045em;
      width: 0.22em;
      height: 0.22em;
      margin-left: -0.11em;
      border-radius: 50%;
      background: ${COLORS.bronze};
    }
  </style></head><body><span id="wm">tr<span class="i">ı<span class="dot"></span></span>ta</span></body></html>`;
}

// ─── Formanyelvi jel (3. szint) ──────────────────────────────────────────────

/**
 * A `StarLoader` statikus megfelelője, ugyanazokkal a konstansokkal.
 *
 * A hézagot a LEGHOSSZABB ághoz mérjük (a pulzus csúcsához), nem a nyugalmi
 * sugárhoz — így a kísérőjelek a felületen és a levélben azonos távolságra
 * ülnek. `place()` számol, hogy egy sugár-módosítás ne rontsa el a
 * kompozíciót észrevétlenül.
 */
const CENTER = 70;
const RADIUS = 38;
const STROKE = 5.5;
const MAX_ARM_REACH = RADIUS * 1.06;

function place(angleDeg: number, gap: number, radius: number) {
  const angle = (angleDeg * Math.PI) / 180;
  const distance = MAX_ARM_REACH + gap + radius;
  return {
    x: r2(CENTER + Math.cos(angle) * distance),
    y: r2(CENTER + Math.sin(angle) * distance),
    r: radius,
  };
}

const SUN = place(-45, 9, 13);
const COUNTERWEIGHT = place(145, 14, 8);

/** A jel megjelenítési mérete a láblécben. */
const MARK_DISPLAY_PX = 40;

function markSvg(): string {
  const arms = starArms(CENTER, CENTER, RADIUS)
    .map(
      (a) =>
        `<line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" stroke="${COLORS.ink}" stroke-width="${STROKE}" stroke-linecap="round"/>`,
    )
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${MARK_DISPLAY_PX * SCALE}" height="${MARK_DISPLAY_PX * SCALE}" viewBox="0 0 140 140">`
    + `<circle cx="${SUN.x}" cy="${SUN.y}" r="${SUN.r}" fill="${COLORS.bronze}"/>`
    + arms
    + `<circle cx="${COUNTERWEIGHT.x}" cy="${COUNTERWEIGHT.y}" r="${COUNTERWEIGHT.r}" fill="${COLORS.sage}"/>`
    + `</svg>`;
}

function markHtml(): string {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    html, body { margin: 0; padding: 0; background: transparent; }
    #mark { display: inline-block; line-height: 0; }
  </style></head><body><span id="mark">${markSvg()}</span></body></html>`;
}

// ─── Futtatás ────────────────────────────────────────────────────────────────

async function main() {
  mkdirSync(OUT_DIR, { recursive: true });

  const fontDataUri =
    "data:font/ttf;base64,"
    + readFileSync(join(ROOT, "public", "fonts", "Fraunces-SemiBold.ttf")).toString("base64");

  // PLAYWRIGHT_CHROMIUM_PATH: ugyanaz a menekülő-út, mint a playwright.config.ts-ben
  // — zárt környezetben a böngésző előre telepítve van, letölteni nem lehet.
  const browser = await chromium.launch(
    process.env.PLAYWRIGHT_CHROMIUM_PATH
      ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_PATH }
      : {},
  );
  const page = await browser.newPage({ viewport: { width: 800, height: 400 } });

  async function shoot(html: string, selector: string, file: string) {
    await page.setContent(html, { waitUntil: "load" });
    await page.evaluate(() => document.fonts.ready);
    const element = page.locator(selector);
    const box = await element.boundingBox();
    if (!box) throw new Error(`Nem mérhető elem: ${selector}`);
    await element.screenshot({ path: join(OUT_DIR, file), omitBackground: true });
    return {
      file,
      // A PNG 2×-es; a levélben a FELE méreten jelenik meg.
      width: Math.round(box.width / SCALE),
      height: Math.round(box.height / SCALE),
    };
  }

  const wordmark = await shoot(wordmarkHtml(fontDataUri), "#wm", "wordmark.png");
  const mark = await shoot(markHtml(), "#mark", "mark.png");

  await browser.close();

  const generated = `/**
 * GENERÁLT FÁJL — ne szerkeszd kézzel.
 * Forrás: \`scripts/build-email-art.ts\` (futtatás: pnpm build:email-art)
 *
 * A levél-eszközök megjelenítési mérete. Az \`<img>\` width/height attribútuma
 * ezekből jön: az arány elrontása minden levélben látszana, és a kliens-oldali
 * átméretezés a leggyakoribb forrása a homályos logónak.
 */
export const EMAIL_ART = {
  wordmark: { file: ${JSON.stringify(wordmark.file)}, width: ${wordmark.width}, height: ${wordmark.height} },
  mark: { file: ${JSON.stringify(mark.file)}, width: ${mark.width}, height: ${mark.height} },
} as const;
`;
  writeFileSync(MODULE_PATH, generated, "utf8");

  console.log(`✓ ${wordmark.file} — ${wordmark.width}×${wordmark.height} (2× PNG)`);
  console.log(`✓ ${mark.file} — ${mark.width}×${mark.height} (2× PNG)`);
  console.log(`✓ ${MODULE_PATH.replace(`${ROOT}/`, "")}`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
