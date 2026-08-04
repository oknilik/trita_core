-- Eletciklus-emailek leiratkozas (D1 follow-up: reflexios email lab).
ALTER TABLE "UserProfile" ADD COLUMN "lifecycleEmailsOptOut" BOOLEAN NOT NULL DEFAULT false;
