ALTER TABLE "UserProfile"
ADD COLUMN "platformTermsVersion" TEXT,
ADD COLUMN "platformTermsAcceptedAt" TIMESTAMP(3),
ADD COLUMN "privacyNoticeVersion" TEXT,
ADD COLUMN "privacyNoticeAcceptedAt" TIMESTAMP(3);
