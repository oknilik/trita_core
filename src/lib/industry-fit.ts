// Iparági illeszkedés — a hatfaktoros önértékelésből becsült szerep-illeszkedés
// egy választott iparágon belül. INDIKATÍV, önértékelés-alapú jelzés, nem
// pályaválasztási tanácsadás — a UI kötelezően jelzi a módszertani keretet.
//
// Modell: minden szerephez 2-4 kulcsdimenzió tartozik iránnyal és súllyal.
// Illeszkedés = súlyozott átlaga annak, mennyire esik a user értéke a kívánt
// irányba (0-100). Az E dimenzió fordított skálájú (magasabb = érzelmesebb),
// ezért a nyomásálló szerepeknél "low" irányt használunk.

export type DimCode = "INTE" | "RESO" | "TEMP" | "ADAP" | "THOR" | "OPEN";

interface RoleWeight {
  dim: DimCode;
  /**
   * Facet-szintű finomítás: ha meg van adva ÉS a hívó átadott facet-
   * pontszámokat, az illeszkedés a facet értékéből számolódik (a dim csak
   * fallback). Kódok a kérdésbank facet-kódjai + "altruism".
   */
  facet?: string;
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

/**
 * Munkakörnyezet-tengelyek (2. ütem pontosító kérdései): pace (-1 nyugodt
 * ütem ↔ 1 pörgős/nyomás alatt), structure (-1 laza keretek ↔ 1 szabályozott),
 * setting (-1 képernyő/iroda ↔ 1 terep/mozgás). A szerep-oldali értékek
 * iparági defaultból + szerep-felülbírálásból jönnek (roleEnvProfile).
 */
export type EnvAxis = "pace" | "structure" | "setting";
export type UserPrefs = Partial<Record<PrefAxis | EnvAxis, PrefValue>>;

/**
 * Belépési végzettség-igény — a szerep-kártyán megjegyzésként jelenik meg.
 * "open" = nem végzettséghez kötött · "course" = tanfolyammal/átképzéssel
 * elérhető · "vocational" = szakképzettséghez kötött · "higher" = jellemzően
 * diplomához kötött · "specialized" = szakirányú diploma + szakvizsga/
 * kamarai tagság (orvos, jogász, pszichológus…).
 */
export type EduReq = "open" | "course" | "vocational" | "higher" | "specialized";

export interface IndustryRole {
  key: string;
  hu: string;
  en: string;
  weights: RoleWeight[];
  /** A szerep pozíciója a preferencia-tengelyeken (-1..1) */
  prefs: Record<PrefAxis, number>;
  /** Belépési végzettség-igény (megjegyzés a kártyán) */
  edu: EduReq;
  /** Munkakörnyezet-profil (init tölti fel a roleEnvProfile-ból) */
  env?: Record<EnvAxis, number>;
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
  /** Konfidencia-sáv a pontszám körül (forma + observer-megerősítés szerint) */
  band: { low: number; high: number };
  /** Facet-pontosított súlykészlettel számolt-e */
  facetPrecision: boolean;
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
      { key: "dev", hu: "Fejlesztő", en: "Developer", weights: [w("THOR", "high", 0.5), w("OPEN", "high", 0.3), w("TEMP", "low", 0.2)], prefs: pr(-1, 0, 1, 1) , edu: "course" },
      { key: "pm", hu: "Termékmenedzser", en: "Product manager", weights: [w("TEMP", "high", 0.35), w("OPEN", "high", 0.35), w("THOR", "high", 0.3)], prefs: pr(1, 1, 0, 1) , edu: "higher" },
      { key: "qa", hu: "Tesztelő / QA", en: "QA engineer", weights: [w("THOR", "high", 0.6), w("INTE", "high", 0.2), w("OPEN", "low", 0.2)], prefs: pr(-1, -1, 0, -1) , edu: "course" },
      { key: "ux", hu: "UX designer", en: "UX designer", weights: [w("OPEN", "high", 0.45), w("ADAP", "high", 0.3), w("RESO", "high", 0.25)], prefs: pr(1, 1, 0, 1) , edu: "course" },
      { key: "devops", hu: "Üzemeltetés / DevOps", en: "Ops / DevOps", weights: [w("THOR", "high", 0.45), w("RESO", "low", 0.35), w("OPEN", "high", 0.2)], prefs: pr(-1, 0, 1, -1) , edu: "course" },
      { key: "data", hu: "Adatelemző / data scientist", en: "Data analyst / scientist", weights: [w("OPEN", "high", 0.4), w("THOR", "high", 0.4), w("TEMP", "low", 0.2)], prefs: pr(-1, 0, 1, 1) , edu: "higher" },
      { key: "itsupport", hu: "IT support / helpdesk", en: "IT support / helpdesk", weights: [w("ADAP", "high", 0.4), w("THOR", "high", 0.3), w("RESO", "low", 0.3)], prefs: pr(1, -1, -1, -1) , edu: "course" },
      { key: "security", hu: "IT-biztonság", en: "IT security", weights: [w("THOR", "high", 0.4), w("INTE", "high", 0.3), w("OPEN", "high", 0.3)], prefs: pr(-1, 0, 1, -1) , edu: "course" },
      { key: "sysadmin", hu: "Rendszergazda / hálózat", en: "Sysadmin / network", weights: [w("THOR", "high", 0.5), w("RESO", "low", 0.25), w("TEMP", "low", 0.25)], prefs: pr(-1, -1, 1, -1) , edu: "course" },
      { key: "techwriter", hu: "Műszaki író / dokumentáció", en: "Technical writer", weights: [w("THOR", "high", 0.4), w("OPEN", "high", 0.35), w("TEMP", "low", 0.25)], prefs: pr(-1, -1, 1, 1) , edu: "higher" },
    ],
  },
  {
    key: "health",
    hu: "Egészségügy / gondoskodás",
    en: "Healthcare / care",
    roles: [
      { key: "clinical", hu: "Klinikai munka", en: "Clinical work", weights: [w("THOR", "high", 0.35), w("RESO", "low", 0.35), w("ADAP", "high", 0.3)], prefs: pr(1, 0, 0, -1) , edu: "specialized" },
      { key: "care", hu: "Ápolás / gondozás", en: "Nursing / caregiving", weights: [w("ADAP", "high", 0.4), w("RESO", "high", 0.3), w("THOR", "high", 0.3)], prefs: pr(1, -1, -1, -1) , edu: "vocational" },
      { key: "therapy", hu: "Terápia / tanácsadás", en: "Therapy / counseling", weights: [w("ADAP", "high", 0.35), w("RESO", "high", 0.35), w("INTE", "high", 0.3)], prefs: pr(1, 0, 1, 0) , edu: "specialized" },
      { key: "healthadmin", hu: "Egészségügyi szervezés", en: "Health administration", weights: [w("THOR", "high", 0.5), w("INTE", "high", 0.3), w("TEMP", "high", 0.2)], prefs: pr(0, -1, 0, -1) , edu: "higher" },
      { key: "emergency", hu: "Sürgősségi / mentés", en: "Emergency / rescue", weights: [w("RESO", "low", 0.45), w("THOR", "high", 0.35), w("TEMP", "high", 0.2)], prefs: pr(1, 1, 0, -1) , edu: "vocational" },
      { key: "rehab", hu: "Rehabilitáció / gyógytorna", en: "Rehabilitation / physiotherapy", weights: [w("ADAP", "high", 0.4), w("THOR", "high", 0.35), w("RESO", "high", 0.25)], prefs: pr(1, 0, 1, -1) , edu: "higher" },
      { key: "psychologist", hu: "Pszichológus", en: "Psychologist", weights: [w("RESO", "high", 0.3), w("INTE", "high", 0.3), w("OPEN", "high", 0.4)], prefs: pr(1, 0, 1, 0) , edu: "specialized" },
      { key: "physician", hu: "Orvos", en: "Physician", weights: [w("THOR", "high", 0.35), w("RESO", "low", 0.3), w("OPEN", "high", 0.35)], prefs: pr(1, 0, 0, -1) , edu: "specialized" },
      { key: "pharmacist", hu: "Gyógyszerész", en: "Pharmacist", weights: [w("THOR", "high", 0.55), w("INTE", "high", 0.25), w("TEMP", "low", 0.2)], prefs: pr(0, -1, 0, -1) , edu: "specialized" },
      { key: "healthvisitor", hu: "Védőnő / közösségi egészségügy", en: "Community health worker", weights: [w("ADAP", "high", 0.4), w("INTE", "high", 0.3), w("RESO", "high", 0.3)], prefs: pr(1, 0, 1, -1) , edu: "higher" },
    ],
  },
  {
    key: "education",
    hu: "Oktatás / képzés",
    en: "Education / training",
    roles: [
      { key: "teacher", hu: "Tanár / oktató", en: "Teacher / educator", weights: [w("TEMP", "high", 0.35), w("ADAP", "high", 0.35), w("THOR", "high", 0.3)], prefs: pr(1, 0, 0, 0) , edu: "higher" },
      { key: "trainer", hu: "Tréner / facilitátor", en: "Trainer / facilitator", weights: [w("TEMP", "high", 0.45), w("OPEN", "high", 0.3), w("ADAP", "high", 0.25)], prefs: pr(1, 1, 0, 1) , edu: "course" },
      { key: "mentor", hu: "Mentor / fejlesztő", en: "Mentor / coach", weights: [w("ADAP", "high", 0.4), w("INTE", "high", 0.3), w("RESO", "high", 0.3)], prefs: pr(1, 0, 1, 0) , edu: "course" },
      { key: "edtech", hu: "Tananyag-fejlesztés", en: "Curriculum design", weights: [w("OPEN", "high", 0.4), w("THOR", "high", 0.4), w("TEMP", "low", 0.2)], prefs: pr(-1, 0, 1, 1) , edu: "higher" },
      { key: "earlyyears", hu: "Kisgyermeknevelés", en: "Early childhood education", weights: [w("ADAP", "high", 0.4), w("RESO", "high", 0.3), w("THOR", "high", 0.3)], prefs: pr(1, -1, -1, 0) , edu: "higher" },
      { key: "specialed", hu: "Gyógypedagógia / fejlesztés", en: "Special education", weights: [w("ADAP", "high", 0.4), w("THOR", "high", 0.3), w("INTE", "high", 0.3)], prefs: pr(1, 0, 0, 0) , edu: "higher" },
      { key: "languageteacher", hu: "Nyelvtanár / magántanár", en: "Language teacher / tutor", weights: [w("TEMP", "high", 0.35), w("ADAP", "high", 0.35), w("OPEN", "high", 0.3)], prefs: pr(1, 0, 1, 0) , edu: "higher" },
      { key: "teachassist", hu: "Pedagógiai asszisztens", en: "Teaching assistant", weights: [w("ADAP", "high", 0.45), w("THOR", "high", 0.3), w("RESO", "high", 0.25)], prefs: pr(1, -1, -1, -1) , edu: "vocational" },
    ],
  },
  {
    key: "finance",
    hu: "Pénzügy / számvitel",
    en: "Finance / accounting",
    roles: [
      { key: "analyst", hu: "Elemző", en: "Analyst", weights: [w("THOR", "high", 0.5), w("OPEN", "high", 0.3), w("RESO", "low", 0.2)], prefs: pr(-1, 0, 1, 0) , edu: "higher" },
      { key: "accounting", hu: "Könyvelés / kontrolling", en: "Accounting / controlling", weights: [w("THOR", "high", 0.6), w("INTE", "high", 0.25), w("OPEN", "low", 0.15)], prefs: pr(-1, -1, 0, -1) , edu: "vocational" },
      { key: "advisor", hu: "Pénzügyi tanácsadó", en: "Financial advisor", weights: [w("TEMP", "high", 0.35), w("INTE", "high", 0.35), w("THOR", "high", 0.3)], prefs: pr(1, 0, 0, -1) , edu: "higher" },
      { key: "risk", hu: "Kockázatkezelés", en: "Risk management", weights: [w("THOR", "high", 0.4), w("RESO", "low", 0.3), w("INTE", "high", 0.3)], prefs: pr(-1, 0, 0, -1) , edu: "higher" },
      { key: "audit", hu: "Audit / ellenőrzés", en: "Audit", weights: [w("THOR", "high", 0.45), w("INTE", "high", 0.35), w("ADAP", "low", 0.2)], prefs: pr(-1, 0, 0, -1) , edu: "higher" },
      { key: "banking", hu: "Banki ügyfélkezelés", en: "Retail banking", weights: [w("TEMP", "high", 0.35), w("THOR", "high", 0.35), w("INTE", "high", 0.3)], prefs: pr(1, -1, -1, -1) , edu: "course" },
      { key: "taxadvisor", hu: "Adótanácsadó", en: "Tax advisor", weights: [w("THOR", "high", 0.5), w("INTE", "high", 0.3), w("OPEN", "low", 0.2)], prefs: pr(0, -1, 1, -1) , edu: "higher" },
      { key: "insurance", hu: "Biztosítási szakértő", en: "Insurance specialist", weights: [w("TEMP", "high", 0.35), w("THOR", "high", 0.35), w("INTE", "high", 0.3)], prefs: pr(1, 0, 0, -1) , edu: "course" },
    ],
  },
  {
    key: "sales",
    hu: "Értékesítés / ügyfélkapcsolat",
    en: "Sales / client relations",
    roles: [
      { key: "sales", hu: "Értékesítő", en: "Sales representative", weights: [w("TEMP", "high", 0.5), w("RESO", "low", 0.25), w("ADAP", "low", 0.25)], prefs: pr(1, 1, 1, -1) , edu: "open" },
      { key: "account", hu: "Ügyfélmenedzser", en: "Account manager", weights: [w("TEMP", "high", 0.35), w("ADAP", "high", 0.35), w("THOR", "high", 0.3)], prefs: pr(1, 0, 0, -1) , edu: "course" },
      { key: "support", hu: "Ügyfélszolgálat", en: "Customer support", weights: [w("ADAP", "high", 0.4), w("RESO", "low", 0.3), w("THOR", "high", 0.3)], prefs: pr(1, -1, -1, -1) , edu: "open" },
      { key: "bizdev", hu: "Üzletfejlesztés", en: "Business development", weights: [w("TEMP", "high", 0.4), w("OPEN", "high", 0.35), w("RESO", "low", 0.25)], prefs: pr(1, 1, 1, 1) , edu: "course" },
      { key: "retail", hu: "Üzletvezetés / retail", en: "Store management / retail", weights: [w("THOR", "high", 0.4), w("TEMP", "high", 0.35), w("RESO", "low", 0.25)], prefs: pr(1, 0, 0, -1) , edu: "course" },
      { key: "ecommerce", hu: "E-kereskedelem", en: "E-commerce", weights: [w("THOR", "high", 0.4), w("OPEN", "high", 0.35), w("TEMP", "low", 0.25)], prefs: pr(-1, 1, 1, 0) , edu: "course" },
    ],
  },
  {
    key: "creative",
    hu: "Marketing / kreatív",
    en: "Marketing / creative",
    roles: [
      { key: "creative", hu: "Kreatív alkotó", en: "Creative", weights: [w("OPEN", "high", 0.55), w("TEMP", "high", 0.25), w("THOR", "low", 0.2)], prefs: pr(0, 1, 1, 1) , edu: "course" },
      { key: "content", hu: "Tartalomkészítő", en: "Content creator", weights: [w("OPEN", "high", 0.4), w("THOR", "high", 0.3), w("TEMP", "high", 0.3)], prefs: pr(0, 1, 1, 1) , edu: "open" },
      { key: "brand", hu: "Márka / kampánymenedzser", en: "Brand / campaign manager", weights: [w("TEMP", "high", 0.35), w("THOR", "high", 0.35), w("OPEN", "high", 0.3)], prefs: pr(1, 1, 0, 1) , edu: "higher" },
      { key: "research", hu: "Piackutatás", en: "Market research", weights: [w("OPEN", "high", 0.4), w("THOR", "high", 0.4), w("TEMP", "low", 0.2)], prefs: pr(-1, 0, 1, 0) , edu: "higher" },
      { key: "visual", hu: "Grafika / vizuális design", en: "Graphic / visual design", weights: [w("OPEN", "high", 0.5), w("THOR", "high", 0.3), w("TEMP", "low", 0.2)], prefs: pr(-1, 1, 1, 1) , edu: "course" },
      { key: "socialmedia", hu: "Social media", en: "Social media", weights: [w("TEMP", "high", 0.4), w("OPEN", "high", 0.35), w("RESO", "low", 0.25)], prefs: pr(1, 1, 1, 1) , edu: "open" },
    ],
  },
  {
    key: "operations",
    hu: "Gyártás / logisztika",
    en: "Manufacturing / logistics",
    roles: [
      { key: "opsmgr", hu: "Folyamat- / üzemvezetés", en: "Operations management", weights: [w("THOR", "high", 0.45), w("TEMP", "high", 0.3), w("RESO", "low", 0.25)], prefs: pr(1, 0, 0, -1) , edu: "higher" },
      { key: "quality", hu: "Minőségbiztosítás", en: "Quality assurance", weights: [w("THOR", "high", 0.6), w("INTE", "high", 0.25), w("OPEN", "low", 0.15)], prefs: pr(-1, -1, 0, -1) , edu: "vocational" },
      { key: "logistics", hu: "Logisztikai koordináció", en: "Logistics coordination", weights: [w("THOR", "high", 0.45), w("RESO", "low", 0.3), w("ADAP", "high", 0.25)], prefs: pr(0, 0, 0, -1) , edu: "course" },
      { key: "planning", hu: "Tervezés / ütemezés", en: "Planning / scheduling", weights: [w("THOR", "high", 0.5), w("OPEN", "high", 0.3), w("RESO", "low", 0.2)], prefs: pr(-1, 0, 1, 0) , edu: "higher" },
      { key: "procurement", hu: "Beszerzés", en: "Procurement", weights: [w("THOR", "high", 0.4), w("INTE", "high", 0.3), w("ADAP", "low", 0.3)], prefs: pr(0, 0, 0, -1) , edu: "higher" },
      { key: "maintenance", hu: "Karbantartás / műszaki", en: "Maintenance / technical", weights: [w("THOR", "high", 0.45), w("RESO", "low", 0.3), w("OPEN", "high", 0.25)], prefs: pr(-1, 0, 1, -1) , edu: "vocational" },
    ],
  },
  {
    key: "people",
    hu: "HR / szervezetfejlesztés",
    en: "HR / people",
    roles: [
      { key: "recruiter", hu: "Toborzás", en: "Recruiting", weights: [w("TEMP", "high", 0.4), w("ADAP", "high", 0.3), w("THOR", "high", 0.3)], prefs: pr(1, 1, 0, -1) , edu: "course" },
      { key: "hrbp", hu: "HR partner", en: "HR business partner", weights: [w("ADAP", "high", 0.35), w("INTE", "high", 0.35), w("TEMP", "high", 0.3)], prefs: pr(1, 0, 0, 0) , edu: "higher" },
      { key: "od", hu: "Szervezetfejlesztés", en: "Org development", weights: [w("OPEN", "high", 0.4), w("ADAP", "high", 0.3), w("INTE", "high", 0.3)], prefs: pr(1, 1, 1, 1) , edu: "higher" },
      { key: "payroll", hu: "HR adminisztráció", en: "HR administration", weights: [w("THOR", "high", 0.55), w("INTE", "high", 0.25), w("TEMP", "low", 0.2)], prefs: pr(-1, -1, 0, -1) , edu: "vocational" },
      { key: "lnd", hu: "Képzés-fejlesztés (L&D)", en: "Learning & development", weights: [w("OPEN", "high", 0.35), w("TEMP", "high", 0.35), w("ADAP", "high", 0.3)], prefs: pr(1, 1, 0, 1) , edu: "higher" },
      { key: "laborrel", hu: "Munkaügy / munkajog", en: "Labor relations", weights: [w("THOR", "high", 0.4), w("INTE", "high", 0.35), w("RESO", "low", 0.25)], prefs: pr(0, -1, 0, -1) , edu: "higher" },
    ],
  },
  {
    key: "public",
    hu: "Jog / közszféra",
    en: "Legal / public sector",
    roles: [
      { key: "legal", hu: "Jogi munka", en: "Legal work", weights: [w("THOR", "high", 0.45), w("INTE", "high", 0.3), w("RESO", "low", 0.25)], prefs: pr(-1, 0, 1, -1) , edu: "specialized" },
      { key: "compliance", hu: "Megfelelőség / compliance", en: "Compliance", weights: [w("INTE", "high", 0.4), w("THOR", "high", 0.4), w("ADAP", "low", 0.2)], prefs: pr(-1, -1, 0, -1) , edu: "higher" },
      { key: "policy", hu: "Szakpolitika / elemzés", en: "Policy / analysis", weights: [w("OPEN", "high", 0.4), w("THOR", "high", 0.35), w("TEMP", "low", 0.25)], prefs: pr(-1, 0, 1, 1) , edu: "higher" },
      { key: "publicservice", hu: "Ügyfélközeli közszolgálat", en: "Public-facing service", weights: [w("ADAP", "high", 0.4), w("THOR", "high", 0.3), w("RESO", "low", 0.3)], prefs: pr(1, -1, -1, -1) , edu: "course" },
      { key: "nonprofit", hu: "Nonprofit / közösségi munka", en: "Nonprofit / community work", weights: [w("INTE", "high", 0.35), w("ADAP", "high", 0.35), w("RESO", "high", 0.3)], prefs: pr(1, 1, 0, 1) , edu: "open" },
      { key: "lawenforce", hu: "Rendvédelem / biztonság", en: "Law enforcement / security", weights: [w("RESO", "low", 0.4), w("THOR", "high", 0.35), w("INTE", "high", 0.25)], prefs: pr(1, 0, -1, -1) , edu: "vocational" },
      { key: "socialworker", hu: "Szociális munkás", en: "Social worker", weights: [w("ADAP", "high", 0.35), w("INTE", "high", 0.3), w("RESO", "high", 0.35)], prefs: pr(1, 0, 0, -1) , edu: "higher" },
    ],
  },
  {
    key: "engineering",
    hu: "Építőipar / mérnöki",
    en: "Construction / engineering",
    roles: [
      { key: "design", hu: "Tervezőmérnök", en: "Design engineer", weights: [w("THOR", "high", 0.45), w("OPEN", "high", 0.35), w("TEMP", "low", 0.2)], prefs: pr(-1, 0, 1, 1) , edu: "higher" },
      { key: "sitemgr", hu: "Kivitelezés-vezetés", en: "Site management", weights: [w("THOR", "high", 0.35), w("TEMP", "high", 0.35), w("RESO", "low", 0.3)], prefs: pr(1, 1, 0, -1) , edu: "higher" },
      { key: "inspector", hu: "Műszaki ellenőr", en: "Technical inspector", weights: [w("THOR", "high", 0.5), w("INTE", "high", 0.3), w("ADAP", "low", 0.2)], prefs: pr(-1, 0, 1, -1) , edu: "higher" },
      { key: "estimator", hu: "Kalkuláció / költségbecslés", en: "Cost estimation", weights: [w("THOR", "high", 0.55), w("OPEN", "high", 0.25), w("TEMP", "low", 0.2)], prefs: pr(-1, -1, 1, -1) , edu: "vocational" },
      { key: "safety", hu: "Munkavédelem", en: "Occupational safety", weights: [w("THOR", "high", 0.4), w("INTE", "high", 0.35), w("ADAP", "low", 0.25)], prefs: pr(0, 0, 0, -1) , edu: "vocational" },
      { key: "facility", hu: "Épületüzemeltetés", en: "Facility management", weights: [w("THOR", "high", 0.45), w("RESO", "low", 0.3), w("ADAP", "high", 0.25)], prefs: pr(0, -1, 0, -1) , edu: "course" },
    ],
  },
  {
    key: "hospitality",
    hu: "Vendéglátás / turizmus",
    en: "Hospitality / tourism",
    roles: [
      { key: "chef", hu: "Séf / konyhai munka", en: "Chef / kitchen", weights: [w("THOR", "high", 0.4), w("RESO", "low", 0.35), w("OPEN", "high", 0.25)], prefs: pr(-1, 0, 0, 1) , edu: "vocational" },
      { key: "service", hu: "Felszolgálás / vendégkapcsolat", en: "Service / guest relations", weights: [w("TEMP", "high", 0.4), w("ADAP", "high", 0.35), w("RESO", "low", 0.25)], prefs: pr(1, 1, -1, -1) , edu: "open" },
      { key: "hotelops", hu: "Szállodai üzemeltetés", en: "Hotel operations", weights: [w("THOR", "high", 0.45), w("TEMP", "high", 0.3), w("RESO", "low", 0.25)], prefs: pr(1, 0, 0, -1) , edu: "course" },
      { key: "events", hu: "Rendezvényszervezés", en: "Event management", weights: [w("TEMP", "high", 0.35), w("THOR", "high", 0.35), w("RESO", "low", 0.3)], prefs: pr(1, 1, 0, 1) , edu: "course" },
      { key: "guide", hu: "Idegenvezetés", en: "Tour guiding", weights: [w("TEMP", "high", 0.45), w("OPEN", "high", 0.3), w("ADAP", "high", 0.25)], prefs: pr(1, 1, 1, 0) , edu: "course" },
      { key: "frontdesk", hu: "Recepció / front office", en: "Front desk", weights: [w("ADAP", "high", 0.4), w("TEMP", "high", 0.3), w("RESO", "low", 0.3)], prefs: pr(1, -1, -1, -1) , edu: "open" },
    ],
  },
  {
    key: "media",
    hu: "Média / kommunikáció",
    en: "Media / communications",
    roles: [
      { key: "journalist", hu: "Újságírás / szerkesztés", en: "Journalism / editing", weights: [w("OPEN", "high", 0.4), w("INTE", "high", 0.3), w("THOR", "high", 0.3)], prefs: pr(0, 1, 1, 1) , edu: "higher" },
      { key: "pr", hu: "PR / kommunikáció", en: "PR / communications", weights: [w("TEMP", "high", 0.4), w("OPEN", "high", 0.3), w("RESO", "low", 0.3)], prefs: pr(1, 1, 0, 1) , edu: "higher" },
      { key: "production", hu: "Videó / produkció", en: "Video / production", weights: [w("OPEN", "high", 0.4), w("THOR", "high", 0.35), w("TEMP", "high", 0.25)], prefs: pr(0, 1, 0, 1) , edu: "course" },
      { key: "presenter", hu: "Műsorvezetés / moderálás", en: "Presenting / hosting", weights: [w("TEMP", "high", 0.55), w("RESO", "low", 0.25), w("OPEN", "high", 0.2)], prefs: pr(1, 1, 0, 1) , edu: "course" },
      { key: "photo", hu: "Fotográfia", en: "Photography", weights: [w("OPEN", "high", 0.5), w("THOR", "high", 0.25), w("TEMP", "low", 0.25)], prefs: pr(0, 1, 1, 1) , edu: "course" },
      { key: "copywriter", hu: "Szövegírás", en: "Copywriting", weights: [w("OPEN", "high", 0.45), w("THOR", "high", 0.3), w("TEMP", "low", 0.25)], prefs: pr(-1, 1, 1, 1) , edu: "course" },
    ],
  },
  {
    key: "science",
    hu: "Tudomány / kutatás",
    en: "Science / research",
    roles: [
      { key: "researcher", hu: "Kutató", en: "Researcher", weights: [w("OPEN", "high", 0.45), w("THOR", "high", 0.35), w("TEMP", "low", 0.2)], prefs: pr(-1, 0, 1, 1) , edu: "specialized" },
      { key: "labtech", hu: "Laboratóriumi munka", en: "Lab work", weights: [w("THOR", "high", 0.55), w("INTE", "high", 0.25), w("OPEN", "low", 0.2)], prefs: pr(-1, -1, 0, -1) , edu: "vocational" },
      { key: "dataanalyst", hu: "Adatelemzés", en: "Data analysis", weights: [w("OPEN", "high", 0.4), w("THOR", "high", 0.4), w("TEMP", "low", 0.2)], prefs: pr(-1, 0, 1, 0) , edu: "higher" },
      { key: "scicomm", hu: "Tudományos kommunikáció", en: "Science communication", weights: [w("OPEN", "high", 0.4), w("TEMP", "high", 0.35), w("ADAP", "high", 0.25)], prefs: pr(1, 1, 0, 1) , edu: "higher" },
      { key: "academia", hu: "Egyetemi oktatás", en: "Academic teaching", weights: [w("OPEN", "high", 0.35), w("TEMP", "high", 0.35), w("THOR", "high", 0.3)], prefs: pr(1, 0, 1, 0) , edu: "specialized" },
      { key: "regulatory", hu: "Szabályozási ügyek", en: "Regulatory affairs", weights: [w("THOR", "high", 0.45), w("INTE", "high", 0.3), w("RESO", "low", 0.25)], prefs: pr(-1, -1, 0, -1) , edu: "higher" },
      { key: "envspecialist", hu: "Környezetvédelmi szakértő", en: "Environmental specialist", weights: [w("OPEN", "high", 0.4), w("INTE", "high", 0.3), w("THOR", "high", 0.3)], prefs: pr(0, 0, 1, 0) , edu: "higher" },
    ],
  },
  {
    key: "trades",
    hu: "Szakmák / ipar",
    en: "Skilled trades",
    roles: [
      { key: "electrician", hu: "Villanyszerelő", en: "Electrician", weights: [w("THOR", "high", 0.45), w("OPEN", "high", 0.25), w("RESO", "low", 0.3)], prefs: pr(-1, 0, 1, -1) , edu: "vocational" },
      { key: "mechanic", hu: "Autószerelő / járműtechnika", en: "Auto mechanic", weights: [w("THOR", "high", 0.45), w("OPEN", "high", 0.3), w("TEMP", "low", 0.25)], prefs: pr(-1, 0, 1, -1) , edu: "vocational" },
      { key: "carpenter", hu: "Asztalos / bútorkészítő", en: "Carpenter / furniture maker", weights: [w("THOR", "high", 0.4), w("OPEN", "high", 0.35), w("TEMP", "low", 0.25)], prefs: pr(-1, 0, 1, 1) , edu: "vocational" },
      { key: "welder", hu: "Hegesztő / fémipari szakmunka", en: "Welder / metalwork", weights: [w("THOR", "high", 0.5), w("RESO", "low", 0.3), w("OPEN", "low", 0.2)], prefs: pr(-1, -1, 1, -1) , edu: "vocational" },
      { key: "plumber", hu: "Víz-, gáz-, fűtésszerelő", en: "Plumber / HVAC", weights: [w("THOR", "high", 0.4), w("ADAP", "high", 0.3), w("RESO", "low", 0.3)], prefs: pr(0, 0, 1, -1) , edu: "vocational" },
      { key: "cnc", hu: "CNC-gépkezelő / gépbeállító", en: "CNC operator", weights: [w("THOR", "high", 0.55), w("OPEN", "low", 0.2), w("TEMP", "low", 0.25)], prefs: pr(-1, -1, 0, -1) , edu: "vocational" },
    ],
  },
  {
    key: "transport",
    hu: "Közlekedés / szállítmányozás",
    en: "Transport / logistics",
    roles: [
      { key: "courier", hu: "Futár / kiszállítás", en: "Courier / delivery", weights: [w("THOR", "high", 0.4), w("RESO", "low", 0.35), w("TEMP", "low", 0.25)], prefs: pr(0, 0, 1, -1) , edu: "open" },
      { key: "truckdriver", hu: "Kamion- / tehergépkocsi-vezető", en: "Truck driver", weights: [w("THOR", "high", 0.4), w("RESO", "low", 0.35), w("TEMP", "low", 0.25)], prefs: pr(-1, -1, 1, -1) , edu: "course" },
      { key: "dispatcher", hu: "Diszpécser / forgalomirányítás", en: "Dispatcher", weights: [w("THOR", "high", 0.45), w("RESO", "low", 0.35), w("TEMP", "high", 0.2)], prefs: pr(0, -1, -1, -1) , edu: "course" },
      { key: "warehouse", hu: "Raktárvezetés / készletkezelés", en: "Warehouse / inventory", weights: [w("THOR", "high", 0.5), w("INTE", "high", 0.25), w("RESO", "low", 0.25)], prefs: pr(-1, -1, 0, -1) , edu: "course" },
      { key: "publictransport", hu: "Járművezető (busz / vasút)", en: "Bus / train driver", weights: [w("THOR", "high", 0.4), w("RESO", "low", 0.4), w("ADAP", "high", 0.2)], prefs: pr(0, -1, 1, -1) , edu: "vocational" },
    ],
  },
  {
    key: "services",
    hu: "Személyi szolgáltatás / wellness",
    en: "Personal services / wellness",
    roles: [
      { key: "hairdresser", hu: "Fodrász / borbély", en: "Hairdresser / barber", weights: [w("TEMP", "high", 0.35), w("OPEN", "high", 0.3), w("ADAP", "high", 0.35)], prefs: pr(1, 0, 1, 1) , edu: "vocational" },
      { key: "beautician", hu: "Kozmetikus", en: "Beautician", weights: [w("ADAP", "high", 0.35), w("THOR", "high", 0.3), w("TEMP", "high", 0.35)], prefs: pr(1, -1, 1, 0) , edu: "vocational" },
      { key: "masseur", hu: "Masszőr / gyógymasszőr", en: "Massage therapist", weights: [w("ADAP", "high", 0.4), w("RESO", "high", 0.25), w("THOR", "high", 0.35)], prefs: pr(1, -1, 1, -1) , edu: "course" },
      { key: "personaltrainer", hu: "Személyi edző", en: "Personal trainer", weights: [w("TEMP", "high", 0.4), w("THOR", "high", 0.35), w("RESO", "low", 0.25)], prefs: pr(1, 0, 1, 0) , edu: "course" },
      { key: "realtor", hu: "Ingatlanközvetítő", en: "Real estate agent", weights: [w("TEMP", "high", 0.45), w("RESO", "low", 0.3), w("INTE", "high", 0.25)], prefs: pr(1, 1, 1, -1) , edu: "course" },
      { key: "childcare", hu: "Bébiszitter / családi napközi", en: "Childcare provider", weights: [w("ADAP", "high", 0.4), w("RESO", "high", 0.3), w("INTE", "high", 0.3)], prefs: pr(1, -1, -1, -1) , edu: "course" },
    ],
  },
];

