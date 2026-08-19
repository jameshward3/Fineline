/**
 * Boundary for a future embroidery stitch-generation engine. STITCH OS
 * currently prepares clean, color-separated, production-annotated artwork
 * for a human digitizer working in InStitch — it does not generate actual
 * stitch files. This interface exists so that capability can be added
 * later (in-house or via a third-party engine) without redesigning the
 * artwork-preparation pipeline or the export system that calls it.
 *
 * Do not implement against this interface until a real stitch-generation
 * engine is integrated — a stub that fabricates DST/PES/EXP/JEF output
 * would be actively misleading to a production floor.
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
}

export interface StitchEngineService {
  generate(input: StitchGenerationInput): Promise<StitchGenerationResult>;
}
