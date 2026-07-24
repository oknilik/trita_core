import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";
import { PsychSafetyClient } from "./PsychSafetyClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Pszichológiai biztonság | Trita", robots: { index: false } };
}

// Pszichológiai biztonság pulse kitöltő — a bejelentkezett tag aktív,
// még ki nem töltött PSYCH_SAFETY kampányát keresi meg. A válasz anonim
// (lásd /api/psych-safety/submit).
export default async function PsychSafetyPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  // Esedékes ütemezett lépések kinyitása (a látogatás maga a trigger).
  await releaseDueCampaignSteps({ userId: profile.id }).catch(() => {});

  // Több-lépéses kampány: az a kör tölthető, ahol a user AKTUÁLIS lépése
  // a pszichológiai biztonság (a korábbi lépéseit már teljesítette).
  const candidates = await prisma.campaignParticipant.findMany({
    where: {
      userId: profile.id,
      completedAt: null,
      campaign: {
        status: "ACTIVE",
        OR: [{ type: "PSYCH_SAFETY" }, { steps: { has: "PSYCH_SAFETY" } }],
      },
    },
    orderBy: { addedAt: "asc" },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: { select: { id: true, name: true, type: true, steps: true } },
    },
  });
  const pending = candidates.find((p) =>
    isStepOpenFor(p.campaign, p, "PSYCH_SAFETY"),
  );

  if (!pending) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-2xl border border-sand bg-white p-8 text-center shadow-sm">
          <h1 className="font-fraunces text-2xl text-ink">
            {t("psafety.nonePendingTitle", locale as Locale)}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-body">
            {t("psafety.nonePendingBody", locale as Locale)}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-white transition hover:brightness-110"
          >
            {t("psafety.backToDashboard", locale as Locale)}
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-cream">
      <PsychSafetyClient
        locale={locale as Locale}
        campaignId={pending.campaign.id}
        campaignName={pending.campaign.name}
      />
    </main>
  );
}
