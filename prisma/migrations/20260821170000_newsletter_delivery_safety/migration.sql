-- Hírlevél 3. kör: atomi claim, valós kézbesítési állapotok, DOI-outbox,
-- szerkesztett szám előnézet-/retry-életciklus és DB-szintű invariánsok.

UPDATE "NewsletterSubscriber"
SET "topics" = ARRAY['blog', 'newsletter']::TEXT[]
WHERE "topics" IS NULL;

UPDATE "NewsletterSubscriber" SET "source" = 'blog_index' WHERE "source" = 'blog';

ALTER TABLE "NewsletterSubscriber"
  ALTER COLUMN "topics" SET NOT NULL,
  ALTER COLUMN "source" SET DEFAULT 'blog_index',
  ADD COLUMN "confirmationEmailStatus" TEXT NOT NULL DEFAULT 'QUEUED',
  ADD COLUMN "confirmationEmailAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "confirmationEmailLastAttemptAt" TIMESTAMP(3),
  ADD COLUMN "confirmationEmailSentAt" TIMESTAMP(3),
  ADD COLUMN "confirmationEmailLastError" TEXT;

-- A korábbi sorokhoz már lefutott a szinkron küldési kísérlet; ne indítsuk
-- el őket tömegesen újra a migráció pillanatában.
UPDATE "NewsletterSubscriber"
SET "confirmationEmailStatus" = CASE
  WHEN "source" = 'account' THEN 'NOT_REQUIRED'
  ELSE 'SENT'
END;

ALTER TABLE "NewsletterDelivery"
  ADD COLUMN "status" TEXT NOT NULL DEFAULT 'CLAIMED',
  ADD COLUMN "claimedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ADD COLUMN "acceptedAt" TIMESTAMP(3),
  ADD COLUMN "deliveredAt" TIMESTAMP(3),
  ADD COLUMN "failedAt" TIMESTAMP(3),
  ADD COLUMN "providerEmailId" TEXT,
  ADD COLUMN "attemptCount" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "lastError" TEXT;

-- A régi naplósor csak azt bizonyítja, hogy a Resend API átvette a kérést;
-- kézbesítettnek nem nevezzük visszamenőleg.
UPDATE "NewsletterDelivery"
SET "status" = 'ACCEPTED',
    "claimedAt" = "sentAt",
    "acceptedAt" = "sentAt";

CREATE UNIQUE INDEX "NewsletterDelivery_providerEmailId_key"
  ON "NewsletterDelivery"("providerEmailId");
CREATE INDEX "NewsletterDelivery_status_claimedAt_idx"
  ON "NewsletterDelivery"("status", "claimedAt");
CREATE INDEX "NewsletterDelivery_slug_status_idx"
  ON "NewsletterDelivery"("slug", "status");

UPDATE "NewsletterIssue" SET "postSlugs" = ARRAY[]::TEXT[] WHERE "postSlugs" IS NULL;

ALTER TABLE "NewsletterIssue"
  ALTER COLUMN "postSlugs" SET NOT NULL,
  ADD COLUMN "failures" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "previewHash" TEXT,
  ADD COLUMN "previewedAt" TIMESTAMP(3),
  ADD COLUMN "sendStartedAt" TIMESTAMP(3);

ALTER TABLE "NewsletterSubscriber"
  ADD CONSTRAINT "NewsletterSubscriber_locale_check"
    CHECK ("locale" IN ('hu', 'en')),
  ADD CONSTRAINT "NewsletterSubscriber_status_check"
    CHECK ("status" IN ('PENDING', 'ACTIVE', 'UNSUBSCRIBED', 'BOUNCED')),
  ADD CONSTRAINT "NewsletterSubscriber_topics_check"
    CHECK (
      cardinality("topics") > 0
      AND "topics" <@ ARRAY['blog', 'newsletter']::TEXT[]
    ),
  ADD CONSTRAINT "NewsletterSubscriber_source_check"
    CHECK ("source" IN ('blog_post', 'blog_index', 'footer', 'try_complete', 'account')),
  ADD CONSTRAINT "NewsletterSubscriber_confirmation_email_status_check"
    CHECK ("confirmationEmailStatus" IN ('QUEUED', 'SENDING', 'SENT', 'FAILED', 'NOT_REQUIRED'));

ALTER TABLE "NewsletterDelivery"
  ADD CONSTRAINT "NewsletterDelivery_status_check"
    CHECK ("status" IN (
      'CLAIMED', 'ACCEPTED', 'DELIVERED', 'FAILED', 'UNKNOWN',
      'SUPPRESSED', 'BOUNCED', 'COMPLAINED'
    )),
  ADD CONSTRAINT "NewsletterDelivery_attempt_count_check"
    CHECK ("attemptCount" >= 1);

ALTER TABLE "NewsletterIssue"
  ADD CONSTRAINT "NewsletterIssue_locale_check"
    CHECK ("locale" IN ('hu', 'en')),
  ADD CONSTRAINT "NewsletterIssue_status_check"
    CHECK ("status" IN ('DRAFT', 'READY', 'SENDING', 'PARTIAL', 'SENT', 'FAILED')),
  ADD CONSTRAINT "NewsletterIssue_recipients_check"
    CHECK ("recipients" >= 0),
  ADD CONSTRAINT "NewsletterIssue_failures_check"
    CHECK ("failures" >= 0);
