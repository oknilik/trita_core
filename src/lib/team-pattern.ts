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
      ? "A csapat mintázata stabil — minden tengely egyértelműen az egyik pólus felé hajlik."
      : stability === "közepes"
      ? `A csapat ${unstableAxes.length} tengelyen közel van a középértékhez. A mintázat változhat új tagokkal vagy idővel.`
      : `A csapat ${unstableAxes.length} tengelyen közel van a középértékhez. A jelenlegi mintázat erősen kontextusfüggő — kisebb változások is más képet adhatnak.`;

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
    // (a fogyasztó a tensionAxes darabszámát használja) — a deviations map és
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
    fullLabel: `${patternName} — ${divSuffix}`,

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
// 16 CSAPATMINTA — TARTALOM
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
// (PATTERNS[bináris kulcs].alias) — a /patterns felfedező ugyanazt a
// név-családot mutatja elsődleges címkeként, így a riport és a marketing
// egy nyelvet beszél. Az alábbi tartalom-táblában maradó `name` literál
// csak VÉSZ-fallback (ha egy kód nem oldódna fel a pattern-data-ban);
// a kanonikus PATTERN_NAMES export a nevet a pattern-data-ból veszi.

/** Tengelyenkénti pólus-betűpárok [magas, alacsony] — drive/cohesion/discipline/openness. */
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
      "Gyors tempójú, jól szervezett csapat, amely szeret új utakat keresni, miközben a tagok számítanak egymásra. Az újítás és a fegyelmezett végrehajtás egyszerre van jelen a működésében.",
    strengths: [
      "Új ötleteket gyorsan, rendszeresen képes megvalósítani",
      "Erős belső kohézió — a tagok egymást támogatják",
      "Strukturált munkavégzés, mégis nyitott a változásra",
      "Lendületes jelenlét, amely a külső partnereket is magával ragadhatja",
    ],
    blindSpots: [
      "A tempó kiégéshez vezethet — a csapat nem mindig ismeri fel a saját korlátait",
      "Az újdonság iránti vonzalom elterelheti a fókuszt az alapfeladatokról",
      "A nagy összetartás csoportgondolkodáshoz vezethet: előfordulhat, hogy senki nem mond ellent",
      "A struktúra rugalmatlanná válhat, ha túl sok szabállyal terhelik a folyamatokat",
    ],
    communicationStyle:
      // A kohézió-tengely a Barátságosság + Becsületesség-Alázat átlaga — az
      // „empatikus" ezen a tengelyen ugyanaz a túl-ígéret, amit a pattern-data
      // két sorából is kivezettünk (2026-08-11): a Barátságosság türelmet és
      // megbocsátást mér, nem empátiát.
      "Gyors, közvetlen, de türelmes. Szeretik a rövid napi egyeztetéseket és a vizuális terveket. Az ötletelés szabad, a döntés utáni végrehajtás viszont fegyelmezett.",
    idealTasks:
      "Új termékek fejlesztése, rövid fejlesztési ciklusok, stratégiai irányváltás — minden olyan helyzet, ahol egyszerre kell kreativitás és megvalósítási képesség.",
    riskSituations:
      "Hosszú, monoton projektek; konfliktuskerülés, ami elfojtott feszültséghez vezet; túl sok párhuzamos kezdeményezés.",
    leaderActions: [
      "Építs be rendszeres „lassító napokat” az intenzív munkaszakaszok közé, hogy legyen idő az áttekintésre és a tanulásra",
      "Jelölj ki egy „ördög ügyvédjét” a nagyobb döntéseknél a csoportgondolkodás ellen",
      "Korlátozd a párhuzamos projektek számát — egyszerre legfeljebb két kezdeményezés legyen aktív",
    ],
  },

  ECSP: {
    name: "Végrehajtó Egység",
    subtitle: "Energikus · Összetartó · Strukturált · Pragmatikus",
    description:
      "Fegyelmezett, összetartó csapat, amely a bevált módszereket hatékonyan alkalmazza. A megbízhatóság és a kiszámíthatóság az erősségük.",
    strengths: [
      "Megbízható végrehajtás — amit megígérnek, azt teljesítik",
      "Erős csapatszellem, alacsony belső súrlódás",
      "Jól működő folyamatok és rutinok",
      "Megbízható, kiszámítható teljesítmény",
    ],
    blindSpots: [
      "Az új megközelítések ritkábban jelennek meg — a megszokott keretekből való kilépéshez külső ösztönzésre lehet szükség",
      "A gyakorlatias szemlélet mellett ellenállás alakulhat ki az új eszközökkel és módszerekkel szemben",
      "A harmonikus felszín alatt elfojtott feszültségek halmozódhatnak",
      "Külső változásokra lassabban reagálhatnak",
    ],
    communicationStyle:
      "Világos, rendezett és feladatközpontú. Szeretik a napirendeket, a rövid egyeztetéseket és a dokumentált döntéseket.",
    idealTasks:
      "Ismétlődő, magas minőségű teljesítés; operatív működés; ügyfélkiszolgálás; szigorú szabályozási követelményű projektek.",
    riskSituations:
      "Gyors alkalmazkodást igénylő piaci változás; a rutint átalakító új vezető; olyan helyzet, amelyben nincs egyértelmű válasz a megvalósítás módjára.",
    leaderActions: [
      "Negyedévente tarts „mi lenne, ha?” műhelymunkát, és dolgozzatok ki több lehetséges forgatókönyvet",
      "Hozz be külső nézőpontot: vendégelőadót, csapatok közötti projektet vagy iparági összehasonlítást",
      "Ismerj el láthatóan egy sikeres kísérletet — ezzel jelzed, hogy az újításnak értéke van",
    ],
  },

  ECFX: {
    name: "Kreatív Kommuna",
    subtitle: "Energikus · Összetartó · Rugalmas · Felfedező",
    description:
      "Kötetlenül működő, újító csapat, amelyben erős az összetartás, és a tagok szívesen kísérleteznek. A kreativitás és az összetartozás ad lendületet a munkájuknak.",
    strengths: [
      "Erős kreatív energia — könnyen elindul az ötletelés",
      "Erős bizalom és pszichológiai biztonság",
      "Gyorsan alkalmazkodnak változó körülményekhez",
      "Vonzó kultúra — a tagok szívesen maradnak",
    ],
    blindSpots: [
      "A struktúra hiánya kaotikus végrehajtáshoz vezethet",
      "Nehéz lehet fontossági sorrendet kialakítani — minden ötlet egyformán vonzónak tűnhet",
      "A határidők jellemzően nem a legfontosabb értékük",
      "A harmonikus légkör miatt nehéz lehet kritikus visszajelzést adni",
    ],
    communicationStyle:
      "Informális, szabad asszociációkra épülő és gyakran spontán. Sok az ötletelés, kevés a formális megbeszélés.",
    idealTasks:
      "Korai koncepcióalkotás, ötletelés, tervezési műhelyek és márkaépítés — minden olyan feladat, amely szerteágazó gondolkodást kíván.",
    riskSituations:
      "Összetett, többlépéses projekt szoros határidővel; szabályozott feladatok; olyan helyzetek, ahol a befejezés fontosabb az ötletelésnél.",
    leaderActions: [
      "Vezess be könnyű kereteket: hetente egyszer tekintsétek át a prioritásokat, de ne szabályozd túl a működést",
      "Használj „ötletparkolót” — az ötleteket rögzítsd, de ne fusson mind egyszerre",
      "A megvalósítási szakaszban szervezz közös munkát egy szervezettebben működő csapattal",
    ],
  },

  ECFP: {
    name: "Családi Vállalkozás",
    subtitle: "Energikus · Összetartó · Rugalmas · Pragmatikus",
    description:
      "Aktív, lojális csapat, amely a bevált utakon halad, de rugalmasan alkalmazkodik. Az elkötelezettség az összetartó erő.",
    strengths: [
      "Erős lojalitás és csapatidentitás",
      "Gyakorlatias döntéshozatal",
      "Rugalmasan kezelik a váratlan helyzeteket",
      "Tartósabb elköteleződés alakulhat ki",
    ],
    blindSpots: [
      "A lojalitás akadályozhatja a szükséges változásokat",
      "A gyakorlatias szemlélet mellett háttérbe szorulhatnak a hosszabb távú szempontok",
      "Kizárhatják a külső nézőpontokat — „mi tudjuk, hogyan kell”",
      "A rugalmasság néha tervezetlenséget jelenthet",
    ],
    communicationStyle:
      "Közvetlen, személyes, néha informális a kelleténél. A döntések gyakran a folyosón születnek.",
    idealTasks:
      "Ügyfélkapcsolat, értékesítés, operatív működés és gyors problémamegoldás — minden olyan feladat, ahol számít a személyes kapcsolat és a gyors reagálás.",
    riskSituations:
      "Gyors növekedés; új tagok beillesztése; stratégiai tervezés; technológiai korszerűsítés.",
    leaderActions: [
      "Formalizáld a döntéshozatalt: a fontos döntéseket dokumentáld",
      "Tudatosan hozz be új tagokat és gondoskodj beilleszkedésükről",
      "Évente egyszer kérdezd meg: „mit csinálnánk másképp, ha ma alapítanánk a csapatot?”",
    ],
  },

  // ── Energikus + Versengő ──────────────────────────────

  EVSX: {
    name: "Versenygép",
    subtitle: "Energikus · Versengő · Strukturált · Felfedező",
    description:
      "Nagy intenzitással működő, teljesítményközpontú csapat, amely szervezett keretek között versenyez és újít.",
    strengths: [
      "Erős egyéni teljesítmény",
      "Erős belső motiváció",
      "Szervezett keretek között gyorsan viszik végig az újításokat",
      "Gyorsan reagál piaci lehetőségekre",
    ],
    blindSpots: [
      "A versengés alááshatja az együttműködést, és csökkentheti a tudásmegosztást",
      "Nagy terhelés és a kimerülés veszélye",
      "„Nyertes–vesztes” dinamika",
      "Az egyéni siker fontosabbá válhat a csapatcélnál",
    ],
    communicationStyle:
      "Közvetlen, eredményközpontú, néha konfrontatív. A vitákban az adatokra és az eredményekre támaszkodnak.",
    idealTasks:
      "Értékesítési versenyek, fejlesztői ötletversenyek, gyors prototípuskészítés és éles piaci versenyhelyzetek.",
    riskSituations:
      "Hosszan tartó, szoros együttműködést igénylő projektek; mentorálás; csapatépítés.",
    leaderActions: [
      "Az egyéni mutatók mellett vezess be közös, csapatszintű teljesítménymutatókat is",
      "Strukturálj páros feladatokat, ahol a siker kölcsönös",
      "Figyelj a kiégés jeleire — a nagy energia mögött gyakran kimerülés van",
    ],
  },

  EVSP: {
    name: "Hadsereg",
    subtitle: "Energikus · Versengő · Strukturált · Pragmatikus",
    description:
      "Fegyelmezett, eredményorientált csapat, erős hierarchiával és gyors végrehajtással.",
    strengths: [
      "Gyors végrehajtás",
      "Egyértelmű felelősségek és elvárások",
      "Kevés a bizonytalanság az elvárások körül — a tagok tudják, mit várnak tőlük",
      "Kiszámítható, magas teljesítmény",
    ],
    blindSpots: [
      "A profil alapján felmerülhet, hogy a hibák kimondása nehezebb — ezt a pszichológiai biztonság pulzusmérése tudja megerősíteni vagy cáfolni",
      "A hierarchia elfojthatja az alulról jövő ötleteket",
      "Rövid távú gondolkodás",
      "Nagyobb lehet a fluktuáció — aki nehezen tartja a tempót, könnyebben továbbállhat",
    ],
    communicationStyle:
      "Felülről lefelé, tömör, utasításjellegű. A megbeszélések rövidek és döntésközpontúak.",
    idealTasks:
      "Operatív kihívások szoros határidővel, gyors helyreállítás és válságkezelés.",
    riskSituations:
      "Innovációs projektek; tehetségmegtartás; olyan döntések, amelyekhez a teljes csapat tudására szükség van.",
    leaderActions: [
      "Hozz létre biztonságos fórumot, ahol a tagok névtelenül jelezhetnek problémákat",
      "Váltogasd a vezetői szerepeket az egyes projektekben",
      "Tartsatok havi tanulságkört, amelyben a hibákat tanulási lehetőségként, nem kudarcként kezelitek",
    ],
  },

  EVFX: {
    name: "Kreatív Káosz",
    subtitle: "Energikus · Versengő · Rugalmas · Felfedező",
    description:
      "Lendületes, ösztönösen reagáló csapat, amelyben mindenki a saját ötletét hajtja, a közös energia mégis előreviszi a munkát.",
    strengths: [
      "Nagy kreatív energia és lendület",
      "Bátor, konvenciókon túllépő ötletek",
      "Gyors alkalmazkodás",
      "Vonzó kreatív tehetségek számára",
    ],
    blindSpots: [
      "A fontossági sorrend kialakítása jellemzően nehéz",
      "Kaotikus végrehajtás",
      "Az összetartás hiányozhat — az egyéni ambíciók dominálhatnak",
      "Döntések születnek, de a megvalósításuk elmaradhat",
    ],
    communicationStyle:
      "Hangos és gyors: a tagok gyakran egymás szavába vágnak. Az ötletelés spontán, a döntések pedig gyakran kevés előkészítéssel születnek.",
    idealTasks:
      "Korai ötletalkotás, kreatív kampányok és fejlesztői ötletversenyek.",
    riskSituations:
      "Minden olyan feladat, amely tartós, szervezett együttműködést és fegyelmezett végrehajtást igényel.",
    leaderActions: [
      "Adj egyértelmű keretet: „ezen a héten ezt fejezzük be” — a megvalósítás módját bízd rájuk",
      "Párosíts minden projektet egy végrehajtó partnerrel",
      "Hetente kérdezzétek meg: „mi az az egy dolog, amelyet közösen eldöntöttünk és végig is vittünk?”",
    ],
  },

  EVFP: {
    name: "Farkasfalka",
    subtitle: "Energikus · Versengő · Rugalmas · Pragmatikus",
    description:
      "Erős egyéniségek laza szövetségben, akik a saját területükön vadásznak, de szükség esetén összezárnak.",
    strengths: [
      "Gyorsan alkalmazkodnak",
      "Erős egyéni teljesítmény és felelősségvállalás",
      "Önállóan szervezik a munkájukat, ezért kevés közvetlen irányítást igényelnek",
      "Jól kezelik a bizonytalanságot",
    ],
    blindSpots: [
      "Gyenge csapatidentitás",
      "Kevés tudásmegosztás",
      "A rövid távú, gyakorlatias szemlélet háttérbe szoríthatja a hosszabb távú célokat",
      "Az új tagok nehezebben illeszkedhetnek be",
    ],
    communicationStyle:
      "Tömör és eredményközpontú. Többnyire csak akkor kommunikálnak, amikor arra a feladat elvégzéséhez szükség van.",
    idealTasks:
      "Értékesítés, üzletfejlesztés és önálló ügyfélkezelés.",
    riskSituations:
      "Összetett együttműködés; csapatépítés; tudásmegosztás; vezetőváltás.",
    leaderActions: [
      "Heti 30 perces tudásmegosztó kör — mindenki 5 percben elmondja, mit tanult",
      "Jelöljetek ki 1–2 olyan közös csapatcélt, amelyet csak együtt érhettek el",
      "Tervezzétek meg tudatosan az új tagok beillesztését, és az első 30 napra jelöljetek ki melléjük mentort",
    ],
  },

  // ── Visszafogott + Összetartó ─────────────────────────

  RCSX: {
    name: "Kutatólabor",
    subtitle: "Visszafogott · Összetartó · Strukturált · Felfedező",
    description:
      "Csendes, elmélyülten gondolkodó csapat, amely módszeresen fedez fel új területeket. Működése a minőségre és az alaposságra épül.",
    strengths: [
      "Mély, alapos munkavégzés",
      "Erős belső bizalom és kölcsönös tisztelet",
      "Módszeres újítás — átgondolt, nem kapkodó",
      "Alacsony hibaarány, magas minőség",
    ],
    blindSpots: [
      "A túlzott tökéletességre törekvés megakaszthatja a döntéseket",
      "A csapat munkája kifelé nehezen látható, ezért könnyen észrevétlen maradhat",
      "A konfliktusok kerülése felgyülemlett feszültséghez vezethet",
      "Kívülről passzivitásnak tűnhet",
    ],
    communicationStyle:
      "Átgondolt, írásos, részletes. Ritka, de alapos megbeszélések.",
    idealTasks:
      "Kutatás, összetett elemzés, a termékfejlesztés korai szakasza és minőségbiztosítás.",
    riskSituations:
      "Szoros határidők; prezentációk; egyeztetés az érintettekkel; gyors kommunikáció.",
    leaderActions: [
      "Adj elegendő időt a mélymunkához — védd meg a felesleges megbeszélésektől",
      "Segíts a csapatnak érthetően bemutatni és láthatóvá tenni a munkáját",
      "Tartsatok rendszeres bemutatót az elkészült munkáról — ez növeli a csapat láthatóságát",
    ],
  },

  RCSP: {
    name: "Csendes Erőd",
    subtitle: "Visszafogott · Összetartó · Strukturált · Pragmatikus",
    description:
      "Megbízható, csendes csapat, amely stabilan, kiszámíthatóan teljesít. „Nem szól, de megcsinálja.”",
    strengths: [
      "Nagy megbízhatóság",
      "Erős belső összetartás és lojalitás",
      "Nyugodt, stabil működés",
      "Jól kezelik a rutinfeladatokat",
    ],
    blindSpots: [
      "Ellenállás a változással szemben — „eddig is így csináltuk”",
      "Kívülről könnyen láthatatlanok maradnak",
      "A csapat zárt lehet kívülállók felé",
      "Az innováció háttérbe szorulhat",
    ],
    communicationStyle:
      "Halk, rendezett és ritka. Többnyire akkor kommunikálnak, amikor szükséges; írásban könnyebben fejezik ki magukat, mint szóban.",
    idealTasks:
      "Operatív működés, karbantartás, minőségbiztosítás és háttérirodai feladatok.",
    riskSituations:
      "Hirtelen piaci változás; szervezeti átalakulás; „hangos” érdekképviselet.",
    leaderActions: [
      "Tedd láthatóvá a csapat munkáját — küldjetek heti összefoglalót az érintetteknek",
      "Évente egyszer kérdezd meg: „Mi az az egy dolog, amelyen változtatnátok?”",
      "Indíts apró, biztonságos kísérleteket — például: „Próbáljuk ki ezt az eszközt két hétig.”",
    ],
  },

  RCFX: {
    name: "Művésztelep",
    subtitle: "Visszafogott · Összetartó · Rugalmas · Felfedező",
    description:
      "Visszafogott, kreatív közösség, amely erős bizalommal és nagy szabadságban alkot.",
    strengths: [
      "Magas pszichológiai biztonság",
      "Mély, eredeti gondolkodás",
      "Erős belső kultúra és értékek",
      "A tagok tartósan elköteleződnek",
    ],
    blindSpots: [
      "Nehéz lehet a külvilággal kommunikálni — „saját nyelv”",
      "Lassú végrehajtás",
      "A belső harmónia fontosabb lehet, mint az eredmény",
      "A külső nyomást és a határidőket nehezebben kezelhetik",
    ],
    communicationStyle:
      "Mély és személyes; a tagok kevés szóból is érthetik egymást. Kívülállóként nehezebb lehet bekapcsolódni.",
    idealTasks:
      "Koncepciófejlesztés, UX-kutatás, stratégiai gondolkodás és tartalomkészítés.",
    riskSituations:
      "Szoros határidők; nagy téttel járó prezentáció; nehéz egyeztetés az érintettekkel; gyors létszám- vagy feladatbővülés.",
    leaderActions: [
      "Havonta egyszer forduljatok kifelé: mutassátok be a munkátokat egy másik csapatnak",
      "Jelöljetek ki néhány könnyen követhető mérföldkövet — ne ellenőrzésként, hanem a közös ritmust adó kapaszkodóként",
      "Segíts üzleti szempontból is érthetően bemutatni a munkát az érintetteknek",
    ],
  },

  RCFP: {
    name: "Támogató Kör",
    subtitle: "Visszafogott · Összetartó · Rugalmas · Pragmatikus",
    description:
      "Csendes, gondoskodó csapat, amely egymásra figyel, és gyakorlatias megoldásokat keres.",
    strengths: [
      "Erős belső támogatás — a tagok számíthatnak egymásra",
      "Gyakorlatias, kézzelfogható megoldásokra építő gondolkodás",
      "Kevés nyílt konfliktus és erős bizalom",
      "Jó alkalmazkodóképesség",
    ],
    blindSpots: [
      "A csapat ritkábban keresi magától a kihívást — a nagyobb célok külső kijelölést igényelhetnek",
      "A kemény döntések meghozatala nehezükre eshet",
      "A munkájuk kívülről könnyen láthatatlan maradhat",
      "Az újítás háttérbe szorulhat, ha a gyakorlatias szemlélet a megszokotthoz való ragaszkodássá válik",
    ],
    communicationStyle:
      "Meleg, személyes, támogató. Sok informális beszélgetés, kevés formális megbeszélés.",
    idealTasks:
      "HR, ügyfélszolgálat, belső támogatás és mentorálás.",
    riskSituations:
      "Teljesítményértékelés; nehéz visszajelzés; nagyra törő célok; versengő környezet.",
    leaderActions: [
      "Határozzatok meg mérhető célokat — a látható eredmények erősíthetik a csapat önbizalmát",
      "Gyakoroljátok a konstruktív visszajelzést — kis, biztonságos témákkal",
      "Keress valakit a csapatban, aki vállalja a nagyobb célok képviseletét",
    ],
  },

  // ── Visszafogott + Versengő ───────────────────────────

  RVSX: {
    name: "Sakktábla",
    subtitle: "Visszafogott · Versengő · Strukturált · Felfedező",
    description:
      "Elemző, stratégiai gondolkodású csapat, amelyben mindenki csendben, de intenzíven építi a saját területét.",
    strengths: [
      "Nagy szakmai mélység",
      "Stratégiai gondolkodás — több lépéssel előre",
      "Adatokra épülő döntéshozatal",
      "Jelentős tér a szakterületen belüli újításra",
    ],
    blindSpots: [
      "Silók alakulhatnak ki — a tudásmegosztás akadozhat",
      "Rejtett rivalizálás",
      "Nehéz lehet közös döntést hozni",
      "Kívülről hidegnek, elérhetetlennek tűnhetnek",
    ],
    communicationStyle:
      "Pontos, adatokra építő és formális. A viták tárgyszerűek; az egyeztetést inkább írásban végzik.",
    idealTasks:
      "Stratégiai tervezés, adatelemzés, összetett problémamegoldás és műszaki rendszertervezés.",
    riskSituations:
      "Csapatépítés; ügyfélkommunikáció; az „elég jó” és a „tökéletes” közötti döntési helyzetek.",
    leaderActions: [
      "Tartsatok strukturált tudásmegosztást — például heti szakmai bemutatót vagy tanulságkört",
      "Jelöljetek ki olyan közös csapatcélokat, amelyeket csak együttműködéssel érhettek el",
      "Négyszemközt kérdezd meg a tagokat, hogyan érzik magukat a csapatban",
    ],
  },

  RVSP: {
    name: "Mérnöki Műhely",
    subtitle: "Visszafogott · Versengő · Strukturált · Pragmatikus",
    description:
      "Precíz, feladatközpontú csapat, amelyben mindenki a saját szakterületére összpontosít.",
    strengths: [
      "Erős műszaki és szakmai felkészültség",
      "Hatékonyan bánnak az idővel",
      "Egyértelmű felelősségi körök",
      "Magas minőségű, megbízható eredmények",
    ],
    blindSpots: [
      "Kevés tér maradhat az érzelmi kapcsolódásra — „csak a munka számít”",
      "Kiégés veszélye",
      "Új ötletek nehezebben kaphatnak teret",
      "Inkább egymás mellett dolgozó szakértőkként működhetnek, mint összehangolt csapatként",
    ],
    communicationStyle:
      "Tömör és szakmai. Részletesen dokumentálnak, a kötetlen beszélgetés viszont ritka.",
    idealTasks:
      "Fejlesztés, mérnöki munka, pénzügy és ellenőrzés.",
    riskSituations:
      "Csapatépítés; változások kezelése; ügyfélprezentáció; az emberi kapcsolatokra épülő helyzetek.",
    leaderActions: [
      "Negyedévente szervezzetek kötetlen közös programot — például ebédet vagy sétát",
      "Kérdezd meg rendszeresen: „Miben segíthetek?” Itt a tagok ritkán kérnek maguktól segítséget",
      "Hetente biztosíts két órát a saját ötletekre és a kísérletezésre",
    ],
  },

  RVFX: {
    name: "Szabad Elektronok",
    subtitle: "Visszafogott · Versengő · Rugalmas · Felfedező",
    description:
      "Független, kreatív egyéniségek laza hálózata, amelyet a kíváncsiság és az intellektuális izgalom köt össze.",
    strengths: [
      "Erős egyéni kreativitás és önállóság",
      "Mély, eredeti gondolkodás",
      "Rugalmasan kezelik a bizonytalanságot",
      "Vonzó lehet az önállóságot kereső tehetségek számára",
    ],
    blindSpots: [
      "A csapatidentitás jelei gyengék lehetnek",
      "Kevés az összehangolás, ezért egymást átfedő munkák indulhatnak",
      "A versengés és a nagy önállóság elszigetelődéshez vezethet",
      "Nehéz lehet őket közös irányba terelni",
    ],
    communicationStyle:
      "Ritka, de elmélyült és többnyire négyszemközti. A csoportos kommunikáció kevésbé gördülékeny.",
    idealTasks:
      "Kutatás, korai innováció, kreatív fejlesztés.",
    riskSituations:
      "Csapatszintű összehangolás; szoros határidők; ügyfélkiszolgálás; a működés gyors bővítése.",
    leaderActions: [
      "Jelöljetek ki egyetlen közös iránytűt: legyen világos a cél, az odavezető út pedig maradjon szabad",
      "Tartsatok heti 15 perces rövid egyeztetést — nem ellenőrzésként, hanem azért, hogy tudjatok egymás munkájáról",
      "Párosítsd a tagokat közös projektekre, hogy természetes együttműködési helyzetek alakuljanak ki",
    ],
  },

  RVFP: {
    name: "Szabadúszók",
    subtitle: "Visszafogott · Versengő · Rugalmas · Pragmatikus",
    description:
      "Független, gyakorlatias egyéniségek; az elköteleződésük inkább a feladathoz, mint a csapathoz kötődik. A kapcsolódásukat elsősorban az elvégzendő munka határozza meg.",
    strengths: [
      "Erős egyéni teljesítmény és önállóság",
      "Gyors, gyakorlatias egyéni döntések",
      "Kevés közvetlen irányítással is működhetnek",
      "Nagy egyéni mozgástér",
    ],
    blindSpots: [
      "A közös csapatidentitás jelei gyengék",
      "A tudásmegosztás jellemzően alkalomszerű — ha valaki elmegy, a tudása is vele mehet",
      "Az elköteleződés inkább a feladathoz, mint a csapathoz kötődik",
      "A vezetői visszajelzés nehezebben épülhet be a működésükbe",
    ],
    communicationStyle:
      "Minimális és feladatközpontú. Csak a szükséges információt osztják meg egymással.",
    idealTasks:
      "Egyéni feladatok párhuzamos végrehajtása — önálló szakértők működése szervezeti keretek között.",
    riskSituations:
      "Valódi csapatmunkát igénylő feladatok, kultúraépítés és hosszú távú tervezés.",
    leaderActions: [
      "Tedd fel a kérdést: „Valóban csapatként kell működniük?” — ha igen, építsd tudatosan a közös kultúrát",
      "Vezessetek be egy közös szokást — heti rövid egyeztetést vagy havi visszatekintést —, és tartsátok következetesen",
      "Úgy osszátok ki a projekteket, hogy a tagok eredményei egymásra épüljenek — ez valódi egymásrautaltságot teremt",
    ],
  },
};

/**
 * Kanonikus mintázat-tábla: tartalom innen, NÉV a pattern-data-ból
 * (egy név-tábla elv — a literál `name` csak fallback).
 */
export const PATTERN_NAMES: Record<string, PatternContent> = Object.fromEntries(
  Object.entries(PATTERN_CONTENT).map(([code, content]) => [
    code,
    { ...content, name: patternPublicName(code) ?? content.name },
  ]),
);

// ============================================================
// UI LABELS — a frontend számára
// ============================================================

export const AXIS_LABELS = {
  drive:      { name: "Hajtóerő",  low: "Visszafogott", high: "Energikus" },
  cohesion:   { name: "Kohézió",   low: "Versengő",     high: "Összetartó",
    tooltip: "A barátságosság és a méltányosság dimenzióinak átlagából képzett közelítő jelző." },
  discipline: { name: "Fegyelem",  low: "Rugalmas",     high: "Strukturált" },
  openness:   { name: "Nyitottság",low: "Pragmatikus",  high: "Felfedező" },
} as const;
