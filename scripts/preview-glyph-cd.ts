/**
 * C + D verzió — részletes makett (fejlesztői eszköz, nem megvalósítás).
 * Futtatás: npx tsx scripts/preview-glyph-cd.ts [kimeneti-mappa]
 *
 * C: önálló típus-tábla az eredmény-oldalon, a hero alatt (asztali + mobil).
 * D: a megosztott nézet fedőkártyája (asztali + mobil).
 * A makettek a valódi felület-színekkel és a valódi TypeGlyph kimenettel
 * készülnek, környezetükkel együtt (hero, fülek, dimenzió-sáv), hogy a
 * méretarány döntése ne elszigetelt kártyán szülessen.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TypeGlyph } from "../src/components/type/TypeGlyph";
import { GLYPH_COLORS } from "../src/lib/type-glyph";
import { HEXACO_DIMENSIONS } from "../src/lib/hexaco";

const outDir = process.argv[2] ?? join(process.cwd(), ".glyph-previews");
mkdirSync(outDir, { recursive: true });

const DEMO = { primary: "O", secondary: "X", label: "Energikus újító" };

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

// Dimenzió-sáv: a valódi HEXACO-betűk és -nevek, hogy a makett ne hazudjon
const DIM_SCORES: Record<string, number> = {
  H: 62,
  E: 44,
  X: 78,
  A: 57,
  C: 51,
  O: 86,
};

const dimensionStrip = (order: string[]) =>
  `<div class="dimstrip">${order
    .map((code) => {
      const dim = HEXACO_DIMENSIONS[code as keyof typeof HEXACO_DIMENSIONS];
      const score = DIM_SCORES[code];
      return `<div class="dimcell">
        <span class="dimletter">${dim.letter}</span>
        <span class="dimname">${dim.hu}</span>
        <span class="dimscore">${score}</span>
        <span class="dimbar"><i style="width:${score}%"></i></span>
      </div>`;
    })
    .join("")}</div>`;

const ORDER = ["H", "E", "X", "A", "C", "O"];

// ── C: eredmény-oldal, hero + típus-tábla + következő blokk ───────────
const heroBlock = (compact = false) => `
  <div class="hero">
    <div class="hero-top">
      <div class="hero-id">
        <div class="avatar">D</div>
        <div>
          <p class="eyebrow-light">A te profilod</p>
          <h2 class="hero-name">Kilin Dániel</h2>
          <p class="hero-meta">Felmérés · 2026. július 28.</p>
        </div>
      </div>
      ${compact ? "" : `<div class="hero-actions"><span class="btn ghost">Megosztás</span><span class="btn">PDF letöltése</span></div>`}
    </div>
    <div class="type-row">
      <div class="g-56">${glyph("badge")}</div>
      <span class="type-label">Energikus újító</span>
    </div>
    <p class="hero-summary">Nyitott, gyorsan kapcsoló gondolkodás — a felvetéstől a kipróbálásig rövid nálad az út.</p>
    <div class="chips">
      <span class="chip-dark">Nyitottság</span>
      <span class="chip-dark">Extraverzió</span>
    </div>
  </div>`;

const plateBlock = `
  <section class="plate">
    <div class="plate-art">${glyph("hero")}</div>
    <div class="plate-copy">
      <p class="eyebrow">A te ábrád</p>
      <h3 class="plate-title">Energikus újító</h3>
      <p class="plate-pair">Nyitottság × Extraverzió</p>
      <p class="plate-body">A nagy forma a legerősebb dimenziód: a <em>szem</em> a nyitottságot jelöli. A benne futó vékony vonal a második legerősebb dimenzió jele: a <em>villám</em> az extraverzió. A forma kitöltése a pontszám erősségét követi.</p>
      <p class="plate-note">Ez az ábra a profilod vizuális névjegye — ugyanez jelenik meg a megosztott linken is.</p>
    </div>
  </section>`;

const tabsBar = `
  <div class="tabs">
    <span class="tab active">Eredmények</span>
    <span class="tab">Összevetés</span>
    <span class="tab">Meghívók</span>
  </div>`;

const mockC = `
  <div class="screen">
    ${heroBlock()}
    ${tabsBar}
    ${plateBlock}
    <section class="panel">
      <p class="eyebrow">Dimenzióid</p>
      ${dimensionStrip(ORDER)}
    </section>
  </div>`;

const mockCMobile = `
  <div class="screen mobile">
    ${heroBlock(true)}
    ${plateBlock}
    <section class="panel">
      <p class="eyebrow">Dimenzióid</p>
      ${dimensionStrip(ORDER.slice(0, 3))}
    </section>
  </div>`;

// ── D: megosztott nézet ───────────────────────────────────────────────
const mockD = `
  <div class="screen">
    <div class="share-cover">
      <div class="g-300">${glyph("card")}</div>
      <div class="share-meta">
        <p class="eyebrow">Megosztott profil</p>
        <h2 class="share-name">Kilin Dániel</h2>
        <span class="type-label dark-gold">Energikus újító</span>
        <p class="share-pair">Nyitottság × Extraverzió · TSFI-S felmérés, 2026. július</p>
      </div>
    </div>
    <section class="panel">
      <p class="eyebrow">Dimenziók</p>
      ${dimensionStrip(ORDER)}
    </section>
  </div>`;

const mockDMobile = `
  <div class="screen mobile">
    <div class="share-cover stacked">
      <div class="g-220">${glyph("card")}</div>
      <div class="share-meta center">
        <p class="eyebrow">Megosztott profil</p>
        <h2 class="share-name">Kilin Dániel</h2>
        <span class="type-label dark-gold">Energikus újító</span>
      </div>
    </div>
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
  .page { max-width:1120px; margin:0 auto; padding:52px 26px 90px; display:flex; flex-direction:column; gap:46px; }
  .eyebrow { font-family:var(--mono); font-size:10.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--accent-deep); margin:0 0 8px; }
  h1 { font-size:clamp(28px,4.5vw,40px); font-weight:400; line-height:1.08; margin:0 0 12px; text-wrap:balance; }
  .lede { font-size:17px; font-style:italic; color:var(--accent-deep); max-width:64ch; margin:0; }
  .intro p { color:var(--body); font-size:16px; line-height:1.6; max-width:66ch; margin:0 0 10px; }

  .block { border-top:2px solid var(--accent); padding-top:24px; display:flex; flex-direction:column; gap:18px; }
  .block-head { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  .bid { font-family:var(--mono); font-size:13px; letter-spacing:.16em; color:var(--accent); }
  .block h2.bt { font-size:23px; font-weight:400; margin:0; }
  .block .desc { color:var(--body); font-size:15px; line-height:1.6; max-width:70ch; margin:0; }
  .specs { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:12px 22px; margin:0; }
  .specs dt { font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .specs dd { margin:3px 0 0; font-size:14px; line-height:1.5; color:var(--body); }

  .frame { background:var(--panel); border:1px solid var(--rule); border-radius:14px; padding:20px; }
  .frame-label { font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:0 0 14px; }
  .frames { display:grid; grid-template-columns:minmax(0,1fr) 320px; gap:18px; align-items:start; }
  @media (max-width:900px) { .frames { grid-template-columns:1fr; } }

  .screen { display:flex; flex-direction:column; gap:14px; }
  .screen.mobile { max-width:300px; }

  .hero { background:${HERO_GRADIENT}; border-radius:16px; padding:22px 24px 24px; color:#fff; }
  .hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
  .hero-id { display:flex; align-items:center; gap:12px; }
  .avatar { width:40px; height:40px; border-radius:50%; background:linear-gradient(135deg,#c17f4a,#9a6538);
            display:flex; align-items:center; justify-content:center; font-size:17px; font-weight:700; }
  .eyebrow-light { font-family:var(--mono); font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.55); margin:0 0 2px; }
  .hero-name { font-size:26px; font-weight:400; margin:0; }
  .hero-meta { font-size:11px; color:rgba(255,255,255,.5); margin:2px 0 0; }
  .hero-actions { display:flex; gap:8px; }
  .btn { font-size:12px; background:#c17f4a; border-radius:8px; padding:8px 12px; }
  .btn.ghost { background:rgba(255,255,255,.1); }
  .type-row { display:flex; align-items:center; gap:12px; margin-top:16px; }
  .type-label { font-size:20px; font-style:italic; color:${TYPE_GOLD}; }
  .type-label.dark-gold { color:var(--accent-deep); font-size:19px; }
  .hero-summary { font-size:13.5px; line-height:1.55; color:rgba(255,255,255,.75); max-width:44ch; margin:12px 0 0; }
  .chips { display:flex; gap:7px; margin-top:12px; }
  .chip-dark { font-size:10.5px; background:rgba(61,107,94,.4); color:#cfe3dc; border-radius:5px; padding:3px 8px; }

  .tabs { display:flex; gap:18px; border-bottom:1px solid var(--rule); padding:0 4px; }
  .tab { font-size:13.5px; color:var(--muted); padding:8px 0; }
  .tab.active { color:var(--ink); border-bottom:2px solid var(--accent); }

  .plate { display:grid; grid-template-columns:minmax(0,360px) minmax(0,1fr); gap:26px; align-items:center;
           background:var(--panel); border:1px solid var(--rule); border-radius:16px; padding:22px; }
  .screen.mobile .plate { grid-template-columns:1fr; gap:16px; padding:16px; }
  .plate-art { border:1px solid var(--rule); border-radius:12px; overflow:hidden; }
  .plate-art svg, .g-56 svg, .g-300 svg, .g-220 svg { width:100%; height:auto; display:block; }
  .plate-copy { display:flex; flex-direction:column; gap:3px; }
  .plate-title { font-size:26px; font-weight:400; margin:0; }
  .plate-pair { font-family:var(--mono); font-size:11.5px; letter-spacing:.12em; color:var(--muted); margin:0 0 8px; }
  .plate-body, .plate-note { font-size:14px; line-height:1.6; color:var(--body); margin:0; }
  .plate-note { font-style:italic; color:var(--muted); margin-top:8px; }

  .g-56 { width:56px; border-radius:10px; overflow:hidden; border:1px solid rgba(255,255,255,.16); }
  .g-300 { width:300px; border-radius:14px; overflow:hidden; border:1px solid var(--rule); }
  .g-220 { width:100%; border-radius:14px; overflow:hidden; border:1px solid var(--rule); }

  .share-cover { display:flex; gap:24px; align-items:center; background:var(--panel);
                 border:1px solid var(--rule); border-radius:18px; padding:26px; }
  .share-cover.stacked { flex-direction:column; text-align:center; padding:18px; }
  .share-meta { display:flex; flex-direction:column; gap:4px; }
  .share-meta.center { align-items:center; }
  .share-name { font-size:27px; font-weight:400; margin:2px 0 0; }
  .share-pair { font-family:var(--mono); font-size:11px; letter-spacing:.1em; color:var(--muted); margin:8px 0 0; }

  .panel { background:var(--panel); border:1px solid var(--rule); border-radius:14px; padding:18px; }
  .dimstrip { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:14px; }
  .dimcell { display:flex; flex-direction:column; gap:2px; }
  .dimletter { font-family:var(--mono); font-size:12px; letter-spacing:.1em; color:var(--accent); }
  .dimname { font-size:11.5px; color:var(--muted); }
  .dimscore { font-size:17px; font-variant-numeric:tabular-nums; }
  .dimbar { display:block; height:4px; background:var(--rule); border-radius:2px; overflow:hidden; }
  .dimbar i { display:block; height:100%; background:var(--sage); }

  .todo { display:grid; grid-template-columns:repeat(auto-fit,minmax(250px,1fr)); gap:20px; }
  .todo .item { border-top:1px solid var(--rule); padding-top:12px; }
  .todo h3 { font-size:14.5px; font-weight:400; margin:0 0 5px; }
  .todo p { font-size:13.5px; line-height:1.55; color:var(--body); margin:0; }
  .todo code { font-family:var(--mono); font-size:12px; background:var(--ground); padding:1px 4px; border-radius:3px; }
  footer { border-top:1px solid var(--rule); padding-top:16px; font-size:13.5px; font-style:italic; color:var(--muted); }
</style>

<div class="page">
  <header>
    <p class="eyebrow">Trita · elhelyezési terv · C + D</p>
    <h1>Típus-tábla és megosztott névjegy</h1>
    <p class="lede">A két javasolt hely közelebbről, a környezetével együtt: hero, fülek, dimenzió-sáv. Asztali és mobil szélességben — a mobil azért fontos, mert ott a tábla egymás alá tör.</p>
  </header>

  <div class="intro">
    <p>A heróban marad az 56 px-es medál (azonosítás), a teljes kompozíció külön táblán jelenik meg (C), a megosztott nézeten pedig fedőkártyaként (D). Így az ábra egyszer magyaráz, egyszer hat — és nem ismétli önmagát ugyanazon a képernyőn.</p>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">C</span><h2 class="bt">Típus-tábla az eredmény-oldalon</h2></div>
    <p class="desc">A hero alatt, az „Eredmények” fül első blokkjaként. Balra a teljes hero-változat (galéria-felirattal, kísérőelemekkel), jobbra a típus neve, a dimenzió-pár és a nyelvtan két mondatban. Mobilon a kép fölé, a szöveg alá kerül.</p>
    <dl class="specs">
      <div><dt>Ábra-változat</dt><dd><code>variant="hero"</code>, 360 px sáv (mobilon teljes szélesség)</dd></div>
      <div><dt>Új szöveg</dt><dd>4 i18n kulcs: eyebrow, magyarázat, forma- és motívum-név behelyettesítéssel</dd></div>
      <div><dt>Érintett fájl</dt><dd>a results „Eredmények” fül — új <code>TypeGlyphPlate</code> komponens</dd></div>
      <div><dt>Nem érinti</dt><dd>hero (marad az 56 px medál), PDF, dimenzió-blokkok</dd></div>
    </dl>
    <div class="frames">
      <div class="frame"><p class="frame-label">asztali · 760 px tartalom-sáv</p>${mockC}</div>
      <div class="frame"><p class="frame-label">mobil · 300 px</p>${mockCMobile}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">D</span><h2 class="bt">Megosztott nézet fedőkártyája</h2></div>
    <p class="desc">A <code>/share/[token]</code> fejléce: a mai sötét gradiens-fejléc helyett krém fedőkártya, benne 300 px-es ábra, mellette a név, a típus és a dimenzió-pár. A dimenzió-sáv változatlan marad alatta.</p>
    <dl class="specs">
      <div><dt>Ábra-változat</dt><dd><code>variant="card"</code>, 300 px (mobilon 100%, egymás alatt)</dd></div>
      <div><dt>Döntés kell</dt><dd>a sötét gradiens-fejléc marad-e (ábra a jobb oldalán), vagy krém kártyára váltunk — a makett a krémet mutatja</dd></div>
      <div><dt>Érintett fájl</dt><dd><code>share/[token]/page.tsx</code> fejléc-blokk</dd></div>
      <div><dt>Nem érinti</dt><dd>a megosztás-flow, a token-logika, a munkastílus-szekciók</dd></div>
    </dl>
    <div class="frames">
      <div class="frame"><p class="frame-label">asztali · 760 px</p>${mockD}</div>
      <div class="frame"><p class="frame-label">mobil · 300 px</p>${mockDMobile}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">→</span><h2 class="bt">Ha ez a jó, ennyi a megvalósítás</h2></div>
    <div class="todo">
      <div class="item">
        <h3>1 · Új komponens</h3>
        <p><code>TypeGlyphPlate</code> — ábra + név + pár + magyarázat, a <code>type-glyph.ts</code> forma- és motívum-neveiből (nincs új szöveg-forrás).</p>
      </div>
      <div class="item">
        <h3>2 · Beépítés két helyre</h3>
        <p>results „Eredmények” fül első blokkja; <code>share/[token]</code> fejléc. Mindkettő ugyanazt a komponenst kapja, más mérettel.</p>
      </div>
      <div class="item">
        <h3>3 · i18n</h3>
        <p>HU + EN kulcsok a táblához (eyebrow, magyarázó mondatok). A forma- és motívum-nevek már kétnyelvűek a libben.</p>
      </div>
      <div class="item">
        <h3>4 · Teszt</h3>
        <p>Kliens-teszt: a tábla a helyes párt rendereli, és van szöveges leírása (a11y). Meglévő unit-tesztek változatlanok.</p>
      </div>
    </div>
  </div>

  <footer>Nyitott kérdés a D-nél: a megosztott fejléc krém kártyára váltása erősebb névjegy, de elveszik a mai sötét sage-fejléc márkás hatása. Ha megtartanád a sötétet, az ábra a fejléc jobb oldalára kerül — az a B-változat logikája, csak a megosztott oldalon.</footer>
</div>`;

writeFileSync(join(outDir, "placement-cd.html"), body, "utf-8");
writeFileSync(
  join(outDir, "placement-cd-standalone.html"),
  `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Típus-ábra — C + D makett</title>
</head><body>${body}</body></html>`,
  "utf-8",
);

console.log(`C+D makett (body-only): ${join(outDir, "placement-cd.html")}`);
console.log(`C+D makett (önálló): ${join(outDir, "placement-cd-standalone.html")}`);
