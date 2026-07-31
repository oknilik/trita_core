-- Ajánlat-kalkulátor díjtételei (belső). Kézzel írt migráció: a
-- `prisma migrate dev` shadow DB-je egy örökölt migráción elhasal.
CREATE TABLE "QuoteRateCard" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "QuoteRateCard_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "QuoteRateCard_key_key" ON "QuoteRateCard"("key");
