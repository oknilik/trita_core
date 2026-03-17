import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { hasAccess } from "./subscription";

export async function requireActiveSubscription() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  // Single query: profile → membership → org → subscription
  const result = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      orgMemberships: {
        take: 1,
        select: {
          orgId: true,
          org: {
            select: {
              subscription: {
                select: {
                  status: true,
                  trialEndsAt: true,
                  currentPeriodEnd: true,
                  cancelAtPeriodEnd: true,
                  stripeCustomerId: true,
                  stripeSubscriptionId: true,
                  stripePriceId: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!result) redirect("/sign-in");

  const membership = result.orgMemberships[0];
  // No org membership → individual user, no subscription required
  if (!membership) return;

  const sub = membership.org.subscription;
  if (!hasAccess(sub)) {
    redirect("/billing/upgrade");
  }
}
