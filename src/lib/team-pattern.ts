// src/lib/team-pattern.ts

import { mean, sampleStdDev } from "@/lib/stats/dimension-stats";
import { PATTERNS } from "@/lib/pattern-data";

// ============================================================
// TYPES
// ============================================================

/** 5 fokozat tengelyenként — nem bináris */
export type AxisGrade = "strong_high" | "slight_high" | "balanced" | "slight_low" | "strong_low";

export interface TeamAxes {
  drive: number;       // Extraversion átlag
  cohesion: number;    // (Agreeableness + Honesty-Humility) / 2 átlag — kohéziós proxy
  discipline: number;  // Conscientiousness átlag
  openness: number;    // Openness átlag
}

export interface TeamDiversity {
  drive: number;
  cohesion: number;
  discipline: number;
  openness: number;
}

export interface AxisDetail {
  value: number;
  grade: AxisGrade;
  diversity: number;
  diversityLabel: "homogén" | "vegyes" | "diverz";
  distanceFromThreshold: number; // 0 = pont a küszöbön, magasabb = stabilabb
}

export interface StyleDistance {
  userId: string;
  tensionAxes: string[];   // tengelyek, ahol nagy az eltérés
}

export interface TeamPatternResult {
  // Fő minta
  patternCode: string;         // pl. "ECSX"
  patternName: string;         // pl. "Innovátor Gépezet"
  diversitySuffix: string;     // "homogén" | "vegyes" | "diverz"
  fullLabel: string;           // "Innovátor Gépezet — vegyes"

  // Közeli alternatíva
  alternativeCode: string | null;
  alternativeName: string | null;

  // Tengelyek részletesen
  axes: Record<string, AxisDetail>;

  // Stabilitás
  stability: "stabil" | "közepes" | "instabil";
  stabilityNote: string;
  unstableAxes: string[];      // küszöb-közeli tengelyek

  // Konfidencia (összetett)
  confidence: "magas" | "közepes" | "alacsony";
  confidenceFactors: {
    sampleSize: "magas" | "közepes" | "alacsony";
    thresholdProximity: "magas" | "közepes" | "alacsony";
    patternClarity: "magas" | "közepes" | "alacsony";
  };

  // Egyén-minta távolságok
  styleDistances: StyleDistance[];

  // Meta — az API layer tölti ki
  memberCount: number;
  membersWithAssessment: number;
  missingMembers: number;
  dataSource: "self"; // later: "self+observer"
}

/** Scores in 0–100 range (as stored in AssessmentResult.scores.dimensions) */
export interface TritanScores {
  H: number;
  E: number;
  X: number;
  A: number;
  C: number;
  O: number;
}

// ============================================================
// KÜSZÖBÖK — 0–100 skálán (trita normatív mintából kalibrálandó)
// Konverzió: 1–5 Likert → ((v − 1) / 4) × 100
//   3.2 → 55  |  3.4 → 60  |  3.5 → 62.5  |  3.3 → 57.5
// ============================================================

export const PATTERN_THRESHOLDS = {
  drive:      55,
  cohesion:   60,
  discipline: 62.5,
  openness:   57.5,
};

// "balanced" sáv félszélessége (0.25 Likert → 6.25%)
const BALANCED_BAND = 6.25;

// "slight" sáv szélessége a balanced felett/alatt (0.5 → 12.5%)
const SLIGHT_BAND = 12.5;

// Egyén-minta eltérés küszöb (0.8 Likert → 20%)
const TENSION_THRESHOLD = 20;

// Stabilitás: egy tengely akkor küszöb-közeli (instabil), ha a fokozata
// "balanced" — azaz a BALANCED_BAND-en belül ül. A korábbi külön
// STABILITY_THRESHOLD (3.75) KESKENYEBB volt a balanced sávnál (6.25), így
// egy tengely lehetett egyszerre „kiegyensúlyozott" fokozatú ÉS „stabilan
// egy pólus felé hajló" — a fokozat, a pólus-betű és a stabilitás-jegyzet
// ellentmondott egymásnak. A stabilitás mostantól a fokozatból SZÁRMAZIK,
// külön küszöb nincs.

// Diverzitás (szórás) sávok (0–100 skálán).
// FIGYELEM: e küszöbök még a korábbi populációs szórásra voltak hangolva;
// a becslő mostantól torzítatlan mintaszórás (sampleStdDev, ÷(n−1)), ami
// n=3–8-nál ~10–20%-kal nagyobb → a besorolás kissé gyakrabban jelez
// "diverz"-et. A tényleges újrakalibráció pilot-normát igényel.
const DIVERSITY_LOW  = 10;   // ez alatt "homogén"
const DIVERSITY_HIGH = 20;   // ez felett "diverz"

// Minimum tag a csapatminta számításához (statisztikai elégségesség).
const PATTERN_MIN_MEMBERS = 3;

// ============================================================
// SEGÉDFÜGGVÉNYEK
// A dimenzió-átlag és -szórás a közös, tiszta stats-modulból (mean /
// sampleStdDev). A szórás Bessel-korrekciós (mintaszórás, ÷(n−1)) — a
// csapat a populáció mintája, a ÷n lefelé torzított.
// ============================================================

function gradeAxis(value: number, threshold: number): AxisGrade {
  const diff = value - threshold;
  if (Math.abs(diff) <= BALANCED_BAND) return "balanced";
  if (diff > BALANCED_BAND + SLIGHT_BAND) return "strong_high";
  if (diff > BALANCED_BAND) return "slight_high";
  if (diff < -(BALANCED_BAND + SLIGHT_BAND)) return "strong_low";
  return "slight_low";
}

function diversityLabel(sd: number): "homogén" | "vegyes" | "diverz" {
  if (sd < DIVERSITY_LOW) return "homogén";
  if (sd > DIVERSITY_HIGH) return "diverz";
  return "vegyes";
}

function poleLetter(
  value: number,
  threshold: number,
  highLetter: string,
  lowLetter: string
): string {
  return value >= threshold ? highLetter : lowLetter;
}

// ============================================================
// FŐ KALKULÁCIÓ
// ============================================================

