import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { normalizeJourneyIntent, setJourneyIntentForProfile } from "@/lib/journey/intent";
import { resolveJourney } from "@/lib/journey/engine";
import { OrgOnboardingWizard } from "./OrgOnboardingWizard";
import { OnboardingClient } from "./OnboardingClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Beállítás | trita" : "Setup | trita",
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
  const queryIntent = params?.intent;
  const metadataIntent = user.unsafeMetadata?.intent as string | undefined;
  const explicitIntent = normalizeJourneyIntent(queryIntent ?? metadataIntent);
  // intent forrása: query param → Clerk unsafeMetadata → default "explore"
  const intent = queryIntent ?? metadataIntent ?? "explore";

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { id: true, onboardedAt: true, deleted: true },
  });

  // Race condition: deleted profile → detach and recreate
  if (profile?.deleted) {
    await prisma.userProfile.update({ where: { id: profile.id }, data: { clerkId: null } });
    const recreated = await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: { clerkId: user.id, email: user.primaryEmailAddress?.emailAddress ?? undefined },
      update: {},
      select: { id: true },
    });
    if (explicitIntent) {
      await setJourneyIntentForProfile(recreated.id, explicitIntent);
    }
    return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
  }

  // Profile nem létezik még (webhook race) → create
  if (!profile) {
    const created = await prisma.userProfile.upsert({
      where: { clerkId: user.id },
      create: { clerkId: user.id, email: user.primaryEmailAddress?.emailAddress ?? undefined },
      update: {},
      select: { id: true },
    });
    if (explicitIntent) {
      await setJourneyIntentForProfile(created.id, explicitIntent);
    }
    return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
  }

  if (explicitIntent) {
    await setJourneyIntentForProfile(profile.id, explicitIntent);
  }

  const journey = await resolveJourney(profile.id, {
    entryIntent: explicitIntent ?? undefined,
  });
  if (
    profile.onboardedAt ||
    journey.currentContext !== "self-only" ||
    journey.home.reason === "pending_join"
  ) {
    redirect(journey.home.destination);
  }

  return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
}
