import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  resolveCompareInviteState,
  compareInviteExpiry,
  COMPARE_INVITE_TTL_DAYS,
} from "@/lib/compare-invite";

const NOW = new Date("2026-08-04T12:00:00Z");
const FUTURE = new Date("2026-08-20T12:00:00Z");
const PAST = new Date("2026-08-01T12:00:00Z");

describe("resolveCompareInviteState — lusta lejárat", () => {
  it("PENDING + jövőbeli lejárat → PENDING", () => {
    assert.equal(
      resolveCompareInviteState({ status: "PENDING", expiresAt: FUTURE }, NOW),
      "PENDING",
    );
  });

  it("PENDING + múltbeli lejárat → EXPIRED (írás nélkül)", () => {
    assert.equal(
      resolveCompareInviteState({ status: "PENDING", expiresAt: PAST }, NOW),
      "EXPIRED",
    );
  });

  it("REVOKED mindent felülír, lejárattól függetlenül", () => {
    assert.equal(
      resolveCompareInviteState({ status: "REVOKED", expiresAt: FUTURE }, NOW),
      "REVOKED",
    );
    assert.equal(
      resolveCompareInviteState({ status: "REVOKED", expiresAt: PAST }, NOW),
      "REVOKED",
    );
  });

  it("ACCEPTED párra a lejárat nem vonatkozik", () => {
    assert.equal(
      resolveCompareInviteState({ status: "ACCEPTED", expiresAt: PAST }, NOW),
      "ACCEPTED",
    );
  });
});

describe("compareInviteExpiry", () => {
  it("a TTL-nek megfelelő jövőbeli időpontot ad", () => {
    const expiry = compareInviteExpiry(NOW);
    const expectedMs = NOW.getTime() + COMPARE_INVITE_TTL_DAYS * 24 * 60 * 60 * 1000;
    assert.equal(expiry.getTime(), expectedMs);
  });
});
