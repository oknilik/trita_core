/**
 * B1 — Központi Stripe metadata contract
 *
 * Minden checkout session és subscription metadata ebben a formátumban épül.
 * A webhook handler-ek a parser-t használják a metadata kiolvasásához.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type BillingProductType =
  | "self_plus"
  | "team_snapshot"
  | "team_deep_dive"
  | "candidate_pack"
  | "team_subscription"
  | "org_subscription";

export type BillingInterval = "monthly" | "annual";

export interface StripeSessionMetadata {
  tritaUserId: string;
  organizationId?: string;
  teamId?: string;
  productType: BillingProductType;
  billingInterval?: BillingInterval;
  seatCount?: string;
  candidatePackSize?: string;
  locale: string;
  currency: string;
  billingCountry?: string;
  vatNumber?: string;
}

// ── Builder ────────────────────────────────────────────────────────────────────

export function buildCheckoutMetadata(
  input: StripeSessionMetadata,
): Record<string, string> {
  const meta: Record<string, string> = {
    trita_user_id: input.tritaUserId,
    product_type: input.productType,
    locale: input.locale,
    currency: input.currency,
  };

  if (input.organizationId) meta.organization_id = input.organizationId;
  if (input.teamId) meta.team_id = input.teamId;
  if (input.billingInterval) meta.billing_interval = input.billingInterval;
  if (input.seatCount) meta.seat_count = input.seatCount;
  if (input.candidatePackSize) meta.candidate_pack_size = input.candidatePackSize;
  if (input.billingCountry) meta.billing_country = input.billingCountry;
  if (input.vatNumber) meta.vat_number = input.vatNumber;

  return meta;
}

// ── Parser ─────────────────────────────────────────────────────────────────────

const VALID_PRODUCT_TYPES = new Set<string>([
  "self_plus",
  "team_snapshot",
  "team_deep_dive",
  "candidate_pack",
  "team_subscription",
  "org_subscription",
]);

const VALID_INTERVALS = new Set<string>(["monthly", "annual"]);

export function parseCheckoutMetadata(
  raw: Record<string, string> | null | undefined,
): StripeSessionMetadata | null {
  if (!raw || typeof raw !== "object") return null;

  const tritaUserId = raw.trita_user_id;
  const productType = raw.product_type;
  const locale = raw.locale;
  const currency = raw.currency;

  if (!tritaUserId || !productType || !locale || !currency) return null;
  if (!VALID_PRODUCT_TYPES.has(productType)) return null;

  const result: StripeSessionMetadata = {
    tritaUserId,
    productType: productType as BillingProductType,
    locale,
    currency,
  };

  if (raw.organization_id) result.organizationId = raw.organization_id;
  if (raw.team_id) result.teamId = raw.team_id;
  if (raw.billing_interval && VALID_INTERVALS.has(raw.billing_interval)) {
    result.billingInterval = raw.billing_interval as BillingInterval;
  }
  if (raw.seat_count) result.seatCount = raw.seat_count;
  if (raw.candidate_pack_size) result.candidatePackSize = raw.candidate_pack_size;
  if (raw.billing_country) result.billingCountry = raw.billing_country;
  if (raw.vat_number) result.vatNumber = raw.vat_number;

  return result;
}
