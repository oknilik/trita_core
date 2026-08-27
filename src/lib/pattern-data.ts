// src/lib/pattern-data.ts
// Single source of truth for the 16 team operating patterns.
// Used by: PatternExplorer (public /patterns page) + team-pattern engine.

/**
 * Módszertani státusz — a 16 név nem validált tipológia. A mögöttes négy
 * csapattengely és küszöb csapat-szinten kalibrálandó; 15–20 pilotcsapat nem
 * ad elég megfigyelést 16 kategória validálásához. A minta ezért csak
 * értelmezési nyelv, míg a Scan ígérete a közvetlenül mért rétegekre épül.
 */
export const TEAM_PATTERN_EVIDENCE_STATUS = {
  status: "interpretive_language",
  validatedTypology: false,
  calibrationUnit: "team",
  framing: {
    hu: "A 16 minta értelmezési nyelv, nem validált csapattipológia. A címke az önértékelésen alapuló csapattengelyeket foglalja össze; a bizalmi háló és a pszichológiai biztonság ettől külön, közvetlenül mért adatforrás.",
    en: "The 16 patterns are an interpretive language, not a validated team typology. The label summarizes self-assessment-based team axes; the measured trust network and psychological safety are separate evidence.",
  },
} as const;

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
      "Visszafogott társas jelenlét és elmélyült munka jellemzi. A csapat inkább átgondolja a kérdéseket, mintsem azonnal megbeszéli őket.",
    highDetail:
      "A csapatot élénk társas jelenlét, gyors kommunikáció és látható aktivitás jellemzi. Gyakran maga kezdeményezi és gyorsítja az eseményeket.",
    midDetail:
      "Változó energiaszint – a csapat néha aktívan kezdeményez, máskor visszahúzódik. A helyzet határozza meg, melyik oldal kerül előtérbe.",
  },
  {
    key: "cohesion",
    name: "Kohézió",
    low: "Versengő",
    high: "Összetartó",
    lowDetail:
      "Egyéni motiváció, belső verseny és érdekvezérelt megközelítés jellemzi. A tagok elsősorban a saját eredményeikre összpontosíthatnak.",
    highDetail:
      "Erős összetartás, kölcsönös támogatás és a méltányosságra való törekvés jellemzi. A csapat egységben gondolkodik.",
    midDetail:
      "Vegyes dinamika – az együttműködés és az egyéni verseny egyaránt jelen van. A helyzettől függ, melyik kerül előtérbe.",
  },
  {
    key: "discipline",
    name: "Fegyelem",
    low: "Rugalmas",
    high: "Strukturált",
    lowDetail:
      "Rugalmas, improvizáló működés, kevés formális folyamattal. A csapat a helyzethez igazítja a döntéseit.",
    highDetail:
      "Tervezett, dokumentált, szervezett. A csapat előre meghatározott keretek között dolgozik.",
    midDetail:
      "Részben szervezett, részben improvizáló működés. Vannak keretek, de nem mindenre – a csapat gyakorlatiasan ötvözi a két megközelítést.",
  },
  {
    key: "openness",
    name: "Nyitottság",
    low: "Pragmatikus",
    high: "Felfedező",
    lowDetail:
      "A csapatot a bevált módszerek előnyben részesítése, a gyakorlatiasság és a kockázatkerülés jellemzi. Elsősorban a már bevált megoldásokra épít.",
    highDetail:
      "Kíváncsi, kísérletező, nyitott az ismeretlenre. A csapat szeret új utakat járni.",
    midDetail:
      "Szelektíven nyitott – bizonyos területeken kísérletezik, máshol ragaszkodik a bevált megoldásokhoz.",
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
    strengths: ["Az ötletek gyors megvalósítása", "Erős belső kohézió", "Nyitottság a változásra", "Nagy lendület"],
    risks: ["A kimerülés veszélye", "Széttartó figyelem", "Csoportgondolkodás", "Túl merev folyamatok"],
    people: "Újító, társas és szervezett emberek, akik szeretnek csapatban alkotni.",
    contexts: "Termékfejlesztés, innovációs műhely, tervezői gondolkodásra épülő csapatok, induló vállalkozások alapcsapata",
    color: "var(--color-bronze)",
  },
  "1110": {
    name: "Összehangolt Végrehajtó Csapat",
    alias: "Végrehajtó Egység",
    description:
      "Fegyelmezett, összetartó csapat, amely a bevált módszereket hatékonyan alkalmazza.",
    strengths: ["Megbízható végrehajtás", "Erős csapatszellem", "Jól működő rutinok", "Megbízható teljesítmény"],
    risks: ["Kevés új megközelítés", "Ellenállás a változással szemben", "Elfojtott feszültségek", "Lassú alkalmazkodás"],
    people: "Megbízható, lojális, feladatközpontú emberek, akik szeretik a világos kereteket.",
    contexts: "Üzemeltetés, ügyfélkiszolgálás, projektmenedzsment, megfelelőségi csapatok",
    color: "light-dark(#b5651d, #cc7221)",
  },
  "1101": {
    name: "Szabadon Alkotó Közösség",
    alias: "Kreatív Kommuna",
    description:
      "Kötetlenül működő, újító csapat, amelyben erős az összetartás, és a tagok szívesen kísérleteznek.",
    strengths: ["Erős kreatív energia", "Erős bizalom", "Gyors alkalmazkodás", "Vonzó kultúra"],
    risks: ["Kaotikus végrehajtás", "Nehéz fontossági sorrendet kialakítani", "Lazán kezelt határidők", "A nehéz visszajelzések elmaradhatnak"],
    // A kohézió-tengely a Barátságosság + Becsületesség-Alázat átlaga — ezek
    // a skálák toleranciát és megbocsátást mérnek, nem empátiát (2026-08-11).
    people: "Kreatív, elfogadó, nyitott emberek, akik a közösséget és a szabadságot keresik.",
    contexts: "Tervezés, márkastratégia, tartalomkészítés, UX-kutatás, kreatív ügynökségek",
    color: "light-dark(#d4763a, #d4763a)",
  },
  "1100": {
    name: "Lojális Magcsapat",
    alias: "Családi Vállalkozás",
    description:
      "Aktív, lojális csapat, amely a bevált utakon halad, de rugalmasan alkalmazkodik.",
    strengths: ["Erős lojalitás", "Gyakorlatias döntések", "Rugalmas helyzetkezelés", "Stabil kapcsolati háló"],
    risks: ["Nehéz lehet változtatni", "Rövid távú gondolkodás", "Zárt közösség", "Tervezetlenség"],
    people: "Lojális, gyakorlatias, kapcsolatorientált emberek.",
    contexts: "Értékesítés, ügyfélmenedzsment, családi cégek, helyi szolgáltatók",
    color: "light-dark(#c9915e, #c9915e)",
  },
  "1011": {
    name: "Teljesítményhajtott Innovátorok",
    alias: "Versenygép",
    description:
      "Nagy intenzitású, teljesítményközpontú csapat, amely szervezett keretek között versenyez és újít.",
    strengths: ["Erős egyéni teljesítmény", "Erős belső motiváció", "Az újítások gyors megvalósítása", "Gyors reagálás a piaci változásokra"],
    risks: ["Az együttműködés háttérbe szorulhat", "Nagy terhelés", "Nyertes–vesztes dinamika", "Az egyéni célok megelőzhetik a csapatcélokat"],
    people: "Ambiciózus, versengő, újító egyéniségek, akik a világos kereteket is értékelik.",
    contexts: "Pénzügyi technológia, stratégiai tanácsadás, versenysportot támogató csapatok",
    color: "light-dark(#8b3a2a, #cd6e5b)",
  },
  "1010": {
    name: "Fegyelmezett Operatív Csapat",
    alias: "Hadsereg",
    description:
      "Fegyelmezett, eredményorientált csapat, erős hierarchiával és gyors végrehajtással.",
    strengths: ["Gyors végrehajtás", "Egyértelmű felelősségek", "Világos elvárások", "Nagy teljesítmény"],
    risks: ["Kevés tér az őszinte megszólalásra", "Elfojtott ötletek", "Rövid távú szemlélet", "Nagy fluktuáció"],
    people: "Fegyelmezett, célratörő emberek, akik otthonosan mozognak a gyors végrehajtást kívánó helyzetekben.",
    contexts: "Szervezeti helyreállítás, válságkezelés, logisztika, operatív vezetés",
    color: "light-dark(#6b4226, #be7848)",
  },
  "1001": {
    name: "Nagy Energiájú Kreatív Minta",
    alias: "Kreatív Káosz",
    description:
      "Lendületes, ösztönösen reagáló csapat, amelyben mindenki a saját ötletét hajtja, a közös energia mégis előreviszi a munkát.",
    strengths: ["Nagy kreatív energia", "Bátor ötletek", "Gyors alkalmazkodás", "Vonzó lehet a kreatív tehetségek számára"],
    risks: ["Nehéz fontossági sorrendet kialakítani", "Kaotikus végrehajtás", "Az egyéni ambíciók előtérbe kerülhetnek", "A döntések gyakran változhatnak"],
    people: "Energikus, versengő, szokatlan megoldásokat kereső emberek.",
    contexts: "Ötletversenyek, induló vállalkozások korai szakasza, reklámügynökségek, produkció",
    color: "light-dark(#a63d1f, #dc6644)",
  },
  "1000": {
    name: "Autonóm Operatív Háló",
    alias: "Farkasfalka",
    description:
      "Erős egyéniségek laza szövetségben, akik a saját területükön építenek.",
    strengths: ["Gyors alkalmazkodás", "Erős egyéni felelősségvállalás", "Önszerveződés", "A bizonytalanság rugalmas kezelése"],
    risks: ["Gyenge csapatidentitás", "Kevés tudásmegosztás", "Alacsony lojalitás", "Nehéz az új tagok beillesztése"],
    people: "Önálló, gyakorlatias, versengő emberek.",
    contexts: "Ingatlan, biztosítás, szabadúszó-hálózatok, üzletfejlesztés",
    color: "light-dark(#7a4b2e, #bd794f)",
  },
  "0111": {
    name: "Felfedező Labor",
    alias: "Kutatólabor",
    description:
      "Csendes, elmélyülten gondolkodó csapat, amely módszeresen fedez fel új területeket.",
    strengths: ["Mély, alapos munka", "Erős belső bizalom", "Módszeres újítás", "Alapos minőségellenőrzés"],
    risks: ["Lassú döntéshozatal", "A munka kívülről nehezen látható", "A konfrontáció kerülése", "Kívülről passzívnak tűnhet"],
    people: "Visszafogottabb, kíváncsi, alapos és együttműködő emberek.",
    contexts: "K+F, tudományos munka, adatelemzés, minőségbiztosítás, farmakológia",
    color: "light-dark(#3d6b5e, #559482)", // sage — a korábbi közeli-de-más zöld a brand-zsályába olvadt
  },
  "0110": {
    name: "Stabil Magcsapat",
    alias: "Csendes Erőd",
    description:
      "Megbízható, csendes csapat, amely stabilan és kiszámíthatóan teljesít.",
    strengths: ["Nagy megbízhatóság", "Erős lojalitás", "Kevés nyílt feszültség", "Megbízható a rutinfeladatokban"],
    risks: ["Ellenállás a változással szemben", "Láthatatlanság", "Zárt közösség", "Kevés újítás"],
    people: "Csendes, megbízható, lojális és rendezetten gondolkodó emberek.",
    contexts: "Könyvelés, IT-üzemeltetés, háttérirodai feladatok, közigazgatás",
    color: "light-dark(#4a7c5e, #599571)",
  },
  "0101": {
    name: "Alkotó Közeg",
    alias: "Művésztelep",
    description:
      "Visszafogott, kreatív közösség, amely nagyfokú bizalommal és szabadságban alkot.",
    strengths: ["Bizalmi együttműködés", "Mély, eredeti gondolkodás", "Erős belső kultúra", "Tartós elköteleződés"],
    risks: ["Nehéz kommunikáció a külső partnerekkel", "Lassú végrehajtás", "Az eredmény háttérbe szorulhat a harmónia mögött", "Nehéz lehet kezelni a külső nyomást"],
    people: "Csendesebb, elmélyült gondolkodású, értékvezérelt alkotók.",
    contexts: "UX-kutatás, stratégiai tervezés, tartalomkészítés, független játékfejlesztés",
    color: "light-dark(#3a8066, #45997a)",
  },
  "0100": {
    name: "Támogató Közeg",
    alias: "Támogató Kör",
    description:
      "Csendes, gondoskodó csapat, amely egymásra figyel, és gyakorlatias megoldásokat keres.",
    strengths: ["Erős belső támogatás", "Gyakorlatias gondolkodás", "Kevés nyílt konfliktus", "Jó alkalmazkodás"],
    risks: ["A nagyobb célok háttérbe szorulhatnak", "A nehéz döntések kerülése", "Láthatatlanság", "Ragaszkodás a megszokotthoz"],
    // Ld. fent: a kohézió-tengely nem empátia-mérés — türelem és tolerancia.
    people: "Türelmes, gyakorlatias, támogató csapatjátékosok.",
    contexts: "HR, szociális munka, ügyfélszolgálat, egészségügy, mentorálás",
    color: "light-dark(#6b9b7d, #6b9b7d)",
  },
  "0011": {
    name: "Stratégiai Szakértői Csapat",
    alias: "Sakktábla",
    description:
      "Elemző, stratégiai gondolkodású csapat, amelyben mindenki csendben, de intenzíven építi a saját szakterületét.",
    strengths: ["Nagy szakmai mélység", "Stratégiai gondolkodás", "Adatokra épülő döntések", "Szakterületi újítás"],
    risks: ["Elszigetelt szakterületek", "Rejtett rivalizálás", "Nehéz közös döntést hozni", "Kívülről távolságtartónak tűnhet"],
    people: "Elemző szemléletű, versenyszellemű, elmélyült szakértők.",
    contexts: "Adattudomány, jog, pénzügyi elemzés, mérnöki tervezés, stratégia",
    color: "light-dark(#3d4f6b, #748bb0)",
  },
  "0010": {
    name: "Precíz Szakmai Műhely",
    alias: "Mérnöki Műhely",
    description:
      "Precíz, feladatközpontú csapat, amelyben mindenki a saját szakterületére összpontosít.",
    strengths: ["Erős műszaki és szakmai felkészültség", "Hatékonyság", "Egyértelmű felelősségek", "Megbízható eredmények"],
    risks: ["Kevés érzelmi kapcsolódás", "A kimerülés veszélye", "Az újítás nehezen kap teret", "A tagok inkább egyénileg járulnak hozzá"],
    people: "Precíz, önálló, műszaki beállítottságú szakemberek.",
    contexts: "Szoftverfejlesztés, audit, pénzügy, DevOps, mérnöki irodák",
    color: "light-dark(#556b8a, #748baa)",
  },
  "0001": {
    name: "Autonóm Felfedezők",
    alias: "Szabad Elektronok",
    description:
      "Független, kreatív egyéniségek laza hálózata, amelyet a kíváncsiság és az intellektuális izgalom köt össze.",
    strengths: ["Erős egyéni kreativitás", "Mély gondolkodás", "A bizonytalanság rugalmas kezelése", "Vonzó lehet az önállóságot keresők számára"],
    risks: ["Gyenge csapatidentitás", "Kevés összehangolás", "Elszigetelődés", "Nehéz közös irányt találni"],
    people: "Önálló, kíváncsi, a megszokott megoldásokat megkérdőjelező gondolkodók.",
    contexts: "Kutatás, korai újítás, művészet, filozófia, független fejlesztés",
    color: "light-dark(#4a6b7a, #6790a3)",
  },
  "0000": {
    name: "Erősen Független Egyéni Minta",
    alias: "Szabadúszók",
    description:
      "Független, gyakorlatias egyéniségek; az elköteleződésük inkább a feladathoz, mint a csapathoz kötődik. A kapcsolódásukat elsősorban az elvégzendő munka határozza meg.",
    strengths: ["Erős egyéni teljesítmény", "Gyakorlatias döntések", "Önálló működés kevés vezetői támogatással", "Nagy egyéni mozgástér"],
    risks: ["A csapatidentitás gyenge lehet", "Kevés tudásmegosztás", "Az elköteleződés inkább a feladathoz kötődik", "A visszajelzések nehezen épülhetnek be"],
    people: "Önálló, gyakorlatias, feladatközpontú emberek.",
    contexts: "Szabadúszó-hálózatok, értékesítési hálózatok, befektetési csapatok",
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
    return { label: "Jól kirajzolódó minta", color: "var(--color-eval-high-fg)", bg: "var(--color-eval-high-bg)" };
  if (distance < 0.45)
    return { label: "Vegyes mintázat", color: "var(--color-eval-mid-fg)", bg: "var(--color-eval-mid-bg)" };
  return { label: "Átmeneti működés", color: "var(--color-eval-low-fg)", bg: "var(--color-eval-low-bg)" };
}

/** A value (0–1) is "balanced" when it falls in the 35–65% zone. */
export function isBalanced(v: number): boolean {
  return v > 0.35 && v < 0.65;
}
