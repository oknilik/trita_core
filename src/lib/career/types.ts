import type { FamilyFit } from "./family-fit";

// Karrier-motor v2 — típusok.
// A katalógus adat-oldala az O*NET 30.3-ból származtatott, kézzel ellenőrzött
// foglalkozás-készlet (ld. docs/product/occupation-catalog-sources.md).

/** Belső dimenziókódok (a DB score-JSON-okkal azonosak). RESO fordított: magasabb = érzelmesebb. */
export type DimCode = "INTE" | "RESO" | "TEMP" | "ADAP" | "THOR" | "OPEN";

export const DIM_CODES: DimCode[] = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"];

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
  target: number;
  tol: number;
  weight: number;
  userValue: number;
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
  /** a KOMPOZIT rangsor-pontszám mérési hibája — a klaszterezés ezen fut */
  rankSe: number;
  components: FitComponent[];
  /** abszolút szint-illeszkedés: eléri-e a user a szerep elvárt szintjeit */
  absoluteFit: number;
  /** Holland-congruence 0-100 (null, ha nincs érdeklődés-adat) */
  interest: number | null;
  /** preferencia/környezet-egyezés 0-100 (null, ha a user nem állított be tengelyt) */
  preference: number | null;
  feasibility: {
    gap: FeasibilityGap;
    ready: boolean;
    fieldMatch: boolean | null;
    state: "field-match" | "level-only" | "licence-needed" | "training-needed";
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
  /** általános munkahelyi alap (C + H), profil-szinten egyszer */
  general: number;
  interestSource: InterestInput["source"] | null;
  /** érdeklődés-differenciáltság: alacsonynál gyenge jel a Holland-rangsor */
  interestDifferentiation: "low" | "ok" | null;
  observerWeight: number;
  /** klaszterek: egy klaszteren belül a különbség a mérési hibán belül van */
  clusters: OccupationFit[][];
  /** sorrendezett lista (a klaszterek kilapítva) */
  ranked: OccupationFit[];
  /**
   * Családszintű illeszkedés, csökkenő sorrendben. EZ az elsődleges
   * kimenet: egyedi szakmát rangsorolni mérési hibán belül van, családot
   * viszont lehet. Levezetés: docs/product/career-families.md
   */
  families: FamilyFit[];
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
