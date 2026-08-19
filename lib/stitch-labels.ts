import type { StitchType } from "@/app/generated/prisma/enums";

export const STITCH_TYPE_LABELS: Record<StitchType, string> = {
  RUNNING_STITCH: "Running Stitch",
  SATIN_STITCH: "Satin Stitch",
  TATAMI_FILL: "Tatami / Fill",
  APPLIQUE: "Appliqué",
  MANUAL_REVIEW: "Manual Review",
};
