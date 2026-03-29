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
      <main className="mx-auto w-full max-w-5xl px-4 py-10">
        <StatStrip cells={statCells} />
        {/* Header */}
        <div className="mb-8">
          {/* Hero */}
          <div className="mt-4 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase tracking-widest text-bronze">
                {`${t("team.detailEyebrowPrefix", locale)} · ${teamData.orgName ?? ""}`}
              </p>
              <h1 className="font-fraunces text-3xl text-ink mt-1 md:text-4xl">
                {teamData.teamName}
              </h1>
              <p className="mt-1 text-xs text-ink-body/60">
                {t("team.createdPrefix", locale)}
                {new Date(teamData.teamCreatedAt).toLocaleDateString(
                  dateLocale
                )}
                {" · "}
                {teamData.memberCount}{" "}
                {teamData.memberCount === 1
                  ? t("team.memberTag", locale)
                  : t("team.membersTag", locale)}
                {" · "}
                {isOrgManager
                  ? t("team.roleManager", locale)
                  : t("team.roleMember", locale)}
              </p>
            </div>

            {isOrgManager && teamData.orgId && (
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={`/org/${teamData.orgId}?tab=campaigns`}
                  className="min-h-[44px] inline-flex items-center rounded-lg border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:border-sage/40 hover:text-bronze"
                >
                  + {t("team.campaignButton", locale)}
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
