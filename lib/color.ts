export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface LAB {
  l: number;
  a: number;
  b: number;
}

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const num = parseInt(full, 16);
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

export function rgbString({ r, g, b }: RGB): string {
  return `${Math.round(r)},${Math.round(g)},${Math.round(b)}`;
}

function srgbToLinear(c: number): number {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
}

// D65 reference white, sRGB -> XYZ -> CIELAB
export function rgbToLab(rgb: RGB): LAB {
  const r = srgbToLinear(rgb.r);
  const g = srgbToLinear(rgb.g);
  const b = srgbToLinear(rgb.b);

  const x = r * 0.4124564 + g * 0.3575761 + b * 0.1804375;
  const y = r * 0.2126729 + g * 0.7151522 + b * 0.072175;
  const z = r * 0.0193339 + g * 0.119192 + b * 0.9503041;

  const xn = x / 0.95047;
  const yn = y / 1.0;
  const zn = z / 1.08883;

  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f(xn);
  const fy = f(yn);
  const fz = f(zn);

  return {
    l: 116 * fy - 16,
    a: 500 * (fx - fy),
    b: 200 * (fy - fz),
  };
}

export function hexToLab(hex: string): LAB {
  return rgbToLab(hexToRgb(hex));
}

function linearToSrgb(c: number): number {
  const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, v * 255));
}

/** Inverse of rgbToLab — used to convert k-means cluster centers (computed in
 * LAB space for perceptual accuracy) back into displayable/storable RGB. */
export function labToRgb(lab: LAB): RGB {
  const fy = (lab.l + 16) / 116;
  const fx = fy + lab.a / 500;
  const fz = fy - lab.b / 200;

  const fInv = (t: number) => (t ** 3 > 0.008856 ? t ** 3 : (t - 16 / 116) / 7.787);

  const x = fInv(fx) * 0.95047;
  const y = fInv(fy) * 1.0;
  const z = fInv(fz) * 1.08883;

  const r = x * 3.2404542 + y * -1.5371385 + z * -0.4985314;
  const g = x * -0.969266 + y * 1.8760108 + z * 0.041556;
  const b = x * 0.0556434 + y * -0.2040259 + z * 1.0572252;

  return { r: linearToSrgb(r), g: linearToSrgb(g), b: linearToSrgb(b) };
}

/** CIE76 Delta E — perceptually meaningful and cheap enough for interactive UI. */
export function deltaE76(a: LAB, b: LAB): number {
  return Math.sqrt((a.l - b.l) ** 2 + (a.a - b.a) ** 2 + (a.b - b.b) ** 2);
}

export function rgbDistance(a: RGB, b: RGB): number {
  return Math.sqrt((a.r - b.r) ** 2 + (a.g - b.g) ** 2 + (a.b - b.b) ** 2);
}

export interface ThreadCandidate {
  id: string;
  hex: string;
  lab?: LAB | null;
}

export interface ThreadMatch<T extends ThreadCandidate> {
  thread: T;
  deltaE: number;
}

/** Nearest stocked thread color to an arbitrary artwork color, by Delta E76 in LAB space. */
export function findNearestThread<T extends ThreadCandidate>(
  artworkHex: string,
  candidates: T[]
): ThreadMatch<T> | null {
  if (candidates.length === 0) return null;
  const target = hexToLab(artworkHex);
  let best: ThreadMatch<T> | null = null;
  for (const candidate of candidates) {
    const lab = candidate.lab ?? hexToLab(candidate.hex);
    const deltaE = deltaE76(target, lab);
    if (!best || deltaE < best.deltaE) {
      best = { thread: candidate, deltaE };
    }
  }
  return best;
}
