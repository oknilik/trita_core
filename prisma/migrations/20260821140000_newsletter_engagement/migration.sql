-- Hírlevél 2. kör (2026-08-21): kattintás-mérés, szerkesztett szám,
-- és a `newsletter` topic alapértelmezetté tétele.
--
-- A topics default azért bővül, mert a megerősítő levél SZÖVEGE is mindkettőt
-- ígéri („új blogbejegyzésnél és időnként egy-egy összefoglalónál") — a
-- hozzájárulás tehát eddig is mindkettőre szólt, csak a default volt szűkebb.
-- A MEGLÉVŐ sorokat is bővítjük, hogy a lista ne szakadjon ketté.

ALTER TABLE "NewsletterSubscriber"
  ALTER COLUMN "topics" SET DEFAULT ARRAY['blog', 'newsletter']::TEXT[];

UPDATE "NewsletterSubscriber"
  SET "topics" = ARRAY['blog', 'newsletter']::TEXT[]
  WHERE "topics" = ARRAY['blog']::TEXT[];

ALTER TABLE "NewsletterDelivery" ADD COLUMN "clickedAt" TIMESTAMP(3);
CREATE INDEX "NewsletterDelivery_slug_clickedAt_idx" ON "NewsletterDelivery"("slug", "clickedAt");

CREATE TABLE "NewsletterIssue" (
    "id" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'hu',
    "subject" TEXT NOT NULL,
    "intro" TEXT NOT NULL,
    "postSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "sentAt" TIMESTAMP(3),
    "recipients" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterIssue_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "NewsletterIssue_status_createdAt_idx" ON "NewsletterIssue"("status", "createdAt");
