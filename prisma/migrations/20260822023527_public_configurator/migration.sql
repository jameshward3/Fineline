-- CreateEnum
CREATE TYPE "ConfiguratorSubmissionStatus" AS ENUM ('SUBMITTED', 'REVIEWED', 'QUOTED', 'CONVERTED', 'CANCELLED');

-- CreateTable
CREATE TABLE "ConfiguratorSubmission" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "opportunityId" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'fineligne.co/configure',
    "status" "ConfiguratorSubmissionStatus" NOT NULL DEFAULT 'SUBMITTED',
    "projectType" TEXT NOT NULL,
    "configuration" JSONB NOT NULL,
    "pricing" JSONB NOT NULL,
    "artwork" JSONB NOT NULL,
    "customerMessage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfiguratorSubmission_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguratorSubmission_opportunityId_key" ON "ConfiguratorSubmission"("opportunityId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguratorSubmission_jobId_key" ON "ConfiguratorSubmission"("jobId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguratorSubmission_idempotencyKey_key" ON "ConfiguratorSubmission"("idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguratorSubmission_designId_key" ON "ConfiguratorSubmission"("designId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfiguratorSubmission_designVersionId_key" ON "ConfiguratorSubmission"("designVersionId");

-- CreateIndex
CREATE INDEX "ConfiguratorSubmission_organizationId_createdAt_idx" ON "ConfiguratorSubmission"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "ConfiguratorSubmission_clientId_createdAt_idx" ON "ConfiguratorSubmission"("clientId", "createdAt");

-- AddForeignKey
ALTER TABLE "ConfiguratorSubmission" ADD CONSTRAINT "ConfiguratorSubmission_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguratorSubmission" ADD CONSTRAINT "ConfiguratorSubmission_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguratorSubmission" ADD CONSTRAINT "ConfiguratorSubmission_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguratorSubmission" ADD CONSTRAINT "ConfiguratorSubmission_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguratorSubmission" ADD CONSTRAINT "ConfiguratorSubmission_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ConfiguratorSubmission" ADD CONSTRAINT "ConfiguratorSubmission_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;
