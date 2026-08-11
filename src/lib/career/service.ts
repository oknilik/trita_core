// Szerver-oldali karrier-szolgáltatás: EGY hívás, amit a képernyő (API-n át),
// a szerver-komponens (kezdeti render) és a PDF-ág egyaránt használ.
// Így a három felület garantáltan ugyanazt az eredményt mutatja.

import "server-only";

import { computeCareerFit, type EngineOptions } from "./engine";
import { getContentMap } from "./catalog";
import { buildPersonInput } from "./person";
import { clusterByOverlap } from "./psychometrics";
import { roleTopLetters, userTopLetters } from "./interests";
import { getOccupation } from "./catalog";
import {
  RIASEC_LETTERS,
  type CareerFitResult,
  type EntryLevel,
  type OccupationFit,
  type PersonInput,
  type RiasecLetter,
  type VetoTag,
} from "./types";

/** Megjelenítéshez dúsított illeszkedés (leírás, aliasok, hivatalos nevek). */
export interface CareerFitView extends OccupationFit {
  desc: string;
  aliases: string[];
  eduHu: string | null;
  feorName: string;
  /** a foglalkozás három legerősebb Holland-betűje */
  riasecTop: string;
}

/**
 * A lista három szakaszra bomlik, mert a felhasználó két külön kérdésre keres
 * választ: „mit csinálhatok MOST" és „mi érhető el tanulással".
 */
export interface CareerSections {
  /** a végzettségi szintednek megfelelő, most elérhető szerepek */
  atLevel: CareerFitView[][];
  /** elérhető, de a végzettséged alatti belépési szinttel */
  belowLevel: CareerFitView[][];
  /** tanulással / átképzéssel elérhető */
  afterTraining: CareerFitView[][];
}

export interface CareerResultView extends Omit<CareerFitResult, "ranked"> {
  sections: CareerSections;
  scope: ScopeInfo;
  /** a jelenlegi területen belüli legjobb szerepek (ha a user megadta) */
  currentField: CareerFitView[];
  hasSelfResult: boolean;
  /** a user érdeklődés-profilja — a felületen látnia kell, mi alapján rangsorolunk */
  interests: {
    vector: Partial<Record<RiasecLetter, number>>;
    top: string;
    source: "measured" | "tags" | "estimated";
    /** a rangsorban ténylegesen kapott súly (0-1) */
    weight: number;
  } | null;
  /** true, ha a bejelölt iparágak ellentmondanak a mért érdeklődésnek */
  industryMismatch: boolean;
  /** a felhasználó vétói és a kizárt szerepek száma — látható szűrés, nem néma */
  veto: { keys: VetoTag[]; excluded: number };
}

export interface CareerServiceOptions extends EngineOptions {
  /** a wizard „jelenlegi területed" válasza — külön blokkot kap az eredményben */
  currentIndustry?: string | null;
  /** a wizard státusz-válasza (dolgozom / váltanék / tanulok) */
  status?: "studying" | "working" | "switching" | null;
  /** a szűretlen-nézet kapcsoló: a bejelölt területek NEM szűrnek */
  ignoreScope?: boolean;
  /** friss, még nem mentett wizard-válaszok */
  overrides?: Partial<PersonInput>;
}

export interface ScopeInfo {
  /** open = nincs bejelölés · picked = bejelölt területek · stay = maradna a területén */
  mode: "open" | "picked" | "stay";
  keys: string[];
  /** true, ha a szűrő túl kevés találatot adott, és kibővítettük */
  widened: boolean;
  /** ténylegesen szűrt-e a lista */
  active: boolean;
  /** a user kérte a szűretlen nézetet */
  ignored: boolean;
}

const ENTRY_RANK: Record<EntryLevel, number> = {
  open: 0,
  course: 1,
  vocational: 2,
  higher: 3,
  specialized: 4,
};

const EDU_RANK: Record<string, number> = {
  primary: 0,
  secondary: 1,
  vocational: 2,
  higher: 3,
  specialized: 4,
};

type Section = keyof CareerSections;

/**
 * Melyik szakaszba kerül a szerep. A „Most elérhető" a SZINTEDNEK megfelelő
 * belépésű szerepeket jelenti — egy diplomás egészségügyisnek a szakma-szintű
 * látszerész nem „most elérhető" ajánlat, hanem tudatos lefelé-váltás
 * (belowLevel, összecsukva). A szint fölött: tanulással.
 */
const AT_LEVEL: Record<number, number[]> = {
  0: [0],
  1: [0, 1],
  2: [2],
  3: [3],
  4: [3, 4],
};

function sectionFor(fit: OccupationFit, eduLevel: string | null | undefined): Section {
  const entry = ENTRY_RANK[fit.entry];
  if (!eduLevel) return entry <= 1 ? "atLevel" : "afterTraining";
  const edu = EDU_RANK[eduLevel] ?? 0;
  if (entry > edu) return "afterTraining";
  if ((AT_LEVEL[edu] ?? [edu]).includes(entry)) return "atLevel";
  return "belowLevel";
}

