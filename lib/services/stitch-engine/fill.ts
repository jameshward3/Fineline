import type { Point, BoundingBox } from "./geometry";
import { rotatePoint, boundingBoxOf, centroidOf } from "./geometry";
import type { SubPath } from "./svg-path";

export interface FillRowSegment {
  start: Point;
  end: Point;
}

interface Edge {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  winding: 1 | -1;
}

/**
 * Sweeps a set of (possibly multi-subpath, hole-containing) closed shapes
 * with parallel rows at `angleDegrees`, using the nonzero winding rule —
 * matching how imagetracerjs encodes holes as reverse-wound subpaths and
 * how browsers render the resulting SVG. Returns evenly spaced row
 * segments in original (unrotated) coordinates, ordered so consecutive
 * rows are adjacent (for a boustrophedon fill pass).
 */
export function scanlineFillRows(subPaths: SubPath[], angleDegrees: number, rowSpacingMm: number): FillRowSegment[] {
  if (subPaths.length === 0 || rowSpacingMm <= 0) return [];

  const box = boundingBoxOf(subPaths.map((s) => s.points));
  const origin = centroidOf(box);
  const angleRad = (angleDegrees * Math.PI) / 180;

  const rotated: Point[][] = subPaths.map((s) => s.points.map((p) => rotatePoint(p, -angleRad, origin)));
  const rotatedBox: BoundingBox = boundingBoxOf(rotated);

  const edges: Edge[] = [];
  for (const pts of rotated) {
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i];
      const b = pts[(i + 1) % pts.length];
      if (a.y === b.y) continue; // horizontal edges never cross a scan line
      edges.push({ x1: a.x, y1: a.y, x2: b.x, y2: b.y, winding: b.y > a.y ? 1 : -1 });
    }
  }
  if (edges.length === 0) return [];

  const rows: FillRowSegment[] = [];
  const yStart = rotatedBox.minY + rowSpacingMm / 2;
  for (let y = yStart; y < rotatedBox.maxY; y += rowSpacingMm) {
    const crossings: { x: number; winding: 1 | -1 }[] = [];
    for (const e of edges) {
      const lo = Math.min(e.y1, e.y2);
      const hi = Math.max(e.y1, e.y2);
      if (y < lo || y >= hi) continue;
      const t = (y - e.y1) / (e.y2 - e.y1);
      crossings.push({ x: e.x1 + t * (e.x2 - e.x1), winding: e.winding });
    }
    crossings.sort((a, b) => a.x - b.x);

    let wind = 0;
    let spanStartX: number | null = null;
    for (const c of crossings) {
      const wasInside = wind !== 0;
      wind += c.winding;
      const isInside = wind !== 0;
      if (!wasInside && isInside) spanStartX = c.x;
      else if (wasInside && !isInside && spanStartX !== null) {
        rows.push({
          start: rotatePoint({ x: spanStartX, y }, angleRad, origin),
          end: rotatePoint({ x: c.x, y }, angleRad, origin),
        });
        spanStartX = null;
      }
    }
  }

  return rows;
}
