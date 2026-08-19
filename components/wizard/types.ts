import type { PixelBuffer, PaletteEntry } from "@/lib/services/image-processing/types";
import type { DetailWarning } from "@/lib/services/image-processing/size";
import type { VectorLayer } from "@/lib/services/vectorization/types";
import type { ReadinessResult } from "@/lib/services/scoring";

export interface ColorMappingRow {
  sequence: number;
  artworkColorHex: string;
  threadColorId: string | null;
  threadLabel: string | null;
  needleNumber: number | null;
  colorDeltaE: number | null;
  mergedInto: number | null; // sequence of the row this was merged into, if any
}

export type WizardStitchType = "RUNNING_STITCH" | "SATIN_STITCH" | "TATAMI_FILL" | "APPLIQUE" | "MANUAL_REVIEW";

export interface WizardVectorObject {
  key: string;
  name: string;
  svgPath: string;
  threadColorId: string | null;
  hex: string;
  stitchType: WizardStitchType;
  stitchTypeAuto: WizardStitchType;
  stitchDirectionDegrees: number;
  sequenceOrder: number;
  areaSqMm: number | null;
  minDetailMm: number | null;
  visible: boolean;
}

export interface WizardState {
  step: number;
  designName: string;
  clientId: string | null;

  fileName: string | null;
  fileSizeBytes: number | null;
  naturalWidth: number | null;
  naturalHeight: number | null;
  originalFile: File | null;
  originalBuffer: PixelBuffer | null;

  workingBuffer: PixelBuffer | null;
  showOriginalPreview: boolean;

  widthInches: number;
  heightInches: number;
  displayUnit: "in" | "mm";
  aspectLocked: boolean;

  targetColorCount: number;
  detectedColorCount: number;
  palette: PaletteEntry[];

  colorMappings: ColorMappingRow[];

  cleanedBuffer: PixelBuffer | null;
  detailWarnings: DetailWarning[];
  componentCount: number;

  vectorLayers: VectorLayer[] | null;
  vectorObjects: WizardVectorObject[];

  productId: string | null;
  locationId: string | null;
  setupId: string | null;
  machineId: string | null;

  readiness: ReadinessResult | null;

  saving: boolean;
  error: string | null;
}

export const STEP_LABELS = [
  "Import",
  "Background",
  "Size",
  "Colors",
  "Thread Mapping",
  "Cleanup",
  "Vectorize",
  "Production",
  "Review & Save",
] as const;

export function initialWizardState(): WizardState {
  return {
    step: 0,
    designName: "",
    clientId: null,
    fileName: null,
    fileSizeBytes: null,
    naturalWidth: null,
    naturalHeight: null,
    originalFile: null,
    originalBuffer: null,
    workingBuffer: null,
    showOriginalPreview: false,
    widthInches: 3.5,
    heightInches: 3.5,
    displayUnit: "in",
    aspectLocked: true,
    targetColorCount: 8,
    detectedColorCount: 0,
    palette: [],
    colorMappings: [],
    cleanedBuffer: null,
    detailWarnings: [],
    componentCount: 0,
    vectorLayers: null,
    vectorObjects: [],
    productId: null,
    locationId: null,
    setupId: null,
    machineId: null,
    readiness: null,
    saving: false,
    error: null,
  };
}
