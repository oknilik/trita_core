import test from "node:test";
import assert from "node:assert/strict";
import {
  clearAssessmentDraftFromStorage,
  getAssessmentDraftKey,
  hasAssessmentDraftInStorage,
  readAssessmentDraftFromStorage,
  writeAssessmentDraftToStorage,
} from "@/lib/assessment-draft";
import { installBrowserLocalStorageMock } from "../../helpers/local-storage-mock";

const TEST_TYPE = "TRITAN";
const DRAFT_KEY = getAssessmentDraftKey(TEST_TYPE);

test("atomic write: older revision cannot overwrite newer snapshot", () => {
  const { localStorage, restore } = installBrowserLocalStorageMock();
  try {
    writeAssessmentDraftToStorage({
      testType: TEST_TYPE,
      answers: { 1: 5 },
      questionIndex: 0,
      questionIds: [1, 2],
      totalQuestions: 2,
      revision: 2,
    });

    writeAssessmentDraftToStorage({
      testType: TEST_TYPE,
      answers: { 1: 5, 2: 4 },
      questionIndex: 1,
      questionIds: [1, 2],
      totalQuestions: 2,
      revision: 1,
    });

    const snapshot = readAssessmentDraftFromStorage({
      testType: TEST_TYPE,
      questionIds: [1, 2],
      totalQuestions: 2,
    });

    assert.ok(snapshot);
    assert.deepEqual(snapshot.answers, { 1: 5 });
    assert.equal(snapshot.revision, 2);
    assert.equal(localStorage.getSetItemCallCount(), 1);
  } finally {
    restore();
  }
});

test("overwrite works for same or newer revision", () => {
  const { localStorage, restore } = installBrowserLocalStorageMock();
  try {
    writeAssessmentDraftToStorage({
      testType: TEST_TYPE,
      answers: { 1: 2 },
      questionIndex: 0,
      questionIds: [1, 2],
      totalQuestions: 2,
      revision: 3,
    });

    writeAssessmentDraftToStorage({
      testType: TEST_TYPE,
      answers: { 1: 2, 2: 4 },
      questionIndex: 1,
      questionIds: [1, 2],
      totalQuestions: 2,
      revision: 3,
    });

    const snapshot = readAssessmentDraftFromStorage({
      testType: TEST_TYPE,
      questionIds: [1, 2],
      totalQuestions: 2,
    });

    assert.ok(snapshot);
    assert.deepEqual(snapshot.answers, { 1: 2, 2: 4 });
    assert.equal(snapshot.questionIndex, 1);
    assert.equal(localStorage.getSetItemCallCount(), 2);
  } finally {
    restore();
  }
});

test("version mismatch fallback keeps recoverable payload", () => {
  const { restore } = installBrowserLocalStorageMock({
    [DRAFT_KEY]: JSON.stringify({
      version: 999,
      answers: { 1: 3, 2: 5 },
      questionIndex: 999,
      revision: 7,
      updatedAt: 123,
    }),
  });

  try {
    const snapshot = readAssessmentDraftFromStorage({
      testType: TEST_TYPE,
      questionIds: [1, 2],
      totalQuestions: 2,
    });

    assert.ok(snapshot);
    assert.deepEqual(snapshot.answers, { 1: 3, 2: 5 });
    assert.equal(snapshot.questionIndex, 1);
    assert.equal(snapshot.revision, 7);
  } finally {
    restore();
  }
});

test("corrupted payload fallback returns null", () => {
  const { restore } = installBrowserLocalStorageMock({
    [DRAFT_KEY]: JSON.stringify({ answers: [] }),
  });
  try {
    const snapshot = readAssessmentDraftFromStorage({ testType: TEST_TYPE });
    assert.equal(snapshot, null);
  } finally {
    restore();
  }
});

test("missing key fallback returns null", () => {
  const { restore } = installBrowserLocalStorageMock();
  try {
    const snapshot = readAssessmentDraftFromStorage({ testType: TEST_TYPE });
    assert.equal(snapshot, null);
  } finally {
    restore();
  }
});

test("invalid JSON fallback returns null", () => {
  const { restore } = installBrowserLocalStorageMock({
    [DRAFT_KEY]: "{invalid-json",
  });
  try {
    const snapshot = readAssessmentDraftFromStorage({ testType: TEST_TYPE });
    assert.equal(snapshot, null);
  } finally {
    restore();
  }
});

test("partial payload recovery keeps only valid answers and clamps index", () => {
  const { restore } = installBrowserLocalStorageMock({
    [DRAFT_KEY]: JSON.stringify({
      answers: {
        1: 2,
        2: 7,
        3: 4,
        abc: 5,
      },
      questionIndex: -10,
      revision: "not-a-number",
      updatedAt: "also-not-a-number",
    }),
  });
  try {
    const snapshot = readAssessmentDraftFromStorage({
      testType: TEST_TYPE,
      questionIds: [1, 2, 3],
      totalQuestions: 3,
    });

    assert.ok(snapshot);
    assert.deepEqual(snapshot.answers, { 1: 2, 3: 4 });
    assert.equal(snapshot.questionIndex, 0);
    assert.equal(snapshot.revision, 0);
    assert.equal(snapshot.updatedAt, 0);
  } finally {
    restore();
  }
});

test("stale draft is still readable (no expiration policy configured)", () => {
  const { restore } = installBrowserLocalStorageMock({
    [DRAFT_KEY]: JSON.stringify({
      version: 2,
      answers: { 1: 4 },
      questionIndex: 0,
      revision: 1,
      updatedAt: 1,
    }),
  });

  try {
    const snapshot = readAssessmentDraftFromStorage({
      testType: TEST_TYPE,
      questionIds: [1, 2],
      totalQuestions: 2,
    });
    assert.ok(snapshot);
    assert.equal(snapshot.updatedAt, 1);
  } finally {
    restore();
  }
});

test("has/clear helpers never leave silent stale state", () => {
  const { localStorage, restore } = installBrowserLocalStorageMock();
  try {
    assert.equal(hasAssessmentDraftInStorage(TEST_TYPE), false);

    writeAssessmentDraftToStorage({
      testType: TEST_TYPE,
      answers: { 1: 3 },
      questionIndex: 0,
      questionIds: [1, 2],
      totalQuestions: 2,
      revision: 1,
    });
    assert.equal(hasAssessmentDraftInStorage(TEST_TYPE), true);

    clearAssessmentDraftFromStorage(TEST_TYPE);
    assert.equal(localStorage.getRemoveItemCallCount(), 1);
    assert.equal(hasAssessmentDraftInStorage(TEST_TYPE), false);
  } finally {
    restore();
  }
});
