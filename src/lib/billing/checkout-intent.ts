export const CHECKOUT_ONE_TIME_TIERS = [
  "self_plus",
  "team_snapshot",
  "team_deep_dive",
] as const;

export const CHECKOUT_SUBSCRIPTION_PLANS = [
  "team_monthly",
  "team_annual",
  "org_monthly",
  "org_annual",
] as const;

export const CHECKOUT_CANDIDATE_PACKS = [
  "candidate_1",
  "candidate_5",
  "candidate_10",
] as const;

export type CheckoutOneTimeTier = (typeof CHECKOUT_ONE_TIME_TIERS)[number];
export type CheckoutSubscriptionPlan = (typeof CHECKOUT_SUBSCRIPTION_PLANS)[number];
export type CheckoutCandidatePack = (typeof CHECKOUT_CANDIDATE_PACKS)[number];

export type CreatePaymentRequestBody =
  | { tier: CheckoutOneTimeTier; teamId?: string }
  | { plan: CheckoutSubscriptionPlan }
  | { candidatePack: CheckoutCandidatePack }
  | { candidateQuantity: number };

export type CheckoutIntentKind = "one_time" | "subscription" | "candidate_pack";

export interface CheckoutIntentResolution {
  body: CreatePaymentRequestBody;
  kind: CheckoutIntentKind;
  warnings: string[];
}

function normalizeToken(value?: string): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function isOneTimeTier(value: string): value is CheckoutOneTimeTier {
  return (CHECKOUT_ONE_TIME_TIERS as readonly string[]).includes(value);
}

function isSubscriptionPlan(value: string): value is CheckoutSubscriptionPlan {
  return (CHECKOUT_SUBSCRIPTION_PLANS as readonly string[]).includes(value);
}

function isCandidatePack(value: string): value is CheckoutCandidatePack {
  return (CHECKOUT_CANDIDATE_PACKS as readonly string[]).includes(value);
}

export function resolveCheckoutIntent(input: {
  tier?: string;
  plan?: string;
  teamId?: string;
  qty?: string;
}): CheckoutIntentResolution {
  const rawTier = normalizeToken(input.tier);
  const rawPlan = normalizeToken(input.plan);
  const teamId = normalizeToken(input.teamId);
  const rawQty = normalizeToken(input.qty);
  const warnings: string[] = [];

  const parsedQty = rawQty ? Number.parseInt(rawQty, 10) : NaN;
  const safeCandidateQuantity = Number.isFinite(parsedQty)
    ? Math.min(50, Math.max(1, parsedQty))
    : undefined;

  if (rawTier && rawPlan) {
    warnings.push("checkout.both_plan_and_tier_present.using_tier");
  }

  if (rawTier && isOneTimeTier(rawTier)) {
    return {
      body: {
        tier: rawTier,
        ...(rawTier === "self_plus" ? {} : teamId ? { teamId } : {}),
      },
      kind: "one_time",
      warnings,
    };
  }

  if (rawTier && !isOneTimeTier(rawTier)) {
    warnings.push("checkout.invalid_tier_ignored");
  }

  if (rawPlan) {
    if (isSubscriptionPlan(rawPlan)) {
      return { body: { plan: rawPlan }, kind: "subscription", warnings };
    }

    if (isCandidatePack(rawPlan)) {
      return { body: { candidatePack: rawPlan }, kind: "candidate_pack", warnings };
    }

    if (isOneTimeTier(rawPlan)) {
      warnings.push("checkout.legacy_one_time_plan_param");
      return {
        body: {
          tier: rawPlan,
          ...(rawPlan === "self_plus" ? {} : teamId ? { teamId } : {}),
        },
        kind: "one_time",
        warnings,
      };
    }

    if (rawPlan === "candidate_custom") {
      return {
        body: { candidateQuantity: safeCandidateQuantity ?? 5 },
        kind: "candidate_pack",
        warnings,
      };
    }

    if (rawPlan === "candidate_addon") {
      warnings.push("checkout.legacy_candidate_plan_param_defaulted");
      return {
        body: { candidateQuantity: safeCandidateQuantity ?? 5 },
        kind: "candidate_pack",
        warnings,
      };
    }

    warnings.push("checkout.unknown_plan_defaulted_to_org_monthly");
  }

  return {
    body: { plan: "org_monthly" },
    kind: "subscription",
    warnings,
  };
}
