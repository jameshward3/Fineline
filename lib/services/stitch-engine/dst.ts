/**
 * Tajima DST binary encoder — the most widely supported machine embroidery
 * stitch-file format. The record layout implemented here (512-byte ASCII
 * header, 3-byte stitch records using a weighted 1/3/9/27/81 bit encoding
 * per axis, 0x03/0x83/0xC3/0xF3 control bytes for stitch/jump/color-change/
 * end) is the publicly documented Tajima format used across the embroidery
 * industry — this is an original implementation of that public spec, not
 * derived from any single reference codebase.
 */

export type DstCommand = "STITCH" | "JUMP" | "COLOR_CHANGE";

export interface DstStitchInput {
  /** Absolute position in millimeters, design (Y-down) space. */
  xMm: number;
  yMm: number;
  command: DstCommand;
}

export interface DstEncodeResult {
  buffer: Buffer;
  stitchCount: number;
  colorChangeCount: number;
}

const UNITS_PER_MM = 10; // DST resolution: 1 unit = 0.1mm
const MAX_STEP_UNITS = 121; // largest single-axis delta a 3-byte record can carry
const HEADER_SIZE = 512;

function bit(n: number): number {
  return 1 << n;
}

function decomposeDelta(total: number): number[] {
  const steps: number[] = [];
  let remaining = total;
  while (Math.abs(remaining) > MAX_STEP_UNITS) {
    const step = remaining > 0 ? MAX_STEP_UNITS : -MAX_STEP_UNITS;
    steps.push(step);
    remaining -= step;
  }
  steps.push(remaining);
  return steps;
}

function decomposeDeltaPair(dxTotal: number, dyTotal: number): Array<[number, number]> {
  const xSteps = decomposeDelta(dxTotal);
  const ySteps = decomposeDelta(dyTotal);
  const n = Math.max(xSteps.length, ySteps.length);
  const pairs: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) pairs.push([xSteps[i] ?? 0, ySteps[i] ?? 0]);
  return pairs;
}

/** Encodes one stitch/jump record. dx/dy must already be within +/-121 units. */
function encodeStepRecord(dxUnits: number, dyUnits: number, isJump: boolean): [number, number, number] {
  let b0 = 0;
  let b1 = 0;
  let b2 = 0;
  if (isJump) b2 += bit(7);
  b2 += bit(0);
  b2 += bit(1);

  let x = dxUnits;
  let y = -dyUnits; // DST's vertical axis is flipped relative to design (screen, Y-down) space

  if (x > 40) { b2 += bit(2); x -= 81; }
  if (x < -40) { b2 += bit(3); x += 81; }
  if (x > 13) { b1 += bit(2); x -= 27; }
  if (x < -13) { b1 += bit(3); x += 27; }
  if (x > 4) { b0 += bit(2); x -= 9; }
  if (x < -4) { b0 += bit(3); x += 9; }
  if (x > 1) { b1 += bit(0); x -= 3; }
  if (x < -1) { b1 += bit(1); x += 3; }
  if (x > 0) { b0 += bit(0); x -= 1; }
  if (x < 0) { b0 += bit(1); x += 1; }
  if (x !== 0) throw new Error(`DST encoder: dx step ${dxUnits} outside encodable range`);

  if (y > 40) { b2 += bit(5); y -= 81; }
  if (y < -40) { b2 += bit(4); y += 81; }
  if (y > 13) { b1 += bit(5); y -= 27; }
  if (y < -13) { b1 += bit(4); y += 27; }
  if (y > 4) { b0 += bit(5); y -= 9; }
  if (y < -4) { b0 += bit(4); y += 9; }
  if (y > 1) { b1 += bit(7); y -= 3; }
  if (y < -1) { b1 += bit(6); y += 3; }
  if (y > 0) { b0 += bit(7); y -= 1; }
  if (y < 0) { b0 += bit(6); y += 1; }
  if (y !== 0) throw new Error(`DST encoder: dy step ${dyUnits} outside encodable range`);

  return [b0, b1, b2];
}

