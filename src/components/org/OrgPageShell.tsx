"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
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

  const tabs = [
    { key: "overview", label: isHu ? "Áttekintés" : "Overview" },
    {
      key: "campaigns",
      label: isHu ? "Kampányok" : "Campaigns",
      badge: activeCampaignCount > 0 ? activeCampaignCount : undefined,
    },
    {
      key: "teams",
      label: isHu ? "Csapatok" : "Teams",
      badge: teams.length > 0 ? teams.length : undefined,
    },
    {
      key: "members",
      label: isHu ? "Tagok" : "Members",
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
            isHu={isHu}
            dateLocale={dateLocale}
          />
        )}

        {activeTab === "campaigns" && (
          <OrgCampaignsTab
            orgId={orgId}
            campaigns={pageData.campaigns}
            isManager={isManager}
            isHu={isHu}
          />
        )}

        {activeTab === "teams" && (
          <OrgTeamsTab
            teams={teams}
            orgId={orgId}
            locale={locale}
            isManager={isManager}
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
            isHu={isHu}
            locale={locale}
            dateLocale={dateLocale}
          />
        )}
      </div>
    </div>
  );
}
