import { prisma } from "@/lib/prisma";
import { pxPerInch, pxToMm } from "@/lib/services/image-processing/size";
import type { Point } from "./geometry";
import { parseSvgPathToSubPaths, type SubPath } from "./svg-path";
import { runningStitchBoundary, tatamiFill, satinFill, type StitchPath } from "./stitching";
import { encodeDst, type DstStitchInput } from "./dst";
import type { StitchEngineService, StitchGenerationInput, StitchGenerationResult } from "./types";

/** Moves shorter than this become a plain connecting stitch instead of a jump. */
const TRAVEL_JUMP_THRESHOLD_MM = 1.5;
/** Typical commercial machine production speed, for the runtime estimate. */
const AVG_MACHINE_STITCHES_PER_MINUTE = 700;
/** Rough per-color-change allowance (thread change + machine settle). */
const COLOR_CHANGE_SECONDS = 20;

export class TajimaDstStitchEngine implements StitchEngineService {
  async generate(input: StitchGenerationInput): Promise<StitchGenerationResult> {
    if (input.format !== "DST") {
      throw new Error(
        `${input.format} stitch-file generation is not implemented yet — only DST is currently supported.`
      );
    }

    const version = await prisma.designVersion.findUnique({
      where: { id: input.designVersionId },
      include: {
        design: true,
        assets: true,
        vectorObjects: { include: { threadColor: true }, orderBy: { sequenceOrder: "asc" } },
      },
    });
    if (!version) throw new Error("Design version not found.");
    if (!version.widthInches || !version.heightInches) {
      throw new Error("Design has no physical size set — set width/height before generating a stitch file.");
    }
    if (version.vectorObjects.length === 0) {
      throw new Error("This design has no vectorized objects to stitch yet.");
    }

    const manualReview = version.vectorObjects.filter((v) => v.stitchType === "MANUAL_REVIEW");
    if (manualReview.length > 0) {
      throw new Error(
        `${manualReview.length} object${manualReview.length === 1 ? "" : "s"} still need${
          manualReview.length === 1 ? "s" : ""
        } a stitch type assigned before a stitch file can be generated: ${manualReview
          .map((v) => v.name)
          .join(", ")}.`
      );
    }

    const referenceAsset =
      version.assets.find((a) => a.stage === "PRODUCTION") ?? version.assets.find((a) => a.stage === "SOURCE");
    const imagePixelWidth = referenceAsset?.widthPx ?? 1000;
    const ppi = pxPerInch(imagePixelWidth, version.widthInches);
    const toMm = (p: Point): Point => ({ x: pxToMm(p.x, ppi), y: pxToMm(p.y, ppi) });

    const warnings: string[] = [];
    const widthMm = version.widthInches * 25.4;
    const heightMm = version.heightInches * 25.4;
    if (widthMm > input.hoopWidthMm || heightMm > input.hoopHeightMm) {
      warnings.push(
        `Design is ${widthMm.toFixed(1)}mm x ${heightMm.toFixed(1)}mm, larger than the ${input.hoopWidthMm}mm x ${input.hoopHeightMm}mm hoop assumed for this check — confirm hoop selection before production.`
      );
    }

    const stitches: DstStitchInput[] = [];
    let cursor: Point = { x: 0, y: 0 };
    let lastThreadColorId: string | null | undefined;
    let unmappedCount = 0;

    for (const obj of version.vectorObjects) {
      const subPaths: SubPath[] = parseSvgPathToSubPaths(obj.svgPath).map((s) => ({
        ...s,
        points: s.points.map(toMm),
      }));
      if (subPaths.every((s) => s.points.length < 2)) continue;

      const runs = stitchRunsFor(obj.stitchType, subPaths, obj.stitchDirectionDegrees);
      if (runs.length === 0) continue;

      if (!obj.threadColorId) unmappedCount++;
      if (lastThreadColorId !== undefined && lastThreadColorId !== obj.threadColorId) {
        stitches.push({ xMm: cursor.x, yMm: cursor.y, command: "COLOR_CHANGE" });
      }
      lastThreadColorId = obj.threadColorId;

      for (const run of runs) {
        const gap = Math.hypot(run[0].x - cursor.x, run[0].y - cursor.y);
        stitches.push({ xMm: run[0].x, yMm: run[0].y, command: gap > TRAVEL_JUMP_THRESHOLD_MM ? "JUMP" : "STITCH" });
        for (const p of run) stitches.push({ xMm: p.x, yMm: p.y, command: "STITCH" });
        cursor = run[run.length - 1];
      }
    }

    if (stitches.length === 0) {
      throw new Error("No stitchable geometry was produced from this design's vector objects.");
    }
    if (unmappedCount > 0) {
      warnings.push(
        `${unmappedCount} object${unmappedCount === 1 ? " has" : "s have"} no thread color assigned — those regions will stitch with whatever the machine is currently threaded with.`
      );
    }

    const { buffer, stitchCount, colorChangeCount } = encodeDst(stitches, version.design.name);

    return {
      format: "DST",
      fileBuffer: buffer,
      stitchCount,
      colorChangeCount,
      estimatedRuntimeSeconds: Math.round(
        (stitchCount / AVG_MACHINE_STITCHES_PER_MINUTE) * 60 + colorChangeCount * COLOR_CHANGE_SECONDS
      ),
      warnings,
    };
  }
}

function stitchRunsFor(
  stitchType: string,
  subPaths: SubPath[],
  stitchDirectionDegrees: number | null
): StitchPath[] {
  const angle = stitchDirectionDegrees ?? 0;
  switch (stitchType) {
    case "RUNNING_STITCH":
    case "APPLIQUE":
      return runningStitchBoundary(subPaths);
    case "SATIN_STITCH":
      return satinFill(subPaths, angle);
    case "TATAMI_FILL":
      return tatamiFill(subPaths, angle);
    default:
      return [];
  }
}
