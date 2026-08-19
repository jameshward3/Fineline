import { prisma } from "@/lib/prisma";

export async function loadExportData(designVersionId: string) {
  const version = await prisma.designVersion.findUnique({
    where: { id: designVersionId },
    include: {
      design: true,
      assets: true,
      colorMappings: { include: { threadColor: { include: { manufacturer: true } } }, orderBy: { sequence: "asc" } },
      vectorObjects: { include: { threadColor: true }, orderBy: { sequenceOrder: "asc" } },
      productAssociations: { include: { product: true, location: true, setup: true } },
    },
  });
  if (!version) return null;

  const sourceAsset = version.assets.find((a) => a.stage === "SOURCE") ?? null;
  const productionAsset = version.assets.find((a) => a.stage === "PRODUCTION") ?? null;
  const association = version.productAssociations[0] ?? null;

  return { version, sourceAsset, productionAsset, association };
}

export type ExportData = NonNullable<Awaited<ReturnType<typeof loadExportData>>>;
