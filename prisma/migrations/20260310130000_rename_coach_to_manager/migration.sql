-- Compensating migration: rename COACH → MANAGER everywhere
-- Safe to run on a DB that was already db-push'd with the correct names (all DO blocks are idempotent).

-- 1. Rename enum value COACH → MANAGER in UserRole
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_enum
    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
    WHERE pg_type.typname = 'UserRole' AND pg_enum.enumlabel = 'COACH'
  ) THEN
    ALTER TYPE "UserRole" RENAME VALUE 'COACH' TO 'MANAGER';
  END IF;
END $$;

-- 2. Rename table CoachClientRelationship → ManagerClientRelationship
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables WHERE table_name = 'CoachClientRelationship'
  ) THEN
    ALTER TABLE "CoachClientRelationship" RENAME TO "ManagerClientRelationship";
  END IF;
END $$;

-- 3. Rename column coachId → managerId in ManagerClientRelationship
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ManagerClientRelationship' AND column_name = 'coachId'
  ) THEN
    ALTER TABLE "ManagerClientRelationship" RENAME COLUMN "coachId" TO "managerId";
  END IF;
END $$;

-- 4. Rename indices on ManagerClientRelationship
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CoachClientRelationship_coachId_idx') THEN
    ALTER INDEX "CoachClientRelationship_coachId_idx" RENAME TO "ManagerClientRelationship_managerId_idx";
  END IF;
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'CoachClientRelationship_clientId_idx') THEN
    ALTER INDEX "CoachClientRelationship_clientId_idx" RENAME TO "ManagerClientRelationship_clientId_idx";
  END IF;
END $$;

-- 5. Rename column coachId → managerId in GeneratedOutput
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'GeneratedOutput' AND column_name = 'coachId'
  ) THEN
    ALTER TABLE "GeneratedOutput" RENAME COLUMN "coachId" TO "managerId";
  END IF;
END $$;

-- 6. Rename index on GeneratedOutput
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'GeneratedOutput_coachId_idx') THEN
    ALTER INDEX "GeneratedOutput_coachId_idx" RENAME TO "GeneratedOutput_managerId_idx";
  END IF;
END $$;
