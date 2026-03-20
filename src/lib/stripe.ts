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

export const EXTRA_SEAT_PRICES = {
  monthly: process.env.STRIPE_PRICE_EXTRA_SEAT_MONTHLY ?? "",
  annual:  process.env.STRIPE_PRICE_EXTRA_SEAT_ANNUAL ?? "",
} as const;

export const TRIAL_DAYS = 14;

// ── One-time purchase prices ──────────────────────────────────
export const STRIPE_ONE_TIME_PRICES = {
  self_plus:       process.env.STRIPE_PRICE_SELF_PLUS ?? "",
  self_reflect:    process.env.STRIPE_PRICE_SELF_REFLECT ?? "",
  team_scan:       process.env.STRIPE_PRICE_TEAM_SCAN ?? "",
  team_deep_dive:  process.env.STRIPE_PRICE_TEAM_DEEP_DIVE ?? "",
} as const;

export type OneTimeTier = keyof typeof STRIPE_ONE_TIME_PRICES;

export function getOneTimePriceId(tier: OneTimeTier): string {
  return STRIPE_ONE_TIME_PRICES[tier];
}

export function isOneTimeTier(tier: string): tier is OneTimeTier {
  return tier in STRIPE_ONE_TIME_PRICES;
}

export const TIER_CONFIG: Record<string, {
  name: string;
  price: number;
  isOneTime: boolean;
  includesAdvisory: boolean;
  includedCredits: number;
  level: "self" | "team" | "org";
}> = {
  self_plus: {
    name: "Self Plus",
    price: 49,
    isOneTime: true,
    includesAdvisory: false,
    includedCredits: 0,
    level: "self",
  },
  self_reflect: {
    name: "Self Reflect",
    price: 89,
    isOneTime: true,
    includesAdvisory: false,
    includedCredits: 0,
    level: "self",
  },
  team_scan: {
    name: "Team Scan",
    price: 490,
    isOneTime: true,
    includesAdvisory: false,
    includedCredits: 0,
    level: "team",
  },
  team_deep_dive: {
    name: "Team Deep Dive",
    price: 990,
    isOneTime: true,
    includesAdvisory: true,
    includedCredits: 0,
    level: "team",
  },
};

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
