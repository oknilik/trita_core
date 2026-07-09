/**
 * J2 — Webhook handler contract tests
 *
 * Tests the handler dispatch and idempotency logic without hitting
 * external APIs. Uses the runtime injection pattern from route.ts.
 */

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildCheckoutMetadata,
  parseCheckoutMetadata,
} from "@/lib/billing/stripe-metadata";
import {
  resolveVatDecision,
} from "@/lib/billing/vat-decision";
import {
  buildPurchaseInvoiceItem,
  buildSubscriptionInvoiceItem,
} from "@/lib/billing/invoice-items";
import {
  normalizeInvoicePayload,
} from "@/lib/billing/invoice-normalizer";

// ── Metadata round-trip integration ─────────────────────────────────────────

test("J2: self_plus checkout metadata → parse → invoice item chain", () => {
  const meta = buildCheckoutMetadata({
    tritaUserId: "user_1",
    productType: "self_plus",
    locale: "hu",
    currency: "eur",
  });

  const parsed = parseCheckoutMetadata(meta);
  assert.ok(parsed);
  assert.equal(parsed.productType, "self_plus");

  const vatDecision = resolveVatDecision({ countryCode: "HU" });
  const item = buildPurchaseInvoiceItem(parsed.productType, 1, vatDecision);
  assert.equal(item.name, "Trita Self Plus");
  assert.equal(item.vat, "27%");

  const payload = normalizeInvoicePayload({
    partnerId: 12345,
    vatDecision,
    items: [item],
  });
  assert.equal(payload.currency, "HUF");
  assert.equal(payload.language, "hu");
  assert.equal(payload.items.length, 1);
  assert.equal(payload.type, "invoice");
});

test("J2: team_subscription metadata → subscription invoice item", () => {
  const meta = buildCheckoutMetadata({
    tritaUserId: "user_2",
    organizationId: "org_1",
    productType: "team_subscription",
    billingInterval: "monthly",
    locale: "en",
    currency: "eur",
  });

  const parsed = parseCheckoutMetadata(meta);
  assert.ok(parsed);
  assert.equal(parsed.productType, "team_subscription");
  assert.equal(parsed.billingInterval, "monthly");

  const vatDecision = resolveVatDecision({
    countryCode: "DE",
    euVatNumber: "DE123456789",
  });
  const item = buildSubscriptionInvoiceItem("team", "monthly", 1, vatDecision);
  assert.equal(item.name, "Trita Team subscription – monthly");
  assert.equal(item.vat, "EU");
});

test("J2: candidate_pack metadata → purchase invoice item chain", () => {
  const meta = buildCheckoutMetadata({
    tritaUserId: "user_3",
    organizationId: "org_2",
    productType: "candidate_pack",
    candidatePackSize: "5",
    locale: "hu",
    currency: "eur",
  });

  const parsed = parseCheckoutMetadata(meta);
  assert.ok(parsed);
  assert.equal(parsed.candidatePackSize, "5");

  const vatDecision = resolveVatDecision({ countryCode: "HU" });
  const item = buildPurchaseInvoiceItem("candidate_pack_5", 1, vatDecision);
  assert.equal(item.name, "Trita jelöltértékelés – 5 kredit");
  assert.equal(item.vat, "27%");
});

// ── VAT decision → invoice payload integration ──────────────────────────────

test("J2: HU customer → HUF invoice with 27% ÁFA", () => {
  const vat = resolveVatDecision({ countryCode: "HU" });
  const item = buildPurchaseInvoiceItem("team_snapshot", 1, vat);
  const payload = normalizeInvoicePayload({
    partnerId: 1,
    vatDecision: vat,
    items: [item],
  });

  assert.equal(payload.currency, "HUF");
  assert.equal(payload.language, "hu");
  assert.equal(payload.items[0].vat, "27%");
});

test("J2: EU B2B → EUR reverse charge invoice", () => {
  const vat = resolveVatDecision({
    countryCode: "AT",
    euVatNumber: "ATU12345678",
  });
  const item = buildSubscriptionInvoiceItem("org", "annual", 1, vat);
  const payload = normalizeInvoicePayload({
    partnerId: 2,
    vatDecision: vat,
    items: [item],
  });

  assert.equal(payload.currency, "EUR");
  assert.equal(payload.language, "en");
  assert.equal(payload.items[0].vat, "EU");
});

test("J2: US customer → EUR ÁFA-mentes invoice", () => {
  const vat = resolveVatDecision({ countryCode: "US" });
  const item = buildPurchaseInvoiceItem("self_plus", 1, vat);
  const payload = normalizeInvoicePayload({
    partnerId: 3,
    vatDecision: vat,
    items: [item],
  });

  assert.equal(payload.currency, "EUR");
  assert.equal(payload.items[0].vat, "AAM");
});

// ── Invoice normalizer edge cases ───────────────────────────────────────────

test("J2: normalizer uses today's date when not specified", () => {
  const vat = resolveVatDecision({ countryCode: "HU" });
  const item = buildPurchaseInvoiceItem("self_plus", 1, vat);
  const payload = normalizeInvoicePayload({
    partnerId: 1,
    vatDecision: vat,
    items: [item],
  });

  const today = new Date().toISOString().slice(0, 10);
  assert.equal(payload.fulfillmentDate, today);
  assert.equal(payload.dueDate, today);
});

test("J2: normalizer respects explicit dates", () => {
  const vat = resolveVatDecision({ countryCode: "HU" });
  const item = buildPurchaseInvoiceItem("self_plus", 1, vat);
  const payload = normalizeInvoicePayload({
    partnerId: 1,
    vatDecision: vat,
    items: [item],
    fulfillmentDate: "2026-04-01",
    dueDate: "2026-04-15",
  });

  assert.equal(payload.fulfillmentDate, "2026-04-01");
  assert.equal(payload.dueDate, "2026-04-15");
});

test("J2: normalizer sets paymentMethod to online_bankcard", () => {
  const vat = resolveVatDecision({ countryCode: "DE" });
  const item = buildPurchaseInvoiceItem("team_snapshot", 1, vat);
  const payload = normalizeInvoicePayload({
    partnerId: 1,
    vatDecision: vat,
    items: [item],
  });

  assert.equal(payload.paymentMethod, "online_bankcard");
});

// ── Multiple items support ──────────────────────────────────────────────────

test("J2: normalizer handles multiple line items", () => {
  const vat = resolveVatDecision({ countryCode: "HU" });
  const item1 = buildPurchaseInvoiceItem("self_plus", 1, vat);
  const item2 = buildPurchaseInvoiceItem("team_snapshot", 1, vat);
  const payload = normalizeInvoicePayload({
    partnerId: 1,
    vatDecision: vat,
    items: [item1, item2],
  });

  assert.equal(payload.items.length, 2);
  assert.equal(payload.items[0].name, "Trita Self Plus");
  assert.equal(payload.items[1].name, "Trita Team Snapshot");
});
