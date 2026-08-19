import { deltaE76, hexToLab } from "@/lib/color";

export interface LoadedNeedle {
  needleNumber: number;
  threadColorId: string | null;
  hex: string | null;
  companyName: string | null;
}

export interface RequiredColor {
  /** Sequence position in the design's color mapping (production order). */
  sequence: number;
  threadColorId: string;
  hex: string;
  companyName: string;
}

export interface NeedleAssignment {
  sequence: number;
  requiredThreadColorId: string;
  requiredHex: string;
  requiredName: string;
  /** Needle this color is already loaded on, if any (no change needed). */
  alreadyLoadedNeedle: number | null;
  /** Cheapest needle to reassign if not already loaded — chosen by visual
   * similarity to what's currently on it, so the operator swaps the spool
   * that's "closest" to what's going on the machine (least jarring, and a
   * reasonable proxy for "least likely to be needed again soon"). */
  suggestedNeedle: number | null;
  suggestedNeedleCurrentColorName: string | null;
  needsChange: boolean;
}

export interface NeedleOptimizationResult {
  assignments: NeedleAssignment[];
  loadedCount: number;
  totalRequired: number;
  changeCount: number;
}

/**
 * The 15-Needle Optimizer: compares a design's required production colors
 * against what's currently loaded on a machine, and proposes the cheapest
 * path to get the machine ready — reusing already-loaded spools wherever
 * possible and only proposing changes where a color genuinely isn't loaded.
 */
export function optimizeNeedleAssignment(
  required: RequiredColor[],
  loaded: LoadedNeedle[]
): NeedleOptimizationResult {
  const availableNeedles = [...loaded];
  const assignments: NeedleAssignment[] = [];

  // Pass 1: claim needles that already have the exact thread loaded.
  for (const color of required) {
    const exactMatch = availableNeedles.find((n) => n.threadColorId === color.threadColorId);
    if (exactMatch) {
      assignments.push({
        sequence: color.sequence,
        requiredThreadColorId: color.threadColorId,
        requiredHex: color.hex,
        requiredName: color.companyName,
        alreadyLoadedNeedle: exactMatch.needleNumber,
        suggestedNeedle: exactMatch.needleNumber,
        suggestedNeedleCurrentColorName: exactMatch.companyName,
        needsChange: false,
      });
      availableNeedles.splice(availableNeedles.indexOf(exactMatch), 1);
    }
  }

  // Pass 2: for colors not already loaded, suggest the visually closest
  // free needle to swap — minimizes how "different" each spool change feels
  // and keeps the reasoning legible to an operator scanning the list.
  const unresolved = required.filter(
    (c) => !assignments.some((a) => a.requiredThreadColorId === c.threadColorId)
  );

  for (const color of unresolved) {
    let best: LoadedNeedle | null = null;
    let bestDelta = Infinity;
    const targetLab = hexToLab(color.hex);

    for (const needle of availableNeedles) {
      const delta = needle.hex ? deltaE76(targetLab, hexToLab(needle.hex)) : 0;
      if (delta < bestDelta) {
        bestDelta = delta;
        best = needle;
      }
    }

    assignments.push({
      sequence: color.sequence,
      requiredThreadColorId: color.threadColorId,
      requiredHex: color.hex,
      requiredName: color.companyName,
      alreadyLoadedNeedle: null,
      suggestedNeedle: best?.needleNumber ?? null,
      suggestedNeedleCurrentColorName: best?.companyName ?? null,
      needsChange: true,
    });

    if (best) availableNeedles.splice(availableNeedles.indexOf(best), 1);
  }

  assignments.sort((a, b) => a.sequence - b.sequence);
  const changeCount = assignments.filter((a) => a.needsChange).length;

  return {
    assignments,
    loadedCount: required.length - changeCount,
    totalRequired: required.length,
    changeCount,
  };
}
