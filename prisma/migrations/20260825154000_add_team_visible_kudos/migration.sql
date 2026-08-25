ALTER TABLE "PeerFeedbackItem"
ADD COLUMN "teamVisible" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "teamHiddenAt" TIMESTAMP(3);

CREATE INDEX "PeerFeedbackItem_teamId_teamVisible_createdAt_idx"
ON "PeerFeedbackItem"("teamId", "teamVisible", "createdAt");
