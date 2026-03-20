import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { canAccessTeam, canManageTeam } from "@/lib/team-auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getTeamPageData } from "@/lib/team-stats";
import { StatStrip } from "@/components/org/StatStrip";
import { getDimensionInsight } from "@/lib/team-insights";
import { TeamPageShell } from "@/components/team/TeamPageShell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return { title: "Team Dashboard | Trita", robots: { index: false } };
}

const DIM_LABELS_HU: Record<string, string> = {
  H: "Önzetlenség",
  E: "Érzelmi stabilitás",
  X: "Extraverzió",
  A: "Barátságosság",
  C: "Lelkiismeretesség",
  O: "Nyitottság",
};

const DIM_LABELS_EN: Record<string, string> = {
  H: "Honesty-Humility",
  E: "Emotionality",
  X: "Extraversion",
  A: "Agreeableness",
  C: "Conscientiousness",
  O: "Openness",
};

export default async function TeamDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [locale, { userId }, { id: teamId }] = await Promise.all([
    getServerLocale(),
    auth(),
    params,
  ]);

  if (!userId) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) redirect("/dashboard");

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, orgId: true },
  });
  if (!team) notFound();

  // Check org membership
  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;

  const orgMemberRole = orgMembership?.role ?? null;
  if (!orgMemberRole) redirect("/dashboard");

  // Scope: admin sees all teams, manager/member only their own
  const hasTeamAccess = await canAccessTeam(profile.id, teamId, orgMemberRole);
  if (!hasTeamAccess) redirect("/dashboard");

  const isOrgManager = await canManageTeam(profile.id, teamId, orgMemberRole);

  await requireActiveSubscription();

  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";
  const dimLabels = isHu ? DIM_LABELS_HU : DIM_LABELS_EN;

  const teamData = await getTeamPageData(teamId, locale as "hu" | "en");

  if (!teamData) notFound();

  const statCells = [
    {
      label: isHu ? "Tagok" : "Members",
      value: teamData.memberCount,
      sub:
        teamData.completedCount > 0
          ? `${teamData.completedCount}/${teamData.memberCount} ${isHu ? "kitöltötte" : "completed"}`
          : undefined,
      accentColor: "#6366F1",
    },
    {
      label: isHu ? "Observer lefedettség" : "Observer coverage",
      value: teamData.activeCampaign
        ? `${teamData.activeCampaign.teamObserverDoneCount}/${teamData.activeCampaign.teamParticipantCount}`
        : "—",
      sub: teamData.activeCampaign
        ? undefined
        : isHu
        ? "nincs aktív kampány"
        : "no active campaign",
      insight: teamData.activeCampaign
        ? isHu
          ? `${teamData.activeCampaign.daysActive} napja aktív`
          : `Active for ${teamData.activeCampaign.daysActive} days`
        : isHu
        ? "Indíts 360° kampányt az összehasonlításhoz"
        : "Start a 360° campaign to compare",
      accentColor: "#10B981",
    },
    {
      label: isHu ? "Csapat erőssége" : "Team strength",
      value: teamData.topDim
        ? `${teamData.topDim.code} · ${teamData.topDim.value}%`
        : "—",
      sub: teamData.topDim ? dimLabels[teamData.topDim.code] : undefined,
      insight: teamData.topDim
        ? getDimensionInsight(teamData.topDim.code, teamData.topDim.value)
        : undefined,
      accentColor: "#F59E0B",
    },
    {
      label: isHu ? "Fejlesztési terület" : "Growth area",
      value: teamData.bottomDim
        ? `${teamData.bottomDim.code} · ${teamData.bottomDim.value}%`
        : "—",
      sub: teamData.bottomDim ? dimLabels[teamData.bottomDim.code] : undefined,
      insight: teamData.bottomDim
        ? getDimensionInsight(teamData.bottomDim.code, teamData.bottomDim.value)
        : undefined,
      accentColor: "#c8410a",
    },
    {
      label: isHu ? "Aktív kampány" : "Active campaign",
      value: teamData.activeCampaign ? "1" : "—",
      sub: teamData.activeCampaign ? teamData.activeCampaign.name : undefined,
      insight: teamData.activeCampaign
        ? isHu ? "folyamatban" : "in progress"
        : undefined,
      accentColor: "#8B5CF6",
    },
  ];

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <StatStrip cells={statCells} />
        {/* Header */}
        <div className="mb-8">
          {/* Hero */}
          <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase tracking-widest text-[#c8410a]">
                {isHu
                  ? `// csapat · ${teamData.orgName ?? ""}`
                  : `// team · ${teamData.orgName ?? ""}`}
              </p>
              <h1 className="font-playfair text-3xl text-[#1a1814] mt-1 md:text-4xl">
                {teamData.teamName}
              </h1>
              <p className="mt-1 text-xs text-[#3d3a35]/60">
                {isHu ? "Létrehozva: " : "Created "}
                {new Date(teamData.teamCreatedAt).toLocaleDateString(
                  dateLocale
                )}
                {" · "}
                {teamData.memberCount}{" "}
                {isHu
                  ? "tag"
                  : teamData.memberCount === 1
                  ? "member"
                  : "members"}
                {" · "}
                {isOrgManager
                  ? isHu
                    ? "Menedzser"
                    : "Manager"
                  : isHu
                  ? "Tag"
                  : "Member"}
              </p>
            </div>

            {isOrgManager && teamData.orgId && (
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/org/${teamData.orgId}?tab=campaigns`}
                  className="min-h-[44px] inline-flex items-center rounded-lg border border-[#e8e4dc] bg-white px-5 text-sm font-semibold text-[#3d3a35] transition hover:border-[#c8410a]/40 hover:text-[#c8410a]"
                >
                  + {isHu ? "Kampány" : "Campaign"}
                </Link>
              </div>
            )}
          </div>
        </div>

        <Suspense fallback={null}>
          <TeamPageShell
            data={teamData}
            isOrgManager={isOrgManager}
            locale={locale}
            dateLocale={dateLocale}
            profileId={profile.id}
          />
        </Suspense>
      </main>
    </div>
  );
}
