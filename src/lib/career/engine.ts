// Karrier-illeszkedési motor v2 — EGYETLEN belépési pont a képernyőnek, a
// PDF-nek és a jelölt-rétegnek.
//
// Öt elv, ami a v1-től megkülönbözteti:
//  1) IDEAL-POINT: minden dimenzióhoz cél + tolerancia tartozik, nem "minél több,
//     annál jobb". A cél FÖLÖTT is lehet eltérés (a túl sok is jelzés).
//  2) DIFFERENCIÁL rangsor: a user profilját a saját átlagára centráljuk, így a
//     rangsort a profil ALAKJA vezérli, nem az általános szintje (a v1-ben
//     r(C, átlagos illeszkedés) = 0.82 volt).
//  3) ÁLTALÁNOS szint külön: a C+H alapú "általános munkahelyi alap" egyszer
//     jelenik meg a profilon, nem 477-szer a szerepeknél.
//  4) HIBASÁV a tényleges reliabilitásból, és klaszterezés: ahol a különbség a
//     mérési hibán belül van, ott nincs sorrend.
//  5) H-PADLÓ: ha egy szerep alacsony becsületesség-alázatot "kíván", a magas H
//     nem kap büntetést, és az alacsony H nem kap jutalmat.

import { getOccupations, CATALOG_VERSION } from "./catalog";
import { feasibilityFor } from "./feasibility";
/** Scope-egyezés az explicit iparág-címkéken. Üres címke-lista = univerzális. */
function inScope(occupation: Occupation, scope: string[]): boolean {
  const tags = occupation.industries ?? [];
  if (tags.length === 0) return true;
  return tags.some((tag) => scope.includes(tag));
}

/** Hány bejelölt iparágat fed le a szerep (metszet-kiemeléshez). */
function pickOverlap(occupation: Occupation, picked: string[]): number {
  return (occupation.industries ?? []).filter((tag) => picked.includes(tag)).length;
}
import {
  interestCongruence,
  interestDifferentiation,
} from "./interests";
import {
  bandFor,
  blendedStandardError,
  clusterByOverlap,
  dimStandardError,
  fitStandardError,
  observerWeight,
} from "./psychometrics";
import {
  AXIS_KEYS,
  DIM_CODES,
  type AxisKey,
  type CareerFitResult,
  type DimCode,
  type FitComponent,
  type Occupation,
  type OccupationFit,
  type PersonInput,
  type RankStrategy,
} from "./types";

/** Kompozit rangsor-súlyok. A megvalósíthatóság SZÁNDÉKOSAN nincs benne. */
export const RANK_WEIGHTS = {
  demand: 0.55,
  interest: 0.3,
  preference: 0.15,
} as const;

/**
 * Az érdeklődés súlya a FORRÁSTÓL függ: a kitöltött kérdőív mért adat, a címke
 * gyorsválasz, a személyiség-alapú becslés pedig a leggyengébb jel — utóbbi ne
 * vezérelje a rangsort.
 */
export function interestWeightFor(source: "measured" | "tags" | "estimated"): number {
  if (source === "measured") return 0.35;
  if (source === "tags") return 0.25;
  return 0.15;
}

/** Alacsony érdeklődés-differenciáltságnál a Holland-jel gyengébb. */
const LOW_DIFFERENTIATION_FACTOR = 0.5;

/** A választott iparágakhoz tartozó szerepek rangsor-bónusza (nem szűrés). */
const INDUSTRY_PICK_BONUS = 5;

/**
 * KÉTLÉPCSŐS (interest-led) rangsorolás — a self-réteg alapértelmezése, ha van
 * MÉRT érdeklődés-kód.
 *
 * 1. lépcső: a jelölt-halmazt az ÉRDEKLŐDÉS és a munkakörnyezeti preferencia
 *    jelöli ki („mi felé húz"). Ezek jósolják a választást, a kitartást és az
 *    elégedettséget, és mindkét oldalon mért adatból jönnek.
 * 2. lépcső: a halmazon BELÜL a személyiség-illeszkedés rendez („ezek közül
 *    melyikben nem kell folyton magad ellen dolgoznod") — és ez adja az
 *    indoklást is.
 *
 * Becsült (személyiség-alapú) érdeklődés-kódnál ez körkörös lenne, ezért ott a
 * kompozit rangsor marad.
 */
