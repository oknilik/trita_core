-- Újrafelvételi kör (ujrafuttatas-korok-terv.md 1.2):
-- requireFreshResults kapcsoló + activatedAt referencia-időpont.

ALTER TABLE "Campaign" ADD COLUMN "requireFreshResults" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Campaign" ADD COLUMN "activatedAt" TIMESTAMP(3);
