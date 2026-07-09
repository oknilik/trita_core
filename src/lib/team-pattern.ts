// src/lib/team-pattern.ts

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
  emotionality: number;
  honesty: number;
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
  deviations: Record<string, number>;
  patternDistance: number; // 0 = tökéletesen rajta, magasabb = távolabb
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
export interface HexacoScores {
  H: number;
  E: number;
  X: number;
  A: number;
  C: number;
  O: number;
}

// ============================================================
// KÜSZÖBÖK — 0–100 skálán (Trita normatív mintából kalibrálandó)
// Konverzió: 1–5 Likert → ((v − 1) / 4) × 100
//   3.2 → 55  |  3.4 → 60  |  3.5 → 62.5  |  3.3 → 57.5
// ============================================================

const THRESHOLDS = {
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

// Stabilitáshoz: ennyi distance-en belül "instabil" a tengely (0.15 → 3.75%)
const STABILITY_THRESHOLD = 3.75;

// Diverzitás (szórás) sávok (0–100 skálán)
const DIVERSITY_LOW  = 10;   // ez alatt "homogén"
const DIVERSITY_HIGH = 20;   // ez felett "diverz"

// ============================================================
// SEGÉDFÜGGVÉNYEK
// ============================================================

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((s, v) => s + v, 0) / values.length;
}

