import type { ComponentInfo } from "./connected-components";

/** Recommended minimum feature size for reliable machine embroidery (satin
 * lines/small fill regions below this tend to skip stitches or blob out). */
export const MIN_DETAIL_MM = 1.5;
/** Recommended minimum letter height for embroidered text to stay legible. */
export const MIN_TEXT_HEIGHT_MM = 4.0;

export function pxPerInch(imagePixelWidth: number, physicalWidthInches: number): number {
  return imagePixelWidth / physicalWidthInches;
}

export function pxToMm(px: number, pxPerInchValue: number): number {
  return (px / pxPerInchValue) * 25.4;
}

export interface DetailWarning {
  componentId: number;
  widthMm: number;
  heightMm: number;
  pixelCount: number;
}

/**
 * Flags connected regions whose smaller bounding-box dimension falls below
 * the minimum reliable detail size at the artwork's chosen physical output
 * size. This is evaluated against the *physical* size, not raw pixels — the
 * same artwork can be fine at 6" wide and unusable at 2".
 */
export function findDetailWarnings(
  components: ComponentInfo[],
  imagePixelWidth: number,
  physicalWidthInches: number,
  minDetailMm = MIN_DETAIL_MM
): DetailWarning[] {
  const ppi = pxPerInch(imagePixelWidth, physicalWidthInches);
  const warnings: DetailWarning[] = [];

  for (const c of components) {
    const widthPx = c.maxX - c.minX + 1;
    const heightPx = c.maxY - c.minY + 1;
    const widthMm = pxToMm(widthPx, ppi);
    const heightMm = pxToMm(heightPx, ppi);
    if (Math.min(widthMm, heightMm) < minDetailMm) {
      warnings.push({ componentId: c.id, widthMm, heightMm, pixelCount: c.pixelCount });
    }
  }

  return warnings;
}

export function formatDetailWarning(
  warnings: DetailWarning[],
  physicalWidthInches: number
): string | null {
  if (warnings.length === 0) return null;
  return `${warnings.length} isolated region${warnings.length === 1 ? " is" : "s are"} smaller than the recommended production threshold at ${physicalWidthInches.toFixed(2)}" output width.`;
}

export function estimateStitchAreaSqInches(
  opaquePixelCount: number,
  imagePixelWidth: number,
  physicalWidthInches: number
): number {
  const ppi = pxPerInch(imagePixelWidth, physicalWidthInches);
  return opaquePixelCount / (ppi * ppi);
}
