import type { TestType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import type { AssessmentForm, TestConfig, Question, LikertQuestion } from "./types";
import { tritanConfig } from "./tritan";

const testConfigs: Partial<Record<TestType, TestConfig>> = {
  TRITAN: tritanConfig,
};

const testLabels: Partial<Record<TestType, Record<Locale, { name: string; description: string }>>> = {
  TRITAN: {
    hu: { name: "Trita személyiségfelmérés", description: "Hatfaktoros, validált személyiségfelmérés." },
    en: { name: "Trita personality assessment", description: "Six-factor, validated personality assessment." },
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

/**
 * Hiánytalan kitöltés-ellenőrzés FORMA-TUDATOSAN: a válaszhalmaz akkor
 * érvényes, ha pontosan a rövid (TSFI-S, 60 item) vagy pontosan a teljes
 * (100 item) forma itemjeit fedi le. A pontozás mindkét formát ugyanazon
 * a 0–100 skálán kezeli, így a kettő eredménye összevethető.
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
  const matches = (ids: number[]) =>
    ids.length === answeredIds.size && ids.every((id) => answeredIds.has(id));
  return matches(shortIds) || matches(fullIds);
}

export const CORE_TEST_TYPES: TestType[] = ["TRITAN"];

export function getAllTestTypes(): TestType[] {
  return Object.keys(testConfigs) as TestType[];
}

export { type TestConfig, type LikertQuestion, type Question, type DimensionConfig, type FacetConfig, type AspectConfig, isLikertQuestion, estimateAssessmentMinutes } from "./types";
