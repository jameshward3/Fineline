import ImageTracer from "imagetracerjs";
import type { PixelBuffer, PaletteEntry } from "@/lib/services/image-processing/types";
import { hexToRgb } from "@/lib/color";
import type { VectorLayer, VectorizationService } from "./types";

const TRACE_OPTIONS = {
  ltres: 1,
  qtres: 1,
  pathomit: 2,
  rightangleenhance: true,
  colorquantcycles: 1,
  roundcoords: 2,
  scale: 1,
};

/**
 * Traces an already color-quantized raster buffer into per-color SVG path
 * data. The buffer's palette (from our own LAB k-means quantizer) is passed
 * to imagetracer as a *fixed* palette with a single quantization cycle, so
 * it performs pure nearest-color assignment against colors we already
 * chose — it never re-derives its own palette or drifts from the thread
 * mapping the user reviewed.
 */
export class ImagetracerVectorizationService implements VectorizationService {
  trace(buffer: PixelBuffer, palette: PaletteEntry[]): VectorLayer[] {
    if (palette.length === 0) return [];

    const fixedPalette = [
      { r: 255, g: 255, b: 255, a: 0 }, // index 0: transparent background, skipped below
      ...palette.map((p) => {
        const rgb = hexToRgb(p.hex);
        return { r: Math.round(rgb.r), g: Math.round(rgb.g), b: Math.round(rgb.b), a: 255 };
      }),
    ];

    const tracedata = ImageTracer.imagedataToTracedata(
      { width: buffer.width, height: buffer.height, data: buffer.data },
      { ...TRACE_OPTIONS, pal: fixedPalette }
    );

    const layers: VectorLayer[] = [];
    for (let layerIndex = 1; layerIndex < tracedata.layers.length; layerIndex++) {
      const layer = tracedata.layers[layerIndex];
      if (!layer || layer.length === 0) continue;

      const pathStrings: string[] = [];
      let pixelCount = 0;
      for (let pathIndex = 0; pathIndex < layer.length; pathIndex++) {
        const d = ImageTracer.svgpathstring(tracedata, layerIndex, pathIndex, TRACE_OPTIONS);
        const dOnly = /\sd="([^"]*)"/.exec(d)?.[1];
        if (dOnly) pathStrings.push(dOnly);

        const [minX, minY, maxX, maxY] = layer[pathIndex].boundingbox;
        pixelCount += Math.max(0, maxX - minX) * Math.max(0, maxY - minY);
      }
      if (pathStrings.length === 0) continue;

      layers.push({
        paletteIndex: layerIndex - 1,
        hex: palette[layerIndex - 1].hex,
        pathData: pathStrings.join(" "),
        pixelCount,
      });
    }

    return layers;
  }
}
