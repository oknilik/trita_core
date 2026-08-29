ALTER TYPE "NotificationType" ADD VALUE 'LEGAL_ACCEPTANCE_REQUIRED';

CREATE TABLE "LegalAcceptanceCampaign" (
    "id" TEXT NOT NULL,
    "platformTermsVersion" TEXT NOT NULL,
    "privacyNoticeVersion" TEXT NOT NULL,
    "effectiveAt" TIMESTAMP(3) NOT NULL,
    "activatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastSentAt" TIMESTAMP(3),
    "recipientCount" INTEGER NOT NULL DEFAULT 0,
    "sendCount" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "LegalAcceptanceCampaign_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalAcceptanceCampaign_platformTermsVersion_privacyNoticeVersion_key"
ON "LegalAcceptanceCampaign"("platformTermsVersion", "privacyNoticeVersion");

CREATE INDEX "LegalAcceptanceCampaign_activatedAt_idx"
ON "LegalAcceptanceCampaign"("activatedAt");

ALTER TABLE "LegalAcceptanceCampaign"
ADD CONSTRAINT "LegalAcceptanceCampaign_createdById_fkey"
FOREIGN KEY ("createdById") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "LegalAcceptanceRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "campaignId" TEXT,
    "platformTermsVersion" TEXT NOT NULL,
    "privacyNoticeVersion" TEXT NOT NULL,
    "acceptedAt" TIMESTAMP(3) NOT NULL,
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegalAcceptanceRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "LegalAcceptanceRecord_userId_platformTermsVersion_privacyNoticeVersion_key"
ON "LegalAcceptanceRecord"("userId", "platformTermsVersion", "privacyNoticeVersion");

CREATE INDEX "LegalAcceptanceRecord_campaignId_idx" ON "LegalAcceptanceRecord"("campaignId");
CREATE INDEX "LegalAcceptanceRecord_acceptedAt_idx" ON "LegalAcceptanceRecord"("acceptedAt");

ALTER TABLE "LegalAcceptanceRecord"
ADD CONSTRAINT "LegalAcceptanceRecord_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "LegalAcceptanceRecord"
ADD CONSTRAINT "LegalAcceptanceRecord_campaignId_fkey"
FOREIGN KEY ("campaignId") REFERENCES "LegalAcceptanceCampaign"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- A már regisztrációkor rögzített elfogadásokat is átemeljük az előzménybe.
INSERT INTO "LegalAcceptanceRecord" (
    "id", "userId", "platformTermsVersion", "privacyNoticeVersion", "acceptedAt", "source"
)
SELECT
    'legacy_' || md5("id" || "platformTermsVersion" || "privacyNoticeVersion"),
    "id",
    "platformTermsVersion",
    "privacyNoticeVersion",
    GREATEST("platformTermsAcceptedAt", "privacyNoticeAcceptedAt"),
    'REGISTRATION'
FROM "UserProfile"
WHERE "platformTermsVersion" IS NOT NULL
  AND "privacyNoticeVersion" IS NOT NULL
  AND "platformTermsAcceptedAt" IS NOT NULL
  AND "privacyNoticeAcceptedAt" IS NOT NULL
ON CONFLICT ("userId", "platformTermsVersion", "privacyNoticeVersion") DO NOTHING;
