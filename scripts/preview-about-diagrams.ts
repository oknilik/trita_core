/**
 * Az /about oldal saját ábráinak előnézete (fejlesztői eszköz).
 * Futtatás: npx tsx scripts/preview-about-diagrams.ts [kimeneti-mappa]
 *
 * Miért kell: az `EditorialArt` kompozíciója sorsolt, de skálázódó — ott a
 * generátor a MÉRET-viselkedést ellenőrzi. Ezek az ábrák viszont kézzel
 * elhelyezett geometriák: a hiba nem az, hogy kicsiben masszává olvadnak,
 * hanem hogy két elem EGYMÁSBA lóg, vagy kilóg a viewBoxból. Az ilyet csak
 * kirenderelve lehet meglátni.
 *
 * Két szélességen renderel (asztali oszlop és mobil), mindkét színsémán —
 * a sötét séma azért kötelező, mert a tintavonal ott világosra fordul, a
 * bronz felület viszont nem: ami világoson kontrasztos, ott elveszhet.
 *
 * Mintája: scripts/preview-editorial-art.ts.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { LayerDiagram, PathDiagram, PurposeDiagram } from "../src/components/about/AboutDiagrams";

const outDir = process.argv[2] ?? join(process.cwd(), ".art-previews");
mkdirSync(outDir, { recursive: true });

// A token-értékek a globals.css két palettájából — másolat, mert a
// `@theme` blokkot a böngésző önmagában nem oldja fel, ez pedig nyers HTML.
// Ugyanaz a készlet, amit a preview-editorial-art.ts használ.
const SCHEMES = [
  {
    id: "light",
    label: "világos séma",
    tokens: {
      "--color-text-primary": "#1a1a2e",
      "--color-accent-primary": "#c17f4a",
      "--color-accent-primary-soft": "#e8a96a",
      "--color-action-primary-bg": "#3d6b5e",
      "--preview-canvas": "#faf7f2",
      "--preview-card": "#f3eee4",
      "--preview-border": "#e6ddd0",
      "--preview-text": "#1a1a2e",
    },
  },
  {
    id: "dark",
    label: "sötét séma",
    tokens: {
      "--color-text-primary": "#f3efe8",
      "--color-accent-primary": "#c17f4a",
      "--color-accent-primary-soft": "#e8b880",
      "--color-action-primary-bg": "#3d6b5e",
      "--preview-canvas": "#141418",
      "--preview-card": "#23232a",
      "--preview-border": "#34343d",
      "--preview-text": "#f3efe8",
    },
  },
] as const;

const DIAGRAMS = [
  { id: "layer", label: "1 · rétegábra (LayerDiagram)", el: LayerDiagram, maxWidth: 240 },
  { id: "path", label: "2 · útábra (PathDiagram)", el: PathDiagram, maxWidth: 620 },
  { id: "purpose", label: "3 · célábra (PurposeDiagram)", el: PurposeDiagram, maxWidth: 560 },
] as const;

/** A valódi oldalon előforduló befoglaló szélességek. */
const WIDTHS: ReadonlyArray<{ id: string; label: string; cap?: number }> = [
  { id: "desktop", label: "asztali oszlop" },
  { id: "mobile", label: "mobil (320px)", cap: 320 },
];

function render(d: (typeof DIAGRAMS)[number]): string {
  return renderToStaticMarkup(createElement(d.el, { label: d.label }));
}

function schemeBlock(scheme: (typeof SCHEMES)[number]): string {
  const vars = Object.entries(scheme.tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");

  const rows = DIAGRAMS.map((d) => {
    const cells = WIDTHS.map((w) => {
      const width = w.cap ? Math.min(w.cap, d.maxWidth) : d.maxWidth;
      return `<figure class="cell">
          <div class="frame" style="max-width:${width}px">${render(d)}</div>
          <figcaption>${w.label} · ${width}px</figcaption>
        </figure>`;
    }).join("");
    return `<h3>${d.label}</h3><div class="row">${cells}</div>`;
  }).join("");

  return `<section class="scheme" style="${vars}"><h2>${scheme.label}</h2>${rows}</section>`;
}

const html = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><title>Trita — /about ábrák előnézete</title>
<style>
  body { margin:0; font-family: ui-sans-serif, system-ui, sans-serif; }
  .scheme { background: var(--preview-canvas); color: var(--preview-text); padding: 28px 32px 44px; }
  h2 { font-size: 13px; text-transform: uppercase; letter-spacing: .14em; opacity:.6; margin: 0 0 20px; }
  h3 { font-size: 14px; font-weight: 600; margin: 28px 0 10px; }
  .row { display:flex; flex-wrap:wrap; gap:24px; align-items:flex-start; }
  .cell { margin:0; }
  .frame { background: var(--preview-card); border:1px solid var(--preview-border);
           border-radius:20px; padding:20px 22px; }
  figcaption { font:11px ui-monospace, monospace; opacity:.55; margin-top:8px; }
</style></head>
<body>${SCHEMES.map(schemeBlock).join("")}</body></html>`;

const outFile = join(outDir, "about-diagrams.html");
writeFileSync(outFile, html, "utf8");
console.log(`✓ ${outFile}`);
