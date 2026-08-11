/**
 * Típus-ábra ELHELYEZÉSI TERV — előnézet-generátor (fejlesztői eszköz).
 * Futtatás: npx tsx scripts/preview-glyph-placements.ts [kimeneti-mappa]
 *
 * Nem megvalósítás: makettek arról, HOL és MILYEN MÉRETBEN jelenjen meg a
 * típus-ábra. A makettek a valódi felület-színeket és tipográfiát
 * közelítik (sötét self-hero, krém tartalom-sáv), és a valódi TypeGlyph
 * komponenst renderelik — így a méret-döntés nem képzeletből születik.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { createElement } from "react";
import { TypeGlyph } from "../src/components/type/TypeGlyph";
import { GLYPH_COLORS } from "../src/lib/type-glyph";

const outDir = process.argv[2] ?? join(process.cwd(), ".glyph-previews");
mkdirSync(outDir, { recursive: true });

// Példa-típus végig ugyanaz, hogy a méretek összevethetők legyenek:
// domináns Nyitottság (szem), második Extraverzió (villám) — „Energikus újító”.
const DEMO = { primaryCode: "O", secondaryCode: "X", label: "Energikus újító" };

const glyph = (variant: "hero" | "card" | "badge", extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(
    createElement(TypeGlyph, {
      primaryCode: DEMO.primaryCode,
      secondaryCode: DEMO.secondaryCode,
      typeLabel: DEMO.label,
      dimensionLabel: "Nyitottság × Extraverzió",
      variant,
      intensity: 4,
      ...extra,
    }),
  );

// A valódi felületek színei (globals.css)
const HERO_GRADIENT = "linear-gradient(135deg,#2a5244 0%,#1e3d34 60%,#1a2e28 100%)";
const TYPE_GOLD = "#e8a96a";

const option = (
  id: string,
  title: string,
  size: string,
  where: string,
  why: string,
  cons: string,
  mock: string,
  recommended = false,
) => `
  <section class="option${recommended ? " recommended" : ""}">
    <header>
      <div class="head-line">
        <span class="oid">${id}</span>
        <h2>${title}</h2>
        ${recommended ? '<span class="pill">javaslat</span>' : ""}
      </div>
      <dl>
        <div><dt>Hol</dt><dd>${where}</dd></div>
        <div><dt>Méret</dt><dd>${size}</dd></div>
        <div><dt>Miért</dt><dd>${why}</dd></div>
        <div><dt>Kockázat</dt><dd>${cons}</dd></div>
      </dl>
    </header>
    <div class="mock">${mock}</div>
  </section>`;

// ── A) Hero-medál ──────────────────────────────────────────────────────
const mockA = `
  <div class="screen dark">
    <div class="hero">
      <div class="hero-row">
        <div class="avatar">D</div>
        <div>
          <p class="eyebrow-light">A te profilod</p>
          <h3 class="hero-name">Kilin Dániel</h3>
          <p class="hero-meta">Felmérés · 2026. július 28.</p>
        </div>
      </div>
      <div class="type-row">
        <div class="g-88">${glyph("badge")}</div>
        <span class="type-label">Energikus újító</span>
      </div>
      <p class="hero-summary">Nyitott, gyorsan kapcsoló gondolkodás — a felvetéstől a kipróbálásig rövid nálad az út.</p>
    </div>
  </div>`;

// ── B) Hero-tábla, jobb oldali bleed ──────────────────────────────────
const mockB = `
  <div class="screen dark">
    <div class="hero bleed">
      <div class="bleed-art">${glyph("card")}</div>
      <div class="bleed-text">
        <p class="eyebrow-light">A te profilod</p>
        <h3 class="hero-name">Kilin Dániel</h3>
        <span class="type-label">Energikus újító</span>
        <p class="hero-summary">Nyitott, gyorsan kapcsoló gondolkodás — a felvetéstől a kipróbálásig rövid nálad az út.</p>
      </div>
    </div>
  </div>`;

// ── C) Önálló típus-tábla a hero alatt ────────────────────────────────
const mockC = `
  <div class="screen">
    <div class="hero mini">
      <span class="hero-name small">Kilin Dániel</span>
      <span class="type-label small">Energikus újító</span>
    </div>
    <div class="plate">
      <div class="plate-art">${glyph("hero")}</div>
      <div class="plate-copy">
        <p class="eyebrow">A te ábrád</p>
        <h3 class="plate-title">Energikus újító</h3>
        <p class="plate-pair">Nyitottság × Extraverzió</p>
        <p class="plate-body">A nagy forma a legerősebb dimenziód: a <em>szem</em> a nyitottságot jelöli. A benne futó vékony vonal a második legerősebb: a <em>villám</em> az extraverziót. A kitöltés erőssége a pontszámot követi.</p>
        <p class="plate-note">Ugyanez az ábra kerül a megosztott linkre és a PDF-be — ez a profilod vizuális névjegye.</p>
      </div>
    </div>
  </div>`;

// ── D) Megosztott nézet fedőkártya ────────────────────────────────────
const mockD = `
  <div class="screen">
    <div class="share-card">
      <div class="g-300">${glyph("card")}</div>
      <p class="eyebrow">Megosztott profil</p>
      <h3 class="share-name">Kilin Dániel</h3>
      <span class="type-label dark-gold">Energikus újító</span>
    </div>
  </div>`;

// ── E) Kis méretek: listák, összevetés, dossié ────────────────────────
const mockE = `
  <div class="screen">
    <div class="list">
      ${["Kilin Dániel", "Nagy Kata", "Szabó Márton"]
        .map(
          (name, i) => `
        <div class="list-row">
          <div class="g-36">${glyph("badge")}</div>
          <div class="list-text">
            <span class="list-name">${name}</span>
            <span class="list-type">${["Energikus újító", "Módszeres empata", "Elvhű hídépítő"][i]}</span>
          </div>
          <span class="list-meta">${["kitöltve", "kitöltve", "folyamatban"][i]}</span>
        </div>`,
        )
        .join("")}
    </div>
    <div class="chips">
      <span class="chip"><span class="g-24">${glyph("badge")}</span> profil-fejléc chip (24 px)</span>
      <span class="chip"><span class="g-36">${glyph("badge")}</span> lista-sor (36 px)</span>
      <span class="chip"><span class="g-56">${glyph("badge")}</span> mai hero-méret (56 px)</span>
    </div>
  </div>`;

const body = `<style>
  :root {
    --ground:${GLYPH_COLORS.canvas}; --panel:#ffffff; --ink:${GLYPH_COLORS.line};
    --body:#4a4a5e; --muted:#7a756e; --accent:${GLYPH_COLORS.form};
    --accent-deep:${GLYPH_COLORS.captionAccent}; --rule:#e8e0d3;
    --serif: Georgia,'Iowan Old Style','Times New Roman',serif;
    --mono: ui-monospace,SFMono-Regular,Menlo,monospace;
  }
  @media (prefers-color-scheme: dark) {
    :root { --ground:#14141d; --panel:#1d1d28; --ink:#f2efe8; --body:#c9c5bd;
            --muted:#938d84; --accent:#d79a68; --accent-deep:#e0b087; --rule:#2f2f3d; }
  }
  :root[data-theme="dark"] { --ground:#14141d; --panel:#1d1d28; --ink:#f2efe8; --body:#c9c5bd;
            --muted:#938d84; --accent:#d79a68; --accent-deep:#e0b087; --rule:#2f2f3d; }
  :root[data-theme="light"] { --ground:${GLYPH_COLORS.canvas}; --panel:#ffffff; --ink:${GLYPH_COLORS.line};
            --body:#4a4a5e; --muted:#7a756e; --accent:${GLYPH_COLORS.form};
            --accent-deep:${GLYPH_COLORS.captionAccent}; --rule:#e8e0d3; }

  body { margin:0; background:var(--ground); color:var(--ink); font-family:var(--serif); }
  .page { max-width:1080px; margin:0 auto; padding:52px 26px 90px; display:flex; flex-direction:column; gap:44px; }
  .eyebrow { font-family:var(--mono); font-size:11px; letter-spacing:.2em; text-transform:uppercase; color:var(--accent-deep); margin:0 0 8px; }
  h1 { font-size:clamp(28px,4.5vw,42px); font-weight:400; line-height:1.06; margin:0 0 12px; text-wrap:balance; }
  .lede { font-size:17.5px; font-style:italic; color:var(--accent-deep); max-width:64ch; margin:0; }
  .intro p { color:var(--body); font-size:16px; line-height:1.6; max-width:66ch; }

  .option { border-top:1px solid var(--rule); padding-top:26px; display:flex; flex-direction:column; gap:18px; }
  .option.recommended { border-top:2px solid var(--accent); }
  .head-line { display:flex; align-items:baseline; gap:12px; flex-wrap:wrap; }
  .oid { font-family:var(--mono); font-size:13px; letter-spacing:.16em; color:var(--accent); }
  .option h2 { font-size:23px; font-weight:400; margin:0; }
  .pill { font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase;
          border:1px solid var(--accent); color:var(--accent); border-radius:999px; padding:3px 9px; }
  .option dl { display:grid; grid-template-columns:repeat(auto-fit,minmax(210px,1fr)); gap:14px 22px; margin:14px 0 0; }
  .option dt { font-family:var(--mono); font-size:10px; letter-spacing:.14em; text-transform:uppercase; color:var(--muted); }
  .option dd { margin:3px 0 0; font-size:14.5px; line-height:1.5; color:var(--body); }

  .mock { background:var(--panel); border:1px solid var(--rule); border-radius:14px; padding:22px; overflow:hidden; }
  .screen { max-width:760px; margin:0 auto; display:flex; flex-direction:column; gap:16px; font-family:var(--serif); }
  .screen.dark .hero, .hero.bleed { color:#fff; }
  .hero { background:${HERO_GRADIENT}; border-radius:16px; padding:26px 30px 28px; color:#fff; position:relative; overflow:hidden; }
  .hero-row { display:flex; align-items:center; gap:14px; }
  .avatar { width:44px; height:44px; border-radius:50%; background:linear-gradient(135deg,#c17f4a,#9a6538);
            display:flex; align-items:center; justify-content:center; font-size:19px; font-weight:700; }
  .eyebrow-light { font-family:var(--mono); font-size:10px; letter-spacing:.18em; text-transform:uppercase; color:rgba(255,255,255,.55); margin:0 0 3px; }
  .hero-name { font-size:30px; font-weight:400; margin:0; letter-spacing:-.01em; }
  .hero-name.small { font-size:20px; }
  .hero-meta { font-size:11.5px; color:rgba(255,255,255,.5); margin:3px 0 0; }
  .hero-summary { font-size:14.5px; line-height:1.55; color:rgba(255,255,255,.78); max-width:46ch; margin:14px 0 0; }
  .type-row { display:flex; align-items:center; gap:14px; margin-top:18px; }
  .type-label { font-size:22px; font-style:italic; color:${TYPE_GOLD}; }
  .type-label.small { font-size:15px; }
  .type-label.dark-gold { color:var(--accent-deep); font-size:20px; }
  .hero.mini { display:flex; align-items:baseline; gap:12px; padding:16px 22px; }

  .hero.bleed { display:grid; grid-template-columns:minmax(0,1fr) 300px; align-items:center; gap:8px; padding-right:0; }
  .bleed-text { display:flex; flex-direction:column; gap:6px; }
  .bleed-art { grid-column:2; width:340px; margin-right:-40px; border-radius:12px; overflow:hidden; box-shadow:0 18px 40px rgba(0,0,0,.28); }
  .bleed-art svg, .g-88 svg, .g-300 svg, .g-56 svg, .g-36 svg, .g-24 svg, .plate-art svg { width:100%; height:auto; display:block; }
  .g-88 { width:88px; border-radius:14px; overflow:hidden; border:1px solid rgba(255,255,255,.16); }
  .g-300 { width:300px; border-radius:16px; overflow:hidden; border:1px solid var(--rule); }
  .g-56 { width:56px; border-radius:10px; overflow:hidden; border:1px solid var(--rule); }
  .g-36 { width:36px; border-radius:8px; overflow:hidden; border:1px solid var(--rule); }
  .g-24 { width:24px; border-radius:6px; overflow:hidden; border:1px solid var(--rule); }

  .plate { display:grid; grid-template-columns:minmax(0,340px) minmax(0,1fr); gap:26px; align-items:center;
           background:#fff; border:1px solid var(--rule); border-radius:16px; padding:24px; }
  .plate-art { border-radius:12px; overflow:hidden; border:1px solid var(--rule); }
  .plate-copy { display:flex; flex-direction:column; gap:4px; }
  .plate-title { font-size:27px; font-weight:400; margin:0; color:#1a1a2e; }
  .plate-pair { font-family:var(--mono); font-size:12px; letter-spacing:.12em; color:#7a756e; margin:0 0 8px; }
  .plate-body, .plate-note { font-size:14.5px; line-height:1.6; color:#4a4a5e; margin:0; }
  .plate-note { font-style:italic; color:#7a756e; margin-top:8px; }

  .share-card { background:#fff; border:1px solid var(--rule); border-radius:18px; padding:30px;
                display:flex; flex-direction:column; align-items:center; gap:6px; text-align:center; }
  .share-name { font-size:26px; font-weight:400; margin:6px 0 0; color:#1a1a2e; }

  .list { background:#fff; border:1px solid var(--rule); border-radius:14px; overflow:hidden; }
  .list-row { display:flex; align-items:center; gap:14px; padding:12px 16px; border-bottom:1px solid var(--rule); }
  .list-row:last-child { border-bottom:0; }
  .list-text { display:flex; flex-direction:column; flex:1; min-width:0; }
  .list-name { font-size:15px; color:#1a1a2e; }
  .list-type { font-size:12.5px; font-style:italic; color:#7a756e; }
  .list-meta { font-family:var(--mono); font-size:10.5px; letter-spacing:.12em; text-transform:uppercase; color:#7a756e; }
  .chips { display:flex; flex-wrap:wrap; gap:14px; }
  .chip { display:inline-flex; align-items:center; gap:9px; font-size:13px; color:var(--body);
          border:1px solid var(--rule); border-radius:999px; padding:6px 14px 6px 8px; background:var(--panel); }

  footer { border-top:1px solid var(--rule); padding-top:16px; font-size:13.5px; font-style:italic; color:var(--muted); }
  @media (max-width:820px) {
    .plate, .hero.bleed { grid-template-columns:1fr; }
    .bleed-art { margin-right:0; width:100%; grid-column:1; }
  }
</style>

<div class="page">
  <header>
    <p class="eyebrow">Trita · elhelyezési terv</p>
    <h1>Hol legyen a típus-ábra?</h1>
    <p class="lede">Öt makett ugyanazzal a típussal (Energikus újító — Nyitottság × Extraverzió), hogy a méret és a hely döntése látványból szülessen, ne leírásból.</p>
  </header>

  <div class="intro">
    <p>A mai állapot: 56 px-es medál a típusnév mellett a sötét heróban (eredmények és megosztott nézet). Működik azonosításra, de az ábra kompozíciója — a kísérőelemek, a talajvonal, a negatív tér — ekkora méretben elveszik. A makettek a valódi felület-színekkel készültek; a bennük lévő ábra a valódi komponens kimenete.</p>
  </div>

  ${option(
    "A",
    "Hero-medál, nagyobb",
    "88 px (ma 56 px)",
    "Ott, ahol most van: az eredmény-oldal sötét herójában, a típusnév mellett.",
    "A legkisebb változás. A medál kicsit nagyobb, a badge-változat kivágása miatt így is tiszta marad.",
    "Az ábra továbbra is kellék, nem élmény. A kísérőelemek nem látszanak.",
    mockA,
  )}

  ${option(
    "B",
    "Hero-tábla, jobb oldali bleed",
    "340 px, a hero szélén túlfutva",
    "Az eredmény-oldal herója kétosztatúvá válik: bal oldalon a szöveg, jobb oldalon az ábra táblaként, a kártya széléből kilógva.",
    "Azonnal látványos, és a hero „arca” lesz. A krém ábra a sötét sage-en úgy hat, mint egy kép a falon.",
    "A hero szöveg-sávja szűkül; mobilon egymás alá kell törni. A PDF-gomb és a megosztás-gomb helyét újra kell rendezni.",
    mockB,
  )}

  ${option(
    "C",
    "Önálló típus-tábla a hero alatt",
    "hero-változat, 340–420 px",
    "Új szekció közvetlenül a hero alatt, az eredmények első blokkjaként: bal oldalon a teljes kompozíció, jobb oldalon a típus neve, a dimenzió-pár és a nyelvtan két mondatban.",
    "Ez az egyetlen hely, ahol az ábra teljes egészében látszik ÉS meg is van magyarázva — a felirat, a talajvonal, a kísérőelemek mind a helyükön. Egyszerre látvány és tanítás.",
    "Egy blokkal hosszabb lesz az oldal; a hero és a tábla között ne legyen redundancia (a heróban ezért marad kis medál).",
    mockC,
    true,
  )}

  ${option(
    "D",
    "Megosztott nézet fedőkártyája",
    "300 px, középre",
    "A /share/[token] oldal fejlécében: az ábra a lap főszereplője, alatta a név és a típus.",
    "Ezt látják mások — itt a legnagyobb a névjegy-érték. Nagy méretben nem magyarázat kell hozzá, hanem hatás.",
    "A megosztott oldalon nincs sok kontextus; a dimenzió-pár feliratot érdemes megtartani, hogy ne legyen puszta dekoráció.",
    mockD,
    true,
  )}

  ${option(
    "E",
    "Kis méretek — listák és fejlécek",
    "24 / 36 px",
    "Csapat-tagok listája, tag-dossié, önértékelés–observer összevetés, jelölt-lista.",
    "Az ábra itt azonosító, nem illusztráció: pár tag mellett a forma-sziluett gyorsabban olvas, mint a névsor.",
    "36 px alatt a másodlagos motívum már nem olvasható — 24 px-en csak a forma jelent információt. Vagy elfogadjuk, vagy 24 px-en motívum nélküli változat kell.",
    mockE,
  )}

  <footer>Javaslat: C + D együtt (a saját nézet magyarázó táblája és a megosztott nézet névjegye), a heróban maradó kis medállal (A). B akkor jó választás, ha inkább egy erős hero kell, mint egy magyarázó blokk — a kettő együtt sok.</footer>
</div>`;

writeFileSync(join(outDir, "placements.html"), body, "utf-8");
writeFileSync(
  join(outDir, "placements-standalone.html"),
  `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Trita típus-ábra — elhelyezési terv</title>
</head><body>${body}</body></html>`,
  "utf-8",
);

console.log(`Elhelyezési terv (body-only): ${join(outDir, "placements.html")}`);
console.log(`Elhelyezési terv (önálló): ${join(outDir, "placements-standalone.html")}`);
