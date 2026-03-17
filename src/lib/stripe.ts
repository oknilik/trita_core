import Stripe from "stripe";

export const STRIPE_PRICES = {
  team_monthly:  process.env.STRIPE_PRICE_TEAM_MONTHLY ?? "",
  team_annual:   process.env.STRIPE_PRICE_TEAM_ANNUAL ?? "",
  org_monthly:   process.env.STRIPE_PRICE_ORG_MONTHLY ?? "",
  org_annual:    process.env.STRIPE_PRICE_ORG_ANNUAL ?? "",
} as const;

export type PriceKey = keyof typeof STRIPE_PRICES;

// Candidate credit packages (1/5/10 — inline price_data, no Stripe price ID needed)
export const CANDIDATE_PACKAGES: Record<
  "candidate_1" | "candidate_5" | "candidate_10",
  { unitAmount: number; credits: number; label: string }
> = {
  candidate_1:  { unitAmount: 3900,  credits: 1,  label: "1× Candidate Assessment" },
  candidate_5:  { unitAmount: 17500, credits: 5,  label: "5× Candidate Assessments" },
  candidate_10: { unitAmount: 29900, credits: 10, label: "10× Candidate Assessments" },
};

export type CandidatePackageKey = keyof typeof CANDIDATE_PACKAGES;

// Plan tier derivation: arrays of known price IDs per tier
export const TEAM_PRICE_IDS = [
  process.env.STRIPE_PRICE_TEAM_MONTHLY,
  process.env.STRIPE_PRICE_TEAM_ANNUAL,
].filter(Boolean) as string[];

export const ORG_PRICE_IDS = [
  process.env.STRIPE_PRICE_ORG_MONTHLY,
  process.env.STRIPE_PRICE_ORG_ANNUAL,
].filter(Boolean) as string[];

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
