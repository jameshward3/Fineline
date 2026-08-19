-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'DESIGNER', 'OPERATOR', 'VIEWER');

-- CreateEnum
CREATE TYPE "DesignVersionStatus" AS ENUM ('DRAFT', 'COLOR_REVIEW', 'PRODUCTION_PREP', 'READY_FOR_INSTITCH', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ArtworkStage" AS ENUM ('SOURCE', 'WORKING', 'PRODUCTION', 'EXPORT', 'FINAL_DIGITIZED');

-- CreateEnum
CREATE TYPE "StitchType" AS ENUM ('RUNNING_STITCH', 'SATIN_STITCH', 'TATAMI_FILL', 'APPLIQUE', 'MANUAL_REVIEW');

-- CreateEnum
CREATE TYPE "ThreadWeight" AS ENUM ('W12', 'W30', 'W40', 'W60', 'OTHER');

-- CreateEnum
CREATE TYPE "JobStatus" AS ENUM ('ARTWORK_RECEIVED', 'ARTWORK_PROCESSING', 'COLOR_REVIEW', 'PRODUCTION_PREP', 'READY_FOR_INSTITCH', 'DIGITIZED', 'TEST_SEW', 'APPROVED', 'PRODUCTION', 'COMPLETE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "ExportType" AS ENUM ('SVG', 'PNG', 'JPEG', 'PDF_PRODUCTION_SHEET', 'JSON', 'MASTER_PACKAGE_ZIP');

-- CreateEnum
CREATE TYPE "ProductionRunResult" AS ENUM ('EXCELLENT', 'ACCEPTABLE', 'NEEDS_REVISION', 'FAILED');

-- CreateEnum
CREATE TYPE "NoteEntityType" AS ENUM ('DESIGN', 'JOB', 'PRODUCT', 'PRODUCTION_RUN');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('PENDING', 'APPROVED', 'CHANGES_REQUESTED');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'DESIGNER',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "avatarUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6B7280',

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TagsOnDesigns" (
    "designId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagsOnDesigns_pkey" PRIMARY KEY ("designId","tagId")
);

-- CreateTable
CREATE TABLE "TagsOnJobs" (
    "jobId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,

    CONSTRAINT "TagsOnJobs_pkey" PRIMARY KEY ("jobId","tagId")
);

-- CreateTable
CREATE TABLE "Design" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "collection" TEXT,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Design_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignVersion" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "versionNumber" INTEGER NOT NULL,
    "status" "DesignVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "changeNotes" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "widthInches" DOUBLE PRECISION,
    "heightInches" DOUBLE PRECISION,
    "displayUnit" TEXT NOT NULL DEFAULT 'in',
    "aspectLocked" BOOLEAN NOT NULL DEFAULT true,
    "detectedColorCount" INTEGER,
    "targetColorCount" INTEGER,
    "readinessScore" INTEGER,
    "readinessBreakdown" JSONB,
    "readinessClassification" TEXT,
    "sourceAssetId" TEXT,

    CONSTRAINT "DesignVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArtworkAsset" (
    "id" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "stage" "ArtworkStage" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileFormat" TEXT NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "widthPx" INTEGER,
    "heightPx" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArtworkAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignColorMapping" (
    "id" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "sequence" INTEGER NOT NULL,
    "artworkColorHex" TEXT NOT NULL,
    "mergedColorHexes" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "threadColorId" TEXT,
    "needleNumber" INTEGER,
    "colorDeltaE" DOUBLE PRECISION,

    CONSTRAINT "DesignColorMapping_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VectorObject" (
    "id" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "svgPath" TEXT NOT NULL,
    "threadColorId" TEXT,
    "stitchType" "StitchType" NOT NULL DEFAULT 'MANUAL_REVIEW',
    "stitchTypeAuto" "StitchType",
    "stitchDirectionDegrees" DOUBLE PRECISION,
    "sequenceOrder" INTEGER NOT NULL,
    "areaSqMm" DOUBLE PRECISION,
    "minDetailMm" DOUBLE PRECISION,
    "visible" BOOLEAN NOT NULL DEFAULT true,
    "locked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VectorObject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadManufacturer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "ThreadManufacturer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ThreadColor" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "manufacturerId" TEXT NOT NULL,
    "manufacturerCode" TEXT NOT NULL,
    "manufacturerName" TEXT NOT NULL,
    "companyName" TEXT NOT NULL,
    "rgb" TEXT NOT NULL,
    "hex" TEXT NOT NULL,
    "lab" JSONB,
    "threadType" TEXT NOT NULL DEFAULT 'Polyester',
    "threadWeight" "ThreadWeight" NOT NULL DEFAULT 'W40',
    "material" TEXT,
    "finish" TEXT,
    "notes" TEXT,
    "inventoryQuantity" INTEGER NOT NULL DEFAULT 0,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "favorite" BOOLEAN NOT NULL DEFAULT false,
    "spoolPhotoUrl" TEXT,
    "dateAdded" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ThreadColor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyPalette" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL DEFAULT 'Standard Company Palette',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyPalette_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyPaletteSlot" (
    "id" TEXT NOT NULL,
    "companyPaletteId" TEXT NOT NULL,
    "slotNumber" INTEGER NOT NULL,
    "threadColorId" TEXT NOT NULL,

    CONSTRAINT "CompanyPaletteSlot_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Machine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "needleCount" INTEGER NOT NULL DEFAULT 15,
    "location" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Machine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MachineNeedle" (
    "id" TEXT NOT NULL,
    "machineId" TEXT NOT NULL,
    "needleNumber" INTEGER NOT NULL,
    "threadColorId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MachineNeedle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "brand" TEXT,
    "manufacturer" TEXT,
    "sku" TEXT,
    "category" TEXT NOT NULL,
    "material" TEXT,
    "fabricWeight" TEXT,
    "stretch" TEXT,
    "availableColors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "supplier" TEXT,
    "supplierUrl" TEXT,
    "cost" DOUBLE PRECISION,
    "notes" TEXT,
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductVariant" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "colorName" TEXT NOT NULL,
    "colorHex" TEXT,
    "sku" TEXT,

    CONSTRAINT "ProductVariant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmbroideryLocation" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "maxWidthInches" DOUBLE PRECISION NOT NULL,
    "maxHeightInches" DOUBLE PRECISION NOT NULL,
    "standardWidthMinInches" DOUBLE PRECISION,
    "standardWidthMaxInches" DOUBLE PRECISION,
    "recommendedHoop" TEXT,
    "recommendedStabilizer" TEXT,
    "orientation" TEXT,
    "placementNotes" TEXT,

    CONSTRAINT "EmbroideryLocation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionSetup" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "productId" TEXT,
    "locationId" TEXT,
    "hoop" TEXT,
    "stabilizer" TEXT,
    "topping" TEXT,
    "needleSize" TEXT,
    "threadWeight" TEXT,
    "bobbin" TEXT,
    "speedSpm" INTEGER,
    "densityNotes" TEXT,
    "notes" TEXT,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductionSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignProductSetup" (
    "id" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "locationId" TEXT,
    "setupId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignProductSetup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Job" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "jobNumber" TEXT NOT NULL,
    "clientId" TEXT,
    "status" "JobStatus" NOT NULL DEFAULT 'ARTWORK_RECEIVED',
    "machineId" TEXT,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JobItem" (
    "id" TEXT NOT NULL,
    "jobId" TEXT NOT NULL,
    "designId" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "productVariantId" TEXT,
    "locationId" TEXT,
    "setupId" TEXT,
    "garmentColor" TEXT,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "JobItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Export" (
    "id" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "jobId" TEXT,
    "type" "ExportType" NOT NULL,
    "storageKey" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Export_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductionRun" (
    "id" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "jobId" TEXT,
    "setupId" TEXT,
    "result" "ProductionRunResult" NOT NULL,
    "issues" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "photoUrls" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "notes" TEXT,
    "stitchCountEstimate" INTEGER,
    "recordedById" TEXT NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "entityType" "NoteEntityType" NOT NULL,
    "entityId" TEXT NOT NULL,
    "authorId" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ApprovalRequest" (
    "id" TEXT NOT NULL,
    "designVersionId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "ApprovalStatus" NOT NULL DEFAULT 'PENDING',
    "lockedRevision" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),

    CONSTRAINT "ApprovalRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_organizationId_label_key" ON "Tag"("organizationId", "label");

-- CreateIndex
CREATE INDEX "Design_organizationId_name_idx" ON "Design"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "DesignVersion_designId_versionNumber_key" ON "DesignVersion"("designId", "versionNumber");

-- CreateIndex
CREATE INDEX "ArtworkAsset_designVersionId_stage_idx" ON "ArtworkAsset"("designVersionId", "stage");

-- CreateIndex
CREATE UNIQUE INDEX "DesignColorMapping_designVersionId_sequence_key" ON "DesignColorMapping"("designVersionId", "sequence");

-- CreateIndex
CREATE INDEX "VectorObject_designVersionId_sequenceOrder_idx" ON "VectorObject"("designVersionId", "sequenceOrder");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadManufacturer_organizationId_name_key" ON "ThreadManufacturer"("organizationId", "name");

-- CreateIndex
CREATE INDEX "ThreadColor_organizationId_active_idx" ON "ThreadColor"("organizationId", "active");

-- CreateIndex
CREATE UNIQUE INDEX "ThreadColor_organizationId_manufacturerId_manufacturerCode_key" ON "ThreadColor"("organizationId", "manufacturerId", "manufacturerCode");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPalette_organizationId_key" ON "CompanyPalette"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyPaletteSlot_companyPaletteId_slotNumber_key" ON "CompanyPaletteSlot"("companyPaletteId", "slotNumber");

-- CreateIndex
CREATE UNIQUE INDEX "MachineNeedle_machineId_needleNumber_key" ON "MachineNeedle"("machineId", "needleNumber");

-- CreateIndex
CREATE INDEX "Product_organizationId_category_idx" ON "Product"("organizationId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "DesignProductSetup_designId_productId_locationId_key" ON "DesignProductSetup"("designId", "productId", "locationId");

-- CreateIndex
CREATE UNIQUE INDEX "Job_jobNumber_key" ON "Job"("jobNumber");

-- CreateIndex
CREATE INDEX "Note_entityType_entityId_idx" ON "Note"("entityType", "entityId");

-- CreateIndex
CREATE UNIQUE INDEX "ApprovalRequest_token_key" ON "ApprovalRequest"("token");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnDesigns" ADD CONSTRAINT "TagsOnDesigns_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnDesigns" ADD CONSTRAINT "TagsOnDesigns_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnJobs" ADD CONSTRAINT "TagsOnJobs_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TagsOnJobs" ADD CONSTRAINT "TagsOnJobs_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Design" ADD CONSTRAINT "Design_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignVersion" ADD CONSTRAINT "DesignVersion_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignVersion" ADD CONSTRAINT "DesignVersion_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignVersion" ADD CONSTRAINT "DesignVersion_sourceAssetId_fkey" FOREIGN KEY ("sourceAssetId") REFERENCES "ArtworkAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArtworkAsset" ADD CONSTRAINT "ArtworkAsset_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignColorMapping" ADD CONSTRAINT "DesignColorMapping_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignColorMapping" ADD CONSTRAINT "DesignColorMapping_threadColorId_fkey" FOREIGN KEY ("threadColorId") REFERENCES "ThreadColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VectorObject" ADD CONSTRAINT "VectorObject_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VectorObject" ADD CONSTRAINT "VectorObject_threadColorId_fkey" FOREIGN KEY ("threadColorId") REFERENCES "ThreadColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadManufacturer" ADD CONSTRAINT "ThreadManufacturer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadColor" ADD CONSTRAINT "ThreadColor_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ThreadColor" ADD CONSTRAINT "ThreadColor_manufacturerId_fkey" FOREIGN KEY ("manufacturerId") REFERENCES "ThreadManufacturer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPalette" ADD CONSTRAINT "CompanyPalette_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPaletteSlot" ADD CONSTRAINT "CompanyPaletteSlot_companyPaletteId_fkey" FOREIGN KEY ("companyPaletteId") REFERENCES "CompanyPalette"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyPaletteSlot" ADD CONSTRAINT "CompanyPaletteSlot_threadColorId_fkey" FOREIGN KEY ("threadColorId") REFERENCES "ThreadColor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Machine" ADD CONSTRAINT "Machine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineNeedle" ADD CONSTRAINT "MachineNeedle_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MachineNeedle" ADD CONSTRAINT "MachineNeedle_threadColorId_fkey" FOREIGN KEY ("threadColorId") REFERENCES "ThreadColor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductVariant" ADD CONSTRAINT "ProductVariant_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmbroideryLocation" ADD CONSTRAINT "EmbroideryLocation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionSetup" ADD CONSTRAINT "ProductionSetup_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionSetup" ADD CONSTRAINT "ProductionSetup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionSetup" ADD CONSTRAINT "ProductionSetup_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "EmbroideryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProductSetup" ADD CONSTRAINT "DesignProductSetup_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProductSetup" ADD CONSTRAINT "DesignProductSetup_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProductSetup" ADD CONSTRAINT "DesignProductSetup_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProductSetup" ADD CONSTRAINT "DesignProductSetup_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "EmbroideryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignProductSetup" ADD CONSTRAINT "DesignProductSetup_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "ProductionSetup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_machineId_fkey" FOREIGN KEY ("machineId") REFERENCES "Machine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Job" ADD CONSTRAINT "Job_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_designId_fkey" FOREIGN KEY ("designId") REFERENCES "Design"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_productVariantId_fkey" FOREIGN KEY ("productVariantId") REFERENCES "ProductVariant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "EmbroideryLocation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JobItem" ADD CONSTRAINT "JobItem_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "ProductionSetup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Export" ADD CONSTRAINT "Export_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRun" ADD CONSTRAINT "ProductionRun_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRun" ADD CONSTRAINT "ProductionRun_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "Job"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRun" ADD CONSTRAINT "ProductionRun_setupId_fkey" FOREIGN KEY ("setupId") REFERENCES "ProductionSetup"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductionRun" ADD CONSTRAINT "ProductionRun_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