export async function computeCareerForProfile(
  userProfileId: string,
  options: CareerServiceOptions = {},
): Promise<CareerResultView> {
  const { currentIndustry, status, ignoreScope, overrides, limit, ...engineOptions } = options;
  const { person, hasSelfResult } = await buildPersonInput(userProfileId, overrides);

  // Scope-feloldás: a kimondott szándék (bejelölt területek) kemény szűrő.
  const picks = engineOptions.industries ?? [];
  const scopeKeys = ignoreScope ? [] : picks;
  const scopeMode: ScopeInfo["mode"] =
    picks.length === 0
      ? "open"
      : status === "working" && picks.length === 1 && picks[0] === currentIndustry
        ? "stay"
        : "picked";

  const emptySections: CareerSections = { atLevel: [], belowLevel: [], afterTraining: [] };
  if (!hasSelfResult) {
    return {
      interestSource: null,
      interestDifferentiation: null,
      observerWeight: 0,
      meta: {
        catalogVersion: "",
        occupationCount: 0,
        form: person.form,
        dimSe: 0,
        strategy: "composite",
        candidatePool: null,
        interestWeight: 0,
      },
      sections: emptySections,
      scope: { mode: "open", keys: [], widened: false, active: false, ignored: false },
      currentField: [],
      hasSelfResult: false,
      interests: null,
      industryMismatch: false,
      veto: { keys: [], excluded: 0 },
    };
  }

  // Bőven szedünk tételt, mert a szakaszokra bontás után mindegyikbe kell jusson.
  const result = computeCareerFit(person, {
    ...engineOptions,
    scope: scopeKeys,
    limit: (limit ?? 18) * 3,
    perFamily: engineOptions.perFamily ?? 2,
  });
  const scope: ScopeInfo = {
    mode: scopeMode,
    keys: picks,
    widened: result.meta.scopeWidened ?? false,
    active: scopeKeys.length > 0 && !(result.meta.scopeWidened ?? false),
    ignored: Boolean(ignoreScope) && picks.length > 0,
  };

  const currentFieldResult = currentIndustry && !(scope.active && picks.includes(currentIndustry))
    ? computeCareerFit(person, {
        ...engineOptions,
        industries: [currentIndustry],
        scope: [currentIndustry],
        limit: 3,
        perFamily: 3,
      })
    : null;

  const content = await getContentMap();
  const decorate = (fit: OccupationFit): CareerFitView => {
    const extra = content.get(fit.id);
    const occupation = getOccupation(fit.id);
    return {
      ...fit,
      desc: extra?.desc ?? "",
      aliases: extra?.aliases ?? [],
      eduHu: extra?.eduHu ?? null,
      feorName: extra?.feorName ?? "",
      riasecTop: occupation ? roleTopLetters(occupation) : "",
    };
  };

  const perSection = Math.max(6, limit ?? 18);
  const buckets: Record<Section, OccupationFit[]> = {
    atLevel: [],
    belowLevel: [],
    afterTraining: [],
  };
  for (const fit of result.ranked) {
    buckets[sectionFor(fit, person.eduLevel)].push(fit);
  }

  const sections: CareerSections = {
    atLevel: clusterByOverlap(buckets.atLevel.slice(0, perSection)).map((cluster) =>
      // A klaszteren belül nincs illeszkedés-sorrend, ezért ott a SZAKIRÁNY-
      // egyezés kerül előre: a szint önmagában nem képesít semmire.
      [...cluster]
        .sort(
          (a, b) =>
            Number(b.feasibility.state === "field-match") -
            Number(a.feasibility.state === "field-match"),
        )
        .map(decorate),
    ),
    belowLevel: clusterByOverlap(buckets.belowLevel.slice(0, 6)).map((cluster) =>
      cluster.map(decorate),
    ),
    afterTraining: clusterByOverlap(buckets.afterTraining.slice(0, 8)).map((cluster) =>
      cluster.map(decorate),
    ),
  };

  const shownIds = new Set(
    [...sections.atLevel, ...sections.belowLevel, ...sections.afterTraining]
      .flat()
      .map((fit) => fit.id),
  );

  // Érdeklődés-blokk: a felhasználónak LÁTNIA kell a saját kódját és azt, hogy
  // mekkora súllyal számít — enélkül úgy tűnik, mintha nem használnánk. A súly
  // a motor metájából jön: a mutatott és a ténylegesen használt érték azonos.
  const interests = person.interests
    ? {
        vector: Object.fromEntries(
          RIASEC_LETTERS.map((letter) => [letter, person.interests?.vector[letter] ?? 0]),
        ) as Partial<Record<RiasecLetter, number>>,
        top: userTopLetters(person.interests.vector),
        source: person.interests.source,
        weight: Math.round(result.meta.interestWeight * 100) / 100,
      }
    : null;

  // Ellentmondás-jelzés: a bejelölt iparágak egyike sem szerepel a mért
  // érdeklődés szerinti legjobb tételek között.
  const picked = new Set(options.industries ?? []);
  const industryMismatch =
    picked.size > 0 &&
    person.interests?.source === "measured" &&
    result.ranked.slice(0, 10).every((fit) => !fit.flags.includes("industry-pick"));

  return {
    interestSource: result.interestSource,
    interestDifferentiation: result.interestDifferentiation,
    observerWeight: result.observerWeight,
    meta: result.meta,
    sections,
    scope,
    currentField: (currentFieldResult?.ranked ?? [])
      .filter((fit) => !shownIds.has(fit.id))
      .map(decorate),
    hasSelfResult: true,
    interests,
    industryMismatch,
    veto: {
      keys: person.vetoes ?? [],
      excluded: result.meta.vetoExcluded ?? 0,
    },
  };
}
