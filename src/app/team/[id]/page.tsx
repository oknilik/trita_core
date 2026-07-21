import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { t, tf } from "@/lib/i18n";
import { canAccessTeam, canManageTeam, canViewRawTeamResults } from "@/lib/team-auth";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import {
  getCurrentStepType,
  isStepGateOpen,
  CAMPAIGN_STEP_LABELS,
  CAMPAIGN_STEP_LINKS,
  isCampaignStepType,
} from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";
import { getCapabilityGateCopy } from "@/lib/policy-ux";
import { getTeamPageData } from "@/lib/team-stats";
import { buildTeamPeerRoleProfiles } from "@/lib/team-role-peer.server";
import { createTeamDashboardIA } from "@/lib/dashboard/ia-contract";
import {
  DashboardMetricCard,
  DashboardPanel,
  DashboardSectionHeader,
} from "@/components/dashboard/DashboardPrimitives";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { SurfaceHero, SURFACE_HERO_THEME } from "@/components/ui/patterns/SurfaceHero";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import { getAvatarGradient, getAvatarMonogram } from "@/lib/ui/avatar";
import {
  resolveOrgCapabilityDecision,
  resolveOrgPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import { TeamProfileTab } from "@/components/team/TeamProfileTab";
import { TeamMembersTab } from "@/components/team/TeamMembersTab";
import { ObserverApprovalCard } from "@/components/team/ObserverApprovalCard";
import { TeamIntelligence } from "@/components/team/TeamIntelligence";
import type { DynamicsEdge, IntelligenceMember } from "@/components/team/TeamIntelligence";
import { TeamRoleSection } from "@/components/team/TeamRoleSection";
import { TeamRoleRoundCard } from "@/components/team/TeamRoleRoundCard";
import { TeamReportEditor } from "@/components/team/TeamReportEditor";
import { TeamMeasurementTimeline } from "@/components/team/TeamMeasurementTimeline";
import { TeamReportView } from "@/components/team/TeamReportView";
import { getLatestPublishedReport, listTeamReports } from "@/lib/team-report";
import {
  buildTeamIntelligenceEvidence,
  buildTeamIntelligencePriorities,
  MIN_INTELLIGENCE_ASSESSMENTS,
  resolveContributionPlacement,
  resolveTeamIntelligenceQuality,
  resolveTeamTabRedirect,
} from "@/lib/team-intelligence";

export const dynamic = "force-dynamic";

const TEAM_TAB_KEYS = [
  "overview",
  "intelligence",
  "profile",
  "members",
  "teamRole",
  "report",
] as const;

type TeamTabKey = (typeof TEAM_TAB_KEYS)[number];

const ZONE_NAMES_EN: Record<string, string> = {
  "3_1": "Emerging talent",
  "3_2": "High growth",
  "3_3": "Future leader",
  "2_1": "Developing",
  "2_2": "Solid contributor",
  "2_3": "High performer",
  "1_1": "Development focus",
  "1_2": "Stable contributor",
  "1_3": "Senior expert",
};

const ZONE_NAMES_HU: Record<string, string> = {
  "3_1": "Feltörekvő tehetség",
  "3_2": "Magas növekedés",
  "3_3": "Jövő vezetője",
  "2_1": "Fejlődik",
  "2_2": "Megbízható tag",
  "2_3": "Kiváló teljesítő",
  "1_1": "Fejlesztési fókusz",
  "1_2": "Stabil hozzájáruló",
  "1_3": "Senior szakértő",
};

function getZoneName(skill: 1 | 2 | 3, potential: 1 | 2 | 3, isHu: boolean): string {
  const names = isHu ? ZONE_NAMES_HU : ZONE_NAMES_EN;
  return names[`${potential}_${skill}`] ?? (isHu ? "Megbízható tag" : "Solid contributor");
}

function isTeamTab(tab: string | undefined): tab is TeamTabKey {
  if (!tab) return false;
  return TEAM_TAB_KEYS.includes(tab as TeamTabKey);
}

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getServerLocale();
  return {
    title: t("teamDetail.metaTitle", locale),
    robots: { index: false },
  };
}

