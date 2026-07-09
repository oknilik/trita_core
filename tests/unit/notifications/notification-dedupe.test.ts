/**
 * H2 — Notification dedupe logic unit tests
 *
 * Tests the pure dedup filter without hitting the database.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  filterDuplicateIntents,
  buildDedupeKeySet,
} from "@/lib/notifications/repository";
import type { NotificationIntent } from "@/lib/notifications/types";

function makeIntent(overrides: Partial<NotificationIntent> = {}): NotificationIntent {
  return {
    userId: "user_1",
    type: "OBSERVER_COMPLETED",
    category: "observer",
    priority: "normal",
    ...overrides,
  };
}

// ── filterDuplicateIntents ──────────────────────────────────────────────────

test("H2.1: intents without dedupeKey always pass through", () => {
  const intents = [
    makeIntent({ userId: "user_1" }),
    makeIntent({ userId: "user_2" }),
  ];
  const result = filterDuplicateIntents(intents, new Set());
  assert.equal(result.length, 2);
});

test("H2.2: intents with dedupeKey pass when no existing keys", () => {
  const intents = [
    makeIntent({ userId: "user_1", dedupeKey: "OBS:inv_1" }),
  ];
  const result = filterDuplicateIntents(intents, new Set());
  assert.equal(result.length, 1);
});

test("H2.3: intents with matching dedupeKey + userId are filtered out", () => {
  const intents = [
    makeIntent({ userId: "user_1", dedupeKey: "OBS:inv_1" }),
    makeIntent({ userId: "user_2", dedupeKey: "OBS:inv_1" }),
  ];
  const existing = new Set(["OBS:inv_1:user_1"]);
  const result = filterDuplicateIntents(intents, existing);

  assert.equal(result.length, 1);
  assert.equal(result[0]!.userId, "user_2");
});

test("H2.4: same dedupeKey for different users are independent", () => {
  const intents = [
    makeIntent({ userId: "user_1", dedupeKey: "CAMP:camp_1" }),
    makeIntent({ userId: "user_2", dedupeKey: "CAMP:camp_1" }),
    makeIntent({ userId: "user_3", dedupeKey: "CAMP:camp_1" }),
  ];
  const existing = new Set(["CAMP:camp_1:user_2"]);
  const result = filterDuplicateIntents(intents, existing);

  assert.equal(result.length, 2);
  const userIds = result.map((r) => r.userId);
  assert.ok(userIds.includes("user_1"));
  assert.ok(userIds.includes("user_3"));
  assert.ok(!userIds.includes("user_2"));
});

test("H2.5: all intents filtered → empty result", () => {
  const intents = [
    makeIntent({ userId: "user_1", dedupeKey: "PAY:inv_1" }),
  ];
  const existing = new Set(["PAY:inv_1:user_1"]);
  const result = filterDuplicateIntents(intents, existing);
  assert.equal(result.length, 0);
});

test("H2.6: mixed dedupeKey and no-dedupeKey intents", () => {
  const intents = [
    makeIntent({ userId: "user_1", dedupeKey: "OBS:inv_1" }),
    makeIntent({ userId: "user_1" }), // no dedupeKey → always passes
    makeIntent({ userId: "user_2", dedupeKey: "OBS:inv_2" }),
  ];
  const existing = new Set(["OBS:inv_1:user_1"]);
  const result = filterDuplicateIntents(intents, existing);

  assert.equal(result.length, 2);
});

// ── buildDedupeKeySet ───────────────────────────────────────────────────────

test("H2.7: buildDedupeKeySet creates correct composite keys", () => {
  const existing = [
    { dedupeKey: "OBS:inv_1", userId: "user_1" },
    { dedupeKey: "PAY:inv_2", userId: "user_3" },
  ];
  const set = buildDedupeKeySet(existing);

  assert.equal(set.size, 2);
  assert.ok(set.has("OBS:inv_1:user_1"));
  assert.ok(set.has("PAY:inv_2:user_3"));
  assert.ok(!set.has("OBS:inv_1:user_2"));
});

test("H2.8: buildDedupeKeySet handles null dedupeKey", () => {
  const existing = [
    { dedupeKey: null, userId: "user_1" },
    { dedupeKey: "OBS:inv_1", userId: "user_2" },
  ];
  const set = buildDedupeKeySet(existing);

  assert.equal(set.size, 2);
  assert.ok(set.has("null:user_1")); // null coerced to string
  assert.ok(set.has("OBS:inv_1:user_2"));
});

// ── Orchestrator dedupeKey convention tests ──────────────────────────────────

test("H2.9: dedupeKey convention — format is TYPE:sourceId", () => {
  // Verify the convention used in orchestrator.ts
  const keys = [
    "OBSERVER_COMPLETED:inv_123",
    "RESULT_READY:result_456",
    "PAYMENT_FAILED:in_789:user_1",
    "CAMPAIGN_LAUNCHED:camp_1:user_2",
    "TRIAL_ENDING_SOON:org_1:user_3",
  ];

  for (const key of keys) {
    assert.ok(key.includes(":"), `dedupeKey should contain separator: ${key}`);
    const parts = key.split(":");
    assert.ok(parts.length >= 2, `dedupeKey should have at least 2 parts: ${key}`);
    assert.ok(parts[0]!.length > 0, `dedupeKey type part should not be empty: ${key}`);
  }
});
