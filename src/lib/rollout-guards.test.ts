import assert from "node:assert/strict";
import test from "node:test";
import {
  isUnifiedJourneyHandoffEnabled,
  parseBooleanRolloutFlag,
} from "@/lib/rollout-guards";
import {
  isPolicyEngineEnforcementEnabled,
  isSharedAcceptanceServiceEnabled,
} from "@/lib/rollout-guards.server";

test("parseBooleanRolloutFlag handles truthy/falsy values", () => {
  assert.equal(parseBooleanRolloutFlag("true", false), true);
  assert.equal(parseBooleanRolloutFlag("1", false), true);
  assert.equal(parseBooleanRolloutFlag("on", false), true);
  assert.equal(parseBooleanRolloutFlag("false", true), false);
  assert.equal(parseBooleanRolloutFlag("0", true), false);
  assert.equal(parseBooleanRolloutFlag("off", true), false);
});

test("parseBooleanRolloutFlag falls back to default on empty/unknown", () => {
  assert.equal(parseBooleanRolloutFlag(undefined, true), true);
  assert.equal(parseBooleanRolloutFlag("", false), false);
  assert.equal(parseBooleanRolloutFlag("unexpected", true), true);
});

test("isUnifiedJourneyHandoffEnabled reads NEXT_PUBLIC flag", () => {
  const original = process.env.NEXT_PUBLIC_TRITA_UNIFIED_JOURNEY_HANDOFF;

  try {
    delete process.env.NEXT_PUBLIC_TRITA_UNIFIED_JOURNEY_HANDOFF;
    assert.equal(isUnifiedJourneyHandoffEnabled(), true);

    process.env.NEXT_PUBLIC_TRITA_UNIFIED_JOURNEY_HANDOFF = "0";
    assert.equal(isUnifiedJourneyHandoffEnabled(), false);
  } finally {
    if (original === undefined) {
      delete process.env.NEXT_PUBLIC_TRITA_UNIFIED_JOURNEY_HANDOFF;
    } else {
      process.env.NEXT_PUBLIC_TRITA_UNIFIED_JOURNEY_HANDOFF = original;
    }
  }
});

test("server rollout guards default to enabled and obey explicit disable", () => {
  const originalShared = process.env.TRITA_SHARED_ACCEPTANCE_SERVICE;
  const originalPolicy = process.env.TRITA_POLICY_ENGINE_ENFORCEMENT;

  try {
    delete process.env.TRITA_SHARED_ACCEPTANCE_SERVICE;
    delete process.env.TRITA_POLICY_ENGINE_ENFORCEMENT;
    assert.equal(isSharedAcceptanceServiceEnabled(), true);
    assert.equal(isPolicyEngineEnforcementEnabled(), true);

    process.env.TRITA_SHARED_ACCEPTANCE_SERVICE = "false";
    process.env.TRITA_POLICY_ENGINE_ENFORCEMENT = "no";
    assert.equal(isSharedAcceptanceServiceEnabled(), false);
    assert.equal(isPolicyEngineEnforcementEnabled(), false);
  } finally {
    if (originalShared === undefined) {
      delete process.env.TRITA_SHARED_ACCEPTANCE_SERVICE;
    } else {
      process.env.TRITA_SHARED_ACCEPTANCE_SERVICE = originalShared;
    }

    if (originalPolicy === undefined) {
      delete process.env.TRITA_POLICY_ENGINE_ENFORCEMENT;
    } else {
      process.env.TRITA_POLICY_ENGINE_ENFORCEMENT = originalPolicy;
    }
  }
});
