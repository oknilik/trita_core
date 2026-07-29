-- Append-only csapatszerep-körök (ujrafuttatas-korok-terv.md 1.1):
-- a userProfileId unique feloldása + campaignId kör-címke + olvasó-index.

-- DropIndex
DROP INDEX "TeamRoleAnswer_userProfileId_key";
DROP INDEX "TeamRoleScore_userProfileId_key";
DROP INDEX "TeamRoleScore_userProfileId_idx";

-- AlterTable
ALTER TABLE "TeamRoleAnswer" ADD COLUMN "campaignId" TEXT;
ALTER TABLE "TeamRoleScore" ADD COLUMN "campaignId" TEXT;

-- CreateIndex
CREATE INDEX "TeamRoleAnswer_userProfileId_createdAt_idx" ON "TeamRoleAnswer"("userProfileId", "createdAt");
CREATE INDEX "TeamRoleAnswer_campaignId_idx" ON "TeamRoleAnswer"("campaignId");
CREATE INDEX "TeamRoleScore_userProfileId_createdAt_idx" ON "TeamRoleScore"("userProfileId", "createdAt");
CREATE INDEX "TeamRoleScore_campaignId_idx" ON "TeamRoleScore"("campaignId");

-- AddForeignKey
ALTER TABLE "TeamRoleAnswer" ADD CONSTRAINT "TeamRoleAnswer_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TeamRoleScore" ADD CONSTRAINT "TeamRoleScore_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;
