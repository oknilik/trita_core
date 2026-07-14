-- Karrier-iránytű háttéradatok
ALTER TABLE "UserProfile" ADD COLUMN IF NOT EXISTS "careerBackground" JSONB;
