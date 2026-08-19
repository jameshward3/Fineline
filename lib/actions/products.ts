"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";

const productSchema = z.object({
  name: z.string().min(1),
  brand: z.string().optional(),
  manufacturer: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().min(1),
  material: z.string().optional(),
  fabricWeight: z.string().optional(),
  stretch: z.string().optional(),
  availableColors: z.string().optional(),
  supplier: z.string().optional(),
  supplierUrl: z.string().optional(),
  cost: z.coerce.number().optional(),
  notes: z.string().optional(),
});

export async function createProduct(
  _prevState: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await requireSession();
  const parsed = productSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid product data." };
  }
  const product = await prisma.product.create({
    data: {
      organizationId: session.user.organizationId,
      name: parsed.data.name,
      brand: parsed.data.brand || null,
      manufacturer: parsed.data.manufacturer || null,
      sku: parsed.data.sku || null,
      category: parsed.data.category,
      material: parsed.data.material || null,
      fabricWeight: parsed.data.fabricWeight || null,
      stretch: parsed.data.stretch || null,
      availableColors: parsed.data.availableColors
        ? parsed.data.availableColors.split(",").map((c) => c.trim()).filter(Boolean)
        : [],
      supplier: parsed.data.supplier || null,
      supplierUrl: parsed.data.supplierUrl || null,
      cost: parsed.data.cost,
      notes: parsed.data.notes || null,
    },
  });
  revalidatePath("/products");
  redirect(`/products/${product.id}`);
}

const locationSchema = z.object({
  productId: z.string().min(1),
  name: z.string().min(1),
  maxWidthInches: z.coerce.number().positive(),
  maxHeightInches: z.coerce.number().positive(),
  standardWidthMinInches: z.coerce.number().optional(),
  standardWidthMaxInches: z.coerce.number().optional(),
  recommendedHoop: z.string().optional(),
  recommendedStabilizer: z.string().optional(),
  orientation: z.string().optional(),
  placementNotes: z.string().optional(),
});

export async function createEmbroideryLocation(_prevState: unknown, formData: FormData) {
  await requireSession();
  const parsed = locationSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid location data." };
  }
  await prisma.embroideryLocation.create({
    data: {
      productId: parsed.data.productId,
      name: parsed.data.name,
      maxWidthInches: parsed.data.maxWidthInches,
      maxHeightInches: parsed.data.maxHeightInches,
      standardWidthMinInches: parsed.data.standardWidthMinInches,
      standardWidthMaxInches: parsed.data.standardWidthMaxInches,
      recommendedHoop: parsed.data.recommendedHoop || null,
      recommendedStabilizer: parsed.data.recommendedStabilizer || null,
      orientation: parsed.data.orientation || null,
      placementNotes: parsed.data.placementNotes || null,
    },
  });
  revalidatePath(`/products/${parsed.data.productId}`);
  return { error: null };
}

const setupSchema = z.object({
  name: z.string().min(1),
  productId: z.string().optional(),
  locationId: z.string().optional(),
  hoop: z.string().optional(),
  stabilizer: z.string().optional(),
  topping: z.string().optional(),
  needleSize: z.string().optional(),
  threadWeight: z.string().optional(),
  bobbin: z.string().optional(),
  speedSpm: z.coerce.number().optional(),
  densityNotes: z.string().optional(),
  notes: z.string().optional(),
});

export async function createProductionSetup(
  _prevState: unknown,
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await requireSession();
  const parsed = setupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid setup data." };
  }
  const setup = await prisma.productionSetup.create({
    data: {
      organizationId: session.user.organizationId,
      name: parsed.data.name,
      productId: parsed.data.productId || null,
      locationId: parsed.data.locationId || null,
      hoop: parsed.data.hoop || null,
      stabilizer: parsed.data.stabilizer || null,
      topping: parsed.data.topping || null,
      needleSize: parsed.data.needleSize || null,
      threadWeight: parsed.data.threadWeight || null,
      bobbin: parsed.data.bobbin || null,
      speedSpm: parsed.data.speedSpm,
      densityNotes: parsed.data.densityNotes || null,
      notes: parsed.data.notes || null,
    },
  });
  revalidatePath("/setups");
  redirect(`/setups/${setup.id}`);
}

export async function toggleSetupFavorite(setupId: string) {
  await requireSession();
  const setup = await prisma.productionSetup.findUniqueOrThrow({ where: { id: setupId } });
  await prisma.productionSetup.update({
    where: { id: setupId },
    data: { isFavorite: !setup.isFavorite },
  });
  revalidatePath("/setups");
  revalidatePath("/dashboard");
}

const productionRunSchema = z.object({
  designVersionId: z.string().min(1),
  setupId: z.string().optional(),
  jobId: z.string().optional(),
  result: z.enum(["EXCELLENT", "ACCEPTABLE", "NEEDS_REVISION", "FAILED"]),
  issues: z.string().optional(),
  notes: z.string().optional(),
});

export async function recordProductionRun(_prevState: unknown, formData: FormData) {
  const session = await requireSession();
  const parsed = productionRunSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid production run data." };
  }
  await prisma.productionRun.create({
    data: {
      designVersionId: parsed.data.designVersionId,
      setupId: parsed.data.setupId || null,
      jobId: parsed.data.jobId || null,
      result: parsed.data.result,
      issues: parsed.data.issues ? parsed.data.issues.split(",").map((s) => s.trim()).filter(Boolean) : [],
      notes: parsed.data.notes || null,
      recordedById: session.user.id,
    },
  });
  revalidatePath("/setups");
  if (parsed.data.setupId) revalidatePath(`/setups/${parsed.data.setupId}`);
  return { error: null };
}
