import { NextResponse } from "next/server";

export async function GET() {
  const checks = {
    stripeSecretKey: !!process.env.STRIPE_SECRET_KEY,
    stripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
    stripePriceTeamMonthly: !!process.env.STRIPE_PRICE_TEAM_MONTHLY,
    stripePriceOrgMonthly: !!process.env.STRIPE_PRICE_ORG_MONTHLY,
  };

  const allOk = Object.values(checks).every(Boolean);

  return NextResponse.json(
    { status: allOk ? "ok" : "missing_config", checks },
    { status: allOk ? 200 : 503 }
  );
}
