import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import { canAccessTeam, canManageTeam, canViewRawTeamResults } from "@/lib/team-auth";
import { hasOrgRole } from "@/lib/org-roles";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import {
  getCurrentStepType,
  isStepGateOpen,
  isCampaignStepType,
} from "@/lib/campaign-steps-core";
import { releaseDueCampaignSteps } from "@/lib/campaign-steps";
import { getCapabilityGateCopy } from "@/lib/policy-ux";
import { getTeamPageData } from "@/lib/team-stats";
import {
  DashboardMetricCard,
  DashboardPanel,
} from "@/components/dashboard/DashboardPrimitives";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { OrgSubscriptionBanner } from "@/components/subscription/OrgSubscriptionBanner";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";
import { resolveJourneyFallbackForProfileId } from "@/lib/journey/guardrails.server";
import {
  resolveOrgCapabilityDecision,
  resolveTeamPolicySnapshot,
  toOrgSubscriptionBannerState,
} from "@/lib/policy-service";
import { getLatestPublishedReport } from "@/lib/team-report";
import { resolveTeamTabRedirect } from "@/lib/team-intelligence";
import type { TeamTabContext } from "./_tabs/types";
import { OverviewTabView } from "./_tabs/OverviewTabView";
import { IntelligenceTabView } from "./_tabs/IntelligenceTabView";
import { ProfileTabView } from "./_tabs/ProfileTabView";
import { MembersTabView } from "./_tabs/MembersTabView";
import { TeamRoleTabView } from "./_tabs/TeamRoleTabView";
import { ReportTabView } from "./_tabs/ReportTabView";
import { FeedbackTabView } from "./_tabs/FeedbackTabView";

export const dynamic = "force-dynamic";

// ─────────────────────────────────────────────────────────────────────
// Csapat-oldal — VÉKONY ELOSZTÓ (2026-07-28 szétvágás, UX-audit #11).
// Auth + adatbetöltés + tab-választás itt; a tab-nézetek a _tabs/
// könyvtárban élnek, a közös kontextust (TeamTabContext) propként kapják.
// Tab-specifikus lekérdezés a tab-komponensben él, nem itt.
// ─────────────────────────────────────────────────────────────────────

const TEAM_TAB_KEYS = [
  "overview",
  "intelligence",
  "profile",
  "members",
  "teamRole",
  "report",
  "feedback",
] as const;

type TeamTabKey = (typeof TEAM_TAB_KEYS)[number];

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
  // A publikált riport BEFAGYASZTOTT (validált) mintázata — a nem-tanácsadói
  // overview ezt mutatja „validálás alatt" helyett. A kaput maga a PUBLIKÁLT
  // riport nyitja (nem a pillanatkép mező).
  const hasPublishedReport = Boolean(publishedReport);
  const isOrgManager = await canManageTeam(profile.id, teamId, orgMemberRole);
  const isHu = locale !== "en";
  // Csapat-hatókörű pillanatkép: a hívó VALÓS team-tagságával/szerepével —
  // a teamManage/teamInviteEmail capability így helyesen oldódik fel.
  const policySnapshot = await resolveTeamPolicySnapshot({
    orgId,
    orgRole: orgMemberRole,
    teamId,
    profileId: profile.id,
  });
  const policy = policySnapshot.policy;
  const manageDecision = resolveOrgCapabilityDecision(policySnapshot, "manage");

  const isRestricted = toOrgSubscriptionBannerState(policy.policyState) === "restricted";
  const isNone = toOrgSubscriptionBannerState(policy.policyState) === "none";
  const isFrozen = policy.policyState === "frozen";
  const canManageTeamActions = policy.capabilities.has("teamManage");
  // Org-szintű kampány-felületek (observer-kör az org oldalán): ez org-jog,
  // nem csapat-jog — szerep-alapú láthatóság, a szerver kapuzza a műveletet.
  const canReachOrgCampaigns = hasOrgRole(orgMemberRole, "ORG_MANAGER");
  // E-mailes csapat-meghívó: csak admin-paritás (racionalizálás, 2026-07-22).
  const canEmailInvite = hasOrgRole(orgMemberRole, "ORG_ADMIN");
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

  // Visszajelzés fül: csak csapattagnak (kitüntetett hely).
  if (activeTab === "feedback" && !teamData.members.some((m) => m.userId === profile.id)) {
    redirect(`/team/${teamId}?tab=overview`);
  }

  const ctx: TeamTabContext = {
    teamId,
    orgId,
    locale,
    isHu,
    teamData,
    profile: { id: profile.id, email: profile.email, isConsultant: profile.isConsultant },
    orgMemberRole,
    canViewRaw,
    isOrgManager,
    canManageTeamActions,
    canReachOrgCampaigns,
    canEmailInvite,
    isRestricted,
    isNone,
    manageGateCopy,
    publishedReport,
    hasPublishedReport,
    pendingMeasurement,
  };

  switch (activeTab) {
    case "profile":
      return <ProfileTabView ctx={ctx} />;
    case "members":
      return <MembersTabView ctx={ctx} />;
    case "feedback":
      return <FeedbackTabView ctx={ctx} />;
    case "intelligence":
      return <IntelligenceTabView ctx={ctx} />;
    case "teamRole":
      return <TeamRoleTabView ctx={ctx} />;
    case "report":
      return <ReportTabView ctx={ctx} />;
    case "overview":
      return <OverviewTabView ctx={ctx} />;
  }
}
