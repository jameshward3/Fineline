"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";
import { getStorageService } from "@/lib/services/storage";

const colorMappingSchema = z.object({
  sequence: z.number(),
  artworkColorHex: z.string(),
  threadColorId: z.string().nullable(),
  needleNumber: z.number().nullable(),
  colorDeltaE: z.number().nullable(),
});

const vectorObjectSchema = z.object({
  name: z.string(),
  svgPath: z.string(),
  threadColorId: z.string().nullable(),
  stitchType: z.enum(["RUNNING_STITCH", "SATIN_STITCH", "TATAMI_FILL", "APPLIQUE", "MANUAL_REVIEW"]),
  stitchTypeAuto: z.enum(["RUNNING_STITCH", "SATIN_STITCH", "TATAMI_FILL", "APPLIQUE", "MANUAL_REVIEW"]).nullable(),
  stitchDirectionDegrees: z.number().nullable(),
  sequenceOrder: z.number(),
  areaSqMm: z.number().nullable(),
  minDetailMm: z.number().nullable(),
});

const payloadSchema = z.object({
  name: z.string().min(1),
  clientId: z.string().nullable(),
  widthInches: z.number().positive(),
  heightInches: z.number().positive(),
  displayUnit: z.enum(["in", "mm"]),
  detectedColorCount: z.number().int(),
  targetColorCount: z.number().int(),
  readinessScore: z.number().int(),
  readinessBreakdown: z.record(z.string(), z.number()),
  readinessClassification: z.string(),
  colorMappings: z.array(colorMappingSchema),
  vectorObjects: z.array(vectorObjectSchema),
  sourceWidthPx: z.number().int().positive(),
  sourceHeightPx: z.number().int().positive(),
  workingWidthPx: z.number().int().positive(),
  workingHeightPx: z.number().int().positive(),
  productId: z.string().nullable(),
  locationId: z.string().nullable(),
  setupId: z.string().nullable(),
});

export interface SaveDesignState {
  error: string | null;
  designId?: string;
}

export async function createDesignFromWizard(
  _prevState: SaveDesignState,
  formData: FormData
): Promise<SaveDesignState> {
  const session = await requireSession();

  const rawPayload = formData.get("payload");
  if (typeof rawPayload !== "string") return { error: "Missing design payload." };

  let payload: z.infer<typeof payloadSchema>;
  try {
    payload = payloadSchema.parse(JSON.parse(rawPayload));
  } catch {
    return { error: "Invalid design payload." };
  }

  const originalFile = formData.get("originalFile");
  const referenceFile = formData.get("referenceFile");
  if (!(originalFile instanceof File) || !(referenceFile instanceof File)) {
    return { error: "Missing artwork files." };
  }

  const storage = getStorageService();

  const design = await prisma.design.create({
    data: {
      organizationId: session.user.organizationId,
      clientId: payload.clientId,
      name: payload.name,
    },
  });

  const designVersion = await prisma.designVersion.create({
    data: {
      designId: design.id,
      versionNumber: 1,
      status: "COLOR_REVIEW",
      createdById: session.user.id,
      widthInches: payload.widthInches,
      heightInches: payload.heightInches,
      displayUnit: payload.displayUnit,
      detectedColorCount: payload.detectedColorCount,
      targetColorCount: payload.targetColorCount,
      readinessScore: payload.readinessScore,
      readinessBreakdown: payload.readinessBreakdown,
      readinessClassification: payload.readinessClassification,
    },
  });

  const originalBuffer = Buffer.from(await originalFile.arrayBuffer());
  const originalKey = `designs/${design.id}/v1/source-${originalFile.name}`;
  const originalStored = await storage.put(originalKey, originalBuffer, originalFile.type);

  const referenceBuffer = Buffer.from(await referenceFile.arrayBuffer());
  const referenceKey = `designs/${design.id}/v1/reference.png`;
  const referenceStored = await storage.put(referenceKey, referenceBuffer, "image/png");

  const [sourceAsset] = await Promise.all([
    prisma.artworkAsset.create({
      data: {
        designVersionId: designVersion.id,
        stage: "SOURCE",
        storageKey: originalStored.storageKey,
        url: originalStored.url,
        fileName: originalFile.name,
        fileFormat: originalFile.type,
        fileSizeBytes: originalStored.fileSizeBytes,
        widthPx: payload.sourceWidthPx,
        heightPx: payload.sourceHeightPx,
      },
    }),
    prisma.artworkAsset.create({
      data: {
        designVersionId: designVersion.id,
        stage: "PRODUCTION",
        storageKey: referenceStored.storageKey,
        url: referenceStored.url,
        fileName: "reference.png",
        fileFormat: "image/png",
        fileSizeBytes: referenceStored.fileSizeBytes,
        // Production reference is rendered at working-buffer resolution —
        // the same coordinate space the vector paths were traced in, so
        // exports can size an accurate SVG viewBox from it.
        widthPx: payload.workingWidthPx,
        heightPx: payload.workingHeightPx,
      },
    }),
  ]);

  await prisma.designVersion.update({
    where: { id: designVersion.id },
    data: { sourceAssetId: sourceAsset.id },
  });

  if (payload.colorMappings.length > 0) {
    await prisma.designColorMapping.createMany({
      data: payload.colorMappings.map((c) => ({
        designVersionId: designVersion.id,
        sequence: c.sequence,
        artworkColorHex: c.artworkColorHex,
        threadColorId: c.threadColorId,
        needleNumber: c.needleNumber,
        colorDeltaE: c.colorDeltaE,
      })),
    });
  }

  if (payload.vectorObjects.length > 0) {
    await prisma.vectorObject.createMany({
      data: payload.vectorObjects.map((v) => ({
        designVersionId: designVersion.id,
        name: v.name,
        svgPath: v.svgPath,
        threadColorId: v.threadColorId,
        stitchType: v.stitchType,
        stitchTypeAuto: v.stitchTypeAuto,
        stitchDirectionDegrees: v.stitchDirectionDegrees,
        sequenceOrder: v.sequenceOrder,
        areaSqMm: v.areaSqMm,
        minDetailMm: v.minDetailMm,
      })),
    });
  }

  if (payload.productId) {
    await prisma.designProductSetup.create({
      data: {
        designId: design.id,
        designVersionId: designVersion.id,
        productId: payload.productId,
        locationId: payload.locationId,
        setupId: payload.setupId,
      },
    });
  }

  revalidatePath("/designs");
  revalidatePath("/dashboard");
  redirect(`/designs/${design.id}`);
}
