-- A nevesített kampánypreset eredetének megőrzése.
--
-- A lépéssor önmagában nem bizonyítja, hogy a tanácsadó SCAN_V1 csomagot
-- választott: egy CUSTOM kampány ugyanazokat a lépéseket is tartalmazhatja.
-- A mező opcionális, ezért a korábbi kampányok változatlanul olvashatók és
-- fail-closed módon nem válnak utólag Scan v1 kohorsz-/elszámolási egységgé.

ALTER TABLE "Campaign" ADD COLUMN "presetId" TEXT;

CREATE INDEX "Campaign_presetId_idx" ON "Campaign"("presetId");
