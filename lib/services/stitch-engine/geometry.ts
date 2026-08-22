export interface Point {
  x: number;
  y: number;
}

export function distance(a: Point, b: Point): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function lerp(a: Point, b: Point, t: number): Point {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

export function pathLength(points: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += distance(points[i - 1], points[i]);
  return total;
}

export function rotatePoint(p: Point, angleRad: number, origin: Point): Point {
  const cos = Math.cos(angleRad);
  const sin = Math.sin(angleRad);
  const dx = p.x - origin.x;
  const dy = p.y - origin.y;
  return {
    x: origin.x + dx * cos - dy * sin,
    y: origin.y + dx * sin + dy * cos,
  };
}

export interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function boundingBoxOf(pointSets: Point[][]): BoundingBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const pts of pointSets) {
    for (const p of pts) {
      if (p.x < minX) minX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.x > maxX) maxX = p.x;
      if (p.y > maxY) maxY = p.y;
    }
  }
  return { minX, minY, maxX, maxY };
}

export function centroidOf(box: BoundingBox): Point {
  return { x: (box.minX + box.maxX) / 2, y: (box.minY + box.maxY) / 2 };
}

/**
 * Resamples a polyline at fixed arc-length intervals, always including the
 * first and last points. Used to turn a boundary or fill-row into evenly
 * spaced stitch points.
 */
export function resampleByArcLength(points: Point[], intervalMm: number): Point[] {
  if (points.length < 2 || intervalMm <= 0) return points.slice();
  const out: Point[] = [points[0]];
  let carry = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const segLen = distance(a, b);
    if (segLen === 0) continue;
    let travelled = carry;
    while (travelled + intervalMm <= segLen) {
      travelled += intervalMm;
      out.push(lerp(a, b, travelled / segLen));
    }
    carry = travelled - segLen;
  }
  const last = points[points.length - 1];
  const lastOut = out[out.length - 1];
  if (!lastOut || distance(lastOut, last) > 0.05) out.push(last);
  return out;
}
