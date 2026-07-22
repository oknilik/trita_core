-- Tanácsadói riport-narratíva jóváhagyott angol fordítása
-- (gépi fordítás + tanácsadói jóváhagyás; szerkezet: src/lib/team-report-i18n.ts)
ALTER TABLE "TeamReport" ADD COLUMN "translationsEn" JSONB;
