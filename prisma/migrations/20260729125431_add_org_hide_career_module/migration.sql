-- Org-szintű karrier-modul kapcsoló (trita admin állítja)
ALTER TABLE "Organization" ADD COLUMN "hideCareerModule" BOOLEAN NOT NULL DEFAULT false;
