import type { JobStatus } from "@/app/generated/prisma/enums";

/** Client-facing simplification of the 11-stage internal JobStatus pipeline
 * — the production floor's granularity (color review vs. production prep,
 * etc.) isn't meaningful to a client checking on an order. */
export const PORTAL_STAGES = [
  "Order Received",
  "Preparing Artwork",
  "Digitizing",
  "Test Sew",
  "In Production",
  "Complete",
] as const;

export type PortalStage = (typeof PORTAL_STAGES)[number];

const STAGE_BY_STATUS: Record<JobStatus, PortalStage> = {
  ARTWORK_RECEIVED: "Order Received",
  ARTWORK_PROCESSING: "Preparing Artwork",
  COLOR_REVIEW: "Preparing Artwork",
  PRODUCTION_PREP: "Preparing Artwork",
  READY_FOR_INSTITCH: "Digitizing",
  DIGITIZED: "Digitizing",
  TEST_SEW: "Test Sew",
  APPROVED: "In Production",
  PRODUCTION: "In Production",
  COMPLETE: "Complete",
  ARCHIVED: "Complete",
};

export function portalStageFor(status: JobStatus): { stage: PortalStage; stepIndex: number } {
  const stage = STAGE_BY_STATUS[status];
  return { stage, stepIndex: PORTAL_STAGES.indexOf(stage) };
}
