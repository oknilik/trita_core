import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { getCampaignTeamIds, isStepOpenFor } from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps, resolveCampaignTeamIdForUser } from "@/lib/campaign-steps";
import { TeamRolePeersClient } from "./TeamRolePeersClient";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Csapattársi visszajelzés | trita", robots: { index: false } };
}

// Csapattársi szerep-visszajelzés kitöltő — a bejelentkezett tag azon
// aktív kampányát keresi meg, ahol az aktuális nyitott lépése a
// TEAM_ROLE_360. A megjelenítés mindig aggregált (min. 3 értékelő) —
// ld. docs/product/team-role-360-plan.md.
export default async function TeamRolePeersPage() {
  const [locale, { userId }] = await Promise.all([getServerLocale(), auth()]);
  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/sign-in");

  // Esedékes ütemezett lépések kinyitása (a látogatás maga a trigger).
  await releaseDueCampaignSteps({ userId: profile.id }).catch(() => {});

  const candidates = await prisma.campaignParticipant.findMany({
    where: {
      userId: profile.id,
      campaign: { status: "ACTIVE", steps: { has: "TEAM_ROLE_360" } },
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
    (p) =>
      getCampaignTeamIds(p.campaign).length > 0 && isStepOpenFor(p.campaign, p, "TEAM_ROLE_360"),
  );

  // Több-csapatos kampányban a tag SAJÁT csapata a cél.
  const memberTeamId = pending
    ? await resolveCampaignTeamIdForUser(pending.campaign, profile.id)
    : null;
  if (!pending || !memberTeamId) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-cream px-4">
        <div className="w-full max-w-md rounded-2xl border border-sand bg-surface-card p-8 text-center shadow-sm">
          <h1 className="font-fraunces text-2xl text-ink">
            {t("teamRolePeers.nonePendingTitle", locale as Locale)}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-body">
            {t("teamRolePeers.nonePendingBody", locale as Locale)}
          </p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-[10px] bg-action-primary-bg px-6 text-caption font-semibold text-[var(--color-action-primary-fg)] transition hover:brightness-110"
          >
            {t("teamRolePeers.backToDashboard", locale as Locale)}
          </Link>
        </div>
      </main>
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
    prisma.teamRoleObservation.findMany({
      where: { campaignId: pending.campaign.id, raterUserId: profile.id },
      select: { aboutUserId: true },
    }),
  ]);
  const ratedSet = new Set(rated.map((r) => r.aboutUserId));

  return (
    <main className="min-h-dvh bg-cream">
      <TeamRolePeersClient
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
