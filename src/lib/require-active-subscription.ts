import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { hasAccess } from "./subscription";
import { getActiveOrgMembership } from "./org-context";

export async function requireActiveSubscription() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await getActiveOrgMembership(profile.id);
  // No org membership → individual user, no subscription required
  if (!membership) return;

  const org = await prisma.organization.findUnique({
    where: { id: membership.orgId },
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
          candidateCredits: true,
        },
      },
    },
  });
  const sub = org?.subscription ?? null;
  if (!hasAccess(sub)) {
    redirect("/billing/upgrade");
  }
}
