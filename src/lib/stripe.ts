import Stripe from "stripe";

export const STRIPE_PRICES = {
  team_monthly: process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "",
  team_annual:  process.env.STRIPE_PRICE_TEAM_ANNUAL ?? "",
  org_monthly:  process.env.STRIPE_PRICE_ORG_MONTHLY ?? "",
  org_annual:   process.env.STRIPE_PRICE_ORG_ANNUAL ?? "",
} as const;

export type PriceKey = keyof typeof STRIPE_PRICES;

export const TRIAL_DAYS = 14;

// Lazy singleton — nem dob hibát importáláskor, csak használatkor
let _stripe: Stripe | undefined;

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop: string | symbol) {
    if (!_stripe) {
      if (!process.env.STRIPE_SECRET_KEY) {
        throw new Error("Missing STRIPE_SECRET_KEY");
      }
      _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
        apiVersion: "2026-02-25.clover",
        typescript: true,
      });
    }
    return (_stripe as unknown as Record<string | symbol, unknown>)[prop];
  },
});
