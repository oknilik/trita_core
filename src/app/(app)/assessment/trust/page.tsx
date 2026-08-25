import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getCampaignTeamIds, isStepOpenFor } from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps, resolveCampaignTeamIdForUser } from "@/lib/campaign-steps";
import { TrustPeersClient } from "./TrustPeersClient";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";
import { PageState } from "@/components/ui/primitives/StatePanel";
import { assessmentPrimaryActionClass } from "@/components/assessment/AssessmentFlowShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Bizalmi háló kör | trita", robots: { index: false } };
}

// Bizalmi háló kitöltő — a bejelentkezett tag azon aktív kampányát keresi
// meg, ahol az aktuális nyitott lépése a TRUST_360. A megjelenítés pár-
// szinten összevont (vezető/tanácsadó), egyéni válasz nem jelenik meg —
// ld. src/lib/trust-network.ts fejkomment. Minta: team-roles/peers.
export default async function TrustPeersPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) return redirectToSignIn();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return redirectToSignIn();

  // Esedékes ütemezett lépések kinyitása (a látogatás maga a trigger).
  await releaseDueCampaignSteps({ userId: profile.id }).catch(() => {});

  const candidates = await prisma.campaignParticipant.findMany({
    where: {
      userId: profile.id,
      campaign: { status: "ACTIVE", steps: { has: "TRUST_360" } },
    },
    orderBy: { addedAt: "asc" },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: {
        select: { id: true, name: true, type: true, steps: true, teamId: true, teamIds: true },
      },
    },
  });
  const pending = candidates.find(
    (p) => getCampaignTeamIds(p.campaign).length > 0 && isStepOpenFor(p.campaign, p, "TRUST_360"),
  );

  // Több-csapatos kampányban a tag SAJÁT csapata a cél.
  const memberTeamId = pending
    ? await resolveCampaignTeamIdForUser(pending.campaign, profile.id)
    : null;
  if (!pending || !memberTeamId) {
    return (
      <PageState
        tone="empty"
        title={t("trustPeers.nonePendingTitle", locale as Locale)}
        body={t("trustPeers.nonePendingBody", locale as Locale)}
        action={<Link
            href="/dashboard"
            className={assessmentPrimaryActionClass}
          >
            {t("trustPeers.backToDashboard", locale as Locale)}
          </Link>}
      />
    );
  }

  const [members, rated] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: memberTeamId, userId: { not: profile.id } },
      select: {
        userId: true,
        user: { select: { id: true, username: true, email: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.trustObservation.findMany({
      where: { campaignId: pending.campaign.id, raterUserId: profile.id },
      select: { aboutUserId: true },
    }),
  ]);
  const ratedSet = new Set(rated.map((r) => r.aboutUserId));

  return (
    <main className="min-h-dvh bg-cream">
      <TrustPeersClient
        locale={locale as Locale}
        campaignId={pending.campaign.id}
        campaignName={pending.campaign.name}
        teammates={members.map((m) => ({
          userId: m.userId,
          name: m.user.username ?? m.user.email ?? m.user.id,
          done: ratedSet.has(m.userId),
        }))}
      />
    </main>
  );
}
