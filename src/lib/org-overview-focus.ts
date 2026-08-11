import { MIN_MEMBERS_FOR_ORG_INSIGHTS } from "@/lib/journey/constants";

export interface OrgOverviewFocus {
  title: string;
  description: string;
  primary: { label: string; href: string };
  secondary: { label: string; href: string } | null;
}

export function resolveOrgOverviewFocus(input: {
  locale: "hu" | "en";
  orgId: string;
  teamCount: number;
  memberCount: number;
  completedMemberCount: number;
  pendingInviteCount: number;
  activeCampaignCount: number;
  canCreateTeam: boolean;
  canInviteMembers: boolean;
  canLaunchCampaign: boolean;
  canViewCampaigns: boolean;
}): OrgOverviewFocus {
  const {
    locale,
    orgId,
    teamCount,
    memberCount,
    completedMemberCount,
    pendingInviteCount,
    activeCampaignCount,
    canCreateTeam,
    canInviteMembers,
    canLaunchCampaign,
    canViewCampaigns,
  } = input;
  const hu = locale === "hu";
  const teamsHref = `/org/${orgId}?tab=teams`;
  const membersHref = `/org/${orgId}?tab=members`;
  const campaignsHref = `/org/${orgId}?tab=campaigns`;

  if (teamCount === 0 && canCreateTeam) {
    return {
      title: hu ? "Hozd létre az első csapatot" : "Create the first team",
      description: hu
        ? "A szervezeti mérés és a vezetői riport aktív csapatstruktúrára épül."
        : "Organization measurements and leadership reports require an active team structure.",
      primary: { label: hu ? "Csapat létrehozása" : "Create team", href: teamsHref },
      secondary: canInviteMembers
        ? { label: hu ? "Tagok meghívása" : "Invite members", href: membersHref }
        : null,
    };
  }

  if (pendingInviteCount > 0) {
    return {
      title: hu ? "Kövesd a függő meghívásokat" : "Follow up pending invitations",
      description: hu
        ? `${pendingInviteCount} meghívás még elfogadásra vár. A résztvevők csatlakozása után indulhat stabilan a következő mérési kör.`
        : `${pendingInviteCount} invitation(s) are still pending. The next measurement can start reliably once participants join.`,
      primary: { label: hu ? "Meghívások áttekintése" : "Review invitations", href: membersHref },
      secondary: { label: hu ? "Csapatok megnyitása" : "Open teams", href: teamsHref },
    };
  }

  if (
    canInviteMembers &&
    (memberCount < MIN_MEMBERS_FOR_ORG_INSIGHTS ||
      completedMemberCount < MIN_MEMBERS_FOR_ORG_INSIGHTS)
  ) {
    return {
      title: hu ? "Növeld az aktív részvételt" : "Increase active participation",
      description: hu
        ? `${completedMemberCount}/${Math.max(memberCount, MIN_MEMBERS_FOR_ORG_INSIGHTS)} tag rendelkezik kész önértékeléssel. Legalább ${MIN_MEMBERS_FOR_ORG_INSIGHTS} kész kitöltés kell a szervezeti összképhez.`
        : `${completedMemberCount}/${Math.max(memberCount, MIN_MEMBERS_FOR_ORG_INSIGHTS)} members have a completed self-assessment. At least ${MIN_MEMBERS_FOR_ORG_INSIGHTS} completions are needed for organization-level insight.`,
      primary: { label: hu ? "Tagok és állapotok" : "Members and status", href: membersHref },
      secondary: null,
    };
  }

  if (activeCampaignCount === 0 && canLaunchCampaign && canViewCampaigns) {
    return {
      title: hu ? "Indítsd el a következő mérési kört" : "Launch the next measurement round",
      description: hu
        ? "A csapatstruktúra és a minimális részvétel rendelkezésre áll; most egy közös mérési kör ad következő szervezeti pillanatképet."
        : "The team structure and minimum participation are ready; a shared measurement round can now create the next organization snapshot.",
      primary: {
        label: hu ? "Új mérés indítása" : "Start measurement",
        href: `/org/${orgId}/campaigns/new`,
      },
      secondary: { label: hu ? "Korábbi mérések" : "Previous measurements", href: campaignsHref },
    };
  }

  if (activeCampaignCount > 0 && canViewCampaigns) {
    return {
      title: hu ? "Kövesd az aktív mérési kört" : "Track the active measurement round",
      description: hu
        ? `${activeCampaignCount} aktív mérés fut. A következő vezetői döntéshez először a részvételt és az elakadásokat tekintsd át.`
        : `${activeCampaignCount} measurement round(s) are active. Review participation and blockers before the next leadership decision.`,
      primary: { label: hu ? "Mérések megnyitása" : "Open measurements", href: campaignsHref },
      secondary: { label: hu ? "Csapatok áttekintése" : "Review teams", href: teamsHref },
    };
  }

  return {
    title: hu ? "Tekintsd át a csapatok állapotát" : "Review team status",
    description: hu
      ? "A szervezeti alapok rendben vannak. A következő döntést a csapatok aktuális részvételi és riportállapota alapján hozd meg."
      : "The organization foundations are in place. Base the next decision on current team participation and report status.",
    primary: { label: hu ? "Csapatok megnyitása" : "Open teams", href: teamsHref },
    secondary: null,
  };
}
