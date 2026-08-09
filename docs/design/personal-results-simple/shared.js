/* ───────────────────────────────────────────────────────────────────────────
   Trita — „Egyszerű eredmény-nézet" makett-készlet · közös adat + renderelők
   Sima script (nincs modul), hogy file:// protokollon is fusson.

   A minta-adat egy valósághű kitöltés: a típus-címke, a hero-mondat és a
   szint-küszöbök a tényleges kódból származnak
   (personality-type.ts, dimension-insights.ts, dimension-utils.ts).
   ─────────────────────────────────────────────────────────────────────── */
(function (global) {
  "use strict";

  // ── Minta-persona ────────────────────────────────────────────────────────
  // Pontszámok: X 81 · O 78 · H 74 · A 55 · C 46 · E 38
  // Domináns = Extraverzió, második = Nyitottság
  //   → resolvePersonalityTypeLabel("TEMP","OPEN","hu") = „Kísérletező hajtóerő"
  const DATA = {
    name: "Kovács Anna",
    date: "2026. augusztus 3.",
    type: "Kísérletező hajtóerő",
    // DIMENSION_STRENGTH_VERBS.TEMP + DIMENSION_WEAK_VERBS.RESO
    lede:
      "Jellemzően energikusan és inspirálóan vagy jelen — az érzelmi bevonódás kevésbé természetes tereped.",
    // A hat dimenzió a kanonikus HEXACO-sorrendben (tritan.ts TRITAN_ORDER).
    // A `name` mező a tritan.ts hivatalos címkéje — makettben sem írjuk át.
    dims: [
      {
        code: "INTE", letter: "H", name: "Becsületesség-Alázat", score: 74,
        color: "#4f5aa8", strong: "#3e4785", soft: "#eef0f8",
        poleLow: "Stratégiai pozicionálás", poleHigh: "Nyílt lapokkal",
        say: "Nyílt lapokkal játszol. Nem a pozíciódból akarsz erőt meríteni, és ezt a körülötted lévők is érzik.",
        short: "Nyílt, kiszámítható működés",
        desc: "Mennyire működsz nyílt lapokkal, és mennyire fontos a státusz és az előny megszerzése.",
        insight: "Egyenes, kiszámítható működés — a bizalom nálad gyorsan épül.",
        facets: [
          { label: "Őszinteség", score: 78 },
          { label: "Méltányosság", score: 81 },
          { label: "Kapzsiságkerülés", score: 69 },
          { label: "Szerénység", score: 68 },
        ],
      },
      {
        code: "RESO", letter: "E", name: "Emocionalitás", score: 38,
        color: "#7b5fae", strong: "#5f4693", soft: "#f1ecf9",
        poleLow: "Higgadt távolságtartás", poleHigh: "Mély érzelmi bevonódás",
        say: "Nyomás alatt is higgadt maradsz. Az érzelmi ráhangolódás kevésbé természetes tereped — másoknál ez néha távolságnak látszik.",
        short: "Higgadt, kevés érzelmi hullám",
        desc: "Mennyire erősen élsz meg érzelmi hullámokat, és mennyire keresel támaszt másokban.",
        insight: "Ritkán billensz ki — cserébe könnyen elsiklasz mások érzelmi jelzései fölött.",
        facets: [
          { label: "Félelem", score: 31 },
          { label: "Szorongás", score: 44 },
          { label: "Dependencia", score: 35 },
          { label: "Szentimentalitás", score: 42 },
        ],
      },
      {
        code: "TEMP", letter: "X", name: "Extraverzió", score: 81,
        color: "#c08d2e", strong: "#8a6215", soft: "#f8efdc",
        poleLow: "Csendes háttér", poleHigh: "Lendületes jelenlét",
        say: "Energiát viszel a térbe. Társaságban, vitában, indításnál te vagy a mozgató — a figyelem nem terhel, hanem tölt.",
        short: "Lendületes, látható jelenlét",
        desc: "Mennyi energiát viszel a társas helyzetekbe, és mennyire keresed a láthatóságot.",
        insight: "Te indítod be a helyzeteket — a jelenléted magával húzza a többieket.",
        facets: [
          { label: "Társas önértékelés", score: 84 },
          { label: "Társas merészség", score: 86 },
          { label: "Társaságkedvelés", score: 74 },
          { label: "Élénkség", score: 80 },
        ],
      },
      {
        code: "ADAP", letter: "A", name: "Barátságosság", score: 55,
        color: "#78924f", strong: "#556b35", soft: "#eff3e4",
        poleLow: "Éles visszajelzés", poleHigh: "Türelmes egyeztetés",
        say: "Tudsz türelmes lenni, de ha valami nem stimmel, ki is mondod. A helyzet dönti el, melyik oldalad hozod.",
        short: "Türelem és élesség között",
        desc: "Mennyire kezeled türelemmel a súrlódásokat, és milyen gyorsan mondod ki, ha valami nem jó.",
        insight: "Rugalmas középmező — nem konfliktuskerülő, de nem is élezed a helyzeteket.",
        facets: [
          { label: "Megbocsátás", score: 48 },
          { label: "Gyengédség", score: 57 },
          { label: "Rugalmasság", score: 62 },
          { label: "Türelem", score: 53 },
        ],
      },
      {
        code: "THOR", letter: "C", name: "Lelkiismeretesség", score: 46,
        color: "#3d7f95", strong: "#2c5f72", soft: "#e6f1f5",
        poleLow: "Rugalmas rögtönzés", poleHigh: "Rendszerezett végrehajtás",
        say: "A rendszert eszköznek nézed, nem célnak. A hosszú, aprólékos követés nem a te örömöd — az indulás igen.",
        short: "Inkább rögtönzés, mint rendszer",
        desc: "Mennyire dolgozol rendszerben, és mennyire viszed végig aprólékosan, amit elkezdtél.",
        insight: "Gyorsan indulsz, de a végigvitel struktúrát kíván — ezt érdemes külső kapaszkodóval megtámasztani.",
        facets: [
          { label: "Szervezettség", score: 39 },
          { label: "Szorgalom", score: 58 },
          { label: "Perfekcionizmus", score: 41 },
          { label: "Körültekintés", score: 45 },
        ],
      },
      {
        code: "OPEN", letter: "O", name: "Nyitottság", score: 78,
        color: "#b4688a", strong: "#8e4263", soft: "#f9eef3",
        poleLow: "Bevált megoldások", poleHigh: "Kísérletező gondolkodás",
        say: "Szívesen indulsz el új úton akkor is, ha nincs kitaposva. A „mindig így csináltuk” nálad inkább kérdés, mint válasz.",
        short: "Kísérletező gondolkodás",
        desc: "Mennyire vonz az új, a szokatlan és a kipróbálatlan megoldás.",
        insight: "Új ötletek gyors befogadása — a bevált rutin viszont hamar unalmassá válik.",
        facets: [
          { label: "Esztétikai fogékonyság", score: 71 },
          { label: "Kíváncsiság", score: 84 },
          { label: "Kreativitás", score: 82 },
          { label: "Konvenciómentesség", score: 75 },
        ],
      },
    ],
    // A szöveges mag: három állítás. Ez a „nagyon egyszerű" nézet gerince.
    statements: [
      {
        tag: "Ami a legjobban megy",
        kind: "strength",
        color: "#c08d2e",
        title: "Lendületet viszel oda, ahol állóvíz van.",
        body:
          "Te vagy az, aki elindít valamit — és nem a bevált utat választja hozzá. Ahol új irányt kell nyitni, vagy egy elakadt beszélgetést megmozgatni, ott a jelenléted önmagában dolgozik.",
        sources: [
          { label: "Extraverzió", color: "#c08d2e", soft: "#f8efdc" },
          { label: "Nyitottság", color: "#8e4263", soft: "#f9eef3" },
        ],
      },
      {
        tag: "Ahogy dolgozol",
        kind: "pattern",
        color: "#4f5aa8",
        title: "Gyorsan indulsz, nyílt lapokkal.",
        body:
          "Nem taktikázol, és nem várod meg, hogy előbb kész legyen a terv. A csapatnak ez lendület, néha viszont kapkodásnak látszik — érdemes kimondanod, hogy nálad a próbálkozás a gondolkodás formája.",
        sources: [
          { label: "Becsületesség-Alázat", color: "#3e4785", soft: "#eef0f8" },
          { label: "Extraverzió", color: "#8a6215", soft: "#f8efdc" },
        ],
      },
      {
        tag: "Amire figyelj",
        kind: "watch",
        color: "#c17f4a",
        title: "A végigvitel és a másik érzelmi állapota könnyen kicsúszik a képből.",
        body:
          "Nem hiba, csak ez az a két terület, ahol tudatosan kell tenned: kérj kapaszkodót a hosszabb feladatokhoz, és kérdezz rá arra, amit a másik nem mond ki magától.",
        sources: [
          { label: "Lelkiismeretesség", color: "#2c5f72", soft: "#e6f1f5" },
          { label: "Emocionalitás", color: "#5f4693", soft: "#f1ecf9" },
        ],
      },
    ],
  };

  // ── Segédek ──────────────────────────────────────────────────────────────
  function tier(v) { return v >= 70 ? "high" : v >= 40 ? "mid" : "low"; }
  function tierLabel(v) {
    return { high: "erősség", mid: "mérsékelt", low: "figyelendő" }[tier(v)];
  }
  function tierStyle(v) {
    const t = tier(v);
    if (t === "high") return "background:#e8f2f0;color:#1e3d34";
    if (t === "mid") return "background:#faf0e6;color:#8a5530";
    return "background:#f3f0eb;color:#6a6a7b";
  }
  function el(html) {
    const d = document.createElement("div");
    d.innerHTML = html.trim();
    return d.firstElementChild;
  }
  function pos(score) { return 5 + (score / 100) * 90; } // 5–95% sávban

  // ── Típus-ábra (a TypeGlyph egyszerűsített makett-változata) ─────────────
  // Nagy bronz alapforma = domináns (Extraverzió), tinta-motívum = második
  // (Nyitottság), egy sage ellensúly-pont, talajvonal.
  function glyph(size, opts) {
    const o = opts || {};
    const line = o.onDark ? "rgba(255,255,255,.82)" : "#1a1a2e";
    const sage = o.onDark ? "#8fc0b0" : "#3d6b5e";
    return `
    <svg viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="Típus-ábra: Kísérletező hajtóerő">
      <circle cx="44" cy="46" r="25" fill="#c17f4a"/>
      <path d="M62 26 q16 12 6 30" fill="none" stroke="${line}" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M69 30 l7 -3 M70 38 l8 1 M67 46 l7 5" stroke="${line}" stroke-width="1.6" stroke-linecap="round"/>
      <circle cx="28" cy="26" r="4" fill="${sage}"/>
      <path d="M14 74 q18 -7 34 0 t34 -2" fill="none" stroke="${line}" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>
    </svg>`;
  }

  // ── Hero ─────────────────────────────────────────────────────────────────
  function renderHero(target, opts) {
    const o = opts || {};
    const node = el(`
      <section class="hero">
        <div class="head">
          <div class="glyphbox">${glyph(40, { onDark: true })}</div>
          <div class="who">
            <div class="name fr">${DATA.name}</div>
            <div class="date">Felmérés: ${DATA.date}</div>
          </div>
        </div>
        <div class="typename">${DATA.type}</div>
        <p class="lede">${DATA.lede}</p>
        ${o.chips === false ? "" : `
        <div class="chips">
          <span class="chip">Extraverzió</span>
          <span class="chip">Nyitottság</span>
          <span class="chip">Becsületesség-Alázat</span>
          <span class="chip watch">Figyelendő: Emocionalitás</span>
        </div>`}
      </section>`);
    target.appendChild(node);
    return node;
  }

  // ── Spektrum-lista (az egyszerű nézet vizuális magja) ────────────────────
  // Kétpólusú skála: egyik vége sem „rosszabb". Szám alapból nincs —
  // a „Számok" kapcsoló hozza elő.
  function renderSpectrum(target, opts) {
    const o = opts || {};
    const rows = DATA.dims.map((d) => {
      // A középmezőben (45–55) egyik pólust sem emeljük ki — ott tényleg
      // „mindkettő, helyzettől függően" a válasz.
      const near = d.score >= 55 ? "high" : d.score <= 45 ? "low" : null;
      return `
      <div class="spec-row">
        <div class="spec-top">
          <span class="spec-letter" style="background:${d.soft};color:${d.strong}">${d.letter}</span>
          <span class="spec-name">${d.name}</span>
          <span class="spec-score num hide" style="color:${d.strong}">${d.score}</span>
        </div>
        <div class="spec-track">
          <span class="mid"></span>
          <span class="dot" style="left:${pos(d.score)}%;background:${d.color}"></span>
        </div>
        <div class="spec-poles">
          <span class="${near === "low" ? "near" : ""}">${d.poleLow}</span>
          <span class="${near === "high" ? "near" : ""}">${d.poleHigh}</span>
        </div>
        ${o.say === false ? "" : `<p class="spec-say">${d.say}</p>`}
      </div>`;
    }).join("");
    const node = el(`<div class="spectrum">${rows}</div>`);
    target.appendChild(node);
    return node;
  }

  // ── Radar (a jelenlegi, kibontott nézet ábrája) ──────────────────────────
  function renderRadar(size) {
    const cx = size / 2, cy = size / 2, R = size / 2 - 26;
    const n = DATA.dims.length;
    const pt = (i, r) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    let grid = "";
    [0.25, 0.5, 0.75, 1].forEach((f) => {
      const p = DATA.dims.map((_, i) => pt(i, R * f).join(",")).join(" ");
      grid += `<polygon points="${p}" fill="none" stroke="#e8e0d3" stroke-width="1"/>`;
    });
    let spokes = "", labels = "", dots = "";
    DATA.dims.forEach((d, i) => {
      const [x, y] = pt(i, R);
      spokes += `<line x1="${cx}" y1="${cy}" x2="${x}" y2="${y}" stroke="#e8e0d3" stroke-width="1"/>`;
      const [lx, ly] = pt(i, R + 15);
      labels += `<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
        font-size="12" font-weight="700" fill="${d.strong}">${d.letter}</text>`;
      const [dx, dy] = pt(i, R * (d.score / 100));
      dots += `<circle cx="${dx}" cy="${dy}" r="4" fill="${d.color}"/>`;
    });
    const shape = DATA.dims.map((d, i) => pt(i, R * (d.score / 100)).join(",")).join(" ");
    return `<svg viewBox="0 0 ${size} ${size}" width="100%" style="max-width:${size}px">
      ${grid}${spokes}
      <polygon points="${shape}" fill="rgba(61,107,94,.16)" stroke="#3d6b5e" stroke-width="2"/>
      ${dots}${labels}
    </svg>`;
  }

  // ── Profil-forma (C irány) — lágy, organikus zárt görbe ──────────────────
  function renderShape(target) {
    const size = 380, cx = size / 2, cy = size / 2, R = 124;
    const n = DATA.dims.length;
    const pt = (i, r) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return [cx + Math.cos(a) * r, cy + Math.sin(a) * r];
    };
    // Catmull-Rom → cubic bezier, zárt görbe: a „forma" szerves legyen,
    // ne mérnöki sokszög.
    const P = DATA.dims.map((d, i) => pt(i, 34 + R * (d.score / 100)));
    let path = `M ${P[0][0].toFixed(1)} ${P[0][1].toFixed(1)}`;
    for (let i = 0; i < n; i++) {
      const p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
      const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      path += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
    }
    path += " Z";

    // A címkék NEM a ponthoz, hanem egy közös külső körre kerülnek — így nem
    // csúsznak rá a formára, akármilyen alakú is.
    let nodes = "";
    const labelR = 34 + R + 18;
    DATA.dims.forEach((d, i) => {
      const [x, y] = P[i];
      const [lx, ly] = pt(i, labelR);
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      const cos = Math.cos(a);
      const anchor = cos > 0.3 ? "start" : cos < -0.3 ? "end" : "middle";
      nodes += `
      <g class="shape-node" data-dim="${d.code}">
        <circle cx="${x}" cy="${y}" r="14" fill="transparent"/>
        <circle cx="${x}" cy="${y}" r="6.5" fill="${d.color}"/>
        <circle class="ring" cx="${x}" cy="${y}" r="11" fill="none" stroke="${d.color}" stroke-width="1.5" opacity="0"/>
        <text class="shape-label" data-label="${d.code}" x="${lx}" y="${ly}"
              text-anchor="${anchor}" dominant-baseline="middle">${d.name}</text>
        <text class="shape-label num hide" x="${lx}" y="${ly + 15}" text-anchor="${anchor}"
              dominant-baseline="middle" style="fill:${d.strong};font-weight:600">${d.score}</text>
      </g>`;
    });

    const node = el(`
      <div class="shapewrap">
        <div>
          <svg viewBox="-96 -34 ${size + 192} ${size + 68}" width="100%"
               style="max-width:500px;display:block;margin:0 auto">
            <defs>
              <linearGradient id="shapefill" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#3d6b5e" stop-opacity=".26"/>
                <stop offset="55%" stop-color="#7fa89a" stop-opacity=".20"/>
                <stop offset="100%" stop-color="#c17f4a" stop-opacity=".26"/>
              </linearGradient>
            </defs>
            <circle cx="${cx}" cy="${cy}" r="${34 + R}" fill="none" stroke="#e8e0d3" stroke-dasharray="3 5"/>
            <circle cx="${cx}" cy="${cy}" r="${34 + R * 0.5}" fill="none" stroke="#f0ede6"/>
            <path d="${path}" fill="url(#shapefill)" stroke="#3d6b5e" stroke-width="2" stroke-linejoin="round"/>
            ${nodes}
          </svg>
        </div>
        <div class="readout">
          <span class="eyebrow" data-ro-eyebrow>A formád</span>
          <h3 data-ro-title>Ez a te alakod.</h3>
          <p data-ro-body>Minél messzebb nyúlik a forma egy irányba, annál jellemzőbb rád az az oldal. Nincs jó és rossz alak — a te alakod azt mutatja, mire támaszkodhatsz természetesen, és mihez kell tudatos erő.</p>
          <p class="hint">Koppints a pontokra: mit jelent az adott irány.</p>
        </div>
      </div>`);
    target.appendChild(node);

    const roE = node.querySelector("[data-ro-eyebrow]");
    const roT = node.querySelector("[data-ro-title]");
    const roB = node.querySelector("[data-ro-body]");
    node.querySelectorAll(".shape-node").forEach((g) => {
      g.addEventListener("click", () => {
        const d = DATA.dims.find((x) => x.code === g.dataset.dim);
        node.querySelectorAll(".shape-node .ring").forEach((r) => (r.style.opacity = 0));
        node.querySelectorAll(".shape-label").forEach((l) => l.classList.remove("on"));
        g.querySelector(".ring").style.opacity = 1;
        g.querySelector(".shape-label").classList.add("on");
        roE.textContent = d.name;
        roT.textContent = d.short;
        roB.textContent = d.say;
      });
    });
    return node;
  }

  // ── Kibontott (jelenlegi) nézet — a váltás demonstrálásához ──────────────
  function renderExtended(target) {
    const strip = DATA.dims.map((d) => `
      <div class="striprow">
        <div class="line">
          <span class="dt" style="background:${d.color}"></span>
          <span class="nm">${d.name}</span>
          <span class="lv" style="${tierStyle(d.score)}">${tierLabel(d.score)}</span>
          <span class="sc" style="color:${d.strong}">${d.score}</span>
        </div>
        <div class="track"><i style="width:${d.score}%;background:${d.color}"></i></div>
      </div>`).join("");

    const accRows = DATA.dims.slice(0, 3).map((d, i) => `
      <div class="row">
        <div class="rhead">
          <span class="spec-letter" style="background:${d.soft};color:${d.strong}">${d.letter}</span>
          <b>${d.name}</b>
          <span class="lv" style="${tierStyle(d.score)};font-size:10px;padding:2px 7px;border-radius:5px">${tierLabel(d.score)}</span>
          <span class="sc" style="color:${d.strong}">${d.score}</span>
        </div>
        ${i === 0 ? `
        <div class="rbody">
          <p>${d.desc}</p>
          <p style="margin-top:8px">${d.insight}</p>
          <div class="facets">
            ${d.facets.map((f) => `
              <div class="facet"><span style="width:112px">${f.label}</span>
                <span class="fb"><i style="width:${f.score}%;background:${d.color}"></i></span>
                <span style="width:20px;text-align:right">${f.score}</span></div>`).join("")}
          </div>
        </div>` : ""}
      </div>`).join("");

    const node = el(`
      <div class="stack">
        <div class="ext-tabs">
          <div class="on">Eredmények</div>
          <div>Külső kép</div>
        </div>

        <section>
          <div class="section-label"><span>Profilod egy képben</span></div>
          <div class="ext-grid">
            <div>${renderRadar(300)}</div>
            <div>
              <p style="font-size:11px;color:#6a6a7b;margin-bottom:6px">Gyors áttekintés — a 6 fő dimenzió mentén</p>
              <div class="striplist">${strip}</div>
              <p style="font-size:10.5px;color:#8a8a9a;margin-top:10px;line-height:1.5">
                A pontszámok a saját válaszaidból számolt becslések, nem abszolút mérőszámok.</p>
            </div>
          </div>
        </section>

        <section>
          <div class="section-label"><span>Dimenziók részletesen</span></div>
          <div class="acc">${accRows}
            <div class="row"><div class="rhead" style="color:#8a8a9a;font-size:12px">
              + további 3 dimenzió, 24 alskála…</div></div>
          </div>
        </section>

        <section>
          <div class="section-label"><span>További szekciók ezen a fülön</span></div>
          <div class="ext-more">
            <div class="mrow"><b>Altruizmus</b><span>kiegészítő skála</span><span class="n">1 kártya</span></div>
            <div class="mrow"><b>Hogyan dolgozom?</b><span>munkastílus, nyomás alatt</span><span class="n">4 bekezdés</span></div>
            <div class="mrow"><b>Ideális környezet</b><span>mikor működsz jól</span><span class="n">6 sor</span></div>
            <div class="mrow"><b>Szerep-illeszkedés</b><span>erős / lehet / készülj</span><span class="n">3 blokk</span></div>
            <div class="mrow"><b>Csapatszerepek</b><span>9 szerep, self + társ</span><span class="n">1 ábra</span></div>
            <div class="mrow"><b>Fejlődési fókusz</b><span>3 alskála</span><span class="n">3 kártya</span></div>
            <div class="mrow"><b>Kulcs-tanulságok</b><span>zárás</span><span class="n">4 bekezdés</span></div>
            <div class="mrow"><b>Átvezetők</b><span>Interakció · Karrier · Következő lépés</span><span class="n">3 CTA</span></div>
          </div>
        </section>
      </div>`);
    target.appendChild(node);
    return node;
  }

  // ── Nézetváltó + szám-kapcsoló ──────────────────────────────────────────
  function initViewSwitch(root) {
    const scope = root || document;
    scope.querySelectorAll("[data-switch]").forEach((seg) => {
      seg.querySelectorAll("button").forEach((btn) => {
        btn.addEventListener("click", () => {
          const view = btn.dataset.view;
          const host = btn.closest("[data-app]") || document;
          host.querySelectorAll("[data-switch] button").forEach((b) =>
            b.classList.toggle("on", b.dataset.view === view));
          // FONTOS: csak a vászon-panelek, a szegmens-gombok is `data-view`-t
          // hordoznak — szűkítés nélkül a váltó elrejtené önmagát.
          host.querySelectorAll(".canvas[data-view]").forEach((v) => {
            v.style.display = v.dataset.view === view ? "" : "none";
          });
          // Váltás után a nézet tetejére: a mobil-keretben a keret görgethető
          // rétege, egyébként a lap.
          const screen = btn.closest(".screen");
          if (screen) screen.scrollTo({ top: 0, behavior: "smooth" });
          else {
            const top = host.getBoundingClientRect().top + window.scrollY - 16;
            window.scrollTo({ top, behavior: "smooth" });
          }
        });
      });
    });
    scope.querySelectorAll("[data-numbers]").forEach((tg) => {
      tg.addEventListener("click", () => {
        tg.classList.toggle("on");
        const host = tg.closest("[data-app]") || document;
        const on = tg.classList.contains("on");
        host.querySelectorAll(".num").forEach((n) => n.classList.toggle("hide", !on));
      });
    });
  }

  // ── Mobil-keretek: a desktop makett klónja keskeny renderben ────────────
  function mountDevices() {
    document.querySelectorAll("[data-device-of]").forEach((screen) => {
      const src = document.querySelector(screen.dataset.deviceOf);
      if (!src) return;
      const clone = src.cloneNode(true);
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((n) => n.removeAttribute("id"));
      clone.classList.add("narrow");
      screen.appendChild(clone);
      initViewSwitch(clone);
      // A klónban a szám-kapcsoló és a forma-interakció újraköttetik:
      clone.querySelectorAll(".shape-node").forEach((g) => {
        g.addEventListener("click", () => {
          const d = DATA.dims.find((x) => x.code === g.dataset.dim);
          const wrap = g.closest(".shapewrap");
          wrap.querySelectorAll(".shape-node .ring").forEach((r) => (r.style.opacity = 0));
          wrap.querySelectorAll(".shape-label").forEach((l) => l.classList.remove("on"));
          g.querySelector(".ring").style.opacity = 1;
          g.querySelector(".shape-label").classList.add("on");
          wrap.querySelector("[data-ro-eyebrow]").textContent = d.name;
          wrap.querySelector("[data-ro-title]").textContent = d.short;
          wrap.querySelector("[data-ro-body]").textContent = d.say;
        });
      });
    });
  }

  global.TR = {
    DATA, tier, tierLabel, tierStyle, glyph, pos,
    renderHero, renderSpectrum, renderRadar, renderShape, renderExtended,
    initViewSwitch, mountDevices,
  };
})(window);