export function calculateTeamPattern(
  members: Array<{ userId: string; scores: TritanScores }>
): TeamPatternResult | null {
  if (members.length < PATTERN_MIN_MEMBERS) return null;

  const allScores = members.map((m) => m.scores);

  // ── 1. Tengely értékek ──────────────────────────────────
  const rawAxes: TeamAxes = {
    drive:      mean(allScores.map((s) => s.X)),
    cohesion:   mean(allScores.map((s) => (s.A + s.H) / 2)),
    discipline: mean(allScores.map((s) => s.C)),
    openness:   mean(allScores.map((s) => s.O)),
  };

  const rawDiversity: TeamDiversity = {
    drive:      sampleStdDev(allScores.map((s) => s.X)),
    cohesion:   sampleStdDev(allScores.map((s) => (s.A + s.H) / 2)),
    discipline: sampleStdDev(allScores.map((s) => s.C)),
    openness:   sampleStdDev(allScores.map((s) => s.O)),
  };

  // ── 2. Tengely részletek ────────────────────────────────
  const axisEntries: [string, number, number, number][] = [
    ["drive",      rawAxes.drive,      PATTERN_THRESHOLDS.drive,      rawDiversity.drive],
    ["cohesion",   rawAxes.cohesion,   PATTERN_THRESHOLDS.cohesion,   rawDiversity.cohesion],
    ["discipline", rawAxes.discipline, PATTERN_THRESHOLDS.discipline, rawDiversity.discipline],
    ["openness",   rawAxes.openness,   PATTERN_THRESHOLDS.openness,   rawDiversity.openness],
  ];

  const axes: Record<string, AxisDetail> = {};
  const unstableAxes: string[] = [];

  for (const [name, value, threshold, div] of axisEntries) {
    const dist = Math.abs(value - threshold);
    const grade = gradeAxis(value, threshold);
    // Instabil = "balanced" fokozatú tengely (küszöb-közeli). Így a fokozat,
    // a kiosztott pólus-betű és a stabilitás-jegyzet garantáltan egyet mond:
    // „stabil" (minden tengely egyértelműen egy pólus felé hajlik) CSAK akkor
    // állítható, ha egyik tengely sem "balanced".
    if (grade === "balanced") unstableAxes.push(name);

    axes[name] = {
      value,
      grade,
      diversity: div,
      diversityLabel: diversityLabel(div),
      distanceFromThreshold: dist,
    };
  }

  // ── 3. Mintakód (domináns 4 betű) ──────────────────────
  // A pólus-betűk a PATTERN_NAMES kulcs-ábécéje (E/R, C/V, S/F, X/P) —
  // NEM a belső dimenziókódok. (A 2026-07-i TRITAN→HEXACO átnevezés itt
  // tévedésből a betű-literálokat is átírta; a kulcsok 4 betűsek maradtak.)
  const patternCode = [
    poleLetter(rawAxes.drive,      PATTERN_THRESHOLDS.drive,      "E", "R"),
    poleLetter(rawAxes.cohesion,   PATTERN_THRESHOLDS.cohesion,   "C", "V"),
    poleLetter(rawAxes.discipline, PATTERN_THRESHOLDS.discipline, "S", "F"),
    poleLetter(rawAxes.openness,   PATTERN_THRESHOLDS.openness,   "X", "P"),
  ].join("");

  // ── 4. Globális diverzitás suffix ──────────────────────
  const avgDiversity = mean([
    rawDiversity.drive,
    rawDiversity.cohesion,
    rawDiversity.discipline,
    rawDiversity.openness,
  ]);
  const divSuffix = diversityLabel(avgDiversity);

  // ── 5. Közeli alternatíva ──────────────────────────────
  let alternativeCode: string | null = null;
  if (unstableAxes.length > 0) {
    const mostUnstable = unstableAxes.reduce((a, b) =>
      axes[a].distanceFromThreshold < axes[b].distanceFromThreshold ? a : b
    );
    const altLetters = patternCode.split("");
    const axisIndex = ["drive", "cohesion", "discipline", "openness"].indexOf(mostUnstable);
    const currentLetter = altLetters[axisIndex];
    const flipMap: Record<string, string> = {
      E: "R", R: "E", C: "V", V: "C", S: "F", F: "S", X: "P", P: "X",
    };
    altLetters[axisIndex] = flipMap[currentLetter];
    alternativeCode = altLetters.join("");
  }

  // ── 6. Stabilitás ──────────────────────────────────────
  const stability: "stabil" | "közepes" | "instabil" =
    unstableAxes.length === 0 ? "stabil" :
    unstableAxes.length <= 1  ? "közepes" : "instabil";

  const stabilityNote =
    stability === "stabil"
      ? "A személyiségprofilokból számított átlagok mind a négy területen egyértelműen a besorolási küszöb egyik oldalán vannak."
      : stability === "közepes"
      ? `A személyiségprofilokból számított átlag ${unstableAxes.length} területen közel van a besorolási küszöbhöz. Itt kisebb pontszámváltozás is módosíthatja a mintázatot.`
      : `A személyiségprofilokból számított átlag ${unstableAxes.length} területen közel van a besorolási küszöbhöz. A mintázatot ezért óvatosan értelmezzétek: kisebb pontszámváltozás is más besorolást adhat.`;

  // ── 7. Konfidencia (összetett) ──────────────────────────
  const sizeConf:   "magas" | "közepes" | "alacsony" =
    members.length >= 8 ? "magas" : members.length >= 5 ? "közepes" : "alacsony";
  const threshConf: "magas" | "közepes" | "alacsony" =
    unstableAxes.length === 0 ? "magas" : unstableAxes.length <= 1 ? "közepes" : "alacsony";
  const clarityConf: "magas" | "közepes" | "alacsony" =
    avgDiversity < DIVERSITY_HIGH ? "magas" : "közepes";

  const confScores = { magas: 3, közepes: 2, alacsony: 1 } as const;
  const totalConf =
    confScores[sizeConf] + confScores[threshConf] + confScores[clarityConf];
  const confidence: "magas" | "közepes" | "alacsony" =
    totalConf >= 8 ? "magas" : totalConf >= 5 ? "közepes" : "alacsony";

  // ── 8. Egyén-minta távolság ─────────────────────────────
  const styleDistances: StyleDistance[] = members.map((m) => {
    // A tengely-eltérések csak a feszültség-tengelyek kiszűréséhez kellenek
    // (a fogyasztó a tensionAxes darabszámát használja) – a deviations map és
    // a patternDistance nem hagyja el a függvényt.
    const deviations: Record<string, number> = {
      drive:      Math.abs(m.scores.X - rawAxes.drive),
      cohesion:   Math.abs((m.scores.A + m.scores.H) / 2 - rawAxes.cohesion),
      discipline: Math.abs(m.scores.C - rawAxes.discipline),
      openness:   Math.abs(m.scores.O - rawAxes.openness),
    };

    const tensionAxes = Object.entries(deviations)
      .filter(([, v]) => v > TENSION_THRESHOLD)
      .map(([k]) => k);

    return {
      userId: m.userId,
      tensionAxes,
    };
  });

  // ── 9. Összeállítás ─────────────────────────────────────
  const patternName      = PATTERN_NAMES[patternCode]?.name ?? "Ismeretlen minta";
  const alternativeName  = alternativeCode
    ? (PATTERN_NAMES[alternativeCode]?.name ?? null)
    : null;

  return {
    patternCode,
    patternName,
    diversitySuffix: divSuffix,
    fullLabel: `${patternName} – ${divSuffix}`,

    alternativeCode,
    alternativeName,

    axes,

    stability,
    stabilityNote,
    unstableAxes,

    confidence,
    confidenceFactors: {
      sampleSize:         sizeConf,
      thresholdProximity: threshConf,
      patternClarity:     clarityConf,
    },

    styleDistances,

    memberCount:          members.length,
    membersWithAssessment: members.length,
    missingMembers:       0, // az API route tölti ki
    dataSource:           "self",
  };
}

