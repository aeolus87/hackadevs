ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "verificationQuestions" JSONB;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "verificationStatus" TEXT;
ALTER TABLE "Submission" ADD COLUMN IF NOT EXISTS "verificationRetryCount" INTEGER NOT NULL DEFAULT 0;
