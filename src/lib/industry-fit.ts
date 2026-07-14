// Iparági illeszkedés — a hatfaktoros önértékelésből becsült szerep-illeszkedés
// egy választott iparágon belül. INDIKATÍV, önértékelés-alapú jelzés, nem
// pályaválasztási tanácsadás — a UI kötelezően jelzi a módszertani keretet.
//
// Modell: minden szerephez 2-4 kulcsdimenzió tartozik iránnyal és súllyal.
// Illeszkedés = súlyozott átlaga annak, mennyire esik a user értéke a kívánt
// irányba (0-100). Az E dimenzió fordított skálájú (magasabb = érzelmesebb),
// ezért a nyomásálló szerepeknél "low" irányt használunk.

export type DimCode = "H" | "E" | "X" | "A" | "C" | "O";

interface RoleWeight {
  dim: DimCode;
  /** "high": magas érték illeszkedik; "low": alacsony érték illeszkedik */
  direction: "high" | "low";
  weight: number;
}

/**
 * Preferencia-tengelyek — a user MOTIVÁCIÓJA, nem a személyisége.
 * Skála -1..1: people (-1 adat ↔ 1 ember), variety (-1 stabilitás ↔ 1
 * változatosság), autonomy (-1 csapatban ↔ 1 önállóan), creation (-1
 * végrehajtás ↔ 1 alkotás).
 */
export type PrefAxis = "people" | "variety" | "autonomy" | "creation";
export type PrefValue = -1 | 0 | 1;
export type UserPrefs = Partial<Record<PrefAxis, PrefValue>>;

export interface IndustryRole {
  key: string;
  hu: string;
  en: string;
  weights: RoleWeight[];
  /** A szerep pozíciója a preferencia-tengelyeken (-1..1) */
  prefs: Record<PrefAxis, number>;
}

export interface Industry {
  key: string;
  hu: string;
  en: string;
  roles: IndustryRole[];
}

export interface RoleFitResult {
  role: IndustryRole;
  /** 0-100 személyiség-illeszkedés */
  score: number;
  /** A legerősebben támogató dimenzió kódja */
  topDriver: DimCode;
  /** A leginkább hátráltató dimenzió kódja (ha van 55 alatti komponens) */
  watchDim: DimCode | null;
  /** 0-100 preferencia-egyezés, ha a user állított be preferenciát */
  prefMatch: number | null;
  /** Rangsoroló pontszám: személyiség (70%) + preferencia (30%, ha van) */
  combined: number;
}

const w = (dim: DimCode, direction: "high" | "low", weight: number): RoleWeight => ({
  dim,
  direction,
  weight,
});

// prefs rövidítő: (people, variety, autonomy, creation), mind -1..1
const pr = (
  people: number,
  variety: number,
  autonomy: number,
  creation: number,
): Record<PrefAxis, number> => ({ people, variety, autonomy, creation });

