import type { TestConfig } from "./types";
import { hexacoConfig } from "./hexaco";

/**
 * HEXACO Modified currently mirrors the official 60-item bank.
 * This keeps self/observer wording and scoring aligned across both HEXACO variants.
 */
export const hexacoModifiedConfig: TestConfig = {
  type: "HEXACO_MODIFIED",
  name: "Módosított HEXACO",
  description: "HEXACO kérdéssor (60 kérdés), self és observer kitöltéshez.",
  format: "likert",
  dimensions: hexacoConfig.dimensions,
  questions: hexacoConfig.questions.map((question) => ({
    ...question,
    textByLocale: question.textByLocale ? { ...question.textByLocale } : undefined,
    textObserverByLocale: question.textObserverByLocale
      ? { ...question.textObserverByLocale }
      : undefined,
  })),
};