function dimAlignment(score: number, direction: "high" | "low"): number {
  return direction === "high" ? score : 100 - score;
}

// ── Facet-szintű finomítások ────────────────────────────────────────────────
// A dimenzió-átlag elmossa, hogy a szerepet a dimenzión BELÜL mi jósolja:
// a Fejlesztőt a Perfekcionizmus+Körültekintés, nem az egész C; az
// Értékesítőt a Társas merészség+Élénkség, nem az egész X. A kulcs-
// szerepekhez itt facet-pontosított súlykészlet él — ha a hívó átad
// facet-pontszámokat, ez SZÁMÍT a role.weights helyett. A segítő
// szerepeknél az altruizmus intersticiális skála is súlyt kap.
const fw = (
  dim: DimCode,
  facet: string,
  direction: "high" | "low",
  weight: number,
): RoleWeight => ({ dim, facet, direction, weight });

export const FACET_REFINEMENTS: Record<string, RoleWeight[]> = {
  // tech
  dev: [fw("THOR", "perfectionism", "high", 0.3), fw("THOR", "prudence", "high", 0.2), fw("OPEN", "inquisitiveness", "high", 0.3), w("TEMP", "low", 0.2)],
  qa: [fw("THOR", "perfectionism", "high", 0.45), fw("THOR", "organization", "high", 0.15), w("INTE", "high", 0.2), w("OPEN", "low", 0.2)],
  pm: [fw("TEMP", "social_boldness", "high", 0.2), fw("TEMP", "liveliness", "high", 0.15), fw("OPEN", "creativity", "high", 0.35), fw("THOR", "organization", "high", 0.3)],
  ux: [fw("OPEN", "aesthetic_appreciation", "high", 0.25), fw("OPEN", "creativity", "high", 0.2), fw("ADAP", "gentleness", "high", 0.3), fw("RESO", "sentimentality", "high", 0.25)],
  data: [fw("OPEN", "inquisitiveness", "high", 0.4), fw("THOR", "perfectionism", "high", 0.25), fw("THOR", "prudence", "high", 0.15), w("TEMP", "low", 0.2)],
  // sales
  sales: [fw("TEMP", "social_boldness", "high", 0.3), fw("TEMP", "liveliness", "high", 0.2), fw("RESO", "anxiety", "low", 0.25), w("ADAP", "low", 0.25)],
  bizdev: [fw("TEMP", "social_boldness", "high", 0.25), fw("OPEN", "creativity", "high", 0.35), fw("RESO", "fearfulness", "low", 0.2), fw("TEMP", "liveliness", "high", 0.2)],
  support: [fw("ADAP", "patience", "high", 0.35), fw("RESO", "anxiety", "low", 0.3), fw("THOR", "organization", "high", 0.35)],
  // finance
  accounting: [fw("THOR", "organization", "high", 0.35), fw("THOR", "perfectionism", "high", 0.25), fw("INTE", "fairness", "high", 0.25), w("OPEN", "low", 0.15)],
  audit: [fw("THOR", "perfectionism", "high", 0.3), fw("THOR", "prudence", "high", 0.15), fw("INTE", "fairness", "high", 0.35), w("ADAP", "low", 0.2)],
  risk: [fw("THOR", "prudence", "high", 0.35), fw("RESO", "anxiety", "low", 0.3), fw("INTE", "fairness", "high", 0.35)],
  // health / segítő szerepek — altruizmus intersticiális skálával
  care: [fw("ADAP", "patience", "high", 0.3), fw("RESO", "sentimentality", "high", 0.2), fw("THOR", "diligence", "high", 0.25), fw("INTE", "altruism", "high", 0.25)],
  therapy: [fw("ADAP", "gentleness", "high", 0.25), fw("RESO", "sentimentality", "high", 0.25), fw("INTE", "sincerity", "high", 0.2), fw("INTE", "altruism", "high", 0.3)],
  clinical: [fw("THOR", "diligence", "high", 0.3), fw("RESO", "fearfulness", "low", 0.3), fw("ADAP", "patience", "high", 0.2), fw("INTE", "altruism", "high", 0.2)],
  emergency: [fw("RESO", "fearfulness", "low", 0.3), fw("RESO", "anxiety", "low", 0.2), fw("THOR", "prudence", "high", 0.3), fw("TEMP", "liveliness", "high", 0.2)],
  nonprofit: [fw("INTE", "sincerity", "high", 0.25), fw("ADAP", "forgiveness", "high", 0.25), fw("INTE", "altruism", "high", 0.3), fw("RESO", "sentimentality", "high", 0.2)],
  specialed: [fw("ADAP", "patience", "high", 0.35), fw("THOR", "diligence", "high", 0.25), fw("INTE", "altruism", "high", 0.4)],
  mentor: [fw("ADAP", "gentleness", "high", 0.3), fw("INTE", "sincerity", "high", 0.25), fw("RESO", "sentimentality", "high", 0.2), fw("INTE", "altruism", "high", 0.25)],
  // education
  teacher: [fw("TEMP", "social_boldness", "high", 0.3), fw("ADAP", "patience", "high", 0.35), fw("THOR", "organization", "high", 0.35)],
  trainer: [fw("TEMP", "social_boldness", "high", 0.35), fw("TEMP", "liveliness", "high", 0.15), fw("OPEN", "creativity", "high", 0.25), fw("ADAP", "flexibility", "high", 0.25)],
  // creative
  creative: [fw("OPEN", "creativity", "high", 0.35), fw("OPEN", "aesthetic_appreciation", "high", 0.25), fw("TEMP", "liveliness", "high", 0.2), w("THOR", "low", 0.2)],
  visual: [fw("OPEN", "aesthetic_appreciation", "high", 0.35), fw("OPEN", "creativity", "high", 0.2), fw("THOR", "perfectionism", "high", 0.25), w("TEMP", "low", 0.2)],
  // people
  recruiter: [fw("TEMP", "sociability", "high", 0.3), fw("TEMP", "liveliness", "high", 0.15), fw("ADAP", "gentleness", "high", 0.25), fw("THOR", "organization", "high", 0.3)],
  hrbp: [fw("ADAP", "flexibility", "high", 0.25), fw("INTE", "fairness", "high", 0.35), fw("TEMP", "social_boldness", "high", 0.25), fw("RESO", "sentimentality", "high", 0.15)],
};

