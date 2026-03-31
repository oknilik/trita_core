import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { getOrgSubscription, hasAccess } from "./subscription";
import { getActiveOrgMembership } from "./org-context";

export async function requireObserverAccess() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await getActiveOrgMembership(profile.id);
  if (membership) {
    const sub = await getOrgSubscription(membership.orgId);
    if (hasAccess(sub)) return;
  }

  redirect("/billing/upgrade");
}
