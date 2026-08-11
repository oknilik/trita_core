// Karrier-motor v2 — típusok.
// A katalógus adat-oldala az O*NET 30.3-ból származtatott, kézzel ellenőrzött
// foglalkozás-készlet (ld. docs/product/occupation-catalog-sources.md).

/** Belső dimenziókódok (a DB score-JSON-okkal azonosak). E fordított: magasabb = érzelmesebb. */
export type DimCode = "H" | "E" | "X" | "A" | "C" | "O";

export const DIM_CODES: DimCode[] = ["H", "E", "X", "A", "C", "O"];

export type RiasecLetter = "R" | "I" | "A" | "S" | "E" | "C";

export const RIASEC_LETTERS: RiasecLetter[] = ["R", "I", "A", "S", "E", "C"];

/** Preferencia- és környezet-tengelyek (-1..1 a szerep oldalán, -1|0|1 a useré). */
export type AxisKey =
  | "people"
  | "variety"
  | "autonomy"
  | "creation"
  | "pace"
  | "structure"
  | "setting";

export const AXIS_KEYS: AxisKey[] = [
  "people",
  "variety",
  "autonomy",
  "creation",
  "pace",
  "structure",
  "setting",
];

/** Belépési szint — a felhasználó végzettségével összevetve adja a megvalósíthatóságot. */
export type EntryLevel = "open" | "course" | "vocational" | "higher" | "specialized";

/** Képzési területek — a wizard kategóriái és a katalógus CIP-alapú mezői. */
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

export type AssessmentForm = "short" | "full";

/**
 * Vétó-címkék: munka-tulajdonságok, amiket a felhasználó KIZÁRHAT a wizardban.
 * A címkézés forrása O*NET Work Context/Activities küszöbök + ISCO-struktúra
 * (step11_veto_tags.py); a bejelölt vétó determinisztikus kemény szűrő.
 */
export type VetoTag =
  | "children"
  | "care"
  | "blood"
  | "customers"
  | "sales"
  | "conflict"
  | "shift"
  | "physical"
  | "outdoor"
  | "screen"
  | "driving"
  | "heights"
  | "hazard"
  | "monotony"
  | "animals";

export const VETO_TAGS: VetoTag[] = [
  "children",
  "care",
  "blood",
  "customers",
  "sales",
  "conflict",
  "shift",
  "physical",
  "outdoor",
  "screen",
  "driving",
  "heights",
  "hazard",
  "monotony",
  "animals",
];

/** Egy dimenzió elvárása a szerep oldalán: ideal-point cél + tolerancia + súly. */
export interface DemandComponent {
  dim: DimCode;
  /** 0-100 ideális érték */
  target: number;
  /** mekkora eltérés még nem számít (0-100 skálán) */
  tol: number;
  /** relatív súly a szerepen belül (Σ ≈ 1) */
  w: number;
}

/** Katalógus-tétel (scoring-mezők; a leírás/aliasok külön tartalomfájlban). */
export interface Occupation {
  /** O*NET-SOC kód, stabil azonosító */
  id: string;
  /** magyar megnevezés (kézzel véglegesített) */
  hu: string;
  feor: string | null;
  isco: string | null;
  /** magyar relevancia: 1 = gyakori, 2 = létező */
  tier: number;
  entry: EntryLevel;
  jobZone: number;
  /** foglalkozás-oldali érdeklődés-profil, 0-100 mind a hat betűre */
  riasec: Record<RiasecLetter, number>;
  /** differenciál cél-profil (a profil ALAKJA) */
  demand: DemandComponent[];
  /** abszolút elvárt szint dimenziónként (mennyi kell belőle egyáltalán) */
  abs: Record<DimCode, number>;
  /** preferencia/környezet-tengelyek, -1..1 */
  axes: Record<AxisKey, number>;
  /** ha nem közvetlen O*NET adat, hanem ISCO-csoport átlag */
  axesSource?: string;
  /** képzési területek, amikből út vezet ide (O*NET CIP-crosswalk) */
  eduFields?: EduField[];
  /** iparág-címkék (többes); ÜRES = univerzális szerep, minden scope-ban megjelenik */
  industries?: string[];
  /**
   * Karrier-család kulcsa (`families.json`). A hozzárendelés OFFLINE készül
   * (`step12_families.mjs`) és befagyva él a katalógusban — futásidőben
   * SOHA nem számoljuk újra, mert a klaszterezés nem stabil (mérés:
   * docs/product/career-families.md).
   */
  family?: string;
  /** vétó-címkék: milyen kizárható munka-tulajdonságokat hordoz a szerep */
  attrs?: VetoTag[];
}

