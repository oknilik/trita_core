"use client";

import { useSearchParams } from "next/navigation";
import { useState, useCallback, useEffect } from "react";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { PrimaryTabs } from "./PrimaryTabs";
import { OrgCampaignsTab } from "./OrgCampaignsTab";
import { OrgTeamsTab } from "./OrgTeamsTab";
import { OrgMembersTab } from "./OrgMembersTab";
import { OrgInquiriesTab, type OrgInquiryRow } from "./OrgInquiriesTab";
import { OrgCandidatesTab, type OrgCandidateRow } from "./OrgCandidatesTab";
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
  /** Mérés-kezelés (kampányok) — csak tanácsadói felületen igaz. */
  canManageMeasurements: boolean;
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
  /** Beérkezett kérdések — csak tanácsadói felületen (null = nincs fül). */
  inquiries?: OrgInquiryRow[] | null;
  /** Jelöltek — csak tanácsadói felületen (null = nincs fül). */
  candidates?: OrgCandidateRow[] | null;
  /** Tag-dossié bázis-URL VAGY null — a page számolja (canViewMemberDossier). */
  dossierBaseHref?: string | null;
}

export function OrgPageShell({
  orgId,
  profileId,
  isAdmin,
  isManager,
  canCreateTeam,
  canInviteMembers,
  canManageCampaigns,
  canManageMeasurements,
  actionGateCopy = null,
  isHu,
  locale,
  dateLocale,
  pageData,
  members,
  pendingInvites,
  teams,
  inquiries = null,
  candidates = null,
  dossierBaseHref = null,
}: OrgPageShellProps) {
  const searchParams = useSearchParams();
  // Egyszerű váz mindenkinek: Csapatok az alapfül; a Kampányok fül csak a
  // tanácsadói felületen létezik. (Az Áttekintés fül kivezetve — duplikált.)
  const defaultTab = "teams";
  const allowedTabs = canManageMeasurements
    ? [
        "teams",
        "campaigns",
        "members",
        ...(candidates ? ["candidates"] : []),
        ...(inquiries ? ["inquiries"] : []),
      ]
    : ["teams", "members"];
  const rawTabFromUrl = searchParams.get("tab") ?? defaultTab;
  const tabFromUrl = allowedTabs.includes(rawTabFromUrl) ? rawTabFromUrl : defaultTab;
  const [activeTab, setActiveTab] = useState(tabFromUrl);

  // Sync local tab state when URL search params change (e.g. link navigation)
  useEffect(() => {
    setActiveTab(tabFromUrl);
  }, [tabFromUrl]);

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
    {
      key: "teams",
      label: t("org.shell.tabTeams", loc),
      badge: teams.length > 0 ? teams.length : undefined,
    },
    ...(canManageMeasurements
      ? [
          {
            key: "campaigns",
            label: t("org.shell.tabCampaigns", loc),
            badge: activeCampaignCount > 0 ? activeCampaignCount : undefined,
          },
        ]
      : []),
    {
      key: "members",
      label: t("org.shell.tabMembers", loc),
      badge: members.length + pendingInvites.length,
    },
    ...(candidates
      ? [
          {
            key: "candidates",
            label: t("org.shell.tabCandidates", loc),
            badge: candidates.length > 0 ? candidates.length : undefined,
          },
        ]
      : []),
    ...(inquiries
      ? [
          {
            key: "inquiries",
            label: t("org.shell.tabInquiries", loc),
            badge:
              inquiries.filter((i) => i.status === "NEW").length > 0
                ? inquiries.filter((i) => i.status === "NEW").length
                : undefined,
          },
        ]
      : []),
  ];

  return (
    <div className="flex flex-col gap-6">
      <PrimaryTabs tabs={tabs} activeTab={activeTab} onTabChange={handleTabChange} />

      <div>
        {canManageMeasurements && activeTab === "campaigns" && (
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

        {candidates && activeTab === "candidates" && (
          <OrgCandidatesTab
            orgId={orgId}
            candidates={candidates}
            isHu={isHu}
            dateLocale={dateLocale}
          />
        )}

        {inquiries && activeTab === "inquiries" && (
          <OrgInquiriesTab orgId={orgId} inquiries={inquiries} isHu={isHu} />
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
            dossierBaseHref={dossierBaseHref}
            isHu={isHu}
            locale={locale}
            dateLocale={dateLocale}
          />
        )}

      </div>
    </div>
  );
}
