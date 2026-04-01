export interface AssessmentProgressState {
  questionIds: number[];
  totalQuestions: number;
  questionIndex: number;
  answers: Record<number, number>;
  answeredCount: number;
  progress: number;
}

export type AssessmentProgressAction =
  | { type: "NEXT" }
  | { type: "BACK" }
  | { type: "ANSWER"; questionId: number; value: number };

interface CreateAssessmentProgressStateOptions {
  questionIds: number[];
  initialAnswers?: Record<number, number>;
  initialQuestionIndex?: number;
}

function sanitizeQuestionIds(questionIds: number[]): number[] {
  const seen = new Set<number>();
  const sanitized: number[] = [];
  for (const id of questionIds) {
    if (!Number.isInteger(id) || id <= 0) continue;
    if (seen.has(id)) continue;
    seen.add(id);
    sanitized.push(id);
  }
  return sanitized;
}

function sanitizeAnswers(
  answers: Record<number, number> | undefined,
  allowedQuestionIds: Set<number>,
): Record<number, number> {
  if (!answers) return {};

  const sanitized: Record<number, number> = {};
  for (const [questionIdRaw, valueRaw] of Object.entries(answers)) {
    const questionId = Number(questionIdRaw);
    if (!Number.isInteger(questionId) || !allowedQuestionIds.has(questionId)) continue;
    if (!Number.isInteger(valueRaw) || valueRaw < 1 || valueRaw > 5) continue;
    sanitized[questionId] = valueRaw;
  }
  return sanitized;
}

export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

function clampQuestionIndex(value: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  const numeric = Number.isFinite(value) ? Math.trunc(value) : 0;
  return Math.min(Math.max(numeric, 0), totalQuestions - 1);
}

function computeProgress(answeredCount: number, totalQuestions: number): number {
  if (totalQuestions <= 0) return 0;
  return clampProgress((answeredCount / totalQuestions) * 100);
}

export function createAssessmentProgressState(
  options: CreateAssessmentProgressStateOptions,
): AssessmentProgressState {
  const questionIds = sanitizeQuestionIds(options.questionIds);
  const totalQuestions = questionIds.length;
  const questionIdSet = new Set(questionIds);
  const answers = sanitizeAnswers(options.initialAnswers, questionIdSet);
  const answeredCount = Object.keys(answers).length;

  return {
    questionIds,
    totalQuestions,
    questionIndex: clampQuestionIndex(options.initialQuestionIndex ?? 0, totalQuestions),
    answers,
    answeredCount,
    progress: computeProgress(answeredCount, totalQuestions),
  };
}

export function assessmentProgressReducer(
  state: AssessmentProgressState,
  action: AssessmentProgressAction,
): AssessmentProgressState {
  if (state.totalQuestions <= 0) return state;

  switch (action.type) {
    case "NEXT": {
      const nextIndex = clampQuestionIndex(state.questionIndex + 1, state.totalQuestions);
      if (nextIndex === state.questionIndex) return state;
      return {
        ...state,
        questionIndex: nextIndex,
      };
    }

    case "BACK": {
      const nextIndex = clampQuestionIndex(state.questionIndex - 1, state.totalQuestions);
      if (nextIndex === state.questionIndex) return state;
      return {
        ...state,
        questionIndex: nextIndex,
      };
    }

    case "ANSWER": {
      if (!state.questionIds.includes(action.questionId)) return state;
      if (!Number.isInteger(action.value) || action.value < 1 || action.value > 5) return state;

      const previousValue = state.answers[action.questionId];
      if (previousValue === action.value) return state;

      const nextAnswers = {
        ...state.answers,
        [action.questionId]: action.value,
      };
      const nextAnsweredCount =
        previousValue === undefined ? state.answeredCount + 1 : state.answeredCount;

      return {
        ...state,
        answers: nextAnswers,
        answeredCount: nextAnsweredCount,
        progress: computeProgress(nextAnsweredCount, state.totalQuestions),
      };
    }
  }
}

export interface AssessmentProgressMeta {
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoBack: boolean;
  canGoNext: boolean;
}

export function getAssessmentProgressMeta(
  state: AssessmentProgressState,
): AssessmentProgressMeta {
  const isFirstStep = state.questionIndex <= 0;
  const isLastStep = state.questionIndex >= Math.max(state.totalQuestions - 1, 0);
  return {
    isFirstStep,
    isLastStep,
    canGoBack: !isFirstStep,
    canGoNext: !isLastStep,
  };
}
