import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { getServerAuth } from "@/lib/auth-server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

type PortalRuntime = {
  auth: typeof getServerAuth;
  prisma: typeof prisma;
  getActiveOrgMembership: typeof getActiveOrgMembership;
  stripe: typeof stripe;
  checkRateLimit: typeof checkRateLimit;
  appUrl: string;
};

const defaultPortalRuntime: PortalRuntime = {
  auth: getServerAuth,
  prisma,
  getActiveOrgMembership,
  stripe,
  checkRateLimit,
  appUrl: APP_URL,
};

function getPortalRuntime(): PortalRuntime {
  const overrides = (
    globalThis as {
      __TRITA_BILLING_PORTAL_RUNTIME__?: Partial<PortalRuntime>;
    }
  ).__TRITA_BILLING_PORTAL_RUNTIME__;
  return { ...defaultPortalRuntime, ...(overrides ?? {}) };
}

export async function POST() {
  const runtime = getPortalRuntime();
  const rateLimitResponse = await runtime.checkRateLimit("billing");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await runtime.auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await runtime.prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await runtime.getActiveOrgMembership(profile.id);
  if (!membership || membership.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const sub = await runtime.prisma.subscription.findUnique({
    where: { orgId: membership.orgId },
    select: { stripeCustomerId: true },
  });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "NO_SUBSCRIPTION" }, { status: 404 });
  }

  const stripeLocale = profile.locale === "hu" ? "hu" : "en";

  const session = await runtime.stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    locale: stripeLocale,
    return_url: `${runtime.appUrl}${JOURNEY_HOME_HANDOFF_PATH}?portal=updated`,
  });

  return NextResponse.json({ url: session.url });
}
