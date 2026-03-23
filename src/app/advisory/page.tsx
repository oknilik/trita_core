import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getOrgSubscription, getPlanTier, hasAccess } from "@/lib/subscription";
import { getServerLocale } from "@/lib/i18n-server";
import { AdvisoryPageClient, type AdvisoryTier } from "./AdvisoryPageClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Advisory | Trita", robots: { index: false } };
}

export default async function AdvisoryPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);

  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) redirect("/dashboard");

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: {
      role: true,
      org: {
        select: {
          id: true,
          name: true,
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
          teams: {
            where: {
              members: { some: { userId: profile.id } },
            },
            select: {
              id: true,
              name: true,
              _count: { select: { members: true } },
            },
          },
        },
      },
    },
  });

  // Determine tier — maps getPlanTier() to advisory page tiers:
  //   none/trialing → "trial"  (trial CTA + founding offer)
  //   team          → "essentials" (upgrade to advisory CTA)
  //   org           → "advisory"  (1-click consultation request)
  //   scale         → "custom"    (bespoke CTA)
  let tier: AdvisoryTier = "none";
  if (membership) {
    const sub = membership.org.subscription;
    if (!sub) {
      tier = "none";
    } else if (sub.status === "trialing") {
      tier = "trial";
    } else {
      const planTier = getPlanTier(sub);
      if (planTier === "team") tier = "essentials";
      else if (planTier === "org") tier = "advisory";
      else if (planTier === "scale") tier = "custom";
      else tier = "none";
    }
  }

  const isHu = locale !== "en";
  const displayName = profile.username ?? profile.email ?? "";
  const org = membership?.org;

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <AdvisoryPageClient
          userName={displayName}
          orgName={org?.name ?? ""}
          tier={tier}
          isHu={isHu}
          teams={(org?.teams ?? []).map((t) => ({
            id: t.id,
            name: t.name,
            memberCount: t._count.members,
          }))}
        />
      </main>
    </div>
  );
}
