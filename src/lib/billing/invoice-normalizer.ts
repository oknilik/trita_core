/**
 * C3 — Invoice payload normalizer
 *
 * Központi normalizer a Billingo-ready invoice payloadokhoz.
 * A country/VAT decision hook outputjára támaszkodik.
 */

import type { BillingoInvoiceInput, BillingoInvoiceItem } from "./billingo-client";
import type { VatDecision } from "./vat-decision";

export interface InvoiceNormalizerInput {
  partnerId: number;
  vatDecision: VatDecision;
  items: BillingoInvoiceItem[];
  comment?: string;
  /** YYYY-MM-DD, defaults to today */
  fulfillmentDate?: string;
  /** YYYY-MM-DD, defaults to today */
  dueDate?: string;
}

export function normalizeInvoicePayload(
  input: InvoiceNormalizerInput,
): BillingoInvoiceInput {
  const today = new Date().toISOString().slice(0, 10);

  return {
    partnerId: input.partnerId,
    blockId: 0, // Will be overridden by billingo-client with env BILLINGO_BLOCK_ID
    currency: input.vatDecision.currency,
    language: input.vatDecision.invoiceLanguage,
    type: "invoice",
    paymentMethod: "online_bankcard",
    items: input.items,
    fulfillmentDate: input.fulfillmentDate ?? today,
    dueDate: input.dueDate ?? today,
    comment: input.comment ?? "",
  };
}

/**
 * Convenience: build a complete purchase invoice payload from parts.
 */
export function buildPurchaseInvoicePayload(input: {
  partnerId: number;
  vatDecision: VatDecision;
  productType: string;
  quantity: number;
  buildItem: (productType: string, quantity: number, vat: VatDecision) => BillingoInvoiceItem;
  comment?: string;
}): BillingoInvoiceInput {
  const item = input.buildItem(input.productType, input.quantity, input.vatDecision);
  return normalizeInvoicePayload({
    partnerId: input.partnerId,
    vatDecision: input.vatDecision,
    items: [item],
    comment: input.comment,
  });
}

/**
 * Convenience: build a complete subscription invoice payload from parts.
 */
export function buildSubscriptionInvoicePayload(input: {
  partnerId: number;
  vatDecision: VatDecision;
  planType: string;
  interval: string;
  quantity: number;
  buildItem: (planType: string, interval: string, quantity: number, vat: VatDecision) => BillingoInvoiceItem;
  comment?: string;
}): BillingoInvoiceInput {
  const item = input.buildItem(input.planType, input.interval, input.quantity, input.vatDecision);
  return normalizeInvoicePayload({
    partnerId: input.partnerId,
    vatDecision: input.vatDecision,
    items: [item],
    comment: input.comment,
  });
}
