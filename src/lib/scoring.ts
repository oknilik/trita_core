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

function scoreLikert(
  testType: TestType,
  answers: LikertAnswer[]
): Record<string, number> {
  const config = getTestConfig(testType);
  const questions = config.questions.filter(isLikertQuestion) as LikertQuestion[];
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const totals: Record<string, { sum: number; count: number }> = {};
  for (const dim of config.dimensions) {
    totals[dim.code] = { sum: 0, count: 0 };
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
  }

  const scores: Record<string, number> = {};
  for (const dim of config.dimensions) {
    const { sum, count } = totals[dim.code];
    if (count === 0) {
      scores[dim.code] = 0;
      continue;
    }
    scores[dim.code] = Math.round((sum / count / 5) * 100);
  }

  return scores;
}

// ============================================
// Public API
// ============================================

export type ScoreResult =
  | { type: "likert"; dimensions: Record<string, number> };

export function calculateScores(
  testType: TestType,
  answers: LikertAnswer[]
): ScoreResult {
  const dimensions = scoreLikert(testType, answers);
  return { type: "likert", dimensions };
}