const CHOICE_WEIGHTS = { interest: 0.7, preference: 0.3 } as const;
/**
 * A jelölt-halmaz RELATÍV: a legjobb „mi felé húz" pontszámhoz képest ennyi
 * ponttal maradhat el egy tétel. Fix méretű halmaz nem működik — ha túl bő,
 * a 2. lépcső (személyiség) visszaveszi a vezetést, és pont az veszik el, amiért
 * a kétlépcsős rendezés készült.
 */
const CANDIDATE_MARGIN = 12;
const CANDIDATE_MIN = 30;
const CANDIDATE_MAX = 60;

/** Vezetői ambíció: ezek a komponensek kapnak többletsúlyt. */
const LEAD_BOOST: Partial<Record<DimCode, number>> = { TEMP: 0.15, RESO: 0.05 };

/**
 * Illeszkedés egy komponensre: 100 a célon, 50 egy toleranciányira, 0 két
 * toleranciányira. Kétirányú — a cél fölötti eltérés is számít.
 */
function alignmentFor(userValue: number, target: number, tol: number): number {
  const distance = Math.abs(userValue - target);
  return Math.max(0, Math.min(100, 100 * (1 - distance / (2 * tol))));
}

/**
 * H-padló: ha a szerep cél-értéke a semlegesnél alacsonyabb becsületesség-alázat,
 * a cél 50-re emelkedik és a pontozás egyoldalú lesz. Így magas H-val nem lehet
 * rosszabbul illeszkedni, alacsonnyal pedig nem lehet "jobban".
 */
function componentFit(
  dim: DimCode,
  userValue: number,
  target: number,
  tol: number,
  weight: number,
): FitComponent {
  const hFloor = dim === "INTE" && target < 50;
  const effectiveTarget = hFloor ? 50 : target;
  const alignment = hFloor && userValue >= effectiveTarget
    ? 100
    : alignmentFor(userValue, effectiveTarget, tol);
  const position: FitComponent["position"] =
    Math.abs(userValue - effectiveTarget) <= tol
      ? "in"
      : userValue < effectiveTarget
        ? "under"
        : "over";
  return {
    dim,
    target: effectiveTarget,
    tol,
    weight,
    userValue: Math.round(userValue),
    alignment: Math.round(alignment),
    position,
    ...(hFloor ? { note: "h-floor" as const } : {}),
  };
}

/** Self + observer keverés értékelő-szám szerinti súllyal (nem fix 50/50). */
function blendDims(person: PersonInput): {
  blended: Partial<Record<DimCode, number>>;
  weight: number;
} {
  const raters = person.observer?.raterCount ?? 0;
  const weight = observerWeight(raters);
  if (!person.observer || weight === 0) return { blended: person.dims, weight: 0 };
  const blended: Partial<Record<DimCode, number>> = {};
  for (const dim of DIM_CODES) {
    const self = person.dims[dim];
    const other = person.observer.dims[dim];
    if (typeof self !== "number") continue;
    blended[dim] =
      typeof other === "number" ? self * (1 - weight) + other * weight : self;
  }
  return { blended, weight };
}

/** Profil-centrálás: a saját átlagot 50-re tolva marad a profil ALAKJA. */
function centerProfile(
  dims: Partial<Record<DimCode, number>>,
): Partial<Record<DimCode, number>> {
  const values = DIM_CODES.map((d) => dims[d]).filter(
    (v): v is number => typeof v === "number",
  );
  if (values.length === 0) return dims;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const centered: Partial<Record<DimCode, number>> = {};
  for (const dim of DIM_CODES) {
    const value = dims[dim];
    if (typeof value === "number") centered[dim] = value - mean + 50;
  }
  return centered;
}