/** A szerep effektív súlykészlete: facet-finomítás, ha van; lead-fókusszal. */
export function resolveRoleWeights(
  role: IndustryRole,
  options?: { leadFocus?: boolean; useFacets?: boolean },
): RoleWeight[] {
  const base =
    options?.useFacets !== false && FACET_REFINEMENTS[role.key]
      ? FACET_REFINEMENTS[role.key]
      : role.weights;
  return options?.leadFocus ? applyLeadFocus(base) : base;
}

/** A súly-bejegyzés értéke: facet-pontszám, ha elérhető; különben dimenzió. */
function weightValue(
  entry: RoleWeight,
  scores: Partial<Record<DimCode, number>>,
  facetScores?: Record<string, number>,
): number | null {
  if (entry.facet && typeof facetScores?.[entry.facet] === "number") {
    return facetScores[entry.facet];
  }
  const dimValue = scores[entry.dim];
  return typeof dimValue === "number" ? dimValue : null;
}

// ── Konfidencia-sáv ─────────────────────────────────────────────────────────
// A pontszám önértékelés-alapú BECSLÉS — a sáv a mérési bizonytalanságot
// jelzi: rövid formánál (TSFI-S, 2-3 item/facet) szélesebb, teljes formánál
// szűkebb, observer-megerősítésnél tovább szűkül.
export interface FitBand {
  low: number;
  high: number;
}

