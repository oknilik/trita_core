import test from "node:test";
import assert from "node:assert/strict";
import { buildPurchaseInvoiceItem, buildSubscriptionInvoiceItem } from "@/lib/billing/invoice-items";
import type { VatDecision } from "@/lib/billing/vat-decision";

const HU_DECISION: VatDecision = {
  category: "hu_domestic",
  currency: "HUF",
  locale: "hu",
  vatRate: 0.27,
  reverseCharge: false,
  invoiceLanguage: "hu",
};

const EU_DECISION: VatDecision = {
  category: "eu_b2b_reverse_charge",
  currency: "EUR",
  locale: "en",
  vatRate: 0,
  reverseCharge: true,
  invoiceLanguage: "en",
};

const INTL_DECISION: VatDecision = {
  category: "international",
  currency: "EUR",
  locale: "en",
  vatRate: 0,
  reverseCharge: false,
  invoiceLanguage: "en",
};

// ── Purchase items ──────────────────────────────────────────────────────────

test("E2: self_plus → correct HU name and HUF price", () => {
  const item = buildPurchaseInvoiceItem("self_plus", 1, HU_DECISION);
  assert.equal(item.name, "Trita Self Plus");
  assert.equal(item.unit, "db");
  assert.equal(item.vat, "27%");
  assert.equal(item.quantity, 1);
  assert.ok(item.unitPrice > 0);
});

test("E2: self_plus → EUR price for EU B2B", () => {
  const item = buildPurchaseInvoiceItem("self_plus", 1, EU_DECISION);
  assert.equal(item.name, "Trita Self Plus");
  assert.equal(item.unitPrice, 9); // 900 cents / 100
  assert.equal(item.unit, "pcs");
  assert.equal(item.vat, "EU");
});

test("E2: team_snapshot → correct mapping", () => {
  const item = buildPurchaseInvoiceItem("team_snapshot", 1, INTL_DECISION);
  assert.equal(item.name, "Trita Team Snapshot");
  assert.equal(item.unitPrice, 99);
  assert.equal(item.vat, "AAM");
});

test("E2: candidate_pack_5 → correct name and price", () => {
  const item = buildPurchaseInvoiceItem("candidate_pack_5", 1, EU_DECISION);
  assert.equal(item.name, "Trita candidate assessment – 5 credits");
  assert.equal(item.unitPrice, 33.15);
});

test("E2: unknown product type → throws", () => {
  assert.throws(
    () => buildPurchaseInvoiceItem("nonexistent_product", 1, HU_DECISION),
    /Unknown purchase product type/,
  );
});

// ── Subscription items ──────────────────────────────────────────────────────

test("F3: team monthly → correct HU mapping", () => {
  const item = buildSubscriptionInvoiceItem("team", "monthly", 1, HU_DECISION);
  assert.equal(item.name, "Trita Team előfizetés – havi");
  assert.equal(item.vat, "27%");
  assert.ok(item.unitPrice > 0);
});

test("F3: org annual → correct EN mapping", () => {
  const item = buildSubscriptionInvoiceItem("org", "annual", 1, EU_DECISION);
  assert.equal(item.name, "Trita Org subscription – annual");
  assert.equal(item.unitPrice, 1430); // 143000 cents / 100
  assert.equal(item.vat, "EU");
});

test("F3: unknown plan type → throws", () => {
  assert.throws(
    () => buildSubscriptionInvoiceItem("scale", "monthly", 1, HU_DECISION),
    /Unknown subscription type/,
  );
});