/**
 * Általános munkahelyi alap: a meta-analízisekben a lelkiismeretesség és a
 * becsületesség-alázat a legerősebb általános prediktorok. Profil-szintű szám,
 * NEM szerep-illeszkedés.
 */
export function generalWorkPropensity(dims: Partial<Record<DimCode, number>>): number {
  const c = dims.THOR ?? 50;
  const h = dims.INTE ?? 50;
  return Math.round(c * 0.6 + h * 0.4);
}

/** Preferencia-egyezés a beállított tengelyeken (a nem állítottak kimaradnak). */
function preferenceFit(
  prefs: PersonInput["prefs"],
  axes: Record<AxisKey, number>,
): number | null {
  const active = AXIS_KEYS.filter((axis) => {
    const value = prefs?.[axis];
    return typeof value === "number" && value !== 0;
  });
  if (active.length === 0) return null;
  const sum = active.reduce((acc, axis) => {
    const user = prefs?.[axis] as number;
    return acc + (1 - Math.abs(user - axes[axis]) / 2);
  }, 0);
  return Math.round((sum / active.length) * 100);
}

/** Abszolút szint-illeszkedés: eléri-e a user a szerep elvárt szintjeit. */
function absoluteFit(
  dims: Partial<Record<DimCode, number>>,
  occupation: Occupation,
): number {
  let total = 0;
  let count = 0;
  for (const component of occupation.demand) {
    const user = dims[component.dim];
    if (typeof user !== "number") continue;
    const required = occupation.abs[component.dim];
    // csak a HIÁNY számít: a szint fölötti többlet nem von le
    const deficit = Math.max(0, required - user);
    total += Math.max(0, 100 - deficit * 2) * component.w;
    count += component.w;
  }
  return count > 0 ? Math.round(total / count) : 50;
}

function demandWeights(
  occupation: Occupation,
  leadIntent: PersonInput["leadIntent"],
): Array<{ dim: DimCode; target: number; tol: number; w: number }> {
  const base = occupation.demand.map((c) => ({ ...c }));
  if (leadIntent !== "lead") return base;
  const boosted = base.map((component) => ({
    ...component,
    w: component.w + (LEAD_BOOST[component.dim] ?? 0),
  }));
  const total = boosted.reduce((sum, c) => sum + c.w, 0) || 1;
  return boosted.map((component) => ({ ...component, w: component.w / total }));
}

export interface EngineOptions {
  /** hány tételt adjunk vissza (a klaszterezés ezen fut) */
  limit?: number;
  /** csak a végzettséggel elérhető szerepek */
  readyOnly?: boolean;
  /** szűkítés adott foglalkozás-azonosítókra (pl. összevetéshez) */
  only?: string[];
  /** a wizardban bejelölt iparágak — KIEMELÉS (bónusz), nem szűrés */
  industries?: string[];
  /** szakmacsalád-diverzifikálás (alapértelmezés: be) */
  diversify?: boolean;
  /** hány tétel jöhet egy ISCO-alcsoportból (2 jegyű) */
  perFamily?: number;
  /** KEMÉNY szűrő: csak az e területekre címkézett (vagy univerzális) szerepek */
  scope?: string[];
  /** rangsorolási stratégia (alapértelmezés: mért érdeklődésnél interest-led) */
  strategy?: RankStrategy;
  /** a jelölt-halmaz mérete interest-led módban */
  candidatePool?: number;
}

/**
 * Diverzifikálás: egy ISCO-alcsoportból (2 jegy) legfeljebb `perFamily` tétel
 * kerüljön a listába. Nélküle a lista ugyanannak a szakmacsaládnak a
 * variációival telik meg — ami pontszám-szinten igaz, de tanácsként használhatatlan.
 * A kimaradók a lista végén, kiegészítésként jönnek vissza.
 */