export function computeFitBand(
  score: number,
  options?: { form?: "short" | "full"; observerBacked?: boolean },
): FitBand {
  let halfWidth = options?.form === "full" ? 5 : 8;
  if (options?.observerBacked) halfWidth = Math.max(4, halfWidth - 2);
  return {
    low: Math.max(0, score - halfWidth),
    high: Math.min(100, score + halfWidth),
  };
}

// ── RIASEC (Holland-kód) becslés ────────────────────────────────────────────
// A szerepekhez irodalmi alapon 2 betűs Holland-kód tartozik; a user kódja a
// személyiség + preferenciák alapján BECSÜLT (nem mért érdeklődés-kérdőív) —
// a UI kötelezően „becslés" kerettel mutatja. A rangsorban kis döntetlen-
// bontó bónusz (±3) az átfedés szerint.
export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

const INDUSTRY_RIASEC_DEFAULT: Record<string, string> = {
  tech: "IC", health: "SI", education: "SA", finance: "CE", sales: "EC",
  creative: "AE", media: "AE", operations: "CR", people: "SE", public: "CS",
  engineering: "RI", hospitality: "ES", science: "IR",
  trades: "RC", transport: "RC", services: "SE",
};

const ROLE_RIASEC_OVERRIDE: Record<string, string> = {
  dev: "IR", pm: "EI", ux: "AI", data: "IC", devops: "RC", itsupport: "SC",
  qa: "CI", therapy: "SA", emergency: "RS", healthadmin: "CS",
  teacher: "SA", trainer: "SE", edtech: "AI", mentor: "SA",
  analyst: "IC", advisor: "ES", sales: "EC", bizdev: "EA", support: "SC",
  creative: "AR", visual: "AR", content: "AE", research: "IC",
  recruiter: "ES", hrbp: "SE", od: "AE", payroll: "CS", lnd: "SA",
  legal: "CI", policy: "IA", nonprofit: "SA", lawenforce: "RC",
  design: "RI", sitemgr: "ER", estimator: "CI",
  chef: "RA", events: "EA", opsmgr: "EC", planning: "CI",
  security: "IC", sysadmin: "CR", techwriter: "CI",
  psychologist: "IS", physician: "IS", pharmacist: "CI", healthvisitor: "SC",
  languageteacher: "SA", teachassist: "SC",
  taxadvisor: "CI", insurance: "CE", socialworker: "SA", envspecialist: "IR",
  carpenter: "RA", hairdresser: "AE", beautician: "AS", masseur: "SR",
  personaltrainer: "SE", realtor: "EC", childcare: "SA",
};

