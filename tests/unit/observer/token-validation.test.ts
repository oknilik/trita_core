import test from "node:test";
import assert from "node:assert/strict";
import {
  isObserverAssociationMismatch,
  resolveObserverTokenLifecycle,
  toObserverTokenErrorCode,
} from "@/lib/observer/token-validation";

const NOW = new Date("2026-04-01T10:00:00.000Z");

test("resolveObserverTokenLifecycle classifies token states", () => {
  assert.equal(resolveObserverTokenLifecycle(null, NOW), "invalid_token");
  assert.equal(
    resolveObserverTokenLifecycle(
      { status: "PENDING", expiresAt: new Date("2026-04-15T10:00:00.000Z") },
      NOW,
    ),
    "active",
  );
  assert.equal(
    resolveObserverTokenLifecycle(
      { status: "COMPLETED", expiresAt: new Date("2026-04-15T10:00:00.000Z") },
      NOW,
    ),
    "completed",
  );
  assert.equal(
    resolveObserverTokenLifecycle(
      { status: "CANCELED", expiresAt: new Date("2026-04-15T10:00:00.000Z") },
      NOW,
    ),
    "canceled",
  );
  assert.equal(
    resolveObserverTokenLifecycle(
      { status: "EXPIRED", expiresAt: new Date("2026-04-15T10:00:00.000Z") },
      NOW,
    ),
    "expired",
  );
  assert.equal(
    resolveObserverTokenLifecycle(
      { status: "PENDING", expiresAt: new Date("2026-03-15T10:00:00.000Z") },
      NOW,
    ),
    "expired",
  );
});

test("toObserverTokenErrorCode maps lifecycle states to API-safe error codes", () => {
  assert.equal(toObserverTokenErrorCode("invalid_token"), "INVALID_TOKEN");
  assert.equal(toObserverTokenErrorCode("completed"), "ALREADY_USED");
  assert.equal(toObserverTokenErrorCode("canceled"), "INVITE_CANCELED");
  assert.equal(toObserverTokenErrorCode("expired"), "INVITE_EXPIRED");
});

test("isObserverAssociationMismatch enforces wrong target detection", () => {
  assert.equal(isObserverAssociationMismatch(null, "profile_a"), false);
  assert.equal(isObserverAssociationMismatch(undefined, "profile_a"), false);
  assert.equal(isObserverAssociationMismatch("profile_a", "profile_a"), false);
  assert.equal(isObserverAssociationMismatch("profile_a", "profile_b"), true);
});
