import { Prisma } from "@prisma/client";
import { candidateOrgEnabled } from "@/lib/candidate-programs/service.server";
import { t } from "@/lib/i18n";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { readCandidateProgram } from "@/lib/candidate-programs/core";
import { requireOrgContext } from "@/lib/auth";
import { getPlanTier } from "@/lib/subscription";
import { getCreditBalance } from "@/lib/candidate-credits";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { isCandidateGatingEnabled } from "@/lib/operating-mode";
import { HiringPaywall } from "./_components/HiringPaywall";
import { HiringDashboard } from "./_components/HiringDashboard";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Jelöltek | trita", robots: { index: false } };
}

// Jelölt-felület (2026-07-23 újraélesztés): csak a tanácsadói kör éri el
// (ORG_CONSULTANT / platform-tanácsadó / trita-admin). A kredit/előfizetés-
// kapu az operating-mode CANDIDATE_GATING_ENABLED kapcsolója mögött —
// jelenleg kikapcsolva.
export default async function HiringPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const [locale, { orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);

  if (!org) notFound();

  const viewer = await prisma.userProfile.findUnique({
    where: { id: profileId },
    select: { email: true, isConsultant: true },
  });
  const isConsultantView = isConsultantSurface(
    memberRole,
    viewer?.email,
    viewer?.isConsultant,
  );
  if (!isConsultantView) notFound();
  if (!(await candidateOrgEnabled(orgId)))
    return (
      <PlatformPageShell surface="team" contentClassName="max-w-3xl px-4 py-10">
        <p>{t("candidateProgram.disabled", locale)}</p>
      </PlatformPageShell>
    );

  const gating = isCandidateGatingEnabled();
  let creditBalance: {
    available: number;
    totalPurchased: number;
    totalUsed: number;
  } | null = null;
  let tier: ReturnType<typeof getPlanTier> = "team";
  let canInviteNew = true;

  if (gating) {
    const policySnapshot = await resolveOrgPolicySnapshot({
      orgId,
      orgRole: memberRole,
    });
    const candidateEvaluateDecision = resolveOrgCapabilityDecision(
      policySnapshot,
      "candidateEvaluate",
    );
    const bannerState = toOrgSubscriptionBannerState(
      policySnapshot.policy.policyState,
    );

    if (!candidateEvaluateDecision.allowed) {
      return (
        <PlatformPageShell
          surface="team"
          contentClassName="max-w-5xl gap-5 px-4 py-10"
        >
          {bannerState ? (
            <OrgSubscriptionBanner state={bannerState} locale={locale} />
          ) : null}
          <HiringPaywall
            orgId={orgId}
            locale={locale}
            variant="no-subscription"
            isAdmin={isConsultantView}
          />
        </PlatformPageShell>
      );
    }
    tier = getPlanTier(policySnapshot.subscription);
    const isOrgOrScale = tier === "org" || tier === "scale";

    if (!isOrgOrScale) {
      creditBalance = await getCreditBalance(orgId);

      if (creditBalance.available === 0) {
        const existingCount = await prisma.candidateInvite.count({
          where: { OR: [{ orgId }, { team: { orgId } }] },
        });
        if (existingCount === 0) {
          return (
            <PlatformPageShell
              surface="team"
              contentClassName="max-w-5xl px-4 py-10"
            >
              <HiringPaywall
                orgId={orgId}
                locale={locale}
                variant="addon"
                planTier={tier}
                isAdmin={isConsultantView}
              />
            </PlatformPageShell>
          );
        }
      }
    }
    canInviteNew = isOrgOrScale || (creditBalance?.available ?? 0) > 0;
  }

  // Tanácsadói felület: az org minden jelöltje látszik — az org-kötés az
  // orgId mezőn (backfill előtti sorokon a team.orgId-n) keresztül.
  const [teams, invitesRaw, baselines] = await Promise.all([
    prisma.team.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.candidateInvite.findMany({
      where: { orgId, programSnapshot: { not: Prisma.DbNull } },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        status: true,
        programSnapshot: true,
        expiresAt: true,
        createdAt: true,
        teamId: true,
        includeTeamRole: true,
        draftAnsweredCount: true,
        team: { select: { id: true, name: true } },
        result: { select: { id: true } },
      },
    }),
    prisma.teamReport.findMany({
      where: {
        orgId,
        status: "PUBLISHED",
        campaign: {
          status: "CLOSED",
          OR: [
            { programKey: "TEAM_SCAN" },
            { programKey: null, presetId: "SCAN_STYLE_V1" },
          ],
        },
      },
      select: { id: true, teamId: true, title: true, publishedAt: true },
    }),
  ]);

  const invites = invitesRaw
    .filter((inv) => readCandidateProgram(inv.programSnapshot))
    .map((inv) => ({
      id: inv.id,
      email: inv.email,
      name: inv.name,
      position: inv.position,
      status: inv.status,
      expiresAt: inv.expiresAt.toISOString(),
      createdAt: inv.createdAt.toISOString(),
      teamId: inv.teamId,
      teamName: inv.team?.name ?? null,
      hasResult: !!inv.result,
      draftAnsweredCount: inv.draftAnsweredCount,
      totalQuestions: readCandidateProgram(inv.programSnapshot)!.questionIds
        .length,
    }));

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-6 px-4 py-10"
    >
      <HiringDashboard
        orgId={orgId}
        orgName={org.name}
        teams={teams}
        baselines={baselines.map((b) => ({
          id: b.id,
          teamId: b.teamId,
          title: `${b.title} · ${b.publishedAt?.toISOString().slice(0, 10)}`,
        }))}
        invites={invites}
        locale={locale}
        planTier={gating ? tier : "org"}
        creditBalance={creditBalance}
        canInviteNew={canInviteNew}
        isAdmin={isConsultantView}
      />
    </PlatformPageShell>
  );
}