const COLOR_CHANGE_RECORD: [number, number, number] = [0, 0, 0b11000011];
const END_RECORD: [number, number, number] = [0, 0, 0b11110011];

function padRight(s: string, len: number): string {
  return s.length >= len ? s : s + " ".repeat(len - s.length);
}

function padLeft(s: string, len: number): string {
  return s.length >= len ? s : " ".repeat(len - s.length) + s;
}

function buildHeader(opts: {
  name: string;
  stitchCount: number;
  colorChangeCount: number;
  minXUnits: number;
  minYUnits: number;
  maxXUnits: number;
  maxYUnits: number;
  lastXUnits: number;
  lastYUnits: number;
}): Buffer {
  const lines = [
    `LA:${padRight(opts.name.slice(0, 16), 16)}\r`,
    `ST:${padLeft(String(opts.stitchCount), 7)}\r`,
    `CO:${padLeft(String(opts.colorChangeCount), 3)}\r`,
    `+X:${padLeft(String(Math.abs(opts.maxXUnits)), 5)}\r`,
    `-X:${padLeft(String(Math.abs(opts.minXUnits)), 5)}\r`,
    `+Y:${padLeft(String(Math.abs(opts.maxYUnits)), 5)}\r`,
    `-Y:${padLeft(String(Math.abs(opts.minYUnits)), 5)}\r`,
    `AX:${opts.lastXUnits >= 0 ? "+" : "-"}${padLeft(String(Math.abs(opts.lastXUnits)), 5)}\r`,
    `AY:${opts.lastYUnits >= 0 ? "+" : "-"}${padLeft(String(Math.abs(opts.lastYUnits)), 5)}\r`,
    `MX:+${padLeft("0", 5)}\r`,
    `MY:+${padLeft("0", 5)}\r`,
    `PD:******\r`,
  ];
  const text = lines.join("");
  const bytes = Buffer.alloc(HEADER_SIZE, 0x20); // space-padded
  bytes.write(text, 0, "ascii");
  bytes[text.length] = 0x1a; // EOF/SUB marker
  return bytes;
}

export function encodeDst(stitches: DstStitchInput[], designName: string): DstEncodeResult {
  if (stitches.length === 0) throw new Error("Cannot encode an empty stitch list");

  const records: Array<[number, number, number]> = [];
  let colorChangeCount = 0;
  let accumXUnits = 0;
  let accumYUnits = 0;
  let minXUnits = 0;
  let minYUnits = 0;
  let maxXUnits = 0;
  let maxYUnits = 0;

  for (const s of stitches) {
    const targetXUnits = s.xMm * UNITS_PER_MM;
    const targetYUnits = s.yMm * UNITS_PER_MM;

    if (s.command === "COLOR_CHANGE") {
      records.push(COLOR_CHANGE_RECORD);
      colorChangeCount++;
      continue;
    }

    const dx = Math.round(targetXUnits - accumXUnits);
    const dy = Math.round(targetYUnits - accumYUnits);
    for (const [stepX, stepY] of decomposeDeltaPair(dx, dy)) {
      records.push(encodeStepRecord(stepX, stepY, s.command === "JUMP"));
      accumXUnits += stepX;
      accumYUnits += stepY;
    }

    minXUnits = Math.min(minXUnits, accumXUnits);
    minYUnits = Math.min(minYUnits, accumYUnits);
    maxXUnits = Math.max(maxXUnits, accumXUnits);
    maxYUnits = Math.max(maxYUnits, accumYUnits);
  }

  records.push(END_RECORD);

  const header = buildHeader({
    name: designName,
    stitchCount: records.length,
    colorChangeCount,
    minXUnits,
    minYUnits,
    maxXUnits,
    maxYUnits,
    lastXUnits: Math.round(accumXUnits),
    lastYUnits: -Math.round(accumYUnits),
  });

  const body = Buffer.from(records.flat());
  return {
    buffer: Buffer.concat([header, body]),
    stitchCount: records.length,
    colorChangeCount,
  };
}