export const INDUSTRIES: Industry[] = [
  {
    key: "tech",
    hu: "IT / szoftver",
    en: "IT / software",
    roles: [
      { key: "dev", hu: "Fejlesztő", en: "Developer", weights: [w("C", "high", 0.5), w("O", "high", 0.3), w("X", "low", 0.2)], prefs: pr(-1, 0, 1, 1) },
      { key: "pm", hu: "Termékmenedzser", en: "Product manager", weights: [w("X", "high", 0.35), w("O", "high", 0.35), w("C", "high", 0.3)], prefs: pr(1, 1, 0, 1) },
      { key: "qa", hu: "Tesztelő / QA", en: "QA engineer", weights: [w("C", "high", 0.6), w("H", "high", 0.2), w("O", "low", 0.2)], prefs: pr(-1, -1, 0, -1) },
      { key: "ux", hu: "UX designer", en: "UX designer", weights: [w("O", "high", 0.45), w("A", "high", 0.3), w("E", "high", 0.25)], prefs: pr(1, 1, 0, 1) },
      { key: "devops", hu: "Üzemeltetés / DevOps", en: "Ops / DevOps", weights: [w("C", "high", 0.45), w("E", "low", 0.35), w("O", "high", 0.2)], prefs: pr(-1, 0, 1, -1) },
      { key: "data", hu: "Adatelemző / data scientist", en: "Data analyst / scientist", weights: [w("O", "high", 0.4), w("C", "high", 0.4), w("X", "low", 0.2)], prefs: pr(-1, 0, 1, 1) },
      { key: "itsupport", hu: "IT support / helpdesk", en: "IT support / helpdesk", weights: [w("A", "high", 0.4), w("C", "high", 0.3), w("E", "low", 0.3)], prefs: pr(1, -1, -1, -1) },
    ],
  },
  {
    key: "health",
    hu: "Egészségügy / gondoskodás",
    en: "Healthcare / care",
    roles: [
      { key: "clinical", hu: "Klinikai munka", en: "Clinical work", weights: [w("C", "high", 0.35), w("E", "low", 0.35), w("A", "high", 0.3)], prefs: pr(1, 0, 0, -1) },
      { key: "care", hu: "Ápolás / gondozás", en: "Nursing / caregiving", weights: [w("A", "high", 0.4), w("E", "high", 0.3), w("C", "high", 0.3)], prefs: pr(1, -1, -1, -1) },
      { key: "therapy", hu: "Terápia / tanácsadás", en: "Therapy / counseling", weights: [w("A", "high", 0.35), w("E", "high", 0.35), w("H", "high", 0.3)], prefs: pr(1, 0, 1, 0) },
      { key: "healthadmin", hu: "Egészségügyi szervezés", en: "Health administration", weights: [w("C", "high", 0.5), w("H", "high", 0.3), w("X", "high", 0.2)], prefs: pr(0, -1, 0, -1) },
      { key: "emergency", hu: "Sürgősségi / mentés", en: "Emergency / rescue", weights: [w("E", "low", 0.45), w("C", "high", 0.35), w("X", "high", 0.2)], prefs: pr(1, 1, 0, -1) },
      { key: "rehab", hu: "Rehabilitáció / gyógytorna", en: "Rehabilitation / physiotherapy", weights: [w("A", "high", 0.4), w("C", "high", 0.35), w("E", "high", 0.25)], prefs: pr(1, 0, 1, -1) },
    ],
  },
  {
    key: "education",
    hu: "Oktatás / képzés",
    en: "Education / training",
    roles: [
      { key: "teacher", hu: "Tanár / oktató", en: "Teacher / educator", weights: [w("X", "high", 0.35), w("A", "high", 0.35), w("C", "high", 0.3)], prefs: pr(1, 0, 0, 0) },
      { key: "trainer", hu: "Tréner / facilitátor", en: "Trainer / facilitator", weights: [w("X", "high", 0.45), w("O", "high", 0.3), w("A", "high", 0.25)], prefs: pr(1, 1, 0, 1) },
      { key: "mentor", hu: "Mentor / fejlesztő", en: "Mentor / coach", weights: [w("A", "high", 0.4), w("H", "high", 0.3), w("E", "high", 0.3)], prefs: pr(1, 0, 1, 0) },
      { key: "edtech", hu: "Tananyag-fejlesztés", en: "Curriculum design", weights: [w("O", "high", 0.4), w("C", "high", 0.4), w("X", "low", 0.2)], prefs: pr(-1, 0, 1, 1) },
      { key: "earlyyears", hu: "Kisgyermeknevelés", en: "Early childhood education", weights: [w("A", "high", 0.4), w("E", "high", 0.3), w("C", "high", 0.3)], prefs: pr(1, -1, -1, 0) },
      { key: "specialed", hu: "Gyógypedagógia / fejlesztés", en: "Special education", weights: [w("A", "high", 0.4), w("C", "high", 0.3), w("H", "high", 0.3)], prefs: pr(1, 0, 0, 0) },
    ],
  },
  {
    key: "finance",
    hu: "Pénzügy / számvitel",
    en: "Finance / accounting",
    roles: [
      { key: "analyst", hu: "Elemző", en: "Analyst", weights: [w("C", "high", 0.5), w("O", "high", 0.3), w("E", "low", 0.2)], prefs: pr(-1, 0, 1, 0) },
      { key: "accounting", hu: "Könyvelés / kontrolling", en: "Accounting / controlling", weights: [w("C", "high", 0.6), w("H", "high", 0.25), w("O", "low", 0.15)], prefs: pr(-1, -1, 0, -1) },
      { key: "advisor", hu: "Pénzügyi tanácsadó", en: "Financial advisor", weights: [w("X", "high", 0.35), w("H", "high", 0.35), w("C", "high", 0.3)], prefs: pr(1, 0, 0, -1) },
      { key: "risk", hu: "Kockázatkezelés", en: "Risk management", weights: [w("C", "high", 0.4), w("E", "low", 0.3), w("H", "high", 0.3)], prefs: pr(-1, 0, 0, -1) },
      { key: "audit", hu: "Audit / ellenőrzés", en: "Audit", weights: [w("C", "high", 0.45), w("H", "high", 0.35), w("A", "low", 0.2)], prefs: pr(-1, 0, 0, -1) },
      { key: "banking", hu: "Banki ügyfélkezelés", en: "Retail banking", weights: [w("X", "high", 0.35), w("C", "high", 0.35), w("H", "high", 0.3)], prefs: pr(1, -1, -1, -1) },
    ],
  },
  {
    key: "sales",
    hu: "Értékesítés / ügyfélkapcsolat",
    en: "Sales / client relations",
    roles: [
      { key: "sales", hu: "Értékesítő", en: "Sales representative", weights: [w("X", "high", 0.5), w("E", "low", 0.25), w("A", "low", 0.25)], prefs: pr(1, 1, 1, -1) },
      { key: "account", hu: "Ügyfélmenedzser", en: "Account manager", weights: [w("X", "high", 0.35), w("A", "high", 0.35), w("C", "high", 0.3)], prefs: pr(1, 0, 0, -1) },
      { key: "support", hu: "Ügyfélszolgálat", en: "Customer support", weights: [w("A", "high", 0.4), w("E", "low", 0.3), w("C", "high", 0.3)], prefs: pr(1, -1, -1, -1) },
      { key: "bizdev", hu: "Üzletfejlesztés", en: "Business development", weights: [w("X", "high", 0.4), w("O", "high", 0.35), w("E", "low", 0.25)], prefs: pr(1, 1, 1, 1) },
      { key: "retail", hu: "Üzletvezetés / retail", en: "Store management / retail", weights: [w("C", "high", 0.4), w("X", "high", 0.35), w("E", "low", 0.25)], prefs: pr(1, 0, 0, -1) },
      { key: "ecommerce", hu: "E-kereskedelem", en: "E-commerce", weights: [w("C", "high", 0.4), w("O", "high", 0.35), w("X", "low", 0.25)], prefs: pr(-1, 1, 1, 0) },
    ],
  },
  {
    key: "creative",
    hu: "Marketing / kreatív",
    en: "Marketing / creative",
    roles: [
      { key: "creative", hu: "Kreatív alkotó", en: "Creative", weights: [w("O", "high", 0.55), w("X", "high", 0.25), w("C", "low", 0.2)], prefs: pr(0, 1, 1, 1) },
      { key: "content", hu: "Tartalomkészítő", en: "Content creator", weights: [w("O", "high", 0.4), w("C", "high", 0.3), w("X", "high", 0.3)], prefs: pr(0, 1, 1, 1) },
      { key: "brand", hu: "Márka / kampánymenedzser", en: "Brand / campaign manager", weights: [w("X", "high", 0.35), w("C", "high", 0.35), w("O", "high", 0.3)], prefs: pr(1, 1, 0, 1) },
      { key: "research", hu: "Piackutatás", en: "Market research", weights: [w("O", "high", 0.4), w("C", "high", 0.4), w("X", "low", 0.2)], prefs: pr(-1, 0, 1, 0) },
      { key: "visual", hu: "Grafika / vizuális design", en: "Graphic / visual design", weights: [w("O", "high", 0.5), w("C", "high", 0.3), w("X", "low", 0.2)], prefs: pr(-1, 1, 1, 1) },
      { key: "socialmedia", hu: "Social media", en: "Social media", weights: [w("X", "high", 0.4), w("O", "high", 0.35), w("E", "low", 0.25)], prefs: pr(1, 1, 1, 1) },
    ],
  },
  {
    key: "operations",
    hu: "Gyártás / logisztika",
    en: "Manufacturing / logistics",
    roles: [
      { key: "opsmgr", hu: "Folyamat- / üzemvezetés", en: "Operations management", weights: [w("C", "high", 0.45), w("X", "high", 0.3), w("E", "low", 0.25)], prefs: pr(1, 0, 0, -1) },
      { key: "quality", hu: "Minőségbiztosítás", en: "Quality assurance", weights: [w("C", "high", 0.6), w("H", "high", 0.25), w("O", "low", 0.15)], prefs: pr(-1, -1, 0, -1) },
      { key: "logistics", hu: "Logisztikai koordináció", en: "Logistics coordination", weights: [w("C", "high", 0.45), w("E", "low", 0.3), w("A", "high", 0.25)], prefs: pr(0, 0, 0, -1) },
      { key: "planning", hu: "Tervezés / ütemezés", en: "Planning / scheduling", weights: [w("C", "high", 0.5), w("O", "high", 0.3), w("E", "low", 0.2)], prefs: pr(-1, 0, 1, 0) },
      { key: "procurement", hu: "Beszerzés", en: "Procurement", weights: [w("C", "high", 0.4), w("H", "high", 0.3), w("A", "low", 0.3)], prefs: pr(0, 0, 0, -1) },
      { key: "maintenance", hu: "Karbantartás / műszaki", en: "Maintenance / technical", weights: [w("C", "high", 0.45), w("E", "low", 0.3), w("O", "high", 0.25)], prefs: pr(-1, 0, 1, -1) },
    ],
  },
  {
    key: "people",
    hu: "HR / szervezetfejlesztés",
    en: "HR / people",
    roles: [
      { key: "recruiter", hu: "Toborzás", en: "Recruiting", weights: [w("X", "high", 0.4), w("A", "high", 0.3), w("C", "high", 0.3)], prefs: pr(1, 1, 0, -1) },
      { key: "hrbp", hu: "HR partner", en: "HR business partner", weights: [w("A", "high", 0.35), w("H", "high", 0.35), w("X", "high", 0.3)], prefs: pr(1, 0, 0, 0) },
      { key: "od", hu: "Szervezetfejlesztés", en: "Org development", weights: [w("O", "high", 0.4), w("A", "high", 0.3), w("H", "high", 0.3)], prefs: pr(1, 1, 1, 1) },
      { key: "payroll", hu: "HR adminisztráció", en: "HR administration", weights: [w("C", "high", 0.55), w("H", "high", 0.25), w("X", "low", 0.2)], prefs: pr(-1, -1, 0, -1) },
      { key: "lnd", hu: "Képzés-fejlesztés (L&D)", en: "Learning & development", weights: [w("O", "high", 0.35), w("X", "high", 0.35), w("A", "high", 0.3)], prefs: pr(1, 1, 0, 1) },
      { key: "laborrel", hu: "Munkaügy / munkajog", en: "Labor relations", weights: [w("C", "high", 0.4), w("H", "high", 0.35), w("E", "low", 0.25)], prefs: pr(0, -1, 0, -1) },
    ],
  },
  {
    key: "public",
    hu: "Jog / közszféra",
    en: "Legal / public sector",
    roles: [
      { key: "legal", hu: "Jogi munka", en: "Legal work", weights: [w("C", "high", 0.45), w("H", "high", 0.3), w("E", "low", 0.25)], prefs: pr(-1, 0, 1, -1) },
      { key: "compliance", hu: "Megfelelőség / compliance", en: "Compliance", weights: [w("H", "high", 0.4), w("C", "high", 0.4), w("A", "low", 0.2)], prefs: pr(-1, -1, 0, -1) },
      { key: "policy", hu: "Szakpolitika / elemzés", en: "Policy / analysis", weights: [w("O", "high", 0.4), w("C", "high", 0.35), w("X", "low", 0.25)], prefs: pr(-1, 0, 1, 1) },
      { key: "publicservice", hu: "Ügyfélközeli közszolgálat", en: "Public-facing service", weights: [w("A", "high", 0.4), w("C", "high", 0.3), w("E", "low", 0.3)], prefs: pr(1, -1, -1, -1) },
      { key: "nonprofit", hu: "Nonprofit / közösségi munka", en: "Nonprofit / community work", weights: [w("H", "high", 0.35), w("A", "high", 0.35), w("E", "high", 0.3)], prefs: pr(1, 1, 0, 1) },
      { key: "lawenforce", hu: "Rendvédelem / biztonság", en: "Law enforcement / security", weights: [w("E", "low", 0.4), w("C", "high", 0.35), w("H", "high", 0.25)], prefs: pr(1, 0, -1, -1) },
    ],
  },
  {
    key: "engineering",
    hu: "Építőipar / mérnöki",
    en: "Construction / engineering",
    roles: [
      { key: "design", hu: "Tervezőmérnök", en: "Design engineer", weights: [w("C", "high", 0.45), w("O", "high", 0.35), w("X", "low", 0.2)], prefs: pr(-1, 0, 1, 1) },
      { key: "sitemgr", hu: "Kivitelezés-vezetés", en: "Site management", weights: [w("C", "high", 0.35), w("X", "high", 0.35), w("E", "low", 0.3)], prefs: pr(1, 1, 0, -1) },
      { key: "inspector", hu: "Műszaki ellenőr", en: "Technical inspector", weights: [w("C", "high", 0.5), w("H", "high", 0.3), w("A", "low", 0.2)], prefs: pr(-1, 0, 1, -1) },
      { key: "estimator", hu: "Kalkuláció / költségbecslés", en: "Cost estimation", weights: [w("C", "high", 0.55), w("O", "high", 0.25), w("X", "low", 0.2)], prefs: pr(-1, -1, 1, -1) },
      { key: "safety", hu: "Munkavédelem", en: "Occupational safety", weights: [w("C", "high", 0.4), w("H", "high", 0.35), w("A", "low", 0.25)], prefs: pr(0, 0, 0, -1) },
      { key: "facility", hu: "Épületüzemeltetés", en: "Facility management", weights: [w("C", "high", 0.45), w("E", "low", 0.3), w("A", "high", 0.25)], prefs: pr(0, -1, 0, -1) },
    ],
  },
  {
    key: "hospitality",
    hu: "Vendéglátás / turizmus",
    en: "Hospitality / tourism",
    roles: [
      { key: "chef", hu: "Séf / konyhai munka", en: "Chef / kitchen", weights: [w("C", "high", 0.4), w("E", "low", 0.35), w("O", "high", 0.25)], prefs: pr(-1, 0, 0, 1) },
      { key: "service", hu: "Felszolgálás / vendégkapcsolat", en: "Service / guest relations", weights: [w("X", "high", 0.4), w("A", "high", 0.35), w("E", "low", 0.25)], prefs: pr(1, 1, -1, -1) },
      { key: "hotelops", hu: "Szállodai üzemeltetés", en: "Hotel operations", weights: [w("C", "high", 0.45), w("X", "high", 0.3), w("E", "low", 0.25)], prefs: pr(1, 0, 0, -1) },
      { key: "events", hu: "Rendezvényszervezés", en: "Event management", weights: [w("X", "high", 0.35), w("C", "high", 0.35), w("E", "low", 0.3)], prefs: pr(1, 1, 0, 1) },
      { key: "guide", hu: "Idegenvezetés", en: "Tour guiding", weights: [w("X", "high", 0.45), w("O", "high", 0.3), w("A", "high", 0.25)], prefs: pr(1, 1, 1, 0) },
      { key: "frontdesk", hu: "Recepció / front office", en: "Front desk", weights: [w("A", "high", 0.4), w("X", "high", 0.3), w("E", "low", 0.3)], prefs: pr(1, -1, -1, -1) },
    ],
  },
  {
    key: "media",
    hu: "Média / kommunikáció",
    en: "Media / communications",
    roles: [
      { key: "journalist", hu: "Újságírás / szerkesztés", en: "Journalism / editing", weights: [w("O", "high", 0.4), w("H", "high", 0.3), w("C", "high", 0.3)], prefs: pr(0, 1, 1, 1) },
      { key: "pr", hu: "PR / kommunikáció", en: "PR / communications", weights: [w("X", "high", 0.4), w("O", "high", 0.3), w("E", "low", 0.3)], prefs: pr(1, 1, 0, 1) },
      { key: "production", hu: "Videó / produkció", en: "Video / production", weights: [w("O", "high", 0.4), w("C", "high", 0.35), w("X", "high", 0.25)], prefs: pr(0, 1, 0, 1) },
      { key: "presenter", hu: "Műsorvezetés / moderálás", en: "Presenting / hosting", weights: [w("X", "high", 0.55), w("E", "low", 0.25), w("O", "high", 0.2)], prefs: pr(1, 1, 0, 1) },
      { key: "photo", hu: "Fotográfia", en: "Photography", weights: [w("O", "high", 0.5), w("C", "high", 0.25), w("X", "low", 0.25)], prefs: pr(0, 1, 1, 1) },
      { key: "copywriter", hu: "Szövegírás", en: "Copywriting", weights: [w("O", "high", 0.45), w("C", "high", 0.3), w("X", "low", 0.25)], prefs: pr(-1, 1, 1, 1) },
    ],
  },
  {
    key: "science",
    hu: "Tudomány / kutatás",
    en: "Science / research",
    roles: [
      { key: "researcher", hu: "Kutató", en: "Researcher", weights: [w("O", "high", 0.45), w("C", "high", 0.35), w("X", "low", 0.2)], prefs: pr(-1, 0, 1, 1) },
      { key: "labtech", hu: "Laboratóriumi munka", en: "Lab work", weights: [w("C", "high", 0.55), w("H", "high", 0.25), w("O", "low", 0.2)], prefs: pr(-1, -1, 0, -1) },
      { key: "dataanalyst", hu: "Adatelemzés", en: "Data analysis", weights: [w("O", "high", 0.4), w("C", "high", 0.4), w("X", "low", 0.2)], prefs: pr(-1, 0, 1, 0) },
      { key: "scicomm", hu: "Tudományos kommunikáció", en: "Science communication", weights: [w("O", "high", 0.4), w("X", "high", 0.35), w("A", "high", 0.25)], prefs: pr(1, 1, 0, 1) },
      { key: "academia", hu: "Egyetemi oktatás", en: "Academic teaching", weights: [w("O", "high", 0.35), w("X", "high", 0.35), w("C", "high", 0.3)], prefs: pr(1, 0, 1, 0) },
      { key: "regulatory", hu: "Szabályozási ügyek", en: "Regulatory affairs", weights: [w("C", "high", 0.45), w("H", "high", 0.3), w("E", "low", 0.25)], prefs: pr(-1, -1, 0, -1) },
    ],
  },
];

