/**
 * E2 + F3 — Invoice item mapping
 *
 * Központi mapping a Trita termékek és Billingo számlatételek között.
 */

import type { BillingoInvoiceItem } from "./billingo-client";
import type { VatDecision } from "./vat-decision";

// ── Product type → invoice item ────────────────────────────────────────────────

interface InvoiceItemTemplate {
  name: { hu: string; en: string };
  unitPriceEur: number;   // nettó EUR centben
}

const PURCHASE_ITEMS: Record<string, InvoiceItemTemplate> = {
  self_plus: {
    name: { hu: "Trita Self Plus", en: "Trita Self Plus" },
    unitPriceEur: 900,
  },
  team_snapshot: {
    name: { hu: "Trita Team Snapshot", en: "Trita Team Snapshot" },
    unitPriceEur: 9900,
  },
  team_deep_dive: {
    name: { hu: "Trita Team Deep Dive", en: "Trita Team Deep Dive" },
    unitPriceEur: 99000,
  },
  candidate_pack_1: {
    name: { hu: "Trita jelöltértékelés – 1 kredit", en: "Trita candidate assessment – 1 credit" },
    unitPriceEur: 3900,
  },
  candidate_pack_5: {
    name: { hu: "Trita jelöltértékelés – 5 kredit", en: "Trita candidate assessment – 5 credits" },
    unitPriceEur: 3315,
  },
  candidate_pack_10: {
    name: { hu: "Trita jelöltértékelés – 10 kredit", en: "Trita candidate assessment – 10 credits" },
    unitPriceEur: 3120,
  },
};

const SUBSCRIPTION_ITEMS: Record<string, InvoiceItemTemplate> = {
  team_monthly: {
    name: { hu: "Trita Team előfizetés – havi", en: "Trita Team subscription – monthly" },
    unitPriceEur: 4900,
  },
  team_annual: {
    name: { hu: "Trita Team előfizetés – éves", en: "Trita Team subscription – annual" },
    unitPriceEur: 47000,
  },
  org_monthly: {
    name: { hu: "Trita Org előfizetés – havi", en: "Trita Org subscription – monthly" },
    unitPriceEur: 14900,
  },
  org_annual: {
    name: { hu: "Trita Org előfizetés – éves", en: "Trita Org subscription – annual" },
    unitPriceEur: 143000,
  },
};

// ── EUR → HUF conversion placeholder ──────────────────────────────────────────
// TODO: ezt élesben MNB árfolyamról kell venni a teljesítés napján
const EUR_TO_HUF_RATE = 400;

function convertToHuf(eurCents: number): number {
  return Math.round((eurCents / 100) * EUR_TO_HUF_RATE);
}

// ── Builder ────────────────────────────────────────────────────────────────────

function vatCode(decision: VatDecision): string {
  if (decision.category === "hu_domestic") return "27%";
  if (decision.category === "eu_b2b_reverse_charge") return "EU";
  return "AAM"; // ÁFA mentes
}

export function buildPurchaseInvoiceItem(
  productType: string,
  quantity: number,
  vatDecision: VatDecision,
): BillingoInvoiceItem {
  const template = PURCHASE_ITEMS[productType];
  if (!template) {
    throw new Error(`Unknown purchase product type: ${productType}`);
  }

  const lang = vatDecision.invoiceLanguage;
  const unitPrice = vatDecision.currency === "HUF"
    ? convertToHuf(template.unitPriceEur)
    : template.unitPriceEur / 100; // EUR centből EUR-ba

  return {
    name: template.name[lang],
    unitPrice,
    quantity,
    unit: lang === "hu" ? "db" : "pcs",
    vat: vatCode(vatDecision),
  };
}

export function buildSubscriptionInvoiceItem(
  planType: string,
  interval: string,
  quantity: number,
  vatDecision: VatDecision,
): BillingoInvoiceItem {
  const key = `${planType}_${interval}`;
  const template = SUBSCRIPTION_ITEMS[key];
  if (!template) {
    throw new Error(`Unknown subscription type: ${key}`);
  }

  const lang = vatDecision.invoiceLanguage;
  const unitPrice = vatDecision.currency === "HUF"
    ? convertToHuf(template.unitPriceEur)
    : template.unitPriceEur / 100;

  return {
    name: template.name[lang],
    unitPrice,
    quantity,
    unit: lang === "hu" ? "db" : "pcs",
    vat: vatCode(vatDecision),
  };
}
