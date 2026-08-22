import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";
import { getStorageService } from "@/lib/services/storage";
import { getStitchEngineService } from "@/lib/services/stitch-engine";
import {
  loadExportData,
  generateDesignSvg,
  generateProductionJson,
  generateProductionSheetPdf,
  generateMasterPackageZip,
} from "@/lib/services/export";
import type { ExportType } from "@/app/generated/prisma/enums";

const EXPORT_TYPE_BY_FORMAT: Record<string, ExportType> = {
  svg: "SVG",
  json: "JSON",
  pdf: "PDF_PRODUCTION_SHEET",
  zip: "MASTER_PACKAGE_ZIP",
  dst: "STITCH_FILE_DST",
};

const CONTENT_TYPE_BY_FORMAT: Record<string, string> = {
  svg: "image/svg+xml",
  json: "application/json",
  pdf: "application/pdf",
  zip: "application/zip",
  dst: "application/x-dst",
};

/** Generic hoop capacity used for the oversized-design warning — verify against the selected machine's actual hoop before production. */
const DEFAULT_HOOP_MM = 200;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; format: string }> }
) {
  const session = await requireSession();
  const { id, format } = await params;

  const exportType = EXPORT_TYPE_BY_FORMAT[format];
  if (!exportType) {
    return NextResponse.json({ error: "Unknown export format" }, { status: 400 });
  }

  const latestVersion = await prisma.designVersion.findFirst({
    where: { designId: id },
    orderBy: { versionNumber: "desc" },
    select: { id: true, design: { select: { name: true } } },
  });
  if (!latestVersion) {
    return NextResponse.json({ error: "Design not found" }, { status: 404 });
  }

  const data = await loadExportData(latestVersion.id);
  if (!data) {
    return NextResponse.json({ error: "Design version not found" }, { status: 404 });
  }

  const fileBase = slug(data.version.design.name);
  let fileBuffer: Buffer;
  let fileName: string;

  switch (format) {
    case "svg":
      fileBuffer = Buffer.from(generateDesignSvg(data), "utf-8");
      fileName = `${fileBase}.svg`;
      break;
    case "json":
      fileBuffer = Buffer.from(JSON.stringify(generateProductionJson(data), null, 2), "utf-8");
      fileName = `${fileBase}-production.json`;
      break;
    case "pdf":
      fileBuffer = await generateProductionSheetPdf(data);
      fileName = `${fileBase}-production-sheet.pdf`;
      break;
    case "zip":
      fileBuffer = await generateMasterPackageZip(data);
      fileName = `${fileBase}-institch-package.zip`;
      break;
    case "dst":
      try {
        const result = await getStitchEngineService().generate({
          designVersionId: latestVersion.id,
          format: "DST",
          hoopWidthMm: DEFAULT_HOOP_MM,
          hoopHeightMm: DEFAULT_HOOP_MM,
        });
        fileBuffer = result.fileBuffer;
        fileName = `${fileBase}.dst`;
      } catch (err) {
        return NextResponse.json(
          { error: err instanceof Error ? err.message : "Stitch file generation failed" },
          { status: 422 }
        );
      }
      break;
    default:
      return NextResponse.json({ error: "Unknown export format" }, { status: 400 });
  }

  const storage = getStorageService();
  const storageKey = `designs/${id}/exports/${Date.now()}-${fileName}`;
  const stored = await storage.put(storageKey, fileBuffer, CONTENT_TYPE_BY_FORMAT[format]);

  await prisma.export.create({
    data: {
      designVersionId: latestVersion.id,
      type: exportType,
      storageKey: stored.storageKey,
      url: stored.url,
      createdById: session.user.id,
    },
  });

  return new NextResponse(new Uint8Array(fileBuffer), {
    headers: {
      "Content-Type": CONTENT_TYPE_BY_FORMAT[format],
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "design";
}
