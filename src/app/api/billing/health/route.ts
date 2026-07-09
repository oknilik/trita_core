import { NextResponse } from "next/server";

type CheckGroup = Record<string, boolean>;

function evaluateGroup(group: CheckGroup): {
  checks: CheckGroup;
  allOk: boolean;
  missing: string[];
} {
  const missing = Object.entries(group)
    .filter(([, value]) => !value)
    .map(([key]) => key);
  return { checks: group, allOk: missing.length === 0, missing };
}

export async function GET() {
  const required = evaluateGroup({
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripePublishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    appUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    stripePriceTeamMonthly: !!process.env.STRIPE_PRICE_TEAM_MONTHLY,
    stripePriceTeamAnnual: !!process.env.STRIPE_PRICE_TEAM_ANNUAL,
    stripePriceOrgMonthly: !!process.env.STRIPE_PRICE_ORG_MONTHLY,
    stripePriceOrgAnnual: !!process.env.STRIPE_PRICE_ORG_ANNUAL,
  });

  const optional = evaluateGroup({
    stripePriceSelfPlus: !!process.env.STRIPE_PRICE_SELF_PLUS,
    stripePriceTeamSnapshot: !!process.env.STRIPE_PRICE_TEAM_SNAPSHOT,
    stripePriceTeamDeepDive: !!process.env.STRIPE_PRICE_TEAM_DEEP_DIVE,
    stripePriceExtraSeatMonthly: !!process.env.STRIPE_PRICE_EXTRA_SEAT_MONTHLY,
    stripePriceExtraSeatAnnual: !!process.env.STRIPE_PRICE_EXTRA_SEAT_ANNUAL,
  });

  const status = required.allOk
    ? optional.allOk
      ? "ok"
      : "degraded_optional"
    : "missing_config";

  return NextResponse.json(
    {
      status,
      required: required.checks,
      optional: optional.checks,
      missing: {
        required: required.missing,
        optional: optional.missing,
      },
    },
    { status: required.allOk ? 200 : 503 },
  );
}

