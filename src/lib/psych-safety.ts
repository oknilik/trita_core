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

import { sampleStdDev } from "@/lib/stats/dimension-stats";
import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "@/lib/anonymity";

export const PSYCH_SAFETY_MIN_RESPONSES = MIN_RATERS_FOR_ANONYMOUS_AGGREGATE;

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
  /** Itemenkénti, válaszadók közti mintaszórás az 1–5 skálán. */
  itemSds: Record<string, number>;
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
 * Anonim válaszhalmaz aggregálása. Az anonimitás-küszöb
 * (PSYCH_SAFETY_MIN_RESPONSES) alatt SZÁNDÉKOSAN null — egyéni válasz így
 * sem közvetve, sem közvetlenül nem visszafejthető.
 */
export function aggregatePsychSafety(
  responses: unknown[],
): PsychSafetyAggregate | null {
  const valid = responses.filter(isCompletePsychSafetyAnswerSet);
  if (valid.length < PSYCH_SAFETY_MIN_RESPONSES) return null;

  const itemSums: Record<string, number> = {};
  const itemValues: Record<string, number[]> = {};
  for (const item of PSYCH_SAFETY_ITEMS) {
    itemSums[item.id] = 0;
    itemValues[item.id] = [];
  }
  const personIndexes: number[] = [];

  for (const answers of valid) {
    let personSum = 0;
    for (const item of PSYCH_SAFETY_ITEMS) {
      const norm = normalizeAnswer(item, answers[item.id]);
      itemSums[item.id] += norm;
      itemValues[item.id].push(norm);
      personSum += norm;
    }
    const personMean = personSum / PSYCH_SAFETY_ITEM_COUNT;
    personIndexes.push(((personMean - 1) / 4) * 100);
  }

  const itemMeans: Record<string, number> = {};
  const itemSds: Record<string, number> = {};
  for (const item of PSYCH_SAFETY_ITEMS) {
    itemMeans[item.id] = Math.round((itemSums[item.id] / valid.length) * 100) / 100;
    itemSds[item.id] = Math.round(sampleStdDev(itemValues[item.id]) * 100) / 100;
  }

  const index =
    Math.round(personIndexes.reduce((a, b) => a + b, 0) / personIndexes.length);
  // Válaszadók közti szóródás: Bessel-korrekciós mintaszórás (a válaszok a
  // csapat egy mintája; n ≥ PSYCH_SAFETY_MIN_RESPONSES itt mindig teljesül).
  const spread = Math.round(sampleStdDev(personIndexes));

  return {
    count: valid.length,
    index,
    itemMeans,
    itemSds,
    spread,
    band: psychSafetyBand(index),
  };
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

// ── Vezetői csapda-kártyák (riport-réteg) ─────────────────────────────
//
// KERET-FORRÁS: Brady, S. M., Kliman, S. D. & Smith, L. C. (2026):
// "4 Hidden Traps of Team Dynamics", Harvard Business Review, 2026. július.
// A cikk négy vezetői csapdát és hat ellenszert ír le; itt a KERETET
// vesszük át, a szövegek SAJÁT megfogalmazásúak és a pulse területeire
// igazítottak. A hat ellenszer elosztása a kártyák közt:
//   önismeret + tisztelethez való visszatérés → REACTIVITY
//   teljes kép megismerése + közös felelősség → CERTAINTY
//   őszinte kommunikáció                      → SELF_JUSTIFICATION
//   szó–tett konzisztencia                    → SAY_DO_GAP
//
// A kártya akkor kerül a riportba, ha a hozzá rendelt pulse-területek
// valamelyike gyenge (ld. leaderTrapsForWeakItems) — a gyenge terület a
// TÜNET, a kártya a mögötte tipikus vezetői mintázatot és a kiutat adja.

export type PsychSafetyLeaderTrapId =
  | "CERTAINTY"
  | "SAY_DO_GAP"
  | "REACTIVITY"
  | "SELF_JUSTIFICATION";

export interface PsychSafetyLeaderTrap {
  id: PsychSafetyLeaderTrapId;
  title: { hu: string; en: string };
  /** A csapda — hogyan néz ki a mindennapi vezetői működésben. */
  trap: { hu: string; en: string };
  /** Az ellenszer — konkrét, megfigyelhető vezetői lépés. */
  antidote: { hu: string; en: string };
  /** Mely pulse-területek gyengesége jelzi tipikusan ezt a csapdát. */
  itemIds: string[];
}

export const PSYCH_SAFETY_LEADER_TRAPS: PsychSafetyLeaderTrap[] = [
  {
    id: "REACTIVITY",
    title: { hu: "Érzelmi reaktivitás", en: "Emotional reactivity" },
    trap: {
      hu: "A vezető az ellenvéleményre vagy a kényes felvetésre azonnal, érzelemből reagál — védekezéssel, éllel vagy türelmetlenséggel. A csapat ebből azt tanulja: nehéz témát felhozni kockázatos.",
      en: "The leader reacts to dissent or a sensitive point instantly and emotionally — with defensiveness, edge or impatience. The team learns: raising hard topics is risky.",
    },
    antidote: {
      hu: "Iktass be egy tudatos szünetet a reakció elé, és vitában térj vissza a tisztelethez: először ismerd el a felvetés jogosságát, csak utána vitatkozz a tartalmával. A saját trigger-helyzeteid ismerete (mikor csúszol reakcióba) az első lépés.",
      en: "Insert a deliberate pause before reacting, and in conflict return to respect: first acknowledge the legitimacy of the point, only then debate its content. Knowing your own triggers (when you slip into reaction) is step one.",
    },
    itemIds: ["PS1", "PS8"],
  },
  {
    id: "CERTAINTY",
    title: { hu: "Bizonyosság-csapda", en: "The certainty trap" },
    trap: {
      hu: "A vezető annyira biztos a saját olvasatában, hogy az eltérő nézőpont zajnak tűnik. A csapat leszokik a másként gondolkodásról — minek, ha úgyis megvan a válasz.",
      en: "The leader is so sure of their own read that differing viewpoints feel like noise. The team unlearns thinking differently — why bother, if the answer is already fixed.",
    },
    antidote: {
      hu: "Döntés előtt szerezd meg a teljes képet: kérdezz rá célzottan a hiányzó nézőpontokra („mit nem látok?”), és oszd meg a döntés gazdáját is — ahol közös a felelősség, ott az eltérő nézet erőforrás, nem támadás.",
      en: "Before deciding, get the full story: explicitly ask for the missing perspectives (“what am I not seeing?”), and share ownership of the decision — where responsibility is shared, a differing view is a resource, not an attack.",
    },
    itemIds: ["PS4", "PS5"],
  },
  {
    id: "SAY_DO_GAP",
    title: { hu: "Szó–tett rés", en: "Say–do gap" },
    trap: {
      hu: "A kimondott értékek és a napi gyakorlat elcsúszik: a vezető nyíltságot hirdet, de a hibázást felrója, vagy szó nélkül hagyja, ha valaki mások munkáját aláássa. A csapat nem a szavaknak hisz, hanem annak, amit következmények szintjén lát.",
      en: "Stated values and daily practice drift apart: the leader preaches openness but holds mistakes against people, or lets undermining pass without a word. The team believes not the words but what it sees at the level of consequences.",
    },
    antidote: {
      hu: "A biztonságot tettekkel kell hitelesíteni: ha hibát tanulságként kezelni ígértél, az első éles helyzetben pontosan azt tedd; az aláásást pedig következetesen, minden alkalommal címezd. Egyetlen ellenpélda többet rombol, mint tíz jó kijelentés.",
      en: "Safety must be validated by action: if you promised to treat mistakes as lessons, do exactly that in the first live case; and address undermining consistently, every single time. One counterexample destroys more than ten good statements build.",
    },
    itemIds: ["PS2", "PS6"],
  },
  {
    id: "SELF_JUSTIFICATION",
    title: { hu: "Önigazolás", en: "Self-justification" },
    trap: {
      hu: "A vezető a saját döntéseit magyarázza ahelyett, hogy tanulna belőlük — a kérdésekre indoklás jön, nem kíváncsiság. A csapat ezt tükrözi: segítséget kérni vagy bizonytalanságot vállalni gyengeségnek kezd számítani.",
      en: "The leader explains their decisions instead of learning from them — questions get justification, not curiosity. The team mirrors this: asking for help or admitting uncertainty starts to count as weakness.",
    },
    antidote: {
      hu: "Kommunikálj őszintén, szépítés nélkül — kezdve magadon: mondd ki, miben vagy bizonytalan, és kérj te magad segítséget a csapattól. A vezetői „nem tudom, nézzük meg együtt” az a mondat, ami a segítségkérést mindenki másnak is rutinná teszi.",
      en: "Communicate with candor, starting with yourself: say what you are uncertain about, and ask the team for help yourself. A leader's “I don't know — let's find out together” is the sentence that makes asking for help routine for everyone else.",
    },
    itemIds: ["PS3", "PS2"],
  },
];

/**
 * A gyenge pulse-területekhez tartozó vezetői csapda-kártyák, a
 * PSYCH_SAFETY_LEADER_TRAPS sorrendjében, duplikátum nélkül.
 */
export function leaderTrapsForWeakItems(
  weakItemIds: string[],
): PsychSafetyLeaderTrap[] {
  const weak = new Set(weakItemIds);
  return PSYCH_SAFETY_LEADER_TRAPS.filter((trap) =>
    trap.itemIds.some((id) => weak.has(id)),
  );
}

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
