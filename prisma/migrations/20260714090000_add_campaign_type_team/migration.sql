-- Campaign: mérés-típus + csapat-célzás
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "type" TEXT NOT NULL DEFAULT 'OBSERVER_360';
ALTER TABLE "Campaign" ADD COLUMN IF NOT EXISTS "teamId" TEXT;
CREATE INDEX IF NOT EXISTS "Campaign_teamId_idx" ON "Campaign"("teamId");
