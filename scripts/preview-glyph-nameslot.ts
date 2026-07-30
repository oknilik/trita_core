/**
 * Ábra a NÉV mellett (a monogram helyén) — makett (fejlesztői eszköz).
 * Futtatás: npx tsx scripts/preview-glyph-nameslot.ts [kimeneti-mappa]
 *
 * Változat: a típus-ábra a felső blokkba, a név mellé kerül (a korábbi
 * monogram-kör helyére), a típusnév mellől pedig eltűnik. Három méret,
 * hogy a döntés látványból szülessen — plusz közvetlen összevetés a
 * „típus mellett” elhelyezéssel.
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
  INTE: 62, RESO: 44, TEMP: 78, ADAP: 57, THOR: 51, OPEN: 86,
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

/**
 * Hero, ahol az ábra a NÉV mellett áll.
 * `size` = a tábla szélessége px-ben; `eyebrowBeside` = az „A te profilod”
 * eyebrow a tábla mellé kerül-e (nagy méretnél ez tartja a ritmust).
 */
const heroNameSlot = (
  size: number,
  opts: { actions?: boolean; eyebrowBeside?: boolean } = {},
) => {
  const { actions = true, eyebrowBeside = true } = opts;
  return `
  <div class="hero">
    <div class="hero-top">
      <div class="hero-id">
        <div class="g" style="width:${size}px">${glyph("badge")}</div>
        <div class="hero-id-text">
          ${eyebrowBeside ? `<p class="eyebrow-light">A te profilod</p>` : ""}
          <h2 class="hero-name">Kilin Dániel</h2>
          <p class="hero-meta">Felmérés · 2026. július 28.</p>
        </div>
      </div>
      ${actions ? `<div class="hero-actions"><span class="btn ghost">Megosztás</span><span class="btn">PDF letöltése</span></div>` : ""}
    </div>
    <p class="type-label solo">Energikus újító</p>
    <p class="hero-summary">Nyitott, gyorsan kapcsoló gondolkodás — a felvetéstől a kipróbálásig rövid nálad az út.</p>
    <div class="chips"><span class="chip-dark">Nyitottság</span><span class="chip-dark">Extraverzió</span></div>
  </div>`;
};

/** Az előző változat: ábra a TÍPUS mellett (összevetéshez). */
const heroTypeSlot = () => `
  <div class="hero">
    <div class="hero-top">
      <div>
        <p class="eyebrow-light">A te profilod</p>
        <h2 class="hero-name">Kilin Dániel</h2>
        <p class="hero-meta">Felmérés · 2026. július 28.</p>
      </div>
      <div class="hero-actions"><span class="btn ghost">Megosztás</span><span class="btn">PDF letöltése</span></div>
    </div>
    <div class="type-row">
      <div class="g" style="width:56px">${glyph("badge")}</div>
      <span class="type-label">Energikus újító</span>
    </div>
    <p class="hero-summary">Nyitott, gyorsan kapcsoló gondolkodás — a felvetéstől a kipróbálásig rövid nálad az út.</p>
    <div class="chips"><span class="chip-dark">Nyitottság</span><span class="chip-dark">Extraverzió</span></div>
  </div>`;

const closedPlate = `
  <details class="plate">
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
      <div class="plate-art">${glyph("card")}</div>
      <div class="plate-copy">
        <p class="plate-body">A nagy forma a legerősebb dimenziód: a <em>szem</em> a nyitottságot jelöli. A benne futó vékony vonal a második legerősebb: a <em>villám</em> az extraverzió.</p>
        <p class="plate-note">Ez az ábra a profilod vizuális névjegye.</p>
      </div>
    </div>
  </details>`;

const tabs = `<div class="tabs"><span class="tab active">Eredmények</span><span class="tab">Összevetés</span><span class="tab">Meghívók</span></div>`;

const screen = (heroHtml: string, withStrip = true) => `
  <div class="screen">
    ${heroHtml}
    ${tabs}
    ${closedPlate}
    ${withStrip ? `<section class="panel"><p class="eyebrow">Dimenzióid</p>${dimensionStrip(ORDER)}</section>` : ""}
  </div>`;

