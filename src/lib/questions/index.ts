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
    hu: { name: "HEXACO (módosított)", description: "Kontextus-adaptált HEXACO kérdésbank, amely a hivatalos HEXACO-PI-R-rel összehasonlítható observer-megegyezés elérését vizsgálja." },
    en: { name: "HEXACO (modified)", description: "Context-adapted HEXACO item set testing whether a reduced bank achieves comparable observer agreement." },
    de: { name: "HEXACO (modifiziert)", description: "Kontextadaptierter HEXACO‑Fragenkatalog zur Prüfung vergleichbarer Beobachterübereinstimmung." },
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
    return {
      ...likert,
      text: likert.textByLocale?.[locale] ?? likert.text,
      textObserver:
        likert.textObserverByLocale?.[locale] ?? likert.textObserver,
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

/** Core trait-based instruments (primary analysis, priority in random assignment) */
export const CORE_TEST_TYPES: TestType[] = ["HEXACO", "HEXACO_MODIFIED", "BIG_FIVE"];

/** Exploratory instruments (secondary, smaller sample) */
export const EXPLORATORY_TEST_TYPES: TestType[] = [];

export function getAllTestTypes(): TestType[] {
  return Object.keys(testConfigs) as TestType[];
}

export { type TestConfig, type LikertQuestion, type Question, type DimensionConfig, isLikertQuestion } from "./types";
