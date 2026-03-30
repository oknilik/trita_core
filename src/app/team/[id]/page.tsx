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
import { t } from "@/lib/i18n";
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
      label: t("team.statMembers", locale),
      value: teamData.memberCount,
      sub:
        teamData.completedCount > 0
          ? `${teamData.completedCount}/${teamData.memberCount} ${t("team.statCompleted", locale)}`
          : undefined,
      accentColor: "#6366F1",
    },
    {
      label: t("team.statObserverCoverage", locale),
      value: teamData.activeCampaign
        ? `${teamData.activeCampaign.teamObserverDoneCount}/${teamData.activeCampaign.teamParticipantCount}`
        : "—",
      sub: teamData.activeCampaign
        ? undefined
        : t("team.statNoCampaign", locale),
      insight: teamData.activeCampaign
        ? t("team.statCampaignDaysActive", locale).replace("{days}", String(teamData.activeCampaign.daysActive))
        : t("team.statStartCampaign", locale),
      accentColor: "#10B981",
    },
    {
      label: t("team.statTeamStrength", locale),
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
      label: t("team.statGrowthArea", locale),
      value: teamData.bottomDim
        ? `${teamData.bottomDim.code} · ${teamData.bottomDim.value}%`
        : "—",
      sub: teamData.bottomDim ? dimLabels[teamData.bottomDim.code] : undefined,
      insight: teamData.bottomDim
        ? getDimensionInsight(teamData.bottomDim.code, teamData.bottomDim.value)
        : undefined,
      accentColor: "#3d6b5e",
    },
    {
      label: t("team.statActiveCampaign", locale),
      value: teamData.activeCampaign ? "1" : "—",
      sub: teamData.activeCampaign ? teamData.activeCampaign.name : undefined,
      insight: teamData.activeCampaign
        ? t("team.statInProgress", locale)
        : undefined,
      accentColor: "#8B5CF6",
    },
  ];

  return (
    <div className="min-h-dvh bg-cream">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-10 md:gap-10">
        {/* Hero */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{ background: "linear-gradient(135deg, #2a5244 0%, #1e3d34 60%, #1a2e28 100%)" }}
        >
          <div className="pointer-events-none absolute -right-20 -top-20 h-[280px] w-[280px] rounded-full bg-white/[0.02]" />
          <div className="px-7 pb-7 pt-8 md:px-9 md:pb-8 md:pt-10">
            <div className="mb-2 flex items-center gap-2.5">
              <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
                {t("team.detailEyebrowPrefix", locale)} · {teamData.orgName ?? ""}
              </p>
              <span
                className="rounded-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: "rgba(61,107,94,0.25)", color: "#8fd4be" }}
              >
                {teamData.memberCount} {teamData.memberCount === 1 ? t("team.memberTag", locale) : t("team.membersTag", locale)}
              </span>
            </div>

            <h1 className="mb-0.5 font-fraunces text-[34px] tracking-tight text-white">
              {teamData.teamName}
            </h1>

            <p className="mb-4 text-[11px] text-white/[0.25]">
              {t("team.createdPrefix", locale)}
              {new Date(teamData.teamCreatedAt).toLocaleDateString(dateLocale)}
              {" · "}
              {isOrgManager ? t("team.roleManager", locale) : t("team.roleMember", locale)}
            </p>

            {/* Top dim + growth area chips */}
            {(teamData.topDim || teamData.bottomDim) && (
              <div className="mb-4 flex flex-wrap items-center gap-2">
                {teamData.topDim && (
                  <>
                    <span className="text-[9px] uppercase tracking-wide text-white/[0.25]">
                      {t("team.statTeamStrength", locale)}:
                    </span>
                    <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(61,107,94,0.3)", color: "#c8e8de" }}>
                      {dimLabels[teamData.topDim.code]} · {teamData.topDim.value}%
                    </span>
                  </>
                )}
                {teamData.bottomDim && (
                  <>
                    <span className="ml-1 text-[9px] uppercase tracking-wide text-white/[0.25]">
                      {t("team.statGrowthArea", locale)}:
                    </span>
                    <span className="rounded px-2 py-0.5 text-[10px] font-medium" style={{ backgroundColor: "rgba(193,127,74,0.2)", color: "#e8a96a" }}>
                      {dimLabels[teamData.bottomDim.code]} · {teamData.bottomDim.value}%
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              {isOrgManager && teamData.orgId && (
                <Link
                  href={`/org/${teamData.orgId}?tab=campaigns`}
                  className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] bg-[#c17f4a] px-[18px] py-2 text-[11px] font-medium text-white transition hover:brightness-110"
                >
                  + {t("team.campaignButton", locale)}
                </Link>
              )}
              <Link
                href={`/org/${teamData.orgId}`}
                className="flex min-h-[44px] items-center gap-1.5 rounded-[9px] bg-white/[0.07] px-[18px] py-2 text-[11px] font-medium text-white/[0.55] transition hover:bg-white/[0.12]"
              >
                ← {t("org.backToOrg", locale)}
              </Link>
            </div>
          </div>
        </div>

        {/* Stat strip */}
        <StatStrip cells={statCells} />

        {/* Tabs */}
        <Suspense fallback={<div className="h-10 rounded-lg bg-sand/40 animate-pulse" />}>
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