function dimAlignment(score: number, direction: "high" | "low"): number {
  return direction === "high" ? score : 100 - score;
}

/**
 * Vezetői fókusz: a szerep alap-súlyai mellé vezetői komponensek kerülnek
 * (társas energia, nyomásállóság, delegáláshoz kellő együttműködés), majd
 * a súlyok visszanormalizálódnak 1-re.
 */
export function applyLeadFocus(weights: RoleWeight[]): RoleWeight[] {
  const LEAD_EXTRA: RoleWeight[] = [w("X", "high", 0.2), w("E", "low", 0.1), w("A", "high", 0.1)];
  const merged = new Map<string, RoleWeight>();
  for (const entry of [...weights, ...LEAD_EXTRA]) {
    const key = `${entry.dim}:${entry.direction}`;
    const existing = merged.get(key);
    merged.set(key, existing ? { ...entry, weight: existing.weight + entry.weight } : { ...entry });
  }
  const list = [...merged.values()];
  const total = list.reduce((sum, entry) => sum + entry.weight, 0);
  return list.map((entry) => ({ ...entry, weight: entry.weight / total }));
}

/** Preferencia-egyezés 0-100: a beállított tengelyeken mért közelség átlaga. */
export function scorePrefMatch(prefs: UserPrefs, role: IndustryRole): number | null {
  const axes = (Object.keys(prefs) as PrefAxis[]).filter(
    (axis) => prefs[axis] !== undefined && prefs[axis] !== 0,
  );
  if (axes.length === 0) return null;
  const sum = axes.reduce((acc, axis) => {
    const distance = Math.abs((prefs[axis] as number) - role.prefs[axis]);
    return acc + (1 - distance / 2);
  }, 0);
  return Math.round((sum / axes.length) * 100);
}

