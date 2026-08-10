import type { TestType } from "@prisma/client";
import {
  getTestConfig,
  isLikertQuestion,
  type LikertQuestion,
} from "./questions";
import type { AssessmentForm } from "./questions/types";
import { TRITAN_ORDER } from "./tritan";

// ============================================
// Likert scoring (TRITAN)
// ============================================

interface LikertAnswer {
  questionId: number;
  value: number; // 1-5
}

interface LikertScores {
  dimensions: Record<string, number>;
  facets: Record<string, Record<string, number>>;
}

function scoreLikert(
  testType: TestType,
  answers: LikertAnswer[]
): LikertScores {
  const config = getTestConfig(testType);
  const questions = config.questions.filter(isLikertQuestion) as LikertQuestion[];
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const totals: Record<string, { sum: number; count: number }> = {};
  const facetTotals: Record<string, Record<string, { sum: number; count: number }>> = {};

  for (const dim of config.dimensions) {
    totals[dim.code] = { sum: 0, count: 0 };
    if (dim.facets?.length) {
      facetTotals[dim.code] = {};
      for (const f of dim.facets) {
        facetTotals[dim.code][f.code] = { sum: 0, count: 0 };
      }
    }
  }

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const value = question.reversed ? 6 - answer.value : answer.value;
    const dim = question.dimension;
    if (totals[dim]) {
      totals[dim].sum += value;
      totals[dim].count += 1;
    }
    if (question.facet && facetTotals[dim]?.[question.facet]) {
      facetTotals[dim][question.facet].sum += value;
      facetTotals[dim][question.facet].count += 1;
    }
  }

  const dimensions: Record<string, number> = {};
  for (const dim of config.dimensions) {
    const { sum, count } = totals[dim.code];
    dimensions[dim.code] = count === 0 ? 0 : Math.round(((sum / count - 1) / 4) * 100);
  }

  const facets: Record<string, Record<string, number>> = {};
  for (const [dimCode, facetMap] of Object.entries(facetTotals)) {
    facets[dimCode] = {};
    for (const [facetCode, { sum, count }] of Object.entries(facetMap)) {
      facets[dimCode][facetCode] = count === 0 ? 0 : Math.round(((sum / count - 1) / 4) * 100);
    }
  }

  return { dimensions, facets };
}

// ============================================
// Public API
// ============================================

// Provenance-pecsét: a tárolt score-JSON azonosítja, melyik bankkal és
// motor-verzióval született — bank-csere/újrapontozás esetén enélkül nem
// lehetne eldönteni, mely sorok érintettek.
export const SCORING_BANK_VERSION = "tsfi-v2";
export const SCORING_ENGINE_VERSION = 1;
// Ennyi beadott item fölött a kitöltés a teljes bank ("full") — a pecsét
// és az örökség-sorok questionCount-heurisztikája ugyanehhez köt.
export const SCORING_FULL_FORM_MIN_ITEMS = 100;

export type ScoreResult = {
  type: "likert";
  dimensions: Record<string, number>;
  facets?: Record<string, Record<string, number>>;
  /** Örökség: a korábbi motor üres aspects-et tárolt — olvasáskor tolerált. */
  aspects?: Record<string, Record<string, number>>;
  // Provenance-mezők — a pecsét bevezetése előtt tárolt sorokban hiányoznak.
  form?: AssessmentForm;
  bankVersion?: string;
  engineVersion?: number;
};

export function calculateScores(
  testType: TestType,
  answers: LikertAnswer[]
): ScoreResult {
  const { dimensions, facets } = scoreLikert(testType, answers);
  return {
    type: "likert",
    dimensions,
    facets,
    // A beadott itemszám azonosítja a formát (60 = TSFI-S, 100 = teljes bank).
    form: answers.length >= SCORING_FULL_FORM_MIN_ITEMS ? "full" : "short",
    bankVersion: SCORING_BANK_VERSION,
    engineVersion: SCORING_ENGINE_VERSION,
  };
}

/**
 * Extracts dimension scores from a stored scores JSON, handling:
 * - Nested ScoreResult: { type: "likert", dimensions: { TEMP: 62, ... } }
 * - Flat format: { TEMP: 62, RESO: 45, ... }
 */
export function extractDimensionScores(
  scores: unknown
): Record<string, number> | null {
  if (!scores || typeof scores !== "object") return null;
  const obj = scores as Record<string, unknown>;
  if ("dimensions" in obj && obj.dimensions && typeof obj.dimensions === "object") {
    return obj.dimensions as Record<string, number>;
  }
  // Flat örökség-formátum: csak az ismert dim-kódok kerülnek vissza — a
  // tárolt JSON kísérő kulcsai (answers, questionCount, …) nem szivárognak.
  const flat: Record<string, number> = {};
  for (const code of TRITAN_ORDER) {
    const value = obj[code];
    if (typeof value === "number") flat[code] = value;
  }
  return Object.keys(flat).length > 0 ? flat : null;
}
