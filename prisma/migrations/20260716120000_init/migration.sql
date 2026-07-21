-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('TRITAN');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('FRIEND', 'COLLEAGUE', 'FAMILY', 'PARTNER', 'OTHER');

-- CreateEnum
CREATE TYPE "InvitationStatus" AS ENUM ('PENDING', 'COMPLETED', 'EXPIRED', 'CANCELED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('INDIVIDUAL', 'ORG_ADMIN', 'ORG_MEMBER');

-- CreateEnum
CREATE TYPE "ScoreRange" AS ENUM ('LOW', 'MED', 'HIGH');

-- CreateEnum
CREATE TYPE "ObserverType" AS ENUM ('INTERNAL', 'EXTERNAL', 'ANONYMOUS');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('OBSERVER_COMPLETED', 'OBSERVER_SUBMITTED', 'RESULT_READY', 'PURCHASE_CONFIRMED', 'ORG_INVITE_RECEIVED', 'CAMPAIGN_LAUNCHED', 'CAMPAIGN_CLOSED', 'TEAM_MEMBER_ADDED', 'ORG_INVITE_ACCEPTED', 'TRIAL_ENDING_SOON', 'TRIAL_EXPIRED', 'PAYMENT_FAILED', 'SUBSCRIPTION_FROZEN', 'LOW_CANDIDATE_CREDITS', 'MEMBER_COMPLETED_ASSESSMENT', 'CAMPAIGN_MILESTONE', 'TEAM_REPORT_PUBLISHED', 'MEASUREMENT_STEP_OPENED');

-- CreateTable
CREATE TABLE "UserProfile" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT,
    "email" TEXT,
    "username" TEXT,
    "activeOrgId" TEXT,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "locale" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "birthYear" INTEGER,
    "gender" TEXT,
    "country" TEXT,
    "onboardedAt" TIMESTAMP(3),
    "careerBackground" JSONB,
    "testType" "TestType",
    "testTypeAssignedAt" TIMESTAMP(3),
    "consentedAt" TIMESTAMP(3),
    "assessmentSkippedAt" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'INDIVIDUAL',
    "isConsultant" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "UserProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentDraft" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "answers" JSONB NOT NULL,
    "currentPage" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "draftReminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastDraftReminderSentAt" TIMESTAMP(3),

    CONSTRAINT "AssessmentDraft_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentResult" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT,
    "scores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "testType" "TestType",
    "isSelfAssessment" BOOLEAN NOT NULL DEFAULT true,
    "shareToken" TEXT,

    CONSTRAINT "AssessmentResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ObserverInvitation" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "inviterId" TEXT NOT NULL,
    "observerProfileId" TEXT,
    "observerEmail" TEXT,
    "observerName" TEXT,
    "testType" "TestType" NOT NULL,
    "status" "InvitationStatus" NOT NULL DEFAULT 'PENDING',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "reminderCount" INTEGER NOT NULL DEFAULT 0,
    "lastReminderSentAt" TIMESTAMP(3),
    "observerType" "ObserverType" NOT NULL DEFAULT 'INTERNAL',
    "externalContext" TEXT,

    CONSTRAINT "ObserverInvitation_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "ObserverAssessment" (
    "id" TEXT NOT NULL,
    "invitationId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "knownDuration" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "confidence" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ObserverAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "targetKey" TEXT,
    "rating" INTEGER,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Team" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "orgId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "teamRoleRoundActive" BOOLEAN NOT NULL DEFAULT false,
    "teamRoleRoundStartedAt" TIMESTAMP(3),

    CONSTRAINT "Team_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamReport" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "orgId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT,
    "aggregates" JSONB,
    "summary" TEXT,
    "strengths" TEXT,
    "risks" TEXT,
    "recommendations" TEXT,
    "interviewFindings" TEXT,
    "leadershipGuide" TEXT,
    "actionItems" JSONB,
    "internalNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "publishedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamReport_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamMember" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamPendingInvite" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TeamPendingInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateInvite" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "managerId" TEXT NOT NULL,
    "teamId" TEXT,
    "email" TEXT,
    "name" TEXT,
    "position" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "testType" TEXT NOT NULL DEFAULT 'TRITAN',
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "draftStartedAt" TIMESTAMP(3),
    "draftAnsweredCount" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CandidateInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateResult" (
    "id" TEXT NOT NULL,
    "inviteId" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ownerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "billingProfile" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CandidateCredit" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "balance" INTEGER NOT NULL,
    "note" TEXT,
    "actorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CandidateCredit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "stripeCustomerId" TEXT,
    "stripeSubscriptionId" TEXT,
    "stripePriceId" TEXT,
    "stripeLatestInvoiceId" TEXT,
    "planType" TEXT,
    "billingInterval" TEXT,
    "status" TEXT NOT NULL DEFAULT 'trialing',
    "trialEndsAt" TIMESTAMP(3),
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "candidateCredits" INTEGER NOT NULL DEFAULT 0,
    "billingoLastDocumentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationMember" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ORG_MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "OrganizationMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganizationPendingInvite" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'ORG_MEMBER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrganizationPendingInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Campaign" (
    "id" TEXT NOT NULL,
    "orgId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'OBSERVER_360',
    "steps" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "teamId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),

    CONSTRAINT "Campaign_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CampaignParticipant" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "stepCompletions" JSONB,

    CONSTRAINT "CampaignParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConsultantInvite" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "invitedById" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" TIMESTAMP(3),

    CONSTRAINT "ConsultantInvite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PsychSafetyResponse" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "submittedOn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PsychSafetyResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "orgId" TEXT,
    "teamId" TEXT,
    "tier" TEXT NOT NULL,
    "stripePaymentIntentId" TEXT,
    "stripeCheckoutSessionId" TEXT,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'eur',
    "status" TEXT NOT NULL DEFAULT 'completed',
    "includesAdvisory" BOOLEAN NOT NULL DEFAULT false,
    "advisoryUsed" BOOLEAN NOT NULL DEFAULT false,
    "includedCredits" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "productType" TEXT,
    "grossAmount" INTEGER,
    "billingoDocumentId" TEXT,
    "billingoDocumentNumber" TEXT,
    "invoiceStatus" TEXT NOT NULL DEFAULT 'not_applicable',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRoleAnswer" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRoleAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamRoleScore" (
    "id" TEXT NOT NULL,
    "userProfileId" TEXT NOT NULL,
    "scores" JSONB NOT NULL,
    "source" TEXT NOT NULL,
    "teamRoleAnswerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRoleScore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdvisorySession" (
    "id" TEXT NOT NULL,
    "orgId" TEXT,
    "teamId" TEXT,
    "purchaseId" TEXT,
    "subscriptionId" TEXT,
    "requestedById" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'requested',
    "scheduledAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdvisorySession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "category" TEXT NOT NULL DEFAULT 'system',
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "titleKey" TEXT NOT NULL,
    "bodyKey" TEXT NOT NULL,
    "vars" JSONB,
    "link" TEXT,
    "sourceType" TEXT,
    "sourceId" TEXT,
    "actorUserId" TEXT,
    "dedupeKey" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "readAt" TIMESTAMP(3),
    "dismissed" BOOLEAN NOT NULL DEFAULT false,
    "dismissedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserProfile_clerkId_key" ON "UserProfile"("clerkId");

-- CreateIndex
CREATE INDEX "UserProfile_activeOrgId_idx" ON "UserProfile"("activeOrgId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentDraft_userProfileId_key" ON "AssessmentDraft"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "AssessmentResult_shareToken_key" ON "AssessmentResult"("shareToken");

-- CreateIndex
CREATE INDEX "AssessmentResult_userProfileId_idx" ON "AssessmentResult"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "ObserverInvitation_token_key" ON "ObserverInvitation"("token");

-- CreateIndex
CREATE INDEX "ObserverInvitation_inviterId_idx" ON "ObserverInvitation"("inviterId");

-- CreateIndex
CREATE INDEX "ObserverInvitation_observerProfileId_idx" ON "ObserverInvitation"("observerProfileId");

-- CreateIndex
CREATE INDEX "ObserverInvitation_token_idx" ON "ObserverInvitation"("token");

-- CreateIndex
CREATE UNIQUE INDEX "ObserverDraft_invitationId_key" ON "ObserverDraft"("invitationId");

-- CreateIndex
CREATE UNIQUE INDEX "ObserverAssessment_invitationId_key" ON "ObserverAssessment"("invitationId");

-- CreateIndex
CREATE INDEX "Feedback_kind_targetKey_idx" ON "Feedback"("kind", "targetKey");

-- CreateIndex
CREATE UNIQUE INDEX "Feedback_userProfileId_kind_targetKey_key" ON "Feedback"("userProfileId", "kind", "targetKey");

-- CreateIndex
CREATE INDEX "Team_ownerId_idx" ON "Team"("ownerId");

-- CreateIndex
CREATE INDEX "Team_orgId_idx" ON "Team"("orgId");

-- CreateIndex
CREATE INDEX "TeamReport_teamId_status_idx" ON "TeamReport"("teamId", "status");

-- CreateIndex
CREATE INDEX "TeamMember_teamId_idx" ON "TeamMember"("teamId");

-- CreateIndex
CREATE INDEX "TeamMember_userId_idx" ON "TeamMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamMember_teamId_userId_key" ON "TeamMember"("teamId", "userId");

-- CreateIndex
CREATE INDEX "TeamPendingInvite_email_idx" ON "TeamPendingInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TeamPendingInvite_teamId_email_key" ON "TeamPendingInvite"("teamId", "email");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateInvite_token_key" ON "CandidateInvite"("token");

-- CreateIndex
CREATE INDEX "CandidateInvite_managerId_idx" ON "CandidateInvite"("managerId");

-- CreateIndex
CREATE INDEX "CandidateInvite_token_idx" ON "CandidateInvite"("token");

-- CreateIndex
CREATE INDEX "CandidateInvite_teamId_idx" ON "CandidateInvite"("teamId");

-- CreateIndex
CREATE UNIQUE INDEX "CandidateResult_inviteId_key" ON "CandidateResult"("inviteId");

-- CreateIndex
CREATE INDEX "Organization_ownerId_idx" ON "Organization"("ownerId");

-- CreateIndex
CREATE INDEX "CandidateCredit_orgId_idx" ON "CandidateCredit"("orgId");

-- CreateIndex
CREATE INDEX "CandidateCredit_orgId_createdAt_idx" ON "CandidateCredit"("orgId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_orgId_key" ON "Subscription"("orgId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeCustomerId_key" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_stripeSubscriptionId_key" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_orgId_idx" ON "Subscription"("orgId");

-- CreateIndex
CREATE INDEX "Subscription_stripeCustomerId_idx" ON "Subscription"("stripeCustomerId");

-- CreateIndex
CREATE INDEX "Subscription_stripeSubscriptionId_idx" ON "Subscription"("stripeSubscriptionId");

-- CreateIndex
CREATE INDEX "OrganizationMember_orgId_idx" ON "OrganizationMember"("orgId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_idx" ON "OrganizationMember"("userId");

-- CreateIndex
CREATE INDEX "OrganizationMember_userId_leftAt_idx" ON "OrganizationMember"("userId", "leftAt");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationMember_orgId_userId_key" ON "OrganizationMember"("orgId", "userId");

-- CreateIndex
CREATE INDEX "OrganizationPendingInvite_email_idx" ON "OrganizationPendingInvite"("email");

-- CreateIndex
CREATE UNIQUE INDEX "OrganizationPendingInvite_orgId_email_key" ON "OrganizationPendingInvite"("orgId", "email");

-- CreateIndex
CREATE INDEX "Campaign_orgId_idx" ON "Campaign"("orgId");

-- CreateIndex
CREATE INDEX "Campaign_createdBy_idx" ON "Campaign"("createdBy");

-- CreateIndex
CREATE INDEX "Campaign_teamId_idx" ON "Campaign"("teamId");

-- CreateIndex
CREATE INDEX "CampaignParticipant_campaignId_idx" ON "CampaignParticipant"("campaignId");

-- CreateIndex
CREATE INDEX "CampaignParticipant_userId_idx" ON "CampaignParticipant"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "CampaignParticipant_campaignId_userId_key" ON "CampaignParticipant"("campaignId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "ConsultantInvite_email_key" ON "ConsultantInvite"("email");

-- CreateIndex
CREATE INDEX "ConsultantInvite_email_idx" ON "ConsultantInvite"("email");

-- CreateIndex
CREATE INDEX "PsychSafetyResponse_campaignId_idx" ON "PsychSafetyResponse"("campaignId");

-- CreateIndex
CREATE INDEX "Purchase_userProfileId_idx" ON "Purchase"("userProfileId");

-- CreateIndex
CREATE INDEX "Purchase_orgId_idx" ON "Purchase"("orgId");

-- CreateIndex
CREATE INDEX "Purchase_teamId_idx" ON "Purchase"("teamId");

-- CreateIndex
CREATE INDEX "Purchase_tier_idx" ON "Purchase"("tier");

-- CreateIndex
CREATE INDEX "Purchase_stripeCheckoutSessionId_idx" ON "Purchase"("stripeCheckoutSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRoleAnswer_userProfileId_key" ON "TeamRoleAnswer"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRoleScore_userProfileId_key" ON "TeamRoleScore"("userProfileId");

-- CreateIndex
CREATE UNIQUE INDEX "TeamRoleScore_teamRoleAnswerId_key" ON "TeamRoleScore"("teamRoleAnswerId");

-- CreateIndex
CREATE INDEX "TeamRoleScore_userProfileId_idx" ON "TeamRoleScore"("userProfileId");

-- CreateIndex
CREATE INDEX "AdvisorySession_orgId_idx" ON "AdvisorySession"("orgId");

-- CreateIndex
CREATE INDEX "AdvisorySession_teamId_idx" ON "AdvisorySession"("teamId");

-- CreateIndex
CREATE INDEX "AdvisorySession_purchaseId_idx" ON "AdvisorySession"("purchaseId");

-- CreateIndex
CREATE INDEX "Notification_userId_dismissed_createdAt_idx" ON "Notification"("userId", "dismissed", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_userId_read_idx" ON "Notification"("userId", "read");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_dedupeKey_userId_key" ON "Notification"("dedupeKey", "userId");

-- AddForeignKey
ALTER TABLE "UserProfile" ADD CONSTRAINT "UserProfile_activeOrgId_fkey" FOREIGN KEY ("activeOrgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentDraft" ADD CONSTRAINT "AssessmentDraft_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssessmentResult" ADD CONSTRAINT "AssessmentResult_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObserverInvitation" ADD CONSTRAINT "ObserverInvitation_inviterId_fkey" FOREIGN KEY ("inviterId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObserverInvitation" ADD CONSTRAINT "ObserverInvitation_observerProfileId_fkey" FOREIGN KEY ("observerProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObserverDraft" ADD CONSTRAINT "ObserverDraft_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ObserverInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ObserverAssessment" ADD CONSTRAINT "ObserverAssessment_invitationId_fkey" FOREIGN KEY ("invitationId") REFERENCES "ObserverInvitation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamReport" ADD CONSTRAINT "TeamReport_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamMember" ADD CONSTRAINT "TeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamPendingInvite" ADD CONSTRAINT "TeamPendingInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInvite" ADD CONSTRAINT "CandidateInvite_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateInvite" ADD CONSTRAINT "CandidateInvite_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateResult" ADD CONSTRAINT "CandidateResult_inviteId_fkey" FOREIGN KEY ("inviteId") REFERENCES "CandidateInvite"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Organization" ADD CONSTRAINT "Organization_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CandidateCredit" ADD CONSTRAINT "CandidateCredit_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationMember" ADD CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganizationPendingInvite" ADD CONSTRAINT "OrganizationPendingInvite_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_orgId_fkey" FOREIGN KEY ("orgId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Campaign" ADD CONSTRAINT "Campaign_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CampaignParticipant" ADD CONSTRAINT "CampaignParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConsultantInvite" ADD CONSTRAINT "ConsultantInvite_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsychSafetyResponse" ADD CONSTRAINT "PsychSafetyResponse_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Purchase" ADD CONSTRAINT "Purchase_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoleAnswer" ADD CONSTRAINT "TeamRoleAnswer_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoleScore" ADD CONSTRAINT "TeamRoleScore_userProfileId_fkey" FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoleScore" ADD CONSTRAINT "TeamRoleScore_teamRoleAnswerId_fkey" FOREIGN KEY ("teamRoleAnswerId") REFERENCES "TeamRoleAnswer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;


-- CreateTable (TeamRoleObservation — csapattársi szerep-visszajelzés, 2026-07-20)
CREATE TABLE "TeamRoleObservation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "aboutUserId" TEXT NOT NULL,
    "raterUserId" TEXT NOT NULL,
    "selections" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamRoleObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TeamRoleObservation_campaignId_aboutUserId_raterUserId_key" ON "TeamRoleObservation"("campaignId", "aboutUserId", "raterUserId");

-- CreateIndex
CREATE INDEX "TeamRoleObservation_teamId_aboutUserId_idx" ON "TeamRoleObservation"("teamId", "aboutUserId");

-- CreateIndex
CREATE INDEX "TeamRoleObservation_campaignId_raterUserId_idx" ON "TeamRoleObservation"("campaignId", "raterUserId");

-- AddForeignKey
ALTER TABLE "TeamRoleObservation" ADD CONSTRAINT "TeamRoleObservation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoleObservation" ADD CONSTRAINT "TeamRoleObservation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoleObservation" ADD CONSTRAINT "TeamRoleObservation_aboutUserId_fkey" FOREIGN KEY ("aboutUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TeamRoleObservation" ADD CONSTRAINT "TeamRoleObservation_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable (TrustObservation — bizalmi háló trust-kör, 2026-07-21)
CREATE TABLE "TrustObservation" (
    "id" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "aboutUserId" TEXT NOT NULL,
    "raterUserId" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TrustObservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TrustObservation_campaignId_aboutUserId_raterUserId_key" ON "TrustObservation"("campaignId", "aboutUserId", "raterUserId");

-- CreateIndex
CREATE INDEX "TrustObservation_teamId_aboutUserId_idx" ON "TrustObservation"("teamId", "aboutUserId");

-- CreateIndex
CREATE INDEX "TrustObservation_campaignId_raterUserId_idx" ON "TrustObservation"("campaignId", "raterUserId");

-- AddForeignKey
ALTER TABLE "TrustObservation" ADD CONSTRAINT "TrustObservation_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustObservation" ADD CONSTRAINT "TrustObservation_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustObservation" ADD CONSTRAINT "TrustObservation_aboutUserId_fkey" FOREIGN KEY ("aboutUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TrustObservation" ADD CONSTRAINT "TrustObservation_raterUserId_fkey" FOREIGN KEY ("raterUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
