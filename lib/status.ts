import type { JobStatus, DesignVersionStatus, ProductionRunResult } from "@/app/generated/prisma/enums";

type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

export const JOB_STATUS_META: Record<JobStatus, { label: string; tone: Tone }> = {
  ARTWORK_RECEIVED: { label: "Artwork Received", tone: "neutral" },
  ARTWORK_PROCESSING: { label: "Artwork Processing", tone: "info" },
  COLOR_REVIEW: { label: "Color Review", tone: "info" },
  PRODUCTION_PREP: { label: "Production Prep", tone: "warning" },
  READY_FOR_INSTITCH: { label: "Ready for InStitch", tone: "accent" },
  DIGITIZED: { label: "Digitized", tone: "accent" },
  TEST_SEW: { label: "Test Sew", tone: "warning" },
  APPROVED: { label: "Approved", tone: "success" },
  PRODUCTION: { label: "Production", tone: "success" },
  COMPLETE: { label: "Complete", tone: "success" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export const JOB_STATUS_ORDER: JobStatus[] = [
  "ARTWORK_RECEIVED",
  "ARTWORK_PROCESSING",
  "COLOR_REVIEW",
  "PRODUCTION_PREP",
  "READY_FOR_INSTITCH",
  "DIGITIZED",
  "TEST_SEW",
  "APPROVED",
  "PRODUCTION",
  "COMPLETE",
  "ARCHIVED",
];

export const DESIGN_VERSION_STATUS_META: Record<DesignVersionStatus, { label: string; tone: Tone }> = {
  DRAFT: { label: "Draft", tone: "neutral" },
  COLOR_REVIEW: { label: "Color Review", tone: "info" },
  PRODUCTION_PREP: { label: "Production Prep", tone: "warning" },
  READY_FOR_INSTITCH: { label: "Ready for InStitch", tone: "accent" },
  ARCHIVED: { label: "Archived", tone: "neutral" },
};

export const PRODUCTION_RESULT_META: Record<ProductionRunResult, { label: string; tone: Tone }> = {
  EXCELLENT: { label: "Excellent", tone: "success" },
  ACCEPTABLE: { label: "Acceptable", tone: "info" },
  NEEDS_REVISION: { label: "Needs Revision", tone: "warning" },
  FAILED: { label: "Failed", tone: "danger" },
};
