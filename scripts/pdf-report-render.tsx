/**
 * pdf-report-render.ts — közös node-oldali render + lap-audit a riport-PDF-hez.
 *
 * A böngészőben a `styles.ts` a `/fonts/…` origin-útra regisztrál; node-ban
 * (snapshot-script, tesztek) abszolút fájlútra kell átregisztrálni, különben a
 * render elszáll. Ez a modul egyszer teszi meg, és ad egy külső eszköz nélküli
 * lap-auditot is.
 */

import zlib from "node:zlib";
import { join } from "node:path";
import { Font, renderToBuffer } from "@react-pdf/renderer";
import React from "react";

import { TritaReportDocument } from "../src/components/pdf/TritaPdf";
import type { ProfileReportInput } from "../src/lib/profile-report-view-model";

let registered = false;

export function registerPdfFonts(fontDir = join(process.cwd(), "public", "fonts")): void {
  if (registered) return;
  Font.clear();
  Font.register({
    family: "Fraunces",
    fonts: [
      { src: join(fontDir, "Fraunces-Regular.ttf"), fontWeight: 400 },
      { src: join(fontDir, "Fraunces-SemiBold.ttf"), fontWeight: 600 },
      { src: join(fontDir, "Fraunces-Italic.ttf"), fontStyle: "italic" },
    ],
  });
  Font.register({
    family: "DM Sans",
    fonts: [
      { src: join(fontDir, "DMSans-Regular.ttf"), fontWeight: 400 },
      { src: join(fontDir, "DMSans-Medium.ttf"), fontWeight: 500 },
      { src: join(fontDir, "DMSans-SemiBold.ttf"), fontWeight: 600 },
    ],
  });
  // A Font.clear() a beépített Helvetica-fallbacket is törli; a react-pdf
  // néhány alapértelmezett szövegnél ezt kéri — pótoljuk, hogy egy variáns se
  // hiányozzon (magyar glyphek, normal + italic).
  Font.register({
    family: "Helvetica",
    fonts: [
      { src: join(fontDir, "DMSans-Regular.ttf"), fontWeight: 400 },
      { src: join(fontDir, "DMSans-SemiBold.ttf"), fontWeight: 700 },
      { src: join(fontDir, "Fraunces-Italic.ttf"), fontWeight: 400, fontStyle: "italic" },
      { src: join(fontDir, "Fraunces-Italic.ttf"), fontWeight: 700, fontStyle: "italic" },
    ],
  });
  registered = true;
}

export async function renderReportBuffer(input: ProfileReportInput): Promise<Buffer> {
  registerPdfFonts();
  return renderToBuffer(<TritaReportDocument data={input} />);
}

// ─── Lap-audit ───────────────────────────────────────────────────────────────
//
// Az „üresen lebegő oldal" (2026-08-18) osztályának őre: ha egy elem alsó
// margója éppen túllóg a tartalom-dobozon, a react-pdf ÜRES folytatás-lapot
// nyit — csak a fixed fejléc és lábléc látszik rajta. A PDF-ből ezt külső
// eszköz nélkül is ki lehet olvasni: minden lap tartalom-streamje
// FlateDecode-olt, kicsomagolva megszámolhatók a szöveg-kirajzoló operátorok.

// A lap tartalom-streamje FlateDecode-olt; kicsomagolva megszámolhatók a
// szöveg-kirajzoló operátorok (`Tj` / `TJ`). A fixed fejléc + lábléc minden
// lapon UGYANANNYIT ad — ez a determinisztikus alapköltség, és ami efölött
// van, az a lap tényleges tartalma.
//
// (Y-koordináta szerinti szűrés nem járható út: a react-pdf a szöveget
// egymásba ágyazott `cm` transzformációkkal helyezi el, tehát a `Tm` önmagában
// nem adja a lap-pozíciót — ahhoz teljes CTM-értelmezés kellene.)
const TEXT_OPERATOR = /\bT[jJ]\b/g;

/** Egy laphoz tartozó szöveg-kirajzoló operátorok száma. */
export function pageTextOperatorCounts(pdf: Buffer): number[] {
  const raw = pdf.toString("latin1");

  // objektumszám → nyers objektum-törzs
  const objects = new Map<number, { start: number; end: number }>();
  const objectRe = /(\d+)\s+0\s+obj\b/g;
  let match: RegExpExecArray | null;
  while ((match = objectRe.exec(raw)) !== null) {
    const end = raw.indexOf("endobj", match.index);
    objects.set(Number(match[1]), { start: match.index, end: end === -1 ? raw.length : end });
  }

  const counts: number[] = [];
  for (const [, range] of objects) {
    const body = raw.slice(range.start, range.end);
    if (!/\/Type\s*\/Page\b/.test(body) || /\/Type\s*\/Pages\b/.test(body)) continue;

    const contents = body.match(/\/Contents\s+(\d+)\s+0\s+R/);
    const target = contents ? objects.get(Number(contents[1])) : undefined;
    if (!target) {
      counts.push(0);
      continue;
    }

    const streamBody = raw.slice(target.start, target.end);
    const streamStart = streamBody.indexOf("stream");
    if (streamStart === -1) {
      counts.push(0);
      continue;
    }
    // A `stream` kulcsszót CRLF vagy LF követi.
    let dataStart = streamStart + "stream".length;
    if (streamBody[dataStart] === "\r") dataStart++;
    if (streamBody[dataStart] === "\n") dataStart++;
    const dataEnd = streamBody.lastIndexOf("endstream");
    const slice = Buffer.from(streamBody.slice(dataStart, dataEnd), "latin1");

    let content: string;
    try {
      content = zlib.inflateSync(slice).toString("latin1");
    } catch {
      // Tömörítetlen stream (vagy ismeretlen szűrő) — nyersen is elemezhető.
      content = slice.toString("latin1");
    }
    counts.push((content.match(TEXT_OPERATOR) ?? []).length);
  }
  return counts;
}

/**
 * A fixed fejléc + lábléc önmagában ENNYI szöveg-operátort ad egy tartalom
 * nélküli lapon (mért érték; a szójel-darabok, a meta-sor, a tagline és az
 * oldalszám együtt). Az „üresen lebegő lap" pontosan ennyinél áll meg.
 */
export const CHROME_TEXT_OPERATORS = 16;

/**
 * Az érdemi tartalom nélküli lapok 0-alapú indexei.
 *
 * A BORÍTÓ (0. lap) kimarad: nincs rajta lábléc, és a felépítése is egészen
 * más (nagy grafika, kevés szöveg) — rá nem érvényes ez a mérce.
 */
export function findBlankPages(pdf: Buffer): number[] {
  return pageTextOperatorCounts(pdf).flatMap((count, index) =>
    index > 0 && count <= CHROME_TEXT_OPERATORS ? [index] : [],
  );
}
