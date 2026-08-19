import type { PixelBuffer } from "./types";
import { cloneBuffer } from "./types";
import { hexToRgb, rgbDistance, type RGB } from "@/lib/color";

function colorAt(buf: PixelBuffer, idx: number): RGB {
  const p = idx * 4;
  return { r: buf.data[p], g: buf.data[p + 1], b: buf.data[p + 2] };
}

/**
 * Flood fill from a set of seed pixels, matching by color distance. Shared
 * by automatic background removal (seeded from the image border) and
 * magic-select (seeded from a single click).
 */
function floodFillMask(buf: PixelBuffer, seeds: number[], tolerance: number): Uint8Array {
  const { width, height } = buf;
  const visited = new Uint8Array(width * height);
  const stack: number[] = [];

  for (const seed of seeds) {
    if (!visited[seed]) {
      visited[seed] = 1;
      stack.push(seed);
    }
  }

  const targetColors = seeds.map((s) => colorAt(buf, s));

  while (stack.length) {
    const idx = stack.pop()!;
    const x = idx % width;
    const y = (idx / width) | 0;
    const color = colorAt(buf, idx);

    const neighbors = [
      x > 0 ? idx - 1 : -1,
      x < width - 1 ? idx + 1 : -1,
      y > 0 ? idx - width : -1,
      y < height - 1 ? idx + width : -1,
    ];
    for (const n of neighbors) {
      if (n < 0 || visited[n]) continue;
      const nColor = colorAt(buf, n);
      const matches = targetColors.some((t) => rgbDistance(nColor, t) <= tolerance);
      if (matches && rgbDistance(nColor, color) <= tolerance * 1.5) {
        visited[n] = 1;
        stack.push(n);
      }
    }
  }

  return visited;
}

/**
 * Automatic background removal: seeds a flood fill from every border pixel
 * (handles flat or near-flat backgrounds, which is the overwhelming
 * majority of AI-generated logo/artwork exports) and makes matched pixels
 * transparent. Tolerance is a 0-255 RGB-distance threshold.
 */
export function autoRemoveBackground(buf: PixelBuffer, tolerance = 28): PixelBuffer {
  const { width, height } = buf;
  const seeds: number[] = [];
  for (let x = 0; x < width; x++) {
    seeds.push(x);
    seeds.push((height - 1) * width + x);
  }
  for (let y = 0; y < height; y++) {
    seeds.push(y * width);
    seeds.push(y * width + width - 1);
  }

  const mask = floodFillMask(buf, seeds, tolerance);
  const out = cloneBuffer(buf);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i]) out.data[i * 4 + 3] = 0;
  }
  return out;
}

/** Magic-select: flood fill from one point, returning the matched region as a boolean mask. */
export function magicSelect(buf: PixelBuffer, x: number, y: number, tolerance = 28): Uint8Array {
  const seed = y * buf.width + x;
  return floodFillMask(buf, [seed], tolerance);
}

/** Color-based removal: makes every pixel within tolerance of `hex` transparent, regardless of connectivity. */
export function colorKeyRemove(buf: PixelBuffer, hex: string, tolerance = 28): PixelBuffer {
  const target = hexToRgb(hex);
  const out = cloneBuffer(buf);
  for (let p = 0; p < out.data.length; p += 4) {
    const color = { r: out.data[p], g: out.data[p + 1], b: out.data[p + 2] };
    if (rgbDistance(color, target) <= tolerance) {
      out.data[p + 3] = 0;
    }
  }
  return out;
}

export type BrushMode = "erase" | "restore";

/**
 * Manual erase/restore brush. `original` must be the untouched source
 * buffer — restore reads alpha back from it, never from a lossy intermediate,
 * so the source artwork is never destructively altered.
 */
export function applyBrush(
  working: PixelBuffer,
  original: PixelBuffer,
  x: number,
  y: number,
  radius: number,
  mode: BrushMode
): void {
  const { width, height } = working;
  const minX = Math.max(0, Math.floor(x - radius));
  const maxX = Math.min(width - 1, Math.ceil(x + radius));
  const minY = Math.max(0, Math.floor(y - radius));
  const maxY = Math.min(height - 1, Math.ceil(y + radius));

  for (let py = minY; py <= maxY; py++) {
    for (let px = minX; px <= maxX; px++) {
      const dist = Math.hypot(px - x, py - y);
      if (dist > radius) continue;
      const idx = py * width + px;
      working.data[idx * 4 + 3] = mode === "erase" ? 0 : original.data[idx * 4 + 3];
    }
  }
}

export function applyMask(buf: PixelBuffer, mask: Uint8Array, makeTransparent: boolean): PixelBuffer {
  const out = cloneBuffer(buf);
  for (let i = 0; i < mask.length; i++) {
    if (mask[i] === (makeTransparent ? 1 : 0)) continue;
    if (makeTransparent && mask[i]) out.data[i * 4 + 3] = 0;
    if (!makeTransparent && !mask[i]) out.data[i * 4 + 3] = 0;
  }
  return out;
}
