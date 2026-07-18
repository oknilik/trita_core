// ============================================================
// PSZICHOLÓGIAI BIZTONSÁG PULSE (TPS) — kérdéskészlet és pontozás
// ============================================================
//
// KONSTRUKTUM-FORRÁS
// A mérés a pszichológiai biztonság kutatásban bevett konstruktumára
// épül (Edmondson, A. C. (1999). Psychological safety and learning
// behavior in work teams. Administrative Science Quarterly, 44(2),
// 350–383.). Az itemek SAJÁT megfogalmazásúak — nem az eredeti skála
// fordításai vagy átvételei —, a konstruktum ismert tartalmi területeit
// fedik le: hibázás következménye, segítségkérés, eltérő vélemény,
// kényes témák felvetése, kockázatvállalás, egymás munkájának tisztelete,
// képességek megbecsülése, nyílt egyet-nem-értés.
//
// ANONIMITÁS-GARANCIÁK (lásd prisma/schema.prisma → PsychSafetyResponse)
// - A válaszrekord nem tartalmaz user-referenciát.
// - Aggregált eredmény csak PSYCH_SAFETY_MIN_RESPONSES (3) kitöltéstől
//   számolható — ez alatt az aggregátor null-t ad vissza.
// - A kitöltöttség tényét a CampaignParticipant.completedAt követi,
//   értékek nélkül.
//
// Ez a modul kliens-oldalon is importálható (nincs prisma-függése).
// ============================================================

export const PSYCH_SAFETY_MIN_RESPONSES = 3;

/** Likert 1–5 (1 = egyáltalán nem értek egyet … 5 = teljesen egyetértek) */
export interface PsychSafetyItem {
  id: string;
  /** Fordított item: a magas egyetértés ALACSONY biztonságot jelez. */
  reversed: boolean;
  text: { hu: string; en: string };
  /** A konstruktum tartalmi területe — riport-címkéhez. */
  area: { hu: string; en: string };
}

export const PSYCH_SAFETY_ITEMS: PsychSafetyItem[] = [
  {
    id: "PS1",
    reversed: false,
    text: {
      hu: "Ebben a csapatban nyugodtan felvethetek kényes vagy kellemetlen témákat is.",
      en: "In this team I can comfortably raise sensitive or uncomfortable topics.",
    },
    area: { hu: "Kényes témák felvetése", en: "Raising sensitive topics" },
  },
  {
    id: "PS2",
    reversed: true,
    text: {
      hu: "Ha hibázom, a csapat ezt később felrója nekem.",
      en: "When I make a mistake, this team holds it against me.",
    },
    area: { hu: "Hibázás kezelése", en: "How mistakes are treated" },
  },
  {
    id: "PS3",
    reversed: false,
    text: {
      hu: "Kérhetek segítséget anélkül, hogy emiatt hozzá nem értőnek tűnnék.",
      en: "I can ask for help without looking incompetent for it.",
    },
    area: { hu: "Segítségkérés", en: "Asking for help" },
  },
  {
    id: "PS4",
    reversed: false,
    text: {
      hu: "A csapat elfogadja, ha valaki másként gondolkodik, mint a többség.",
      en: "This team accepts people who think differently from the majority.",
    },
    area: { hu: "Eltérő gondolkodás elfogadása", en: "Accepting different thinking" },
  },
  {
    id: "PS5",
    reversed: true,
    text: {
      hu: "Kockázatos ebben a csapatban új vagy szokatlan ötlettel előállni.",
      en: "It feels risky to bring up a new or unusual idea in this team.",
    },
    area: { hu: "Ötletek kockázata", en: "Risk of new ideas" },
  },
  {
    id: "PS6",
    reversed: true,
    text: {
      hu: "Előfordul, hogy valaki a csapatban szándékosan aláássa mások munkáját.",
      en: "It happens that someone in this team deliberately undermines others' work.",
    },
    area: { hu: "Egymás munkájának tisztelete", en: "Respect for each other's work" },
  },
  {
    id: "PS7",
    reversed: false,
    text: {
      hu: "A csapat értékeli és kihasználja azt, amiben erős vagyok.",
      en: "This team values and makes use of what I am good at.",
    },
    area: { hu: "Képességek megbecsülése", en: "Valuing skills" },
  },
  {
    id: "PS8",
    reversed: false,
    text: {
      hu: "Nyíltan vállalhatom, ha nem értek egyet egy döntéssel.",
      en: "I can openly say when I disagree with a decision.",
    },
    area: { hu: "Nyílt egyet-nem-értés", en: "Open disagreement" },
  },
];

