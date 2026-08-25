import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { isStepOpenFor } from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";
import { PsychSafetyClient } from "./PsychSafetyClient";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";
import { PageState } from "@/components/ui/primitives/StatePanel";
import { assessmentPrimaryActionClass } from "@/components/assessment/AssessmentFlowShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Pszichológiai biztonság | trita", robots: { index: false } };
}

// Pszichológiai biztonság pulse kitöltő — a bejelentkezett tag aktív,
// még ki nem töltött PSYCH_SAFETY kampányát keresi meg. A válasz anonim
// (lásd /api/psych-safety/submit).
export default async function PsychSafetyPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) return redirectToSignIn();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return redirectToSignIn();

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
      <PageState
        tone="empty"
        title={t("psafety.nonePendingTitle", locale as Locale)}
        body={t("psafety.nonePendingBody", locale as Locale)}
        action={<Link
            href="/dashboard"
            className={assessmentPrimaryActionClass}
          >
            {t("psafety.backToDashboard", locale as Locale)}
          </Link>}
      />
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
