import { prisma } from "@/lib/prisma";
import { canViewMemberDossier } from "@/lib/measurement-auth";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { TeamMembersTab } from "@/components/team/TeamMembersTab";
import { ObserverApprovalCard } from "@/components/team/ObserverApprovalCard";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { TeamKudos } from "@/components/team/TeamKudos";
import { TeamFeedbackRequests } from "@/components/team/TeamFeedbackRequests";
import { TeamHeroBlock } from "./TeamHeroBlock";
import type { TeamTabContext } from "./types";

// ── Members tab: member list + invites + invite form ────────────────────
export async function MembersTabView({ ctx }: { ctx: TeamTabContext }) {
  const { teamId, orgId, teamData, locale, isHu, profile, orgMemberRole, isOrgManager, canViewRaw, canEmailInvite, isTeamMemberSelf } = ctx;

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

  // A manager-út adatalapja: a szervezet aktív tagjai, akik még nincsenek
  // a csapatban (tanácsadó nélkül) — a taglistából-hozzáadás választója.
  const teamUserIds = new Set(teamData.members.map((m) => m.userId));
  const addableOrgMembers = isOrgManager
    ? (
        await prisma.organizationMember.findMany({
          where: {
            orgId,
            leftAt: null,
            role: { not: "ORG_CONSULTANT" },
          },
          orderBy: { joinedAt: "asc" },
          select: {
            userId: true,
            user: { select: { username: true, email: true } },
          },
        })
      )
        .filter((m) => !teamUserIds.has(m.userId))
        .map((m) => ({
          userId: m.userId,
          label: m.user.username ?? m.user.email ?? m.userId,
        }))
    : [];

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
      <TeamHeroBlock ctx={ctx} active="members" />
      {pendingApprovals.length > 0 ? (
        <ObserverApprovalCard approvals={pendingApprovals} isHu={isHu} />
      ) : null}
      <TeamMembersTab
        members={membersForTab}
        pendingInvites={pendingForTab}
        teamId={teamId}
        profileId={profile.id}
        isOrgManager={isOrgManager}
        canEmailInvite={canEmailInvite}
        addableOrgMembers={addableOrgMembers}
        dossierBaseHref={
          canViewMemberDossier(orgMemberRole, profile.email, profile.isConsultant)
            ? `/org/${orgId}/members`
            : null
        }
        isHu={isHu}
        locale={locale}
        dateLocale={isHu ? "hu-HU" : "en-US"}
      />
      {isTeamMemberSelf ? (
        <section id="feedback" className="scroll-mt-6 border-t border-sand pt-8">
          <SectionEyebrow>{isHu ? "visszajelzés" : "feedback"}</SectionEyebrow>
          <h2 className="mt-1 font-fraunces text-3xl text-ink">
            {isHu ? "Visszajelzések" : "Feedback"}
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-body">
            {isHu
              ? "Köszönet és fejlesztő visszajelzés a csapattársaidnak — egy helyen a csapat névsorával."
              : "Kudos and development feedback for your teammates, in one place with the team roster."}
          </p>
          <div className="mt-6 flex flex-col gap-6">
            <TeamKudos teamId={teamId} members={membersForTab} locale={locale} />
            <TeamFeedbackRequests teamId={teamId} members={membersForTab} locale={locale} />
          </div>
        </section>
      ) : null}
    </PlatformPageShell>
  );
}
