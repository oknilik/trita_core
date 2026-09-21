ALTER TABLE "Campaign" ADD COLUMN "programKey" TEXT, ADD COLUMN "programVersion" INTEGER, ADD COLUMN "programSnapshot" JSONB, ADD COLUMN "baselineCampaignId" TEXT, ADD COLUMN "baselineReportSnapshot" JSONB;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_baselineCampaignId_fkey" FOREIGN KEY ("baselineCampaignId") REFERENCES "Campaign"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX "Campaign_baselineCampaignId_idx" ON "Campaign"("baselineCampaignId");
ALTER TABLE "TeamReport" ADD COLUMN "revision" INTEGER NOT NULL DEFAULT 1, ADD COLUMN "reviewedRevision" INTEGER, ADD COLUMN "reviewedAt" TIMESTAMP(3), ADD COLUMN "reviewedById" TEXT;
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_program_snapshot_consistent" CHECK (("programKey" IS NULL AND "programVersion" IS NULL AND "programSnapshot" IS NULL) OR ("programKey" IN ('TEAM_SCAN', 'FOLLOW_UP') AND "programVersion" > 0 AND "programSnapshot" IS NOT NULL));
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_follow_up_baseline_required" CHECK ("programKey" IS DISTINCT FROM 'FOLLOW_UP' OR ("baselineCampaignId" IS NOT NULL AND "baselineReportSnapshot" IS NOT NULL AND "baselineCampaignId" <> "id"));
