/**
 * Szerkesztői ábra-előnézet (fejlesztői eszköz).
 * Futtatás: npx tsx scripts/preview-editorial-art.ts [kimeneti-mappa]
 *
 * A formanyelv 2. szintjét rendereli ki statikus HTML-be, MINDKÉT
 * színsémán: a blog színpad-vizuálját (BlogArtVisual) a valódi
 * cikk-slugokkal és minden méret-módban, valamint a landing-átkötő
 * konstellációját (EditorialArt).
 *
 * Miért kell: a kompozíció determinisztikus, de a MÉRET nem lineáris —
 * ami 400×120-on működik, az 72×72-en masszává olvad, és ami világos
 * lapon kontrasztos, az a sötét hero-panelen eltűnhet. Ez az egyetlen
 * hely, ahol a négy méret × két séma egyszerre látszik.
 *
 * Mintája: scripts/preview-type-glyphs.ts (1. szint, típus-ábrák).
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { BlogArtVisual } from "../src/components/blog/BlogArtVisual";
import { EditorialArt, SectionTransition, artKeyFrom } from "../src/components/ui/EditorialArt";
import { getAllPosts } from "../src/lib/blog";

const outDir = process.argv[2] ?? join(process.cwd(), ".art-previews");
mkdirSync(outDir, { recursive: true });

// A token-értékek a globals.css két palettájából. Azért másolat és nem
// import, mert a globals.css a Tailwind `@theme` blokkjában él, amit a
// böngésző önmagában nem old fel — ez az előnézet viszont nyers HTML.
const SCHEMES = [
  {
    id: "light",
    label: "világos séma",
    tokens: {
      "--color-text-primary": "#1a1a2e",
      "--color-accent-primary": "#c17f4a",
      "--color-accent-primary-soft": "#e8a96a",
      "--color-action-primary-bg": "#3d6b5e",
      "--color-text-on-inverse": "#f7f4ef",
      "--color-sage-300": "#8ad0b4",
      "--color-surface-muted": "#f3eee4",
      "--color-surface-self-accent-soft": "#e8f2f0",
      "--color-layer-self-hero-from": "#2a5244",
      "--color-layer-self-hero-to": "#1a2e28",
      "--preview-canvas": "#f7f4ef",
      "--preview-card": "#ffffff",
      "--preview-border": "#e8e0d3",
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
      "--color-text-on-inverse": "#f3efe8",
      "--color-sage-300": "#5aa88c",
      "--color-surface-muted": "#23232a",
      "--color-surface-self-accent-soft": "#17302a",
      "--color-layer-self-hero-from": "#315f4f",
      "--color-layer-self-hero-to": "#233e36",
      "--preview-canvas": "#141418",
      "--preview-card": "#1a1a20",
      "--preview-border": "#34343d",
    },
  },
] as const;

const posts = [...getAllPosts("hu"), ...getAllPosts("en")].slice(0, 8);

function art(post: (typeof posts)[number], variant: "featured" | "card" | "mini") {
  return renderToStaticMarkup(
    createElement(BlogArtVisual, {
      slug: post.slug,
      tags: post.tags,
      seed: post.artSeed,
      motif: post.artMotif,
      variant,
    }),
  );
}

function schemeBlock(scheme: (typeof SCHEMES)[number]): string {
  const vars = Object.entries(scheme.tokens)
    .map(([k, v]) => `${k}:${v}`)
    .join(";");
  const featured = posts[0];

  const cards = posts
    .slice(1, 5)
    .map(
      (p) => `<figure class="card">
        <div class="card-art">${art(p, "card")}</div>
        <figcaption>${p.slug}<small>400×120 · card</small></figcaption>
      </figure>`,
    )
    .join("");

  const minis = posts
    .slice(0, 6)
    .map((p) => `<div class="mini" title="${p.slug}">${art(p, "mini")}</div>`)
    .join("");

  // A hero-panel a legszűkebb eset: MOBILON a hosszú `heroQuote` öt sorra
  // nyúlva a panel alsó kétharmadát elfoglalja, és a `slice` illesztés ott
  // rá is nagyít a kompozícióra. Ezt asztali szélességen nem látni — a
  // takarás-hiba (2026-08-09) is csak telefonon jött elő.
  const longQuote =
    "A SHRM 2026-os adatai szerint a belső rotációs programok 93%-os hatékonyságúak a tehetség-rés kezelésében – mégis a szervezetek kevesebb mint negyede él velük.";

  return `<section class="scheme" style="${vars}">
    <h2>${scheme.label}</h2>

    <h3>kiemelt cikk — mobil (390px), hosszú idézettel</h3>
    <div class="phone">
      <div class="featured mobile">
        <div class="featured-art">
          ${art(featured, "featured")}
          <span class="chip">kiemelt cikk</span>
          <p class="quote">„${longQuote}"</p>
        </div>
        <div class="featured-body"><strong>${featured.title}</strong></div>
      </div>
    </div>

    <h3>kiemelt cikk — hero, sötét panel mindkét sémán</h3>
    <div class="featured">
      <div class="featured-art">
        ${art(featured, "featured")}
        <p class="quote">„Csak az kezelhető, amit mérünk.”</p>
      </div>
      <div class="featured-body"><strong>${featured.title}</strong></div>
    </div>

    <h3>kártyák — card</h3>
    <div class="grid">${cards}</div>

    <h3>szerkesztői sorok — mini (kis méretű szabály: nincs kíséret)</h3>
    <div class="minis">${minis}</div>

    <h3>cikkoldal fejléc — 840×190</h3>
    <div class="banner">${art(posts[2], "card")}</div>

    <h3>landing átkötő — konstelláció (2. szint, self és team mód)</h3>
    ${renderToStaticMarkup(createElement(SectionTransition, { artKey: artKeyFrom("landing", "how-features", "self") }))}
    ${renderToStaticMarkup(createElement(SectionTransition, { artKey: artKeyFrom("landing", "how-features", "team") }))}

    <h3>EditorialArt — nagy felület és kis méret</h3>
    <div class="editorial">
      <div class="ed-big">${renderToStaticMarkup(createElement(EditorialArt, { artKey: "patterns:hero", width: 420, height: 200 }))}</div>
      ${["a", "b", "c", "d"]
        .map(
          (k) =>
            `<div class="mini">${renderToStaticMarkup(createElement(EditorialArt, { artKey: `mini:${k}`, width: 80, height: 80 }))}</div>`,
        )
        .join("")}
    </div>
  </section>`;
}

const html = `<!doctype html>
<html lang="hu"><head><meta charset="utf-8"><title>Trita — szerkesztői ábrák előnézete</title>
<style>
  body { margin:0; font-family: ui-sans-serif, system-ui, sans-serif; }
  .scheme { background: var(--preview-canvas); color: var(--color-text-primary); padding: 32px 28px 48px; }
  h2 { font: 600 12px ui-monospace, monospace; letter-spacing:.16em; text-transform:uppercase; opacity:.65; margin:0 0 20px; }
  h3 { font: 600 11px ui-monospace, monospace; letter-spacing:.12em; text-transform:uppercase; opacity:.5; margin:28px 0 10px; font-weight:400; }
  .featured { display:grid; grid-template-columns:1fr 1.3fr; border:1px solid var(--preview-border); border-radius:16px; overflow:hidden; background:var(--preview-card); }
  .featured-art { position:relative; min-height:230px; display:flex; flex-direction:column; justify-content:flex-end; padding:22px; }
  .featured-art > svg { position:absolute; inset:0; }
  .quote { position:relative; margin:0; font:italic 18px Georgia, serif; color:#fff; line-height:1.35; }
  .featured-body { padding:24px; font:400 19px Georgia, serif; }
  .phone { width:390px; }
  .featured.mobile { grid-template-columns:1fr; }
  .featured.mobile .featured-art { min-height:270px; padding:24px; }
  .featured.mobile .quote { font-size:21px; }
  .chip { position:relative; align-self:flex-start; margin-bottom:12px; background:rgba(255,255,255,.10);
          color:rgba(255,255,255,.70); border-radius:99px; padding:5px 12px;
          font:10px ui-monospace, monospace; letter-spacing:.14em; text-transform:uppercase; }
  .grid { display:grid; grid-template-columns:repeat(2, 1fr); gap:16px; }
  .card { margin:0; border:1px solid var(--preview-border); border-radius:14px; overflow:hidden; background:var(--preview-card); }
  .card-art { height:120px; }
  figcaption { padding:10px 14px; font:12px ui-monospace, monospace; opacity:.7; display:flex; justify-content:space-between; gap:10px; }
  figcaption small { opacity:.6; }
  .minis, .editorial { display:flex; gap:14px; align-items:center; flex-wrap:wrap; }
  .mini { width:72px; height:72px; border-radius:12px; overflow:hidden; border:1px solid var(--preview-border); }
  .banner { max-width:840px; height:190px; overflow:hidden; border-radius:16px; border:1px solid var(--preview-border); }
  .ed-big { width:420px; height:200px; border:1px solid var(--preview-border); border-radius:14px; }
</style></head>
<body>${SCHEMES.map(schemeBlock).join("")}</body></html>`;

const target = join(outDir, "index.html");
writeFileSync(target, html);
console.log(`Szerkesztői ábra-előnézet: ${target}`);