export const PSYCH_SAFETY_ITEM_COUNT = PSYCH_SAFETY_ITEMS.length;

/** itemId → 1..5 nyers válasz */
export type PsychSafetyAnswers = Record<string, number>;

export function isCompletePsychSafetyAnswerSet(
  answers: unknown,
): answers is PsychSafetyAnswers {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return false;
  const map = answers as Record<string, unknown>;
  const keys = Object.keys(map);
  if (keys.length !== PSYCH_SAFETY_ITEM_COUNT) return false;
  return PSYCH_SAFETY_ITEMS.every((item) => {
    const v = map[item.id];
    return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= 5;
  });
}

/** Fordított itemek kiegyenesítése: a normalizált érték mindig „magas = biztonságos". */
function normalizeAnswer(item: PsychSafetyItem, value: number): number {
  return item.reversed ? 6 - value : value;
}

export interface PsychSafetyAggregate {
  /** Beérkezett (érvényes) válaszok száma. */
  count: number;
  /** Összesített index 0–100 (100 = maximális észlelt biztonság). */
  index: number;
  /** Itemenkénti normalizált átlag, 1–5 skálán (magas = biztonságos). */
  itemMeans: Record<string, number>;
  /** A válaszadók közti szóródás az összpontszámban (0–100 skálán, szórás). */
  spread: number;
  band: "low" | "mid" | "high";
}

export function psychSafetyBand(index: number): "low" | "mid" | "high" {
  if (index >= 75) return "high";
  if (index >= 55) return "mid";
  return "low";
}

/**
 * Anonim válaszhalmaz aggregálása. Az anonimitás-küszöb alatt (n < 3)
 * SZÁNDÉKOSAN null — egyéni válasz így sem közvetve, sem közvetlenül
 * nem visszafejthető.
 */
export function aggregatePsychSafety(
  responses: unknown[],
): PsychSafetyAggregate | null {
  const valid = responses.filter(isCompletePsychSafetyAnswerSet);
  if (valid.length < PSYCH_SAFETY_MIN_RESPONSES) return null;

  const itemSums: Record<string, number> = {};
  for (const item of PSYCH_SAFETY_ITEMS) itemSums[item.id] = 0;
  const personIndexes: number[] = [];

  for (const answers of valid) {
    let personSum = 0;
    for (const item of PSYCH_SAFETY_ITEMS) {
      const norm = normalizeAnswer(item, answers[item.id]);
      itemSums[item.id] += norm;
      personSum += norm;
    }
    const personMean = personSum / PSYCH_SAFETY_ITEM_COUNT;
    personIndexes.push(((personMean - 1) / 4) * 100);
  }

  const itemMeans: Record<string, number> = {};
  for (const item of PSYCH_SAFETY_ITEMS) {
    itemMeans[item.id] = Math.round((itemSums[item.id] / valid.length) * 100) / 100;
  }

  const index =
    Math.round(personIndexes.reduce((a, b) => a + b, 0) / personIndexes.length);
  const mean = personIndexes.reduce((a, b) => a + b, 0) / personIndexes.length;
  const variance =
    personIndexes.reduce((acc, v) => acc + (v - mean) ** 2, 0) / personIndexes.length;
  const spread = Math.round(Math.sqrt(variance));

  return { count: valid.length, index, itemMeans, spread, band: psychSafetyBand(index) };
}

// ── Riport-réteg: mi gyenge, és mit lehet vele kezdeni ────────────────
//
// Vezetői/tanácsadói akció-javaslat területenként. Szándékosan konkrét,
// kis lépések — a riportban a gyenge területek mellé kerülnek.

