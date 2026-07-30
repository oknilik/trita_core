/**
 * Avatár nélküli hero + zárható típus-tábla — makett (fejlesztői eszköz).
 * Futtatás: npx tsx scripts/preview-glyph-collapsible.ts [kimeneti-mappa]
 *
 * Változat: a monogram-avatár („D” kör) eltűnik a név mellől minden usernél;
 * a kis típus-ábra marad lent a típusnév mellett; a nagy kompozíció (D-út)
 * a hero alatt, ZÁRHATÓ blokkban jelenik meg.
 *
 * A makettben a nyit/zár valódi <details> — a fájl böngészőben kattintható.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TypeGlyph } from "../src/components/type/TypeGlyph";
import { GLYPH_COLORS } from "../src/lib/type-glyph";
import { TRITAN_DIMENSIONS } from "../src/lib/tritan";

const outDir = process.argv[2] ?? join(process.cwd(), ".glyph-previews");
mkdirSync(outDir, { recursive: true });

const DEMO = { primary: "OPEN", secondary: "TEMP", label: "Energikus újító" };

const glyph = (variant: "hero" | "card" | "badge") =>
  renderToStaticMarkup(
    createElement(TypeGlyph, {
      primaryCode: DEMO.primary,
      secondaryCode: DEMO.secondary,
      typeLabel: DEMO.label,
      dimensionLabel: "Nyitottság × Extraverzió",
      variant,
      intensity: 4,
    }),
  );

const HERO_GRADIENT = "linear-gradient(135deg,#2a5244 0%,#1e3d34 60%,#1a2e28 100%)";
const TYPE_GOLD = "#e8a96a";

const DIM_SCORES: Record<string, number> = {
  INTE: 62,
  RESO: 44,
  TEMP: 78,
  ADAP: 57,
  THOR: 51,
  OPEN: 86,
};
const ORDER = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"];

const dimensionStrip = (codes: string[]) =>
  `<div class="dimstrip">${codes
    .map((code) => {
      const dim = TRITAN_DIMENSIONS[code as keyof typeof TRITAN_DIMENSIONS];
      return `<div class="dimcell">
        <span class="dimletter">${dim.letter}</span>
        <span class="dimname">${dim.hu}</span>
        <span class="dimscore">${DIM_SCORES[code]}</span>
        <span class="dimbar"><i style="width:${DIM_SCORES[code]}%"></i></span>
      </div>`;
    })
    .join("")}</div>`;

// ── Hero avatár NÉLKÜL ────────────────────────────────────────────────
const hero = (withActions = true) => `
  <div class="hero">
    <div class="hero-top">
      <div>
        <p class="eyebrow-light">A te profilod</p>
        <h2 class="hero-name">Kilin Dániel</h2>
        <p class="hero-meta">Felmérés · 2026. július 28.</p>
      </div>
      ${withActions ? `<div class="hero-actions"><span class="btn ghost">Megosztás</span><span class="btn">PDF letöltése</span></div>` : ""}
    </div>
    <div class="type-row">
      <div class="g-56">${glyph("badge")}</div>
      <span class="type-label">Energikus újító</span>
    </div>
    <p class="hero-summary">Nyitott, gyorsan kapcsoló gondolkodás — a felvetéstől a kipróbálásig rövid nálad az út.</p>
    <div class="chips"><span class="chip-dark">Nyitottság</span><span class="chip-dark">Extraverzió</span></div>
  </div>`;

// ── Zárható típus-tábla ───────────────────────────────────────────────
const plate = (open: boolean, artWidth: string) => `
  <details class="plate"${open ? " open" : ""}>
    <summary>
      <span class="sum-left">
        <span class="sum-thumb">${glyph("badge")}</span>
        <span class="sum-text">
          <span class="sum-eyebrow">A te ábrád</span>
          <span class="sum-title">Energikus újító <span class="sum-pair">· Nyitottság × Extraverzió</span></span>
        </span>
      </span>
      <span class="sum-toggle"><span class="closed-label">Megnyitás</span><span class="open-label">Bezárás</span><span class="chev">▾</span></span>
    </summary>
    <div class="plate-inner">
      <div class="plate-art" style="max-width:${artWidth}">${glyph("card")}</div>
      <div class="plate-copy">
        <p class="plate-body">A nagy forma a legerősebb dimenziód: a <em>szem</em> a nyitottságot jelöli. A benne futó vékony vonal a második legerősebb dimenzió jele: a <em>villám</em> az extraverzió. A kitöltés erőssége a pontszámot követi.</p>
        <p class="plate-note">Ez az ábra a profilod vizuális névjegye — ugyanez jelenik meg a megosztott linken és a letöltött PDF-en.</p>
        <span class="plate-link">Ábra letöltése (PNG)</span>
      </div>
    </div>
  </details>`;

const tabs = `
  <div class="tabs"><span class="tab active">Eredmények</span><span class="tab">Összevetés</span><span class="tab">Meghívók</span></div>`;

const screenClosed = `
  <div class="screen">
    ${hero()}
    ${tabs}
    ${plate(false, "320px")}
    <section class="panel"><p class="eyebrow">Dimenzióid</p>${dimensionStrip(ORDER)}</section>
  </div>`;

const screenOpen = `
  <div class="screen">
    ${hero()}
    ${tabs}
    ${plate(true, "320px")}
    <section class="panel"><p class="eyebrow">Dimenzióid</p>${dimensionStrip(ORDER)}</section>
  </div>`;

const screenMobileClosed = `
  <div class="screen mobile">
    ${hero(false)}
    ${plate(false, "100%")}
  </div>`;

const screenMobileOpen = `
  <div class="screen mobile">
    ${hero(false)}
    ${plate(true, "100%")}
  </div>`;

const body = `<style>
  :root {
    --ground:${GLYPH_COLORS.canvas}; --panel:#ffffff; --ink:${GLYPH_COLORS.line};
    --body:#4a4a5e; --muted:#7a756e; --accent:${GLYPH_COLORS.form};
    --accent-deep:${GLYPH_COLORS.captionAccent}; --rule:#e8e0d3; --sage:${GLYPH_COLORS.counterweight};
    --serif: Georgia,'Iowan Old Style','Times New Roman',serif;
    --mono: ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root { --ground:#14141d; --panel:#1d1d28; --ink:#f2efe8; --body:#c9c5bd; --muted:#938d84;
            --accent:#d79a68; --accent-deep:#e0b087; --rule:#2f2f3d; --sage:#7fae9e; }
  }
  :root[data-theme="dark"] { --ground:#14141d; --panel:#1d1d28; --ink:#f2efe8; --body:#c9c5bd; --muted:#938d84;
            --accent:#d79a68; --accent-deep:#e0b087; --rule:#2f2f3d; --sage:#7fae9e; }
  :root[data-theme="light"] { --ground:${GLYPH_COLORS.canvas}; --panel:#ffffff; --ink:${GLYPH_COLORS.line};
            --body:#4a4a5e; --muted:#7a756e; --accent:${GLYPH_COLORS.form};
            --accent-deep:${GLYPH_COLORS.captionAccent}; --rule:#e8e0d3; --sage:${GLYPH_COLORS.counterweight}; }

  body { margin:0; background:var(--ground); color:var(--ink); font-family:var(--serif); }
  .page { max-width:1140px; margin:0 auto; padding:52px 26px 90px; display:flex; flex-direction:column; gap:44px; }
  .eyebrow { font-family:var(--mono); font-size:10.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--accent-deep); margin:0 0 8px; }
  h1 { font-size:clamp(27px,4.4vw,39px); font-weight:400; line-height:1.08; margin:0 0 12px; text-wrap:balance; }
  .lede { font-size:17px; font-style:italic; color:var(--accent-deep); max-width:64ch; margin:0; }
  .intro p { color:var(--body); font-size:16px; line-height:1.6; max-width:66ch; margin:0 0 10px; }

  .block { border-top:2px solid var(--accent); padding-top:22px; display:flex; flex-direction:column; gap:16px; }
  .block-head { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  .bid { font-family:var(--mono); font-size:12.5px; letter-spacing:.16em; color:var(--accent); }
  .block h2.bt { font-size:22px; font-weight:400; margin:0; }
  .block .desc { color:var(--body); font-size:15px; line-height:1.6; max-width:70ch; margin:0; }
  .frames { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:18px; align-items:start; }
  @media (max-width:900px) { .frames { grid-template-columns:1fr; } }
  .frame { background:var(--panel); border:1px solid var(--rule); border-radius:14px; padding:18px; }
  .frame-label { font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:0 0 14px; }

  .screen { display:flex; flex-direction:column; gap:13px; }
  .screen.mobile { max-width:300px; }

  .hero { background:${HERO_GRADIENT}; border-radius:16px; padding:22px 24px 24px; color:#fff; }
  .hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
  .eyebrow-light { font-family:var(--mono); font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.55); margin:0 0 3px; }
  .hero-name { font-size:29px; font-weight:400; margin:0; letter-spacing:-.01em; }
  .hero-meta { font-size:11px; color:rgba(255,255,255,.5); margin:3px 0 0; }
  .hero-actions { display:flex; gap:8px; }
  .btn { font-size:12px; background:#c17f4a; border-radius:8px; padding:8px 12px; }
  .btn.ghost { background:rgba(255,255,255,.1); }
  .type-row { display:flex; align-items:center; gap:12px; margin-top:18px; }
  .type-label { font-size:20px; font-style:italic; color:${TYPE_GOLD}; }
  .hero-summary { font-size:13.5px; line-height:1.55; color:rgba(255,255,255,.75); max-width:44ch; margin:12px 0 0; }
  .chips { display:flex; gap:7px; margin-top:12px; }
  .chip-dark { font-size:10.5px; background:rgba(61,107,94,.4); color:#cfe3dc; border-radius:5px; padding:3px 8px; }

  .tabs { display:flex; gap:18px; border-bottom:1px solid var(--rule); padding:0 4px; }
  .tab { font-size:13.5px; color:var(--muted); padding:8px 0; }
  .tab.active { color:var(--ink); border-bottom:2px solid var(--accent); }

  .plate { background:var(--panel); border:1px solid var(--rule); border-radius:14px; overflow:hidden; }
  .plate summary { list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between;
                   gap:12px; padding:12px 16px; }
  .plate summary::-webkit-details-marker { display:none; }
  .sum-left { display:flex; align-items:center; gap:12px; min-width:0; }
  .sum-thumb { width:34px; border-radius:8px; overflow:hidden; border:1px solid var(--rule); flex:0 0 auto; }
  .sum-thumb svg, .plate-art svg, .g-56 svg { width:100%; height:auto; display:block; }
  .sum-text { display:flex; flex-direction:column; min-width:0; }
  .sum-eyebrow { font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--accent-deep); }
  .sum-title { font-size:15.5px; }
  .sum-pair { font-size:12.5px; font-style:italic; color:var(--muted); }
  .sum-toggle { display:flex; align-items:center; gap:7px; flex:0 0 auto; font-family:var(--mono);
                font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .chev { transition:transform .18s ease; }
  .plate .open-label { display:none; }
  .plate[open] .closed-label { display:none; }
  .plate[open] .open-label { display:inline; }
  .plate[open] .chev { transform:rotate(180deg); }
  @media (prefers-reduced-motion:reduce) { .chev { transition:none; } }

  .plate-inner { display:grid; grid-template-columns:minmax(0,320px) minmax(0,1fr); gap:22px;
                 padding:4px 16px 18px; border-top:1px solid var(--rule); margin-top:2px; padding-top:16px; align-items:center; }
  .screen.mobile .plate-inner { grid-template-columns:1fr; gap:14px; }
  .plate-art { border:1px solid var(--rule); border-radius:12px; overflow:hidden; }
  .plate-copy { display:flex; flex-direction:column; gap:8px; }
  .plate-body, .plate-note { font-size:14px; line-height:1.6; color:var(--body); margin:0; }
  .plate-note { font-style:italic; color:var(--muted); }
  .plate-link { font-family:var(--mono); font-size:10.5px; letter-spacing:.12em; text-transform:uppercase;
                color:var(--accent); border-bottom:1px solid var(--accent); align-self:flex-start; padding-bottom:2px; }

  .g-56 { width:56px; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,.16); }

  .panel { background:var(--panel); border:1px solid var(--rule); border-radius:14px; padding:16px; }
  .dimstrip { display:grid; grid-template-columns:repeat(auto-fit,minmax(112px,1fr)); gap:12px; }
  .dimcell { display:flex; flex-direction:column; gap:2px; }
  .dimletter { font-family:var(--mono); font-size:11.5px; letter-spacing:.1em; color:var(--accent); }
  .dimname { font-size:11px; color:var(--muted); }
  .dimscore { font-size:16px; font-variant-numeric:tabular-nums; }
  .dimbar { display:block; height:4px; background:var(--rule); border-radius:2px; overflow:hidden; }
  .dimbar i { display:block; height:100%; background:var(--sage); }

  .notes { display:grid; grid-template-columns:repeat(auto-fit,minmax(240px,1fr)); gap:18px; }
  .notes .item { border-top:1px solid var(--rule); padding-top:12px; }
  .notes h3 { font-size:14.5px; font-weight:400; margin:0 0 5px; }
  .notes p { font-size:13.5px; line-height:1.55; color:var(--body); margin:0; }
  .notes code { font-family:var(--mono); font-size:12px; background:var(--ground); padding:1px 4px; border-radius:3px; }
  footer { border-top:1px solid var(--rule); padding-top:16px; font-size:13.5px; font-style:italic; color:var(--muted); }
</style>

<div class="page">
  <header>
    <p class="eyebrow">Trita · elhelyezési terv · avatár nélkül + zárható tábla</p>
    <h1>A monogram helyét a típus-ábra veszi át</h1>
    <p class="lede">A név mellől eltűnik a monogram-kör (minden usernél), a kis ábra lent marad a típusnév mellett, a teljes kompozíció pedig a hero alatt, zárható blokkban él. A makettben a nyit/zár valódi — kattints rá.</p>
  </header>

  <div class="intro">
    <p>Így a heróban egyetlen kép van, nem kettő: a monogram nem verseng az ábrával. A fejléc tipográfiája is nyer vele — a név nagyobb súlyt kap, mert nincs mellette dísz. A nagy ábra nem tolja lefelé a tartalmat: zárva egy sor, nyitva teljes tábla.</p>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">1</span><h2 class="bt">Zárt állapot — ez az alapállapot</h2></div>
    <p class="desc">A tábla egyetlen sor: 34 px-es indexkép, a típus neve, a dimenzió-pár, jobbra a nyitás. Az oldal ritmusa nem változik, a nagy ábra nem kötelező látvány.</p>
    <div class="frames">
      <div class="frame"><p class="frame-label">asztali · 760 px</p>${screenClosed}</div>
      <div class="frame"><p class="frame-label">mobil · 300 px</p>${screenMobileClosed}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">2</span><h2 class="bt">Nyitott állapot</h2></div>
    <p class="desc">Nyitva a 320 px-es kompozíció és a nyelvtan magyarázata. A név itt nem ismétlődik: a fejléc-sorban már ott van, a képbe égetett galéria-felirat ezért a <code>card</code> változatnál kimarad — az a feliratos hero-változat a PNG-exportnak és a PDF-nek marad.</p>
    <div class="frames">
      <div class="frame"><p class="frame-label">asztali · 760 px</p>${screenOpen}</div>
      <div class="frame"><p class="frame-label">mobil · 300 px</p>${screenMobileOpen}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">?</span><h2 class="bt">Amit a monogram elvesztése érint</h2></div>
    <div class="notes">
      <div class="item">
        <h3>Hol tűnik el</h3>
        <p>Az eredmény-oldal herója. A <code>getAvatarMonogram</code> és <code>getAvatarGradient</code> máshol is használatban van (nav, tag-listák, összevetés) — ott marad, csak itt szűnik meg.</p>
      </div>
      <div class="item">
        <h3>Emlékezet-kérdés</h3>
        <p>A monogram-gradiens ma userenként állandó — ez adta a „ez az én fejlécem” érzést. Ezt a szerepet innentől az ábra viszi, ami erősebb: nem a névből, hanem a profilból származik.</p>
      </div>
      <div class="item">
        <h3>Zárt legyen vagy nyitott?</h3>
        <p>A makett zárt alapállapotot mutat. Alternatíva: első látogatáskor nyitva, utána a user döntése megjegyezve (localStorage) — ez már viselkedés, nem csak látvány.</p>
      </div>
      <div class="item">
        <h3>PNG-export</h3>
        <p>A nyitott táblában szerepel egy „Ábra letöltése (PNG)” link. Ez extra munka (SVG → canvas → letöltés), és el is hagyható — jelezd, ha kell.</p>
      </div>
    </div>
  </div>

  <footer>Makett, nem megvalósítás: app-kód nem változott. A nyit/zár itt <code>&lt;details&gt;</code>, a tritában sima state-vezérelt blokk lenne, reduced-motion-tudatos animációval.</footer>
</div>`;

writeFileSync(join(outDir, "placement-collapsible.html"), body, "utf-8");
writeFileSync(
  join(outDir, "placement-collapsible-standalone.html"),
  `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Típus-ábra — avatár nélkül, zárható tábla</title>
</head><body>${body}</body></html>`,
  "utf-8",
);

console.log(`Makett (body-only): ${join(outDir, "placement-collapsible.html")}`);
console.log(`Makett (önálló): ${join(outDir, "placement-collapsible-standalone.html")}`);
