import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OrgOnboardingWizard } from "./OrgOnboardingWizard";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Beállítás | trita",
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: { index: false, follow: false, noimageindex: true },
    },
  };
}

export default async function OnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { id: true, onboardedAt: true, deleted: true },
  });

  // Race condition: deleted profile still has clerkId — detach and recreate
  if (profile?.deleted) {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { clerkId: null },
    });
    await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
      },
      update: {},
    });
    return <OrgOnboardingWizard />;
  }

  // Profile may not exist yet (webhook race) — create it
  if (!profile) {
    await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
      },
      update: {},
    });
    return <OrgOnboardingWizard />;
  }

  // Already has org membership → wizard complete
  const orgMembership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
  });
  if (orgMembership) redirect("/dashboard");

  // Old-flow users (personal onboarding done, no org) → dashboard
  if (profile.onboardedAt) redirect("/dashboard");

  return <OrgOnboardingWizard />;
}
