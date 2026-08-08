// src/lib/pattern-data.ts
// Single source of truth for the 16 team operating patterns.
// Used by: PatternExplorer (public /patterns page) + team-pattern engine.

export interface AxisMeta {
  key: string;
  name: string;
  low: string;
  high: string;
  lowDetail: string;
  highDetail: string;
  midDetail: string;
}

// Axis order: [0]=drive, [1]=cohesion, [2]=discipline, [3]=openness
// Binary pattern key: "1"=high, "0"=low for each axis in this order.
export const AXIS_META: AxisMeta[] = [
  {
    key: "drive",
    name: "Hajtóerő",
    low: "Visszafogott",
    high: "Energikus",
    lowDetail:
      "Csendes energia, mélymunka, visszafogott társas jelenlét. A csapat inkább gondolkodik, mint beszél.",
    highDetail:
      "Magas társas aktivitás, gyors kommunikáció, látható jelenlét. A csapat hajtja az eseményeket.",
    midDetail:
      "Változó energiaszint — a csapat néha aktívan hajt, néha visszahúzódik. A kontextus határozza meg.",
  },
  {
    key: "cohesion",
    name: "Kohézió",
    low: "Versengő",
    high: "Összetartó",
    lowDetail:
      "Egyéni motiváció, belső verseny, taktikus hozzáállás. A tagok saját eredményüket maximalizálják.",
    highDetail:
      "Erős összetartás, kölcsönös támogatás, erős igazságérzet. A csapat egységben gondolkodik.",
    midDetail:
      "Vegyes dinamika — van együttműködés és van egyéni verseny is. A helyzettől függ, melyik dominál.",
  },
  {
    key: "discipline",
    name: "Fegyelem",
    low: "Rugalmas",
    high: "Strukturált",
    lowDetail:
      "Adaptív, improvizáló, kevés formális folyamat. A csapat szituációfüggően dönt.",
    highDetail:
      "Tervezett, dokumentált, szervezett. A csapat előre meghatározott keretek között dolgozik.",
    midDetail:
      "Részben szervezett, részben improvizáló. Vannak keretek, de nem mindenre — a csapat pragmatikusan vegyíti.",
  },
  {
    key: "openness",
    name: "Nyitottság",
    low: "Pragmatikus",
    high: "Felfedező",
    lowDetail:
      "Bevált módszerek, gyakorlatiasság, kockázatkerülés. A csapat azt csinálja, ami működik.",
    highDetail:
      "Kíváncsi, kísérletező, nyitott az ismeretlenre. A csapat szeret új utakat járni.",
    midDetail:
      "Szelektíven nyitott — bizonyos területeken kísérletezik, máshol ragaszkodik a bevált megoldásokhoz.",
  },
];

export interface PatternContent {
  name: string;       // Public name (dashboard, reports)
  alias: string;      // Internal nickname (workshop, marketing)
  description: string;
  strengths: string[];
  risks: string[];
  people: string;     // "Kik érzik itt jól magukat?"
  contexts: string;   // "Hol jelenik meg ez a működés?"
  /**
   * A mintázat saját akcent-színe — `light-dark(világos, sötét)` párként.
   *
   * MIÉRT NEM design-token: ez ADAT, nem szerep. 15 mintázatnak 15 hue-ja
   * van; ha mindegyik tokenpárt kapna, a globals.css 30 sorral nőne olyan
   * értékekkel, amiket egyetlen marketing-lap használ.
   *
   * MIÉRT `light-dark()` és nem CSS-változó: az érték a DOM-ba inline
   * stílusként kerül, a `light-dark()` pedig a `color-scheme`-ből dolgozik
   * — azt a `.theme-scope` már beállítja (globals.css). Így a színséma-
   * váltás komponens-módosítás nélkül működik.
   *
   * A sötét párokat kontrasztra hangoltuk: mindegyik ≥ 4,6:1 a sötét
   * paper-lapon (--color-paper-elevated), a hue és a telítettség marad.
   */
  color: string;
}

