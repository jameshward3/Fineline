"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/current-user";
import type { OpportunityStage } from "@/app/generated/prisma/enums";

const accountSchema = z.object({
  name: z.string().min(1),
  accountType: z.enum([
    "SCHOOL_EDUCATION",
    "CORPORATE",
    "HOSPITALITY",
    "LUXURY_RESIDENTIAL",
    "INTERIOR_DESIGNER",
    "EVENT_WEDDING",
    "RETAIL_BRAND",
    "CLUB_MEMBERSHIP",
    "NONPROFIT",
    "INDIVIDUAL",
    "FAMILY_HOUSEHOLD",
  ]),
  contactName: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  leadSource: z.string().optional(),
  referralSource: z.string().optional(),
  notes: z.string().optional(),
});

export async function createAccount(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await requireSession();
  const parsed = accountSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid account data." };
  }
  const account = await prisma.client.create({
    data: {
      organizationId: session.user.organizationId,
      name: parsed.data.name,
      accountType: parsed.data.accountType,
      contactName: parsed.data.contactName || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      leadSource: parsed.data.leadSource || null,
      referralSource: parsed.data.referralSource || null,
      notes: parsed.data.notes || null,
      relationshipOwnerId: session.user.id,
    },
  });
  revalidatePath("/crm/accounts");
  redirect(`/crm/accounts/${account.id}`);
}

const contactSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  role: z.enum(["PRIMARY", "PURCHASING", "ACCOUNTS_PAYABLE", "CREATIVE_BRAND", "EXECUTIVE_SPONSOR", "DEPARTMENT_HEAD", "OTHER"]),
  title: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  department: z.string().optional(),
  preferredContactMethod: z.string().optional(),
});

export async function createContact(_prevState: { error: string | null }, formData: FormData) {
  await requireSession();
  const parsed = contactSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid contact data." };

  await prisma.contact.create({
    data: {
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      role: parsed.data.role,
      title: parsed.data.title || null,
      email: parsed.data.email || null,
      phone: parsed.data.phone || null,
      department: parsed.data.department || null,
      preferredContactMethod: parsed.data.preferredContactMethod || null,
    },
  });
  revalidatePath(`/crm/accounts/${parsed.data.clientId}`);
  return { error: null };
}

const programSchema = z.object({
  clientId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
});

export async function createProgram(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  await requireSession();
  const parsed = programSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid program data." };

  const program = await prisma.program.create({
    data: {
      clientId: parsed.data.clientId,
      name: parsed.data.name,
      description: parsed.data.description || null,
    },
  });
  revalidatePath(`/crm/accounts/${parsed.data.clientId}`);
  redirect(`/crm/programs/${program.id}`);
}

const programProductSchema = z.object({
  programId: z.string().min(1),
  productId: z.string().min(1),
  locationId: z.string().optional(),
  designId: z.string().optional(),
  setupId: z.string().optional(),
});

export async function addProgramProduct(_prevState: { error: string | null }, formData: FormData) {
  await requireSession();
  const parsed = programProductSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid approved product data." };

  await prisma.programProduct.create({
    data: {
      programId: parsed.data.programId,
      productId: parsed.data.productId,
      locationId: parsed.data.locationId || null,
      designId: parsed.data.designId || null,
      setupId: parsed.data.setupId || null,
    },
  });
  revalidatePath(`/crm/programs/${parsed.data.programId}`);
  return { error: null };
}

const opportunitySchema = z.object({
  clientId: z.string().min(1),
  programId: z.string().optional(),
  name: z.string().min(1),
  potentialValue: z.coerce.number().optional(),
  stage: z.enum(["INQUIRY", "CONSULTATION", "SAMPLING", "QUOTE", "APPROVAL", "PROGRAM_ESTABLISHED", "ORDER"]),
  nextAction: z.string().optional(),
});

export async function createOpportunity(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await requireSession();
  const parsed = opportunitySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid opportunity data." };

  await prisma.opportunity.create({
    data: {
      organizationId: session.user.organizationId,
      clientId: parsed.data.clientId,
      programId: parsed.data.programId || null,
      name: parsed.data.name,
      potentialValue: parsed.data.potentialValue,
      stage: parsed.data.stage,
      nextAction: parsed.data.nextAction || null,
    },
  });
  revalidatePath("/crm/opportunities");
  revalidatePath(`/crm/accounts/${parsed.data.clientId}`);
  return { error: null };
}

export async function updateOpportunityStage(opportunityId: string, stage: OpportunityStage) {
  await requireSession();
  await prisma.opportunity.update({ where: { id: opportunityId }, data: { stage } });
  revalidatePath("/crm/opportunities");
}

const sampleSchema = z.object({
  clientId: z.string().min(1),
  programId: z.string().optional(),
  name: z.string().min(1),
  status: z.enum(["REQUESTED", "DELIVERED", "APPROVED", "REJECTED"]),
  notes: z.string().optional(),
});

export async function createSample(_prevState: { error: string | null }, formData: FormData) {
  await requireSession();
  const parsed = sampleSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid sample data." };

  await prisma.sample.create({
    data: {
      clientId: parsed.data.clientId,
      programId: parsed.data.programId || null,
      name: parsed.data.name,
      status: parsed.data.status,
      notes: parsed.data.notes || null,
      approvedAt: parsed.data.status === "APPROVED" ? new Date() : null,
    },
  });
  revalidatePath(`/crm/accounts/${parsed.data.clientId}`);
  return { error: null };
}

export async function updateSampleStatus(sampleId: string, status: "REQUESTED" | "DELIVERED" | "APPROVED" | "REJECTED") {
  await requireSession();
  const sample = await prisma.sample.update({
    where: { id: sampleId },
    data: { status, approvedAt: status === "APPROVED" ? new Date() : undefined },
  });
  revalidatePath(`/crm/accounts/${sample.clientId}`);
}

const monogramSchema = z.object({
  clientId: z.string().min(1),
  personName: z.string().min(1),
  monogramText: z.string().min(1),
  style: z.string().optional(),
  arrangement: z.string().optional(),
  threadColorId: z.string().optional(),
  preferredSizeInches: z.coerce.number().optional(),
  savedApplications: z.string().optional(),
});

export async function createMonogramProfile(_prevState: { error: string | null }, formData: FormData) {
  await requireSession();
  const parsed = monogramSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Invalid monogram data." };

  await prisma.monogramProfile.create({
    data: {
      clientId: parsed.data.clientId,
      personName: parsed.data.personName,
      monogramText: parsed.data.monogramText.toUpperCase(),
      style: parsed.data.style || null,
      arrangement: parsed.data.arrangement || null,
      threadColorId: parsed.data.threadColorId || null,
      preferredSizeInches: parsed.data.preferredSizeInches,
      savedApplications: parsed.data.savedApplications
        ? parsed.data.savedApplications.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
    },
  });
  revalidatePath(`/crm/accounts/${parsed.data.clientId}`);
  return { error: null };
}

export async function addAccountNote(clientId: string, body: string) {
  const session = await requireSession();
  if (!body.trim()) return;
  await prisma.note.create({
    data: { entityType: "CLIENT", entityId: clientId, authorId: session.user.id, body },
  });
  revalidatePath(`/crm/accounts/${clientId}`);
}
