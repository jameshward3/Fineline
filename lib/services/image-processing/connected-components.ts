import type { PixelBuffer } from "./types";

export interface ComponentInfo {
  id: number;
  pixelCount: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/**
 * Labels 4-connected regions of a boolean foreground mask (e.g. alpha > 0,
 * or "belongs to color cluster K"). Used for island removal, hole filling,
 * and minimum-detail analysis — all of which need to reason about discrete
 * shapes rather than raw pixels.
 */
export function labelComponents(
  mask: Uint8Array,
  width: number,
  height: number
): { labels: Int32Array; components: ComponentInfo[] } {
  const labels = new Int32Array(width * height).fill(-1);
  const components: ComponentInfo[] = [];
  const stack: number[] = [];

  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || labels[start] !== -1) continue;

    const id = components.length;
    let pixelCount = 0;
    let minX = width, minY = height, maxX = 0, maxY = 0;

    stack.push(start);
    labels[start] = id;

    while (stack.length) {
      const idx = stack.pop()!;
      const x = idx % width;
      const y = (idx / width) | 0;
      pixelCount++;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;

      const neighbors = [
        x > 0 ? idx - 1 : -1,
        x < width - 1 ? idx + 1 : -1,
        y > 0 ? idx - width : -1,
        y < height - 1 ? idx + width : -1,
      ];
      for (const n of neighbors) {
        if (n >= 0 && mask[n] && labels[n] === -1) {
          labels[n] = id;
          stack.push(n);
        }
      }
    }

    components.push({ id, pixelCount, minX, minY, maxX, maxY });
  }

  return { labels, components };
}

export interface ClusterBounds {
  clusterIndex: number;
  pixelCount: number;
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

/** Aggregate bounding box + pixel count per palette cluster (from
 * `assignToPalette`/`quantizeColors`) — used to size each production color's
 * vector object for stitch-type recommendation, independent of the traced
 * SVG geometry's own (looser) bounding boxes. */
export function clusterBounds(clusters: Int16Array, width: number, clusterCount: number): ClusterBounds[] {
  const bounds: ClusterBounds[] = Array.from({ length: clusterCount }, (_, i) => ({
    clusterIndex: i,
    pixelCount: 0,
    minX: Infinity,
    minY: Infinity,
    maxX: -Infinity,
    maxY: -Infinity,
  }));

  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    if (c < 0 || c >= clusterCount) continue;
    const x = i % width;
    const y = (i / width) | 0;
    const b = bounds[c];
    b.pixelCount++;
    if (x < b.minX) b.minX = x;
    if (x > b.maxX) b.maxX = x;
    if (y < b.minY) b.minY = y;
    if (y > b.maxY) b.maxY = y;
  }

  return bounds;
}

export function alphaMask(buf: PixelBuffer, threshold = 10): Uint8Array {
  const mask = new Uint8Array(buf.width * buf.height);
  for (let i = 0, p = 0; i < mask.length; i++, p += 4) {
    mask[i] = buf.data[p + 3] >= threshold ? 1 : 0;
  }
  return mask;
}
