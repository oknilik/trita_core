import test from "node:test";
import assert from "node:assert/strict";
import { resolveVatDecision } from "@/lib/billing/vat-decision";

test("H1: HU customer → HUF, 27% ÁFA, magyar számla", () => {
  const d = resolveVatDecision({ countryCode: "HU" });
  assert.equal(d.category, "hu_domestic");
  assert.equal(d.currency, "HUF");
  assert.equal(d.vatRate, 0.27);
  assert.equal(d.reverseCharge, false);
  assert.equal(d.invoiceLanguage, "hu");
});

test("H1: HU customer with EU VAT → still HU domestic (not reverse charge)", () => {
  const d = resolveVatDecision({
    countryCode: "HU",
    euVatNumber: "HU12345678",
  });
  assert.equal(d.category, "hu_domestic");
  assert.equal(d.currency, "HUF");
});

test("H1: DE + EU VAT → EUR, reverse charge", () => {
  const d = resolveVatDecision({
    countryCode: "DE",
    euVatNumber: "DE123456789",
  });
  assert.equal(d.category, "eu_b2b_reverse_charge");
  assert.equal(d.currency, "EUR");
  assert.equal(d.vatRate, 0);
  assert.equal(d.reverseCharge, true);
  assert.equal(d.invoiceLanguage, "en");
});

test("H1: FR + EU VAT → EUR, reverse charge", () => {
  const d = resolveVatDecision({
    countryCode: "FR",
    euVatNumber: "FR12345678901",
  });
  assert.equal(d.category, "eu_b2b_reverse_charge");
  assert.equal(d.currency, "EUR");
  assert.equal(d.reverseCharge, true);
});

test("H1: DE without EU VAT → international (not reverse charge)", () => {
  const d = resolveVatDecision({ countryCode: "DE" });
  assert.equal(d.category, "international");
  assert.equal(d.currency, "EUR");
  assert.equal(d.vatRate, 0);
  assert.equal(d.reverseCharge, false);
});

test("H1: US → EUR, international, ÁFA mentes", () => {
  const d = resolveVatDecision({ countryCode: "US" });
  assert.equal(d.category, "international");
  assert.equal(d.currency, "EUR");
  assert.equal(d.vatRate, 0);
  assert.equal(d.reverseCharge, false);
  assert.equal(d.invoiceLanguage, "en");
});

test("H1: empty country → international fallback", () => {
  const d = resolveVatDecision({ countryCode: "" });
  assert.equal(d.category, "international");
});

test("H1: lowercase country code normalizes correctly", () => {
  const d = resolveVatDecision({ countryCode: "hu" });
  assert.equal(d.category, "hu_domestic");
});

test("H1: EU VAT with empty string → not treated as valid", () => {
  const d = resolveVatDecision({
    countryCode: "DE",
    euVatNumber: "",
  });
  assert.equal(d.category, "international");
});

test("H1: EU VAT with whitespace only → not treated as valid", () => {
  const d = resolveVatDecision({
    countryCode: "AT",
    euVatNumber: "   ",
  });
  assert.equal(d.category, "international");
});