// Keys are 4-bit binary strings: [drive][cohesion][discipline][openness]
// "1" = high axis, "0" = low axis
export const PATTERNS: Record<string, PatternContent> = {
  "1111": {
    name: "Innovációs Motor",
    alias: "Innovátor Gépezet",
    description:
      "Gyorsan mozgó, jól szervezett csapat, amely szeret új utakat keresni és közben egymásra számít.",
    strengths: ["Gyors ötlet→megvalósítás", "Erős belső kohézió", "Nyitott a változásra", "Magas energia"],
    risks: ["Kiégés veszélye", "Fókusz-szétszóródás", "Groupthink", "Túl merev folyamatok"],
    people: "Innovatív, társas, szervezett emberek, akik szeretnek csapatban alkotni.",
    contexts: "Termékfejlesztés, innovációs labor, design thinking csapatok, startup alapcsapat",
    color: "var(--color-bronze)",
  },
  "1110": {
    name: "Összehangolt Végrehajtó Csapat",
    alias: "Végrehajtó Egység",
    description:
      "Fegyelmezett, összetartó csapat, amely a bevált módszereket hatékonyan alkalmazza.",
    strengths: ["Kiváló végrehajtás", "Erős csapatszellem", "Jól működő rutinok", "Megbízható teljesítmény"],
    risks: ["Innovációs deficit", "Változás-ellenállás", "Elfojtott feszültségek", "Lassú adaptáció"],
    people: "Megbízható, lojális, feladatorientált emberek, akik szeretik a tiszta struktúrát.",
    contexts: "Üzemeltetés, ügyfélkiszolgálás, projektmenedzsment, compliance csapatok",
    color: "light-dark(#b5651d, #cc7221)",
  },
  "1101": {
    name: "Szabadon Alkotó Közösség",
    alias: "Kreatív Kommuna",
    description:
      "Szabadon áramló, innovatív csapat, amelyben erős az összetartás, és szeretik a kísérletezést.",
    strengths: ["Rendkívüli kreativitás", "Erős bizalom", "Gyors alkalmazkodás", "Vonzó kultúra"],
    risks: ["Kaotikus végrehajtás", "Priorizálási nehézség", "Határidő-lazaság", "Nehéz visszajelzés"],
    people: "Kreatív, empatikus, nyitott emberek, akik a közösséget és a szabadságot keresik.",
    contexts: "Design, márkastratégia, tartalomkészítés, UX-kutatás, kreatív ügynökségek",
    color: "light-dark(#d4763a, #d4763a)",
  },
  "1100": {
    name: "Lojális Magcsapat",
    alias: "Családi Vállalkozás",
    description:
      "Aktív, lojális csapat, amely a bevált utakon halad, de rugalmasan alkalmazkodik.",
    strengths: ["Erős lojalitás", "Pragmatikus döntések", "Rugalmas helyzetkezelés", "Alacsony fluktuáció"],
    risks: ["Nehéz változtatni", "Rövidtávú gondolkodás", "Zárt közösség", "Tervezetlenség"],
    people: "Lojális, gyakorlatias, kapcsolatorientált emberek.",
    contexts: "Sales, ügyfélmenedzsment, családi cégek, helyi szolgáltatók",
    color: "light-dark(#c9915e, #c9915e)",
  },
  "1011": {
    name: "Teljesítményhajtott Innovátorok",
    alias: "Versenygép",
    description:
      "Magas intenzitású, teljesítményorientált csapat, szervezett keretek között versenyez és innovál.",
    strengths: ["Kiemelkedő egyéni teljesítmény", "Erős belső motiváció", "Hatékony innováció", "Gyors piaci reakció"],
    risks: ["Együttműködés hiánya", "Magas stressz", "Nyertes–vesztes dinamika", "Egyéni > csapatcél"],
    people: "Ambiciózus, versenyző, innovatív egyéniségek, akik keretet is szeretnek.",
    contexts: "Fintech, stratégiai tanácsadás, versenysport-háttér csapatok",
    color: "light-dark(#8b3a2a, #cd6e5b)",
  },
  "1010": {
    name: "Fegyelmezett Operatív Csapat",
    alias: "Hadsereg",
    description:
      "Fegyelmezett, eredményorientált csapat, erős hierarchiával és gyors végrehajtással.",
    strengths: ["Kiváló sebesség", "Egyértelmű felelősségek", "Nincs kétértelműség", "Magas output"],
    risks: ["Alacsony pszichológiai biztonság", "Elfojtott ötletek", "Rövid távú fókusz", "Magas fluktuáció"],
    people: "Fegyelmezett, célratörő, nyomásálló emberek.",
    contexts: "Turnaround, válságkezelés, logisztika, operatív vezetés",
    color: "light-dark(#6b4226, #be7848)",
  },
  "1001": {
    name: "Nagy Energiájú Kreatív Minta",
    alias: "Kreatív Káosz",
    description:
      "Szikrázó, impulzív csapat, ahol mindenki a saját ötletét hajtja, de a kollektív energia előre visz.",
    strengths: ["Extrém kreativitás és energia", "Bátor ötletek", "Gyors adaptáció", "Vonzó kreatív tehetségeknek"],
    risks: ["Lehetetlen priorizálni", "Kaotikus végrehajtás", "Egyéni ambíciók dominálnak", "Döntések nem tartanak"],
    people: "Energikus, versenyző, kreatív nonkonformisták.",
    contexts: "Hackathon, startup ötletfázis, reklámügynökségek, produkció",
    color: "light-dark(#a63d1f, #dc6644)",
  },
  "1000": {
    name: "Autonóm Operatív Háló",
    alias: "Farkasfalka",
    description:
      "Erős egyéniségek laza szövetségben, akik a saját területükön építenek.",
    strengths: ["Rendkívül agilis", "Erős egyéni felelősségvállalás", "Önszerveződés", "Bizonytalanság-tűrés"],
    risks: ["Gyenge csapatidentitás", "Nulla tudásmegosztás", "Alacsony lojalitás", "Nehéz onboarding"],
    people: "Önálló, pragmatikus, versenyző típusok.",
    contexts: "Ingatlan, biztosítás, freelancer-hálózatok, üzletfejlesztés",
    color: "light-dark(#7a4b2e, #bd794f)",
  },
  "0111": {
    name: "Felfedező Labor",
    alias: "Kutatólabor",
    description:
      "Csendes, mélyen gondolkodó csapat, szisztematikusan fedez fel új területeket.",
    strengths: ["Mély, alapos munka", "Erős belső bizalom", "Szisztematikus innováció", "Alacsony hibaarány"],
    risks: ["Lassú döntéshozatal", "Kifelé láthatatlan", "Konfrontáció-kerülés", "Passzivitás látszata"],
    people: "Introvertált, kíváncsi, alapos, együttműködő kutatói típusok.",
    contexts: "R&D, akadémia, adatelemzés, minőségbiztosítás, farmakológia",
    color: "light-dark(#3d6b5e, #559482)", // sage — a korábbi közeli-de-más zöld a brand-zsályába olvadt
  },
  "0110": {
    name: "Stabil Magcsapat",
    alias: "Csendes Erőd",
    description:
      "Megbízható, csendes csapat, stabilan, kiszámíthatóan teljesít.",
    strengths: ["Rendkívüli megbízhatóság", "Erős lojalitás", "Alacsony dráma", "Rutinban kiváló"],
    risks: ["Változás-ellenállás", "Láthatatlanság", "Zárt közösség", "Innováció hiánya"],
    people: "Csendes, megbízható, lojális, strukturált gondolkodású emberek.",
    contexts: "Könyvelés, IT üzemeltetés, back-office, közigazgatás",
    color: "light-dark(#4a7c5e, #599571)",
  },
  "0101": {
    name: "Alkotó Közeg",
    alias: "Művésztelep",
    description:
      "Introvertált, kreatív közösség, mély bizalomban és szabadságban alkot.",
    strengths: ["Magas pszichológiai biztonság", "Mély, eredeti gondolkodás", "Erős belső kultúra", "Tartós elköteleződés"],
    risks: ["Külvilággal nehéz kommunikáció", "Lassú végrehajtás", "Harmónia > eredmény", "Külső nyomás kezelése"],
    people: "Introvertált kreativitás, mély gondolkodók, értékvezérelt alkotók.",
    contexts: "UX-kutatás, stratégiai tervezés, tartalomkészítés, indie játékfejlesztés",
    color: "light-dark(#3a8066, #45997a)",
  },
  "0100": {
    name: "Támogató Közeg",
    alias: "Támogató Kör",
    description:
      "Csendes, gondoskodó csapat, egymásra figyel és praktikus megoldásokat keres.",
    strengths: ["Kiváló belső támogatás", "Pragmatikus gondolkodás", "Alacsony konfliktus", "Jó alkalmazkodás"],
    risks: ["Alacsony ambíció", "Nehéz döntések kerülése", "Láthatatlanság", "Konzervativizmus"],
    people: "Empatikus, gyakorlatias, támogató csapatjátékosok.",
    contexts: "HR, szociális munka, ügyfélszolgálat, egészségügy, mentoring",
    color: "light-dark(#6b9b7d, #6b9b7d)",
  },
  "0011": {
    name: "Stratégiai Szakértői Csapat",
    alias: "Sakktábla",
    description:
      "Analitikus, stratégiai gondolkodók, csendben, de intenzíven a sajátjukat építik.",
    strengths: ["Rendkívüli szakmai mélység", "Stratégiai gondolkodás", "Adatvezérelt döntések", "Szakterületi innováció"],
    risks: ["Silók", "Rejtett rivalizálás", "Nehéz közös döntés", "Kívülről hideg"],
    people: "Analitikus, versenyszellemű, mély szakértők.",
    contexts: "Data science, jog, pénzügyi elemzés, mérnöki tervezés, stratégia",
    color: "light-dark(#3d4f6b, #748bb0)",
  },
  "0010": {
    name: "Precíz Szakmai Műhely",
    alias: "Mérnöki Műhely",
    description:
      "Precíz, feladatorientált csapat, mindenki a saját területén a legjobb.",
    strengths: ["Kiváló technikai kompetencia", "Hatékonyság", "Egyértelmű felelősségek", "Megbízható output"],
    risks: ["Alacsony érzelmi kapcsolódás", "Kiégés veszélye", "Újítás nehezen kap teret", "Inkább egyéni hozzájárulók"],
    people: "Precíz, önálló, technikai beállítottságú szakemberek.",
    contexts: "Szoftverfejlesztés, audit, pénzügy, DevOps, mérnöki irodák",
    color: "light-dark(#556b8a, #748baa)",
  },
  "0001": {
    name: "Autonóm Felfedezők",
    alias: "Szabad Elektronok",
    description:
      "Független, kreatív egyéniségek laza hálózatban, kíváncsiság és intellektuális izgalom köti össze.",
    strengths: ["Rendkívüli egyéni kreativitás", "Mély gondolkodás", "Bizonytalanság-tűrés", "Vonzó autonóm tehetségeknek"],
    risks: ["Nincs csapatidentitás", "Minimális koordináció", "Izoláció", "Nehéz közös irány"],
    people: "Autonóm, kíváncsi, nonkonformista gondolkodók.",
    contexts: "Kutatás, korai innováció, művészet, filozófia, indie fejlesztés",
    color: "light-dark(#4a6b7a, #6790a3)",
  },
  "0000": {
    name: "Erősen Független Egyéni Minta",
    alias: "Szabadúszók",
    description:
      "Független, gyakorlatias egyéniségek; az elköteleződés inkább a feladathoz, mint a csapathoz kötődik. Tranzakciós logika.",
    strengths: ["Erős egyéni teljesítmény", "Pragmatikus döntések", "Kevés vezetői ráfordítást igényelnek", "Nyomásállóság"],
    risks: ["Csapat nem létezik", "Nulla tudásmegosztás", "Alacsony lojalitás", "Visszajelzésre nem reagálnak"],
    people: "Önálló, pragmatikus, tranzakció-orientált egyének.",
    contexts: "Freelancer poolok, értékesítési hálózatok, befektetési csapatok",
    color: "light-dark(#6b6b6b, #898989)",
  },
};

