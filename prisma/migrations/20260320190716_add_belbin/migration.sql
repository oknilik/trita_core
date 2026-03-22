-- CreateTable
CREATE TABLE "BelbinAnswer" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BelbinAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BelbinScore" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "belbinAnswerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BelbinScore_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BelbinAnswer_userProfileId_key" ON "BelbinAnswer"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "BelbinScore_userProfileId_key" ON "BelbinScore"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "BelbinScore_belbinAnswerId_key" ON "BelbinScore"("belbinAnswerId");

-- CreateIndex
CREATE INDEX "BelbinScore_userProfileId_idx" ON "BelbinScore"("userProfileId");

-- AddForeignKey
ALTER TABLE "BelbinAnswer" ADD CONSTRAINT "BelbinAnswer_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BelbinScore" ADD CONSTRAINT "BelbinScore_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BelbinScore" ADD CONSTRAINT "BelbinScore_belbinAnswerId_fkey" FOREIGN KEY ("belbinAnswerId") REFERENCES "BelbinAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
