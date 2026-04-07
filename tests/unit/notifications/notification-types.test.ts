/**
 * H1 — Notification type registry and policy unit tests
 *
 * Tests the pure domain logic: type metadata, category/priority mapping,
 * role hierarchy, and dedupeKey conventions.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  NOTIFICATION_TYPE_META,
  type NotificationCategory,
  type NotificationPriority,
} from "@/lib/notifications/types";

// ── Type metadata completeness ──────────────────────────────────────────────

const ALL_TYPES = [
  "OBSERVER_COMPLETED",
  "RESULT_READY",
  "PURCHASE_CONFIRMED",
  "ORG_INVITE_RECEIVED",
  "CAMPAIGN_LAUNCHED",
  "CAMPAIGN_CLOSED",
  "TEAM_MEMBER_ADDED",
  "ORG_INVITE_ACCEPTED",
  "TRIAL_ENDING_SOON",
  "TRIAL_EXPIRED",
  "PAYMENT_FAILED",
  "SUBSCRIPTION_FROZEN",
  "LOW_CANDIDATE_CREDITS",
  "MEMBER_COMPLETED_ASSESSMENT",
  "CAMPAIGN_MILESTONE",
] as const;

test("H1.1: every NotificationType has metadata entry", () => {
  for (const type of ALL_TYPES) {
    const meta = NOTIFICATION_TYPE_META[type];
    assert.ok(meta, `Missing metadata for type: ${type}`);
    assert.ok(meta.titleKey, `Missing titleKey for type: ${type}`);
    assert.ok(meta.bodyKey, `Missing bodyKey for type: ${type}`);
    assert.ok(meta.category, `Missing category for type: ${type}`);
    assert.ok(meta.defaultPriority, `Missing defaultPriority for type: ${type}`);
  }
});

test("H1.2: all categories are valid", () => {
  const validCategories: NotificationCategory[] = [
    "assessment", "observer", "org", "campaign", "billing", "system",
  ];
  for (const type of ALL_TYPES) {
    const meta = NOTIFICATION_TYPE_META[type];
    assert.ok(
      validCategories.includes(meta.category),
      `Invalid category "${meta.category}" for type: ${type}`,
    );
  }
});

test("H1.3: all priorities are valid", () => {
  const validPriorities: NotificationPriority[] = ["low", "normal", "high"];
  for (const type of ALL_TYPES) {
    const meta = NOTIFICATION_TYPE_META[type];
    assert.ok(
      validPriorities.includes(meta.defaultPriority),
      `Invalid priority "${meta.defaultPriority}" for type: ${type}`,
    );
  }
});

test("H1.4: billing types have high priority", () => {
  const billingHighPriority = [
    "PAYMENT_FAILED",
    "SUBSCRIPTION_FROZEN",
    "TRIAL_ENDING_SOON",
    "TRIAL_EXPIRED",
  ] as const;
  for (const type of billingHighPriority) {
    assert.equal(
      NOTIFICATION_TYPE_META[type].defaultPriority,
      "high",
      `${type} should be high priority`,
    );
  }
});

test("H1.5: billing types have billing category", () => {
  const billingTypes = [
    "PURCHASE_CONFIRMED",
    "PAYMENT_FAILED",
    "SUBSCRIPTION_FROZEN",
    "TRIAL_ENDING_SOON",
    "TRIAL_EXPIRED",
    "LOW_CANDIDATE_CREDITS",
  ] as const;
  for (const type of billingTypes) {
    assert.equal(
      NOTIFICATION_TYPE_META[type].category,
      "billing",
      `${type} should have billing category`,
    );
  }
});

test("H1.6: campaign types have campaign category", () => {
  const campaignTypes = [
    "CAMPAIGN_LAUNCHED",
    "CAMPAIGN_CLOSED",
    "CAMPAIGN_MILESTONE",
  ] as const;
  for (const type of campaignTypes) {
    assert.equal(
      NOTIFICATION_TYPE_META[type].category,
      "campaign",
      `${type} should have campaign category`,
    );
  }
});

test("H1.7: i18n keys follow naming convention", () => {
  for (const type of ALL_TYPES) {
    const meta = NOTIFICATION_TYPE_META[type];
    assert.ok(
      meta.titleKey.startsWith("notifications."),
      `titleKey should start with "notifications.": ${meta.titleKey}`,
    );
    assert.ok(
      meta.titleKey.endsWith(".title"),
      `titleKey should end with ".title": ${meta.titleKey}`,
    );
    assert.ok(
      meta.bodyKey.startsWith("notifications."),
      `bodyKey should start with "notifications.": ${meta.bodyKey}`,
    );
    assert.ok(
      meta.bodyKey.endsWith(".body"),
      `bodyKey should end with ".body": ${meta.bodyKey}`,
    );
  }
});

// ── i18n key resolution ─────────────────────────────────────────────────────

test("H1.8: all i18n keys resolve to non-empty strings", async () => {
  const { t } = await import("@/lib/i18n");
  for (const type of ALL_TYPES) {
    const meta = NOTIFICATION_TYPE_META[type];
    const huTitle = t(meta.titleKey, "hu");
    const enTitle = t(meta.titleKey, "en");
    const huBody = t(meta.bodyKey, "hu");
    const enBody = t(meta.bodyKey, "en");

    // If t() returns the key itself, the translation is missing
    assert.notEqual(huTitle, meta.titleKey, `Missing HU title for ${type}`);
    assert.notEqual(enTitle, meta.titleKey, `Missing EN title for ${type}`);
    assert.notEqual(huBody, meta.bodyKey, `Missing HU body for ${type}`);
    assert.notEqual(enBody, meta.bodyKey, `Missing EN body for ${type}`);
  }
});
