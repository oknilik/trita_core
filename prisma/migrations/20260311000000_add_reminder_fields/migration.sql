-- AddColumn: draftReminderCount and lastDraftReminderSentAt on AssessmentDraft
ALTER TABLE "AssessmentDraft" ADD COLUMN IF NOT EXISTS "draftReminderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "AssessmentDraft" ADD COLUMN IF NOT EXISTS "lastDraftReminderSentAt" TIMESTAMP(3);

-- AddColumn: reminderCount and lastReminderSentAt on ObserverInvitation
ALTER TABLE "ObserverInvitation" ADD COLUMN IF NOT EXISTS "reminderCount" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "ObserverInvitation" ADD COLUMN IF NOT EXISTS "lastReminderSentAt" TIMESTAMP(3);
