import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { requireOrgContext, hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getOrgPageData } from "@/lib/org-stats";
import { StatStrip } from "@/components/org/StatStrip";
import { OrgPageShell } from "@/components/org/OrgPageShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Szervezet | Trita", robots: { index: false } };
}

export default async function OrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { id: orgId }] = await Promise.all([getServerLocale(), params]);

  const { profileId, role: memberRole, org } = await requireOrgContext(orgId);
  await requireActiveSubscription();

  if (!org) notFound();

  // Org dashboard is admin-only; managers/members go to their team or dashboard
  if (!hasOrgRole(memberRole, "ORG_ADMIN")) redirect("/dashboard");

  const isAdmin = hasOrgRole(memberRole, "ORG_ADMIN");
  const isManager = hasOrgRole(memberRole, "ORG_MANAGER");
  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";

  const [pageData, members, pendingInvites, teams] = await Promise.all([
    getOrgPageData(orgId),
    prisma.organizationMember.findMany({
      where: { orgId },
      orderBy: { joinedAt: "asc" },
      select: {
        id: true,
        role: true,
        joinedAt: true,
        userId: true,
        user: { select: { id: true, email: true, username: true } },
      },
    }),
    prisma.organizationPendingInvite.findMany({
      where: { orgId },
      orderBy: { createdAt: "asc" },
      select: { id: true, email: true, role: true, createdAt: true },
    }),
    prisma.team.findMany({
      where: { orgId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        _count: { select: { members: true } },
      },
    }),
  ]);

  // Serialize dates
  const serializedMembers = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    role: m.role,
    joinedAt: m.joinedAt.toISOString(),
    user: {
      id: m.user.id,
      email: m.user.email ?? null,
      username: m.user.username ?? null,
    },
  }));

  const serializedPendingInvites = pendingInvites.map((inv) => ({
    id: inv.id,
    email: inv.email,
    role: inv.role,
    createdAt: inv.createdAt.toISOString(),
  }));

  const serializedTeams = teams.map((t) => ({
    id: t.id,
    name: t.name,
    createdAt: t.createdAt.toISOString(),
    _count: { members: t._count.members },
  }));

  // Build stat strip
  const statCells = [
    {
      label: isHu ? "Tagok" : "Members",
      value: pageData.memberCount,
      sub: pageData.pendingCount > 0
        ? `+${pageData.pendingCount} ${isHu ? "függőben" : "pending"}`
        : undefined,
      accentColor: "#3d6b5e",
    },
    {
      label: isHu ? "Csapatok" : "Teams",
      value: pageData.teamCount,
      accentColor: "#6366F1",
    },
    {
      label: isHu ? "Aktív kampány" : "Active campaigns",
      value: pageData.activeCampaignCount,
      sub: pageData.closedCampaignCount > 0
        ? `${pageData.closedCampaignCount} ${isHu ? "lezárt" : "closed"}`
        : undefined,
      accentColor: "#059669",
    },
    {
      label: isHu ? "Befejezési arány" : "Completion rate",
      value: pageData.activeTotalParticipants > 0
        ? `${Math.round((pageData.activeSelfDone / pageData.activeTotalParticipants) * 100)}%`
        : "—",
      sub: pageData.activeTotalParticipants > 0
        ? `${pageData.activeSelfDone}/${pageData.activeTotalParticipants}`
        : undefined,
      accentColor: "#F59E0B",
    },
  ];

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10">

        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-widest text-bronze">
              {isHu ? "// szervezet" : "// organization"}
            </p>
            <h1 className="mt-1 font-fraunces text-3xl text-ink md:text-4xl">
              {org.name}
            </h1>
            {org.status === "PENDING_SETUP" && (
              <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-0.5 text-xs font-semibold text-amber-700">
                {isHu ? "Beállítás folyamatban" : "Setup pending"}
              </span>
            )}
          </div>
          {isAdmin && (
            <Link
              href={`/org/${orgId}/settings`}
              className="shrink-0 inline-flex min-h-[36px] items-center gap-1.5 rounded-lg border border-sand bg-white px-3 text-xs font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
            >
              <svg
                viewBox="0 0 16 16"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="8" r="2" />
                <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" />
              </svg>
              {isHu ? "Beállítások" : "Settings"}
            </Link>
          )}
        </div>

        {/* Stat strip */}
        <StatStrip cells={statCells} />

        {/* Tabs shell */}
        <Suspense
          fallback={
            <div className="h-10 rounded-lg bg-sand/40 animate-pulse" />
          }
        >
          <OrgPageShell
            orgId={orgId}
            orgName={org.name}
            profileId={profileId}
            isAdmin={isAdmin}
            isManager={isManager}
            isHu={isHu}
            locale={locale}
            dateLocale={dateLocale}
            pageData={pageData}
            members={serializedMembers}
            pendingInvites={serializedPendingInvites}
            teams={serializedTeams}
          />
        </Suspense>

      </main>
    </div>
  );
}
