import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCheckoutMetadata,
  parseCheckoutMetadata,
  type StripeSessionMetadata,
} from "@/lib/billing/stripe-metadata";

test("B1: metadata builder → parser round-trip preserves all fields", () => {
  const input: StripeSessionMetadata = {
    tritaUserId: "user_123",
    organizationId: "org_456",
    teamId: "team_789",
    productType: "team_subscription",
    billingInterval: "monthly",
    seatCount: "5",
    locale: "hu",
    currency: "eur",
    billingCountry: "HU",
    vatNumber: "12345678-2-42",
  };

  const built = buildCheckoutMetadata(input);
  const parsed = parseCheckoutMetadata(built);

  assert.ok(parsed);
  assert.equal(parsed.tritaUserId, input.tritaUserId);
  assert.equal(parsed.organizationId, input.organizationId);
  assert.equal(parsed.teamId, input.teamId);
  assert.equal(parsed.productType, input.productType);
  assert.equal(parsed.billingInterval, input.billingInterval);
  assert.equal(parsed.seatCount, input.seatCount);
  assert.equal(parsed.locale, input.locale);
  assert.equal(parsed.currency, input.currency);
  assert.equal(parsed.billingCountry, input.billingCountry);
  assert.equal(parsed.vatNumber, input.vatNumber);
});

test("B1: metadata builder with minimal fields round-trips", () => {
  const input: StripeSessionMetadata = {
    tritaUserId: "user_1",
    productType: "self_plus",
    locale: "en",
    currency: "eur",
  };

  const built = buildCheckoutMetadata(input);
  const parsed = parseCheckoutMetadata(built);

  assert.ok(parsed);
  assert.equal(parsed.tritaUserId, "user_1");
  assert.equal(parsed.productType, "self_plus");
  assert.equal(parsed.organizationId, undefined);
  assert.equal(parsed.billingInterval, undefined);
});

test("B1: parse null input → null", () => {
  assert.equal(parseCheckoutMetadata(null), null);
  assert.equal(parseCheckoutMetadata(undefined), null);
});

test("B1: parse empty object → null (missing required fields)", () => {
  assert.equal(parseCheckoutMetadata({}), null);
});

test("B1: parse with missing tritaUserId → null", () => {
  assert.equal(
    parseCheckoutMetadata({ product_type: "self_plus", locale: "hu", currency: "eur" }),
    null,
  );
});

test("B1: parse with invalid productType → null", () => {
  assert.equal(
    parseCheckoutMetadata({
      trita_user_id: "u1",
      product_type: "invalid_type",
      locale: "hu",
      currency: "eur",
    }),
    null,
  );
});

test("B1: parse ignores extra fields", () => {
  const parsed = parseCheckoutMetadata({
    trita_user_id: "u1",
    product_type: "self_plus",
    locale: "en",
    currency: "eur",
    unknown_field: "should be ignored",
  });

  assert.ok(parsed);
  assert.equal(parsed.productType, "self_plus");
  assert.equal((parsed as Record<string, unknown>)["unknown_field"], undefined);
});

test("B1: parse validates billing interval", () => {
  const valid = parseCheckoutMetadata({
    trita_user_id: "u1",
    product_type: "team_subscription",
    locale: "hu",
    currency: "eur",
    billing_interval: "monthly",
  });
  assert.ok(valid);
  assert.equal(valid!.billingInterval, "monthly");

  const invalid = parseCheckoutMetadata({
    trita_user_id: "u1",
    product_type: "team_subscription",
    locale: "hu",
    currency: "eur",
    billing_interval: "weekly",
  });
  assert.ok(invalid);
  assert.equal(invalid!.billingInterval, undefined); // invalid interval ignored
});