function diversify(
  sorted: OccupationFit[],
  limit: number,
  perFamily: number,
): OccupationFit[] {
  const used = new Map<string, number>();
  const picked: OccupationFit[] = [];
  const overflow: OccupationFit[] = [];
  for (const fit of sorted) {
    const family = (fit.isco ?? "??").slice(0, 2);
    const count = used.get(family) ?? 0;
    if (count < perFamily && picked.length < limit) {
      used.set(family, count + 1);
      picked.push(fit);
    } else if (overflow.length < limit) {
      overflow.push(fit);
    }
  }
  return [...picked, ...overflow].slice(0, limit);
}

export function computeCareerFit(
  person: PersonInput,
  options: EngineOptions = {},
): CareerFitResult {
  const { blended, weight } = blendDims(person);
  const centered = centerProfile(blended);
  const selfSe = dimStandardError(person.form);
  const dimSe = blendedStandardError(selfSe, person.observer?.raterCount ?? 0, weight);

  const differentiation = person.interests
    ? interestDifferentiation(person.interests.vector)
    : null;
  const interestFactor =
    differentiation === "low" ? LOW_DIFFERENTIATION_FACTOR : 1;

  let catalog = getOccupations();
  let scopeWidened = false;
  if (options.only) {
    catalog = catalog.filter((occupation) => options.only?.includes(occupation.id));
  } else if (options.scope?.length) {
    // A bejelölt terület KEMÉNY szűrő: a kimondott szándékot nem bíráljuk felül.
    // Padló: túl kevés találatnál nem szűrünk, hanem jelezzük a bővítést.
    const scoped = catalog.filter((occupation) => inScope(occupation, options.scope ?? []));
    if (scoped.length >= 8) catalog = scoped;
    else scopeWidened = true;
  }
  // Vétó: a kizárt munka-tulajdonság KEMÉNY szűrő — a kimondott „ezt nem"
  // szándékot nem bíráljuk felül. A kizártak számát a meta hordozza, a UI
  // láthatóvá teszi (nincs néma eltüntetés).
  let vetoExcluded = 0;
  const vetoes = person.vetoes ?? [];
  if (vetoes.length > 0 && !options.only) {
    const kept = catalog.filter(
      (occupation) => !(occupation.attrs ?? []).some((tag) => vetoes.includes(tag)),
    );
    vetoExcluded = catalog.length - kept.length;
    catalog = kept;
  }
  const picked = options.industries ?? [];

  const fits: OccupationFit[] = [];
  for (const occupation of catalog) {
    const weights = demandWeights(occupation, person.leadIntent);
    const components: FitComponent[] = [];
    let weighted = 0;
    let totalWeight = 0;
    for (const component of weights) {
      const userValue = centered[component.dim];
      if (typeof userValue !== "number") continue;
      const fit = componentFit(
        component.dim,
        userValue,
        component.target,
        component.tol,
        component.w,
      );
      components.push(fit);
      weighted += fit.alignment * component.w;
      totalWeight += component.w;
    }
    if (totalWeight === 0) continue;

    const demandFit = Math.round(weighted / totalWeight);
    const se = fitStandardError(
      components.map((c) => ({ weight: c.weight / totalWeight, tol: c.tol })),
      dimSe,
    );
    const interest = person.interests
      ? interestCongruence(person.interests.vector, occupation.riasec)
      : null;
    const preference = preferenceFit(person.prefs, occupation.axes);
    const feasibility = feasibilityFor(
      occupation.entry,
      person.eduLevel ?? null,
      person.eduFields ?? null,
      occupation.eduFields ?? null,
    );

    // Kompozit: csak a meglévő komponensek, a súlyok újranormálva.
    const interestWeight = person.interests
      ? interestWeightFor(person.interests.source) * interestFactor
      : 0;
    const parts: Array<[number, number]> = [[demandFit, RANK_WEIGHTS.demand]];
    if (interest !== null) parts.push([interest, interestWeight]);
    if (preference !== null) parts.push([preference, RANK_WEIGHTS.preference]);
    const weightSum = parts.reduce((sum, [, w]) => sum + w, 0);
    // „Mi felé húz" pontszám: érdeklődés + munkakörnyezeti preferencia.
    const choiceParts: Array<[number, number]> = [];
    if (interest !== null) choiceParts.push([interest, CHOICE_WEIGHTS.interest]);
    if (preference !== null) choiceParts.push([preference, CHOICE_WEIGHTS.preference]);
    const industryPick = picked.length > 0 && pickOverlap(occupation, picked) > 0;

    // A bejelölt iparág is „mi felé húz" jelzés, ezért a jelölt-halmaz
    // pontszámába számít. (Enélkül interest-led módban nulla hatása lett volna:
    // a 2. lépcső felülírta a kompozit rangot, és vele a bónuszt is.)
    const choiceScore = choiceParts.length
      ? Math.min(
          100,
          Math.round(
            choiceParts.reduce((sum, [value, weight]) => sum + value * weight, 0) /
              choiceParts.reduce((sum, [, weight]) => sum + weight, 0),
          ) + (industryPick ? INDUSTRY_PICK_BONUS : 0),
        )
      : null;
    const rank = Math.min(
      100,
      Math.round(parts.reduce((sum, [v, w]) => sum + v * w, 0) / weightSum) +
        (industryPick ? INDUSTRY_PICK_BONUS : 0),
    );
    // A rangsor hibája: a komponensek hibáinak súlyozott terjesztése. Az
    // érdeklődés (30 itemes mért kérdőív) és a preferencia (közvetlen válasz)
    // jóval pontosabb, mint a személyiség-alapú illeszkedés.
    const interestSe =
      interest === null ? 0 : person.interests?.source === "measured" ? 6 : 12;
    const preferenceSe = preference === null ? 0 : 5;
    const rankSe =
      Math.sqrt(
        (RANK_WEIGHTS.demand * se) ** 2 +
          (interest === null ? 0 : (interestWeight * interestSe) ** 2) +
          (preference === null ? 0 : (RANK_WEIGHTS.preference * preferenceSe) ** 2),
      ) / (weightSum || 1);

    const flags: string[] = [];
    if (components.some((c) => c.note === "h-floor")) flags.push("h-floor");
    if (components.some((c) => c.position === "over" && c.weight >= 0.2)) flags.push("above-target");
    if (!feasibility.ready) flags.push("entry-gap");
    if (feasibility.state === "field-match") flags.push("field-match");
    if (feasibility.state === "licence-needed") flags.push("licence-needed");
    if (industryPick) flags.push("industry-pick");
    if (occupation.axesSource) flags.push("axes-estimated");

    fits.push({
      id: occupation.id,
      hu: occupation.hu,
      feor: occupation.feor,
      isco: occupation.isco,
      tier: occupation.tier,
      entry: occupation.entry,
      family: occupation.family ?? null,
      demandFit,
      se: Math.round(se * 10) / 10,
      band: bandFor(demandFit, se),
      rankSe: Math.round(rankSe * 10) / 10,
      components: components.sort((a, b) => b.weight - a.weight),
      absoluteFit: absoluteFit(blended, occupation),
      interest,
      preference,
      feasibility,
      rank,
      orderedBy: "composite",
      choiceScore,
      flags,
    });
  }

  const filtered = options.readyOnly ? fits.filter((f) => f.feasibility.ready) : fits;

  // A kétlépcsős rendezés csak MÉRT érdeklődés-kóddal indul el (becsültnél
  // körkörös lenne), és csak akkor, ha a hívó nem kért mást.
  const scopeActive = Boolean(options.scope?.length) && !scopeWidened;
  const canUseInterestLed =
    person.interests?.source === "measured" &&
    differentiation !== "low" &&
    filtered.some((fit) => fit.choiceScore !== null);
  const strategy: RankStrategy =
    options.strategy ?? (scopeActive ? "scoped" : canUseInterestLed ? "interest-led" : "composite");

  let sorted: OccupationFit[];
  let candidatePool: number | null = null;
  if (strategy === "scoped" && scopeActive) {
    // Scope-mód: a halmazt a kimondott szándék adta; a sorrendet az érdeklődés
    // (+ preferenciák) rendezi, metszet-kiemeléssel. A személyiség a klaszteren
    // belül rendez, és annotál — nem szűr.
    const interestSe = person.interests?.source === "measured" ? 6 : 12;
    const scopedRankSe = Math.sqrt((0.7 * interestSe) ** 2 + (0.3 * 5) ** 2);
    const byId = new Map(getOccupations().map((o) => [o.id, o]));
    sorted = filtered
      .map((fit) => {
        const occupation = byId.get(fit.id);
        const overlap = occupation ? pickOverlap(occupation, options.scope ?? []) : 0;
        const intersect = overlap >= 2;
        // A szakirány is kimondott jel: az eü-diplomás eü-váltónál az egyező
        // képzettségű szerep előrébb való, mint az azonos érdeklődésű idegen.
        const fieldBonus = fit.feasibility.state === "field-match" ? 6 : 0;
        return {
          ...fit,
          rank: Math.min(100, (fit.choiceScore ?? fit.demandFit) + (intersect ? 6 : 0) + fieldBonus),
          rankSe: Math.round(scopedRankSe * 10) / 10,
          orderedBy: "interest" as const,
          flags: intersect ? [...fit.flags, "industry-intersect"] : fit.flags,
        };
      })
      .sort((a, b) => b.rank - a.rank || a.hu.localeCompare(b.hu, "hu"));
    candidatePool = sorted.length;
  } else if (strategy === "interest-led" && canUseInterestLed) {
    // 1. lépcső: jelölt-halmaz az érdeklődés/preferencia szerint
    const byChoice = [...filtered].sort(
      (a, b) => (b.choiceScore ?? 0) - (a.choiceScore ?? 0),
    );
    const best = byChoice[0]?.choiceScore ?? 0;
    const withinMargin = byChoice.filter(
      (fit) => (fit.choiceScore ?? 0) >= best - CANDIDATE_MARGIN,
    );
    const poolSize = options.candidatePool
      ?? Math.min(CANDIDATE_MAX, Math.max(CANDIDATE_MIN, withinMargin.length));
    const pool = byChoice.slice(0, poolSize);
    candidatePool = pool.length;
    // 2. lépcső: a halmazon belül a személyiség-illeszkedés rendez
    sorted = pool
      .map((fit) => ({ ...fit, rank: fit.demandFit, orderedBy: "demandFit" as const, rankSe: fit.se }))
      .sort((a, b) => b.rank - a.rank || a.hu.localeCompare(b.hu, "hu"));
  } else {
    sorted = filtered.sort((a, b) => b.rank - a.rank || a.hu.localeCompare(b.hu, "hu"));
  }
  const ranked = options.diversify === false
    ? sorted.slice(0, options.limit ?? 24)
    : diversify(sorted, options.limit ?? 24, options.perFamily ?? 2);

  return {
    general: generalWorkPropensity(blended),
    interestSource: person.interests?.source ?? null,
    interestDifferentiation: differentiation,
    observerWeight: Math.round(weight * 100) / 100,
    clusters: clusterByOverlap(ranked),
    ranked,
    meta: {
      catalogVersion: CATALOG_VERSION,
      occupationCount: catalog.length,
      form: person.form,
      dimSe: Math.round(dimSe * 10) / 10,
      strategy,
      candidatePool,
      ...(scopeWidened ? { scopeWidened: true } : {}),
      ...(vetoExcluded > 0 ? { vetoExcluded } : {}),
    },
  };
}
