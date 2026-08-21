import { categoryBasePrice } from "./catalog";

export const CONFIGURATOR_PRICING_VERSION = "2026.08.1";

export type ThreadWeightChoice = "W30" | "W40" | "W60";
export type BorderStyle = "NONE" | "SATIN" | "MERROW";

export interface PricingInput {
  widthInches: number;
  heightInches: number;
  quantity: number;
  colorCount: number;
  densityMm: number;
  threadWeight: ThreadWeightChoice;
  borderStyle: BorderStyle;
  borderWidthMm: number;
  productCategory: string;
}

export interface ConfiguratorQuote {
  version: string;
  currency: "USD";
  quantity: number;
  estimatedStitches: number;
  setupFee: number;
  unitProduct: number;
  unitDecoration: number;
  unitPrice: number;
  volumeDiscountRate: number;
  volumeSavings: number;
  subtotal: number;
  total: number;
}

const roundMoney = (value: number) => Math.round(value * 100) / 100;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

function volumeDiscount(quantity: number): number {
  if (quantity >= 250) return 0.22;
  if (quantity >= 100) return 0.18;
  if (quantity >= 48) return 0.14;
  if (quantity >= 24) return 0.1;
  if (quantity >= 12) return 0.06;
  return 0;
}

/**
 * Transparent, deterministic estimate shared by the browser and intake API.
 * The server always recalculates it; client-supplied totals are never trusted.
 */
export function calculateConfiguratorQuote(input: PricingInput): ConfiguratorQuote {
  const width = clamp(input.widthInches, 0.25, 15);
  const height = clamp(input.heightInches, 0.25, 15);
  const quantity = Math.round(clamp(input.quantity, 1, 5000));
  const colors = Math.round(clamp(input.colorCount, 1, 12));
  const density = clamp(input.densityMm, 0.3, 0.65);
  const areaSqIn = width * height;
  const perimeterIn = 2 * (width + height);

  const densityFactor = 0.45 / density;
  const weightFactor = input.threadWeight === "W60" ? 1.12 : input.threadWeight === "W30" ? 0.9 : 1;
  const colorFactor = 0.78 + colors * 0.055;
  const borderStitches = input.borderStyle === "NONE"
    ? 0
    : perimeterIn * (input.borderStyle === "MERROW" ? 235 : 175) * clamp(input.borderWidthMm / 2, 0.5, 3);
  const estimatedStitches = Math.round(
    clamp(areaSqIn * 1050 * densityFactor * weightFactor * colorFactor + borderStitches, 700, 250_000),
  );

  const borderUnit = input.borderStyle === "MERROW" ? 3.25 : input.borderStyle === "SATIN" ? 1.85 : 0;
  const setupFee = roundMoney(32 + colors * 2.4 + (input.borderStyle === "NONE" ? 0 : 8));
  const unitProduct = roundMoney(categoryBasePrice(input.productCategory));
  const rawDecoration = 5.75 + (estimatedStitches / 1000) * 0.68 + Math.max(0, colors - 1) * 0.38 + borderUnit;
  const discount = volumeDiscount(quantity);
  const unitDecoration = roundMoney(rawDecoration * (1 - discount));
  const unitPrice = roundMoney(unitProduct + unitDecoration);
  const undiscounted = setupFee + quantity * (unitProduct + rawDecoration);
  const subtotal = roundMoney(setupFee + quantity * unitPrice);

  return {
    version: CONFIGURATOR_PRICING_VERSION,
    currency: "USD",
    quantity,
    estimatedStitches,
    setupFee,
    unitProduct,
    unitDecoration,
    unitPrice,
    volumeDiscountRate: discount,
    volumeSavings: roundMoney(Math.max(0, undiscounted - subtotal)),
    subtotal,
    total: subtotal,
  };
}