export function roleRiasec(industryKey: string, roleKey: string): string {
  return ROLE_RIASEC_OVERRIDE[roleKey] ?? INDUSTRY_RIASEC_DEFAULT[industryKey] ?? "";
}

/** Becsült user Holland-kód (top-2 betű) a személyiség + preferenciák alapján. */
export function estimateUserRiasec(
  scores: Partial<Record<DimCode, number>>,
  prefs: UserPrefs,
): RiasecLetter[] {
  const v = (dim: DimCode) => scores[dim] ?? 50;
  const p = (axis: PrefAxis) => prefs[axis] ?? 0;
  const weights: Record<RiasecLetter, number> = {
    E: v("TEMP") * 0.6 + (p("people") + 1) * 15 + (p("variety") + 1) * 5,
    S: v("ADAP") * 0.5 + v("RESO") * 0.2 + (p("people") + 1) * 15,
    I: v("OPEN") * 0.5 + (1 - p("people")) * 15 + v("THOR") * 0.2,
    A: v("OPEN") * 0.5 + (p("creation") + 1) * 20,
    C: v("THOR") * 0.6 + (1 - p("variety")) * 15,
    R: (1 - p("people")) * 20 + (1 - p("creation")) * 10 + v("THOR") * 0.3,
  };
  return (Object.entries(weights) as Array<[RiasecLetter, number]>)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 2)
    .map(([letter]) => letter);
}

