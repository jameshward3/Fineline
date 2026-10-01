export type LetteringFont = "SANS" | "SERIF" | "SCRIPT" | "HANDWRITTEN";

export interface LetteringFontOption {
  value: LetteringFont;
  label: string;
  /** Literal CSS font-family stack — used for both the live canvas preview
   * and the <option>/button styling, so what the customer sees in the
   * picker matches what gets rendered. */
  cssFont: string;
  /** Google Font family name to load for canvas use, if not a system font. */
  googleFont?: string;
}

export const LETTERING_FONTS: LetteringFontOption[] = [
  { value: "SANS", label: "Sans Serif", cssFont: '"Helvetica Neue", Helvetica, Arial, sans-serif' },
  { value: "SERIF", label: "Serif", cssFont: '"Times New Roman", Times, serif' },
  { value: "SCRIPT", label: "Script", cssFont: '"Dancing Script", cursive', googleFont: "Dancing Script" },
  { value: "HANDWRITTEN", label: "Handwritten", cssFont: '"Caveat", cursive', googleFont: "Caveat" },
];

export function letteringFontOption(font: LetteringFont): LetteringFontOption {
  return LETTERING_FONTS.find((option) => option.value === font) ?? LETTERING_FONTS[0];
}

/**
 * Ensures a Google-hosted lettering font is actually loaded before it's used
 * on a <canvas> — canvas text silently falls back to a default font if the
 * custom one isn't ready yet, unlike regular DOM text which just reflows.
 */
export async function ensureLetteringFontLoaded(font: LetteringFont): Promise<void> {
  const option = letteringFontOption(font);
  if (!option.googleFont || typeof document === "undefined" || !("fonts" in document)) return;
  try {
    await document.fonts.load(`700 220px "${option.googleFont}"`);
  } catch {
    // Fall through silently — canvas will use the font-stack's fallback.
  }
}
