import type { PixelBuffer } from "./types";
import { cloneBuffer } from "./types";
import { alphaMask, labelComponents } from "./connected-components";

/** Removes connected alpha regions smaller than `minAreaPx` — stray specks and
 * fragments AI artwork often leaves behind that cannot be digitized cleanly. */
export function removeSmallIslands(buf: PixelBuffer, minAreaPx: number): { buffer: PixelBuffer; removedCount: number } {
  const mask = alphaMask(buf);
  const { labels, components } = labelComponents(mask, buf.width, buf.height);
  const out = cloneBuffer(buf);
  let removedCount = 0;

  const tooSmall = new Set(components.filter((c) => c.pixelCount < minAreaPx).map((c) => c.id));
  removedCount = tooSmall.size;

  for (let i = 0; i < labels.length; i++) {
    if (labels[i] !== -1 && tooSmall.has(labels[i])) {
      out.data[i * 4 + 3] = 0;
    }
  }

  return { buffer: out, removedCount };
}

/** Fills fully-enclosed transparent holes (regions of transparency not connected to the image border). */
export function fillHoles(buf: PixelBuffer, fillRgb: { r: number; g: number; b: number }): { buffer: PixelBuffer; filledCount: number } {
  const { width, height } = buf;
  const bgMask = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < bgMask.length; i++, p += 4) {
    bgMask[i] = buf.data[p + 3] < 10 ? 1 : 0;
  }

  const { labels, components } = labelComponents(bgMask, width, height);
  const borderLabels = new Set<number>();
  for (let x = 0; x < width; x++) {
    if (labels[x] !== -1) borderLabels.add(labels[x]);
    if (labels[(height - 1) * width + x] !== -1) borderLabels.add(labels[(height - 1) * width + x]);
  }
  for (let y = 0; y < height; y++) {
    if (labels[y * width] !== -1) borderLabels.add(labels[y * width]);
    if (labels[y * width + width - 1] !== -1) borderLabels.add(labels[y * width + width - 1]);
  }

  const out = cloneBuffer(buf);
  let filledCount = 0;
  for (const comp of components) {
    if (borderLabels.has(comp.id)) continue;
    filledCount++;
  }

  for (let i = 0; i < labels.length; i++) {
    const label = labels[i];
    if (label !== -1 && !borderLabels.has(label)) {
      const p = i * 4;
      out.data[p] = fillRgb.r;
      out.data[p + 1] = fillRgb.g;
      out.data[p + 2] = fillRgb.b;
      out.data[p + 3] = 255;
    }
  }

  return { buffer: out, filledCount };
}

/** Morphological opening (erode then dilate) on the alpha channel — removes
 * speckle noise and thin AA fringing without shifting the overall silhouette. */
export function removeSpeckle(buf: PixelBuffer, passes = 1): PixelBuffer {
  let current = buf;
  for (let i = 0; i < passes; i++) {
    current = erodeAlpha(current);
  }
  for (let i = 0; i < passes; i++) {
    current = dilateAlpha(current);
  }
  return current;
}

function erodeAlpha(buf: PixelBuffer): PixelBuffer {
  const { width, height } = buf;
  const out = cloneBuffer(buf);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (buf.data[idx * 4 + 3] < 10) continue;
      let solid = true;
      for (let dy = -1; dy <= 1 && solid; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          if (buf.data[(ny * width + nx) * 4 + 3] < 10) {
            solid = false;
            break;
          }
        }
      }
      if (!solid) out.data[idx * 4 + 3] = 0;
    }
  }
  return out;
}

function dilateAlpha(buf: PixelBuffer): PixelBuffer {
  const { width, height } = buf;
  const out = cloneBuffer(buf);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (buf.data[idx * 4 + 3] >= 10) continue;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          const nIdx = ny * width + nx;
          if (buf.data[nIdx * 4 + 3] >= 10) {
            out.data[idx * 4] = buf.data[nIdx * 4];
            out.data[idx * 4 + 1] = buf.data[nIdx * 4 + 1];
            out.data[idx * 4 + 2] = buf.data[nIdx * 4 + 2];
            out.data[idx * 4 + 3] = buf.data[nIdx * 4 + 3];
            break;
          }
        }
      }
    }
  }
  return out;
}

/** Box-blur + re-threshold on the alpha channel — softens jagged/aliased
 * edges left over from raster source art without eating fine detail. */
export function smoothEdges(buf: PixelBuffer, radius = 1, threshold = 128): PixelBuffer {
  const { width, height, data } = buf;
  const alpha = new Float32Array(width * height);
  for (let i = 0, p = 3; i < alpha.length; i++, p += 4) alpha[i] = data[p];

  const blurred = new Float32Array(alpha.length);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let sum = 0, count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
          sum += alpha[ny * width + nx];
          count++;
        }
      }
      blurred[y * width + x] = sum / count;
    }
  }

  const out = cloneBuffer(buf);
  for (let i = 0, p = 3; i < blurred.length; i++, p += 4) {
    out.data[p] = blurred[i] >= threshold ? 255 : 0;
  }
  return out;
}
