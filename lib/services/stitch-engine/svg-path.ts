import type { Point } from "./geometry";

export interface SubPath {
  points: Point[];
  closed: boolean;
}

const CURVE_STEPS = 10;

function quadraticPoint(p0: Point, p1: Point, p2: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function cubicPoint(p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * mt * p0.x + 3 * mt * mt * t * p1.x + 3 * mt * t * t * p2.x + t * t * t * p3.x,
    y: mt * mt * mt * p0.y + 3 * mt * mt * t * p1.y + 3 * mt * t * t * p2.y + t * t * t * p3.y,
  };
}

/**
 * Parses the subset of SVG path syntax our vectorization pipeline actually
 * emits (imagetracerjs: absolute M/L/Q/Z, holes as reverse-wound subpaths)
 * plus C for robustness, flattening curves into short line segments so
 * downstream stitch algorithms only ever deal with polylines.
 */
export function parseSvgPathToSubPaths(d: string): SubPath[] {
  const tokens = d.match(/[MLQCZ]|-?\d*\.?\d+(?:e-?\d+)?/gi) ?? [];
  const subPaths: SubPath[] = [];
  let current: Point[] = [];
  let cursor: Point = { x: 0, y: 0 };
  let start: Point = { x: 0, y: 0 };
  let i = 0;

  function readNum(): number {
    return parseFloat(tokens[i++]);
  }

  while (i < tokens.length) {
    const cmd = tokens[i++];
    switch (cmd) {
      case "M":
      case "m": {
        if (current.length > 0) subPaths.push({ points: current, closed: false });
        cursor = { x: readNum(), y: readNum() };
        start = cursor;
        current = [cursor];
        break;
      }
      case "L":
      case "l": {
        cursor = { x: readNum(), y: readNum() };
        current.push(cursor);
        break;
      }
      case "Q":
      case "q": {
        const c1 = { x: readNum(), y: readNum() };
        const end = { x: readNum(), y: readNum() };
        for (let s = 1; s <= CURVE_STEPS; s++) current.push(quadraticPoint(cursor, c1, end, s / CURVE_STEPS));
        cursor = end;
        break;
      }
      case "C":
      case "c": {
        const c1 = { x: readNum(), y: readNum() };
        const c2 = { x: readNum(), y: readNum() };
        const end = { x: readNum(), y: readNum() };
        for (let s = 1; s <= CURVE_STEPS; s++) current.push(cubicPoint(cursor, c1, c2, end, s / CURVE_STEPS));
        cursor = end;
        break;
      }
      case "Z":
      case "z": {
        if (current.length > 0) {
          subPaths.push({ points: current, closed: true });
          current = [];
        }
        cursor = start;
        break;
      }
      default:
        // Stray numeric token with no preceding command letter shouldn't
        // occur given how imagetracerjs emits paths; skip defensively.
        break;
    }
  }
  if (current.length > 1) subPaths.push({ points: current, closed: false });

  return subPaths;
}
