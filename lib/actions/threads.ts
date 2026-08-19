"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";
import { hexToLab, hexToRgb, rgbString } from "@/lib/color";

const createThreadSchema = z.object({
  manufacturerId: z.string().min(1),
  manufacturerCode: z.string().min(1),
  manufacturerName: z.string().min(1),
  companyName: z.string().min(1),
  hex: z.string().regex(/^#?[0-9a-fA-F]{6}$/),
  threadType: z.string().min(1),
  threadWeight: z.enum(["W12", "W30", "W40", "W60", "OTHER"]),
  material: z.string().optional(),
  finish: z.string().optional(),
  notes: z.string().optional(),
  inventoryQuantity: z.coerce.number().int().min(0).default(0),
});

export async function createThreadColor(_prevState: unknown, formData: FormData) {
  const session = await requireSession();
  const parsed = createThreadSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid thread data." };
  }
  const hex = parsed.data.hex.startsWith("#") ? parsed.data.hex.toUpperCase() : `#${parsed.data.hex.toUpperCase()}`;
  const rgb = hexToRgb(hex);
  const lab = hexToLab(hex);

  await prisma.threadColor.create({
    data: {
      organizationId: session.user.organizationId,
      manufacturerId: parsed.data.manufacturerId,
      manufacturerCode: parsed.data.manufacturerCode,
      manufacturerName: parsed.data.manufacturerName,
      companyName: parsed.data.companyName,
      rgb: rgbString(rgb),
      hex,
      lab: { l: lab.l, a: lab.a, b: lab.b },
      threadType: parsed.data.threadType,
      threadWeight: parsed.data.threadWeight,
      material: parsed.data.material || null,
      finish: parsed.data.finish || null,
      notes: parsed.data.notes || null,
      inventoryQuantity: parsed.data.inventoryQuantity,
    },
  });

  revalidatePath("/threads");
  return { error: null };
}

export async function toggleThreadActive(threadColorId: string) {
  await requireSession();
  const thread = await prisma.threadColor.findUniqueOrThrow({ where: { id: threadColorId } });
  await prisma.threadColor.update({
    where: { id: threadColorId },
    data: { active: !thread.active },
  });
  revalidatePath("/threads");
}

export async function toggleThreadFavorite(threadColorId: string) {
  await requireSession();
  const thread = await prisma.threadColor.findUniqueOrThrow({ where: { id: threadColorId } });
  await prisma.threadColor.update({
    where: { id: threadColorId },
    data: { favorite: !thread.favorite },
  });
  revalidatePath("/threads");
}

export async function createThreadManufacturer(_prevState: unknown, formData: FormData) {
  const session = await requireSession();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return { error: "Manufacturer name is required." };
  await prisma.threadManufacturer.upsert({
    where: { organizationId_name: { organizationId: session.user.organizationId, name } },
    update: {},
    create: { organizationId: session.user.organizationId, name },
  });
  revalidatePath("/threads");
  return { error: null };
}

export async function setPaletteSlot(paletteId: string, slotNumber: number, threadColorId: string) {
  await requireSession();
  await prisma.companyPaletteSlot.upsert({
    where: { companyPaletteId_slotNumber: { companyPaletteId: paletteId, slotNumber } },
    update: { threadColorId },
    create: { companyPaletteId: paletteId, slotNumber, threadColorId },
  });
  revalidatePath("/threads");
}

export async function setMachineNeedle(machineId: string, needleNumber: number, threadColorId: string | null) {
  await requireSession();
  await prisma.machineNeedle.upsert({
    where: { machineId_needleNumber: { machineId, needleNumber } },
    update: { threadColorId },
    create: { machineId, needleNumber, threadColorId },
  });
  revalidatePath("/machines");
  revalidatePath(`/machines/${machineId}`);
  revalidatePath("/dashboard");
}