function stddev(values: number[]): number {
  if (values.length < 2) return 0;
  const avg = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - avg) ** 2)));
}

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
  members: Array<{ userId: string; scores: HexacoScores }>
): TeamPatternResult | null {
  if (members.length < 3) return null;

  const allScores = members.map((m) => m.scores);

  // ── 1. Tengely értékek ──────────────────────────────────
  const rawAxes: TeamAxes = {
    drive:      mean(allScores.map((s) => s.X)),
    cohesion:   mean(allScores.map((s) => (s.A + s.H) / 2)),
    discipline: mean(allScores.map((s) => s.C)),
    openness:   mean(allScores.map((s) => s.O)),
  };

  const rawDiversity: TeamDiversity = {
    drive:        stddev(allScores.map((s) => s.X)),
    cohesion:     stddev(allScores.map((s) => (s.A + s.H) / 2)),
    discipline:   stddev(allScores.map((s) => s.C)),
    openness:     stddev(allScores.map((s) => s.O)),
    emotionality: stddev(allScores.map((s) => s.E)),
    honesty:      stddev(allScores.map((s) => s.H)),
  };

  // ── 2. Tengely részletek ────────────────────────────────
  const axisEntries: [string, number, number, number][] = [
    ["drive",      rawAxes.drive,      THRESHOLDS.drive,      rawDiversity.drive],
    ["cohesion",   rawAxes.cohesion,   THRESHOLDS.cohesion,   rawDiversity.cohesion],
    ["discipline", rawAxes.discipline, THRESHOLDS.discipline, rawDiversity.discipline],
    ["openness",   rawAxes.openness,   THRESHOLDS.openness,   rawDiversity.openness],
  ];

  const axes: Record<string, AxisDetail> = {};
  const unstableAxes: string[] = [];

  for (const [name, value, threshold, div] of axisEntries) {
    const dist = Math.abs(value - threshold);
    if (dist <= STABILITY_THRESHOLD) unstableAxes.push(name);

    axes[name] = {
      value,
      grade: gradeAxis(value, threshold),
      diversity: div,
      diversityLabel: diversityLabel(div),
      distanceFromThreshold: dist,
    };
  }

  // ── 3. Mintakód (domináns 4 betű) ──────────────────────
  const patternCode = [
    poleLetter(rawAxes.drive,      THRESHOLDS.drive,      "E", "R"),
    poleLetter(rawAxes.cohesion,   THRESHOLDS.cohesion,   "C", "V"),
    poleLetter(rawAxes.discipline, THRESHOLDS.discipline, "S", "F"),
    poleLetter(rawAxes.openness,   THRESHOLDS.openness,   "X", "P"),
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
      deviations,
      patternDistance: mean(Object.values(deviations)),
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

export const PATTERN_NAMES: Record<string, PatternContent> = {

  // ── Energikus + Összetartó ─────────────────────────────

  ECSX: {
    name: "Innovátor Gépezet",
    subtitle: "Energikus · Összetartó · Strukturált · Felfedező",
    description:
      "Gyorsan mozgó, jól szervezett csapat, amely szeret új utakat keresni és közben egymásra számít. Az innováció és a végrehajtás ritka kombinációja.",
    strengths: [
      "Új ötleteket gyorsan, rendszeresen képes megvalósítani",
      "Erős belső kohézió — a tagok egymást támogatják",
      "Strukturált munkavégzés, mégis nyitott a változásra",
      "Magas energia, ami magával ragadja a külső partnereket is",
    ],
    blindSpots: [
      "A tempó kiégéshez vezethet — a csapat nem mindig ismeri fel a saját korlátait",
      "Az újdonság iránti vonzalom elterelheti a fókuszt a core feladatokról",
      "A magas kohézió groupthink-et okozhat: senki nem mer ellentmondani",
      "A struktúra rugalmatlansággá válhat, ha a folyamatok túlterheltek",
    ],
    communicationStyle:
      "Gyors, közvetlen, de empatikus. Szeretik a standup-okat és a vizuális terveket. Az ötletelés szabad, de a döntés utáni végrehajtás fegyelmezett.",
    idealTasks:
      "Új termék fejlesztés, innovációs sprint, stratégiai pivot — ahol egyszerre kell kreativitás és megvalósítási képesség.",
    riskSituations:
      "Hosszú, monoton projektek; konfliktuskerülés, ami elfojtott feszültséghez vezet; túl sok párhuzamos kezdeményezés.",
    leaderActions: [
      "Építs be rendszeres „lassítás napokat” a sprintek közé — reflexiós idő",
      "Jelölj ki egy „ördög ügyvédjét” a nagyobb döntéseknél a groupthink ellen",
      "Limitáld a párhuzamos projektek számát — maximum 2 aktív kezdeményezés egyszerre",
    ],
  },

  ECSP: {
    name: "Végrehajtó Egység",
    subtitle: "Energikus · Összetartó · Strukturált · Pragmatikus",
    description:
      "Fegyelmezett, összetartó csapat, amely a bevált módszereket hatékonyan alkalmazza. A megbízhatóság és a kiszámíthatóság az erősségük.",
    strengths: [
      "Kiváló végrehajtás — amit megígérnek, azt leszállítják",
      "Erős csapatszellem, alacsony belső súrlódás",
      "Jól működő folyamatok és rutinok",
      "Megbízható, kiszámítható teljesítmény",
    ],
    blindSpots: [
      "Innovációs deficit — nehezen lépnek ki a komfortzónájukból",
      "A pragmatizmus ellenállást szülhet új eszközök, módszerek iránt",
      "A harmonikus felszín alatt elfojtott feszültségek halmozódhatnak",
      "Külső változásokra lassan reagálnak",
    ],
    communicationStyle:
      "Világos, strukturált, feladat-orientált. Szeretik a napirendeket, a check-in-eket és a dokumentált döntéseket.",
    idealTasks:
      "Ismétlődő, magas minőségű delivery; operatív működés; ügyfélkiszolgálás; compliance-igényes projektek.",
    riskSituations:
      "Piaci változás, ami gyors adaptációt igényel; új vezető, aki felborítja a rutint; nincs egyértelmű „hogyan”.",
    leaderActions: [
      "Negyedévente szervezz egy „mi lenne ha” workshopot — kényszerítsd a csapatot alternatív szcenáriókra",
      "Hozz be külső impulzust: vendégelőadó, cross-team projekt, iparági benchmark",
      "Jutalmaz meg konkrétan egy sikeres kísérletezést — jelzés, hogy az újítás értékelt",
    ],
  },

  ECFX: {
    name: "Kreatív Kommuna",
    subtitle: "Energikus · Összetartó · Rugalmas · Felfedező",
    description:
      "Szabadon áramló, innovatív csapat, amely szereti egymást és a kísérletezést. A kreativitás és az összetartozás hajtja őket.",
    strengths: [
      "Rendkívüli kreativitás — az ötletelés a természetes állapotuk",
      "Erős bizalom és pszichológiai biztonság",
      "Gyorsan alkalmazkodnak változó körülményekhez",
      "Vonzó kultúra — a tagok szívesen maradnak",
    ],
    blindSpots: [
      "A struktúra hiánya kaotikus végrehajtáshoz vezethet",
      "Nehéz priorizálni — minden ötlet egyformán vonzó",
      "A határidők nem a legfontosabb értékük",
      "A harmonikus légkör miatt nehéz negatív visszajelzést adni",
    ],
    communicationStyle:
      "Informális, szabad asszociációs, gyakran spontán. Sok ötletelés, kevés formális meeting.",
    idealTasks:
      "Koncepció-fázis, brainstorming, design sprint, márkaépítés — divergens gondolkodás.",
    riskSituations:
      "Komplex, többlépéses projekt szoros határidővel; compliance feladatok; delivery > ötlet.",
    leaderActions: [
      "Vezess be enyhe struktúrát: heti 1 prioritás-review, de ne kontrollálj túl sokat",
      "Használj „idea parking lot”-ot — az ötleteket rögzítsd, de ne fusson mind egyszerre",
      "Párosítsd a csapatot egy strukturáltabb csapattal a végrehajtási fázisban",
    ],
  },

  ECFP: {
    name: "Családi Vállalkozás",
    subtitle: "Energikus · Összetartó · Rugalmas · Pragmatikus",
    description:
      "Aktív, lojális csapat, amely a bevált utakon halad, de rugalmasan alkalmazkodik. Az elkötelezettség az összetartó erő.",
    strengths: [
      "Erős lojalitás és csapatidentitás",
      "Pragmatikus döntéshozatal",
      "Rugalmasan kezelik a váratlan helyzeteket",
      "Alacsony fluktuáció, magas elköteleződés",
    ],
    blindSpots: [
      "A lojalitás akadályozhatja a szükséges változásokat",
      "A pragmatizmus rövidtávú gondolkodást szülhet",
      "Külső perspektívák kizárása — „mi tudjuk, hogyan kell”",
      "A rugalmasság néha tervezetlenséget jelent",
    ],
    communicationStyle:
      "Közvetlen, személyes, néha informális a kelleténél. A döntések gyakran a folyosón születnek.",
    idealTasks:
      "Ügyfélkapcsolat, sales, operatív működés, tűzoltás — személyes kapcsolat és gyors reagálás.",
    riskSituations:
      "Skálázás; új tagok beillesztése; stratégiai tervezés; technikai modernizáció.",
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
      "Magas intenzitású, teljesítményorientált csapat, amely szervezett keretek között versenyez és innovál.",
    strengths: [
      "Kiemelkedő individuális teljesítmény",
      "Erős belső motiváció",
      "Strukturált keretek között hatékony innováció",
      "Gyorsan reagál piaci lehetőségekre",
    ],
    blindSpots: [
      "A versengés alááshatja az együttműködést — tudásmegosztás hiánya",
      "Magas stressz-szint, kiégés veszélye",
      "„Nyertes–vesztes” dinamika",
      "Az egyéni siker fontosabb, mint a csapatcél",
    ],
    communicationStyle:
      "Direkt, eredményközpontú, néha konfrontatív. Az adatok és eredmények beszélnek.",
    idealTasks:
      "Sales versenyek, hackathon, gyors prototípus, piaci versenyhelyzetek.",
    riskSituations:
      "Hosszú kooperáció-igényes projektek; mentoring; csapatépítés.",
    leaderActions: [
      "Vezess be csapat-szintű KPI-okat az egyéni metrikák mellé",
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
      "Kiváló végrehajtási sebesség",
      "Egyértelmű felelősségek és elvárások",
      "Nincs kétértelműség — a tagok tudják, mit várnak tőlük",
      "Kiszámítható, magas output",
    ],
    blindSpots: [
      "Alacsony pszichológiai biztonság — nehéz hibát beismerni",
      "A hierarchia elfojtja az alulról jövő ötleteket",
      "Rövid távú gondolkodás",
      "Magas fluktuáció — aki nem bírja a tempót, elmegy",
    ],
    communicationStyle:
      "Felülről lefelé, tömör, utasítás-jellegű. A meetingek rövidek és döntésközpontúak.",
    idealTasks:
      "Operatív kihívások szoros határidővel, turnaround, válságkezelés.",
    riskSituations:
      "Innovációs projektek; tehetségmegtartás; kollektív bölcsesség igénye.",
    leaderActions: [
      "Hozz létre biztonságos fórumot, ahol a tagok névtelenül jelezhetnek problémákat",
      "Rotáld a vezetői szerepeket projekt-szinten",
      "Havi „tanulság-review”: hibákat tanulságként, nem kudarcként kezelitek",
    ],
  },

  EVFX: {
    name: "Kreatív Káosz",
    subtitle: "Energikus · Versengő · Rugalmas · Felfedező",
    description:
      "Szikrázó, impulzív csapat, ahol mindenki a saját ötletét hajtja, de a kollektív energia előre visz.",
    strengths: [
      "Rendkívül magas kreativitás és energia",
      "Bátor, unconventional ötletek",
      "Gyors adaptáció",
      "Vonzó kreatív tehetségek számára",
    ],
    blindSpots: [
      "Szinte lehetetlen priorizálni",
      "Kaotikus végrehajtás",
      "Hiányzik az összetartás — egyéni ambíciók dominálnak",
      "Döntések születnek, de nem tartják be őket",
    ],
    communicationStyle:
      "Hangos, gyors, egymásba vágnak. Spontán ötletelés, ad hoc döntéshozatal.",
    idealTasks:
      "Korai ötletgenerálás, kreatív kampányok, hackathon.",
    riskSituations:
      "Bármi, ami tartós, szervezett kooperatív végrehajtást igényel.",
    leaderActions: [
      "Adj egyértelmű keretet: „ezen a héten EZT fejezzük be” — a hogyan szabad",
      "Párosíts minden projektet egy végrehajtó partnerrel",
      "Hetente: „mi az 1 dolog, amit közösen eldöntöttünk és betartottunk?”",
    ],
  },

  EVFP: {
    name: "Farkasfalka",
    subtitle: "Energikus · Versengő · Rugalmas · Pragmatikus",
    description:
      "Erős egyéniségek laza szövetségben, akik a saját területükön vadásznak, de szükség esetén összezárnak.",
    strengths: [
      "Rendkívül agilis",
      "Erős egyéni teljesítmény és felelősségvállalás",
      "Önszerveződők — nem igényelnek sok irányítást",
      "Jól kezelik a bizonytalanságot",
    ],
    blindSpots: [
      "Gyenge csapatidentitás",
      "Minimális tudásmegosztás",
      "Rövid távú pragmatizmus → stratégiai vakság",
      "Új tagok nehezen integrálódnak",
    ],
    communicationStyle:
      "Tömör, eredményközpontú, szükségalapú. Csak akkor kommunikálnak, ha kell.",
    idealTasks:
      "Sales, üzletfejlesztés, egyéni ügyfélkezelés.",
    riskSituations:
      "Összetett kooperáció; csapatépítés; tudásmegosztás; vezetőváltás.",
    leaderActions: [
      "Heti 30 perces tudásmegosztó kör — mindenki 5 percben elmondja, mit tanult",
      "1-2 közös csapatcél, ami csak együtt érhető el",
      "Tudatos onboarding új tagoknál — mentorpárosítás első 30 napra",
    ],
  },

  // ── Visszafogott + Összetartó ─────────────────────────

  RCSX: {
    name: "Kutatólabor",
    subtitle: "Visszafogott · Összetartó · Strukturált · Felfedező",
    description:
      "Csendes, mélyen gondolkodó csapat, amely szisztematikusan fed fel új területeket. Minőség és alaposság.",
    strengths: [
      "Mély, alapos munkavégzés",
      "Erős belső bizalom és kölcsönös tisztelet",
      "Szisztematikus innováció — átgondolt, nem impulzív",
      "Alacsony hibaarány, magas minőség",
    ],
    blindSpots: [
      "Lassú döntéshozatal — perfekcionizmus béníthat",
      "Nehezen kommunikálnak kifelé — a munka „láthatatlan”",
      "Konfrontáció-kerülés → felgyülemlett feszültség",
      "Kívülről passzivitásnak tűnhet",
    ],
    communicationStyle:
      "Átgondolt, írásos, részletes. Ritka, de alapos meetingek.",
    idealTasks:
      "Kutatás, komplex analízis, termékfejlesztés korai fázis, minőségbiztosítás.",
    riskSituations:
      "Szoros határidők; pitching; stakeholder management; gyors kommunikáció.",
    leaderActions: [
      "Adj elegendő időt a mélymunkához — védd meg a felesleges meetingektől",
      "Segítsd a csapatot a munkájuk „eladásában”",
      "Rendszeres „show & tell” — ez láthatóságot ad",
    ],
  },

  RCSP: {
    name: "Csendes Erőd",
    subtitle: "Visszafogott · Összetartó · Strukturált · Pragmatikus",
    description:
      "Megbízható, csendes csapat, amely stabilan, kiszámíthatóan teljesít. „Nem szól, de megcsinálja.”",
    strengths: [
      "Rendkívüli megbízhatóság",
      "Erős belső összetartás és lojalitás",
      "Alacsony dráma, magas stabilitás",
      "Jól kezelik a rutinfeladatokat",
    ],
    blindSpots: [
      "Változás-ellenállás — „eddig is így csináltuk”",
      "Kívülről láthatatlanok",
      "A csapat zárt lehet kívülállók felé",
      "Az innováció szinte teljesen hiányzik",
    ],
    communicationStyle:
      "Halk, strukturált, ritka. Szükségalapú. Írásban jobbak, mint szóban.",
    idealTasks:
      "Operatív működés, karbantartás, minőségbiztosítás, back-office.",
    riskSituations:
      "Piaci disruption; szervezeti átalakulás; „hangos” érdekképviselet.",
    leaderActions: [
      "Tedd láthatóvá a csapat munkáját — heti összefoglaló a stakeholdereknek",
      "Évente: „mi az 1 dolog, amit megváltoztatnátok?”",
      "Apró, biztonságos kísérletek — „próbáljuk ki ezt a toolt 2 hétre”",
    ],
  },

  RCFX: {
    name: "Művésztelep",
    subtitle: "Visszafogott · Összetartó · Rugalmas · Felfedező",
    description:
      "Introvertált, kreatív közösség, mély bizalomban és szabadságban alkot.",
    strengths: [
      "Magas pszichológiai biztonság",
      "Mély, eredeti gondolkodás",
      "Erős belső kultúra és értékek",
      "A tagok tartósan elköteleződnek",
    ],
    blindSpots: [
      "Nehéz a külvilággal kommunikálni — „saját nyelv”",
      "Lassú végrehajtás",
      "A belső harmónia fontosabb lehet, mint az eredmény",
      "Nehezen kezelik a külső nyomást és határidőket",
    ],
    communicationStyle:
      "Mély, személyes, gyakran nonverbális. Kívülállóknak nehéz csatlakozni.",
    idealTasks:
      "Koncepciófejlesztés, UX kutatás, stratégiai gondolkodás, tartalom.",
    riskSituations:
      "Szoros határidők; nagy prezentáció; konfliktusos stakeholderek; gyors skálázás.",
    leaderActions: [
      "Havonta 1 „kifelé fordulás”: mutassák be munkájukat más csapatnak",
      "Enyhe mérföldkövek — nem kontroll, hanem ritmus",
      "Fordítsd le a munkát „üzleti nyelvre” a stakeholderek felé",
    ],
  },

  RCFP: {
    name: "Támogató Kör",
    subtitle: "Visszafogott · Összetartó · Rugalmas · Pragmatikus",
    description:
      "Csendes, gondoskodó csapat, egymásra figyel és gyakorlati megoldásokat keres.",
    strengths: [
      "Kiváló belső támogatás — senki nem marad egyedül",
      "Pragmatikus, „földre tett” gondolkodás",
      "Alacsony konfliktus, magas bizalom",
      "Jó alkalmazkodóképesség",
    ],
    blindSpots: [
      "Alacsony ambíció — komfortzóna vonzóbb, mint a kihívás",
      "Nehéz nehéz döntéseket hozni",
      "Kívülről „láthatatlan”",
      "Innováció hiányzik — pragmatizmus → konzervativizmus",
    ],
    communicationStyle:
      "Meleg, személyes, támogató. Sok informális beszélgetés, kevés formális meeting.",
    idealTasks:
      "HR, ügyfélszolgálat, belső támogatás, mentoring.",
    riskSituations:
      "Teljesítményértékelés; nehéz visszajelzés; ambiciózus célok; kompetitív környezet.",
    leaderActions: [
      "Mérhető célokat hozz be — látható eredmények az önbizalomhoz",
      "Gyakoroljátok a konstruktív visszajelzést — kis, biztonságos témákkal",
      "Keress egy „ambíció-hordozót” a csapatban",
    ],
  },

  // ── Visszafogott + Versengő ───────────────────────────

  RVSX: {
    name: "Sakktábla",
    subtitle: "Visszafogott · Versengő · Strukturált · Felfedező",
    description:
      "Analitikus, stratégiai gondolkodású csapat, mindenki csendben, de intenzíven a saját területét építi.",
    strengths: [
      "Rendkívüli szakmai mélység",
      "Stratégiai gondolkodás — több lépéssel előre",
      "Adatvezérelt döntéshozatal",
      "Magas innovációs potenciál a szakterületen belül",
    ],
    blindSpots: [
      "Silók — nem osztják meg a tudást",
      "Rejtett rivalizálás",
      "Nehéz közös döntést hozni",
      "Kívülről hidegnek, elérhetetlennek tűnhetnek",
    ],
    communicationStyle:
      "Precíz, adatgazdag, formális. Vitaközpontú, de civilizált. Írásos preferencia.",
    idealTasks:
      "Stratégiai tervezés, adatelemzés, komplex problémafeloldás, technikai architektúra.",
    riskSituations:
      "Csapatépítés; ügyfélkommunikáció; „jó elég” vs „tökéletes” helyzetek.",
    leaderActions: [
      "Strukturált tudásmegosztó fórum — heti tech talk vagy lesson learned",
      "Közös csapatcélok, amik csak együttműködéssel érhetők el",
      "1:1-ben kérdezd meg, hogyan érzik magukat a csapatban",
    ],
  },

  RVSP: {
    name: "Mérnöki Műhely",
    subtitle: "Visszafogott · Versengő · Strukturált · Pragmatikus",
    description:
      "Precíz, feladat-orientált csapat, mindenki a saját területén a legjobb.",
    strengths: [
      "Kiváló technikai/szakmai kompetencia",
      "Hatékony, nem pazarolják az időt",
      "Egyértelmű felelősségi körök",
      "Magas minőségű, megbízható output",
    ],
    blindSpots: [
      "Alacsony érzelmi kapcsolódás — „csak a munka számít”",
      "Kiégés veszélye",
      "Új ötletek nehezen kapnak teret",
      "Inkább egyéni hozzájárulók, mint valódi csapat",
    ],
    communicationStyle:
      "Tömör, technikai, szükségalapú. Részletes dokumentáció, minimális small talk.",
    idealTasks:
      "Fejlesztés, engineering, pénzügy, audit.",
    riskSituations:
      "Csapatépítés; változásmenedzsment; ügyfél-prezentáció; „soft skills”.",
    leaderActions: [
      "Negyedéves informális esemény — ebéd, séta, nem-munka",
      "Rendszeresen: „miben segíthetek?” — itt nem szokás segítséget kérni",
      "Heti 2 óra saját ötletre — tér a kísérletezésnek",
    ],
  },

  RVFX: {
    name: "Szabad Elektronok",
    subtitle: "Visszafogott · Versengő · Rugalmas · Felfedező",
    description:
      "Független, kreatív egyéniségek laza hálózatban, a kíváncsiság és az intellektuális izgalom köti össze.",
    strengths: [
      "Rendkívüli egyéni kreativitás és autonómia",
      "Mély, eredeti gondolkodás",
      "Rugalmasan kezelik a bizonytalanságot",
      "Vonzó autonómiát kereső tehetségek számára",
    ],
    blindSpots: [
      "Szinte nincs csapatidentitás",
      "Minimális koordináció — párhuzamos munkák",
      "Versengés + autonómia → izoláció",
      "Nehéz közös irányba terelni",
    ],
    communicationStyle:
      "Ritka, mély, 1:1 alapú. Gyenge csoportos kommunikáció.",
    idealTasks:
      "Kutatás, korai innováció, kreatív fejlesztés.",
    riskSituations:
      "Csapat-szintű koordináció; szoros határidők; ügyfélkiszolgálás; skálázás.",
    leaderActions: [
      "1 közös „északi csillag” — egyetlen cél, szabad út",
      "Heti 15 perces standup — nem kontroll, hanem „tudjunk egymásról”",
      "Párosítsd össze a tagokat projektekre — kényszerített együttműködés",
    ],
  },

  RVFP: {
    name: "Zsoldosok",
    subtitle: "Visszafogott · Versengő · Rugalmas · Pragmatikus",
    description:
      "Független, gyakorlatias egyéniségek, csapatként alig léteznek. A tranzakciós logika dominál.",
    strengths: [
      "Erős egyéni teljesítmény és önállóság",
      "Pragmatikus, gyors egyéni döntéshozatal",
      "Alacsony maintenance — nem igényelnek sok figyelmet",
      "Jól kezelik a nyomást",
    ],
    blindSpots: [
      "A csapat gyakorlatilag nem létezik",
      "Nulla tudásmegosztás — ha valaki elmegy, a tudása is",
      "Alacsony lojalitás — jobb ajánlatért azonnal váltanak",
      "Vezetői visszajelzésre nem reagálnak",
    ],
    communicationStyle:
      "Minimális, tranzakciós. Csak a szükséges info cserélődik.",
    idealTasks:
      "Egyéni feladatok párhuzamos végrehajtása — freelancer-logika szervezeti kereten belül.",
    riskSituations:
      "Minden, ami valódi csapatmunkát igényel. Kultúraépítés. Hosszú távú tervezés.",
    leaderActions: [
      "Kérdezd meg: „kell ennek csapatnak lennie?” — ha igen, intenzív kultúraépítés",
      "1 közös rituálé — heti standup vagy havi retro — következetesen",
      "Projektek úgy legyenek kiosztva, hogy A eredménye kell B-nek — egymásrautaltság",
    ],
  },
};

// ============================================================
// UI LABELS — a frontend számára
// ============================================================

export const AXIS_LABELS = {
  drive:      { name: "Hajtóerő",  low: "Visszafogott", high: "Energikus" },
  cohesion:   { name: "Kohézió",   low: "Versengő",     high: "Összetartó",
    tooltip: "A barátságosság és fairness dimenziók átlagából képzett közelítő jelző." },
  discipline: { name: "Fegyelem",  low: "Rugalmas",     high: "Strukturált" },
  openness:   { name: "Nyitottság",low: "Pragmatikus",  high: "Felfedező" },
} as const;

export const GRADE_LABELS: Record<AxisGrade, string> = {
  strong_high: "erősen",
  slight_high: "enyhén",
  balanced:    "balanszált",
  slight_low:  "enyhén",
  strong_low:  "erősen",
};