export const PSYCH_SAFETY_ACTIONS: Record<string, { hu: string; en: string }> = {
  PS1: {
    hu: "Teremts rendszeres, védett fórumot a kényes témáknak — például havi „mi nem működik?” kör, amit a vezető nyit a saját témájával. A nehéz témák akkor jönnek elő, ha van kijelölt helyük.",
    en: "Create a regular, protected forum for sensitive topics — e.g. a monthly “what isn't working?” round that the leader opens with their own item. Hard topics surface when they have a designated place.",
  },
  PS2: {
    hu: "Vezess be tanulság-fókuszú hibamegbeszélést: a „ki hibázott?” helyett „mit tanultunk, mit változtatunk?” — és a vezető ossza meg elsőként a saját hibáját.",
    en: "Introduce lesson-focused mistake reviews: replace “who failed?” with “what did we learn, what do we change?” — and have the leader share their own mistake first.",
  },
  PS3: {
    hu: "Normalizáld a segítségkérést: legyen látható, ki min dolgozik és hol akadt el — például külön „elakadás” kör a heti megbeszélésen. Így a kérdezés rutin, nem kudarcjelzés.",
    en: "Normalize asking for help: make it visible who works on what and where they are stuck — e.g. a dedicated “blockers” round in the weekly meeting. Asking becomes routine, not a distress signal.",
  },
  PS4: {
    hu: "Adj strukturált teret a kisebbségi véleménynek: döntések előtt kérj kifejezetten ellenvéleményt (kijelölt vitapartner-szerep, körkérdés) — így az eltérő nézet feladat, nem kockázat.",
    en: "Give structured space to minority views: before decisions, explicitly ask for dissent (a designated challenger role, a round-robin) — differing views become a task, not a risk.",
  },
  PS5: {
    hu: "Válaszd le az ötletelést az értékelésről: külön alkalom a nyers ötleteknek, és minden ötletre először a „mi jó benne?” kérdés — a szűrés csak utána jön.",
    en: "Separate ideation from evaluation: hold sessions for raw ideas, and respond to every idea first with “what's good about it?” — filtering comes after.",
  },
  PS6: {
    hu: "Tisztázd a szerep- és felelősséghatárokat, és kezeld nyíltan a rivalizálást: az aláásás jeleit a vezető négyszemközt, de következetesen címezze.",
    en: "Clarify role and responsibility boundaries, and address rivalry openly: the leader should handle signs of undermining privately but consistently.",
  },
  PS7: {
    hu: "Kösd össze a feladatokat az erősségekkel: térképezzétek fel, ki miben erős (a trita-profilok erre valók), és delegáláskor mondd ki, miért pont ő kapja — a megbecsültség konkrétumokból épül.",
    en: "Connect tasks to strengths: map who is strong at what (trita profiles serve this), and when delegating, say why this person gets it — feeling valued is built from specifics.",
  },
  PS8: {
    hu: "Válaszd szét a vitát és a döntést: döntés előtt az egyet-nem-értés kötelező munka, döntés után közös képviselet („disagree and commit”).",
    en: "Separate debate from decision: before the decision, disagreement is required work; after it, everyone represents the outcome (“disagree and commit”).",
  },
};

/** Ez alatt az itemátlag alatt számít gyengének egy terület (1–5 skálán ≈ 60/100). */
export const PSYCH_SAFETY_WEAK_THRESHOLD = 3.4;

/**
 * A leggyengébb területek a riporthoz: a küszöb alatti itemek, növekvő
 * átlag szerint, legfeljebb `max` darab.
 */
export function weakPsychSafetyItemIds(
  itemMeans: Record<string, number>,
  max = 3,
  threshold = PSYCH_SAFETY_WEAK_THRESHOLD,
): string[] {
  return PSYCH_SAFETY_ITEMS.filter(
    (item) => typeof itemMeans[item.id] === "number" && itemMeans[item.id] < threshold,
  )
    .sort((a, b) => itemMeans[a.id] - itemMeans[b.id])
    .slice(0, max)
    .map((item) => item.id);
}

export function getPsychSafetyItem(id: string): PsychSafetyItem | undefined {
  return PSYCH_SAFETY_ITEMS.find((item) => item.id === id);
}
