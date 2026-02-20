import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { OnboardingClient } from "./OnboardingClient";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("meta.onboardingTitle", locale),
    robots: {
      index: false,
      follow: false,
      nocache: true,
      googleBot: {
        index: false,
        follow: false,
        noimageindex: true,
      },
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

  // Race condition: deleted profile still has clerkId set — detach it and create fresh
  if (profile?.deleted) {
    await prisma.userProfile.update({
      where: { id: profile.id },
      data: { clerkId: null },
    });
    await prisma.userProfile.create({
      data: {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
      },
    });
    return <OnboardingClient />;
  }

  if (profile?.onboardedAt) redirect("/dashboard");

  // Profile may not exist yet (webhook race) — create it
  if (!profile) {
    await prisma.userProfile.create({
      data: {
        clerkId: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? undefined,
      },
    });
  }

  return <OnboardingClient />;
}