const RIASEC_TIEBREAK = 3;

function riasecBonus(userLetters: RiasecLetter[], roleCode: string): number {
  if (userLetters.length === 0 || !roleCode) return 0;
  const overlap = userLetters.filter((letter) => roleCode.includes(letter)).length;
  return overlap >= 2 ? RIASEC_TIEBREAK : overlap === 1 ? Math.round(RIASEC_TIEBREAK / 2) : -RIASEC_TIEBREAK;
}

/** A Holland-kód forrása — a UI ennek megfelelő kerettel címkéz. */
export type RiasecSource = "measured" | "tags" | "estimated";

/**
 * A user Holland-kódjának feloldása, megbízhatósági lépcsőn:
 * mért kérdőív (Mini-IP) > választott érdeklődés-címkék > személyiség-becslés.
 */
export function resolveUserRiasec(
  scores: Partial<Record<DimCode, number>>,
  prefs: UserPrefs,
  background?: Pick<CareerBackground, "interestTags" | "riasecScores">,
): { letters: RiasecLetter[]; source: RiasecSource } {
  const measured = background?.riasecScores;
  if (measured && Object.keys(measured).length >= 6) {
    const letters = (Object.entries(measured) as Array<[RiasecLetter, number]>)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([letter]) => letter);
    return { letters, source: "measured" };
  }
  const tags = (background?.interestTags ?? [])
    .map((key) => INTEREST_TAGS.find((tag) => tag.key === key))
    .filter((tag): tag is InterestTag => Boolean(tag));
  if (tags.length > 0) {
    const counts = new Map<RiasecLetter, number>();
    for (const tag of tags) {
      for (const letter of tag.letters) {
        counts.set(letter, (counts.get(letter) ?? 0) + 1);
      }
    }
    // Személyiség-becslés csak döntetlen-bontóként (0.3 súllyal)
    const estimated = estimateUserRiasec(scores, prefs);
    for (const [i, letter] of estimated.entries()) {
      counts.set(letter, (counts.get(letter) ?? 0) + (i === 0 ? 0.3 : 0.15));
    }
    const letters = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 2)
      .map(([letter]) => letter);
    return { letters, source: "tags" };
  }
  return { letters: estimateUserRiasec(scores, prefs), source: "estimated" };
}

