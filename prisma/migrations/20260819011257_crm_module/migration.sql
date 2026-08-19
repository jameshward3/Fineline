-- CreateEnum
CREATE TYPE "AccountType" AS ENUM ('SCHOOL_EDUCATION', 'CORPORATE', 'HOSPITALITY', 'LUXURY_RESIDENTIAL', 'INTERIOR_DESIGNER', 'EVENT_WEDDING', 'RETAIL_BRAND', 'CLUB_MEMBERSHIP', 'NONPROFIT', 'INDIVIDUAL', 'FAMILY_HOUSEHOLD');

-- CreateEnum
CREATE TYPE "ContactRole" AS ENUM ('PRIMARY', 'PURCHASING', 'ACCOUNTS_PAYABLE', 'CREATIVE_BRAND', 'EXECUTIVE_SPONSOR', 'DEPARTMENT_HEAD', 'OTHER');

-- CreateEnum
CREATE TYPE "ProgramStatus" AS ENUM ('PLANNING', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "OpportunityStage" AS ENUM ('INQUIRY', 'CONSULTATION', 'SAMPLING', 'QUOTE', 'APPROVAL', 'PROGRAM_ESTABLISHED', 'ORDER');

-- CreateEnum
CREATE TYPE "SampleStatus" AS ENUM ('REQUESTED', 'DELIVERED', 'APPROVED', 'REJECTED');

-- AlterEnum
ALTER TYPE "NoteEntityType" ADD VALUE 'CLIENT';

-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "accountType" "AccountType" NOT NULL DEFAULT 'INDIVIDUAL',
ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "leadSource" TEXT,
ADD COLUMN     "referralSource" TEXT,
ADD COLUMN     "relationshipOwnerId" TEXT;

-- AlterTable
ALTER TABLE "Job" ADD COLUMN     "estimatedValue" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "ContactRole" NOT NULL DEFAULT 'OTHER',
    "title" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "department" TEXT,
    "preferredContactMethod" TEXT,
    "preferredContactTime" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Program" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "status" "ProgramStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Program_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramProduct" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT,
    "designId" TEXT,
    "setupId" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProgramProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgramThreadColor" (
    "id" TEXT NOT NULL,
    "programId" TEXT NOT NULL,
    "threadColorId" TEXT NOT NULL,
    "roleLabel" TEXT,

    CONSTRAINT "ProgramThreadColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Opportunity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "programId" TEXT,
    "name" TEXT NOT NULL,
    "potentialValue" DOUBLE PRECISION,
    "stage" "OpportunityStage" NOT NULL DEFAULT 'INQUIRY',
    "nextAction" TEXT,
    "nextActionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sample" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "programId" TEXT,
    "name" TEXT NOT NULL,
    "status" "SampleStatus" NOT NULL DEFAULT 'REQUESTED',
    "notes" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "approvedAt" TIMESTAMP(3),

    CONSTRAINT "Sample_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MonogramProfile" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "personName" TEXT NOT NULL,
    "monogramText" TEXT NOT NULL,
    "style" TEXT,
    "arrangement" TEXT,
    "threadColorId" TEXT,
    "preferredSizeInches" DOUBLE PRECISION,
    "savedApplications" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MonogramProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProgramThreadColor_programId_threadColorId_key" ON "ProgramThreadColor"("programId", "threadColorId");

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_relationshipOwnerId_fkey" FOREIGN KEY ("relationshipOwnerId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Program" ADD CONSTRAINT "Program_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramProduct" ADD CONSTRAINT "ProgramProduct_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramProduct" ADD CONSTRAINT "ProgramProduct_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramProduct" ADD CONSTRAINT "ProgramProduct_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "EmbroideryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramProduct" ADD CONSTRAINT "ProgramProduct_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramProduct" ADD CONSTRAINT "ProgramProduct_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "ProductionSetup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramThreadColor" ADD CONSTRAINT "ProgramThreadColor_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgramThreadColor" ADD CONSTRAINT "ProgramThreadColor_threadColorId_fkey" FOREIGN KEY ("threadColorId") REFERENCES "ThreadColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sample" ADD CONSTRAINT "Sample_programId_fkey" FOREIGN KEY ("programId") REFERENCES "Program"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonogramProfile" ADD CONSTRAINT "MonogramProfile_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MonogramProfile" ADD CONSTRAINT "MonogramProfile_threadColorId_fkey" FOREIGN KEY ("threadColorId") REFERENCES "ThreadColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
