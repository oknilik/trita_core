import { isConsultingLed } from "@/lib/operating-mode";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { applyConsultantInviteIfAny } from "@/lib/consultant-invites";
import { getServerLocale } from "@/lib/i18n-server";
import { getServerAuth } from "@/lib/auth-server";
import { normalizeJourneyIntent, setJourneyIntentForProfile } from "@/lib/journey/intent";
import { resolveJourney } from "@/lib/journey/engine";
import { resolveStaffDestination } from "@/lib/journey/guardrails.server";
import { OrgOnboardingWizard } from "./OrgOnboardingWizard";
import { OnboardingClient } from "./OnboardingClient";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: locale === "hu" ? "Beállítás | trita" : "Setup | trita",
    robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false, noimageindex: true } },
  };
}


/**
 * Idempotens profil-létrehozás: párhuzamos kérések (dev double-render,
 * layout + page egyidejű futása, webhook-verseny) esetén az upsert
 * unique-constraint hibára futhat — ilyenkor a másik kérés által már
 * létrehozott profilt olvassuk vissza, nem hibázunk.
 */
async function ensureProfile(clerkId: string, email?: string) {
  let profile: { id: string };
  try {
    profile = await prisma.userProfile.upsert({
      where: { clerkId },
      create: { clerkId, email },
      update: {},
      select: { id: true },
    });
  } catch (err) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") {
      const existing = await prisma.userProfile.findUnique({
        where: { clerkId },
        select: { id: true },
      });
      if (existing) {
        profile = existing;
      } else {
        throw err;
      }
    } else {
      throw err;
    }
  }
  // Tanácsadó-meghívó alkalmazása email-egyezésnél (idempotens).
  await applyConsultantInviteIfAny(profile.id, email).catch(() => {});
  return profile;
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ intent?: string; source?: string }>;
}) {
  const [{ userId }, user] = await Promise.all([getServerAuth(), currentUser()]);
  if (!userId) return redirectToSignIn();

  const params = await searchParams;
  const queryIntent = params?.intent;
  const metadataIntent = user?.unsafeMetadata?.intent as string | undefined;
  const explicitIntent = normalizeJourneyIntent(queryIntent ?? metadataIntent);
  // intent forrása: query param → Clerk unsafeMetadata → default "explore".
  // Consulting-led módban a "team" intent NEM nyitja a self-serve
  // org-létrehozó wizardot (régi mélylinkek biztonságosan a személyes
  // onboardingra esnek) — org kizárólag admin/tanácsadói úton jön létre.
  const rawIntent = queryIntent ?? metadataIntent ?? "explore";
  const intent = isConsultingLed() && rawIntent === "team" ? "explore" : rawIntent;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      onboardedAt: true,
      deleted: true,
      assessmentResults: {
        where: { isSelfAssessment: true },
        select: { id: true },
        take: 1,
      },
    },
  });

  // Race condition: deleted profile → detach and recreate
  if (profile?.deleted) {
    await prisma.userProfile.update({ where: { id: profile.id }, data: { clerkId: null } });
    const recreated = await ensureProfile(
      userId,
      user?.primaryEmailAddress?.emailAddress ?? undefined,
    );
    if (explicitIntent) {
      await setJourneyIntentForProfile(recreated.id, explicitIntent);
    }
    return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
  }

  // Profile nem létezik még (webhook race) → create
  if (!profile) {
    const created = await ensureProfile(
      userId,
      user?.primaryEmailAddress?.emailAddress ?? undefined,
    );
    if (explicitIntent) {
      await setJourneyIntentForProfile(created.id, explicitIntent);
    }
    return intent === "team" ? <OrgOnboardingWizard /> : <OnboardingClient />;
  }

  if (explicitIntent) {
    await setJourneyIntentForProfile(profile.id, explicitIntent);
  }

  // Platform-stáb (admin/tanácsadó): a kész onboarding után egyből a
  // munkafelületére — nincs teszt-kapu.
  if (profile.onboardedAt) {
    const staffDestination = await resolveStaffDestination(profile.id);
    if (staffDestination) redirect(staffDestination);
  }

  const journey = await resolveJourney(profile.id, {
    entryIntent: explicitIntent ?? undefined,
    entryPoint: "onboarding_page",
  });
  if (
    profile.onboardedAt ||
    journey.currentContext !== "self-only" ||
    journey.reason === "pending_join"
  ) {
    redirect(journey.destination);
  }

  const isClaimActivation =
    params?.source === "claim" && profile.assessmentResults.length > 0;

  return intent === "team" ? (
    <OrgOnboardingWizard />
  ) : (
    <OnboardingClient variant={isClaimActivation ? "claim" : "full"} />
  );
}
