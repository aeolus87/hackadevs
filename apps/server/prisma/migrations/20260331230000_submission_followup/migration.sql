ALTER TYPE "SubmissionStatus" ADD VALUE 'AWAITING_FOLLOWUP';

ALTER TABLE "Submission" ADD COLUMN "followUpQuestions" JSONB,
ADD COLUMN "followUpAnswers" JSONB;
