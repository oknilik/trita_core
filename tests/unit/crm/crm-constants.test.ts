/**
 * CRM konstans-registryk teljessége (a notification-types registry-check
 * minta szerint): minden stage/kind/státusz/forrás/outcomeKind kap címkét
 * (és ahol van, tone-t), a notification-meta + i18n kulcsok léteznek.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_KINDS,
  ACTIVITY_KIND_LABELS,
  DEAL_SOURCES,
  DEAL_SOURCE_LABELS,
  DEAL_STAGES,
  DEAL_STAGE_LABELS,
  DEAL_STAGE_TONES,
  MANUAL_ACTIVITY_KINDS,
  OPEN_DEAL_STAGES,
  OUTCOME_KINDS,
  OUTCOME_KIND_LABELS,
  POSTPONE_PRESETS,
  QUOTE_DEFAULT_VALIDITY_DAYS,
  QUOTE_EXPIRING_WINDOW_DAYS,
  QUOTE_STATUSES,
  QUOTE_STATUS_LABELS,
  QUOTE_STATUS_TONES,
} from "@/lib/crm/constants";
import { NOTIFICATION_TYPE_META } from "@/lib/notifications/types";
import { notificationTranslations } from "@/lib/i18n/notifications";

function assertNonEmptyLabels<K extends string>(
  values: readonly K[],
  labels: Record<K, string>,
  name: string,
) {
  for (const value of values) {
    assert.ok(
      typeof labels[value] === "string" && labels[value].trim().length > 0,
      `${name}: hiányzó címke — ${value}`,
    );
  }
  assert.equal(Object.keys(labels).length, values.length, `${name}: fölös kulcs a címke-mapban`);
}

test("CRM constants registry", async (t) => {
  await t.test("deal stage: címke + tone minden értékre; O ⊂ ALL", () => {
    assertNonEmptyLabels(DEAL_STAGES, DEAL_STAGE_LABELS, "DEAL_STAGE_LABELS");
    for (const stage of DEAL_STAGES) {
      assert.ok(DEAL_STAGE_TONES[stage], `hiányzó tone — ${stage}`);
    }
    for (const stage of OPEN_DEAL_STAGES) {
      assert.ok((DEAL_STAGES as readonly string[]).includes(stage));
    }
    assert.ok(!(OPEN_DEAL_STAGES as readonly string[]).includes("WON"));
    assert.ok(!(OPEN_DEAL_STAGES as readonly string[]).includes("LOST"));
  });

  await t.test("activity kind: címkék + MANUAL = ALL \\ {SYSTEM}", () => {
    assertNonEmptyLabels(ACTIVITY_KINDS, ACTIVITY_KIND_LABELS, "ACTIVITY_KIND_LABELS");
    assert.deepEqual(
      [...MANUAL_ACTIVITY_KINDS].sort(),
      ACTIVITY_KINDS.filter((kind) => kind !== "SYSTEM").sort(),
    );
  });

  await t.test("quote státusz: címke + tone minden értékre", () => {
    assertNonEmptyLabels(QUOTE_STATUSES, QUOTE_STATUS_LABELS, "QUOTE_STATUS_LABELS");
    for (const status of QUOTE_STATUSES) {
      assert.ok(QUOTE_STATUS_TONES[status], `hiányzó tone — ${status}`);
    }
  });

  await t.test("forrás- és outcome-címkék teljesek", () => {
    assertNonEmptyLabels(DEAL_SOURCES, DEAL_SOURCE_LABELS, "DEAL_SOURCE_LABELS");
    assertNonEmptyLabels(OUTCOME_KINDS, OUTCOME_KIND_LABELS, "OUTCOME_KIND_LABELS");
  });

  await t.test("napi hurok paraméterek épkézlábak", () => {
    assert.ok(POSTPONE_PRESETS.length > 0);
    for (let i = 0; i < POSTPONE_PRESETS.length; i++) {
      assert.ok(Number.isInteger(POSTPONE_PRESETS[i]) && POSTPONE_PRESETS[i] > 0);
      if (i > 0) assert.ok(POSTPONE_PRESETS[i] > POSTPONE_PRESETS[i - 1], "növekvő sorrend");
    }
    assert.ok(QUOTE_DEFAULT_VALIDITY_DAYS > 0);
    assert.ok(QUOTE_EXPIRING_WINDOW_DAYS > 0);
    assert.ok(QUOTE_EXPIRING_WINDOW_DAYS < QUOTE_DEFAULT_VALIDITY_DAYS);
  });

  await t.test("CRM notification-meta + i18n kulcsok léteznek (HU+EN)", () => {
    for (const type of ["CRM_NEXT_ACTION_DUE", "CRM_QUOTE_EXPIRING"] as const) {
      const meta = NOTIFICATION_TYPE_META[type];
      assert.ok(meta, `hiányzó meta — ${type}`);
      assert.ok(meta.titleKey.startsWith("notifications."));
      assert.ok(meta.bodyKey.startsWith("notifications."));
    }
    const { crmNextActionDue, crmQuoteExpiring } = notificationTranslations.notifications;
    for (const entry of [crmNextActionDue, crmQuoteExpiring]) {
      assert.ok(entry.title.hu.trim().length > 0);
      assert.ok(entry.title.en.trim().length > 0);
      assert.ok(entry.body.hu.trim().length > 0);
      assert.ok(entry.body.en.trim().length > 0);
    }
    // A body-k a sweep által küldött vars-okat hivatkozzák.
    assert.ok(crmNextActionDue.body.hu.includes("{deal}"));
    assert.ok(crmQuoteExpiring.body.hu.includes("{quoteNo}"));
  });
});
