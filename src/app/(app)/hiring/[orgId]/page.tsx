import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { TestType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { getTestConfig } from "@/lib/questions";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
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

  const gating = isCandidateGatingEnabled();
  let creditBalance: { available: number; totalPurchased: number; totalUsed: number } | null = null;
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
    const bannerState = toOrgSubscriptionBannerState(policySnapshot.policy.policyState);

    if (!candidateEvaluateDecision.allowed) {
      return (
        <PlatformPageShell surface="team" contentClassName="max-w-5xl gap-5 px-4 py-10">
          {bannerState ? (
            <OrgSubscriptionBanner state={bannerState} locale={locale} />
          ) : null}
          <HiringPaywall orgId={orgId} locale={locale} variant="no-subscription" isAdmin={isConsultantView} />
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
            <PlatformPageShell surface="team" contentClassName="max-w-5xl px-4 py-10">
              <HiringPaywall orgId={orgId} locale={locale} variant="addon" planTier={tier} isAdmin={isConsultantView} />
            </PlatformPageShell>
          );
        }
      }
    }
    canInviteNew = isOrgOrScale || (creditBalance?.available ?? 0) > 0;
  }

  // Tanácsadói felület: az org minden jelöltje látszik — az org-kötés az
  // orgId mezőn (backfill előtti sorokon a team.orgId-n) keresztül.
  const [teams, invitesRaw] = await Promise.all([
    prisma.team.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.candidateInvite.findMany({
      where: { OR: [{ orgId }, { team: { orgId } }] },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        position: true,
        status: true,
        testType: true,
        expiresAt: true,
        createdAt: true,
        teamId: true,
        includeTeamRole: true,
        draftAnsweredCount: true,
        team: { select: { id: true, name: true } },
        result: { select: { id: true } },
      },
    }),
  ]);

  // A nevező FORMA-TUDATOS (2026-08-11, fix): a jelölt-flow a
  // DEFAULT_ASSESSMENT_FORM kérdéslistáját kapja (apply/page.tsx), a
  // haladás-nevező ugyanabból a konfigból jön — a korábbi fix 60 a forma
  // váltásakor némán hazudott volna. A progress-végpont ugyanerre a plafonra
  // vágja a tárolt számlálót, tehát "500/60" szerkezetileg nem létezhet.
  const totalQuestionsFor = (testType: string): number => {
    try {
      return getTestConfig(testType as TestType, locale, DEFAULT_ASSESSMENT_FORM)
        .questions.length;
    } catch {
      return 60;
    }
  };

  const invites = invitesRaw.map((inv) => ({
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
    totalQuestions: totalQuestionsFor(inv.testType),
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
