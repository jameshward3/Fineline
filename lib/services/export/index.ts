import JSZip from "jszip";
import { renderToBuffer } from "@react-pdf/renderer";
import { getStorageService } from "@/lib/services/storage";
import { buildDesignSvg, type ExportVectorObject } from "./svg";
import { buildProductionJson } from "./json";
import { ProductionSheetDocument, type PdfColorRow } from "./pdf";
import type { ExportData } from "./loader";

export { loadExportData } from "./loader";

function vectorObjectsForExport(data: ExportData): ExportVectorObject[] {
  return data.version.vectorObjects.map((v) => ({
    name: v.name,
    svgPath: v.svgPath,
    sequenceOrder: v.sequenceOrder,
    hex: v.threadColor?.hex ?? "#999999",
    companyName: v.threadColor?.companyName ?? "Unmapped",
    manufacturerCode: v.threadColor?.manufacturerCode ?? "",
    stitchType: v.stitchType,
  }));
}

export function generateDesignSvg(data: ExportData): string {
  const width = data.productionAsset?.widthPx ?? data.sourceAsset?.widthPx ?? 1000;
  const height = data.productionAsset?.heightPx ?? data.sourceAsset?.heightPx ?? 1000;
  return buildDesignSvg(vectorObjectsForExport(data), width, height);
}

export function generateProductionJson(data: ExportData) {
  return buildProductionJson({
    designName: data.version.design.name,
    designId: data.version.design.id,
    revision: data.version.versionNumber,
    widthInches: data.version.widthInches ?? 0,
    heightInches: data.version.heightInches ?? 0,
    readinessScore: data.version.readinessScore,
    readinessClassification: data.version.readinessClassification,
    colors: data.version.colorMappings.map((c) => ({
      sequence: c.sequence,
      companyThread: c.threadColor?.companyName ?? null,
      manufacturer: c.threadColor?.manufacturer.name ?? null,
      threadCode: c.threadColor?.manufacturerCode ?? null,
      needle: c.needleNumber,
      artworkColorHex: c.artworkColorHex,
    })),
    vectorObjects: data.version.vectorObjects.map((v) => ({
      name: v.name,
      sequenceOrder: v.sequenceOrder,
      stitchType: v.stitchType,
      stitchDirectionDegrees: v.stitchDirectionDegrees,
      threadColor: v.threadColor?.companyName ?? null,
    })),
    product: data.association
      ? {
          name: data.association.product.name,
          location: data.association.location?.name ?? null,
          setup: data.association.setup?.name ?? null,
        }
      : null,
  });
}

async function assetDataUri(storageKey: string, mime: string): Promise<string | null> {
  try {
    const storage = getStorageService();
    const bytes = await storage.get(storageKey);
    return `data:${mime};base64,${bytes.toString("base64")}`;
  } catch {
    return null;
  }
}

export async function generateProductionSheetPdf(data: ExportData): Promise<Buffer> {
  const thumbnailDataUri = data.productionAsset
    ? await assetDataUri(data.productionAsset.storageKey, "image/png")
    : null;

  const colors: PdfColorRow[] = data.version.colorMappings.map((c) => ({
    sequence: c.sequence,
    hex: c.threadColor?.hex ?? c.artworkColorHex,
    companyName: c.threadColor?.companyName ?? "Unmapped",
    manufacturer: c.threadColor?.manufacturer.name ?? null,
    threadCode: c.threadColor?.manufacturerCode ?? null,
    needleNumber: c.needleNumber,
  }));

  const doc = ProductionSheetDocument({
    designName: data.version.design.name,
    designId: data.version.design.id,
    revision: data.version.versionNumber,
    widthInches: data.version.widthInches ?? 0,
    heightInches: data.version.heightInches ?? 0,
    colors,
    product: data.association?.product.name ?? null,
    location: data.association?.location?.name ?? null,
    hoop: data.association?.setup?.hoop ?? null,
    stabilizer: data.association?.setup?.stabilizer ?? null,
    setupNotes: data.association?.setup?.notes ?? null,
    productionNotes: data.version.changeNotes,
    thumbnailDataUri,
  });

  const buffer = await renderToBuffer(doc);
  return Buffer.from(buffer);
}

export async function generateMasterPackageZip(data: ExportData): Promise<Buffer> {
  const zip = new JSZip();
  const storage = getStorageService();

  zip.file("design.svg", generateDesignSvg(data));
  zip.file("production.json", JSON.stringify(generateProductionJson(data), null, 2));

  const pdfBuffer = await generateProductionSheetPdf(data);
  zip.file("production-sheet.pdf", pdfBuffer);

  if (data.productionAsset) {
    try {
      zip.file("reference.png", await storage.get(data.productionAsset.storageKey));
    } catch {
      // asset missing from storage — skip rather than fail the whole export
    }
  }
  if (data.sourceAsset) {
    try {
      zip.file(`original-${data.sourceAsset.fileName}`, await storage.get(data.sourceAsset.storageKey));
    } catch {
      // asset missing from storage — skip rather than fail the whole export
    }
  }

  const setupInfoLines = [
    `Design: ${data.version.design.name}`,
    `Revision: V${data.version.versionNumber}`,
    `Size: ${data.version.widthInches?.toFixed(2)}" x ${data.version.heightInches?.toFixed(2)}"`,
    data.association ? `Product: ${data.association.product.name}` : null,
    data.association?.location ? `Placement: ${data.association.location.name}` : null,
    data.association?.setup ? `Setup: ${data.association.setup.name}` : null,
    data.association?.setup?.hoop ? `Hoop: ${data.association.setup.hoop}` : null,
    data.association?.setup?.stabilizer ? `Stabilizer: ${data.association.setup.stabilizer}` : null,
    data.association?.setup?.notes ? `Notes: ${data.association.setup.notes}` : null,
  ].filter(Boolean);
  zip.file("setup-info.txt", setupInfoLines.join("\n"));

  const buffer = await zip.generateAsync({ type: "nodebuffer" });
  return buffer;
}
