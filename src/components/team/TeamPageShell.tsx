"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback } from "react";
import { PrimaryTabs } from "@/components/org/PrimaryTabs";
import { TeamOverviewTab } from "./TeamOverviewTab";
import { TeamProfileTab } from "./TeamProfileTab";
import { TeamMembersTab } from "./TeamMembersTab";
import { TeamIntelligence } from "./TeamIntelligence";
import type { IntelligenceMember } from "./TeamIntelligence";
import type { TeamPageData } from "@/lib/team-stats";

const AVATAR_COLORS = [
  "#6366F1",
  "#EC4899",
  "#10B981",
  "#F59E0B",
  "#8B5CF6",
  "#06B6D4",
];

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

interface TeamPageShellProps {
  data: TeamPageData;
  isOrgManager: boolean;
  locale: string;
  dateLocale: string;
  profileId: string;
}

export function TeamPageShell({
  data,
  isOrgManager,
  locale,
  dateLocale,
  profileId,
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
      key: "intelligence",
      label: isHu ? "Csapatintelligencia" : "Team Intelligence",
      shortLabel: isHu ? "Intelligencia" : "Intelligence",
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

  const intelligenceMembers: IntelligenceMember[] = data.members.map((m) => {
    const hexaco = m.scores
      ? {
          H: Math.round(m.scores["H"] ?? 50),
          E: Math.round(m.scores["E"] ?? 50),
          X: Math.round(m.scores["X"] ?? 50),
          A: Math.round(m.scores["A"] ?? 50),
          C: Math.round(m.scores["C"] ?? 50),
          O: Math.round(m.scores["O"] ?? 50),
        }
      : { H: 50, E: 50, X: 50, A: 50, C: 50, O: 50 };

    const color = AVATAR_COLORS[
      m.displayName.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0) %
        AVATAR_COLORS.length
    ];

    const name = m.displayName;
    const parts = name.trim().split(/\s+/);
    const initials =
      parts.length >= 2
        ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
        : name.slice(0, 2).toUpperCase();

    const zoneName = getZoneName(2, 2, isHu);

    return {
      id: m.userId,
      name,
      initials,
      hexaco,
      skillLevel: 2,
      growthPotential: 2,
      zone: !m.scores ? (isHu ? "Nincs adat" : "No data") : zoneName,
      color,
      textColor: "#ffffff",
    };
  });

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
          teamId={data.teamId}
          teamName={data.teamName}
          profileId={profileId}
          isOrgManager={isOrgManager}
          isHu={isHu}
          locale={locale}
          dateLocale={dateLocale}
        />
      )}

      {activeTab === "intelligence" && (
        <TeamIntelligence
          members={intelligenceMembers}
          edges={[]}
          isHu={isHu}
        />
      )}
    </div>
  );
}
