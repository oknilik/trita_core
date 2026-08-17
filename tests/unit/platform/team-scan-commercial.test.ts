import { readFileSync } from "node:fs";
import { join } from "node:path";
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  TEAM_SCAN_COMMERCIAL_UNITS,
  resolveTeamScanDelivery,
  teamScanDeliveryIdempotencyKey,
  type TeamScanDeliveryEvidence,
} from "@/lib/team-scan-commercial";

const DELIVERED: TeamScanDeliveryEvidence = {
  presetId: "SCAN_V1",
  campaignId: "campaign-1",
  teamId: "team-1",
  campaignStatus: "CLOSED",
  reportStatus: "PUBLISHED",
  reportAssessmentCampaignId: "campaign-1",
  priorDeliveredScanCount: 0,
};

describe("Team Scan commercial contract", () => {
  it("az első teljesített Scan csapatonként egyszeri licenc", () => {
    const result = resolveTeamScanDelivery(DELIVERED);
    assert.equal(result.status, "delivered");
    assert.equal(result.unit, "TEAM_SCAN_LICENSE");
    assert.equal(TEAM_SCAN_COMMERCIAL_UNITS.TEAM_SCAN_LICENSE.revenueModel, "one_off");
  });

  it("a további teljesített Scan kör-előfizetési usage", () => {
    const result = resolveTeamScanDelivery({
      ...DELIVERED,
      campaignId: "campaign-2",
      reportAssessmentCampaignId: "campaign-2",
      priorDeliveredScanCount: 1,
    });
    assert.equal(result.status, "delivered");
    assert.equal(result.unit, "REMEASUREMENT_CYCLE");
    assert.equal(
      TEAM_SCAN_COMMERCIAL_UNITS.REMEASUREMENT_CYCLE.revenueModel,
      "subscription_usage",
    );
  });

  it("a kulcs kampány × csapat alapú, ezért többcsapatos körben sem mosódik össze", () => {
    assert.equal(
      teamScanDeliveryIdempotencyKey("campaign-1", "team-a"),
      "team-scan:v1:campaign-1:team-a",
    );
    assert.notEqual(
      teamScanDeliveryIdempotencyKey("campaign-1", "team-a"),
      teamScanDeliveryIdempotencyKey("campaign-1", "team-b"),
    );
  });

  it("egy hasonló CUSTOM kampányból nem készít számlázható Scan-egységet", () => {
    const result = resolveTeamScanDelivery({ ...DELIVERED, presetId: null });
    assert.deepEqual(result, {
      status: "blocked",
      unit: null,
      idempotencyKey: "team-scan:v1:campaign-1:team-1",
      reason: "not_scan_v1",
      contractVersion: 1,
    });
  });

  it("csak lezárt kampány és a konkrét körből befagyasztott publikált riport teljesít", () => {
    assert.equal(
      resolveTeamScanDelivery({ ...DELIVERED, campaignStatus: "ACTIVE" }).status,
      "blocked",
    );
    assert.equal(
      resolveTeamScanDelivery({ ...DELIVERED, reportStatus: "DRAFT" }).status,
      "blocked",
    );
    const mismatch = resolveTeamScanDelivery({
      ...DELIVERED,
      reportAssessmentCampaignId: "another-campaign",
    });
    assert.equal(mismatch.status, "blocked");
    if (mismatch.status === "blocked") {
      assert.equal(mismatch.reason, "report_campaign_mismatch");
    }
  });

  it("hibás ledger-előzményre fail-closed", () => {
    const result = resolveTeamScanDelivery({
      ...DELIVERED,
      priorDeliveredScanCount: -1,
    });
    assert.equal(result.status, "blocked");
    if (result.status === "blocked") {
      assert.equal(result.reason, "invalid_prior_delivery_count");
    }
  });

  it("a create út megőrzi a preset eredetét, a séma pedig opcionálisan tárolja", () => {
    const route = readFileSync(
      join(process.cwd(), "src/app/api/org/[id]/campaigns/route.ts"),
      "utf8",
    );
    const detailRoute = readFileSync(
      join(process.cwd(), "src/app/api/org/[id]/campaigns/[campaignId]/route.ts"),
      "utf8",
    );
    const schema = readFileSync(join(process.cwd(), "prisma/schema.prisma"), "utf8");
    assert.match(route, /presetId:\s*body\.data\.presetId\s*\?\?\s*null/);
    assert.match(detailRoute, /PRESET_STEPS_IMMUTABLE/);
    assert.match(schema, /model Campaign \{[\s\S]*?presetId\s+String\?/);
  });
});
