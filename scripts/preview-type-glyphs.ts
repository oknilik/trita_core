/**
 * Típus-ábra előnézet-generátor (fejlesztői eszköz).
 * Futtatás: npx tsx scripts/preview-type-glyphs.ts [kimeneti-mappa]
 *
 * A 6×6 dimenzió-párra (36 típus-kombináció, ebből 6 „tiszta") kirendereli
 * a TypeGlyph komponenst statikus HTML-be, hogy a vizuális nyelvtan
 * böngészőben egyben ellenőrizhető legyen: megkülönböztethető-e minden
 * típus, és egy családba tartozónak látszik-e mind.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TypeGlyph, TypeMotifMark } from "../src/components/type/TypeGlyph";
import { DIMENSION_GLYPHS, GLYPH_DIMENSION_ORDER, GLYPH_COLORS } from "../src/lib/type-glyph";
import { resolvePersonalityTypeLabel } from "../src/lib/personality-type";
import { HEXACO_DIMENSIONS } from "../src/lib/hexaco";

const outDir = process.argv[2] ?? join(process.cwd(), ".glyph-previews");
mkdirSync(outDir, { recursive: true });

function dimensionName(code: string): string {
  return HEXACO_DIMENSIONS[code as keyof typeof HEXACO_DIMENSIONS]?.hu ?? code;
}

const cards: string[] = [];

for (const primary of GLYPH_DIMENSION_ORDER) {
  for (const secondary of GLYPH_DIMENSION_ORDER) {
    const label = resolvePersonalityTypeLabel(primary, secondary, "hu") ?? `${primary}×${secondary}`;
    const isPure = primary === secondary;
    const dimensionLabel = isPure
      ? `Tiszta ${dimensionName(primary)}`
      : `${dimensionName(primary)} × ${dimensionName(secondary)}`;

    const svg = renderToStaticMarkup(
      createElement(TypeGlyph, {
        primaryCode: primary,
        secondaryCode: secondary,
        typeLabel: label,
        dimensionLabel,
        variant: "card",
        intensity: 3,
      }),
    );

    cards.push(`
      <article class="card">
        ${svg}
        <div class="meta">
          <h3>${label}</h3>
          <p class="axes">${dimensionLabel}</p>
          <p class="grammar">
            alapforma: ${DIMENSION_GLYPHS[primary].formName.hu} (${DIMENSION_GLYPHS[primary].hexaco})
            · motívum: ${DIMENSION_GLYPHS[secondary].motifName.hu} (${DIMENSION_GLYPHS[secondary].hexaco})${isPure ? " — duplázva" : ""}
          </p>
        </div>
      </article>`);
  }
}

// Intenzitás-sor: ugyanaz a típus 1–5 szinten
const intensityCards = [1, 2, 3, 4, 5].map((level) => {
  const svg = renderToStaticMarkup(
    createElement(TypeGlyph, {
      primaryCode: "X",
      secondaryCode: "O",
      typeLabel: "Kísérletező hajtóerő",
      variant: "card",
      intensity: level,
    }),
  );
  return `<article class="card small">${svg}<div class="meta"><h3>Intenzitás ${level}</h3></div></article>`;
});

const html = `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trita típus-ábrák — 36 kombináció</title>
<style>
  :root { --cream:${GLYPH_COLORS.canvas}; --ink:${GLYPH_COLORS.line}; --bronze:${GLYPH_COLORS.form}; }
  body { margin:0; background:var(--cream); color:var(--ink);
         font-family: Georgia, 'Times New Roman', serif; line-height:1.55; }
  .wrap { max-width:1180px; margin:0 auto; padding:40px 24px 80px; }
  h1 { font-size:32px; font-weight:normal; margin:0 0 4px; }
  h2 { font-size:18px; letter-spacing:4px; text-transform:uppercase; font-weight:normal;
       border-bottom:1.5px solid var(--ink); padding-bottom:8px; margin:48px 0 20px; }
  .sub { font-style:italic; color:var(--bronze); margin:0 0 8px; }
  .cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:22px; }
  .card { background:#fff; border:1.5px solid var(--ink); border-radius:12px; overflow:hidden; }
  .card svg { width:100%; height:auto; display:block; }
  .card .meta { padding:12px 14px 16px; border-top:1.5px solid var(--ink); }
  .card h3 { margin:0 0 2px; font-size:17px; letter-spacing:1.5px; text-transform:uppercase; font-weight:normal; }
  .card .axes { margin:0 0 6px; font-size:13px; font-style:italic; color:var(--bronze); }
  .card .grammar { margin:0; font-size:12.5px; color:#4a4a5e; }
  .card.small svg { max-height:260px; }
</style></head><body><div class="wrap">
<h1>Trita típus-ábrák</h1>
<p class="sub">Miró-nyelvtan a valódi típusrendszeren: 6 HEXACO-dimenzió · domináns forma × másodlagos motívum · 36 kombináció (6 „tiszta")</p>
<h2>36 kombináció</h2>
<div class="cards">${cards.join("")}</div>
<h2>Intenzitás-skála (1–5)</h2>
<div class="cards">${intensityCards.join("")}</div>
</div></body></html>`;

const file = join(outDir, "index.html");
writeFileSync(file, html, "utf-8");

// Kontakt-ív: mind a 36 ábra egy képernyőn, feliratok nélkül — így egy
// pillantással ellenőrizhető, hogy a sorozat egy családba tartozik-e.
const sheetCells: string[] = [];
for (const primary of GLYPH_DIMENSION_ORDER) {
  for (const secondary of GLYPH_DIMENSION_ORDER) {
    const svg = renderToStaticMarkup(
      createElement(TypeGlyph, {
        primaryCode: primary,
        secondaryCode: secondary,
        typeLabel: `${primary}×${secondary}`,
        variant: "card",
        intensity: 3,
      }),
    );
    sheetCells.push(
      `<div class="cell">${svg}<span>${DIMENSION_GLYPHS[primary].hexaco}×${DIMENSION_GLYPHS[secondary].hexaco}</span></div>`,
    );
  }
}

const sheet = `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8"><title>Trita típus-ábrák — kontakt-ív</title>
<style>
  body { margin:0; background:${GLYPH_COLORS.canvas}; font-family:Georgia,serif; color:${GLYPH_COLORS.line}; }
  .wrap { padding:20px; }
  .grid { display:grid; grid-template-columns:repeat(6,1fr); gap:10px; }
  .cell { border:1px solid ${GLYPH_COLORS.line}; border-radius:8px; overflow:hidden; background:#fff; }
  .cell svg { width:100%; height:auto; display:block; }
  .cell span { display:block; text-align:center; font-size:11px; letter-spacing:2px; padding:3px 0; border-top:1px solid ${GLYPH_COLORS.line}; }
</style></head><body><div class="wrap"><div class="grid">${sheetCells.join("")}</div></div></body></html>`;

writeFileSync(join(outDir, "sheet.html"), sheet, "utf-8");

// ── Mátrix-nézet (body-only, Artifact-ként publikálható) ───────────────
// Sor = domináns dimenzió (alapforma), oszlop = második dimenzió
// (motívum). Az átló a hat „tiszta" típus.
const glyphCell = (primary: string, secondary: string) =>
  renderToStaticMarkup(
    createElement(TypeGlyph, {
      primaryCode: primary,
      secondaryCode: secondary,
      typeLabel: resolvePersonalityTypeLabel(primary, secondary, "hu") ?? "",
      variant: "card",
      intensity: 3,
    }),
  );

const motifMark = (code: string) =>
  renderToStaticMarkup(createElement(TypeMotifMark, { code, strokeWidth: 7 }));

const headerRow = GLYPH_DIMENSION_ORDER.map((code) => {
  const glyph = DIMENSION_GLYPHS[code];
  return `<div class="colhead">
      <div class="mark">${motifMark(code)}</div>
      <span class="code">${glyph.hexaco}</span>
      <span class="name">${glyph.motifName.hu}</span>
    </div>`;
}).join("");

const matrixRows = GLYPH_DIMENSION_ORDER.map((primary) => {
  const glyph = DIMENSION_GLYPHS[primary];
  const cells = GLYPH_DIMENSION_ORDER.map((secondary) => {
    const label = resolvePersonalityTypeLabel(primary, secondary, "hu") ?? "";
    const pure = primary === secondary;
    return `<figure class="cell${pure ? " pure" : ""}">
        ${glyphCell(primary, secondary)}
        <figcaption>
          <span class="label">${label}</span>
          <span class="pair">${glyph.hexaco}×${DIMENSION_GLYPHS[secondary].hexaco}${pure ? " · tiszta" : ""}</span>
        </figcaption>
      </figure>`;
  }).join("");
  return `<div class="rowhead">
      <span class="code">${glyph.hexaco}</span>
      <span class="name">${dimensionName(primary)}</span>
      <span class="form">${glyph.formName.hu}</span>
    </div>${cells}`;
}).join("");

const intensityStrip = [1, 2, 3, 4, 5]
  .map(
    (level) => `<figure class="cell">
        ${renderToStaticMarkup(
          createElement(TypeGlyph, {
            primaryCode: "X",
            secondaryCode: "O",
            typeLabel: "Kísérletező hajtóerő",
            variant: "card",
            intensity: level,
          }),
        )}
        <figcaption><span class="label">Szint ${level}</span></figcaption>
      </figure>`,
  )
  .join("");

const artifactBody = `<style>
  :root {
    --ground: ${GLYPH_COLORS.canvas};
    --panel: #ffffff;
    --ink: ${GLYPH_COLORS.line};
    --body: #4a4a5e;
    --muted: #7a756e;
    --accent: ${GLYPH_COLORS.form};
    --accent-deep: ${GLYPH_COLORS.captionAccent};
    --sage: ${GLYPH_COLORS.counterweight};
    --rule: #e8e0d3;
    --serif: Georgia, 'Iowan Old Style', 'Times New Roman', serif;
    --mono: ui-monospace, SFMono-Regular, Menlo, monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root {
      --ground: #14141d;
      --panel: #1d1d28;
      --ink: #f2efe8;
      --body: #c9c5bd;
      --muted: #938d84;
      --accent: #d79a68;
      --accent-deep: #e0b087;
      --sage: #7fae9e;
      --rule: #2f2f3d;
    }
  }
  :root[data-theme="dark"] {
    --ground: #14141d;
    --panel: #1d1d28;
    --ink: #f2efe8;
    --body: #c9c5bd;
    --muted: #938d84;
    --accent: #d79a68;
    --accent-deep: #e0b087;
    --sage: #7fae9e;
    --rule: #2f2f3d;
  }
  :root[data-theme="light"] {
    --ground: ${GLYPH_COLORS.canvas};
    --panel: #ffffff;
    --ink: ${GLYPH_COLORS.line};
    --body: #4a4a5e;
    --muted: #7a756e;
    --accent: ${GLYPH_COLORS.form};
    --accent-deep: ${GLYPH_COLORS.captionAccent};
    --sage: ${GLYPH_COLORS.counterweight};
    --rule: #e8e0d3;
  }

  body { margin: 0; background: var(--ground); color: var(--ink); font-family: var(--serif); }
  .page { max-width: 1240px; margin: 0 auto; padding: 56px 28px 96px; display: flex; flex-direction: column; gap: 56px; }
  .eyebrow { font-family: var(--mono); font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--accent-deep); margin: 0 0 10px; }
  h1 { font-size: clamp(30px, 5vw, 46px); line-height: 1.05; font-weight: 400; margin: 0 0 14px; text-wrap: balance; }
  h2 { font-size: 20px; font-weight: 400; letter-spacing: 0.16em; text-transform: uppercase; margin: 0 0 18px; padding-bottom: 10px; border-bottom: 1px solid var(--rule); }
  p { color: var(--body); font-size: 16.5px; line-height: 1.62; max-width: 66ch; margin: 0 0 12px; }
  .lede { font-size: 18px; font-style: italic; color: var(--accent-deep); max-width: 62ch; }
  .swatches { display: flex; flex-wrap: wrap; gap: 16px; margin-top: 18px; font-family: var(--mono); font-size: 11.5px; letter-spacing: 0.06em; color: var(--muted); }
  .swatches span { display: inline-flex; align-items: center; gap: 8px; }
  .swatches i { width: 18px; height: 18px; border-radius: 50%; border: 1px solid var(--rule); }

  .matrix-scroll { overflow-x: auto; }
  .matrix { display: grid; grid-template-columns: 132px repeat(6, minmax(148px, 1fr)); gap: 10px; min-width: 1060px; }
  .corner { align-self: end; font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); line-height: 1.5; }
  .colhead { display: flex; flex-direction: column; align-items: center; gap: 2px; text-align: center; }
  .colhead .mark { width: 34px; height: 34px; color: var(--ink); }
  .colhead .mark svg, .colhead .mark svg g { width: 100%; height: 100%; stroke: currentColor; }
  .colhead .code, .rowhead .code { font-family: var(--mono); font-size: 13px; letter-spacing: 0.1em; color: var(--accent); }
  .colhead .name, .rowhead .name { font-size: 12.5px; color: var(--muted); }
  .rowhead { display: flex; flex-direction: column; justify-content: center; gap: 2px; padding-right: 8px; }
  .rowhead .name { font-size: 14px; color: var(--ink); }
  .rowhead .form { font-size: 12.5px; font-style: italic; color: var(--muted); }

  .cell { margin: 0; background: var(--panel); border: 1px solid var(--rule); border-radius: 10px; overflow: hidden; }
  .cell.pure { border-color: var(--accent); }
  .cell svg { width: 100%; height: auto; display: block; }
  .cell figcaption { display: flex; flex-direction: column; gap: 1px; padding: 8px 10px 10px; border-top: 1px solid var(--rule); }
  .cell .label { font-size: 13px; line-height: 1.3; }
  .cell .pair { font-family: var(--mono); font-size: 10.5px; letter-spacing: 0.12em; color: var(--muted); }

  .strip { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
  .notes { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 22px; }
  .note { border-top: 2px solid var(--accent); padding-top: 12px; }
  .note h3 { font-size: 15px; font-weight: 400; letter-spacing: 0.06em; margin: 0 0 6px; }
  .note p { font-size: 14.5px; margin: 0; }
  footer { border-top: 1px solid var(--rule); padding-top: 16px; font-size: 13.5px; font-style: italic; color: var(--muted); }
</style>

<div class="page">
  <header>
    <p class="eyebrow">Trita · vizuális nyelvtan</p>
    <h1>Típus-ábrák a hat HEXACO-dimenzióból</h1>
    <p class="lede">Nem 36 illusztráció, hanem egy nyelvtan 36 kimenete: a domináns dimenzió adja a bronz alapformát, a második legerősebb a tinta-vonalmotívumot — ugyanabból a párból, amelyből a típus neve is épül.</p>
    <div class="swatches">
      <span><i style="background:${GLYPH_COLORS.canvas}"></i>krém alap</span>
      <span><i style="background:${GLYPH_COLORS.form}"></i>bronz forma</span>
      <span><i style="background:${GLYPH_COLORS.line}"></i>tinta vonal</span>
      <span><i style="background:${GLYPH_COLORS.sun}"></i>nap-akcentus</span>
      <span><i style="background:${GLYPH_COLORS.counterweight}"></i>sage ellensúly</span>
    </div>
  </header>

  <section>
    <h2>A mátrix</h2>
    <p>A sor a domináns dimenziót jelöli (ez a nagy forma), az oszlop a másodikat (ez a vonalmotívum). Az átlón a hat „tiszta" típus áll: ott a motívum duplázva, felerősítve jelenik meg. Állandó kísérőelemek — csillag, nap, egyetlen sage ellensúlypont, vándorló talajvonal — minden ábrán ott vannak, pozíciójuk a párból determinisztikus.</p>
    <div class="matrix-scroll">
      <div class="matrix">
        <div class="corner">sor: forma<br>oszlop: motívum</div>
        ${headerRow}
        ${matrixRows}
      </div>
    </div>
  </section>

  <section>
    <h2>Intenzitás</h2>
    <p>A domináns dimenzió erőssége a kitöltésben és a vonalvastagságban jelenik meg, nem külön színben: 1 — csak kontúr, 2 — halvány kitöltés, 3 — teli forma, 4 — vastagabb motívum, 5 — vastag motívum és szikra-akcentus.</p>
    <div class="strip">${intensityStrip}</div>
  </section>

  <section>
    <h2>Használat</h2>
    <div class="notes">
      <div class="note">
        <h3>Egy forrás</h3>
        <p>A nyelvtan a <span style="font-family:var(--mono)">src/lib/type-glyph.ts</span>-ben él, a rajzolás a <span style="font-family:var(--mono)">TypeGlyph</span> komponensben. Új felületen ne rajzolj saját ábrát — a párt add át.</p>
      </div>
      <div class="note">
        <h3>Három méret</h3>
        <p><em>badge</em> — csak forma és motívum, kis helyre; <em>card</em> — kísérőelemekkel, listákba; <em>hero</em> — teljes vászon galéria-felirattal.</p>
      </div>
      <div class="note">
        <h3>Nem dekoráció</h3>
        <p>Minden ábrának van szöveges leírása (forma + motívum + dimenzióbetűk), így képernyőolvasóval is ugyanazt mondja, mint szemmel.</p>
      </div>
      <div class="note">
        <h3>Csapat-változat</h3>
        <p>Az egyéni típus egyetlen zárt forma. A csapat-mintázat konstelláció lesz: több kisebb forma, vékony vonallal összekötve — ez a réteg még nincs megépítve.</p>
      </div>
    </div>
  </section>

  <footer>A típusnevek a jelenlegi archetípus-nyelvtanból jönnek (személyiség-típus: főnév + melléknévi színezet). Az ábra a dimenzió-párból következik, nem a névből — átnevezés nem érinti a rajzot.</footer>
</div>`;

writeFileSync(join(outDir, "artifact-body.html"), artifactBody, "utf-8");

// Ugyanez önálló fájlként — böngészőben közvetlenül megnyitható.
writeFileSync(
  join(outDir, "matrix.html"),
  `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trita típus-ábrák — vizuális nyelvtan</title>
</head><body>${artifactBody}</body></html>`,
  "utf-8",
);

console.log(`Típus-ábra előnézet: ${file}`);
console.log(`Kontakt-ív: ${join(outDir, "sheet.html")}`);
console.log(`Mátrix (artifact-body): ${join(outDir, "artifact-body.html")}`);
