-- Verziózott ajánlat- és Egyedi Megrendelőlap-pillanatképek.
CREATE TABLE "CommercialDocument" (
    "id" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'GENERATED',
    "snapshot" JSONB NOT NULL,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "signedAt" TIMESTAMP(3),
    "signedFileUrl" TEXT,

    CONSTRAINT "CommercialDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CommercialDocument_quoteId_kind_version_key"
ON "CommercialDocument"("quoteId", "kind", "version");

CREATE INDEX "CommercialDocument_quoteId_generatedAt_idx"
ON "CommercialDocument"("quoteId", "generatedAt");

CREATE INDEX "CommercialDocument_status_generatedAt_idx"
ON "CommercialDocument"("status", "generatedAt");

ALTER TABLE "CommercialDocument"
ADD CONSTRAINT "CommercialDocument_quoteId_fkey"
FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
