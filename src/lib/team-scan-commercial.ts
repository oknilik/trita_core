import type { CampaignPresetId } from "./campaign-steps-core";

/**
 * A partneri elszámolás két kanonikus egysége. Ez a modul ár- és
 * szolgáltatófüggetlen: nem kapcsolja vissza a parkolt billing runtimet.
 */
export const TEAM_SCAN_COMMERCIAL_UNIT_CODES = [
  "TEAM_SCAN_LICENSE",
  "REMEASUREMENT_CYCLE",
] as const;

export type TeamScanCommercialUnitCode =
  (typeof TEAM_SCAN_COMMERCIAL_UNIT_CODES)[number];

export const TEAM_SCAN_COMMERCIAL_CONTRACT_VERSION = 1 as const;

export const TEAM_SCAN_COMMERCIAL_UNITS: Record<
  TeamScanCommercialUnitCode,
  {
    quantityBasis: "team";
    revenueModel: "one_off" | "subscription_usage";
    deliveredAt: "matching_report_published_after_campaign_close";
  }
> = {
  TEAM_SCAN_LICENSE: {
    quantityBasis: "team",
    revenueModel: "one_off",
    deliveredAt: "matching_report_published_after_campaign_close",
  },
  REMEASUREMENT_CYCLE: {
    quantityBasis: "team",
    revenueModel: "subscription_usage",
    deliveredAt: "matching_report_published_after_campaign_close",
  },
};

export type TeamScanDeliveryBlockReason =
  | "invalid_identity"
  | "not_scan_v1"
  | "campaign_not_closed"
  | "report_not_published"
  | "report_campaign_mismatch"
  | "invalid_prior_delivery_count";

export interface TeamScanDeliveryEvidence {
  /** Csak az explicit, adatbázisban megőrzött preset-eredet fogadható el. */
  presetId: CampaignPresetId | string | null | undefined;
  campaignId: string;
  teamId: string;
  campaignStatus: string;
  reportStatus: string | null | undefined;
  /** A befagyasztott riport `aggregates.assessmentCampaignId` mezője. */
  reportAssessmentCampaignId: string | null | undefined;
  /**
   * Ugyanerre a csapatra már teljesített, nem voidolt Scan-egységek száma a
   * későbbi usage ledgerben. Nem nyers riportdarabszám és nem kampánynév.
   */
  priorDeliveredScanCount: number;
}

export type TeamScanDeliveryResolution =
  | {
      status: "delivered";
      unit: TeamScanCommercialUnitCode;
      idempotencyKey: string;
      contractVersion: typeof TEAM_SCAN_COMMERCIAL_CONTRACT_VERSION;
    }
  | {
      status: "blocked";
      unit: null;
      idempotencyKey: string | null;
      reason: TeamScanDeliveryBlockReason;
      contractVersion: typeof TEAM_SCAN_COMMERCIAL_CONTRACT_VERSION;
    };

/**
 * Egy kereskedelmi egység pontosan egy kampány × csapat teljesítés.
 * Többcsapatos kampánynál a hívó csapatonként egyszer futtatja.
 */
export function teamScanDeliveryIdempotencyKey(
  campaignId: string,
  teamId: string,
): string | null {
  const normalizedCampaignId = campaignId.trim();
  const normalizedTeamId = teamId.trim();
  if (!normalizedCampaignId || !normalizedTeamId) return null;
  return `team-scan:v${TEAM_SCAN_COMMERCIAL_CONTRACT_VERSION}:${normalizedCampaignId}:${normalizedTeamId}`;
}

/**
 * Fail-closed teljesítési döntés a későbbi partner-ledger számára.
 *
 * A baseline az első teljesített Scan-egység egy csapatnál; minden további
 * teljesített Scan a kör-előfizetés usage-egysége. A fizetési feltétel és az
 * ár külön megállapodás, ezért itt sem pénzösszeg, sem számlastátusz nincs.
 */
export function resolveTeamScanDelivery(
  evidence: TeamScanDeliveryEvidence,
): TeamScanDeliveryResolution {
  const idempotencyKey = teamScanDeliveryIdempotencyKey(
    evidence.campaignId,
    evidence.teamId,
  );
  const blocked = (
    reason: TeamScanDeliveryBlockReason,
  ): TeamScanDeliveryResolution => ({
    status: "blocked",
    unit: null,
    idempotencyKey,
    reason,
    contractVersion: TEAM_SCAN_COMMERCIAL_CONTRACT_VERSION,
  });

  if (!idempotencyKey) return blocked("invalid_identity");
  if (evidence.presetId !== "SCAN_V1") return blocked("not_scan_v1");
  if (evidence.campaignStatus !== "CLOSED") return blocked("campaign_not_closed");
  if (evidence.reportStatus !== "PUBLISHED") return blocked("report_not_published");
  if (evidence.reportAssessmentCampaignId !== evidence.campaignId) {
    return blocked("report_campaign_mismatch");
  }
  if (
    !Number.isSafeInteger(evidence.priorDeliveredScanCount) ||
    evidence.priorDeliveredScanCount < 0
  ) {
    return blocked("invalid_prior_delivery_count");
  }

  return {
    status: "delivered",
    unit:
      evidence.priorDeliveredScanCount === 0
        ? "TEAM_SCAN_LICENSE"
        : "REMEASUREMENT_CYCLE",
    idempotencyKey,
    contractVersion: TEAM_SCAN_COMMERCIAL_CONTRACT_VERSION,
  };
}
