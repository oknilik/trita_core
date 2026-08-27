import type { TestType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import type { AssessmentForm, TestConfig, Question, LikertQuestion } from "./types";
import { tritanConfig } from "./tritan";

const testConfigs: Partial<Record<TestType, TestConfig>> = {
  TRITAN: tritanConfig,
};

const testLabels: Partial<Record<TestType, Record<Locale, { name: string; description: string }>>> = {
  TRITAN: {
    hu: { name: "trita személyiségteszt", description: "Hatfaktoros, validált személyiségteszt." },
    en: { name: "trita personality assessment", description: "Six-factor, validated personality assessment." },
  },
};

function localizeQuestion(q: Question, locale: Locale): Question {
  if ("dimension" in q) {
    const likert = q as LikertQuestion;
    const localizedText = likert.textByLocale?.[locale];
    const localizedObserverText = likert.textObserverByLocale?.[locale];
    return {
      ...likert,
      text:
        localizedText && localizedText.trim().length > 0
          ? localizedText
          : likert.text,
      textObserver:
        localizedObserverText && localizedObserverText.trim().length > 0
          ? localizedObserverText
          : likert.textObserver,
    };
  }
  return q;
}

function localizeDimension(
  dimension: TestConfig["dimensions"][number],
  locale: Locale
) {
  return {
    ...dimension,
    label: dimension.labelByLocale?.[locale] ?? dimension.label,
    description: dimension.descriptionByLocale?.[locale] ?? dimension.description,
    insights: dimension.insightsByLocale?.[locale] ?? dimension.insights,
    facets: dimension.facets?.map((f) => ({
      ...f,
      label: f.labelByLocale?.[locale] ?? f.label,
    })),
    aspects: dimension.aspects?.map((a) => ({
      ...a,
      label: a.labelByLocale?.[locale] ?? a.label,
    })),
  };
}

// A PONTOZÁS mindig a teljes konfigból dolgozik (a meg nem válaszolt
// itemek nem számítanak bele) — a form csak a KISZOLGÁLT listát szűri.
export type { AssessmentForm } from "./types";

export function getTestConfig(
  testType: TestType,
  locale: Locale = "hu",
  form: AssessmentForm = "full"
): TestConfig {
  const config = testConfigs[testType];
  if (!config) {
    throw new Error(`Unsupported test type: ${testType}`);
  }
  const labels = testLabels[testType]?.[locale] ?? testLabels[testType]?.hu;
  if (!labels) {
    throw new Error(`Missing labels for test type: ${testType}`);
  }
  const questions =
    form === "short"
      ? config.questions.filter((q) => "short" in q && q.short === true)
      : config.questions;
  return {
    ...config,
    name: labels.name,
    description: labels.description,
    dimensions: config.dimensions.map((dim) => localizeDimension(dim, locale)),
    questions: questions.map((q) => localizeQuestion(q, locale)),
  };
}

// ── Korábbi (kivezetett) rövid formák id-halmazai ────────────────────
// A rövid forma ÖSSZETÉTELE változhat, miközben a kitöltés már fut. Egy
// beragadt kliens-bundle, egy több napos vendég-draft (/try localStorage,
// szűretlenül megy a claimre) vagy egy régi observer-fül PONTOSAN a régi
// id-halmazt adja be. Ezeket a beadásokat NEM utasítjuk el: a kitöltő
// hiánytalanul végigment 60 itemen, a pontozás pedig item-szinten dolgozik,
// tehát a régi halmaz ugyanúgy értelmes eredményt ad (a kivezetett skála
// pontszáma is előáll – pont, ahogy a korábbi éles soroknál).
//
// SZÁNDÉKOSAN kimerevített id-listák, nem a mai bankból számolt delta: ha a
// rövid forma megint változik, a történeti halmaz akkor is önmagát írja le.
const LEGACY_COMPLETE_FORM_ID_SETS: Partial<Record<TestType, readonly (readonly number[])[]>> = {
  // TSFI-S v1 (2026-07-16 – 2026-08-11): tartalmazta a kiegészítő
  // altruizmus-skála 98/99 itemét, és NEM tartalmazta a 77 (E/fearfulness)
  // és 79 (O/inquisitiveness) itemet. 2026-08-11-én a skála kikerült a
  // rövid formából, a két fő-dimenziós item pedig beléptetve – az itemszám
  // (60) és a forma-kód ("short") változatlan.
  TRITAN: [
    [
      1, 2, 4, 5, 6, 9, 10, 11, 13, 14, 15, 16, 17, 18, 21, 22, 23, 24, 26, 27,
      29, 30, 31, 32, 33, 35, 36, 37, 38, 39, 41, 42, 49, 51, 54, 55, 56, 58,
      60, 61, 63, 64, 67, 68, 69, 72, 74, 76, 80, 82, 83, 84, 88, 91, 92, 93,
      94, 95, 98, 99,
    ],
  ],
};

/**
 * Hiánytalan kitöltés-ellenőrzés FORMA-TUDATOSAN: a válaszhalmaz akkor
 * érvényes, ha pontosan a rövid (TSFI-S, 60 item) vagy pontosan a teljes
 * (100 item) forma itemjeit fedi le. A pontozás mindkét formát ugyanazon
 * a 0–100 skálán kezeli, így a kettő eredménye összevethető.
 *
 * Elfogadjuk a KORÁBBI rövid formák pontos id-halmazát is
 * (LEGACY_COMPLETE_FORM_ID_SETS) – egy forma-váltás pillanatában futó
 * kitöltést elveszíteni rosszabb, mint egy kivezetett item-összetételt
 * pontozni. Hiányos halmazt továbbra sem fogad el.
 */
export function isCompleteFormAnswerSet(
  testType: TestType,
  answeredIds: ReadonlySet<number>
): boolean {
  const questions = testConfigs[testType]?.questions ?? [];
  const fullIds = questions.map((q) => q.id);
  const shortIds = questions
    .filter((q) => "short" in q && q.short === true)
    .map((q) => q.id);
  const matches = (ids: readonly number[]) =>
    ids.length === answeredIds.size && ids.every((id) => answeredIds.has(id));
  if (matches(shortIds) || matches(fullIds)) return true;
  return (LEGACY_COMPLETE_FORM_ID_SETS[testType] ?? []).some(matches);
}

/**
 * A kitöltés-ellenőrzés által elfogadott ÖSSZES id (mai formák + történeti
 * rövid formák). Az API-rétegek ehhez szűrik a beérkező válaszokat, MIELŐTT
 * a teljesség-ellenőrzés fut – így a régi halmaz itemjei nem esnek ki a
 * szűrőn (a mai teljes bank amúgy is tartalmazza őket, de ez a kapu nem
 * feltételezi, hogy egy kivezetett item bent maradt a bankban).
 */
export function getAcceptedAnswerIds(testType: TestType): Set<number> {
  const ids = new Set<number>(testConfigs[testType]?.questions.map((q) => q.id) ?? []);
  for (const legacy of LEGACY_COMPLETE_FORM_ID_SETS[testType] ?? []) {
    for (const id of legacy) ids.add(id);
  }
  return ids;
}

export const CORE_TEST_TYPES: TestType[] = ["TRITAN"];

export function getAllTestTypes(): TestType[] {
  return Object.keys(testConfigs) as TestType[];
}

export { type TestConfig, type LikertQuestion, type Question, type DimensionConfig, type FacetConfig, type AspectConfig, isLikertQuestion, estimateAssessmentMinutes } from "./types";
