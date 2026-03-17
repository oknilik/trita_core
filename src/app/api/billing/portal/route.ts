import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

export async function POST() {
  const rateLimitResponse = await checkRateLimit("billing");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, locale: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { role: true, orgId: true },
  });
  if (!membership || membership.role !== "ORG_ADMIN") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const sub = await prisma.subscription.findUnique({
    where: { orgId: membership.orgId },
    select: { stripeCustomerId: true },
  });
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: "NO_SUBSCRIPTION" }, { status: 404 });
  }

  const stripeLocale = profile.locale === "hu" ? "hu" : "en";

  const session = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    locale: stripeLocale,
    return_url: `${APP_URL}/dashboard?portal=updated`,
  });

  return NextResponse.json({ url: session.url });
}
