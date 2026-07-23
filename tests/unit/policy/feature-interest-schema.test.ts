import test from "node:test";
import assert from "node:assert/strict";
import {
  featureInterestPostSchema,
  normalizeFeatureInterestBody,
  FEATURE_INTEREST_LEAD_KEYS,
  FEATURE_INTEREST_WISHLIST_KEYS,
  FEATURE_INTEREST_LEAD_UNIQUE_KEYS,
  FEATURE_INTEREST_LABELS,
} from "@/lib/feature-interest";

// P5 — egységesített feature-interest végpont: közös Zod-séma + a régi
// /api/feature-interest 308-átirányítás mode-normalizálása.

test("lead mód: érvényes kulcsok elfogadva, üzenet opcionális", () => {
  for (const featureKey of FEATURE_INTEREST_LEAD_KEYS) {
    assert.equal(featureInterestPostSchema.safeParse({ mode: "lead", featureKey }).success, true);
  }
  assert.equal(
    featureInterestPostSchema.safeParse({ mode: "lead", featureKey: "team", message: "hello" })
      .success,
    true,
  );
});

test("lead mód: wishlist-only kulcs és túl hosszú üzenet elutasítva", () => {
  assert.equal(
    featureInterestPostSchema.safeParse({ mode: "lead", featureKey: "comm" }).success,
    false,
  );
  assert.equal(
    featureInterestPostSchema.safeParse({
      mode: "lead",
      featureKey: "team",
      message: "x".repeat(2001),
    }).success,
    false,
  );
});

test("wishlist mód: érvényes kulcsok elfogadva, lead-only kulcs elutasítva", () => {
  for (const featureKey of FEATURE_INTEREST_WISHLIST_KEYS) {
    assert.equal(
      featureInterestPostSchema.safeParse({ mode: "wishlist", featureKey }).success,
      true,
    );
  }
  assert.equal(
    featureInterestPostSchema.safeParse({ mode: "wishlist", featureKey: "industry_role" }).success,
    false,
  );
});

test("ismeretlen mode vagy hiányzó featureKey elutasítva", () => {
  assert.equal(featureInterestPostSchema.safeParse({ mode: "other", featureKey: "team" }).success, false);
  assert.equal(featureInterestPostSchema.safeParse({ mode: "lead" }).success, false);
  assert.equal(featureInterestPostSchema.safeParse({}).success, false);
});

test("normalizálás: mode nélküli payload legacy=lead jelölővel lead lesz", () => {
  const normalized = normalizeFeatureInterestBody({ featureKey: "team", message: "hi" }, true);
  const parsed = featureInterestPostSchema.safeParse(normalized);
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.mode, "lead");
});

test("normalizálás: mode nélküli payload jelölő nélkül wishlist marad", () => {
  const normalized = normalizeFeatureInterestBody({ featureKey: "360" }, false);
  const parsed = featureInterestPostSchema.safeParse(normalized);
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.mode, "wishlist");
});

test("normalizálás: explicit mode-ot a legacy jelölő nem ír felül", () => {
  const normalized = normalizeFeatureInterestBody({ mode: "wishlist", featureKey: "comm" }, true);
  const parsed = featureInterestPostSchema.safeParse(normalized);
  assert.equal(parsed.success, true);
  assert.equal(parsed.success && parsed.data.mode, "wishlist");
});

test("normalizálás: nem-objektum payload változatlanul megy tovább (majd 400)", () => {
  assert.equal(normalizeFeatureInterestBody(null, true), null);
  assert.equal(normalizeFeatureInterestBody("x", false), "x");
  assert.equal(featureInterestPostSchema.safeParse(null).success, false);
});

test("vokabulárium-invariánsok: team közös kulcs, minden kulcsnak van címkéje", () => {
  assert.equal(FEATURE_INTEREST_LEAD_KEYS.includes("team"), true);
  assert.equal(FEATURE_INTEREST_WISHLIST_KEYS.includes("team"), true);
  assert.equal(FEATURE_INTEREST_LEAD_UNIQUE_KEYS.has("team"), true);
  for (const key of [...FEATURE_INTEREST_LEAD_KEYS, ...FEATURE_INTEREST_WISHLIST_KEYS]) {
    assert.equal(typeof FEATURE_INTEREST_LABELS[key], "string");
  }
});
