import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { getManageableTeamIds } from "@/lib/team-auth";
import { getPlanTier } from "@/lib/subscription";
import { getCreditBalance } from "@/lib/candidate-credits";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import { HiringPaywall } from "./_components/HiringPaywall";
import { HiringDashboard } from "./_components/HiringDashboard";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Felvétel | Trita", robots: { index: false } };
}

export default async function HiringPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const [locale, { orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);

  if (!org) notFound();

  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  if (!isManager) notFound();

  const isAdmin = hasOrgRole(memberRole, "ORG_ADMIN");
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
      <div className="min-h-dvh bg-cream">
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          {bannerState ? (
            <div className="mb-5">
              <OrgSubscriptionBanner state={bannerState} locale={locale} />
            </div>
          ) : null}
          <HiringPaywall orgId={orgId} locale={locale} variant="no-subscription" isAdmin={isAdmin} />
        </main>
      </div>
    );
  }
  const tier = getPlanTier(policySnapshot.subscription);
  const isOrgOrScale = tier === "org" || tier === "scale";

  let creditBalance: { available: number; totalPurchased: number; totalUsed: number } | null = null;

  if (!isOrgOrScale) {
    creditBalance = await getCreditBalance(orgId);

    if (creditBalance.available === 0) {
      const existingCount = await prisma.candidateInvite.count({
        where: { team: { orgId } },
      });
      if (existingCount === 0) {
        return (
          <div className="min-h-dvh bg-cream">
            <main className="mx-auto w-full max-w-5xl px-4 py-10">
              <HiringPaywall orgId={orgId} locale={locale} variant="addon" planTier={tier} isAdmin={isAdmin} />
            </main>
          </div>
        );
      }
    }

  }

  const canInviteNew = isOrgOrScale || (creditBalance?.available ?? 0) > 0;

  // Managers see only candidates from teams where they have manager/admin role.
  // Admins see all org candidates.
  const managerTeamIds = isAdmin
    ? null
    : await getManageableTeamIds(profileId, orgId, memberRole);

  // Admin sees all org candidates; manager sees only theirs (by managerId or team membership).
  // manager's teamIds are org-scoped; managerId is verified-in-org.
  const inviteWhere = isAdmin
    ? { team: { orgId } }
    : {
        OR: [
          { managerId: profileId },
          ...(managerTeamIds && managerTeamIds.length > 0
            ? [{ teamId: { in: managerTeamIds } }]
            : []),
        ],
      };

  const [teams, invitesRaw] = await Promise.all([
    prisma.team.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.candidateInvite.findMany({
      where: inviteWhere,
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
        draftAnsweredCount: true,
        team: { select: { id: true, name: true } },
        result: { select: { id: true } },
      },
    }),
  ]);

  const TOTAL_QUESTIONS: Record<string, number> = { TRITAN: 60 };

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
    totalQuestions: TOTAL_QUESTIONS[inv.testType] ?? 60,
  }));

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-6 px-4 py-10"
    >
      <HiringDashboard
        orgId={orgId}
        orgName={org.name}
        teams={isAdmin ? teams : teams.filter((t) => managerTeamIds?.includes(t.id) ?? false)}
        invites={invites}
        locale={locale}
        planTier={tier}
        creditBalance={creditBalance}
        canInviteNew={canInviteNew}
        isAdmin={isAdmin}
      />
    </PlatformPageShell>
  );
}
