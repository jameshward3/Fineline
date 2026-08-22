import { prisma } from "@/lib/prisma";
import { normalizePhone } from "@/lib/phone";

/**
 * Deliberately narrow — never reuse the staff-side job queries here. This
 * feeds the client-facing portal, so it must never expose internal-only
 * fields (cost/estimatedValue, machine assignment, staff-internal notes).
 */
export async function findClientIdByPhone(rawPhone: string): Promise<string | null> {
  const target = normalizePhone(rawPhone);
  if (target.length < 7) return null;

  const candidates = await prisma.client.findMany({
    where: { active: true },
    select: { id: true, phone: true, contacts: { select: { phone: true } } },
  });

  const match = candidates.find(
    (c) =>
      (c.phone && normalizePhone(c.phone) === target) ||
      c.contacts.some((contact) => contact.phone && normalizePhone(contact.phone) === target)
  );
  return match?.id ?? null;
}

export async function getPortalClient(clientId: string) {
  return prisma.client.findUnique({
    where: { id: clientId },
    select: {
      id: true,
      name: true,
      jobs: {
        where: { status: { not: "ARCHIVED" } },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jobNumber: true,
          status: true,
          createdAt: true,
          items: {
            select: {
              quantity: true,
              product: { select: { name: true } },
              design: { select: { name: true } },
            },
          },
        },
      },
      programs: {
        select: { id: true, name: true, status: true },
        orderBy: { name: "asc" },
      },
    },
  });
}

export async function getPortalJobNotes(jobId: string, clientId: string) {
  const job = await prisma.job.findFirst({ where: { id: jobId, clientId }, select: { id: true } });
  if (!job) return null;
  return prisma.note.findMany({
    where: { entityType: "JOB", entityId: jobId, visibleToClient: true },
    orderBy: { createdAt: "asc" },
    include: { author: { select: { name: true } }, authorClient: { select: { name: true } } },
  });
}