// ============================================================
// 16 CSAPATMINTA – TARTALOM
// ============================================================

export interface PatternContent {
  name: string;
  subtitle: string;
  description: string;
  strengths: string[];
  blindSpots: string[];
  communicationStyle: string;
  idealTasks: string;
  riskSituations: string;
  leaderActions: string[];
}

// ── Név-forrás egységesítés (2026-08-11) ────────────────────────────
// A 16 mintázat MEGJELENŐ nevének egyetlen forrása a pattern-data.ts
// (PATTERNS[bináris kulcs].alias) – a /patterns felfedező ugyanazt a
// név-családot mutatja elsődleges címkeként, így a riport és a marketing
// egy nyelvet beszél. Az alábbi tartalom-táblában maradó `name` literál
// csak VÉSZ-fallback (ha egy kód nem oldódna fel a pattern-data-ban);
// a kanonikus PATTERN_NAMES export a nevet a pattern-data-ból veszi.

/** Tengelyenkénti pólus-betűpárok [magas, alacsony] – drive/cohesion/discipline/openness. */
const AXIS_POLE_LETTERS: ReadonlyArray<readonly [string, string]> = [
  ["E", "R"],
  ["C", "V"],
  ["S", "F"],
  ["X", "P"],
];

/** 4 betűs mintakód → pattern-data bináris kulcs (pl. "ECSX" → "1111"). */
export function patternCodeToBinaryKey(code: string): string | null {
  if (code.length !== AXIS_POLE_LETTERS.length) return null;
  let key = "";
  for (let i = 0; i < AXIS_POLE_LETTERS.length; i++) {
    const [high, low] = AXIS_POLE_LETTERS[i];
    if (code[i] === high) key += "1";
    else if (code[i] === low) key += "0";
    else return null;
  }
  return key;
}

/** A mintázat publikus neve a kanonikus név-táblából (pattern-data). */
export function patternPublicName(code: string): string | null {
  const key = patternCodeToBinaryKey(code);
  return key ? (PATTERNS[key]?.alias ?? null) : null;
}

