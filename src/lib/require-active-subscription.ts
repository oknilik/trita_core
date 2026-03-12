import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "./prisma";
import { getOrgSubscription, hasAccess } from "./subscription";

export async function requireActiveSubscription() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { orgId: true },
  });
  if (!membership) return;

  const sub = await getOrgSubscription(membership.orgId);
  if (!hasAccess(sub)) {
    redirect("/billing/upgrade");
  }
}
