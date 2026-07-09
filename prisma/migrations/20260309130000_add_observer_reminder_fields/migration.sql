ALTER TABLE "ObserverInvitation"
  ADD COLUMN IF NOT EXISTS "reminderCount"      INT       NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "lastReminderSentAt" TIMESTAMP;
