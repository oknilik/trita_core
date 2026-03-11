-- CoachApplication: stores coach tier applications from /become-coach page
-- status: PENDING | APPROVED | REJECTED
-- userProfileId nullable: applicant may or may not have a Trita account

CREATE TABLE "CoachApplication" (
  "id"              TEXT      NOT NULL PRIMARY KEY,
  "email"           TEXT      NOT NULL,
  "name"            TEXT      NOT NULL,
  "background"      TEXT      NOT NULL,
  "motivation"      TEXT      NOT NULL,
  "specializations" TEXT,
  "status"          TEXT      NOT NULL DEFAULT 'PENDING',
  "reviewNote"      TEXT,
  "createdAt"       TIMESTAMP NOT NULL DEFAULT NOW(),
  "reviewedAt"      TIMESTAMP,
  "userProfileId"   TEXT,
  FOREIGN KEY ("userProfileId") REFERENCES "UserProfile"("id") ON DELETE SET NULL
);

CREATE INDEX "CoachApplication_email_idx"  ON "CoachApplication"("email");
CREATE INDEX "CoachApplication_status_idx" ON "CoachApplication"("status");