export interface RoleFitBreakdownEntry {
  dim: DimCode;
  direction: "high" | "low";
  weight: number;
  userValue: number;
  alignment: number;
}

/** Dimenziónkénti bontás az „miért ennyi?" nézethez. */
export function explainRoleFit(
  scores: Partial<Record<DimCode, number>>,
  role: IndustryRole,
  options?: { leadFocus?: boolean },
): RoleFitBreakdownEntry[] {
  const weights = options?.leadFocus ? applyLeadFocus(role.weights) : role.weights;
  return weights
    .filter((entry) => typeof scores[entry.dim] === "number")
    .map((entry) => ({
      dim: entry.dim,
      direction: entry.direction,
      weight: entry.weight,
      userValue: scores[entry.dim] as number,
      alignment: Math.round(dimAlignment(scores[entry.dim] as number, entry.direction)),
    }))
    .sort((a, b) => b.weight - a.weight);
}

export function scoreRoleFit(
  scores: Partial<Record<DimCode, number>>,
  role: IndustryRole,
  options?: RankOptions,
): RoleFitResult | null {
  let weighted = 0;
  let totalWeight = 0;
  let topDriver: DimCode | null = null;
  let topAlignment = -1;
  let watchDim: DimCode | null = null;
  let worstAlignment = 101;

  const weights = options?.leadFocus ? applyLeadFocus(role.weights) : role.weights;
  for (const entry of weights) {
    const value = scores[entry.dim];
    if (typeof value !== "number") continue;
    const alignment = dimAlignment(value, entry.direction);
    weighted += alignment * entry.weight;
    totalWeight += entry.weight;
    if (alignment > topAlignment) {
      topAlignment = alignment;
      topDriver = entry.dim;
    }
    if (alignment < worstAlignment) {
      worstAlignment = alignment;
      watchDim = entry.dim;
    }
  }

  if (totalWeight === 0 || !topDriver) return null;
  const score = Math.round(weighted / totalWeight);
  const prefMatch = options?.prefs ? scorePrefMatch(options.prefs, role) : null;
  return {
    role,
    score,
    topDriver,
    watchDim: worstAlignment < 55 ? watchDim : null,
    prefMatch,
    // Preferencia csak a rangsort árnyalja; a személyiség-illeszkedés dominál.
    combined: prefMatch === null ? score : Math.round(score * 0.7 + prefMatch * 0.3),
  };
}

