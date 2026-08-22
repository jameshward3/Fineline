import type { Point } from "./geometry";
import { resampleByArcLength } from "./geometry";
import type { SubPath } from "./svg-path";
import { scanlineFillRows } from "./fill";

/** A single unbroken run of consecutive stitch points (no travel gaps within it). */
export type StitchPath = Point[];

export const DEFAULT_RUNNING_STITCH_MM = 2.2;
export const DEFAULT_TATAMI_ROW_SPACING_MM = 0.4;
export const DEFAULT_TATAMI_STITCH_MM = 3.0;
export const DEFAULT_SATIN_ROW_SPACING_MM = 0.35;

/**
 * Traces the boundary of each subpath (outline + any holes) as a running
 * stitch. Suitable for line art, text strokes, and appliqué placement/
 * tack-down lines — anything where the *outline* itself is the design,
 * not a filled area.
 */
export function runningStitchBoundary(subPaths: SubPath[], stitchLengthMm = DEFAULT_RUNNING_STITCH_MM): StitchPath[] {
  const paths: StitchPath[] = [];
  for (const sub of subPaths) {
    if (sub.points.length < 2) continue;
    const points = sub.closed ? [...sub.points, sub.points[0]] : sub.points;
    const resampled = resampleByArcLength(points, stitchLengthMm);
    if (resampled.length >= 2) paths.push(resampled);
  }
  return paths;
}

/**
 * Fills a shape with tatami (rows of running stitch, alternating direction,
 * connected row-to-row) — the standard fill technique for medium/large
 * solid regions. Rows follow the nonzero winding rule, so holes are
 * respected automatically.
 */
export function tatamiFill(
  subPaths: SubPath[],
  angleDegrees: number,
  rowSpacingMm = DEFAULT_TATAMI_ROW_SPACING_MM,
  stitchLengthMm = DEFAULT_TATAMI_STITCH_MM
): StitchPath[] {
  const rows = scanlineFillRows(subPaths, angleDegrees, rowSpacingMm);
  if (rows.length === 0) return [];

  const points: Point[] = [];
  rows.forEach((row, i) => {
    const [from, to] = i % 2 === 0 ? [row.start, row.end] : [row.end, row.start];
    const rowPoints = resampleByArcLength([from, to], stitchLengthMm);
    points.push(...rowPoints);
  });
  return [points];
}

/**
 * Fills a (typically narrow) shape with satin: each row becomes one
 * straight stitch spanning the full width, zigzagging back and forth. Rows
 * wider than a single machine stitch are handled by the DST encoder, which
 * automatically chains oversized deltas into several inline stitches —
 * still reading as continuous satin coverage.
 */
export function satinFill(subPaths: SubPath[], angleDegrees: number, rowSpacingMm = DEFAULT_SATIN_ROW_SPACING_MM): StitchPath[] {
  const rows = scanlineFillRows(subPaths, angleDegrees, rowSpacingMm);
  if (rows.length === 0) return [];

  const points: Point[] = [];
  rows.forEach((row, i) => {
    const [from, to] = i % 2 === 0 ? [row.start, row.end] : [row.end, row.start];
    points.push(from, to);
  });
  return [points];
}
