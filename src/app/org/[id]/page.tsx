import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
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
      label: t("org.membersLabel", locale),
      value: pageData.memberCount,
      sub: pageData.pendingCount > 0
        ? `+${pageData.pendingCount} ${t("org.pendingSuffix", locale)}`
        : undefined,
      accentColor: "#3d6b5e",
    },
    {
      label: t("org.teamsLabel", locale),
      value: pageData.teamCount,
      accentColor: "#6366F1",
    },
    {
      label: t("org.activeCampaigns", locale),
      value: pageData.activeCampaignCount,
      sub: pageData.closedCampaignCount > 0
        ? `${pageData.closedCampaignCount} ${t("org.closedSuffix", locale)}`
        : undefined,
      accentColor: "#059669",
    },
    {
      label: t("org.completionRate", locale),
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

        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2a2740 60%, #1e1b2e 100%)" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />
          <div className="px-7 pb-7 pt-8 md:px-9 md:pb-8 md:pt-10">
            <div className="mb-2 flex items-center gap-2.5">
              <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
                {t("org.eyebrow", locale)}
              </p>
              {org.status === "PENDING_SETUP" && (
                <span className="rounded-md bg-amber-500/20 px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-amber-300">
                  {t("org.setupPending", locale)}
                </span>
              )}
            </div>

            <h1 className="mb-0.5 font-fraunces text-[34px] tracking-tight text-white">
              {org.name}
            </h1>

            <p className="mb-4 text-[11px] text-white/[0.25]">
              {pageData.memberCount} {t("org.membersLabel", locale)}
              {" · "}
              {pageData.teamCount} {t("org.teamsLabel", locale)}
              {pageData.activeCampaignCount > 0 && (
                <> · {pageData.activeCampaignCount} {t("org.activeCampaigns", locale)}</>
              )}
            </p>

            {/* Summary chips */}
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(61,107,94,0.3)", color: "#c8e8de" }}>
                {pageData.memberCount} {t("org.membersLabel", locale)}
              </span>
              <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}>
                {pageData.teamCount} {t("org.teamsLabel", locale)}
              </span>
              {pageData.activeCampaignCount > 0 && (
                <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(16,185,129,0.2)", color: "#6ee7b7" }}>
                  {pageData.activeCampaignCount} {t("org.activeCampaigns", locale)}
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              {isAdmin && (
                <Link
                  href={`/org/${orgId}/settings`}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] bg-white/[0.07] px-[18px] py-2 text-[11px] font-medium text-white/[0.55] transition hover:bg-white/[0.12]"
                >
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="8" cy="8" r="2" />
                    <path d="M8 2v1M8 13v1M2 8h1M13 8h1M3.5 3.5l.7.7M11.8 11.8l.7.7M3.5 12.5l.7-.7M11.8 4.2l.7-.7" />
                  </svg>
                  {t("org.settingsLink", locale)}
                </Link>
              )}
            </div>
          </div>
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
