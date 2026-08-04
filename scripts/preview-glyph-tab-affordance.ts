/**
 * Fül-jelzés változatok — makett (fejlesztői eszköz, nem megvalósítás).
 * Futtatás: npx tsx scripts/preview-glyph-tab-affordance.ts [kimeneti-mappa]
 *
 * A kérdés: mi vezesse a szemet a fülhöz úgy, hogy ne vigye el a hangsúlyt.
 * Öt változat ugyanazon a hero-alsó-szélen, egymás alatt összevethetően.
 * A fájl böngészőben hoverelhető — a hover-viselkedés is látszik.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { GLYPH_COLORS } from "../src/lib/type-glyph";

const outDir = process.argv[2] ?? join(process.cwd(), ".glyph-previews");
mkdirSync(outDir, { recursive: true });

const LABEL = "Mit jelent a karakter-ábrám?";

const variants: Array<{ id: string; name: string; note: string; mark: string; live?: boolean }> = [
  {
    id: "A",
    name: "Nehéz karakter-nyíl (a mostani előtt)",
    note: "A ▾ karakter tömör háromszög: sötét, tömeges, a felirattal együtt két hangsúlyt ad. Ez volt a kifogásolt állapot.",
    mark: `<span class="heavy">▾</span>`,
  },
  {
    id: "B",
    name: "Vékony vonalas nyíl",
    note: "SVG, 1,2 px vonal, 40% fehér. Ugyanazt mondja, negyed annyi tintával; hoverre 1,5 px-t lebillen és világosodik. — ez van most beépítve",
    mark: `<svg class="thin" viewBox="0 0 16 7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.4 1.4 L8 5.6 L14.6 1.4"/></svg>`,
    live: true,
  },
  {
    id: "C",
    name: "Fogantyú-vonal",
    note: "24×2 px lekerekített hajszálvonal — a mobil bottom-sheet fogantyújának nyelve: „húzz meg”, nyíl nélkül. A leghalkabb, de nem mondja meg, hogy lefelé nyílik.",
    mark: `<span class="grip"></span>`,
  },
  {
    id: "D",
    name: "Kettős hajszálvonal",
    note: "Két rövidülő vonal egymás alatt — irányt is sugall (lefelé keskenyedik), és díszként is olvas. Kissé dekoratív.",
    mark: `<span class="stack"><i></i><i></i></span>`,
  },
  {
    id: "E",
    name: "Csak felirat, hoverre nyíl",
    note: "Alapállapotban semmi jel, a fül alakja az egyetlen jelzés; hoverre halkan előjön a vékony nyíl. Legcsendesebb, de érintésen (mobil) nincs hover — ott soha nem jelenik meg.",
    mark: `<svg class="thin onhover" viewBox="0 0 16 7" fill="none" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path d="M1.4 1.4 L8 5.6 L14.6 1.4"/></svg>`,
  },
];

const HERO_GRADIENT = "linear-gradient(135deg,#2a5244 0%,#1e3d34 60%,#1a2e28 100%)";

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
  .page { max-width:980px; margin:0 auto; padding:52px 26px 90px; display:flex; flex-direction:column; gap:38px; }
  .eyebrow { font-family:var(--mono); font-size:10.5px; letter-spacing:.2em; text-transform:uppercase; color:var(--accent-deep); margin:0 0 8px; }
  h1 { font-size:clamp(26px,4.2vw,36px); font-weight:400; line-height:1.08; margin:0 0 12px; text-wrap:balance; }
  .lede { font-size:16.5px; font-style:italic; color:var(--accent-deep); max-width:62ch; margin:0; }
  .intro p { color:var(--body); font-size:15.5px; line-height:1.6; max-width:66ch; margin:0; }

  .variant { border-top:1px solid var(--rule); padding-top:20px; display:flex; flex-direction:column; gap:12px; }
  .variant.live { border-top:2px solid var(--accent); }
  .vhead { display:flex; align-items:baseline; gap:10px; flex-wrap:wrap; }
  .vid { font-family:var(--mono); font-size:12px; letter-spacing:.16em; color:var(--accent); }
  .variant h2 { font-size:19px; font-weight:400; margin:0; }
  .pill { font-family:var(--mono); font-size:9.5px; letter-spacing:.14em; text-transform:uppercase;
          border:1px solid var(--accent); color:var(--accent); border-radius:999px; padding:2px 8px; }
  .variant p.note { font-size:14px; line-height:1.55; color:var(--body); margin:0; max-width:70ch; }

  /* Hero-utánzat: csak az alsó sáv, hogy a fül helye valósághű legyen */
  .stage { background:var(--panel); border:1px solid var(--rule); border-radius:14px; padding:18px 18px 26px; }
  .hero-bottom { background:${HERO_GRADIENT}; border-radius:0 0 16px 16px; height:74px; position:relative; }
  .hero-bottom::before { content:"…a hero alsó sávja"; position:absolute; left:18px; top:14px;
    font-family:var(--mono); font-size:9.5px; letter-spacing:.16em; text-transform:uppercase; color:rgba(255,255,255,.28); }
  .tabrow { position:relative; z-index:1; margin-top:-12px; display:flex; justify-content:center; }
  .tab { display:inline-flex; flex-direction:column; align-items:center; gap:4px;
         border:0; cursor:pointer; border-radius:0 0 16px 16px; padding:16px 20px 7px;
         font-family:var(--serif); font-size:13.5px; line-height:1.2; color:rgba(255,255,255,.8);
         background-image:linear-gradient(180deg,#1e3d34 0%,#1a2e28 100%); transition:color .25s; }
  .tab:hover { color:#fff; }

  .heavy { font-size:11px; line-height:1; color:rgba(255,255,255,.55); }
  .thin { width:16px; height:7px; color:rgba(255,255,255,.4); transition:transform .25s, color .25s, opacity .25s; }
  .tab:hover .thin { color:rgba(255,255,255,.7); transform:translateY(1.5px); }
  .thin.onhover { opacity:0; }
  .tab:hover .thin.onhover { opacity:1; }
  .grip { display:block; width:24px; height:2px; border-radius:2px; background:rgba(255,255,255,.3); transition:background .25s, transform .25s; }
  .tab:hover .grip { background:rgba(255,255,255,.55); transform:translateY(1.5px); }
  .stack { display:flex; flex-direction:column; align-items:center; gap:2.5px; }
  .stack i { display:block; height:1.5px; border-radius:2px; background:rgba(255,255,255,.28); transition:background .25s, transform .25s; }
  .stack i:first-child { width:22px; }
  .stack i:last-child { width:12px; }
  .tab:hover .stack i { background:rgba(255,255,255,.5); transform:translateY(1.5px); }

  footer { border-top:1px solid var(--rule); padding-top:16px; font-size:13.5px; font-style:italic; color:var(--muted); }
  @media (prefers-reduced-motion:reduce) { .thin,.grip,.stack i { transition:none; } }
</style>

<div class="page">
  <header>
    <p class="eyebrow">Trita · fül-jelzés</p>
    <h1>Mi vezesse a szemet a fülhöz?</h1>
    <p class="lede">Öt változat ugyanazon a hero-alsó-szélen. Vidd rájuk az egeret — a hover-viselkedés is része a döntésnek.</p>
  </header>

  <div class="intro">
    <p>A cél: a fül legyen észrevehető, de ne képezzen második hangsúlyt a felirat mellett. A tömör ▾ karakter azért harsány, mert kitöltött háromszög — sötét foltot tesz a világos felirat alá. Minden alternatíva ezt a foltot vékonyítja vagy cseréli.</p>
  </div>

  ${variants
    .map(
      (v) => `
    <div class="variant${v.live ? " live" : ""}">
      <div class="vhead">
        <span class="vid">${v.id}</span>
        <h2>${v.name}</h2>
        ${v.live ? '<span class="pill">most ez él</span>' : ""}
      </div>
      <p class="note">${v.note}</p>
      <div class="stage">
        <div class="hero-bottom"></div>
        <div class="tabrow">
          <button type="button" class="tab">${LABEL}${v.mark}</button>
        </div>
      </div>
    </div>`,
    )
    .join("")}

  <footer>Javaslat: B (vékony vonalas nyíl) — annyit mond, amennyi kell, és érintésen is látszik. Ha még halkabb kell, C a fogantyú-vonallal; E-t nem javaslom, mert mobilon nincs hover, ott a jelzés soha nem jelenik meg.</footer>
</div>`;

writeFileSync(join(outDir, "tab-affordance.html"), body, "utf-8");
writeFileSync(
  join(outDir, "tab-affordance-standalone.html"),
  `<!DOCTYPE html>
<html lang="hu"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Fül-jelzés változatok</title>
</head><body>${body}</body></html>`,
  "utf-8",
);

console.log(`Fül-jelzés makett: ${join(outDir, "tab-affordance-standalone.html")}`);
