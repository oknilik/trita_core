-- Iparági illeszkedés kalibrációs visszajelzés
CREATE TABLE IF NOT EXISTS "RoleFitFeedback" (
  "id" TEXT NOT NULL,
  "userProfileId" TEXT NOT NULL,
  "industryKey" TEXT NOT NULL,
  "roleKey" TEXT NOT NULL,
  "fitScore" INTEGER NOT NULL,
  "verdict" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "RoleFitFeedback_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "RoleFitFeedback_userProfileId_industryKey_roleKey_key"
  ON "RoleFitFeedback"("userProfileId", "industryKey", "roleKey");
CREATE INDEX IF NOT EXISTS "RoleFitFeedback_industryKey_roleKey_idx"
  ON "RoleFitFeedback"("industryKey", "roleKey");

ALTER TABLE "RoleFitFeedback"
  ADD CONSTRAINT "RoleFitFeedback_userProfileId_fkey"
  FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
