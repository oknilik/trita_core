/**
 * H1 — Country / VAT decision hook
 *
 * Explicit decision layer a számlázási logika előkészítésére.
 * Ez dönti el, hogy magyar, EU B2B, vagy nemzetközi számlát kell kiállítani.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

export type VatCategory = "hu_domestic" | "eu_b2b_reverse_charge" | "international";

export interface VatDecision {
  category: VatCategory;
  currency: "EUR" | "HUF";
  locale: "hu" | "en";
  vatRate: number;          // 0.27 for HU, 0 for reverse charge / international
  reverseCharge: boolean;
  invoiceLanguage: "hu" | "en";
}

export interface VatDecisionInput {
  countryCode: string;
  taxNumber?: string | null;
  euVatNumber?: string | null;
  partnerType?: "individual" | "business";
}

// ── EU country codes ───────────────────────────────────────────────────────────

const EU_COUNTRY_CODES = new Set([
  "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR",
  "DE", "GR", "HU", "IE", "IT", "LV", "LT", "LU", "MT", "NL",
  "PL", "PT", "RO", "SK", "SI", "ES", "SE",
]);

// ── Decision function ──────────────────────────────────────────────────────────

export function resolveVatDecision(input: VatDecisionInput): VatDecision {
  const country = (input.countryCode ?? "").toUpperCase().trim();

  // 1) Magyar ügyfél — mindig HUF, magyar ÁFA
  if (country === "HU") {
    return {
      category: "hu_domestic",
      currency: "HUF",
      locale: "hu",
      vatRate: 0.27,
      reverseCharge: false,
      invoiceLanguage: "hu",
    };
  }

  // 2) EU B2B — valid EU VAT szám + EU ország → reverse charge
  if (
    EU_COUNTRY_CODES.has(country) &&
    input.euVatNumber &&
    input.euVatNumber.trim().length > 0
  ) {
    return {
      category: "eu_b2b_reverse_charge",
      currency: "EUR",
      locale: "en",
      vatRate: 0,
      reverseCharge: true,
      invoiceLanguage: "en",
    };
  }

  // 3) Nemzetközi (nem EU, vagy EU de nincs EU VAT)
  return {
    category: "international",
    currency: "EUR",
    locale: "en",
    vatRate: 0,
    reverseCharge: false,
    invoiceLanguage: "en",
  };
}
