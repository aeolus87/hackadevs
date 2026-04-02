ALTER TABLE "CompanyPortal" ADD COLUMN "rejectedAt" TIMESTAMP(3);

ALTER TABLE "User" ADD COLUMN "streakAtRiskEmailSentAt" TIMESTAMP(3);
