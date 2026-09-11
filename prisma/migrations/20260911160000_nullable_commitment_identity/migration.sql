-- The canonical account scrub removes structured profile references while
-- retaining the team's commitment and plan history. Profiles are tombstoned,
-- so this is an explicit scrub rather than a foreign-key deletion cascade.
ALTER TABLE "TeamCommitment" ALTER COLUMN "createdById" DROP NOT NULL;
ALTER TABLE "TeamCommitmentEvent" ALTER COLUMN "actorUserId" DROP NOT NULL;
ALTER TABLE "TeamCommitmentPlan" ALTER COLUMN "updatedById" DROP NOT NULL;
ALTER TABLE "TeamCommitmentPlanEvent" ALTER COLUMN "actorUserId" DROP NOT NULL;
