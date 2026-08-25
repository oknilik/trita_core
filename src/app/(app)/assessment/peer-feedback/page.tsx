import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getCampaignTeamIds, isStepOpenFor } from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps, resolveCampaignTeamIdForUser } from "@/lib/campaign-steps";
import { PeerFeedbackClient } from "./PeerFeedbackClient";
import { redirectToSignIn } from "@/lib/navigation/auth-redirects.server";
import { PageState } from "@/components/ui/primitives/StatePanel";
import { assessmentPrimaryActionClass } from "@/components/assessment/AssessmentFlowShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Elismerés-kör | trita", robots: { index: false } };
}

// Kollégai visszajelzés kör kitöltő (peer feedback F3) — a bejelentkezett
// tag azon aktív kampányát keresi, ahol az aktuális nyitott lépése a
// PEER_FEEDBACK. Terv: docs/product/peer-feedback-terv.md
export default async function PeerFeedbackPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) return redirectToSignIn();

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return redirectToSignIn();

  await releaseDueCampaignSteps({ userId: profile.id }).catch(() => {});

  const candidates = await prisma.campaignParticipant.findMany({
    where: {
      userId: profile.id,
      campaign: { status: "ACTIVE", steps: { has: "PEER_FEEDBACK" } },
    },
    orderBy: { addedAt: "asc" },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: {
        select: {
          id: true,
          name: true,
          type: true,
          steps: true,
          teamId: true,
          teamIds: true,
          peerFeedbackAnonymous: true,
        },
      },
    },
  });
  const pending = candidates.find(
    (p) => getCampaignTeamIds(p.campaign).length > 0 && isStepOpenFor(p.campaign, p, "PEER_FEEDBACK"),
  );

  // Több-csapatos kampányban a tag SAJÁT csapata a cél.
  const memberTeamId = pending
    ? await resolveCampaignTeamIdForUser(pending.campaign, profile.id)
    : null;
  if (!pending || !memberTeamId) {
    return (
      <PageState
        tone="empty"
        title={t("peerFb.nonePendingTitle", locale as Locale)}
        body={t("peerFb.nonePendingBody", locale as Locale)}
        action={<Link
            href="/dashboard"
            className={assessmentPrimaryActionClass}
          >
            {t("peerFb.backToDashboard", locale as Locale)}
          </Link>}
      />
    );
  }

  const [members, given] = await Promise.all([
    prisma.teamMember.findMany({
      where: { teamId: memberTeamId, userId: { not: profile.id } },
      select: {
        userId: true,
        user: { select: { id: true, username: true, email: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.peerFeedbackItem.findMany({
      where: {
        campaignId: pending.campaign.id,
        fromUserId: profile.id,
        kind: "feedforward",
      },
      select: { toUserId: true },
    }),
  ]);
  const givenSet = new Set(given.map((g) => g.toUserId));

  return (
    <main className="min-h-dvh bg-cream">
      <PeerFeedbackClient
        locale={locale as Locale}
        campaignId={pending.campaign.id}
        campaignName={pending.campaign.name}
        anonymousMode={pending.campaign.peerFeedbackAnonymous}
        teammates={members
          .filter((m) => !givenSet.has(m.userId))
          .map((m) => ({
            userId: m.userId,
            name: m.user.username ?? m.user.email ?? m.user.id,
          }))}
        doneCount={givenSet.size}
      />
    </main>
  );
}
