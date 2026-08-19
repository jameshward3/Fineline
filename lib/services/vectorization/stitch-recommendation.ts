export type StitchTypeRecommendation = "RUNNING_STITCH" | "SATIN_STITCH" | "TATAMI_FILL";

export interface StitchRecommendationInput {
  widthMm: number;
  heightMm: number;
  areaSqMm: number;
}

/**
 * Recommends a starting stitch category from raw geometry. This is a
 * production-prep heuristic, not a digitizing decision — it exists to give
 * InStitch (and the human digitizer) an organized starting point, and the
 * user can override every suggestion.
 */
export function recommendStitchType(input: StitchRecommendationInput): StitchTypeRecommendation {
  const minDimension = Math.min(input.widthMm, input.heightMm);
  const maxDimension = Math.max(input.widthMm, input.heightMm);
  const aspectRatio = maxDimension / Math.max(minDimension, 0.01);

  // Very thin relative to its length -> a line (outline, thin stroke).
  if (minDimension < 2.2 && aspectRatio > 3) {
    return "RUNNING_STITCH";
  }
  // Narrow band -> letters, borders, narrow shapes -> satin.
  if (minDimension < 9) {
    return "SATIN_STITCH";
  }
  // Everything else with real width -> filled area.
  return "TATAMI_FILL";
}

export function recommendStitchDirection(widthMm: number, heightMm: number): number {
  const aspect = widthMm / Math.max(heightMm, 0.01);
  if (aspect > 1.6) return 0;
  if (aspect < 0.625) return 90;
  return 45;
}