// ── Helper functions ──────────────────────────────────────

/** Values are 0–1. Returns the binary pattern code closest to the given axis values. */
export function getClosestPattern(values: number[]): { code: string; distance: number } {
  let bestCode = "";
  let bestDist = Infinity;
  for (const code of Object.keys(PATTERNS)) {
    const bits = code.split("").map(Number);
    let dist = 0;
    for (let i = 0; i < 4; i++) {
      const target = bits[i] === 1 ? 0.85 : 0.15;
      dist += (values[i] - target) ** 2;
    }
    dist = Math.sqrt(dist);
    if (dist < bestDist) {
      bestDist = dist;
      bestCode = code;
    }
  }
  return { code: bestCode, distance: bestDist };
}

/** Returns the second-closest pattern (excluding bestCode). */
export function getSecondClosest(
  values: number[],
  bestCode: string
): { code: string; distance: number } {
  let secondCode = "";
  let secondDist = Infinity;
  for (const code of Object.keys(PATTERNS)) {
    if (code === bestCode) continue;
    const bits = code.split("").map(Number);
    let dist = 0;
    for (let i = 0; i < 4; i++) {
      const target = bits[i] === 1 ? 0.85 : 0.15;
      dist += (values[i] - target) ** 2;
    }
    dist = Math.sqrt(dist);
    if (dist < secondDist) {
      secondDist = dist;
      secondCode = code;
    }
  }
  return { code: secondCode, distance: secondDist };
}

