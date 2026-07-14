-- TeamReport: vezetői útmutató + strukturált akcióterv
ALTER TABLE "TeamReport" ADD COLUMN IF NOT EXISTS "leadershipGuide" TEXT;
ALTER TABLE "TeamReport" ADD COLUMN IF NOT EXISTS "actionItems" JSONB;
