import type { Locale } from "@/lib/i18n";
import type { getTeamPageData } from "@/lib/team-stats";
import type { getLatestPublishedReport } from "@/lib/team-report";
import type { getCapabilityGateCopy } from "@/lib/policy-ux";
import type { CampaignStepType } from "@/lib/campaign-steps-core";

export type TeamPageData = NonNullable<Awaited<ReturnType<typeof getTeamPageData>>>;
export type PublishedReport = Awaited<ReturnType<typeof getLatestPublishedReport>>;

/**
 * A team-oldal tab-komponenseinek közös kontextusa — a page.tsx (vékony
 * elosztó) tölti be és adja át. A tab-specifikus lekérdezések a tab-
 * komponensekben élnek (szerver-komponensek), NEM itt.
 */
export interface TeamTabContext {
  teamId: string;
  orgId: string;
  locale: Locale;
  isHu: boolean;
  teamData: TeamPageData;
  profile: { id: string; email: string | null; isConsultant: boolean };
  orgMemberRole: string;
  /** Tanácsadói felület (nyers eredmények): consultant / platform-admin. */
  canViewRaw: boolean;
  isOrgManager: boolean;
  canManageTeamActions: boolean;
  canReachOrgCampaigns: boolean;
  canEmailInvite: boolean;
  isRestricted: boolean;
  isNone: boolean;
  manageGateCopy: ReturnType<typeof getCapabilityGateCopy> | null;
  publishedReport: PublishedReport;
  hasPublishedReport: boolean;
  /** A néző következő nyitott mérés-lépése a csapat aktív kampányaiban. */
  pendingMeasurement: {
    campaignName: string;
    stepType: CampaignStepType;
    opensAt: Date | null;
  } | null;
}