export interface OccupationContent {
  id: string;
  desc: string;
  descLang: "hu" | "en";
  aliases: string[];
  eduHu: string | null;
  eduShare: number | null;
  feorAll: string[];
  feorName: string;
  iscoName: string;
  en: string;
  reviewNote: string;
}

/** Observer-visszajelzés összegzése (értékelő-szám szerinti súlyozáshoz). */
export interface ObserverInput {
  dims: Partial<Record<DimCode, number>>;
  raterCount: number;
}

/** A user érdeklődés-profilja, forrás-jelöléssel. */
export interface InterestInput {
  vector: Partial<Record<RiasecLetter, number>>;
  source: "measured" | "tags" | "estimated";
}

export interface PersonInput {
  /** önértékelés, dimenziónként 0-100 */
  dims: Partial<Record<DimCode, number>>;
  form: AssessmentForm;
  observer?: ObserverInput | null;
  interests?: InterestInput | null;
  /** wizard-preferenciák: -1 | 0 | 1 tengelyenként (0/hiányzó = nem állította be) */
  prefs?: Partial<Record<AxisKey, -1 | 0 | 1>>;
  /** legmagasabb végzettség a megvalósíthatósághoz */
  eduLevel?: "primary" | "secondary" | "vocational" | "higher" | "specialized" | null;
  /** a végzettség(ek) SZAKIRÁNYA — a szint önmagában nem képesít */
  eduFields?: EduField[];
  /** vezetői ambíció — a vezetői komponensek súlyát emeli */
  leadIntent?: "lead" | "expert" | "unsure";
  /** kizárt munka-tulajdonságok — KEMÉNY szűrő, a kimondott szándék szintje */
  vetoes?: VetoTag[];
}

export interface FitComponent {
  dim: DimCode;
  /** a PONTOZÁS célja: profil-alak (centrált) skálán; H-padlónál nyers 50 */
  target: number;
  tol: number;
  weight: number;
  /**
   * a PONTOZÁSBAN használt érték: profil-centrált (a saját átlag 50-re tolva);
   * H-padlós komponensnél a NYERS kevert pont (az abszolút becsületesség számít)
   */
  userValue: number;
  /**
   * MEGJELENÍTÉSI pár NYERS skálán: a userRaw a results-oldali ÖNÉRTÉKELÉS-
   * pontszám (SOHA nem a kevert érték — a kevert pár + ismert 0,5-ös súly
   * visszafejthetővé tenné az observer-aggregátumot), a targetRaw a cél
   * ugyanazzal az eltolással visszahozva — |userRaw − targetRaw| ≈
   * |userValue − target|, tehát a position/alignment ezekkel is konzisztens.
   * A UI EZT mutassa „te {..}"-ként, különben a centrált érték ellentmond a
   * results-oldalnak (pl. nyers 90 → „te 58").
   */
  userRaw: number;
  targetRaw: number;
  /**
   * true, ha a nyers skálára visszatolt cél a skála szélére (0/100) szorult:
   * ilyenkor a |userRaw − targetRaw| KISEBB, mint a pontozott
   * |userValue − target| távolság — a UI jelezze, hogy a cél a mutatottnál
   * kijjebb esne (a position/alignment a pontozott távolságból jön, az ép).
   */
  targetAtEdge?: true;
  /** 0-100: mennyire esik a user értéke a cél-sávba */
  alignment: number;
  /** "under" = a cél alatt, "over" = a cél felett, "in" = a toleranciasávon belül */
  position: "under" | "in" | "over";
  /** speciális szabály lépett életbe (pl. H-padló) */
  note?: "h-floor";
}