export interface RankOptions {
  leadFocus?: boolean;
  prefs?: UserPrefs;
}

// ── Karrier-háttér (Karrier-iránytű wizard) ─────────────────────────────────

export type CareerStatus = "studying" | "working" | "switching";
export type EduLevel = "primary" | "secondary" | "vocational" | "higher";
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

export interface CareerBackground {
  status: CareerStatus;
  eduLevel: EduLevel | null;
  eduField: EduField | null;
  ageBand: AgeBand | null;
  /** Jelenlegi iparág (ha dolgozik / váltana) — katalógus-kulcs */
  currentIndustry: string | null;
  /** Érdeklődési iparágak (0-3 katalógus-kulcs; üres = nyitott mindenre) */
  interests: string[];
}

/**
 * Végzettség-terület → iparág affinitás. A képzettség kis boost-ot ad a
 * rangsorban (a belépési küszöb ott alacsonyabb), de nem zár ki semmit.
 */
export const EDU_INDUSTRY_AFFINITY: Record<EduField, string[]> = {
  tech_engineering: ["tech", "engineering", "operations", "science"],
  economics: ["finance", "sales", "operations", "people"],
  health: ["health", "science"],
  humanities: ["media", "education", "people", "public"],
  natural_science: ["science", "health", "tech"],
  legal: ["public", "finance", "people"],
  arts: ["creative", "media", "hospitality"],
  pedagogy: ["education", "people", "health"],
  trade: ["engineering", "operations", "hospitality"],
  none_other: [],
};

