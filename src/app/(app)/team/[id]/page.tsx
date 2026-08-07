import { requireOnboardedByClerkId } from "@/lib/onboarding-guard";
import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getServerAuth } from "@/lib/auth-server";
import { getProfileCoreByClerkId } from "@/lib/profile.server";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import {
  canAccessTeam,
  canManageTeam,
  canViewRawTeamResults,
  getTeamMembershipRole,
} from "@/lib/team-auth";
import { hasOrgRole } from "@/lib/org-roles";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import {
  getCampaignSteps,
  getCurrentStepType,
  isStepGateOpen,
  isCampaignStepType,
} from "@/lib/campaign-steps-core";
import { hasStartedStep, releaseDueCampaignSteps } from "@/lib/campaign-steps";
import { OBSERVER_MIN_FOR_REVEAL } from "@/lib/observer-flow";
import { DEFAULT_ASSESSMENT_FORM } from "@/lib/operating-mode";
import { getTestConfig } from "@/lib/questions";
import type { TestType } from "@prisma/client";
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
import { TabViewTracker } from "@/components/analytics/TabViewTracker";

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

  // Közös, kérés-szinten memoizált profil — a requireOnboardedByClerkId
  // ugyanezt hívta az imént, tehát ez már nem indít új kört.
  const profile = await getProfileCoreByClerkId(userId);
  if (!profile) redirect(JOURNEY_HOME_HANDOFF_PATH);
  // A fallback-cél kiszámítása a TELJES journey-motort futtatja (~25 query),
  // de csak a redirect-ágakban kell — ezért lusta. Korábban feltétel nélkül
  // futott le minden csapat-nézetnél.
  const deepLinkFallback = () => resolveJourneyFallbackForProfileId(profile.id);

  // 1. HULLÁM — a csapat és a NÉZŐ org-szerepe EGY lekérdezésben (beágyazott
  // select), mellette a saját, esedékes kampány-lépések kinyitása.
  // A `releaseDueCampaignSteps` kizárólag a HÍVÓ SAJÁT résztvevő-sorait
  // érinti (userId: profile.id), tehát nem idegen adat — nyugodtan futhat a
  // csapat-kapu előtt; a látogatás maga a trigger, ez eddig is így volt.
  const [team] = await Promise.all([
    prisma.team.findUnique({
      where: { id: teamId },
      select: {
        id: true,
        name: true,
        orgId: true,
        org: {
          select: {
            members: {
              where: { userId: profile.id },
              select: { role: true },
              take: 1,
            },
          },
        },
      },
    }),
    releaseDueCampaignSteps({ userId: profile.id }).catch(() => {}),
  ]);
  if (!team) notFound();

  const orgMemberRole = team.org?.members[0]?.role ?? null;
  if (!orgMemberRole) redirect(await deepLinkFallback());

  // 2. HULLÁM — a néző SAJÁT, egymástól független adatai egyszerre.
  // Mind a hívó saját sora (résztvevői lépések, tagsági szerep, nekem szóló
  // visszajelzés-kérések), tehát a csapat-kapu előtt is biztonságos; a
  // CSAPAT adatai (riport, policy, aggregátumok) továbbra is a kapu mögött
  // maradnak, lentebb.
  const [stepCandidates, viewerTeamRole, receivedFeedbackRaw] = await Promise.all([
    prisma.campaignParticipant.findMany({
      where: {
        userId: profile.id,
        // Több-csapatos kampány: a teamIds lista is számít, nem csak a
        // legacy teamId (az első csapat).
        campaign: {
          status: "ACTIVE",
          OR: [{ teamId }, { teamIds: { has: teamId } }],
        },
      },
      orderBy: { addedAt: "asc" },
      select: {
        currentStep: true,
        nextStepOpensAt: true,
        campaign: {
          select: {
            id: true,
            name: true,
            type: true,
            steps: true,
            teamId: true,
            teamIds: true,
            requireFreshResults: true,
            activatedAt: true,
          },
        },
      },
    }),
    getTeamMembershipRole(profile.id, teamId),
    prisma.observerInvitation.findMany({
      where: {
        observerProfileId: profile.id,
        status: "PENDING",
        expiresAt: { gt: new Date() },
        inviter: { teamMemberships: { some: { teamId } } },
      },
      orderBy: { createdAt: "desc" },
      select: {
        token: true,
        testType: true,
        inviter: { select: { username: true, email: true } },
        draft: { select: { answers: true } },
      },
    }),
  ]);
  const pendingMeasurementBase = stepCandidates
    .map((p) => {
      const stepType = getCurrentStepType(p.campaign, p);
      return stepType && isCampaignStepType(stepType)
        ? {
            campaign: p.campaign,
            campaignName: p.campaign.name,
            stepType,
            // Ütemezett (még zárt) lépés: időpontot mutatunk CTA helyett.
            opensAt: !isStepGateOpen(p) ? p.nextStepOpensAt : null,
          }
        : null;
    })
    .find((v): v is NonNullable<typeof v> => v !== null) ?? null;
  // Futó observer-kör: a self-kitöltés után a meghívó-gyűjtés még tart —
  // a csapat-nézeten is kiemeljük (n/3 beérkezett + meghívó-CTA), amíg a
  // küszöb (OBSERVER_MIN_FOR_REVEAL) nincs meg.
  const observerCampaign = stepCandidates.find((p) =>
    getCampaignSteps(p.campaign).includes("OBSERVER_360"),
  );

  // 3. HULLÁM — mindkettő a stepCandidates-től függ, de EGYMÁSTÓL nem:
  // a „megkezdte" jelzés és az observer-gyűjtés állása egyszerre indul.
  const [stepStarted, observerInvitations] = await Promise.all([
    pendingMeasurementBase && !pendingMeasurementBase.opensAt
      ? hasStartedStep(
          pendingMeasurementBase.campaign,
          pendingMeasurementBase.stepType,
          profile.id,
        )
      : Promise.resolve(false),
    observerCampaign
      ? prisma.observerInvitation.findMany({
          where: {
            inviterId: profile.id,
            status: { in: ["AWAITING_APPROVAL", "PENDING", "COMPLETED"] },
          },
          select: { status: true, createdAt: true, completedAt: true },
        })
      : Promise.resolve([]),
  ]);

  // „Megkezdte" jelzés: rész-beadás vagy observer-piszkozat → a banner
  // CTA-ja „kezdés" helyett „folytatás"-t mutat.
  const pendingMeasurement = pendingMeasurementBase
    ? {
        campaignName: pendingMeasurementBase.campaignName,
        stepType: pendingMeasurementBase.stepType,
        opensAt: pendingMeasurementBase.opensAt,
        started: stepStarted,
      }
    : null;

  let observerGathering: {
    campaignName: string;
    sent: number;
    received: number;
    min: number;
  } | null = null;
  if (observerCampaign) {
    const freshFrom =
      observerCampaign.campaign.requireFreshResults && observerCampaign.campaign.activatedAt
        ? observerCampaign.campaign.activatedAt.getTime()
        : null;
    const invitations = observerInvitations;
    const sent = invitations.filter(
      (inv) => freshFrom === null || inv.createdAt.getTime() >= freshFrom,
    ).length;
    const received = invitations.filter(
      (inv) =>
        inv.status === "COMPLETED" &&
        (freshFrom === null ||
          (inv.completedAt && inv.completedAt.getTime() >= freshFrom)),
    ).length;
    if (received < OBSERVER_MIN_FOR_REVEAL) {
      observerGathering = {
        campaignName: observerCampaign.campaign.name,
        sent,
        received,
        min: OBSERVER_MIN_FOR_REVEAL,
      };
    }
  }

  // Tőlem kért observer-visszajelzések EBBŐL a csapatból: ki kért, hol
  // tartok a kitöltésben (szerver-draft) — a csapat-nézetről indítható/
  // folytatható. (A lekérés a 2. hullámban ment ki.)
  const receivedFeedbackRequests = receivedFeedbackRaw.map((inv) => {
    const total = getTestConfig(
      inv.testType as TestType,
      locale,
      DEFAULT_ASSESSMENT_FORM,
    ).questions.length;
    const answered =
      inv.draft?.answers &&
      typeof inv.draft.answers === "object" &&
      !Array.isArray(inv.draft.answers)
        ? Object.keys(inv.draft.answers as Record<string, unknown>).length
        : 0;
    return {
      token: inv.token,
      inviterName: inv.inviter.username ?? inv.inviter.email ?? "—",
      answered: Math.min(answered, total),
      total,
    };
  });

  const orgId = team.orgId;
  if (!orgId) redirect(await deepLinkFallback());

  // KAPU: az adatbetöltés ELŐTT. A canAccessTeam ugyanazt a memoizált
  // tagságot olvassa, tehát nem indít új kört.
  const hasTeamAccess = await canAccessTeam(profile.id, teamId, orgMemberRole);
  if (!hasTeamAccess) redirect(await deepLinkFallback());

  // A kapu után minden független lekérés EGY hullámban (korábban négy,
  // egymást váró await volt):
  //  - a megnyitott csapat kijelölése aktívnak (csak tagnál — tanácsadó/
  //    admin idegen csapatot is nézhet, annak nem írjuk felül a kijelölést),
  //  - a néző csapatai a hero csapat-váltójához,
  //  - a publikált (validált) riport,
  //  - a csapat-hatókörű policy-pillanatkép.
  const [, memberTeamRows, publishedReport, policySnapshot] = await Promise.all([
    viewerTeamRole !== null
      ? prisma.userProfile
          .update({ where: { id: profile.id }, data: { activeTeamId: teamId } })
          .catch(() => {})
      : Promise.resolve(undefined),
    prisma.teamMember.findMany({
      where: { userId: profile.id, team: { orgId: team.orgId } },
      orderBy: { joinedAt: "asc" },
      select: { team: { select: { id: true, name: true } } },
    }),
    getLatestPublishedReport(teamId),
    resolveTeamPolicySnapshot({
      orgId,
      orgRole: orgMemberRole,
      teamId,
      profileId: profile.id,
    }),
  ]);
  const memberTeams = memberTeamRows.map((m) => ({ id: m.team.id, name: m.team.name }));
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

  if (!canViewRaw && activeTab === "report" && !publishedReport) {
    redirect(`/team/${teamId}?tab=overview`);
  }
  // A publikált riport BEFAGYASZTOTT (validált) mintázata — a nem-tanácsadói
  // overview ezt mutatja „validálás alatt" helyett. A kaput maga a PUBLIKÁLT
  // riport nyitja (nem a pillanatkép mező).
  const hasPublishedReport = Boolean(publishedReport);
  // Nem indít lekérdezést: ugyanaz a memoizált tagság, mint fent.
  const isOrgManager = await canManageTeam(profile.id, teamId, orgMemberRole);
  const isHu = locale !== "en";
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
              accent="var(--color-layer-team-accent)"
              title={isHu ? "Tagok" : "Members"}
              value={String(memberCount)}
              sub={isHu ? "Aktív csapattagok" : "Active team members"}
            />
            <DashboardMetricCard
              accent="var(--color-layer-team-bright)"
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
  const isTeamMemberSelf = teamData.members.some((m) => m.userId === profile.id);
  if (activeTab === "feedback" && !isTeamMemberSelf) {
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
    isTeamMemberSelf,
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
    observerGathering,
    receivedFeedbackRequests,
    memberTeams,
  };

  // A4: a csapat-fülek a szerveren oldódnak fel (`?tab=`), ezért nincs
  // kliens-oldali váltás-kezelő, amibe be lehetne kötni — a mérőt a
  // fül-nézet MELLÉ rendereljük.
  const tabTracker = <TabViewTracker surface="team" tab={activeTab} />;

  switch (activeTab) {
    case "profile":
      return (
        <>
          {tabTracker}
          <ProfileTabView ctx={ctx} />
        </>
      );
    case "members":
      return (
        <>
          {tabTracker}
          <MembersTabView ctx={ctx} />
        </>
      );
    case "feedback":
      return (
        <>
          {tabTracker}
          <FeedbackTabView ctx={ctx} />
        </>
      );
    case "intelligence":
      return (
        <>
          {tabTracker}
          <IntelligenceTabView ctx={ctx} />
        </>
      );
    case "teamRole":
      return (
        <>
          {tabTracker}
          <TeamRoleTabView ctx={ctx} />
        </>
      );
    case "report":
      return (
        <>
          {tabTracker}
          <ReportTabView ctx={ctx} />
        </>
      );
    case "overview":
      return (
        <>
          {tabTracker}
          <OverviewTabView ctx={ctx} />
        </>
      );
  }
}
