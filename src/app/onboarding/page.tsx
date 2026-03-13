import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { OrgOnboardingWizard } from "./OrgOnboardingWizard";
import { OnboardingClient } from "./OnboardingClient";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Beállítás | trita",
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const params = await searchParams;
  // intent forrása: query param → Clerk unsafeMetadata → default "explore"
  const intent =
    params?.intent ??
    (user.unsafeMetadata?.intent as string | undefined) ??
    "explore";

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { id: true, onboardedAt: true, deleted: true },
  });

  // Race condition: deleted profile → detach and recreate
  if (profile?.deleted) {
    await prisma.userProfile.update({ where: { id: profile.id }, data: { clerkId: null } });
    await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: { clerkId: user.id, email: user.primaryEmailAddress?.emailAddress ?? undefined },
      update: {},
    });
    return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
  }

  // Profile nem létezik még (webhook race) → create
  if (!profile) {
    await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: { clerkId: user.id, email: user.primaryEmailAddress?.emailAddress ?? undefined },
      update: {},
    });
    return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
  }

  // Már van org tagság → wizard kész
  const orgMembership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
  });
  if (orgMembership) redirect("/dashboard");

  // Régi flow (personal onboarding kész, nincs org) → dashboard
  if (profile.onboardedAt) redirect("/dashboard");

  return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
}
