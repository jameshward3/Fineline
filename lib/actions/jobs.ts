"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";
import type { JobStatus } from "@/app/generated/prisma/enums";

const jobSchema = z.object({
  clientId: z.string().optional(),
  designId: z.string().min(1),
  designVersionId: z.string().min(1),
  productId: z.string().min(1),
  productVariantId: z.string().optional(),
  locationId: z.string().optional(),
  setupId: z.string().optional(),
  machineId: z.string().optional(),
  garmentColor: z.string().optional(),
  quantity: z.coerce.number().int().positive(),
});

async function nextJobNumber(): Promise<string> {
  const year = new Date().getFullYear();
  const count = await prisma.job.count({ where: { jobNumber: { startsWith: `${year}-` } } });
  return `${year}-${String(count + 1).padStart(4, "0")}`;
}

export async function createJob(_prevState: { error: string | null }, formData: FormData): Promise<{ error: string | null }> {
  const session = await requireSession();
  const parsed = jobSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid job data." };
  }

  const jobNumber = await nextJobNumber();

  const job = await prisma.job.create({
    data: {
      organizationId: session.user.organizationId,
      jobNumber,
      clientId: parsed.data.clientId || null,
      machineId: parsed.data.machineId || null,
      createdById: session.user.id,
      status: "ARTWORK_RECEIVED",
      items: {
        create: {
          designId: parsed.data.designId,
          designVersionId: parsed.data.designVersionId,
          productId: parsed.data.productId,
          productVariantId: parsed.data.productVariantId || null,
          locationId: parsed.data.locationId || null,
          setupId: parsed.data.setupId || null,
          garmentColor: parsed.data.garmentColor || null,
          quantity: parsed.data.quantity,
        },
      },
    },
  });

  revalidatePath("/jobs");
  revalidatePath("/dashboard");
  redirect(`/jobs/${job.id}`);
}

export async function updateJobStatus(jobId: string, status: JobStatus) {
  await requireSession();
  await prisma.job.update({ where: { id: jobId }, data: { status } });
  revalidatePath(`/jobs/${jobId}`);
  revalidatePath("/jobs");
  revalidatePath("/dashboard");
}

const jobNoteSchema = z.object({
  jobId: z.string().min(1),
  body: z.string().min(1).max(2000),
  visibleToClient: z.literal("on").optional(),
});

export async function addJobNote(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await requireSession();
  const parsed = jobNoteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Note can't be empty." };

  await prisma.note.create({
    data: {
      entityType: "JOB",
      entityId: parsed.data.jobId,
      authorId: session.user.id,
      visibleToClient: parsed.data.visibleToClient === "on",
      body: parsed.data.body,
    },
  });

  revalidatePath(`/jobs/${parsed.data.jobId}`);
  return { error: null };
}
