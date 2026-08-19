import type { PixelBuffer, PaletteEntry } from "./types";
import { cloneBuffer } from "./types";
import { rgbToLab, labToRgb, rgbToHex, hexToRgb, deltaE76, type LAB } from "@/lib/color";

export interface QuantizeResult {
  buffer: PixelBuffer;
  palette: PaletteEntry[];
  /** Index into `palette` for every opaque pixel, in row-major order (-1 for transparent). */
  pixelClusters: Int16Array;
}

/**
 * Reduces an image to `k` production colors using k-means clustering in
 * CIELAB space (perceptually uniform, so clusters match how a person would
 * group colors, not raw RGB distance). Sampling keeps this interactive on
 * typical artwork sizes; the final remap pass runs over every opaque pixel.
 */
export function quantizeColors(
  buf: PixelBuffer,
  k: number,
  { alphaThreshold = 10, maxSamples = 15000, iterations = 12 }: {
    alphaThreshold?: number;
    maxSamples?: number;
    iterations?: number;
  } = {}
): QuantizeResult {
  const { data, width, height } = buf;
  const totalPixels = width * height;

  const opaqueIndices: number[] = [];
  for (let i = 0, p = 0; i < totalPixels; i++, p += 4) {
    if (data[p + 3] >= alphaThreshold) opaqueIndices.push(i);
  }

  if (opaqueIndices.length === 0 || k <= 0) {
    return { buffer: cloneBuffer(buf), palette: [], pixelClusters: new Int16Array(totalPixels).fill(-1) };
  }

  const effectiveK = Math.min(k, opaqueIndices.length);
  const sampleStep = Math.max(1, Math.floor(opaqueIndices.length / maxSamples));
  const samples: LAB[] = [];
  for (let i = 0; i < opaqueIndices.length; i += sampleStep) {
    const p = opaqueIndices[i] * 4;
    samples.push(rgbToLab({ r: data[p], g: data[p + 1], b: data[p + 2] }));
  }

  const centers = kMeansPlusPlusInit(samples, effectiveK);
  const assignments = new Int16Array(samples.length);

  for (let iter = 0; iter < iterations; iter++) {
    let changed = false;
    for (let s = 0; s < samples.length; s++) {
      let best = 0;
      let bestDist = Infinity;
      for (let c = 0; c < centers.length; c++) {
        const d = deltaE76(samples[s], centers[c]);
        if (d < bestDist) {
          bestDist = d;
          best = c;
        }
      }
      if (assignments[s] !== best) changed = true;
      assignments[s] = best;
    }

    const sums = centers.map(() => ({ l: 0, a: 0, b: 0, n: 0 }));
    for (let s = 0; s < samples.length; s++) {
      const c = sums[assignments[s]];
      c.l += samples[s].l;
      c.a += samples[s].a;
      c.b += samples[s].b;
      c.n++;
    }
    for (let c = 0; c < centers.length; c++) {
      if (sums[c].n > 0) {
        centers[c] = { l: sums[c].l / sums[c].n, a: sums[c].a / sums[c].n, b: sums[c].b / sums[c].n };
      }
    }
    if (!changed) break;
  }

  const paletteCounts = new Array(centers.length).fill(0);
  const pixelClusters = new Int16Array(totalPixels).fill(-1);

  for (const i of opaqueIndices) {
    const p = i * 4;
    const lab = rgbToLab({ r: data[p], g: data[p + 1], b: data[p + 2] });
    let best = 0;
    let bestDist = Infinity;
    for (let c = 0; c < centers.length; c++) {
      const d = deltaE76(lab, centers[c]);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    pixelClusters[i] = best;
    paletteCounts[best]++;
  }

  const outData = new Uint8ClampedArray(data);
  const paletteRgb = centers.map((c) => labToRgb(c));
  for (const i of opaqueIndices) {
    const p = i * 4;
    const cluster = pixelClusters[i];
    const rgb = paletteRgb[cluster];
    outData[p] = rgb.r;
    outData[p + 1] = rgb.g;
    outData[p + 2] = rgb.b;
  }

  const opaqueTotal = opaqueIndices.length;
  const palette: PaletteEntry[] = centers.map((_, c) => ({
    hex: rgbToHex(paletteRgb[c]),
    pixelCount: paletteCounts[c],
    coverage: opaqueTotal > 0 ? paletteCounts[c] / opaqueTotal : 0,
  }));

  return {
    buffer: { data: outData, width, height },
    palette,
    pixelClusters,
  };
}

/**
 * Assigns every opaque pixel to the nearest color in an already-chosen
 * palette (no clustering) — used after color mapping to analyze per-color
 * region geometry (bounding boxes, area) without re-deriving the palette.
 */
export function assignToPalette(
  buf: PixelBuffer,
  paletteHexes: string[],
  { alphaThreshold = 10 }: { alphaThreshold?: number } = {}
): Int16Array {
  const { data, width, height } = buf;
  const clusters = new Int16Array(width * height).fill(-1);
  const paletteLab = paletteHexes.map((hex) => rgbToLab(hexToRgb(hex)));

  for (let i = 0, p = 0; i < clusters.length; i++, p += 4) {
    if (data[p + 3] < alphaThreshold) continue;
    const lab = rgbToLab({ r: data[p], g: data[p + 1], b: data[p + 2] });
    let best = 0;
    let bestDist = Infinity;
    for (let c = 0; c < paletteLab.length; c++) {
      const d = deltaE76(lab, paletteLab[c]);
      if (d < bestDist) {
        bestDist = d;
        best = c;
      }
    }
    clusters[i] = best;
  }

  return clusters;
}

function kMeansPlusPlusInit(samples: LAB[], k: number): LAB[] {
  const centers: LAB[] = [];
  centers.push(samples[Math.floor(Math.random() * samples.length)]);

  while (centers.length < k) {
    const distances = samples.map((s) => {
      let min = Infinity;
      for (const c of centers) {
        const d = deltaE76(s, c);
        if (d < min) min = d;
      }
      return min * min;
    });
    const total = distances.reduce((a, b) => a + b, 0);
    if (total === 0) {
      centers.push(samples[Math.floor(Math.random() * samples.length)]);
      continue;
    }
    let target = Math.random() * total;
    let chosen = samples[samples.length - 1];
    for (let i = 0; i < samples.length; i++) {
      target -= distances[i];
      if (target <= 0) {
        chosen = samples[i];
        break;
      }
    }
    centers.push(chosen);
  }

  return centers;
}