const mobileScreen = (size: number) => `
  <div class="screen mobile">
    ${heroNameSlot(size, { actions: false })}
    ${closedPlate}
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
  .page { max-width:1140px; margin:0 auto; padding:52px 26px 90px; display:flex; flex-direction:column; gap:42px; }
  .eyebrow { font-family:var(--mono); font-size:10.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--accent-deep); margin:0 0 8px; }
  h1 { font-size:clamp(27px,4.4vw,39px); font-weight:400; line-height:1.08; margin:0 0 12px; text-wrap:balance; }
  .lede { font-size:17px; font-style:italic; color:var(--accent-deep); max-width:64ch; margin:0; }
  .intro p { color:var(--body); font-size:16px; line-height:1.6; max-width:66ch; margin:0 0 10px; }

  .block { border-top:2px solid var(--accent); padding-top:22px; display:flex; flex-direction:column; gap:14px; }
  .block-head { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  .bid { font-family:var(--mono); font-size:12.5px; letter-spacing:.16em; color:var(--accent); }
  .block h2.bt { font-size:22px; font-weight:400; margin:0; }
  .block .desc { color:var(--body); font-size:15px; line-height:1.6; max-width:70ch; margin:0; }
  .frames { display:grid; grid-template-columns:minmax(0,1fr) 300px; gap:18px; align-items:start; }
  .frames.pair { grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); }
  @media (max-width:900px) { .frames, .frames.pair { grid-template-columns:1fr; } }
  .frame { background:var(--panel); border:1px solid var(--rule); border-radius:14px; padding:18px; }
  .frame-label { font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); margin:0 0 14px; }

  .screen { display:flex; flex-direction:column; gap:13px; }
  .screen.mobile { max-width:280px; }

  .hero { background:${HERO_GRADIENT}; border-radius:16px; padding:22px 24px 24px; color:#fff; }
  .hero-top { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
  .hero-id { display:flex; align-items:center; gap:14px; min-width:0; }
  .hero-id-text { min-width:0; }
  .eyebrow-light { font-family:var(--mono); font-size:9.5px; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.55); margin:0 0 3px; }
  .hero-name { font-size:29px; font-weight:400; margin:0; letter-spacing:-.01em; }
  .hero-meta { font-size:11px; color:rgba(255,255,255,.5); margin:3px 0 0; }
  .hero-actions { display:flex; gap:8px; flex:0 0 auto; }
  .btn { font-size:12px; background:#c17f4a; border-radius:8px; padding:8px 12px; }
  .btn.ghost { background:rgba(255,255,255,.1); }
  .g { border-radius:12px; overflow:hidden; border:1px solid rgba(255,255,255,.18); flex:0 0 auto; }
  .g svg, .sum-thumb svg, .plate-art svg { width:100%; height:auto; display:block; }
  .type-row { display:flex; align-items:center; gap:12px; margin-top:18px; }
  .type-label { font-size:20px; font-style:italic; color:${TYPE_GOLD}; }
  .type-label.solo { margin:16px 0 0; }
  .hero-summary { font-size:13.5px; line-height:1.55; color:rgba(255,255,255,.75); max-width:44ch; margin:10px 0 0; }
  .chips { display:flex; gap:7px; margin-top:12px; }
  .chip-dark { font-size:10.5px; background:rgba(61,107,94,.4); color:#cfe3dc; border-radius:5px; padding:3px 8px; }

  .tabs { display:flex; gap:18px; border-bottom:1px solid var(--rule); padding:0 4px; }
  .tab { font-size:13.5px; color:var(--muted); padding:8px 0; }
  .tab.active { color:var(--ink); border-bottom:2px solid var(--accent); }

  .plate { background:var(--panel); border:1px solid var(--rule); border-radius:14px; overflow:hidden; }
  .plate summary { list-style:none; cursor:pointer; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:11px 14px; }
  .plate summary::-webkit-details-marker { display:none; }
  .sum-left { display:flex; align-items:center; gap:11px; min-width:0; }
  .sum-thumb { width:32px; border-radius:8px; overflow:hidden; border:1px solid var(--rule); flex:0 0 auto; }
  .sum-text { display:flex; flex-direction:column; min-width:0; }
  .sum-eyebrow { font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:var(--accent-deep); }
  .sum-title { font-size:15px; }
  .sum-pair { font-size:12.5px; font-style:italic; color:var(--muted); }
  .sum-toggle { display:flex; align-items:center; gap:7px; flex:0 0 auto; font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .chev { transition:transform .18s ease; }
  .plate .open-label { display:none; }
  .plate[open] .closed-label { display:none; }
  .plate[open] .open-label { display:inline; }
  .plate[open] .chev { transform:rotate(180deg); }
  @media (prefers-reduced-motion:reduce) { .chev { transition:none; } }
  .plate-inner { display:grid; grid-template-columns:minmax(0,300px) minmax(0,1fr); gap:20px; padding:14px 14px 16px; border-top:1px solid var(--rule); align-items:center; }
  .screen.mobile .plate-inner { grid-template-columns:1fr; }
  .plate-art { border:1px solid var(--rule); border-radius:12px; overflow:hidden; }
  .plate-copy { display:flex; flex-direction:column; gap:7px; }
  .plate-body, .plate-note { font-size:13.5px; line-height:1.6; color:var(--body); margin:0; }
  .plate-note { font-style:italic; color:var(--muted); }

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
  footer { border-top:1px solid var(--rule); padding-top:16px; font-size:13.5px; font-style:italic; color:var(--muted); }
</style>

<div class="page">
  <header>
    <p class="eyebrow">Trita · elhelyezési terv · ábra a név mellett</p>
    <h1>Az ábra a felső blokkban, a név mellett</h1>
    <p class="lede">Az ábra pontosan a monogram helyére kerül, a típusnév mellől pedig eltűnik. Három méret ugyanazon a felületen, alatta közvetlen összevetés a „típus mellett” változattal.</p>
  </header>

  <div class="intro">
    <p>A név melletti hely erősebb: ez a fejléc első képe, a lap belépő pontja. Ugyanakkor a típusnévtől elszakad — a néző maga kapcsolja össze a formát a névvel. A három méret arról szól, hogy ez a kapcsolat mennyire nyilvánvaló: 48 px-en jelvény, 88 px-en tábla.</p>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">48 px</span><h2 class="bt">Pontosan a monogram helyén</h2></div>
    <p class="desc">Ugyanaz a ritmus, mint eddig: a fejléc szerkezete nem változik, csak a kör helyén egy krém tábla áll. A másodlagos motívum még olvasható, a kísérőelemek már nem.</p>
    <div class="frames">
      <div class="frame"><p class="frame-label">asztali · 760 px</p>${screen(heroNameSlot(48))}</div>
      <div class="frame"><p class="frame-label">mobil · 280 px</p>${mobileScreen(48)}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">64 px</span><h2 class="bt">A név-blokk magasságával egyező tábla</h2></div>
    <p class="desc">A tábla nagysága kiadja az eyebrow + név + dátum blokk magasságát, így egy vizuális egységként olvas. Szerintem ez a legjobb arány ebben az elhelyezésben.</p>
    <div class="frames">
      <div class="frame"><p class="frame-label">asztali · 760 px</p>${screen(heroNameSlot(64))}</div>
      <div class="frame"><p class="frame-label">mobil · 280 px</p>${mobileScreen(64)}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">88 px</span><h2 class="bt">Domináns tábla, eyebrow nélkül</h2></div>
    <p class="desc">Itt már a kép vezet, nem a név. Az „A te profilod” eyebrow kikerül a blokkból (különben túl magas lesz), a fejléc pedig két erős elemre egyszerűsödik: ábra és név.</p>
    <div class="frames">
      <div class="frame"><p class="frame-label">asztali · 760 px</p>${screen(heroNameSlot(88, { eyebrowBeside: false }))}</div>
      <div class="frame"><p class="frame-label">mobil · 280 px</p>${mobileScreen(72)}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">↔</span><h2 class="bt">Összevetés: név mellett vs. típus mellett</h2></div>
    <p class="desc">Ugyanaz az oldal, ugyanaz a méret (56–64 px), csak az ábra helye más. Bal: a név mellett (fejléc-jelvény). Jobb: a típusnév mellett (a névhez tartozó jel).</p>
    <div class="frames pair">
      <div class="frame"><p class="frame-label">a név mellett · 64 px</p>${screen(heroNameSlot(64), false)}</div>
      <div class="frame"><p class="frame-label">a típus mellett · 56 px</p>${screen(heroTypeSlot(), false)}</div>
    </div>
  </div>

  <div class="block">
    <div class="block-head"><span class="bid">?</span><h2 class="bt">Amit mérlegelni érdemes</h2></div>
    <div class="notes">
      <div class="item">
        <h3>Erősebb hely</h3>
        <p>A név melletti pozíció a fejléc első képe — ez a leghangsúlyosabb hely a lapon, és a profil „arca” lesz.</p>
      </div>
      <div class="item">
        <h3>Elszakad a névtől</h3>
        <p>A típusnévtől távolabb kerül, így nem magától értetődő, hogy az ábra a típust jelöli. A zárható tábla fejléc-sora („A te ábrád — Energikus újító”) ezt köti össze.</p>
      </div>
      <div class="item">
        <h3>Monogram-szerep</h3>
        <p>A hely a monogramé volt, azaz „ki vagyok”. Az ábra viszont „milyen vagyok” — ez erősebb tartalom ugyanazon a helyen, de az avatár-funkció (arc, azonosítás listákban) itt elveszik.</p>
      </div>
      <div class="item">
        <h3>Egyetlen ábra a fejlécben</h3>
        <p>Fontos, hogy a típusnév mellől eltűnjön: két különböző méretű ugyanolyan ábra egy fejlécben zajos lenne.</p>
      </div>
    </div>
  </div>

  <footer>Makett, nem megvalósítás: app-kód nem változott. A zárható tábla mindhárom változatban ugyanaz — a nyit/zár itt <code>&lt;details&gt;</code>.</footer>
</div>`;

writeFileSync(join(outDir, "placement-nameslot.html"), body, "utf-8");
writeFileSync(
  join(outDir, "placement-nameslot-standalone.html"),
  `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Típus-ábra — a név mellett</title>
</head><body>${body}</body></html>`,
  "utf-8",
);

console.log(`Makett (body-only): ${join(outDir, "placement-nameslot.html")}`);
console.log(`Makett (önálló): ${join(outDir, "placement-nameslot-standalone.html")}`);
