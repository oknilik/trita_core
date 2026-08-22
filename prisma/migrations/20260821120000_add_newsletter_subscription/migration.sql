-- Hírlevél / blog-feliratkozás (2026-08-21).
--
-- Külön tábla, nem UserProfile-mező: a feliratkozók többségének nincs fiókja.
-- Double opt-in: a sor PENDING-ként jön létre, ACTIVE csak a confirmToken
-- megnyitásával lesz — küldeni kizárólag ACTIVE sorra szabad.
--
-- A NewsletterDelivery a kiküldés-napló: az (subscriberId, slug) unique teszi
-- a digest-cront idempotenssé (párhuzamos futás vagy kézi újraküldés esetén is).

CREATE TABLE "NewsletterSubscriber" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'hu',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "topics" TEXT[] DEFAULT ARRAY['blog']::TEXT[],
    "source" TEXT NOT NULL DEFAULT 'blog',
    "confirmToken" TEXT NOT NULL,
    "tokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "unsubToken" TEXT NOT NULL,
    "confirmedAt" TIMESTAMP(3),
    "unsubscribedAt" TIMESTAMP(3),
    "lastSentAt" TIMESTAMP(3),
    "userProfileId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsletterSubscriber_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NewsletterDelivery" (
    "id" TEXT NOT NULL,
    "subscriberId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sentAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NewsletterDelivery_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "NewsletterSubscriber_email_key" ON "NewsletterSubscriber"("email");
CREATE UNIQUE INDEX "NewsletterSubscriber_confirmToken_key" ON "NewsletterSubscriber"("confirmToken");
CREATE UNIQUE INDEX "NewsletterSubscriber_unsubToken_key" ON "NewsletterSubscriber"("unsubToken");
CREATE INDEX "NewsletterSubscriber_status_locale_idx" ON "NewsletterSubscriber"("status", "locale");
CREATE INDEX "NewsletterSubscriber_userProfileId_idx" ON "NewsletterSubscriber"("userProfileId");
CREATE INDEX "NewsletterSubscriber_createdAt_idx" ON "NewsletterSubscriber"("createdAt");

CREATE UNIQUE INDEX "NewsletterDelivery_subscriberId_slug_key" ON "NewsletterDelivery"("subscriberId", "slug");
CREATE INDEX "NewsletterDelivery_slug_sentAt_idx" ON "NewsletterDelivery"("slug", "sentAt");

ALTER TABLE "NewsletterSubscriber" ADD CONSTRAINT "NewsletterSubscriber_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NewsletterDelivery" ADD CONSTRAINT "NewsletterDelivery_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "NewsletterSubscriber"("id") ON DELETE CASCADE ON UPDATE CASCADE;
