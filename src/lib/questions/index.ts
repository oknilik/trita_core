import type { TestType } from "@prisma/client";
import type { Locale } from "@/lib/i18n";
import type { TestConfig, Question, LikertQuestion, MBTIQuestion } from "./types";
import { hexacoConfig } from "./hexaco";
import { hexacoModifiedConfig } from "./hexacoModified";
import { big5Config } from "./big5";
import { mbtiConfig } from "./mbti";

const testConfigs: Record<TestType, TestConfig> = {
  HEXACO: hexacoConfig,
  HEXACO_MODIFIED: hexacoModifiedConfig,
  BIG_FIVE: big5Config,
  MBTI: mbtiConfig,
};

const testLabels: Record<TestType, Record<Locale, { name: string; description: string }>> = {
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
  MBTI: {
    hu: { name: "Tipológiai dichotómiák", description: "Jung-alapú preferencia-felmérés, exploratív összehasonlításra (nem hivatalos MBTI)." },
    en: { name: "Typological dichotomies", description: "Jung-based preference assessment for exploratory comparison (non-official)." },
    de: { name: "Typologische Dichotomien", description: "Jung‑basierte Präferenzbeurteilung für explorativen Vergleich (nicht offiziell)." },
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
  const mbti = q as MBTIQuestion;
  return {
    ...mbti,
    optionA: {
      ...mbti.optionA,
      text: mbti.optionAByLocale?.[locale] ?? mbti.optionA.text,
    },
    optionB: {
      ...mbti.optionB,
      text: mbti.optionBByLocale?.[locale] ?? mbti.optionB.text,
    },
    optionAObserver:
      mbti.optionAObserverByLocale?.[locale] ?? mbti.optionAObserver,
    optionBObserver:
      mbti.optionBObserverByLocale?.[locale] ?? mbti.optionBObserver,
  };
}

export function getTestConfig(testType: TestType, locale: Locale = "hu"): TestConfig {
  const config = testConfigs[testType];
  const labels = testLabels[testType][locale] ?? testLabels[testType].hu;
  return {
    ...config,
    name: labels.name,
    description: labels.description,
    questions: config.questions.map((q) => localizeQuestion(q, locale)),
  };
}

/** Core trait-based instruments (primary analysis, priority in random assignment) */
export const CORE_TEST_TYPES: TestType[] = ["HEXACO", "HEXACO_MODIFIED", "BIG_FIVE"];

/** Exploratory instruments (secondary, smaller sample) */
export const EXPLORATORY_TEST_TYPES: TestType[] = ["MBTI"];

/** Target completions per core test type before exploratory types are assigned */
export const CORE_QUOTA = 50;

export function getAllTestTypes(): TestType[] {
  return Object.keys(testConfigs) as TestType[];
}

export { type TestConfig, type LikertQuestion, type MBTIQuestion, type Question, type DimensionConfig, isMBTIQuestion, isLikertQuestion } from "./types";
