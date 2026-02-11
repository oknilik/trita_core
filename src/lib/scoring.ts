import type { TestType } from "@prisma/client";
import {
  getTestConfig,
  isLikertQuestion,
  type LikertQuestion,
} from "./questions";

// ============================================
// Likert scoring (HEXACO, HEXACO_MODIFIED, BIG_FIVE)
// ============================================

interface LikertAnswer {
  questionId: number;
  value: number; // 1-5
}

interface LikertScores {
  dimensions: Record<string, number>;
  facets: Record<string, Record<string, number>>;
  aspects: Record<string, Record<string, number>>;
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
  const aspectTotals: Record<string, Record<string, { sum: number; count: number }>> = {};

  for (const dim of config.dimensions) {
    totals[dim.code] = { sum: 0, count: 0 };
    if (dim.facets?.length) {
      facetTotals[dim.code] = {};
      for (const f of dim.facets) {
        facetTotals[dim.code][f.code] = { sum: 0, count: 0 };
      }
    }
    if (dim.aspects?.length) {
      aspectTotals[dim.code] = {};
      for (const a of dim.aspects) {
        aspectTotals[dim.code][a.code] = { sum: 0, count: 0 };
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
    if (question.aspect && aspectTotals[dim]?.[question.aspect]) {
      aspectTotals[dim][question.aspect].sum += value;
      aspectTotals[dim][question.aspect].count += 1;
    }
  }

  const dimensions: Record<string, number> = {};
  for (const dim of config.dimensions) {
    const { sum, count } = totals[dim.code];
    dimensions[dim.code] = count === 0 ? 0 : Math.round((sum / count / 5) * 100);
  }

  const facets: Record<string, Record<string, number>> = {};
  for (const [dimCode, facetMap] of Object.entries(facetTotals)) {
    facets[dimCode] = {};
    for (const [facetCode, { sum, count }] of Object.entries(facetMap)) {
      facets[dimCode][facetCode] = count === 0 ? 0 : Math.round((sum / count / 5) * 100);
    }
  }

  const aspects: Record<string, Record<string, number>> = {};
  for (const [dimCode, aspectMap] of Object.entries(aspectTotals)) {
    aspects[dimCode] = {};
    for (const [aspectCode, { sum, count }] of Object.entries(aspectMap)) {
      aspects[dimCode][aspectCode] = count === 0 ? 0 : Math.round((sum / count / 5) * 100);
    }
  }

  return { dimensions, facets, aspects };
}

// ============================================
// Public API
// ============================================

export type ScoreResult = {
  type: "likert";
  dimensions: Record<string, number>;
  facets?: Record<string, Record<string, number>>;
  aspects?: Record<string, Record<string, number>>;
};

export function calculateScores(
  testType: TestType,
  answers: LikertAnswer[]
): ScoreResult {
  const { dimensions, facets, aspects } = scoreLikert(testType, answers);
  return { type: "likert", dimensions, facets, aspects };
}