const PATTERN_CONTENT: Record<string, PatternContent> = {

  // ── Energikus + Összetartó ─────────────────────────────

  ECSX: {
    name: "Innovátor Gépezet",
    subtitle: "Energikus · Összetartó · Strukturált · Felfedező",
    description:
      "A személyiségprofilok alapján szívesen kezdeményezhettek, kereshettek új megoldásokat, és közben fontos lehet nektek a gondos tervezés. Érdemes megnéznetek, hogyan segítik ezek a hajlamok a közös munkát.",
    strengths: [
      "Az új ötletek mellé szívesen készíthettek megvalósítási tervet",
      "Türelemmel fordulhattok egymás javaslatai felé",
      "A tervezés mellett nyitottak maradhattok a változtatásra",
      "Könnyen kezdeményezhettek beszélgetést a partnerekkel",
    ],
    blindSpots: [
      "Sok párhuzamos vállalás mellett későn vehetitek észre, hogy túl nagy a terhelés",
      "Egy új ötlet elvonhatja a figyelmeteket a már elkezdett feladatoktól",
      "Az egyetértés keresése közben elmaradhat egy fontos ellenvetés",
      "Túl sok közös szabállyal megnehezíthetitek a gyors változtatást",
    ],
    communicationStyle:
      "A profil alapján közel állhat hozzátok a közös ötletelés és a feladatok alapos egyeztetése. Figyeljétek meg, hogy a gyorsabb beszélgetésekben mindenkinek jut-e ideje hozzászólni.",
    idealTasks:
      "Új termék vagy szolgáltatás fejlesztésekor hasznos lehet, hogy szívesen kerestek ötleteket és tervezitek meg a megvalósítást is. Nézzétek meg korábbi feladatokon, melyikben tudtatok erre építeni.",
    riskSituations:
      "Hosszú, ismétlődő feladatoknál vagy sok párhuzamos kezdeményezésnél külön figyeljetek arra, mivel kell először elkészülni. A nézeteltéréseket akkor is beszéljétek meg, ha gyorsabbnak tűnne továbblépni.",
    leaderActions: [
      "Vezetőként az intenzív munkaszakaszok után hagyj időt arra, hogy együtt átnézzétek, mi vált be és mi terhelte a csapatot",
      "Nagyobb döntés előtt kérj meg valakit, hogy gyűjtse össze az ellenvetéseket és a kimaradt szempontokat",
      "Egyezzetek meg, hány kezdeményezést tudtok egyszerre végigvinni; kezdésként próbáljátok ki, hogy legfeljebb kettőn dolgoztok",
    ],
  },

  ECSP: {
    name: "Végrehajtó Egység",
    subtitle: "Energikus · Összetartó · Strukturált · Pragmatikus",
    description:
      "A személyiségprofilok alapján a bevált módszerek, a gondos tervezés és az együttműködés lehetnek hangsúlyosak nálatok. A társas kezdeményezés segíthet abban, hogy közösen tisztázzátok a feladatokat.",
    strengths: [
      "Szívesen követhetitek végig az előre egyeztetett feladatokat",
      "Könnyebb lehet türelmesen egyeztetnetek",
      "Támaszkodhattok a már bevált munkamenetre",
      "Fontos lehet nektek, hogy a vállalások követhetők legyenek",
    ],
    blindSpots: [
      "Később próbálhattok ki új megoldást, ha a megszokott eljárás még elfogadhatóan működik",
      "Nehezebb lehet elfogadnotok egy új eszközt, ha nem látszik, miben segít",
      "Az egyetértés kedvéért elhallgathattok egy fontos ellenvetést",
      "Lassabban változtathattok a terven, amikor a körülmények már mást kívánnak",
    ],
    communicationStyle:
      "A profil alapján hasznosnak találhatjátok az előre megadott napirendet és a rögzített döntéseket. Beszéljétek át, hogy ez a mindennapi egyeztetéseknél is így van-e.",
    idealTasks:
      "Ismétlődő ügyfél- vagy működési feladatoknál hasznos lehet a bevált eljárások és a gondos tervezés iránti igényetek. Beszéljétek át, mely korábbi munkákban segített ez.",
    riskSituations:
      "Ha hirtelen megváltoznak az elvárások, új vezető érkezik, vagy még nincs kipróbált megoldás, több időt igényelhet az átállás. Ilyenkor tisztázzátok, mit tartotok meg, és min szükséges változtatni.",
    leaderActions: [
      "Vezetőként negyedévente beszéljetek át egy lehetséges változást: mit tennétek, ha a jelenlegi módszer már nem működne?",
      "Kérj meg egy másik csapatot vagy külső szakembert, hogy mutassa meg, ő hogyan oldana meg egy visszatérő feladatot",
      "Egy kipróbált új módszer után mondd el konkrétan, mit tanult belőle a csapat",
    ],
  },

  ECFX: {
    name: "Kreatív Kommuna",
    subtitle: "Energikus · Összetartó · Rugalmas · Felfedező",
    description:
      "A személyiségprofilok alapján szívesen beszélhettek meg új ötleteket, és könnyebben engedhetitek el az előre rögzített munkamenetet. Az egymás felé mutatott türelem segíthet a közös kísérletezésben.",
    strengths: [
      "Könnyen kezdeményezhettek közös ötletelést",
      "Türelemmel fogadhatjátok az eltérő javaslatokat",
      "Nyitottak lehettek arra, hogy menet közben változtassatok",
      "Teret hagyhattok az egyéni ötletek kipróbálásának",
    ],
    blindSpots: [
      "Közös feladatterv nélkül nehezen követhetitek, ki mivel halad",
      "Több vonzó ötlet között nehezebb lehet sorrendet választanotok",
      "Az új lehetőségek keresése közben elfeledkezhettek egy határidőről",
      "Az egyetértés kedvéért elmaradhat egy szükséges ellenvetés",
    ],
    communicationStyle:
      "A profil alapján közel állhat hozzátok a kötetlen ötletelés. A beszélgetés végén nézzétek meg, melyik javaslatból lesz feladat, és mi marad későbbre.",
    idealTasks:
      "Korai ötletelésnél, új szolgáltatás tervezésénél vagy márkaépítésnél hasznos lehet, hogy több irányt is szívesen megvizsgáltok. A kiválasztott ötlethez utána közösen tervezzétek meg a következő lépést.",
    riskSituations:
      "Szoros határidő vagy sok egymásra épülő feladat mellett külön figyeljetek a befejezésre. Tisztázzátok, mikor zárjátok le az ötletelést, és mit kell elkészíteni addigra.",
    leaderActions: [
      "Vezetőként hetente egyeztess a csapattal arról, mely feladatok készüljenek el először",
      "Írjátok egy közös listára a későbbre szánt ötleteket, és válasszátok ki, melyikkel foglalkoztok most",
      "A megvalósítás tervezéséhez kérj segítséget olyan kollégától vagy csapattól, amelynek bevált módszere van erre",
    ],
  },

  ECFP: {
    name: "Családi Vállalkozás",
    subtitle: "Energikus · Összetartó · Rugalmas · Pragmatikus",
    description:
      "A személyiségprofilok alapján szívesen fordulhattok egymáshoz, és inkább a bevált megoldásokban bízhattok. A részletes tervezés kevésbé hangsúlyos, ezért érdemes megbeszélnetek, hogyan tartjátok számon a közös vállalásokat.",
    strengths: [
      "Könnyen kezdeményezhettek személyes egyeztetést",
      "Előnyben részesíthetitek a már kipróbált megoldásokat",
      "Kevésbé ragaszkodhattok a részletesen előírt munkamenethez",
      "Türelemmel kezelhetitek egymás kéréseit",
    ],
    blindSpots: [
      "A bevált megoldásokhoz ragaszkodva későn kezdhettek változtatni",
      "A napi ügyek mellett háttérbe szorulhat a hosszabb távú tervezés",
      "Könnyebben félretehetitek annak a javaslatát, aki kevésbé ismeri a szokásaitokat",
      "Részletes egyeztetés nélkül eltérően érthetitek, ki mit vállalt",
    ],
    communicationStyle:
      "A profil alapján kézenfekvő lehet személyesen, menet közben egyeztetnetek. Figyeljétek meg, hogy az is megtudja-e a fontos döntéseket, aki nem volt jelen.",
    idealTasks:
      "Ügyfélkapcsolatokban és a napi problémák megoldásában hasznos lehet a közvetlen egyeztetés és a bevált módszerek ismerete. Saját tapasztalatokból nézzétek meg, mire tudtok építeni.",
    riskSituations:
      "Új tagok érkezésekor, gyors bővülésnél vagy egy új eszköz bevezetésekor mondjátok ki azt is, amit korábban mindenki magától tudott. A közös szokások ilyenkor már nem feltétlenül elegendők.",
    leaderActions: [
      "Vezetőként gondoskodj róla, hogy a fontos döntéseket minden érintett vissza tudja keresni",
      "Egy új tag mellé jelölj ki valakit, aki bemutatja neki a közös munkamenetet és válaszol a kérdéseire",
      "Évente kérdezd meg a csapatot: „Mit csinálnánk másképp, ha ma kezdenénk együtt dolgozni?”",
    ],
  },

  // ── Energikus + Versengő ──────────────────────────────

  EVSX: {
    name: "Versenygép",
    subtitle: "Energikus · Versengő · Strukturált · Felfedező",
    description:
      "A személyiségprofilokban együtt jelenik meg a társas kezdeményezés, az új ötletek iránti érdeklődés és a gondos tervezés. A saját álláspontotokhoz erősebben ragaszkodhattok, ezért a közös döntés módját is érdemes tisztáznotok.",
    strengths: [
      "Határozottan képviselhetitek az ötleteiteket",
      "Szívesen vállalhattok kezdeményező szerepet",
      "Az új megoldásokhoz részletes tervet is készíthettek",
      "Könnyen indíthattok beszélgetést egy új lehetőségről",
    ],
    blindSpots: [
      "A saját ötletetek képviselete közben kevesebb figyelmet fordíthattok mások munkájára",
      "Sok új vállalással könnyen túlterhelhetitek magatokat",
      "Egy vitában fontosabbá válhat a saját álláspont érvényesítése, mint a közös megoldás",
      "Az egyéni eredmények mellett háttérbe szorulhat a csapat közös célja",
    ],
    communicationStyle:
      "A profil alapján határozottan érvelhettek, és fontosak lehetnek a részletek. Egy vita során ellenőrizzétek, hogy megértettétek-e egymás szempontjait, mielőtt döntötök.",
    idealTasks:
      "Új lehetőségek keresésekor vagy egy prototípus kidolgozásakor hasznos lehet a kezdeményezés és a részletes tervezés. Egyezzetek meg abban is, milyen közös eredményt szeretnétek elérni.",
    riskSituations:
      "Hosszú, szoros együttműködést igénylő munkánál külön figyeljetek a tudás megosztására. A saját részfeladatok mellett azt is nézzétek meg, hol van szükségetek egymás segítségére.",
    leaderActions: [
      "Vezetőként az egyéni eredmények mellett azt is kövesd, miben jutott előre a csapat együtt",
      "Adj olyan páros feladatot, amelynek befejezéséhez mindkét résztvevő munkájára szükség van",
      "Kérdezz rá rendszeresen, kinek van túl sok párhuzamos feladata, és miben kérne segítséget",
    ],
  },

  EVSP: {
    name: "Hadsereg",
    subtitle: "Energikus · Versengő · Strukturált · Pragmatikus",
    description:
      "A személyiségprofilok alapján határozottan képviselhetitek az álláspontotokat, és szívesen dolgozhattok előre egyeztetett, bevált módszerekkel. Ebből önmagában nem derül ki, ki hozza a döntéseket vagy milyen gyorsan készül el a munka.",
    strengths: [
      "Könnyen kezdeményezhettek a feladatokban",
      "Fontos lehet nektek a pontos feladatterv",
      "Szívesen tisztázhatjátok az elvárásokat",
      "Támaszkodhattok a már kipróbált módszerekre",
    ],
    blindSpots: [
      "Egy gyors egyeztetésen kimaradhat, kinek mire van szüksége a feladathoz",
      "A határozott álláspontok mellett kevesebb figyelmet kaphat egy eltérő javaslat",
      "A napi eredmények mellett háttérbe szorulhatnak a hosszabb távú szempontok",
      "Nehezebb lehet új megoldást keresnetek, ha a bevált eljárásban bíztok",
    ],
    communicationStyle:
      "A profil alapján közel állhat hozzátok a közvetlen, feladatra összpontosító egyeztetés. Beszéljétek át, hogyan kapnak helyet benne az eltérő vélemények is.",
    idealTasks:
      "Előre ismert lépésekből álló, határidős feladatoknál hasznos lehet a kezdeményezés és a gondos tervezés. A szerepeket és a szükséges tudást ettől függetlenül tisztázzátok.",
    riskSituations:
      "Újítást igénylő feladatnál vagy olyan döntésnél, amelyhez többek tudására van szükség, hagyjatok időt az eltérő javaslatokra. A gyors megállapodás előtt ellenőrizzétek, nem maradt-e ki fontos szempont.",
    leaderActions: [
      "Vezetőként teremts alkalmat arra, hogy a tagok négyszemközt vagy név nélkül is jelezhessenek problémát",
      "Kisebb projektekben adj másoknak is lehetőséget a munka összefogására",
      "Havonta beszéljetek át egy hibát: mi történt, mit tanultatok belőle, és mit próbáltok másként legközelebb",
    ],
  },

  EVFX: {
    name: "Kreatív Káosz",
    subtitle: "Energikus · Versengő · Rugalmas · Felfedező",
    description:
      "A személyiségprofilok alapján sok új ötletet hozhattok, és határozottan képviselhetitek a saját javaslataitokat. A részletes tervezés kevésbé hangsúlyos, ezért külön figyelmet igényelhet, hogy mibe kezdtek bele együtt.",
    strengths: [
      "Könnyen indíthattok ötletelést",
      "Szívesen kérdőjelezhetitek meg a megszokott megoldásokat",
      "Nyitottak lehettek arra, hogy menet közben változtassatok",
      "Önállóan is kezdeményezhetitek egy ötlet kipróbálását",
    ],
    blindSpots: [
      "Sok vonzó javaslat között nehezebb lehet közösen sorrendet választanotok",
      "Rögzített vállalások nélkül nehezen követhetitek, ki mivel halad",
      "A saját ötleteitek mellett háttérbe szorulhat a közös cél",
      "Újabb ötletbe kezdhettek, mielőtt az előzőt befejeznétek",
    ],
    communicationStyle:
      "A profil alapján gyorsan követhetik egymást az ötletek és az ellenvetések. Egyezzetek meg, hogyan hallgatjátok végig egymást, és mikor választotok a javaslatok közül.",
    idealTasks:
      "Új megközelítések gyűjtésénél, kreatív kampány tervezésénél vagy egy ötletversenyen hasznos lehet a kezdeményezőkészségetek. Az ötletelés végén válasszatok ki egy megvalósítható irányt.",
    riskSituations:
      "Tartós együttműködést és sok egymásra épülő lépést kívánó feladatnál külön figyeljetek a vállalások követésére. Az ötlet és a döntés mellé mindig kerüljön felelős és következő lépés.",
    leaderActions: [
      "Vezetőként egyezz meg a csapattal abban, mit fejeztek be ezen a héten; a munkavégzés módjában hagyj választási lehetőséget",
      "Minden projektnek legyen olyan felelőse, aki követi a vállalásokat és jelzi az elakadásokat",
      "Hetente kérdezd meg: „Melyik közösen kiválasztott feladattal készültünk el?”",
    ],
  },

  EVFP: {
    name: "Farkasfalka",
    subtitle: "Energikus · Versengő · Rugalmas · Pragmatikus",
    description:
      "A személyiségprofilok alapján szívesen kezdeményezhettek, és önálló álláspontot képviselhettek. Inkább a bevált megoldásokhoz fordulhattok, miközben a részletesen rögzített munkamenethez kevésbé ragaszkodhattok.",
    strengths: [
      "Könnyen kezdeményezhettek személyes egyeztetést",
      "Határozottan képviselhetitek a saját javaslatotokat",
      "Szívesen választhatjátok meg a munkavégzés módját",
      "A már kipróbált megoldásokból indulhattok ki",
    ],
    blindSpots: [
      "A saját feladatok mellett kevesebbet beszélhettek a közös célról",
      "Fontos tapasztalat maradhat egyetlen embernél, ha nem adtok időt a tudásmegosztásra",
      "A napi megoldások mellett háttérbe szorulhat a hosszabb távú tervezés",
      "Az új tagok nehezebben tudhatják meg, kitől milyen segítséget kérhetnek",
    ],
    communicationStyle:
      "A profil alapján közel állhat hozzátok a közvetlen, gyakorlati kérdésekről szóló beszélgetés. Érdemes megnéznetek, hogy a saját feladatokon túl is tudtok-e egymás munkájáról.",
    idealTasks:
      "Önálló ügyfélkezelésben vagy gyakorlati problémák megoldásában hasznos lehet a kezdeményezés és a bevált módszerek használata. Beszéljétek át, hol szükséges mégis közösen dönteni.",
    riskSituations:
      "Összetett közös feladatnál, új tag vagy új vezető érkezésekor külön figyeljetek a tapasztalatok átadására. Ne csak az egyeztessen, akinek éppen kérdése van.",
    leaderActions: [
      "Vezetőként tarts heti 30 perces tudásmegosztó kört; osszátok be úgy az időt, hogy mindenki elmondhassa, mit tanult",
      "Válasszatok egy-két olyan közös célt, amelyhez több tag munkájára is szükség van",
      "Az új tag első 30 napjára jelölj ki egy kollégát, aki segít eligazodni a feladatokban és a közös szokásokban",
    ],
  },

  // ── Visszafogott + Összetartó ─────────────────────────

  RCSX: {
    name: "Kutatólabor",
    subtitle: "Visszafogott · Összetartó · Strukturált · Felfedező",
    description:
      "A személyiségprofilok alapján fontos lehet nektek az alapos gondolkodás és az új lehetőségek vizsgálata. Visszafogottabbak lehettek társas helyzetekben, miközben türelemmel fordulhattok egymás felé.",
    strengths: [
      "Szívesen gondolhatjátok át részletesen a feladatokat",
      "Türelemmel hallgathatjátok végig egymás szempontjait",
      "Új ötletekhez is készíthettek részletes tervet",
      "Figyelhettek a feladatok gondos ellenőrzésére",
    ],
    blindSpots: [
      "Az alapos mérlegelés közben túl sokáig halogathatjátok a döntést",
      "Kevesen értesülhetnek a munkátokról, ha ritkán mutatjátok meg másoknak",
      "Az egyetértés keresése miatt későn mondhatjátok ki az ellenvetéseiteket",
      "A csendes átgondolást mások érdektelenségnek vélhetik",
    ],
    communicationStyle:
      "A profil alapján segíthet, ha egy megbeszélés előtt van időtök átgondolni a kérdéseket. Próbáljátok ki, hogy az előre leírt szempontok megkönnyítik-e a közös döntést.",
    idealTasks:
      "Kutatásnál, összetett elemzésnél vagy egy új termék lehetőségeinek vizsgálatánál hasznos lehet az alaposság és a kíváncsiság. Saját munkáitokon nézzétek meg, hogyan egészíti ki egymást a kettő.",
    riskSituations:
      "Szoros határidőnél vagy gyors bemutatónál kevesebb idő jut az elmélyülésre. Előre egyezzetek meg, meddig mérlegeltek, és mit kell mindenképpen átadnotok a többieknek.",
    leaderActions: [
      "Vezetőként hagyj a naptárban megszakítás nélküli időt az elmélyült munkára",
      "Segíts röviden összefoglalni, mi készült el, kinek hasznos, és mi a következő lépés",
      "Szervezz rendszeres bemutatót, ahol a csapat másoknak is megmutathatja az elkészült munkát",
    ],
  },

  RCSP: {
    name: "Csendes Erőd",
    subtitle: "Visszafogott · Összetartó · Strukturált · Pragmatikus",
    description:
      "A személyiségprofilok alapján közel állhat hozzátok az alapos munka és a bevált módszerek követése. Társas helyzetekben visszafogottabbak lehettek, és fontos lehet nektek a türelmes egyeztetés.",
    strengths: [
      "Szívesen követhetitek végig a feladat részleteit",
      "Türelemmel kezelhetitek egymás kéréseit",
      "Előnyben részesíthetitek az előre tervezhető munkamenetet",
      "Jól használhatjátok a már kipróbált eljárásokat",
    ],
    blindSpots: [
      "A megszokott eljáráshoz akkor is ragaszkodhattok, amikor már érdemes lenne változtatni",
      "Kevesen értesülhetnek az eredményeitekről, ha nem beszéltek róluk",
      "Nehezebb lehet új kollégákat bevonnotok a kialakult szokásokba",
      "A napi feladatok mellett kevés idő maradhat új megoldások kipróbálására",
    ],
    communicationStyle:
      "A profil alapján kényelmesebb lehet előre átgondolnotok, mit szeretnétek elmondani. Beszéljétek át, mikor segít az írásos egyeztetés, és mikor lenne jobb közösen megbeszélni egy kérdést.",
    idealTasks:
      "Ismétlődő működési, karbantartási vagy ellenőrzési feladatoknál hasznos lehet az alaposság és a bevált eljárások követése. Beszéljétek át, hol ad ez valódi segítséget a munkátokban.",
    riskSituations:
      "Hirtelen változás vagy szervezeti átalakulás idején mondjátok ki, mire van szükségetek az átálláshoz. Ha a csapat érdekeit kell képviselnetek, készüljetek rövid, konkrét példákkal.",
    leaderActions: [
      "Vezetőként küldj rövid heti összefoglalót az érintetteknek arról, mivel készült el a csapat",
      "Évente kérdezd meg: „Mi az az egy dolog, amin változtatnátok a közös munkában?”",
      "Egy új eszközt először kisebb feladaton próbáljatok ki két hétig, majd beszéljétek át a tapasztalatokat",
    ],
  },

  RCFX: {
    name: "Művésztelep",
    subtitle: "Visszafogott · Összetartó · Rugalmas · Felfedező",
    description:
      "A személyiségprofilok alapján szívesen gondolkodhattok új lehetőségeken, és kevésbé igényelhettek kötött munkamenetet. Társas helyzetekben visszafogottabbak lehettek, miközben türelemmel fogadhatjátok egymás ötleteit.",
    strengths: [
      "Türelemmel hallgathatjátok végig a szokatlan javaslatokat",
      "Szívesen vizsgálhattok meg egy kérdést több oldalról",
      "Teret hagyhattok egymás eltérő megoldásainak",
      "Könnyebben elengedhetitek az eredetileg tervezett munkamenetet",
    ],
    blindSpots: [
      "Mások nehezen követhetik a gondolatmeneteteket, ha csak a saját megszokott kifejezéseiteket használjátok",
      "Az új ötletek keresése közben elhúzódhat a megvalósítás",
      "Az egyetértés kedvéért elmaradhat egy szükséges döntés",
      "Szoros határidőnél nehezebb lehet közös sorrendet választanotok",
    ],
    communicationStyle:
      "A profil alapján az egyéni átgondolás és a kisebb körben folytatott beszélgetés is közel állhat hozzátok. Figyeljétek meg, hogyan tud ezekbe egy új tag bekapcsolódni.",
    idealTasks:
      "Új koncepció, tartalom vagy hosszabb távú elképzelés kidolgozásánál hasznos lehet a kíváncsiság és az egymás ötletei iránti türelem. A feladat végén rögzítsétek, melyik irányt próbáljátok ki.",
    riskSituations:
      "Szoros határidőnél, fontos bemutatónál vagy gyors létszámbővülésnél több közös egyeztetésre lehet szükség. Tisztázzátok, minek kell addigra elkészülnie, és kinek kell megértenie az eredményt.",
    leaderActions: [
      "Vezetőként havonta teremts alkalmat arra, hogy a csapat egy másik csapatnak is bemutassa a munkáját",
      "Egyezzetek meg néhány köztes határidőben, és nézzétek meg együtt, mivel készültetek el addigra",
      "Segíts elmondani az érintetteknek, milyen problémát old meg a munka, és mit tudnak felhasználni belőle",
    ],
  },

  RCFP: {
    name: "Támogató Kör",
    subtitle: "Visszafogott · Összetartó · Rugalmas · Pragmatikus",
    description:
      "A személyiségprofilok alapján türelemmel fordulhattok egymás felé, és inkább a bevált megoldásokat kedvelhetitek. A társas kezdeményezés és a részletes tervezés kevésbé hangsúlyos lehet nálatok.",
    strengths: [
      "Türelemmel fogadhatjátok egymás kéréseit",
      "A már kipróbált megoldásokból indulhattok ki",
      "Könnyebben engedhettek a saját álláspontotokból",
      "Kevésbé ragaszkodhattok egyetlen előírt munkamenethez",
    ],
    blindSpots: [
      "Ritkábban kezdeményezhettek új feladatot, ha a megszokott megoldás is elegendőnek tűnik",
      "Nehezebb lehet olyan döntést hoznotok, amellyel valaki nem ért egyet",
      "Kevesen értesülhetnek az eredményeitekről, ha ritkán mutatjátok meg őket",
      "Később próbálhattok ki új megoldást, ha ragaszkodtok a bevált eljáráshoz",
    ],
    communicationStyle:
      "A profil alapján közel állhat hozzátok a nyugodt, személyes egyeztetés. Beszéljétek át, hogyan hozhatjátok szóba azt is, amiben nem értetek egyet.",
    idealTasks:
      "Kollégák vagy ügyfelek támogatásánál hasznos lehet a türelem és a gyakorlatias megközelítés. Beszéljétek át, mely konkrét helyzetekben segített ez, és hol volt szükség más módszerre.",
    riskSituations:
      "Nehéz visszajelzésnél vagy nagyobb változtatásnál külön figyeljetek arra, hogy az elvárások is világosak legyenek. Mondjátok ki, miben kell megállapodni, akkor is, ha nem értetek mindenben egyet.",
    leaderActions: [
      "Vezetőként egyezz meg a csapattal egy követhető célban, és rendszeresen nézzétek meg, mi készült el",
      "Kezdjétek egy kisebb közös feladattal: mindenki mondja el, mi segítette a munkáját, és min változtatna legközelebb",
      "Egy nagyobb célhoz jelölj ki felelőst, aki összefogja a lépéseket és jelzi, ha elakadtok",
    ],
  },

  // ── Visszafogott + Versengő ───────────────────────────

  RVSX: {
    name: "Sakktábla",
    subtitle: "Visszafogott · Versengő · Strukturált · Felfedező",
    description:
      "A személyiségprofilok alapján szívesen mélyülhettek el új kérdésekben, és fontos lehet nektek az alapos tervezés. Visszafogottabb társas kezdeményezés mellett is határozottan ragaszkodhattok a saját álláspontotokhoz.",
    strengths: [
      "Szívesen vizsgálhatjátok meg a kérdés részleteit",
      "Több lehetséges megoldást is végiggondolhattok",
      "Fontos lehet nektek az érvek alapos ellenőrzése",
      "Önállóan is kereshettek új megközelítéseket",
    ],
    blindSpots: [
      "A saját területeteken elmélyülve későn értesülhettek egymás eredményeiről",
      "Egyeztetés nélkül egymással versengő megoldásokon dolgozhattok",
      "Nehezebb lehet közös döntést hoznotok, ha mindenki a saját érveihez ragaszkodik",
      "A visszafogott kommunikáció miatt másoknak nehezebb lehet megérteni, mikor fordulhatnak hozzátok",
    ],
    communicationStyle:
      "A profil alapján az előre átgondolt érvek és a részletes egyeztetés lehetnek fontosak nektek. Figyeljétek meg, mikor segít az írásos előkészítés, és mikor kell közösen feloldani egy nézeteltérést.",
    idealTasks:
      "Összetett elemzésnél, tervezésnél vagy új megoldások kidolgozásánál hasznos lehet az alaposság és a kíváncsiság. Előre egyezzetek meg abban is, mikor osztjátok meg egymással az eredményeket.",
    riskSituations:
      "Közös döntésnél, ügyfélbeszélgetésnél vagy egy feladat lezárásakor külön figyeljetek arra, hogy ne vesszetek el a részletekben. Tisztázzátok, mikor elegendő a rendelkezésre álló információ a továbblépéshez.",
    leaderActions: [
      "Vezetőként szervezz heti szakmai bemutatót, ahol a tagok elmondhatják, min dolgoztak és mit tanultak",
      "Jelölj ki olyan közös célt, amelyben az egyes részfeladatok eredményeire másoknak is szükségük van",
      "Négyszemközt kérdezd meg a tagokat, mi segíti és mi nehezíti a közös munkájukat",
    ],
  },

  RVSP: {
    name: "Mérnöki Műhely",
    subtitle: "Visszafogott · Versengő · Strukturált · Pragmatikus",
    description:
      "A személyiségprofilok alapján fontos lehet nektek az alapos, önálló munka és a bevált eljárások követése. A társas kezdeményezés kevésbé hangsúlyos, a saját álláspontotokat viszont határozottan képviselhetitek.",
    strengths: [
      "Szívesen dolgozhattok a feladat részletein",
      "Előre megtervezhetitek a munkátokat",
      "Fontos lehet nektek a feladatok pontos elhatárolása",
      "Támaszkodhattok a már kipróbált eljárásokra",
    ],
    blindSpots: [
      "A feladat részletei mellett kevés időt hagyhattok a segítségkérések megbeszélésére",
      "Későn derülhet ki, ha valaki túl sok munkát vállalt",
      "Az új ötleteket könnyen félretehetitek a bevált eljárás mellett",
      "Egyeztetés nélkül egymás mellett haladhattok olyan feladatokban is, amelyek összekapcsolódnak",
    ],
    communicationStyle:
      "A profil alapján közel állhat hozzátok a tárgyszerű, részletekre figyelő egyeztetés. Beszéljétek át, hogy a feladatok mellett az elakadások és a segítségkérések is szóba kerülnek-e.",
    idealTasks:
      "Részletes ellenőrzést vagy bevált eljárások követését igénylő munkáknál hasznos lehet a gondosságotok. A személyiségprofil a szükséges szakmai tudást nem igazolja; azt a feladat tapasztalataival együtt nézzétek meg.",
    riskSituations:
      "Változtatásnál vagy új együttműködés kezdetén külön figyeljetek az elvárások megbeszélésére. Egy bemutató előtt azt is tisztázzátok, mit tud már a hallgatóság, és mit kell elmagyaráznotok.",
    leaderActions: [
      "Vezetőként negyedévente szervezz kötetlen közös alkalmat, például ebédet vagy sétát",
      "Kérdezd meg rendszeresen: „Miben segíthetek?” Hagyj időt a válaszra, majd egyezzetek meg a következő lépésben",
      "Hetente hagyj két órát arra, hogy a tagok egy saját ötletet vagy új módszert kipróbáljanak",
    ],
  },

  RVFX: {
    name: "Szabad Elektronok",
    subtitle: "Visszafogott · Versengő · Rugalmas · Felfedező",
    description:
      "A személyiségprofilok alapján szívesen kereshettek új megközelítéseket, és kevésbé ragaszkodhattok az előírt munkamenethez. Visszafogottabb társas kezdeményezés mellett fontos lehet nektek a saját elképzeléseitek követése.",
    strengths: [
      "Önállóan is kereshettek új megoldásokat",
      "Szívesen vizsgálhattok meg szokatlan kérdéseket",
      "Könnyebben elengedhetitek a korábban kijelölt munkamenetet",
      "Fontos lehet nektek, hogy magatok válasszátok meg a megközelítést",
    ],
    blindSpots: [
      "Az egyéni ötletek mellett háttérbe szorulhat a közös cél",
      "Egyeztetés nélkül ugyanazt a munkát többen is elkezdhetitek",
      "A saját megoldásotok követése közben kevesebb figyelmet fordíthattok egymásra",
      "Nehezebb lehet közös sorrendet választanotok a sok lehetséges irány közül",
    ],
    communicationStyle:
      "A profil alapján kényelmesebb lehet előbb egyedül átgondolnotok egy kérdést. Keressetek olyan közös egyeztetési formát, amelyben az egyéni ötletek másokhoz is eljutnak.",
    idealTasks:
      "Kutatásnál vagy egy új elképzelés első változatának kidolgozásánál hasznos lehet az önálló ötletkeresés. Egyezzetek meg, mikor teszitek egymás mellé a különböző megközelítéseket.",
    riskSituations:
      "Szoros határidőnél vagy több tag munkájára épülő feladatnál külön egyeztessétek az átadásokat. Gyors bővüléskor azt is mondjátok ki, mely döntéseket hozhatja meg mindenki önállóan.",
    leaderActions: [
      "Vezetőként egyezz meg a csapattal egy közös célban; a hozzá vezető munkamenetben hagyj választási lehetőséget",
      "Tarts heti 15 perces egyeztetést, hogy a tagok tudjanak egymás munkájáról és elakadásairól",
      "Adj páros feladatokat, amelyekben a tagok kipróbálhatják, hogyan egészítik ki egymás megközelítését",
    ],
  },

  RVFP: {
    name: "Szabadúszók",
    subtitle: "Visszafogott · Versengő · Rugalmas · Pragmatikus",
    description:
      "A személyiségprofilok alapján az önálló, gyakorlatias megközelítés állhat közel hozzátok. Kevésbé kereshetitek a társas kezdeményezést és a részletesen előírt munkamenetet. Ez önmagában nem mutatja meg, mennyire kötődtök a csapathoz.",
    strengths: [
      "Szívesen dolgozhattok önállóan egy feladaton",
      "Közel állhatnak hozzátok a már kipróbált megoldások",
      "Fontos lehet nektek a munkavégzés módjának megválasztása",
      "Határozottan képviselhetitek a saját szakmai szempontjaitokat",
    ],
    blindSpots: [
      "Az egyéni feladatok mellett ritkábban beszélhettek arról, miért dolgoztok együtt",
      "Fontos tapasztalat maradhat egyetlen embernél, ha csak kérésre osztjátok meg",
      "A saját vállalásaitok mellett háttérbe szorulhatnak a közös határidők",
      "Később kérhettek visszajelzést, ha magatok szeretnétek megoldani az elakadást",
    ],
    communicationStyle:
      "A profil alapján inkább egy konkrét feladat miatt kezdeményezhettek egyeztetést. Beszéljétek át, milyen információt kell akkor is megosztanotok, ha senki nem kérdez rá külön.",
    idealTasks:
      "Jól elkülöníthető, gyakorlatias feladatoknál hasznos lehet az önálló munkavégzés iránti igényetek. Előre tisztázzátok, hol kapcsolódik össze a munkátok, és mikor szükséges egyeztetni.",
    riskSituations:
      "Szoros együttműködést igénylő feladatnál vagy hosszabb távú tervezésnél tudatosan szánjatok időt a közös célokra. Attól, hogy mindenki halad a saját részével, az összekapcsolódó feladatok még elakadhatnak.",
    leaderActions: [
      "Vezetőként tisztázd a csapattal, mely feladatokhoz kell valóban együtt dolgozni, és ezekhez milyen egyeztetés szükséges",
      "Vezessetek be egy közös szokást, például heti rövid egyeztetést vagy havi visszatekintést, és rendszeresen térjetek vissza rá",
      "A közös projekt elején beszéljétek át, kinek a munkája mire épül, és mikor kell átadnia az eredményt a többieknek",
    ],
  },
};

/**
 * Kanonikus mintázat-tábla: tartalom innen, NÉV a pattern-data-ból
 * (egy név-tábla elv – a literál `name` csak fallback).
 */
export const PATTERN_NAMES: Record<string, PatternContent> = Object.fromEntries(
  Object.entries(PATTERN_CONTENT).map(([code, content]) => [
    code,
    { ...content, name: patternPublicName(code) ?? content.name },
  ]),
);

// ============================================================
// UI LABELS – a frontend számára
// ============================================================

export const AXIS_LABELS = {
  drive:      { name: "Hajtóerő",  low: "Visszafogott", high: "Energikus" },
  cohesion:   { name: "Kohézió",   low: "Versengő",     high: "Összetartó",
    tooltip: "A barátságosság és a méltányosság dimenzióinak átlagából képzett közelítő jelző." },
  discipline: { name: "Fegyelem",  low: "Rugalmas",     high: "Strukturált" },
  openness:   { name: "Nyitottság",low: "Pragmatikus",  high: "Felfedező" },
} as const;
