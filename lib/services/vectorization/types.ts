import type { PixelBuffer, PaletteEntry } from "@/lib/services/image-processing/types";

export interface VectorLayer {
  paletteIndex: number;
  hex: string;
  pathData: string;
  pixelCount: number;
}

/**
 * Boundary for raster -> color-separated SVG geometry. The current
 * implementation wraps imagetracerjs; a future, more sophisticated tracer
 * (or a server-side engine) can replace it without touching callers —
 * everything downstream only depends on this interface.
 */
export interface VectorizationService {
  trace(buffer: PixelBuffer, palette: PaletteEntry[]): VectorLayer[];
}
