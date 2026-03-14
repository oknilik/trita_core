import { auth } from "@clerk/nextjs/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerLocale } from "@/lib/i18n-server";
import { hasOrgRole } from "@/lib/auth";
import { requireActiveSubscription } from "@/lib/require-active-subscription";
import { getTeamPageData } from "@/lib/team-stats";
import { StatStrip } from "@/components/org/StatStrip";
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

  // Access: any org member of the team's org
  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;

  const isOrgMember = !!orgMembership;
  const isOrgManager =
    isOrgMember && hasOrgRole(orgMembership!.role, "ORG_MANAGER");

  if (!isOrgMember) redirect("/dashboard");

  await requireActiveSubscription();

  const isHu = locale !== "en";
  const dateLocale = locale === "en" ? "en-GB" : "hu-HU";
  const dimLabels = isHu ? DIM_LABELS_HU : DIM_LABELS_EN;

  const [teamData, candidateInvitesRaw] = await Promise.all([
    getTeamPageData(teamId, locale as "hu" | "en"),
    isOrgManager
      ? prisma.candidateInvite.findMany({
          where: { teamId },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            email: true,
            position: true,
            status: true,
            expiresAt: true,
            createdAt: true,
            result: { select: { id: true } },
          },
        })
      : Promise.resolve([]),
  ]);

  if (!teamData) notFound();

  const candidateInvites = candidateInvitesRaw.map((c) => ({
    id: c.id,
    name: c.name,
    email: c.email,
    position: c.position,
    status: c.status,
    expiresAt: c.expiresAt.toISOString(),
    createdAt: c.createdAt.toISOString(),
    hasResult: !!c.result,
  }));

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
      accentColor: "#10B981",
    },
    {
      label: isHu ? "Csapat erőssége" : "Team strength",
      value: teamData.topDim
        ? `${teamData.topDim.code} · ${teamData.topDim.value}%`
        : "—",
      sub: teamData.topDim ? dimLabels[teamData.topDim.code] : undefined,
      accentColor: "#F59E0B",
    },
    {
      label: isHu ? "Fejlesztési terület" : "Growth area",
      value: teamData.bottomDim
        ? `${teamData.bottomDim.code} · ${teamData.bottomDim.value}%`
        : "—",
      sub: teamData.bottomDim ? dimLabels[teamData.bottomDim.code] : undefined,
      accentColor: "#c8410a",
    },
    {
      label: isHu ? "Aktív kampány" : "Active campaign",
      value: teamData.activeCampaign ? "1" : "—",
      sub: teamData.activeCampaign ? teamData.activeCampaign.name : undefined,
      accentColor: "#8B5CF6",
    },
  ];

  return (
    <div className="min-h-dvh bg-[#faf9f6]">
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <StatStrip cells={statCells} />
        {/* Header */}
        <div className="mb-8">
          {/* Back link */}
          <Link
            href={
              teamData.orgId
                ? `/org/${teamData.orgId}?tab=teams`
                : "/team"
            }
            className="mb-6 inline-flex items-center gap-1.5 text-sm font-semibold text-[#3d3a35] transition-colors hover:text-[#c8410a]"
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
              <path d="M10 3L5 8l5 5" />
            </svg>
            {teamData.orgId
              ? isHu
                ? "Vissza a szervezethez"
                : "Back to organization"
              : isHu
              ? "Vissza"
              : "Back"}
          </Link>

          {/* Hero */}
          <div className="mt-4 flex items-start justify-between gap-4">
            <div>
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
            candidateInvites={candidateInvites}
          />
        </Suspense>
      </main>
    </div>
  );
}