/** Mért érdeklődés-egyezés 0-100: a szerep betűihez tartozó mért pontszámok átlaga. */
export function measuredInterestMatch(
  riasecScores: Partial<Record<RiasecLetter, number>>,
  roleCode: string,
): number | null {
  const values = roleCode
    .split("")
    .map((letter) => riasecScores[letter as RiasecLetter])
    .filter((v): v is number => typeof v === "number");
  if (values.length === 0) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

const TAG_INDUSTRY_BOOST = 4;

/** A kiválasztott címkékhez affin iparágak halmaza. */
export function tagAffinityIndustries(interestTags: string[] | undefined): Set<string> {
  const set = new Set<string>();
  for (const key of interestTags ?? []) {
    const tag = INTEREST_TAGS.find((entry) => entry.key === key);
    for (const industry of tag?.industries ?? []) set.add(industry);
  }
  return set;
}

// ── Tipikus vezetési közeg iparáganként ─────────────────────────────────────
// Az interakció-szimuláció vezető-kiegészítőihez (LEADER_SUPPLEMENTS) kötve:
// „ebben a közegben tipikusan ilyen vezetéssel találkozol".
export const INDUSTRY_LEADER_CONTEXT: Record<string, { dim: DimCode; pole: "high" | "low" }> = {
  tech: { dim: "OPEN", pole: "high" },
  health: { dim: "THOR", pole: "high" },
  education: { dim: "ADAP", pole: "high" },
  finance: { dim: "THOR", pole: "high" },
  sales: { dim: "TEMP", pole: "high" },
  creative: { dim: "OPEN", pole: "high" },
  media: { dim: "TEMP", pole: "high" },
  operations: { dim: "THOR", pole: "high" },
  people: { dim: "ADAP", pole: "high" },
  public: { dim: "INTE", pole: "high" },
  engineering: { dim: "THOR", pole: "high" },
  hospitality: { dim: "TEMP", pole: "high" },
  science: { dim: "OPEN", pole: "high" },
  trades: { dim: "THOR", pole: "high" },
  transport: { dim: "THOR", pole: "high" },
  services: { dim: "TEMP", pole: "high" },
};

/**
 * Vezetői fókusz: a szerep alap-súlyai mellé vezetői komponensek kerülnek
 * (társas energia, nyomásállóság, delegáláshoz kellő együttműködés), majd
 * a súlyok visszanormalizálódnak 1-re.
 */
export function applyLeadFocus(weights: RoleWeight[]): RoleWeight[] {
  const LEAD_EXTRA: RoleWeight[] = [w("TEMP", "high", 0.2), w("RESO", "low", 0.1), w("ADAP", "high", 0.1)];
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

// ── Munkakörnyezet-profilok (pace / structure / setting) ────────────────────
// Iparági default + szerep-felülbírálás; a wizard környezet-kérdéseivel
// (2. ütem) egyeznek. -1..1 skála, mint a preferencia-tengelyek.
export type EnvProfile = Record<EnvAxis, number>;

const INDUSTRY_ENV_DEFAULT: Record<string, EnvProfile> = {
  tech: { pace: 0, structure: 0, setting: -1 },
  health: { pace: 1, structure: 1, setting: 1 },
  education: { pace: 0, structure: 1, setting: 1 },
  finance: { pace: 0, structure: 1, setting: -1 },
  sales: { pace: 1, structure: -1, setting: 0 },
  creative: { pace: 0, structure: -1, setting: -1 },
  media: { pace: 1, structure: -1, setting: 0 },
  operations: { pace: 1, structure: 1, setting: 0 },
  people: { pace: 0, structure: 0, setting: -1 },
  public: { pace: -1, structure: 1, setting: -1 },
  engineering: { pace: 0, structure: 1, setting: 0 },
  hospitality: { pace: 1, structure: 0, setting: 1 },
  science: { pace: -1, structure: 1, setting: -1 },
  trades: { pace: 0, structure: 1, setting: 1 },
  transport: { pace: 0, structure: 1, setting: 1 },
  services: { pace: 0, structure: 0, setting: 1 },
};

const ROLE_ENV_OVERRIDE: Record<string, Partial<EnvProfile>> = {
  emergency: { pace: 1 },
  lawenforce: { setting: 1, pace: 1 },
  events: { pace: 1, setting: 1 },
  sitemgr: { setting: 1, pace: 1 },
  inspector: { setting: 1 },
  guide: { setting: 1 },
  photo: { setting: 1 },
  courier: { pace: 1 },
  dispatcher: { setting: -1, pace: 1 },
  warehouse: { setting: 0 },
  edtech: { setting: -1, pace: -1 },
  techwriter: { pace: -1 },
  research: { pace: -1 },
  policy: { pace: -1 },
  accounting: { pace: -1 },
  payroll: { pace: -1 },
  realtor: { pace: 1, setting: 0 },
  childcare: { setting: 1 },
  personaltrainer: { pace: 1 },
};

export function roleEnvProfile(industryKey: string, roleKey: string): EnvProfile {
  const base = INDUSTRY_ENV_DEFAULT[industryKey] ?? { pace: 0, structure: 0, setting: 0 };
  return { ...base, ...ROLE_ENV_OVERRIDE[roleKey] };
}

// Init: a szerep-objektumokra rárakjuk a környezet-profilt, hogy a
// pontozásnak ne kelljen iparág-kulcsot cipelnie.
for (const industry of INDUSTRIES) {
  for (const role of industry.roles) {
    role.env = roleEnvProfile(industry.key, role.key);
  }
}

const PREF_AXES_ALL: PrefAxis[] = ["people", "variety", "autonomy", "creation"];
const ENV_AXES_ALL: EnvAxis[] = ["pace", "structure", "setting"];

/** Preferencia-egyezés 0-100: a beállított tengelyeken mért közelség átlaga
 *  (motivációs + környezet-tengelyek együtt). */
export function scorePrefMatch(prefs: UserPrefs, role: IndustryRole): number | null {
  const env = role.env;
  const entries: Array<[number, number]> = [];
  for (const axis of PREF_AXES_ALL) {
    const userValue = prefs[axis];
    if (userValue !== undefined && userValue !== 0) {
      entries.push([userValue, role.prefs[axis]]);
    }
  }
  if (env) {
    for (const axis of ENV_AXES_ALL) {
      const userValue = prefs[axis];
      if (userValue !== undefined && userValue !== 0) {
        entries.push([userValue, env[axis]]);
      }
    }
  }
  if (entries.length === 0) return null;
  const sum = entries.reduce(
    (acc, [userValue, roleValue]) => acc + (1 - Math.abs(userValue - roleValue) / 2),
    0,
  );
  return Math.round((sum / entries.length) * 100);
}

export interface RoleFitBreakdownEntry {
  dim: DimCode;
  /** Facet-kód, ha a komponens facet-szintű (label a TRITAN_FACETS-ből) */
  facet: string | null;
  direction: "high" | "low";
  weight: number;
  userValue: number;
  alignment: number;
}

/** Komponensenkénti bontás az „miért ennyi?" nézethez (facet-tudatos). */
export function explainRoleFit(
  scores: Partial<Record<DimCode, number>>,
  role: IndustryRole,
  options?: { leadFocus?: boolean; facetScores?: Record<string, number> },
): RoleFitBreakdownEntry[] {
  const useFacets = Boolean(FACET_REFINEMENTS[role.key]) && Boolean(options?.facetScores);
  const weights = resolveRoleWeights(role, { leadFocus: options?.leadFocus, useFacets });
  return weights
    .map((entry) => {
      const value = weightValue(entry, scores, options?.facetScores);
      if (typeof value !== "number") return null;
      return {
        dim: entry.dim,
        facet: entry.facet && typeof options?.facetScores?.[entry.facet] === "number" ? entry.facet : null,
        direction: entry.direction,
        weight: entry.weight,
        userValue: value,
        alignment: Math.round(dimAlignment(value, entry.direction)),
      };
    })
    .filter((e): e is RoleFitBreakdownEntry => e !== null)
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

  const hasFacetRefinement = Boolean(FACET_REFINEMENTS[role.key]);
  const useFacets = hasFacetRefinement && Boolean(options?.facetScores);
  const weights = resolveRoleWeights(role, {
    leadFocus: options?.leadFocus,
    useFacets,
  });
  for (const entry of weights) {
    const value = weightValue(entry, scores, options?.facetScores);
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
    band: computeFitBand(score, {
      form: options?.form,
      observerBacked: options?.observerBacked,
    }),
    facetPrecision: useFacets,
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
  /** Facet-pontszámok (facet-kód → 0-100) — facet-finomított súlyokhoz */
  facetScores?: Record<string, number>;
  /** Kérdőív-forma a konfidencia-sávhoz (default: short) */
  form?: "short" | "full";
  /** Observer-átlaggal kevert pontszámokból számolunk-e (sáv szűkül) */
  observerBacked?: boolean;
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
  /** Örökölt egyértékű terület — az olvasók a normalizedEduFields()-et használják */
  eduField: EduField | null;
  /** Több képzési terület (max 3) — a boost az affinitás-listák uniója */
  eduFields?: EduField[];
  ageBand: AgeBand | null;
  /** Jelenlegi iparág (ha dolgozik / váltana) — katalógus-kulcs */
  currentIndustry: string | null;
  /** Érdeklődési iparágak (0-3 katalógus-kulcs; üres = nyitott mindenre) */
  interests: string[];
  /** Érdeklődés-címkék (INTEREST_TAGS kulcsai, max 4) */
  interestTags?: string[];
  /** MÉRT érdeklődés-profil (Mini-IP kérdőívből, betűnként 0-100) */
  riasecScores?: Partial<Record<RiasecLetter, number>>;
}

/** Terület-normalizálás: az örökölt egyértékű mezőt is tömbként adja vissza. */
export function normalizedEduFields(background: CareerBackground): EduField[] {
  if (background.eduFields && background.eduFields.length > 0) return background.eduFields;
  return background.eduField ? [background.eduField] : [];
}

// ── Érdeklődés-címkék — gyors, választott érdeklődés-jelzés ────────────────
// Két hatás: (1) a Holland-kód címke-alapú (megbízhatóbb a személyiség-
// becslésnél), (2) célzott boost a címkékhez affin iparágak szerepeinek.
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

/**
 * Végzettség-terület → iparág affinitás. A képzettség kis boost-ot ad a
 * rangsorban (a belépési küszöb ott alacsonyabb), de nem zár ki semmit.
 */
export const EDU_INDUSTRY_AFFINITY: Record<EduField, string[]> = {
  tech_engineering: ["tech", "engineering", "operations", "science"],
  economics: ["finance", "sales", "operations", "people"],
  health: ["health", "science", "services"],
  humanities: ["media", "education", "people", "public"],
  natural_science: ["science", "health", "tech"],
  legal: ["public", "finance", "people"],
  arts: ["creative", "media", "hospitality"],
  pedagogy: ["education", "people", "health"],
  trade: ["engineering", "operations", "hospitality", "trades", "transport", "services"],
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
  /** Az érdeklődés-címkék affinitása emelte-e a rangsorban */
  tagBoosted: boolean;
  /** A szerep Holland-kódja (2 betű) */
  riasec: string;
  /** Átfedés a user Holland-kódjával (0-2 betű) */
  riasecOverlap: number;
  /** MÉRT érdeklődés-egyezés 0-100 (csak kitöltött Mini-IP után) */
  interestMatch: number | null;
}

export interface CareerSuggestionResult {
  /** Kereszt-iparági javaslatok (érdeklődés szerint szűkítve, ha van) */
  suggestions: CareerSuggestion[];
  /** A jelenlegi iparág legjobb szerepei (ha ismert) */
  currentIndustryTop: CareerSuggestion[];
  /** A top javaslatok leggyakoribb figyelendő dimenziói (max 2) */
  developDims: DimCode[];
  /** A user Holland-kódja (top-2 betű) */
  userRiasec: RiasecLetter[];
  /** A Holland-kód forrása: mért kérdőív / címkék / személyiség-becslés */
  riasecSource: RiasecSource;
}

export function rankCareerSuggestions(
  scores: Partial<Record<DimCode, number>>,
  background: CareerBackground,
  options?: RankOptions,
): CareerSuggestionResult {
  // Végzettség-boost: több terület affinitás-listáinak UNIÓJA
  const affinity = new Set<string>(
    normalizedEduFields(background).flatMap((field) => EDU_INDUSTRY_AFFINITY[field]),
  );
  const tagIndustries = tagAffinityIndustries(background.interestTags);

  const { letters: userRiasec, source: riasecSource } = resolveUserRiasec(
    scores,
    options?.prefs ?? {},
    background,
  );
  const measured = riasecSource === "measured" ? background.riasecScores : undefined;

  const toSuggestion = (industry: Industry) => (result: RoleFitResult): CareerSuggestion => {
    const eduBoosted = affinity.has(industry.key);
    const tagBoosted = tagIndustries.has(industry.key);
    const riasec = roleRiasec(industry.key, result.role.key);
    const riasecOverlap = userRiasec.filter((letter) => riasec.includes(letter)).length;
    const interestMatch = measured ? measuredInterestMatch(measured, riasec) : null;
    // Mért érdeklődésnél az egyezés valódi komponens; e nélkül döntetlen-bontó.
    const combinedBase =
      interestMatch !== null
        ? result.prefMatch !== null
          ? Math.round(result.score * 0.55 + result.prefMatch * 0.2 + interestMatch * 0.25)
          : Math.round(result.score * 0.7 + interestMatch * 0.3)
        : result.combined + riasecBonus(userRiasec, riasec);
    return {
      ...result,
      combined:
        combinedBase + (eduBoosted ? EDU_BOOST : 0) + (tagBoosted ? TAG_INDUSTRY_BOOST : 0),
      industryKey: industry.key,
      industryHu: industry.hu,
      industryEn: industry.en,
      eduBoosted,
      tagBoosted,
      riasec,
      riasecOverlap,
      interestMatch,
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

  return { suggestions, currentIndustryTop, developDims, userRiasec, riasecSource };
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
