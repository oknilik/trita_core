import assert from "node:assert/strict";
import test from "node:test";
import { presentAuthError } from "../../src/lib/auth-errors";

function clerkError(code: string, options: { status?: number; paramName?: string } = {}) {
  return {
    status: options.status ?? 422,
    errors: [
      {
        code,
        message: "Technical provider message that must never reach the UI",
        longMessage: "Long technical provider message that must never reach the UI",
        meta: options.paramName ? { paramName: options.paramName } : undefined,
      },
    ],
  };
}

test("maps identifier failures to the email field", () => {
  assert.deepEqual(
    presentAuthError(clerkError("form_identifier_not_found"), "sign-in"),
    { target: "email", translationKey: "auth.errors.accountUnavailable" },
  );
  assert.deepEqual(
    presentAuthError(clerkError("form_identifier_exists"), "sign-up"),
    { target: "email", translationKey: "auth.errors.emailExists" },
  );
  assert.deepEqual(
    presentAuthError(
      clerkError("form_param_format_invalid", { paramName: "email_address" }),
      "sign-up",
    ),
    { target: "email", translationKey: "auth.errors.invalidEmail" },
  );
});

test("maps verification failures to the code field", () => {
  assert.deepEqual(
    presentAuthError(clerkError("form_code_incorrect"), "verify"),
    { target: "code", translationKey: "auth.errors.incorrectCode" },
  );
  assert.deepEqual(
    presentAuthError(clerkError("form_code_expired"), "verify"),
    { target: "code", translationKey: "auth.errors.expiredCode" },
  );
});

test("maps recoverable system failures to global messages", () => {
  assert.deepEqual(
    presentAuthError(clerkError("too_many_requests", { status: 429 }), "sign-in"),
    { target: "global", translationKey: "auth.errors.rateLimited" },
  );
  assert.deepEqual(
    presentAuthError({ name: "TypeError" }, "google-sign-in"),
    { target: "global", translationKey: "auth.errors.network" },
  );
  assert.deepEqual(
    presentAuthError(clerkError("captcha_invalid"), "sign-up"),
    { target: "global", translationKey: "auth.errors.captcha" },
  );
});

test("uses a localized context fallback without exposing provider text", () => {
  const result = presentAuthError(clerkError("unexpected_provider_failure"), "google-sign-up");
  assert.deepEqual(result, {
    target: "global",
    translationKey: "auth.errors.googleSignUp",
  });
  assert.equal("message" in result, false);
  assert.equal("longMessage" in result, false);
});
