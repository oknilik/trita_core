import type { TestType } from "@prisma/client";
import {
  getTestConfig,
  isMBTIQuestion,
  isLikertQuestion,
  type LikertQuestion,
  type MBTIQuestion,
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
// MBTI scoring
// ============================================

interface MBTIAnswer {
  questionId: number;
  value: string; // "A" or "B"
}

interface MBTIScores {
  dichotomies: Record<string, number>; // percentage toward first pole (E, S, T, J)
  typeCode: string; // e.g., "INTJ"
}

function scoreMBTI(answers: MBTIAnswer[]): MBTIScores {
  const config = getTestConfig("MBTI");
  const questions = config.questions.filter(isMBTIQuestion) as MBTIQuestion[];
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const counts: Record<string, { first: number; total: number }> = {
    EI: { first: 0, total: 0 },
    SN: { first: 0, total: 0 },
    TF: { first: 0, total: 0 },
    JP: { first: 0, total: 0 },
  };

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    counts[question.dichotomy].total += 1;
    if (answer.value === "A") {
      counts[question.dichotomy].first += 1;
    }
  }

  const dichotomies: Record<string, number> = {};
  let typeCode = "";

  const poles: [string, string, string][] = [
    ["EI", "E", "I"],
    ["SN", "S", "N"],
    ["TF", "T", "F"],
    ["JP", "J", "P"],
  ];

  for (const [key, firstPole, secondPole] of poles) {
    const { first, total } = counts[key];
    if (total === 0) {
      dichotomies[key] = 50;
      typeCode += "?";
      continue;
    }
    const pct = Math.round((first / total) * 100);
    dichotomies[key] = pct;
    typeCode += pct >= 50 ? firstPole : secondPole;
  }

  return { dichotomies, typeCode };
}

// ============================================
// Public API
// ============================================

export type ScoreResult =
  | { type: "likert"; dimensions: Record<string, number> }
  | { type: "mbti"; dichotomies: Record<string, number>; typeCode: string };

export function calculateScores(
  testType: TestType,
  answers: LikertAnswer[] | MBTIAnswer[]
): ScoreResult {
  if (testType === "MBTI") {
    const mbtiResult = scoreMBTI(answers as MBTIAnswer[]);
    return {
      type: "mbti",
      dichotomies: mbtiResult.dichotomies,
      typeCode: mbtiResult.typeCode,
    };
  }

  const dimensions = scoreLikert(testType, answers as LikertAnswer[]);
  return { type: "likert", dimensions };
}
