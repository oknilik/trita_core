import type { TestType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import type { TestConfig, Question, LikertQuestion } from "./types";
import { hexacoConfig } from "./hexaco";
import { hexacoModifiedConfig } from "./hexacoModified";
import { big5Config } from "./big5";

const testConfigs: Partial<Record<TestType, TestConfig>> = {
  HEXACO: hexacoConfig,
  HEXACO_MODIFIED: hexacoModifiedConfig,
  BIG_FIVE: big5Config,
};

const testLabels: Partial<Record<TestType, Record<Locale, { name: string; description: string }>>> = {
  HEXACO: {
    hu: { name: "HEXACO-PI-R", description: "A hivatalos HEXACO személyiségteszt 60 kérdéssel." },
    en: { name: "HEXACO-PI-R", description: "Official HEXACO personality test with 60 items." },
    de: { name: "HEXACO-PI-R", description: "Offizieller HEXACO‑Test mit 60 Fragen." },
  },
  HEXACO_MODIFIED: {
    // Intentionally user-facing neutral naming (research variant is internal only).
    hu: { name: "HEXACO", description: "HEXACO-alapú személyiségteszt kérdőív." },
    en: { name: "HEXACO", description: "HEXACO-based personality questionnaire." },
    de: { name: "HEXACO", description: "HEXACO-basierter Persönlichkeitsfragebogen." },
  },
  BIG_FIVE: {
    hu: { name: "Big Five (BFAS)", description: "Big Five Aspect Scales — aspektus-szintű mérés, amely a munkahelyi viselkedés jobb előrejelzőképességéért lett választva." },
    en: { name: "Big Five (BFAS)", description: "Big Five Aspect Scales — aspect-level measurement chosen for higher predictive power for work-related behavior." },
    de: { name: "Big Five (BFAS)", description: "Big Five Aspect Scales — Aspekt‑Ebene, gewählt für höhere Vorhersagekraft bei Arbeitsverhalten." },
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

export function getTestConfig(testType: TestType, locale: Locale = "hu"): TestConfig {
  const config = testConfigs[testType];
  if (!config) {
    throw new Error(`Unsupported test type: ${testType}`);
  }
  const labels = testLabels[testType]?.[locale] ?? testLabels[testType]?.hu;
  if (!labels) {
    throw new Error(`Missing labels for test type: ${testType}`);
  }
  return {
    ...config,
    name: labels.name,
    description: labels.description,
    dimensions: config.dimensions.map((dim) => localizeDimension(dim, locale)),
    questions: config.questions.map((q) => localizeQuestion(q, locale)),
  };
}

export const CORE_TEST_TYPES: TestType[] = ["HEXACO", "HEXACO_MODIFIED", "BIG_FIVE"];

export function getAllTestTypes(): TestType[] {
  return Object.keys(testConfigs) as TestType[];
}

export { type TestConfig, type LikertQuestion, type Question, type DimensionConfig, type FacetConfig, type AspectConfig, isLikertQuestion } from "./types";
