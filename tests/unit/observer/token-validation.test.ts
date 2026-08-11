import test from "node:test";
import assert from "node:assert/strict";
import {
  isObserverAssociationMismatch,
  isObserverSelfSubmission,
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

test("resolveObserverTokenLifecycle treats AWAITING_APPROVAL as a distinct non-active state", () => {
  // C2: a jóváhagyásra váró meghívó NEM „active" — a beküldés-oldal ezt
  // 403-mal (INVITE_NOT_APPROVED) elutasítja, nem fogadja el kitöltésként.
  assert.equal(
    resolveObserverTokenLifecycle(
      { status: "AWAITING_APPROVAL", expiresAt: new Date("2026-04-15T10:00:00.000Z") },
      NOW,
    ),
    "awaiting_approval",
  );
  // A lejárat továbbra is „nyer": lejárt awaiting meghívó → expired.
  assert.equal(
    resolveObserverTokenLifecycle(
      { status: "AWAITING_APPROVAL", expiresAt: new Date("2026-03-15T10:00:00.000Z") },
      NOW,
    ),
    "expired",
  );
});

test("toObserverTokenErrorCode maps lifecycle states to API-safe error codes", () => {
  assert.equal(toObserverTokenErrorCode("invalid_token"), "INVALID_TOKEN");
  assert.equal(toObserverTokenErrorCode("completed"), "ALREADY_USED");
  assert.equal(toObserverTokenErrorCode("canceled"), "INVITE_CANCELED");
  assert.equal(toObserverTokenErrorCode("awaiting_approval"), "INVITE_NOT_APPROVED");
  assert.equal(toObserverTokenErrorCode("expired"), "INVITE_EXPIRED");
});

test("isObserverSelfSubmission blocks the inviter from submitting to their own invite", () => {
  // C3: minden observer-típusnál — a külső/link-meghívónál is (nincs
  // observerProfileId, így az addressee-ellenőrzés önmagában nem fogná meg).
  assert.equal(isObserverSelfSubmission("inviter_a", "inviter_a"), true);
  assert.equal(isObserverSelfSubmission("observer_b", "inviter_a"), false);
  // Nem bejelentkezett (anonim külső) beküldő → nincs önhamisítás.
  assert.equal(isObserverSelfSubmission(null, "inviter_a"), false);
  assert.equal(isObserverSelfSubmission(undefined, "inviter_a"), false);
});

test("isObserverAssociationMismatch enforces wrong target detection", () => {
  assert.equal(isObserverAssociationMismatch(null, "profile_a"), false);
  assert.equal(isObserverAssociationMismatch(undefined, "profile_a"), false);
  assert.equal(isObserverAssociationMismatch("profile_a", "profile_a"), false);
  assert.equal(isObserverAssociationMismatch("profile_a", "profile_b"), true);
});
