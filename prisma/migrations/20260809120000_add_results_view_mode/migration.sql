-- Eredmeny-nezet valasztas (egyszeru / reszletes) megjegyzese.
-- NULL = a felhasznalo meg nem valasztott, ilyenkor az egyszeru nezet indul.
ALTER TABLE "UserProfile" ADD COLUMN "resultsViewMode" TEXT;