/** Returns a match quality label + colors based on distance. */
export function getMatchLabel(distance: number): {
  label: string;
  color: string;
  bg: string;
} {
  // Verdict-trió az értékelő rampon: a sage-közeli zöld a zsálya-családba
  // olvadt, a neutrális fok a meleg muted.
  //
  // CSS-VÁLTOZÓ, nem az EVAL_RAMP literálja: ez az érték kizárólag a DOM-ba
  // megy (inline style a mintázat-lapon), tehát követnie kell a színsémát —
  // a literál bronz (#8a5530) sötét lapon 2,4:1-et adott. A fix médiumok
  // (PDF/OG) továbbra is az EVAL_RAMP literáljából dolgoznak.
  if (distance < 0.25)
    return { label: "Jól kirajzolódó minta", color: "var(--color-eval-high-fg)", bg: "rgba(61,107,94,0.08)" };
  if (distance < 0.45)
    return { label: "Vegyes mintázat", color: "var(--color-eval-mid-fg)", bg: "rgba(193,127,74,0.08)" };
  return { label: "Átmeneti működés", color: "var(--color-eval-low-fg)", bg: "rgba(110,110,128,0.08)" };
}

/** A value (0–1) is "balanced" when it falls in the 35–65% zone. */
export function isBalanced(v: number): boolean {
  return v > 0.35 && v < 0.65;
}
