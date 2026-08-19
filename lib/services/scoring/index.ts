import { deltaE76, hexToLab } from "@/lib/color";

export interface ReadinessInput {
  detectedColorCount: number;
  targetColorCount: number;
  /** Number of discrete connected regions after cleanup. */
  componentCount: number;
  /** Regions flagged as below the minimum reliable detail size. */
  detailWarningCount: number;
  /** Hex colors of the reduced production palette. */
  paletteHexes: string[];
  /** Vector objects created so far and whether each still needs manual stitch-type review. */
  vectorObjects: { stitchType: string }[];
  /** Whether the design has an associated product + location + setup. */
  hasProductionSetup: boolean;
}

export interface ReadinessBreakdown {
  colorCount: number; // /10
  shapeComplexity: number; // /20
  minimumDetail: number; // /20
  contrast: number; // /10
  vectorQuality: number; // /20
  productionSetup: number; // /20
}

export type ReadinessClassification =
  | "Excellent for embroidery"
  | "Good with simplification"
  | "Significant cleanup required"
  | "Poor candidate for embroidery";

export interface ReadinessResult {
  score: number;
  breakdown: ReadinessBreakdown;
  classification: ReadinessClassification;
  recommendations: string[];
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function scoreDesignReadiness(input: ReadinessInput): ReadinessResult {
  const recommendations: string[] = [];

  // Color Count (/10): fewer, more deliberate colors score higher.
  const colorCount = Math.round(clamp(10 - Math.max(0, input.targetColorCount - 6) * 1.2, 0, 10));
  if (input.targetColorCount > 10) {
    recommendations.push("Reduce to fewer production colors to simplify needle changes.");
  }

  // Shape Complexity (/20): fewer disconnected regions is easier to digitize cleanly.
  const shapeComplexity = Math.round(clamp(20 - Math.max(0, input.componentCount - 8) * 0.8, 0, 20));
  if (input.componentCount > 20) {
    recommendations.push("Consolidate small disconnected regions — high shape complexity slows digitizing.");
  }

  // Minimum Detail (/20): penalize by the share of regions flagged too small.
  const detailRatio = input.componentCount > 0 ? input.detailWarningCount / input.componentCount : 0;
  const minimumDetail = Math.round(clamp(20 - detailRatio * 20, 0, 20));
  if (input.detailWarningCount > 0) {
    recommendations.push(
      `${input.detailWarningCount} region${input.detailWarningCount === 1 ? "" : "s"} fall below the minimum reliable detail size — enlarge, merge, or remove them.`
    );
  }

  // Contrast (/10): colors that sit too close together in LAB space risk blending or misreads.
  let minPairwiseDelta = Infinity;
  const labs = input.paletteHexes.map(hexToLab);
  for (let i = 0; i < labs.length; i++) {
    for (let j = i + 1; j < labs.length; j++) {
      minPairwiseDelta = Math.min(minPairwiseDelta, deltaE76(labs[i], labs[j]));
    }
  }
  const contrast =
    labs.length < 2 ? 10 : Math.round(clamp((minPairwiseDelta / 25) * 10, 0, 10));
  if (labs.length >= 2 && minPairwiseDelta < 12) {
    recommendations.push("Two production colors are very close visually — consider merging them.");
  }

  // Vector Quality (/20): share of objects that have moved past "needs manual review".
  const reviewed = input.vectorObjects.filter((v) => v.stitchType !== "MANUAL_REVIEW").length;
  const vectorQuality =
    input.vectorObjects.length === 0
      ? 0
      : Math.round(clamp((reviewed / input.vectorObjects.length) * 20, 0, 20));
  if (input.vectorObjects.length > 0 && reviewed < input.vectorObjects.length) {
    recommendations.push("Assign stitch types to the remaining objects marked for manual review.");
  }

  // Production Setup (/20): whether the design is tied to a real product/location/setup.
  const productionSetup = input.hasProductionSetup ? 20 : 6;
  if (!input.hasProductionSetup) {
    recommendations.push("Associate this design with a product, location, and production setup.");
  }

  const breakdown: ReadinessBreakdown = {
    colorCount,
    shapeComplexity,
    minimumDetail,
    contrast,
    vectorQuality,
    productionSetup,
  };

  const score = colorCount + shapeComplexity + minimumDetail + contrast + vectorQuality + productionSetup;

  let classification: ReadinessClassification;
  if (score >= 90) classification = "Excellent for embroidery";
  else if (score >= 75) classification = "Good with simplification";
  else if (score >= 50) classification = "Significant cleanup required";
  else classification = "Poor candidate for embroidery";

  return { score, breakdown, classification, recommendations };
}
