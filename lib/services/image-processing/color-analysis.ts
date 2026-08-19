import type { PixelBuffer, PaletteEntry } from "./types";
import { rgbToHex } from "@/lib/color";

/**
 * Buckets pixels into perceptually-similar groups (channels rounded to the
 * nearest step) rather than counting exact RGB values. Raw AI-generated
 * artwork routinely contains thousands of near-duplicate colors from
 * anti-aliasing and JPEG noise — an exact-value count would be meaningless.
 */
export function analyzeColors(
  buf: PixelBuffer,
  { step = 12, alphaThreshold = 10 }: { step?: number; alphaThreshold?: number } = {}
): { detectedColorCount: number; palette: PaletteEntry[]; opaquePixelCount: number } {
  const buckets = new Map<number, { r: number; g: number; b: number; count: number }>();
  let opaquePixelCount = 0;

  const { data } = buf;
  for (let p = 0; p < data.length; p += 4) {
    const a = data[p + 3];
    if (a < alphaThreshold) continue;
    opaquePixelCount++;

    const r = data[p], g = data[p + 1], b = data[p + 2];
    const key =
      (Math.round(r / step) << 16) | (Math.round(g / step) << 8) | Math.round(b / step);

    const bucket = buckets.get(key);
    if (bucket) {
      bucket.r += r;
      bucket.g += g;
      bucket.b += b;
      bucket.count++;
    } else {
      buckets.set(key, { r, g, b, count: 1 });
    }
  }

  const palette: PaletteEntry[] = Array.from(buckets.values())
    .map((b) => ({
      hex: rgbToHex({ r: b.r / b.count, g: b.g / b.count, b: b.b / b.count }),
      pixelCount: b.count,
      coverage: opaquePixelCount > 0 ? b.count / opaquePixelCount : 0,
    }))
    .sort((a, b) => b.pixelCount - a.pixelCount);

  return { detectedColorCount: palette.length, palette, opaquePixelCount };
}
