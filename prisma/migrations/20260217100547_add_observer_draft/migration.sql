-- CreateTable
CREATE TABLE "ObserverDraft" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "phase" TEXT NOT NULL DEFAULT 'assessment',
    "relationshipType" TEXT NOT NULL,
    "knownDuration" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ObserverDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ObserverDraft_invitationId_key" ON "ObserverDraft"("invitationId");

-- AddForeignKey
ALTER TABLE "ObserverDraft" ADD CONSTRAINT "ObserverDraft_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ObserverInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
