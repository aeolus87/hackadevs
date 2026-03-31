ALTER TABLE "Challenge" ADD COLUMN "votingSettled" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
ALTER TABLE "User" ADD COLUMN "githubId" TEXT;
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");

ALTER TABLE "User" ALTER COLUMN "selfDeclaredLevel" SET DEFAULT 'JUNIOR';

ALTER TABLE "CompanyPortal" ALTER COLUMN "linkedinUrl" DROP NOT NULL;
ALTER TABLE "CompanyPortal" ADD COLUMN "portalSecret" TEXT;
UPDATE "CompanyPortal" SET "portalSecret" = md5(random()::text || "id") WHERE "portalSecret" IS NULL;
ALTER TABLE "CompanyPortal" ALTER COLUMN "portalSecret" SET NOT NULL;
CREATE UNIQUE INDEX "CompanyPortal_portalSecret_key" ON "CompanyPortal"("portalSecret");
