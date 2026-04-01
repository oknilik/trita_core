"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { PrimaryTabs } from "./PrimaryTabs";
import { OrgCampaignsTab } from "./OrgCampaignsTab";
import { OrgOverviewTab } from "./OrgOverviewTab";
import { OrgTeamsTab } from "./OrgTeamsTab";
import { OrgMembersTab } from "./OrgMembersTab";
import type {
  OrgPageData,
  SerializedMember,
  SerializedPendingInvite,
  SerializedTeam,
} from "@/lib/org-stats";

interface OrgPageShellProps {
  orgId: string;
  orgName: string;
  profileId: string;
  isAdmin: boolean;
  isManager: boolean;
  canCreateTeam: boolean;
  canInviteMembers: boolean;
  canManageCampaigns: boolean;
  actionGateCopy?: {
    title: string;
    description: string;
    ctaLabel: string;
    ctaHref: string;
  } | null;
  isHu: boolean;
  locale: string;
  dateLocale: string;
  pageData: OrgPageData;
  members: SerializedMember[];
  pendingInvites: SerializedPendingInvite[];
  teams: SerializedTeam[];
}

export function OrgPageShell({
  orgId,
  profileId,
  isAdmin,
  isManager,
  canCreateTeam,
  canInviteMembers,
  canManageCampaigns,
  actionGateCopy = null,
  isHu,
  locale,
  dateLocale,
  pageData,
  members,
  pendingInvites,
  teams,
}: OrgPageShellProps) {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") ?? "overview";
  const [activeTab, setActiveTab] = useState(initialTab);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("tab", key);
      window.history.replaceState({}, "", url.toString());
    }
  }, []);

  const activeCampaignCount = pageData.activeCampaignCount;

  const loc = locale as Locale;

  const tabs = [
    { key: "overview", label: t("org.shell.tabOverview", loc) },
    {
      key: "campaigns",
      label: t("org.shell.tabCampaigns", loc),
      badge: activeCampaignCount > 0 ? activeCampaignCount : undefined,
    },
    {
      key: "teams",
      label: t("org.shell.tabTeams", loc),
      badge: teams.length > 0 ? teams.length : undefined,
    },
    {
      key: "members",
      label: t("org.shell.tabMembers", loc),
      badge: members.length + pendingInvites.length,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PrimaryTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <div>
        {activeTab === "overview" && (
          <OrgOverviewTab
            hexacoAvg={pageData.hexacoAvg}
            teams={teams}
            orgId={orgId}
            campaigns={pageData.campaigns}
            memberCount={pageData.memberCount}
            completedMemberCount={pageData.completedMemberCount}
            activeCampaignCount={pageData.activeCampaignCount}
            isHu={isHu}
            dateLocale={dateLocale}
            isManager={isManager}
          />
        )}

        {activeTab === "campaigns" && (
          <OrgCampaignsTab
            orgId={orgId}
            campaigns={pageData.campaigns}
            isManager={isManager}
            canManageCampaigns={canManageCampaigns}
            actionGateCopy={actionGateCopy}
            isHu={isHu}
          />
        )}

        {activeTab === "teams" && (
          <OrgTeamsTab
            teams={teams}
            orgId={orgId}
            locale={locale}
            isManager={isManager}
            canCreateTeam={canCreateTeam}
            actionGateCopy={actionGateCopy}
            isHu={isHu}
          />
        )}

        {activeTab === "members" && (
          <OrgMembersTab
            members={members}
            pendingInvites={pendingInvites}
            orgId={orgId}
            profileId={profileId}
            isManager={isManager}
            isAdmin={isAdmin}
            canInviteMembers={canInviteMembers}
            actionGateCopy={actionGateCopy}
            isHu={isHu}
            locale={locale}
            dateLocale={dateLocale}
          />
        )}
      </div>
    </div>
  );
}
