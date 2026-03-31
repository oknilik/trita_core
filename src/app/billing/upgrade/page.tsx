import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getOrgSubscription } from "@/lib/subscription";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { BillingUpgradeClient } from "./BillingUpgradeClient";

export default async function BillingUpgradePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await getActiveOrgMembership(profile.id);
  if (!membership) redirect(JOURNEY_HOME_HANDOFF_PATH);

  const sub = await getOrgSubscription(membership.orgId);

  return (
    <BillingUpgradeClient
      isAdmin={membership.role === "ORG_ADMIN"}
      subscriptionStatus={sub?.status ?? "none"}
      trialEndsAt={sub?.trialEndsAt?.toISOString() ?? null}
      alreadySetup={!!sub?.stripeSubscriptionId}
    />
  );
}
