/**
 * H1 — Notification policy unit tests
 *
 * Tests the recipient policy logic: role hierarchy, personal vs org types.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { isPersonalNotificationType } from "@/lib/notifications/policy";

// ── Personal vs org notification types ──────────────────────────────────────

test("H1.9: personal notification types are correctly identified", () => {
  const personalTypes = [
    "OBSERVER_COMPLETED",
    "OBSERVER_SUBMITTED",
    "RESULT_READY",
    "PURCHASE_CONFIRMED",
    "ORG_INVITE_RECEIVED",
  ] as const;

  for (const type of personalTypes) {
    assert.equal(
      isPersonalNotificationType(type),
      true,
      `${type} should be personal`,
    );
  }
});

test("H1.10: org notification types are correctly identified", () => {
  const orgTypes = [
    "PAYMENT_FAILED",
    "SUBSCRIPTION_FROZEN",
    "TRIAL_ENDING_SOON",
    "TRIAL_EXPIRED",
    "LOW_CANDIDATE_CREDITS",
    "ORG_INVITE_ACCEPTED",
    "MEMBER_COMPLETED_ASSESSMENT",
    "CAMPAIGN_MILESTONE",
    "CAMPAIGN_LAUNCHED",
    "CAMPAIGN_CLOSED",
    "TEAM_MEMBER_ADDED",
  ] as const;

  for (const type of orgTypes) {
    assert.equal(
      isPersonalNotificationType(type),
      false,
      `${type} should be org-wide (not personal)`,
    );
  }
});
