-- Pilot P0: a riport forrásköre legyen explicit és adatbázisban őrzött.
-- A régi riportok null értékkel megmaradnak, de a runtime nem engedi őket
-- újrapublikálni. Egy kampány × csapat csak egy riportot adhat.

ALTER TABLE "TeamReport" ADD COLUMN "campaignId" TEXT;

CREATE UNIQUE INDEX "TeamReport_campaignId_teamId_key"
  ON "TeamReport"("campaignId", "teamId");
CREATE INDEX "TeamReport_campaignId_idx"
  ON "TeamReport"("campaignId");

ALTER TABLE "TeamReport"
  ADD CONSTRAINT "TeamReport_campaignId_fkey"
  FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
