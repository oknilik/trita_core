import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { getManageableTeamIds } from "@/lib/team-auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getOrgSubscription, hasAccess, getPlanTier } from "@/lib/subscription";
import { getCreditBalance, getCreditHistory } from "@/lib/candidate-credits";
import { HiringPaywall } from "./_components/HiringPaywall";
import { HiringDashboard } from "./_components/HiringDashboard";

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

  const isHu = locale !== "en";
  const isAdmin = hasOrgRole(memberRole, "ORG_ADMIN");

  const sub = await getOrgSubscription(orgId);

  const backLink = (
    <Link
      href={`/org/${orgId}`}
      className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-bronze"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3L5 8l5 5" />
      </svg>
      {isHu ? `Vissza · ${org.name}` : `Back · ${org.name}`}
    </Link>
  );

  if (!hasAccess(sub)) {
    return (
      <div className="min-h-dvh bg-cream">
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          {backLink}
          <HiringPaywall orgId={orgId} isHu={isHu} variant="no-subscription" isAdmin={isAdmin} />
        </main>
      </div>
    );
  }

  await requireActiveSubscription();

  const tier = getPlanTier(sub);
  const isOrgOrScale = tier === "org" || tier === "scale";

  let creditBalance: { available: number; totalPurchased: number; totalUsed: number } | null = null;
  let creditHistory: Array<{ id: string; type: string; amount: number; balance: number; note: string | null; actorId: string | null; createdAt: string }> | null = null;

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
              {backLink}
              <HiringPaywall orgId={orgId} isHu={isHu} variant="addon" planTier={tier} isAdmin={isAdmin} />
            </main>
          </div>
        );
      }
    }

    if (isAdmin) {
      creditHistory = (await getCreditHistory(orgId, 10)).map((e) => ({
        ...e,
        createdAt: e.createdAt.toISOString(),
      }));
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

  const TOTAL_QUESTIONS: Record<string, number> = { HEXACO: 60 };

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
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <Link
          href={`/org/${orgId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-ink-body transition-colors hover:text-bronze"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? `Vissza · ${org.name}` : `Back · ${org.name}`}
        </Link>

        <HiringDashboard
          orgId={orgId}
          orgName={org.name}
          teams={isAdmin ? teams : teams.filter((t) => managerTeamIds?.includes(t.id) ?? false)}
          invites={invites}
          isHu={isHu}
          locale={locale}
          planTier={tier}
          creditBalance={creditBalance}
          creditHistory={creditHistory}
          canInviteNew={canInviteNew}
          isAdmin={isAdmin}
        />
      </main>
    </div>
  );
}
