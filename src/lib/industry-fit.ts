// Karrier-wizard adatok: iparág-lista és érdeklődés-címkék.
//
// Ez a fájl korábban a teljes v1 illeszkedési motort tartalmazta (109 kézzel
// súlyozott szerep, saját rangsor-formulákkal). A motor v2-ben kicserélődött
// (`src/lib/career/`), a katalógus O*NET/ESCO/FEOR alapú lett — itt már CSAK a
// wizard kérdéseihez tartozó adat és a mentett háttér típusa maradt.

import type { RiasecLetter } from "@/lib/career/types";

export interface Industry {
  key: string;
  hu: string;
  en: string;
}

/** A wizard „mi érdekel" / „hol dolgozol most" kérdéseinek iparág-listája.
 *  A katalógusra való leképezés: `src/lib/career/industries.ts`. */
export const INDUSTRIES: Industry[] = [
  { key: "tech", hu: "IT / szoftver", en: "IT / software" },
  { key: "health", hu: "Egészségügy / gondoskodás", en: "Healthcare / care" },
  { key: "education", hu: "Oktatás / képzés", en: "Education / training" },
  { key: "finance", hu: "Pénzügy / számvitel", en: "Finance / accounting" },
  { key: "sales", hu: "Értékesítés / ügyfélkapcsolat", en: "Sales / client relations" },
  { key: "creative", hu: "Marketing / kreatív", en: "Marketing / creative" },
  { key: "operations", hu: "Gyártás / logisztika", en: "Manufacturing / logistics" },
  { key: "people", hu: "HR / szervezetfejlesztés", en: "HR / people" },
  { key: "public", hu: "Jog / közszféra", en: "Legal / public sector" },
  { key: "engineering", hu: "Építőipar / mérnöki", en: "Construction / engineering" },
  { key: "hospitality", hu: "Vendéglátás / turizmus", en: "Hospitality / tourism" },
  { key: "media", hu: "Média / kommunikáció", en: "Media / communications" },
  { key: "science", hu: "Tudomány / kutatás", en: "Science / research" },
  { key: "trades", hu: "Szakmák / ipar", en: "Skilled trades" },
  { key: "transport", hu: "Közlekedés / szállítmányozás", en: "Transport / logistics" },
  { key: "services", hu: "Személyi szolgáltatás / wellness", en: "Personal services / wellness" },
];

export type CareerStatus = "studying" | "working" | "switching";
export type EduLevel = "primary" | "secondary" | "vocational" | "higher" | "specialized";
export type EduField =
  | "tech_engineering"
  | "economics"
  | "health"
  | "humanities"
  | "natural_science"
  | "legal"
  | "arts"
  | "pedagogy"
  | "trade"
  | "none_other";
export type AgeBand = "under20" | "20s" | "30s" | "40s" | "50plus";

/** Preferencia- és környezet-tengelyek a wizardban (a motor `AxisKey`-jével egyezik). */
export type PrefAxis = "people" | "variety" | "autonomy" | "creation";
export type EnvAxis = "pace" | "structure" | "setting";
export type PrefValue = -1 | 0 | 1;
export type UserPrefs = Partial<Record<PrefAxis | EnvAxis, PrefValue>>;

/** A wizard mentett háttere (UserProfile.careerBackground JSON). */
export interface CareerBackground {
  status: CareerStatus;
  eduLevel: EduLevel | null;
  /** Örökölt egyértékű terület — az olvasók a normalizedEduFields()-et használják */
  eduField: EduField | null;
  /** Több képzési terület (max 3) */
  eduFields?: EduField[];
  ageBand: AgeBand | null;
  /** Jelenlegi iparág (ha dolgozik / váltana) */
  currentIndustry: string | null;
  /** Érdeklődési iparágak (0-3; üres = nyitott mindenre) */
  interests: string[];
  /** Érdeklődés-címkék (INTEREST_TAGS kulcsai, max 4) */
  interestTags?: string[];
  /** MÉRT érdeklődés-profil (Mini-IP kérdőívből, betűnként 0-100) */
  riasecScores?: Partial<Record<RiasecLetter, number>>;
  /** Preferencia- és környezet-tengelyek (a motor bemenete) */
  prefs?: UserPrefs;
  /** Vezetői szándék */
  leadIntent?: "lead" | "expert" | "unsure";
  /** Jelenlegi foglalkozás a katalógusból (validációhoz, nem rangsorol) */
  currentOccupationId?: string | null;
  currentOccupationLabel?: string | null;
}

/** Terület-normalizálás: az örökölt egyértékű mezőt is tömbként adja vissza. */
export function normalizedEduFields(background: CareerBackground): EduField[] {
  if (background.eduFields && background.eduFields.length > 0) return background.eduFields;
  return background.eduField ? [background.eduField] : [];
}

// ── Érdeklődés-címkék ───────────────────────────────────────────────────────
// A címkék Holland-betűi a motorban BECSÜLT érdeklődés-vektorrá állnak össze
// (`src/lib/career/interests.ts`), ha nincs kitöltött érdeklődés-kérdőív.
export interface InterestTag {
  key: string;
  emoji: string;
  hu: string;
  en: string;
  letters: RiasecLetter[];
  industries: string[];
}

export const INTEREST_TAGS: InterestTag[] = [
  { key: "nature", emoji: "🌿", hu: "Természet / kint lét", en: "Nature / outdoors", letters: ["R", "I"], industries: ["science", "trades"] },
  { key: "numbers", emoji: "🔢", hu: "Számok / elemzés", en: "Numbers / analysis", letters: ["I", "C"], industries: ["finance", "tech", "science"] },
  { key: "helping", emoji: "🧑‍🤝‍🧑", hu: "Emberek segítése", en: "Helping people", letters: ["S"], industries: ["health", "education", "people", "public"] },
  { key: "building", emoji: "🛠️", hu: "Építés / szerelés", en: "Building / fixing", letters: ["R"], industries: ["trades", "engineering", "transport"] },
  { key: "design", emoji: "🎨", hu: "Alkotás / design", en: "Creating / design", letters: ["A"], industries: ["creative", "media"] },
  { key: "teaching", emoji: "📚", hu: "Tanítás / tudásátadás", en: "Teaching / sharing knowledge", letters: ["S", "A"], industries: ["education"] },
  { key: "business", emoji: "💼", hu: "Üzlet / tárgyalás", en: "Business / negotiation", letters: ["E", "C"], industries: ["sales", "finance", "operations"] },
  { key: "research", emoji: "🧪", hu: "Kutatás / kísérletezés", en: "Research / experimenting", letters: ["I"], industries: ["science", "tech", "health"] },
  { key: "stage", emoji: "🎭", hu: "Színpad / megjelenés", en: "Stage / performing", letters: ["A", "E"], industries: ["media", "creative", "hospitality"] },
  { key: "logic", emoji: "🧩", hu: "Logika / problémamegoldás", en: "Logic / problem-solving", letters: ["I", "C"], industries: ["tech", "engineering", "finance"] },
  { key: "caring", emoji: "❤️", hu: "Gondoskodás / egészség", en: "Caring / health", letters: ["S"], industries: ["health", "services", "public"] },
  { key: "society", emoji: "🌍", hu: "Társadalmi ügyek", en: "Social causes", letters: ["S", "E"], industries: ["public", "people", "education"] },
];
