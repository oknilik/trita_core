import assert from "node:assert/strict";
import test from "node:test";
import { normalizeUserErrorCode, presentUserError } from "../../src/lib/user-errors";
import { commonTranslations } from "../../src/lib/i18n/common";

function commonTranslation(key: string): { hu?: string; en?: string } | null {
  let current: unknown = commonTranslations;
  for (const segment of key.split(".")) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[segment];
  }
  return current && typeof current === "object"
    ? (current as { hu?: string; en?: string })
    : null;
}

test("recognizes stable API error codes only", () => {
  assert.equal(normalizeUserErrorCode("RATE_LIMITED"), "RATE_LIMITED");
  assert.equal(normalizeUserErrorCode("Database connection failed"), null);
  assert.equal(normalizeUserErrorCode("internal_error"), null);
  assert.equal(normalizeUserErrorCode({ message: "SECRET" }), null);
});

test("maps known codes and HTTP statuses to shared translation keys", () => {
  assert.equal(presentUserError({ code: "RATE_LIMITED" }), "userErrors.rateLimited");
  assert.equal(
    presentUserError({ code: "CAMPAIGN_MINIMUM_PARTICIPANTS_NOT_MET" }),
    "userErrors.campaignMinimumParticipants",
  );
  assert.equal(presentUserError({ status: 401 }), "userErrors.sessionExpired");
  assert.equal(presentUserError({ status: 503 }), "userErrors.temporary");
});

test("allows a flow-specific message without exposing unknown server text", () => {
  assert.equal(
    presentUserError({
      code: "ACTIVATE_FAILED",
      overrides: { ACTIVATE_FAILED: "campaignWiz.activateFailed" },
    }),
    "campaignWiz.activateFailed",
  );
  assert.equal(
    presentUserError({
      code: "Prisma timeout at db.internal",
      fallbackKey: "userErrors.saveFailed",
    }),
    "userErrors.saveFailed",
  );
});

test("every shared presentation key has Hungarian and English copy", () => {
  const cases = [
    { code: "UNAUTHORIZED" },
    { code: "FORBIDDEN" },
    { code: "NOT_FOUND" },
    { code: "INVALID_INPUT" },
    { code: "CONFLICT" },
    { code: "RATE_LIMITED" },
    { code: "NETWORK_ERROR" },
    { code: "LOAD_FAILED" },
    { code: "SAVE_FAILED" },
    { code: "SEND_FAILED" },
    { code: "EMAIL_MISSING" },
    { code: "INVITATION_NOT_PENDING" },
    { code: "INVITATION_EXPIRED" },
    { code: "ASSESSMENT_ALREADY_COMPLETED" },
    { code: "CAMPAIGN_MINIMUM_PARTICIPANTS_NOT_MET" },
    { status: 503 },
    {},
  ];

  for (const entry of cases) {
    const key = presentUserError(entry);
    const copy = commonTranslation(key);
    assert.ok(copy?.hu, `Missing Hungarian copy for ${key}`);
    assert.ok(copy?.en, `Missing English copy for ${key}`);
  }
});