/** Boost a kombinált pontszámon, ha a szerep iparága illik a képzettséghez. */
const EDU_BOOST = 6;

export interface CareerSuggestion extends RoleFitResult {
  industryKey: string;
  industryHu: string;
  industryEn: string;
  /** A végzettség-affinitás emelte-e a rangsorban */
  eduBoosted: boolean;
}

export interface CareerSuggestionResult {
  /** Kereszt-iparági javaslatok (érdeklődés szerint szűkítve, ha van) */
  suggestions: CareerSuggestion[];
  /** A jelenlegi iparág legjobb szerepei (ha ismert) */
  currentIndustryTop: CareerSuggestion[];
  /** A top javaslatok leggyakoribb figyelendő dimenziói (max 2) */
  developDims: DimCode[];
}

export function rankCareerSuggestions(
  scores: Partial<Record<DimCode, number>>,
  background: CareerBackground,
  options?: RankOptions,
): CareerSuggestionResult {
  const affinity = background.eduField
    ? new Set(EDU_INDUSTRY_AFFINITY[background.eduField])
    : new Set<string>();

  const toSuggestion = (industry: Industry) => (result: RoleFitResult): CareerSuggestion => {
    const eduBoosted = affinity.has(industry.key);
    return {
      ...result,
      combined: result.combined + (eduBoosted ? EDU_BOOST : 0),
      industryKey: industry.key,
      industryHu: industry.hu,
      industryEn: industry.en,
      eduBoosted,
    };
  };

  const scopeKeys =
    background.interests.length > 0
      ? background.interests
      : INDUSTRIES.map((industry) => industry.key);

  const suggestions = INDUSTRIES.filter((industry) => scopeKeys.includes(industry.key))
    .flatMap((industry) =>
      industry.roles
        .map((role) => scoreRoleFit(scores, role, options))
        .filter((r): r is RoleFitResult => r !== null)
        .map(toSuggestion(industry)),
    )
    .sort((a, b) => b.combined - a.combined)
    .slice(0, 6);

  const currentIndustry = background.currentIndustry
    ? INDUSTRIES.find((industry) => industry.key === background.currentIndustry) ?? null
    : null;
  const currentIndustryTop = currentIndustry
    ? currentIndustry.roles
        .map((role) => scoreRoleFit(scores, role, options))
        .filter((r): r is RoleFitResult => r !== null)
        .map(toSuggestion(currentIndustry))
        .sort((a, b) => b.combined - a.combined)
        .slice(0, 3)
    : [];

  // Fejlődési irány: a top javaslatokban leggyakrabban jelzett watch-dimenziók.
  const watchCounts = new Map<DimCode, number>();
  for (const suggestion of suggestions.slice(0, 5)) {
    if (suggestion.watchDim) {
      watchCounts.set(suggestion.watchDim, (watchCounts.get(suggestion.watchDim) ?? 0) + 1);
    }
  }
  const developDims = [...watchCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([dim]) => dim);

  return { suggestions, currentIndustryTop, developDims };
}

/** Egy iparág szerepei kombinált pontszám szerint csökkenő sorrendben. */
export function rankIndustryFit(
  scores: Partial<Record<DimCode, number>>,
  industryKey: string,
  options?: RankOptions,
): RoleFitResult[] {
  const industry = INDUSTRIES.find((i) => i.key === industryKey);
  if (!industry) return [];
  return industry.roles
    .map((role) => scoreRoleFit(scores, role, options))
    .filter((r): r is RoleFitResult => r !== null)
    .sort((a, b) => b.combined - a.combined);
}
