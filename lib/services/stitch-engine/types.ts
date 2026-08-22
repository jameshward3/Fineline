/**
 * Boundary for the embroidery stitch-generation engine. STITCH OS derives
 * real stitch files directly from a design's VectorObjects — each object's
 * assigned StitchType (running stitch, satin, tatami fill) drives an
 * automatic stitch-fill pass, sequenced and color-change-separated in
 * sewing order, encoded as a machine-readable file.
 *
 * Only DST (Tajima) is implemented today — the format with the widest
 * machine/software support. PES/EXP/JEF/XXX are placeholders on the type;
 * `generate()` throws for them rather than fabricating output for a format
 * that isn't actually implemented.
 *
 * This is a first-generation automatic digitizer intended for simple,
 * clean artwork — it is not a substitute for expert hand-digitizing of
 * complex or detail-dense designs. VectorObjects still flagged
 * MANUAL_REVIEW block generation rather than being silently skipped.
 */

export type StitchFileFormat = "DST" | "PES" | "EXP" | "JEF" | "XXX";

export interface StitchGenerationInput {
  designVersionId: string;
  format: StitchFileFormat;
  /** Machine/hoop constraints the engine should respect. */
  hoopWidthMm: number;
  hoopHeightMm: number;
}

export interface StitchGenerationResult {
  format: StitchFileFormat;
  fileBuffer: Buffer;
  stitchCount: number;
  colorChangeCount: number;
  estimatedRuntimeSeconds: number;
  /** Non-fatal issues worth a human's attention before production (oversized for the assumed hoop, unmapped thread colors, etc). */
  warnings: string[];
}

export interface StitchEngineService {
  generate(input: StitchGenerationInput): Promise<StitchGenerationResult>;
}
