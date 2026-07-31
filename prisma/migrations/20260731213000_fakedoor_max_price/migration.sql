-- „Drágának tartom" ág: mennyit adna érte. Kézzel írt migráció (a shadow DB
-- egy örökölt migráción elhasal).
ALTER TABLE "FakeDoorResponse" ADD COLUMN "maxPriceHuf" INTEGER;