export default async function TeamDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const [locale, { userId }, { id: teamId }, resolvedSearchParams] = await Promise.all([
    getServerLocale(), getServerAuth(), params, searchParams,
  ]);
  const requestedTab = resolvedSearchParams.tab;
  const teamTabRedirect = resolveTeamTabRedirect(requestedTab);
  if (teamTabRedirect) {
    redirect(`/team/${teamId}?tab=${teamTabRedirect}`);
  }
  const activeTab: TeamTabKey = isTeamTab(requestedTab)
    ? requestedTab
    : "overview";
  if (!userId) redirect("/sign-in");

  await requireOnboardedByClerkId(userId);

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId }, select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);
  const deepLinkFallback = await resolveJourneyFallbackForProfileId(profile.id);

  const team = await prisma.team.findUnique({
    where: { id: teamId }, select: { id: true, name: true, orgId: true },
  });
  if (!team) notFound();

  const orgMembership = team.orgId
    ? await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
        select: { role: true },
      })
    : null;
  const orgMemberRole = orgMembership?.role ?? null;
  if (!orgMemberRole) redirect(deepLinkFallback);

  // A néző következő nyitott mérés-lépése a csapat aktív kampányaiban
  // (több-lépéses kampány: a lépések sorban nyílnak meg).
  // Esedékes ütemezett lépések kinyitása (a látogatás maga a trigger).
  await releaseDueCampaignSteps({ userId: profile.id }).catch(() => {});

  const stepCandidates = await prisma.campaignParticipant.findMany({
    where: {
      userId: profile.id,
      campaign: { teamId, status: "ACTIVE" },
    },
    orderBy: { addedAt: "asc" },
    select: {
      currentStep: true,
      nextStepOpensAt: true,
      campaign: { select: { name: true, type: true, steps: true } },
    },
  });
  const pendingMeasurement = stepCandidates
    .map((p) => {
      const stepType = getCurrentStepType(p.campaign, p);
      return stepType && isCampaignStepType(stepType)
        ? {
            campaignName: p.campaign.name,
            stepType,
            // Ütemezett (még zárt) lépés: időpontot mutatunk CTA helyett.
            opensAt: !isStepGateOpen(p) ? p.nextStepOpensAt : null,
          }
        : null;
    })
    .find((v): v is NonNullable<typeof v> => v !== null) ?? null;
  const orgId = team.orgId;
  if (!orgId) redirect(deepLinkFallback);

  const hasTeamAccess = await canAccessTeam(profile.id, teamId, orgMemberRole);
  if (!hasTeamAccess) redirect(deepLinkFallback);
  // Tanácsadói felület: ORG_CONSULTANT szerep VAGY platform-admin fiók
  // (konzultáció-vezérelt működés — lásd lib/measurement-auth.ts).
  const canViewRaw =
    canViewRawTeamResults(orgMemberRole) ||
    profile.isConsultant ||
    isPlatformAdminEmail(profile.email);
  // Raw-result tabs are consultant-only; everyone else gets the progress view.
  if (!canViewRaw && (activeTab === "intelligence" || activeTab === "profile" || activeTab === "teamRole")) {
    redirect(`/team/${teamId}?tab=overview`);
  }

  const publishedReport = await getLatestPublishedReport(teamId);
  if (!canViewRaw && activeTab === "report" && !publishedReport) {
    redirect(`/team/${teamId}?tab=overview`);
  }
  const isOrgManager = await canManageTeam(profile.id, teamId, orgMemberRole);
  const isHu = locale !== "en";
  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: orgMemberRole,
    teamId,
    hasTeamMembership: true,
  });
  const policy = policySnapshot.policy;
  const manageDecision = resolveOrgCapabilityDecision(policySnapshot, "manage");

  const isRestricted = toOrgSubscriptionBannerState(policy.policyState) === "restricted";
  const isNone = toOrgSubscriptionBannerState(policy.policyState) === "none";
  const isFrozen = policy.policyState === "frozen";
  const canManageTeamActions = isOrgManager && policy.capabilities.has("manage");
  const manageGateCopy =
    isOrgManager && !canManageTeamActions
      ? getCapabilityGateCopy({
          locale,
          reason: manageDecision.reason,
          upgradeHintCode: manageDecision.upgradeHint?.code,
        })
      : null;

  if (isFrozen) {
    const [memberCount, pendingInviteCount] = await Promise.all([
      prisma.teamMember.count({ where: { teamId } }),
      prisma.teamPendingInvite.count({ where: { teamId } }),
    ]);

    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-4xl gap-6 px-4 py-10"
      >
        <OrgSubscriptionBanner state="frozen" locale={locale} />
        <DashboardPanel className="p-6">
          <p className="font-mono text-xs uppercase tracking-widest text-muted">
            {isHu ? "Csapat összegző" : "Team summary"}
          </p>
          <h1 className="mt-2 font-fraunces text-3xl text-ink">{team.name}</h1>
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DashboardMetricCard
              accent="#66455d"
              title={isHu ? "Tagok" : "Members"}
              value={String(memberCount)}
              sub={isHu ? "Aktív csapattagok" : "Active team members"}
            />
            <DashboardMetricCard
              accent="#a66a8c"
              title={isHu ? "Függő meghívók" : "Pending invites"}
              value={String(pendingInviteCount)}
              sub={isHu ? "Még el nem fogadott meghívások" : "Invites waiting for acceptance"}
            />
          </div>
        </DashboardPanel>
      </PlatformPageShell>
    );
  }

  const teamData = await getTeamPageData(teamId, locale as "hu" | "en");
  if (!teamData) notFound();

  const intelligenceMembers: IntelligenceMember[] = teamData.members.map((m) => {
    const tritan = m.scores
      ? {
          INTE: Math.round(m.scores.INTE ?? 50),
          RESO: Math.round(m.scores.RESO ?? 50),
          TEMP: Math.round(m.scores.TEMP ?? 50),
          ADAP: Math.round(m.scores.ADAP ?? 50),
          THOR: Math.round(m.scores.THOR ?? 50),
          OPEN: Math.round(m.scores.OPEN ?? 50),
        }
      : { INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50 };

    const placement = resolveContributionPlacement(tritan);

    return {
      id: m.userId,
      name: m.displayName,
      initials: getAvatarMonogram(m.displayName, { length: 2 }),
      tritan,
      hasAssessmentData: !!m.scores,
      skillLevel: placement.skillLevel,
      growthPotential: placement.growthPotential,
      deliveryScore: placement.deliveryScore,
      growthScore: placement.growthScore,
      placementConfidence: placement.confidence,
      zone: !m.scores
        ? t("teamComp.noDataZone", locale)
        : getZoneName(placement.skillLevel, placement.growthPotential, isHu),
      color: getAvatarGradient(m.displayName)[0],
      textColor: "var(--color-neutral-white)",
    };
  });
  const assessedCount = intelligenceMembers.filter((m) => m.hasAssessmentData).length;
  const totalCount = intelligenceMembers.length;
  const teamDynamicsEdges: DynamicsEdge[] = teamData.dynamicsEdges.map((edge) => ({
    from: edge.fromUserId,
    to: edge.toUserId,
    type: edge.type as DynamicsEdge["type"],
    source: edge.source,
  }));
  const hasDynamicsData = teamDynamicsEdges.length > 0;
  const mapQuality = resolveTeamIntelligenceQuality(assessedCount, totalCount);
  const intelligenceEvidenceBySub = buildTeamIntelligenceEvidence({
    assessedCount,
    totalCount,
    hasDynamicsData,
    locale: locale as "hu" | "en",
  });
  const intelligencePriorities = buildTeamIntelligencePriorities({
    members: teamData.members,
    completedCount: teamData.completedCount,
    memberCount: teamData.memberCount,
    teamId,
    orgId: teamData.orgId,
    hasObserverRound: !!teamData.activeCampaign,
    canManageTeamActions,
    locale: locale as "hu" | "en",
  });
  const minimumIntelligenceAssessments = MIN_INTELLIGENCE_ASSESSMENTS;
  const missingForStableIntelligence = Math.max(minimumIntelligenceAssessments - assessedCount, 0);
  const hasSufficientIntelligenceData = assessedCount >= minimumIntelligenceAssessments;
  const membersWithoutAssessment = teamData.members.filter((member) => !member.scores);
  const intelligenceQualityLabel =
    mapQuality === "sufficient"
      ? isHu ? "elegendő adat" : "sufficient data"
      : mapQuality === "partial"
        ? isHu ? "részleges adat" : "partial data"
        : isHu ? "nincs adat" : "no data";
  const dynamicsStateLabel =
    teamDynamicsEdges.length > 0
      ? (isHu ? "profil becslés" : "profile estimate")
      : (isHu ? "nincs adat" : "no data");
  const backToOverviewLabel = isHu ? "Vissza a csapatkép áttekintéshez" : "Back to team overview";
  const supportingViews = [
    {
      key: "profile" as const,
      title: t("teamComp.tabProfile", locale),
      description: isHu
        ? "Személyiség-heatmap és csapat-szintű elemzés."
        : "Personality heatmap and team-level analysis.",
      badge: teamData.completedCount > 0 ? teamData.completedCount : undefined,
    },
    {
      key: "members" as const,
      title: t("teamComp.tabMembers", locale),
      description: isHu
        ? "Taglista, meghívók és kitöltési állapot."
        : "Members, invites and completion status.",
      badge: teamData.memberCount + teamData.pendingInvites.length,
    },
    {
      key: "teamRole" as const,
      title: isHu ? "Csapatszerepek" : "Team roles",
      description: isHu
        ? "Csapatszerepek és csapaton belüli egyensúly."
        : "Team-role balance and role-distribution details.",
      badge: undefined as number | undefined,
    },
  ];

  // ── Profile tab: heatmap + insights ──────────────────────────────────────
  if (activeTab === "profile") {
    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <Link
          href={`/team/${teamId}?tab=overview`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {backToOverviewLabel}
        </Link>
        <TeamProfileTab
          heatmapRows={teamData.heatmapRows}
          dimConfigs={teamData.dimConfigs}
          locale={locale}
          isHu={isHu}
        />
      </PlatformPageShell>
    );
  }

  // ── Members tab: member list + invites + invite form ────────────────────
  if (activeTab === "members") {
    const membersForTab = teamData.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      displayName: m.displayName,
      email: m.email,
      role: m.role,
      joinedAt: m.joinedAt,
      hasAssessment: m.scores !== null,
      testType: m.testType,
    }));
    const pendingForTab = teamData.pendingInvites.map((inv) => ({
      id: inv.id,
      email: inv.email,
      createdAt: inv.createdAt,
    }));

    // Jóváhagyásra váró külső observer-meghívók (a csapat kampányaiban) —
    // csak a jóváhagyó kör látja (menedzser / org admin / tanácsadó).
    const pendingApprovals =
      isOrgManager || canViewRaw
        ? (
            await prisma.observerInvitation.findMany({
              where: {
                status: "AWAITING_APPROVAL",
                campaign: { teamId },
              },
              orderBy: { createdAt: "asc" },
              select: {
                id: true,
                observerEmail: true,
                observerName: true,
                createdAt: true,
                inviter: { select: { username: true, email: true } },
                campaign: { select: { name: true } },
              },
            })
          ).map((inv) => ({
            id: inv.id,
            inviterName: inv.inviter.username ?? inv.inviter.email ?? "—",
            targetLabel: inv.observerName ?? inv.observerEmail ?? "—",
            createdAt: inv.createdAt.toISOString(),
            campaignName: inv.campaign?.name ?? "",
          }))
        : [];

    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <Link
          href={`/team/${teamId}?tab=overview`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {backToOverviewLabel}
        </Link>
        {pendingApprovals.length > 0 ? (
          <ObserverApprovalCard approvals={pendingApprovals} isHu={isHu} />
        ) : null}
        <TeamMembersTab
          members={membersForTab}
          pendingInvites={pendingForTab}
          teamId={teamId}
          teamName={teamData.teamName}
          profileId={profile.id}
          isOrgManager={isOrgManager}
          isHu={isHu}
          locale={locale}
          dateLocale={isHu ? "hu-HU" : "en-US"}
        />
      </PlatformPageShell>
    );
  }

  // ── Intelligence tab: potential/types and map ───────────────────────────
  if (activeTab === "intelligence") {
    if (!hasSufficientIntelligenceData) {
      return (
        <PlatformPageShell
          surface="team"
          contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
        >
          <Link
            href={`/team/${teamId}?tab=overview`}
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
          >
            <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10 3L5 8l5 5" />
            </svg>
            {backToOverviewLabel}
          </Link>

          <section className="rounded-[24px] border border-sand bg-[linear-gradient(140deg,#fffdf7_0%,#f6f1e8_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] md:p-6">
            <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
              {t("teamComp.tabIntelligence", locale)}
            </p>
            <h1 className="mt-1 font-fraunces text-[28px] leading-tight text-ink md:text-[34px]">
              {isHu ? "Még nincs elég adat a csapatintelligenciához" : "Not enough data yet for team intelligence"}
            </h1>
            <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-body">
              {isHu
                ? "A stabil értelmezéshez legalább 3 kitöltött önértékelés szükséges. Addig a nézet inkább adatgyűjtési fókuszban marad."
                : "At least 3 completed self-assessments are required for stable interpretation. Until then, this view stays in data-collection mode."}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
                {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
                <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
              </span>
              <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
                {isHu ? "Hiányzik a stabil nézethez" : "Still needed for stable view"}:{" "}
                <span className="font-semibold text-ink">{missingForStableIntelligence}</span>
              </span>
              <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
                {isHu ? "Observer kör" : "Observer round"}:{" "}
                <span className="font-semibold text-ink">
                  {teamData.activeCampaign ? (isHu ? "aktív" : "active") : (isHu ? "nincs" : "none")}
                </span>
              </span>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                href={`/team/${teamId}?tab=members`}
                className="inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
              >
                {isHu ? "Tagok és kitöltések kezelése" : "Manage members and completions"}
              </Link>
              {canManageTeamActions && teamData.orgId ? (
                <Link
                  href={`/org/${teamData.orgId}?tab=campaigns`}
                  className="inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
                >
                  {isHu ? "Observer kör indítása" : "Start observer round"}
                </Link>
              ) : null}
            </div>
          </section>

          <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
              {isHu ? "Kiknél hiányzik még adat" : "Members still missing data"}
            </p>
            {membersWithoutAssessment.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {membersWithoutAssessment.map((member) => (
                  <span
                    key={`${member.userId}-missing-intel`}
                    className="rounded-full border border-sand bg-cream px-2.5 py-1 text-[12px] text-ink-body"
                  >
                    {member.displayName}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-[12px] text-ink-body">
                {isHu
                  ? "Minden tagnak van legalább részleges adatpontja, de még nincs elég kitöltés a stabil csapatképre."
                  : "All members have partial data points, but there are still not enough completions for stable team intelligence."}
              </p>
            )}
          </section>
        </PlatformPageShell>
      );
    }

    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <Link
          href={`/team/${teamId}?tab=overview`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {backToOverviewLabel}
        </Link>
        <section className="rounded-[24px] border border-sand bg-[linear-gradient(140deg,#fffdf7_0%,#f6f1e8_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] md:p-6">
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
            {t("teamComp.tabIntelligence", locale)}
          </p>
          <h1 className="mt-1 font-fraunces text-[28px] leading-tight text-ink md:text-[34px]">
            {isHu ? "Csapatintelligencia nézet" : "Team intelligence view"}
          </h1>
          <p className="mt-2 max-w-3xl text-[13px] leading-relaxed text-ink-body">
            {isHu
              ? "Összefoglaló nézet arról, ki mit hoz a csapatba, hol vannak hiányok, és mi a következő legjobb lépés."
              : "Executive summary of who brings what to the team, where the gaps are, and what the next best action is."}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
              <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
            </span>
            <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Adatállapot" : "Data status"}:{" "}
              <span className="font-semibold text-ink">{intelligenceQualityLabel}</span>
            </span>
            <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
              {isHu ? "Dinamika nézet" : "Dynamics view"}:{" "}
              <span className="font-semibold text-ink">{dynamicsStateLabel}</span>
            </span>
          </div>
        </section>

        <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {isHu ? "Csapat-összefoglaló" : "Team summary"}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-sand bg-cream/60 p-3">
              <p className="text-[11px] text-ink-body">{isHu ? "Assessment készültség" : "Assessment readiness"}</p>
              <p className="mt-1 font-fraunces text-[26px] text-ink">{Math.round((assessedCount / Math.max(totalCount, 1)) * 100)}%</p>
              <p className="text-[11px] text-muted">{assessedCount}/{totalCount}</p>
            </div>
            <div className="rounded-xl border border-sand bg-cream/60 p-3">
              <p className="text-[11px] text-ink-body">{isHu ? "Observer kör státusz" : "Observer round status"}</p>
              <p className="mt-1 font-fraunces text-[26px] text-ink">{teamData.activeCampaign ? (isHu ? "Aktív" : "Active") : (isHu ? "Nincs" : "None")}</p>
              <p className="text-[11px] text-muted">
                {teamData.activeCampaign
                  ? (isHu ? "Visszajelzések gyűjtése folyamatban" : "Feedback collection in progress")
                  : (isHu ? "A dinamika adatokhoz szükséges" : "Required for dynamics data")}
              </p>
            </div>
            <div className="rounded-xl border border-sand bg-cream/60 p-3">
              <p className="text-[11px] text-ink-body">{isHu ? "Csapatminta státusz" : "Pattern status"}</p>
              <p className="mt-1 font-fraunces text-[26px] text-ink">{teamData.patternResult ? (isHu ? "Elérhető" : "Ready") : (isHu ? "Folyamatban" : "In progress")}</p>
              <p className="text-[11px] text-muted">
                {teamData.patternResult
                  ? teamData.patternResult.fullLabel
                  : isHu
                    ? "Legalább 3 kitöltés szükséges"
                    : "At least 3 completions required"}
              </p>
            </div>
          </div>
        </section>

        <TeamIntelligence
          members={intelligenceMembers}
          edges={teamDynamicsEdges}
          evidenceBySub={intelligenceEvidenceBySub}
          presentation="blocks"
          isHu={isHu}
          hasDynamicsData={hasDynamicsData}
          dynamicsSummary={
            teamData.activeCampaign
              ? {
                  participantCount: teamData.activeCampaign.teamParticipantCount,
                  observerDoneCount: teamData.activeCampaign.teamObserverDoneCount,
                }
              : undefined
          }
          noDataCtaHref={`/team/${teamId}?tab=members`}
          noDataCtaLabel={isHu ? "Tagok és kitöltések megnyitása" : "Open members and completions"}
          deepDiveHref={`/team/${teamId}?tab=teamRole`}
          deepDiveLabel={isHu ? "Részletes csapatszerep elemzés" : "Detailed team-role analysis"}
        />

        <section className="rounded-[22px] border border-sand bg-white p-4 shadow-[0_12px_28px_rgba(26,26,46,0.05)] md:p-5">
          <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted">
            {isHu ? "Fejlesztési prioritások" : "Development priorities"}
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
            {intelligencePriorities.map((priority) => {
              const toneClass =
                priority.tone === "rose"
                  ? "border-rose-200 bg-rose-50"
                  : priority.tone === "amber"
                    ? "border-amber-200 bg-amber-50"
                    : priority.tone === "violet"
                      ? "border-violet-200 bg-violet-50"
                      : "border-emerald-200 bg-emerald-50";
              return (
                <div key={priority.id} className={`rounded-xl border p-3 ${toneClass}`}>
                  <p className="text-[13px] font-semibold text-ink">{priority.title}</p>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-body">{priority.reason}</p>
                  <Link
                    href={priority.ctaHref}
                    className="mt-3 inline-flex min-h-[38px] items-center rounded-[10px] bg-white px-3 text-[12px] font-semibold text-ink transition-colors hover:bg-cream"
                  >
                    {priority.ctaLabel}
                  </Link>
                </div>
              );
            })}
          </div>
        </section>
      </PlatformPageShell>
    );
  }

  // ── TeamRole tab ───────────────────────────────────────────────────────────
  if (activeTab === "teamRole") {
    const teamRoleTeam = await prisma.team.findUnique({
      where: { id: teamId },
      select: { teamRoleRoundActive: true, teamRoleRoundStartedAt: true },
    });
    const teamRoleMembers = await prisma.teamMember.findMany({
      where: { teamId },
      select: {
        userId: true,
        user: {
          select: {
            username: true,
            teamRoleScore: { select: { source: true, updatedAt: true } },
          },
        },
      },
    });
    const teamRoleMemberStatus = teamRoleMembers.map((m) => ({
      userId: m.userId,
      name: m.user.username ?? "?",
      hasQuestionnaire: m.user.teamRoleScore?.source === "questionnaire",
      hasEstimate: m.user.teamRoleScore?.source === "estimate",
    }));
    const teamRoleCompletedCount = teamRoleMemberStatus.filter((m) => m.hasQuestionnaire).length;
    const teamRoleEstimateCount = teamRoleMemberStatus.filter((m) => m.hasEstimate).length;

    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <Link
          href={`/team/${teamId}?tab=overview`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {backToOverviewLabel}
        </Link>
        <TeamRoleRoundCard
          teamId={teamId}
          isRoundActive={teamRoleTeam?.teamRoleRoundActive ?? false}
          totalMembers={teamRoleMembers.length}
          completedCount={teamRoleCompletedCount}
          estimateCount={teamRoleEstimateCount}
          members={teamRoleMemberStatus}
          canManage={isOrgManager}
          isHu={isHu}
        />
        <TeamRoleSection
          members={teamData.members}
          isHu={isHu}
          peerProfiles={Object.fromEntries(await buildTeamPeerRoleProfiles(teamId))}
        />
      </PlatformPageShell>
    );
  }

  if (activeTab === "report") {
    const consultantReports = canViewRaw ? await listTeamReports(teamId) : [];
    return (
      <PlatformPageShell
        surface="team"
        contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
      >
        <Link
          href={`/team/${teamId}?tab=overview`}
          className="inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-body transition-colors hover:text-ink"
        >
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5" />
          </svg>
          {teamData.teamName}
        </Link>

        {canViewRaw ? (
          <TeamReportEditor
            teamId={teamId}
            orgId={teamData.orgId}
            reports={consultantReports}
            isHu={isHu}
          />
        ) : publishedReport ? (
          <TeamReportView report={publishedReport} isHu={isHu} />
        ) : null}
      </PlatformPageShell>
    );
  }

  const completedCount = teamData.completedCount;
  const inProgressCount = teamData.members.filter((m) => m.scores === null && m.joinedAt).length;
  const waitingCount = teamData.memberCount - completedCount - inProgressCount;
  const completionPct = teamData.memberCount > 0 ? Math.round((completedCount / teamData.memberCount) * 100) : 0;
  const hasPattern = completedCount >= 3;
  const hasObserver = !!teamData.activeCampaign;
  const patternTarget = 3;
  const patternProgressPct = Math.min(
    Math.round((completedCount / patternTarget) * 100),
    100,
  );
  const observerCoveragePct =
    hasObserver && teamData.activeCampaign!.teamParticipantCount > 0
      ? Math.round(
          (teamData.activeCampaign!.teamObserverDoneCount /
            teamData.activeCampaign!.teamParticipantCount) *
            100,
        )
      : 0;
  const secondaryLabel = hasObserver
    ? t("teamDetail.secondaryFeedbackRound", locale)
    : t("teamDetail.secondaryPatternReadiness", locale);
  const secondaryPct = hasObserver ? observerCoveragePct : patternProgressPct;
  const secondaryText = hasObserver
    ? tf("teamDetail.secondaryObserverProgress", locale, {
        done: teamData.activeCampaign!.teamObserverDoneCount,
        remaining: Math.max(teamData.activeCampaign!.teamParticipantCount - teamData.activeCampaign!.teamObserverDoneCount, 0),
      })
    : hasPattern
      ? t("teamDetail.secondaryPatternAvailable", locale)
      : tf("teamDetail.secondaryPatternProgress", locale, {
          done: Math.min(completedCount, patternTarget),
          target: patternTarget,
        });
  const recommendedAction = (() => {
    if (canViewRaw && canManageTeamActions && teamData.orgId) {
      return {
        title: t("teamDetail.nextStep", locale),
        description: hasObserver
          ? t("teamDetail.actionObserverActive", locale)
          : hasPattern
            ? t("teamDetail.actionPatternReady", locale)
            : t("teamDetail.actionCloseMissing", locale),
        primary: {
          label: hasObserver
            ? t("teamDetail.actionManageRound", locale)
            : t("teamDetail.actionStartRound", locale),
          href: `/org/${teamData.orgId}?tab=campaigns`,
        },
        secondary: hasPattern
          ? {
              label: t("teamDetail.actionViewPattern", locale),
              href: `/team/${teamId}?tab=profile`,
            }
          : null,
      };
    }

    return {
      title: t("teamDetail.nextStep", locale),
      description: hasPattern
        ? t("teamDetail.actionPatternAvailable", locale)
        : t("teamDetail.actionNeedMore", locale),
      primary: {
        label: hasPattern
          ? t("teamDetail.actionViewPatternAlt", locale)
          : t("teamDetail.actionOpenMembers", locale),
        href: hasPattern ? `/team/${teamId}?tab=profile` : `/team/${teamId}?tab=members`,
      },
      secondary: null,
    };
  })();
  const teamDashboardVm = createTeamDashboardIA({
    locale: isHu ? "hu" : "en",
    teamName: teamData.teamName,
    memberCount: teamData.memberCount,
    completedCount,
    inProgressCount,
    waitingCount,
    hasPattern,
    hasActiveObserverRound: hasObserver,
    observerDoneCount: teamData.activeCampaign?.teamObserverDoneCount,
    observerParticipantCount: teamData.activeCampaign?.teamParticipantCount,
    pendingInviteCount: teamData.pendingInvites.length,
    recommendedAction,
  });
  const statusLine = teamDashboardVm.heroSummary.summary;
  const heroChips = teamDashboardVm.heroSummary.chips;
  const teamHeroTheme = SURFACE_HERO_THEME.team;

  return (
    <PlatformPageShell
      surface="team"
      contentClassName="max-w-5xl gap-8 px-4 py-8 md:gap-10 md:px-6"
    >
        {/* ═══ HERO ═══ */}
        <SurfaceHero
          variant="team"
          eyebrow={(
            <p className="text-[9px] uppercase tracking-[2px] text-white/[0.28]">
              {t("teamDetail.heroEyebrow", locale)}
            </p>
          )}
          badge={
            hasPattern ? (
              <span
                className="rounded-md px-2.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                style={{ backgroundColor: teamHeroTheme.badgeBg, color: teamHeroTheme.badgeText }}
              >
                {t("teamDetail.heroPatternReady", locale)}
              </span>
            ) : undefined
          }
          title={<h1 className="font-fraunces text-[34px] tracking-tight text-white md:text-[40px]">{teamData.teamName}</h1>}
          summary={statusLine}
          chips={heroChips.map((chip) => (
            <span
              key={chip}
              className="rounded-full bg-white/[0.08] px-3 py-1.5 text-[11px] font-medium text-white/[0.62]"
            >
              {chip}
            </span>
          ))}
          actions={(
            <>
              {canViewRaw ? (
                <Link
                  href={`/team/${teamId}?tab=report`}
                  className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.62] transition hover:bg-white/[0.12]"
                >
                  {isHu ? "Riport" : "Report"}
                </Link>
              ) : null}
              {hasPattern && canViewRaw ? (
                <Link
                  href={`/team/${teamId}?tab=profile`}
                  className="inline-flex min-h-[44px] items-center rounded-[10px] px-5 py-2 text-[12px] font-semibold text-white transition hover:brightness-110"
                  style={{ backgroundColor: teamHeroTheme.primary }}
                >
                  {t("teamDetail.heroViewPattern", locale)}
                </Link>
              ) : null}
              {canViewRaw && canManageTeamActions && teamData.orgId ? (
                <Link
                  href={
                    hasObserver
                      ? `/org/${teamData.orgId}?tab=campaigns`
                      : `/org/${teamData.orgId}/campaigns/new?team=${teamId}`
                  }
                  className="inline-flex min-h-[44px] items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.62] transition hover:bg-white/[0.12]"
                >
                  {hasObserver
                    ? t("teamDetail.heroManageRound", locale)
                    : t("teamDetail.heroStartRound", locale)}
                </Link>
              ) : null}
              {canViewRaw && !canManageTeamActions && isOrgManager && teamData.orgId ? (
                <span className="inline-flex min-h-[44px] cursor-not-allowed items-center rounded-[10px] bg-white/[0.08] px-5 py-2 text-[12px] font-medium text-white/[0.45]">
                  {hasObserver
                    ? t("teamDetail.heroManageRound", locale)
                    : t("teamDetail.heroStartRound", locale)}
                </span>
              ) : null}
            </>
          )}
          footer={
            manageGateCopy ? (
              <p className="text-[12px] text-white/[0.5]">
                {manageGateCopy.description}
              </p>
            ) : undefined
          }
          aside={(
            <>
              <p className="text-[9px] uppercase tracking-[2px] text-white/[0.34]">
                {t("teamDetail.snapshotLabel", locale)}
              </p>

              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("teamDetail.snapshotMembers", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{teamData.memberCount}</p>
                </div>
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("teamDetail.snapshotDone", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{completedCount}</p>
                </div>
                <div className="rounded-xl bg-white/[0.08] px-3 py-2">
                  <p className="text-[9px] uppercase tracking-[0.18em] text-white/[0.35]">{t("teamDetail.snapshotWait", locale)}</p>
                  <p className="mt-1 font-fraunces text-[22px] leading-none text-white">{waitingCount}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                    <span>{t("teamDetail.snapshotCompletionRate", locale)}</span>
                    <span className="font-semibold text-white/[0.7]">{completionPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${completionPct}%`, backgroundColor: "#8ad0b4" }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-white/[0.45]">
                    {tf("teamDetail.snapshotDoneInProgress", locale, { done: completedCount, inProgress: inProgressCount })}
                  </p>
                </div>

                <div>
                  <div className="mb-1.5 flex items-center justify-between text-[10px] text-white/[0.52]">
                    <span>{secondaryLabel}</span>
                    <span className="font-semibold text-white/[0.7]">{secondaryPct}%</span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.12]">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${secondaryPct}%`, backgroundColor: teamHeroTheme.primary }}
                    />
                  </div>
                  <p className="mt-1.5 text-[10px] text-white/[0.45]">
                    {secondaryText}
                  </p>
                </div>
              </div>
            </>
          )}
        />

        {isRestricted || isNone ? (
          <OrgSubscriptionBanner
            state={isNone ? "none" : "restricted"}
            locale={locale}
          />
        ) : null}

        {/* A következő nyitott mérés-lépés — kitöltés-felhívás */}
        {pendingMeasurement ? (
          <section>
            <div className="flex flex-col gap-3 rounded-[18px] border border-sage/35 bg-sage/5 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-[10px] uppercase tracking-widest text-sage-dark">
                  {isHu
                    ? CAMPAIGN_STEP_LABELS[pendingMeasurement.stepType].hu
                    : CAMPAIGN_STEP_LABELS[pendingMeasurement.stepType].en}
                </p>
                <p className="mt-1 text-sm font-semibold text-ink">
                  {pendingMeasurement.campaignName}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-ink-body">
                  {pendingMeasurement.stepType === "PSYCH_SAFETY"
                    ? isHu
                      ? "8 rövid állítás, ~2 perc. A válaszaid névtelenek — csak a csapatszintű összesítés látszik, legalább 3 kitöltéstől."
                      : "8 short statements, ~2 minutes. Your answers are anonymous — only the team-level aggregate is shown, from at least 3 responses."
                    : pendingMeasurement.stepType === "TRUST_360"
                      ? isHu
                        ? "5 rövid kérdés csapattársanként az együttműködésetekről (~2-3 perc) — a dinamika-térkép becslései helyére mért kapcsolati adat kerül."
                        : "5 short questions per teammate about how you work together (~2-3 minutes) — measured relationship data replaces the dynamics map estimates."
                      : pendingMeasurement.stepType === "TEAM_ROLE_360"
                        ? isHu
                          ? "Jelöld ki csapattársanként a rájuk leginkább jellemző állításokat (~3-4 perc/fő) — a csapatkép legalább 3 értékelőnél áll össze."
                          : "Pick the statements that best describe each teammate (~3-4 minutes each) — the team view forms with at least 3 raters."
                        : pendingMeasurement.stepType === "TEAM_ROLE"
                          ? isHu
                            ? "Rövid kérdőív arról, milyen szerepeket viszel a csapatban — a becslés helyett mért szerep-térkép készül."
                            : "A short questionnaire about the roles you play in the team — a measured role map replaces the estimate."
                          : isHu
                            ? "Töltsd ki az önértékelést (~10 perc) — ez az alapja a csapatképnek, és utána nyílnak a további mérések."
                            : "Complete the self-assessment (~10 minutes) — it is the basis of the team picture, and further measurements open after it."}
                </p>
              </div>
              {pendingMeasurement.opensAt ? (
                <div className="shrink-0 rounded-[10px] border border-sand bg-white px-4 py-2.5 text-center">
                  <p className="font-mono text-[10px] uppercase tracking-wide text-muted">
                    {isHu ? "Érkezik" : "Arriving"}
                  </p>
                  <p className="text-[13px] font-semibold tabular-nums text-ink">
                    {pendingMeasurement.opensAt.toLocaleString(isHu ? "hu-HU" : "en-GB", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              ) : (
                <Link
                  href={CAMPAIGN_STEP_LINKS[pendingMeasurement.stepType]}
                  className="inline-flex min-h-[44px] shrink-0 items-center rounded-[10px] bg-ink px-5 text-[13px] font-semibold text-white transition hover:brightness-110"
                >
                  {isHu ? "Kitöltöm most" : "Fill it in now"}
                </Link>
              )}
            </div>
          </section>
        ) : null}

        {/* ═══ ÖSSZEFOGLALÓ ═══ */}
        <section>
          <DashboardSectionHeader label={t("teamDetail.sectionSnapshot", locale)} className="mb-4" />
          <p className="mb-3 text-[10px] font-medium uppercase tracking-[1px] text-ink-body">
            {t("teamDetail.summaryLabel", locale)}
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* Kitöltési arány */}
            <DashboardMetricCard
              accent="var(--color-action-primary-bg)"
              title={t("teamDetail.completionRateTitle", locale)}
              value={`${completionPct}%`}
              sub={tf("teamDetail.completionRateSub", locale, { done: completedCount, inProgress: inProgressCount, waiting: waitingCount })}
            >
              <div className="flex gap-1.5">
                {completedCount > 0 && <div className="h-1.5 rounded-full bg-sage" style={{ flex: completedCount }} />}
                {inProgressCount > 0 && <div className="h-1.5 rounded-full bg-[#d8a253]" style={{ flex: inProgressCount }} />}
                {waitingCount > 0 && <div className="h-1.5 rounded-full bg-bronze/65" style={{ flex: waitingCount }} />}
              </div>
            </DashboardMetricCard>

            {/* Csapatmintázat */}
            <DashboardMetricCard
              accent="var(--color-accent-primary)"
              title={t("teamDetail.teamPatternTitle", locale)}
              value={
                hasPattern
                  ? canViewRaw
                    ? t("teamDetail.teamPatternAvailable", locale)
                    : isHu ? "Validálás alatt" : "Pending validation"
                  : t("teamDetail.teamPatternNotYet", locale)
              }
              sub={hasPattern
                ? canViewRaw
                  ? teamData.patternResult?.fullLabel
                  : isHu ? "A tanácsadó véglegesítése után elérhető" : "Available after consultant validation"
                : tf("teamDetail.teamPatternProgress", locale, { pct: completionPct })}
            >
              {hasPattern && canViewRaw ? (
                <Link
                  href={`/team/${teamId}?tab=profile`}
                  className="inline-flex text-[11px] font-semibold text-sage transition-colors hover:text-sage-dark"
                >
                  {t("teamDetail.teamPatternViewCta", locale)}
                </Link>
              ) : null}
            </DashboardMetricCard>
          </div>
        </section>

        {canViewRaw ? (
        <section id="team-intelligence">
          <DashboardSectionHeader
            label={t("teamComp.tabIntelligence", locale)}
            className="mb-4"
          />
          <Link
            href={`/team/${teamId}?tab=intelligence`}
            className="group block rounded-[22px] border border-sand bg-[linear-gradient(140deg,#fffdf7_0%,#f6f1e8_100%)] p-5 shadow-[0_14px_32px_rgba(26,26,46,0.06)] transition-all hover:-translate-y-0.5 hover:border-bronze/40 hover:shadow-[0_18px_36px_rgba(26,26,46,0.09)] md:p-6"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div className="max-w-2xl">
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted">
                  {isHu ? "Külön nézet" : "Dedicated view"}
                </p>
                <h3 className="mt-1 font-fraunces text-[26px] leading-tight text-ink md:text-[31px]">
                  {t("teamComp.tabIntelligence", locale)}
                </h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ink-body">
                  {isHu
                    ? "Potenciál- és szerepilleszkedési térkép egy oldalon, adatminőség-jelzéssel. A nézetet külön oldalon nyithatod meg, hogy fókuszáltan elemezhető legyen."
                    : "Potential and role-fit maps in one dedicated view with data-quality markers. Open separately for focused analysis."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
                    {isHu ? "Kitöltött assessmentek" : "Completed assessments"}:{" "}
                    <span className="font-semibold text-ink">{assessedCount}/{totalCount}</span>
                  </span>
                  <span className="rounded-full border border-sand bg-white px-2.5 py-1 text-[11px] font-medium text-ink-body">
                    {isHu ? "Adatállapot" : "Data status"}:{" "}
                    <span className="font-semibold text-ink">{intelligenceQualityLabel}</span>
                  </span>
                </div>
              </div>
              <span className="inline-flex min-h-[44px] items-center justify-center rounded-[12px] bg-ink px-5 py-2 text-[12px] font-semibold text-white transition-colors group-hover:bg-ink/90">
                {isHu ? "Csapatintelligencia megnyitása" : "Open team intelligence"}
              </span>
            </div>
          </Link>

          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            {supportingViews.map((card) => (
              <Link
                key={card.key}
                href={`/team/${teamId}?tab=${card.key}`}
                className="group rounded-[16px] border border-sand bg-white p-4 transition-colors hover:border-bronze/35 hover:bg-cream"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-[13px] font-semibold text-ink">{card.title}</p>
                  {card.badge ? (
                    <span className="rounded-full bg-warm-mid px-2 py-0.5 text-[10px] font-semibold text-ink">
                      {card.badge}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1.5 text-[12px] leading-relaxed text-ink-body">
                  {card.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
        ) : null}

        {!canViewRaw ? (
        <section>
          <DashboardSectionHeader label={t("teamComp.teamPatternEyebrow", locale)} className="mb-4" />
          {(
            <DashboardPanel className="p-6">
              {publishedReport ? (
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                    <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {isHu ? "A validált csapatkép elérhető" : "The validated team picture is available"}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-ink-body">
                      {isHu
                        ? "A tanácsadó véglegesítette a csapatképet — aggregált eredmények és értékelés."
                        : "Your consultant has finalized the team picture — aggregate results and assessment."}
                    </p>
                    <Link
                      href={`/team/${teamId}?tab=report`}
                      className="mt-2 inline-flex text-xs font-semibold text-sage transition-colors hover:text-sage-dark"
                    >
                      {isHu ? "Csapatkép megnyitása →" : "Open team picture →"}
                    </Link>
                  </div>
                </div>
              ) : (
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                  <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3.5" y="7" width="9" height="6" rx="1.5" />
                    <path d="M5.5 7V5a2.5 2.5 0 0 1 5 0v2" />
                  </svg>
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">
                    {isHu ? "A csapatkép validálás alatt" : "Team picture pending validation"}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-ink-body">
                    {isHu
                      ? "A csapatszintű eredményeket a tanácsadó összesíti és validálja — a személyes beszélgetések tanulságaival együtt, aggregált formában lesznek elérhetők. Addig a kitöltés haladását követheted ezen az oldalon."
                      : "Team-level results are aggregated and validated by your consultant — they become available in aggregate form, together with insights from the personal interviews. Until then you can track completion progress on this page."}
                  </p>
                </div>
              </div>
              )}
            </DashboardPanel>
          )}
        </section>
        ) : null}

        {canViewRaw && teamData.orgId ? (
          <TeamMeasurementTimeline
            items={(
              await prisma.campaign.findMany({
                where: { teamId },
                orderBy: { createdAt: "desc" },
                take: 10,
                select: {
                  id: true,
                  orgId: true,
                  name: true,
                  type: true,
                  status: true,
                  createdAt: true,
                  closedAt: true,
                },
              })
            ).map((c) => ({
              ...c,
              createdAt: c.createdAt.toISOString(),
              closedAt: c.closedAt?.toISOString() ?? null,
            }))}
            isHu={isHu}
          />
        ) : null}



    </PlatformPageShell>
  );
}
