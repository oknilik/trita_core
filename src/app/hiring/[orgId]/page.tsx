import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getOrgSubscription, hasAccess } from "@/lib/subscription";
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

  const { role: memberRole, org } = await requireOrgContext(orgId);

  if (!org) notFound();

  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  if (!isManager) notFound();

  const isHu = locale !== "en";

  // Subscription check — soft paywall (show paywall UI instead of hard redirect)
  const sub = await getOrgSubscription(orgId);
  if (!hasAccess(sub)) {
    return (
      <div className="min-h-dvh bg-[#faf9f6]">
        <main className="mx-auto w-full max-w-5xl px-4 py-10">
          <Link
            href={`/org/${orgId}`}
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] transition-colors hover:text-[#c8410a]"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {isHu ? `Vissza · ${org.name}` : `Back · ${org.name}`}
          </Link>
          <HiringPaywall orgId={orgId} isHu={isHu} />
        </main>
      </div>
    );
  }

  // Gated access — active subscription required for data
  await requireActiveSubscription();

  const [teams, invitesRaw] = await Promise.all([
    prisma.team.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, name: true },
    }),
    prisma.candidateInvite.findMany({
      where: { team: { orgId } },
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
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <Link
          href={`/org/${orgId}`}
          className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] transition-colors hover:text-[#c8410a]"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {isHu ? `Vissza · ${org.name}` : `Back · ${org.name}`}
        </Link>

        <HiringDashboard
          orgId={orgId}
          orgName={org.name}
          teams={teams}
          invites={invites}
          isHu={isHu}
          locale={locale}
        />
      </main>
    </div>
  );
}
