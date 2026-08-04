-- Kijelölt (aktív) csapat: a Vezérlő ide visz, a csapat-váltó állítja
ALTER TABLE "UserProfile" ADD COLUMN "activeTeamId" TEXT;
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_activeTeamId_fkey"
  FOREIGN KEY ("activeTeamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
CREATE INDEX "UserProfile_activeTeamId_idx" ON "UserProfile"("activeTeamId");
