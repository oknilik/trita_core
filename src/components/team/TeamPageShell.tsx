"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { PrimaryTabs } from "@/components/org/PrimaryTabs";
import { TeamOverviewTab } from "./TeamOverviewTab";
import { TeamProfileTab } from "./TeamProfileTab";
import { TeamMembersTab } from "./TeamMembersTab";
import type { TeamPageData } from "@/lib/team-stats";

interface SerializedCandidateInvite {
  id: string;
  name: string | null;
  email: string | null;
  position: string | null;
  status: string;
  expiresAt: string;
  createdAt: string;
  hasResult: boolean;
}

interface TeamPageShellProps {
  data: TeamPageData;
  isOrgManager: boolean;
  locale: string;
  dateLocale: string;
  profileId: string;
  candidateInvites: SerializedCandidateInvite[];
}

export function TeamPageShell({
  data,
  isOrgManager,
  locale,
  dateLocale,
  profileId,
  candidateInvites,
}: TeamPageShellProps) {
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<string>(
    searchParams.get("tab") ?? "overview"
  );

  const isHu = locale !== "en";

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", key);
    window.history.replaceState({}, "", url.toString());
  }, []);

  const tabs = [
    {
      key: "overview",
      label: isHu ? "Áttekintés" : "Overview",
    },
    {
      key: "profile",
      label: isHu ? "Személyiségprofil" : "Personality",
      badge:
        data.completedCount > 0 ? data.completedCount : undefined,
    },
    {
      key: "members",
      label: isHu ? "Tagok" : "Members",
      badge: data.memberCount + data.pendingInvites.length,
    },
  ];

  // Serialize members for TeamMembersTab
  const serializedMembers = data.members.map((m) => ({
    id: m.id,
    userId: m.userId,
    displayName: m.displayName,
    email: m.email,
    role: m.role,
    joinedAt: m.joinedAt,
    hasAssessment: m.scores !== null,
    testType: m.testType,
  }));

  return (
    <div>
      <PrimaryTabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={handleTabChange}
      />

      {activeTab === "overview" && (
        <TeamOverviewTab
          data={data}
          isHu={isHu}
          dateLocale={dateLocale}
          locale={locale}
        />
      )}

      {activeTab === "profile" && (
        <TeamProfileTab
          heatmapRows={data.heatmapRows}
          dimConfigs={data.dimConfigs}
          locale={locale}
          isHu={isHu}
        />
      )}

      {activeTab === "members" && (
        <TeamMembersTab
          members={serializedMembers}
          pendingInvites={data.pendingInvites}
          candidateInvites={candidateInvites}
          teamId={data.teamId}
          teamName={data.teamName}
          profileId={profileId}
          isOrgManager={isOrgManager}
          isHu={isHu}
          locale={locale}
          dateLocale={dateLocale}
        />
      )}
    </div>
  );
}
