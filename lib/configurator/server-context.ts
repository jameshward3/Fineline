import { prisma } from "@/lib/prisma";

export async function getPublicStudioContext() {
  const preferredOrganizationId = process.env.STITCHOS_PUBLIC_ORGANIZATION_ID;
  const preferredOwnerEmail = process.env.STITCHOS_PUBLIC_OWNER_EMAIL?.trim().toLowerCase();

  const organization = preferredOrganizationId
    ? await prisma.organization.findUnique({ where: { id: preferredOrganizationId }, select: { id: true } })
    : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });

  if (!organization) throw new Error("No public StitchOS organization is configured");

  const owner = preferredOwnerEmail
    ? await prisma.user.findFirst({
        where: { organizationId: organization.id, email: preferredOwnerEmail, active: true },
        select: { id: true },
      })
    : await prisma.user.findFirst({
        where: { organizationId: organization.id, active: true },
        orderBy: [{ role: "asc" }, { createdAt: "asc" }],
        select: { id: true },
      });

  if (!owner) throw new Error("No active StitchOS intake owner is configured");
  return { organizationId: organization.id, ownerId: owner.id };
}
