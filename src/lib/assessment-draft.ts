export const ASSESSMENT_DRAFT_STORAGE_PREFIX = "trita_draft_";

export interface AssessmentDraftSnapshot {
  answers: Record<number, number>;
  questionIndex: number;
  revision: number;
  updatedAt: number;
}

interface ParseOptions {
  questionIds?: Iterable<number>;
  totalQuestions?: number;
}

interface WriteOptions extends ParseOptions {
  testType: string;
  scope?: string;
  answers: Record<number, number>;
  questionIndex: number;
  revision?: number;
}

interface ReadOptions extends ParseOptions {
  testType: string;
  scope?: string;
}

function getStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function toObject(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function clampQuestionIndex(value: unknown, totalQuestions?: number): number {
  const numeric = typeof value === "number" ? value : Number(value);
  const safeNumeric = Number.isFinite(numeric) ? Math.trunc(numeric) : 0;
  const maxIndex =
    typeof totalQuestions === "number" && totalQuestions > 0
      ? totalQuestions - 1
      : Number.MAX_SAFE_INTEGER;
  return Math.min(Math.max(safeNumeric, 0), maxIndex);
}

function normalizeAnswers(
  input: unknown,
  questionIds?: Iterable<number>,
): Record<number, number> {
  const source = toObject(input);
  if (!source) return {};

  const allowed = questionIds ? new Set(questionIds) : null;
  const answers: Record<number, number> = {};
  for (const [questionIdRaw, valueRaw] of Object.entries(source)) {
    const questionId = Number(questionIdRaw);
    if (!Number.isInteger(questionId) || questionId <= 0) continue;
    if (allowed && !allowed.has(questionId)) continue;

    const value = Number(valueRaw);
    if (!Number.isInteger(value) || value < 1 || value > 5) continue;
    answers[questionId] = value;
  }
  return answers;
}

function parseSnapshot(raw: string, options: ParseOptions): AssessmentDraftSnapshot | null {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }

  const parsedObject = toObject(parsed);
  if (!parsedObject) return null;
  const rawAnswers = toObject(parsedObject.answers) ?? parsedObject;
  const answers = normalizeAnswers(rawAnswers, options.questionIds);
  if (Object.keys(answers).length === 0) return null;

  const questionIndex = clampQuestionIndex(
    parsedObject.questionIndex ?? parsedObject.currentPage ?? 0,
    options.totalQuestions,
  );
  const revisionRaw = Number(parsedObject.revision);
  const updatedAtRaw = Number(parsedObject.updatedAt);

  return {
    answers,
    questionIndex,
    revision: Number.isFinite(revisionRaw) ? Math.max(Math.trunc(revisionRaw), 0) : 0,
    updatedAt: Number.isFinite(updatedAtRaw) ? Math.max(Math.trunc(updatedAtRaw), 0) : 0,
  };
}

/**
 * Draft-kulcs: vendégnél a régi, scope nélküli kulcs (a /try, a landing
 * CTA-k és a claim-flow változatlanul működik) — bejelentkezett usernél
 * a profil-id-val scope-olt kulcs, hogy kijelentkezés után a vendég-flow
 * (vagy egy másik user) ne örökölje a válaszokat.
 */
export function getAssessmentDraftKey(testType: string, scope?: string): string {
  return scope
    ? `${ASSESSMENT_DRAFT_STORAGE_PREFIX}${testType}__u_${scope}`
    : `${ASSESSMENT_DRAFT_STORAGE_PREFIX}${testType}`;
}

export function readAssessmentDraftFromStorage(
  options: ReadOptions,
): AssessmentDraftSnapshot | null {
  const storage = getStorage();
  if (!storage) return null;
  const raw = storage.getItem(getAssessmentDraftKey(options.testType, options.scope));
  if (!raw) return null;
  return parseSnapshot(raw, options);
}

export function writeAssessmentDraftToStorage(options: WriteOptions): void {
  const storage = getStorage();
  if (!storage) return;

  const key = getAssessmentDraftKey(options.testType, options.scope);
  const revision = options.revision ?? 0;

  const existingRaw = storage.getItem(key);
  if (existingRaw) {
    const existing = parseSnapshot(existingRaw, {
      totalQuestions: options.totalQuestions,
      questionIds: options.questionIds,
    });
    if (existing && existing.revision > revision) return;
  }

  const snapshot = {
    version: 2,
    answers: normalizeAnswers(options.answers, options.questionIds),
    questionIndex: clampQuestionIndex(options.questionIndex, options.totalQuestions),
    revision,
    updatedAt: Date.now(),
  };
  if (Object.keys(snapshot.answers).length === 0) {
    storage.removeItem(key);
    return;
  }
  storage.setItem(key, JSON.stringify(snapshot));
}

export function clearAssessmentDraftFromStorage(testType: string, scope?: string): void {
  const storage = getStorage();
  if (!storage) return;
  storage.removeItem(getAssessmentDraftKey(testType, scope));
}

export function hasAssessmentDraftInStorage(testType: string, scope?: string): boolean {
  // UX-A19: a scope eddig némán elveszett — a belépett user scoped draftja
  // sosem volt detektálható, és egy stale vendég-draft rossz CTA-t vezérelt.
  return readAssessmentDraftFromStorage({ testType, scope }) !== null;
}

export function getResumeQuestionIndex(
  orderedQuestionIds: number[],
  answers: Record<number, number>,
): number {
  if (orderedQuestionIds.length === 0) return 0;
  const firstUnanswered = orderedQuestionIds.findIndex((questionId) => answers[questionId] === undefined);
  if (firstUnanswered !== -1) return firstUnanswered;
  return orderedQuestionIds.length - 1;
}

export function toAssessmentAnswerPayload(answers: Record<number, number>) {
  return Object.entries(answers)
    .map(([questionId, value]) => ({
      questionId: Number(questionId),
      value,
    }))
    .filter((entry) => Number.isInteger(entry.questionId))
    .sort((a, b) => a.questionId - b.questionId);
}
