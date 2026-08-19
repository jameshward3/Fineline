export interface ProductionJsonInput {
  designName: string;
  designId: string;
  revision: number;
  widthInches: number;
  heightInches: number;
  readinessScore: number | null;
  readinessClassification: string | null;
  colors: {
    sequence: number;
    companyThread: string | null;
    manufacturer: string | null;
    threadCode: string | null;
    needle: number | null;
    artworkColorHex: string;
  }[];
  vectorObjects: {
    name: string;
    sequenceOrder: number;
    stitchType: string;
    stitchDirectionDegrees: number | null;
    threadColor: string | null;
  }[];
  product: { name: string; location: string | null; setup: string | null } | null;
}

/** Machine-readable production metadata — the JSON export named throughout
 * the spec, structured so InStitch or another downstream tool can consume
 * it without re-deriving anything the app already resolved. */
export function buildProductionJson(input: ProductionJsonInput) {
  return {
    design: input.designName,
    designId: input.designId,
    revision: input.revision,
    widthInches: input.widthInches,
    heightInches: input.heightInches,
    readinessScore: input.readinessScore,
    readinessClassification: input.readinessClassification,
    colors: input.colors,
    sewingSequence: input.vectorObjects,
    product: input.product,
    generatedAt: new Date().toISOString(),
  };
}
