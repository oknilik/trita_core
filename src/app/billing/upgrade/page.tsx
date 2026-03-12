import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getOrgSubscription } from "@/lib/subscription";
import { BillingUpgradeClient } from "./BillingUpgradeClient";

export default async function BillingUpgradePage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { orgId: true, role: true },
  });
  if (!membership) redirect("/dashboard");

  const sub = await getOrgSubscription(membership.orgId);

  return (
    <BillingUpgradeClient
      isAdmin={membership.role === "ORG_ADMIN"}
      subscriptionStatus={sub?.status ?? "none"}
      trialEndsAt={sub?.trialEndsAt?.toISOString() ?? null}
    />
  );
}
