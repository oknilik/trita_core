-- Több-csapatos kampány: teamIds lista (backfill a legacy teamId-ból)
ALTER TABLE "Campaign" ADD COLUMN "teamIds" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
UPDATE "Campaign" SET "teamIds" = ARRAY["teamId"] WHERE "teamId" IS NOT NULL;
