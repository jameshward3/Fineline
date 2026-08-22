"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { findClientIdByPhone } from "@/lib/queries/portal";
import { createPortalSession, getPortalSession, clearPortalSession } from "@/lib/portal-session";

const loginSchema = z.object({ phone: z.string().min(7) });

export async function portalLogin(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Enter the phone number on file with your account." };

  const clientId = await findClientIdByPhone(parsed.data.phone);
  if (!clientId) {
    return { error: "We couldn't find an account with that phone number. Contact your account team for help." };
  }

  await createPortalSession(clientId);
  redirect("/portal");
}

export async function portalLogout(): Promise<void> {
  await clearPortalSession();
  redirect("/portal");
}

const noteSchema = z.object({ jobId: z.string().min(1), body: z.string().min(1).max(2000) });

export async function addPortalNote(
  _prevState: { error: string | null },
  formData: FormData
): Promise<{ error: string | null }> {
  const session = await getPortalSession();
  if (!session) return { error: "Your session expired — sign in again." };

  const parsed = noteSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Message can't be empty." };

  const job = await prisma.job.findFirst({ where: { id: parsed.data.jobId, clientId: session.clientId } });
  if (!job) return { error: "That order isn't on your account." };

  await prisma.note.create({
    data: {
      entityType: "JOB",
      entityId: job.id,
      authorClientId: session.clientId,
      visibleToClient: true,
      body: parsed.data.body,
    },
  });

  revalidatePath("/portal");
  return { error: null };
}
