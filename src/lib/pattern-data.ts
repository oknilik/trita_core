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
    hu: "A 16 minta segít értelmezni a csapat jellemzőit; tudományosan igazolt csapattípusokat nem határoz meg. Az elnevezés az önértékelésből számolt csapatjellemzőket foglalja össze. A bizalmi hálót és a pszichológiai biztonságot ettől függetlenül, közvetlenül mérjük.",
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
      "A visszafogottabb társas jelenlét állhat közelebb a csapattagokhoz. Érdemes megnézni, segít-e, ha egy kérdést előbb önállóan gondolnak át, és utána beszélnek meg.",
    highDetail:
      "A csapattagok szívesebben kezdeményezhetnek beszélgetést, és hangosan is megoszthatják az ötleteiket. A közös munka tempójáról a mindennapi tapasztalatok mondanak többet.",
    midDetail:
      "Az érték a skála középső tartományába esik, ezért egyik irány sem emelkedik ki egyértelműen. A csapattagok társas aktivitása ettől még eltérhet.",
  },
  {
    key: "cohesion",
    name: "Kohézió",
    low: "Versengő",
    high: "Összetartó",
    lowDetail:
      "A személyiségprofilok alapján az egyéni érdekek határozott képviselete kerülhet előtérbe. Azt, hogyan működnek együtt a tagok, a közös tapasztalatokkal és a bizalmi felméréssel érdemes összevetni.",
    highDetail:
      "A személyiségprofilok alapján fontos lehet a méltányosság és a megegyezés. Ez önmagában nem mutatja meg, mennyire bíznak egymásban a csapattagok; a bizalmat külön mérjük.",
    midDetail:
      "Az érték a skála középső tartományába esik. Ebből nem dönthető el, mennyire versengenek vagy tartanak össze a tagok; ehhez a kapcsolataikat is meg kell ismerni.",
  },
  {
    key: "discipline",
    name: "Fegyelem",
    low: "Rugalmas",
    high: "Strukturált",
    lowDetail:
      "A tagoknak közelebb állhat a kötetlenebb munkaszervezés és a rögtönzés. Érdemes megnézni, mely feladatokban segít ez, és hol lenne szükség több tervezésre.",
    highDetail:
      "A tervezés, a rend és a részletek követése fontos lehet a csapattagoknak. A kialakított folyamatokról és azok betartásáról a mindennapi munka mond többet.",
    midDetail:
      "Az érték a skála középső tartományába esik. Nem mutat egyértelműen sem a szorosabb tervezés, sem a kötetlenebb munkaszervezés felé.",
  },
  {
    key: "openness",
    name: "Nyitottság",
    low: "Pragmatikus",
    high: "Felfedező",
    lowDetail:
      "A tagok inkább a megszokott, bevált megoldásokhoz nyúlhatnak. A kézzelfogható, gyakorlati kérdések közelebb állhatnak hozzájuk, mint a kísérletezés.",
    highDetail:
      "A tagokat vonzhatják az új ötletek és a szokatlan megoldások. Érdemes megnézni, mely feladatoknál kap teret ez a kíváncsiság.",
    midDetail:
      "Az érték a skála középső tartományába esik. Ebből még nem derül ki, mely kérdésekben kísérleteznének szívesen a csapattagok, és hol ragaszkodnának a megszokotthoz.",
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
      "Ebben a mintában a kezdeményezőkedv, a tervezés és az új ötletek iránti érdeklődés találkozik. A tagoknak fontos lehet, hogy közben egymással is megegyezzenek.",
    strengths: ["Az ötletek gyors megvalósítása", "Törekvés a megegyezésre", "Nyitottság a változásra", "Nagy lendület"],
    risks: ["A kimerülés veszélye", "Széttartó figyelem", "Csoportgondolkodás", "Túl merev folyamatok"],
    people: "Újító, társas és szervezett emberek, akik szeretnek csapatban alkotni.",
    contexts: "Termékfejlesztés, innovációs műhely, tervezői gondolkodásra épülő csapatok, induló vállalkozások alapcsapata",
    color: "var(--color-bronze)",
  },
  "1110": {
    name: "Összehangolt Végrehajtó Csapat",
    alias: "Végrehajtó Egység",
    description:
      "A tagok szívesen kezdeményezhetnek, de a megvalósításhoz inkább a bevált módszereket választanák. A világos tervek és a megegyezés segíthetik őket a közös munkában.",
    strengths: ["Megbízható végrehajtás", "Erős csapatszellem", "Jól működő rutinok", "A közös tervek követése"],
    risks: ["Kevés új megközelítés", "Ellenállás a változással szemben", "Elfojtott feszültségek", "Lassú alkalmazkodás"],
    people: "Megbízható, lojális, feladatközpontú emberek, akik szeretik a világos kereteket.",
    contexts: "Üzemeltetés, ügyfélkiszolgálás, projektmenedzsment, megfelelőségi csapatok",
    color: "light-dark(#b5651d, #cc7221)",
  },
  "1101": {
    name: "Szabadon Alkotó Közösség",
    alias: "Kreatív Kommuna",
    description:
      "Új ötletek, élénk beszélgetések és kötetlenebb munkaszervezés állhatnak közel a tagokhoz. A közös alkotásban fontos lehet számukra, hogy elfogadják egymás szempontjait.",
    strengths: ["Erős kreatív energia", "Egymás szempontjainak elfogadása", "Gyors alkalmazkodás", "Tér az ötletek kipróbálására"],
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
      "A tagok szívesen beszélgethetnek és kereshetnek közös megoldást. Közelebb állhat hozzájuk, ha a bevált módszereket szabadabban, a feladathoz igazítva használják.",
    strengths: ["Törekvés a közös megoldásokra", "Gyakorlatias döntések", "Rugalmas helyzetkezelés", "Figyelem egymás szempontjaira"],
    risks: ["Nehéz lehet változtatni", "Rövid távú gondolkodás", "Zárt közösség", "Tervezetlenség"],
    people: "Lojális, gyakorlatias, a közös megoldást kereső emberek.",
    contexts: "Értékesítés, ügyfélmenedzsment, családi cégek, helyi szolgáltatók",
    color: "light-dark(#c9915e, #c9915e)",
  },
  "1011": {
    name: "Teljesítményre Törekvő Innovátorok",
    alias: "Versenygép",
    description:
      "A kezdeményezőkedv és az újítás iránti érdeklődés tervezéssel párosulhat. Érdemes megnézni, hogyan egyeztetik össze a tagok a saját céljaikat a közös feladatokkal.",
    strengths: ["Önálló feladatvállalás", "Határozott egyéni célok", "Az újítások gyors megvalósítása", "Gyors reagálás a piaci változásokra"],
    risks: ["Az együttműködés háttérbe szorulhat", "Nagy terhelés", "A vita versengéssé válhat", "Az egyéni célok megelőzhetik a csapatcélokat"],
    people: "Ambiciózus, versengő, újító egyéniségek, akik a világos kereteket is értékelik.",
    contexts: "Pénzügyi technológia, stratégiai tanácsadás, versenysportot támogató csapatok",
    color: "light-dark(#8b3a2a, #cd6e5b)",
  },
  "1010": {
    name: "Fegyelmezett Operatív Csapat",
    alias: "Hadsereg",
    description:
      "A tagoknak fontos lehet a határozott fellépés, a világos terv és a bevált megoldás. A közös munkában figyelmet kérhet, hogyan egyeztetik az eltérő érdekeket.",
    strengths: ["Gyors végrehajtás", "Egyértelmű felelősségek", "Világos elvárások", "Határozott célkövetés"],
    risks: ["Kevés tér az őszinte megszólalásra", "Elfojtott ötletek", "Rövid távú szemlélet", "A közös célok háttérbe szorulhatnak"],
    people: "Fegyelmezett, célratörő emberek, akik otthonosan mozognak a gyors végrehajtást kívánó helyzetekben.",
    contexts: "Szervezeti helyreállítás, válságkezelés, logisztika, operatív vezetés",
    color: "light-dark(#6b4226, #be7848)",
  },
  "1001": {
    name: "Nagy Energiájú Kreatív Minta",
    alias: "Kreatív Káosz",
    description:
      "A tagok szívesen állhatnak elő új ötletekkel, és kötetlenül dolgozhatnak azok megvalósításán. Közös feladat lehet eldönteni, melyik ötlettel foglalkozzanak először.",
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
      "A tagok közelebb érezhetik magukhoz, ha önállóan, a saját területükön kezdeményezhetnek. A feladatok összehangolását érdemes külön megbeszélniük.",
    strengths: ["Gyors alkalmazkodás", "Erős egyéni felelősségvállalás", "Önszerveződés", "Rugalmas munkaszervezés"],
    risks: ["Kevés közösen vállalt feladat", "Kevés tudásmegosztás", "Kevés figyelem a közös célokra", "Nehéz az új tagok beillesztése"],
    people: "Önálló, gyakorlatias, versengő emberek.",
    contexts: "Ingatlan, biztosítás, szabadúszó-hálózatok, üzletfejlesztés",
    color: "light-dark(#7a4b2e, #bd794f)",
  },
  "0111": {
    name: "Felfedező Labor",
    alias: "Kutatólabor",
    description:
      "Az elmélyült munka, az új kérdések és a gondos tervezés állhatnak közel a tagokhoz. Fontos lehet számukra, hogy közben türelmesen egyeztethessenek egymással.",
    strengths: ["Mély, alapos munka", "Türelem az egyeztetésekben", "Módszeres újítás", "Alapos minőségellenőrzés"],
    risks: ["Lassú döntéshozatal", "A munka kívülről nehezen látható", "A konfrontáció kerülése", "Kívülről passzívnak tűnhet"],
    people: "Visszafogottabb, kíváncsi, alapos és együttműködő emberek.",
    contexts: "K+F, tudományos munka, adatelemzés, minőségbiztosítás, farmakológia",
    color: "light-dark(#3d6b5e, #559482)", // sage — a korábbi közeli-de-más zöld a brand-zsályába olvadt
  },
  "0110": {
    name: "Stabil Magcsapat",
    alias: "Csendes Erőd",
    description:
      "A visszafogottabb társas jelenlét és a tervezett, megszokott feladatok kedvelése találkozik ebben a mintában. A tagoknak fontos lehet, hogy közös megállapodásokra támaszkodhassanak.",
    strengths: ["Tervezett munkavégzés", "Törekvés a közös megoldásokra", "Törekvés a békés egyeztetésre", "Megbízható a rutinfeladatokban"],
    risks: ["Ellenállás a változással szemben", "A végzett munka kevéssé látszik kifelé", "Zárt közösség", "Kevés újítás"],
    people: "Csendes, megbízható, lojális és rendezetten gondolkodó emberek.",
    contexts: "Könyvelés, IT-üzemeltetés, háttérirodai feladatok, közigazgatás",
    color: "light-dark(#4a7c5e, #599571)",
  },
  "0101": {
    name: "Alkotó Közeg",
    alias: "Művésztelep",
    description:
      "A tagokat vonzhatja az elmélyült alkotás és az új ötletek szabad kipróbálása. Közel állhat hozzájuk, ha közben elfogadják egymás eltérő megközelítéseit.",
    strengths: ["Törekvés egymás elfogadására", "Mély, eredeti gondolkodás", "Közös alkotás iránti igény", "Türelem az eltérő ötletekkel szemben"],
    risks: ["Nehéz kommunikáció a külső partnerekkel", "Lassú végrehajtás", "Az eredmény háttérbe szorulhat a harmónia mögött", "Nehéz lehet kezelni a külső nyomást"],
    people: "Csendesebb, elmélyült gondolkodású, értékvezérelt alkotók.",
    contexts: "UX-kutatás, stratégiai tervezés, tartalomkészítés, független játékfejlesztés",
    color: "light-dark(#3a8066, #45997a)",
  },
  "0100": {
    name: "Támogató Közeg",
    alias: "Támogató Kör",
    description:
      "A tagok közelebb érezhetik magukhoz a csendesebb közös munkát és a bevált, gyakorlati megoldásokat. A kötetlenebb munkaszervezés mellett fontos lehet számukra a megegyezés.",
    strengths: ["Erős belső támogatás", "Gyakorlatias gondolkodás", "Türelem az eltérő véleményekkel szemben", "Jó alkalmazkodás"],
    risks: ["A nagyobb célok háttérbe szorulhatnak", "A nehéz döntések kerülése", "A végzett munka kevéssé látszik kifelé", "Ragaszkodás a megszokotthoz"],
    // Ld. fent: a kohézió-tengely nem empátia-mérés — türelem és tolerancia.
    people: "Türelmes, gyakorlatias, támogató csapatjátékosok.",
    contexts: "HR, szociális munka, ügyfélszolgálat, egészségügy, mentorálás",
    color: "light-dark(#6b9b7d, #6b9b7d)",
  },
  "0011": {
    name: "Stratégiai Szakértői Csapat",
    alias: "Sakktábla",
    description:
      "A tagok szívesebben foglalkozhatnak önállóan, elmélyülten egy-egy új kérdéssel. A tervezés közel állhat hozzájuk; a külön végzett munka összehangolására érdemes figyelmet szánni.",
    strengths: ["Elmélyült munka", "Stratégiai gondolkodás", "A részletek gondos átgondolása", "Szakterületi újítás"],
    risks: ["Elszigetelt szakterületek", "Rejtett rivalizálás", "Nehéz közös döntést hozni", "Kívülről távolságtartónak tűnhet"],
    people: "Elemző szemléletű, versenyszellemű, elmélyült szakértők.",
    contexts: "Adattudomány, jog, pénzügyi elemzés, mérnöki tervezés, stratégia",
    color: "light-dark(#3d4f6b, #748bb0)",
  },
  "0010": {
    name: "Precíz Szakmai Műhely",
    alias: "Mérnöki Műhely",
    description:
      "A tagok inkább önállóan, világos terv szerint dolgoznának, és a bevált megoldásokhoz nyúlnának. A saját feladatuk mellett a közös egyeztetések helyét is érdemes megtalálni.",
    strengths: ["Alapos, részletekre figyelő munka", "Hatékonyság", "Egyértelmű felelősségek", "A bevált módszerek követése"],
    risks: ["Kevés személyes beszélgetés", "A kimerülés veszélye", "Az újítás nehezen kap teret", "A tagok inkább külön-külön végzik a munkájukat"],
    people: "Precíz, önálló, műszaki beállítottságú szakemberek.",
    contexts: "Szoftverfejlesztés, audit, pénzügy, DevOps, mérnöki irodák",
    color: "light-dark(#556b8a, #748baa)",
  },
  "0001": {
    name: "Autonóm Felfedezők",
    alias: "Szabad Elektronok",
    description:
      "Az önálló gondolkodás, az új ötletek és a szabadabb munkaszervezés állhatnak közel a tagokhoz. Közös kérdés lehet, hogyan kapcsolják össze a külön-külön végzett munkát.",
    strengths: ["Erős egyéni kreativitás", "Mély gondolkodás", "Rugalmas munkaszervezés", "Vonzó lehet az önállóságot keresők számára"],
    risks: ["Kevés közösen vállalt feladat", "Kevés összehangolás", "Elszigetelődés", "Nehéz közös irányt találni"],
    people: "Önálló, kíváncsi, a megszokott megoldásokat megkérdőjelező gondolkodók.",
    contexts: "Kutatás, új megoldások kezdeti kidolgozása, művészet, filozófia, független fejlesztés",
    color: "light-dark(#4a6b7a, #6790a3)",
  },
  "0000": {
    name: "Erősen Független Egyéni Minta",
    alias: "Szabadúszók",
    description:
      "A tagoknak fontos lehet az önállóság, és inkább a bevált, gyakorlati megoldásokat kereshetik. Érdemes megbeszélniük, mi kapcsolja össze a feladataikat, és miben számítanak egymásra.",
    strengths: ["Önálló feladatvállalás", "Gyakorlatias döntések", "Önálló munkaszervezés", "Nagy egyéni mozgástér"],
    risks: ["Kevés közösen vállalt feladat", "Kevés tudásmegosztás", "A saját feladat megelőzheti a közös szempontokat", "A visszajelzések nehezen épülhetnek be"],
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
  return { label: "Több mintához közeli", color: "var(--color-eval-low-fg)", bg: "var(--color-eval-low-bg)" };
}

/** A value (0–1) is "balanced" when it falls in the 35–65% zone. */
export function isBalanced(v: number): boolean {
  return v > 0.35 && v < 0.65;
}
