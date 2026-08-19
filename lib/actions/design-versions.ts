"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";

/**
 * Revision control: never overwrites a production design. Duplicates the
 * given version into a new, independently-editable version (V2, V3, …),
 * carrying forward its color mappings and vector objects, and re-pointing
 * to the same stored artwork files rather than copying bytes — the
 * original source asset is never touched or destroyed.
 */
export async function duplicateAsNewVersion(designVersionId: string, changeNotes?: string) {
  const session = await requireSession();

  const source = await prisma.designVersion.findUniqueOrThrow({
    where: { id: designVersionId },
    include: { assets: true, colorMappings: true, vectorObjects: true, design: true },
  });

  const nextVersionNumber =
    (await prisma.designVersion.aggregate({
      where: { designId: source.designId },
      _max: { versionNumber: true },
    }))._max.versionNumber! + 1;

  const newVersion = await prisma.designVersion.create({
    data: {
      designId: source.designId,
      versionNumber: nextVersionNumber,
      status: "DRAFT",
      changeNotes: changeNotes || `Duplicated from V${source.versionNumber}`,
      createdById: session.user.id,
      widthInches: source.widthInches,
      heightInches: source.heightInches,
      displayUnit: source.displayUnit,
      aspectLocked: source.aspectLocked,
      detectedColorCount: source.detectedColorCount,
      targetColorCount: source.targetColorCount,
      readinessScore: source.readinessScore,
      readinessBreakdown: source.readinessBreakdown ?? undefined,
      readinessClassification: source.readinessClassification,
    },
  });

  await Promise.all([
    ...source.assets.map((a) =>
      prisma.artworkAsset.create({
        data: {
          designVersionId: newVersion.id,
          stage: a.stage,
          storageKey: a.storageKey,
          url: a.url,
          fileName: a.fileName,
          fileFormat: a.fileFormat,
          fileSizeBytes: a.fileSizeBytes,
          widthPx: a.widthPx,
          heightPx: a.heightPx,
        },
      })
    ),
    ...source.colorMappings.map((c) =>
      prisma.designColorMapping.create({
        data: {
          designVersionId: newVersion.id,
          sequence: c.sequence,
          artworkColorHex: c.artworkColorHex,
          mergedColorHexes: c.mergedColorHexes,
          threadColorId: c.threadColorId,
          needleNumber: c.needleNumber,
          colorDeltaE: c.colorDeltaE,
        },
      })
    ),
    ...source.vectorObjects.map((v) =>
      prisma.vectorObject.create({
        data: {
          designVersionId: newVersion.id,
          name: v.name,
          svgPath: v.svgPath,
          threadColorId: v.threadColorId,
          stitchType: v.stitchType,
          stitchTypeAuto: v.stitchTypeAuto,
          stitchDirectionDegrees: v.stitchDirectionDegrees,
          sequenceOrder: v.sequenceOrder,
          areaSqMm: v.areaSqMm,
          minDetailMm: v.minDetailMm,
          visible: v.visible,
          locked: v.locked,
        },
      })
    ),
  ]);

  const sourceAsset = newVersion.id
    ? await prisma.artworkAsset.findFirst({ where: { designVersionId: newVersion.id, stage: "SOURCE" } })
    : null;
  if (sourceAsset) {
    await prisma.designVersion.update({ where: { id: newVersion.id }, data: { sourceAssetId: sourceAsset.id } });
  }

  revalidatePath(`/designs/${source.designId}`);
  redirect(`/designs/${source.designId}`);
}