export type FeasibilityGap = "ready" | "course" | "vocational" | "degree" | "licence";

export interface OccupationFit {
  id: string;
  hu: string;
  feor: string | null;
  isco: string | null;
  tier: number;
  entry: EntryLevel;
  /** karrier-család kulcsa (`families.json`) — a családszintű csoportosításhoz */
  family: string | null;
  /** differenciál illeszkedés: a profil ALAKJA (ez rangsorol) */
  demandFit: number;
  /** a differenciál illeszkedés mérési hibája (SE) */
  se: number;
  band: { low: number; high: number };
  /**
   * A rangsor-pontszám mérési hibája — a klaszterezés ezen fut. Mindig a
   * TÉNYLEGESEN a rangba számított komponensek hibáiból terjed, a súlyösszeggel
   * normálva (ld. engine.ts) — a stratégiák között ez a szerződés közös.
   */
  rankSe: number;
  components: FitComponent[];
  /** Holland-congruence 0-100 (null, ha nincs érdeklődés-adat) */
  interest: number | null;
  /** preferencia/környezet-egyezés 0-100 (null, ha a user nem állított be tengelyt) */
  preference: number | null;
  feasibility: {
    gap: FeasibilityGap;
    ready: boolean;
    fieldMatch: boolean | null;
    state: "field-match" | "level-only" | "licence-needed" | "training-needed";
    /** szabályozott szakma: engedély/kamarai tagság kell (specialized belépés) */
    licence: boolean;
  };
  /** rangsor-pontszám (0-100) — a stratégiától függ, mit jelent */
  rank: number;
  /** mi rendezte a tételt */
  orderedBy: "demandFit" | "composite" | "interest";
  /** miért került a listára: érdeklődés + preferencia együttese (0-100) */
  choiceScore: number | null;
  flags: string[];
}

/** Rangsorolási stratégia — ld. `career-engine-plan.md` 11–12. szakasz. */
export type RankStrategy = "scoped" | "interest-led" | "composite";

export interface CareerFitResult {
  interestSource: InterestInput["source"] | null;
  /** érdeklődés-differenciáltság: alacsonynál gyenge jel a Holland-rangsor */
  interestDifferentiation: "low" | "ok" | null;
  /**
   * Az observer-keverés súlya, SZÁNDÉKOSAN durva (1 tizedes) felbontással.
   * Az anonimitás-padló (MIN_RATERS_FOR_ANONYMOUS_AGGREGATE) alatt mindig 0 —
   * a pontos súly + ismert self-pontok együtt visszafejthetővé tennék az
   * egyes értékelők válaszait (blended = self·(1−w) + obs·w).
   */
  observerWeight: number;
  /** sorrendezett lista */
  ranked: OccupationFit[];
  meta: {
    catalogVersion: string;
    occupationCount: number;
    form: AssessmentForm;
    dimSe: number;
    /** melyik stratégia futott le ténylegesen */
    strategy: RankStrategy;
    /** hány tétel került a jelölt-halmazba (interest-led esetén) */
    candidatePool: number | null;
    /**
     * Az érdeklődés-komponens TÉNYLEGES kompozit-súlya (forrás ×
     * differenciáltság; 0, ha nincs érdeklődés-adat). A UI EZT mutassa —
     * ne számoljon saját súlyt.
     */
    interestWeight: number;
    /** true, ha a scope túl kevés találatot adott, és kibővítettük */
    scopeWidened?: boolean;
    /** hány szerepet zárt ki a felhasználó vétója */
    vetoExcluded?: number;
  };
}
