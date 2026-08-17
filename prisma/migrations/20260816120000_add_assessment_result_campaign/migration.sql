-- A self-eredményt opcionálisan ahhoz a kampánykörhöz kötjük, amelyből
-- a kérdőív megnyílt. A null érték megőrzi a legacy/self-serve adatokat.
ALTER TABLE "AssessmentResult"
ADD COLUMN "campaignId" TEXT;

CREATE INDEX "AssessmentResult_campaignId_idx"
ON "AssessmentResult"("campaignId");

ALTER TABLE "AssessmentResult"
ADD CONSTRAINT "AssessmentResult_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id")
ON DELETE SET NULL ON UPDATE CASCADE;
