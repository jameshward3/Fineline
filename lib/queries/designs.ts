import { prisma } from "@/lib/prisma";

export async function getDesigns(organizationId: string) {
  return prisma.design.findMany({
    where: { organizationId },
    include: {
      client: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 1, include: { assets: true } },
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getDesign(id: string) {
  return prisma.design.findUnique({
    where: { id },
    include: {
      client: true,
      tags: { include: { tag: true } },
      versions: {
        orderBy: { versionNumber: "desc" },
        include: {
          assets: true,
          colorMappings: { include: { threadColor: { include: { manufacturer: true } } }, orderBy: { sequence: "asc" } },
          vectorObjects: { include: { threadColor: true }, orderBy: { sequenceOrder: "asc" } },
          productAssociations: { include: { product: true, location: true, setup: true } },
          createdBy: true,
        },
      },
    },
  });
}

export async function getWizardReferenceData(organizationId: string) {
  const [threadColors, products, machines, clients] = await Promise.all([
    prisma.threadColor.findMany({
      where: { organizationId, active: true },
      include: { manufacturer: true },
      orderBy: { companyName: "asc" },
    }),
    prisma.product.findMany({
      where: { organizationId },
      include: {
        locations: true,
        productionSetups: { include: { location: true, productionRuns: { select: { result: true } } } },
      },
      orderBy: { name: "asc" },
    }),
    prisma.machine.findMany({
      where: { organizationId, active: true },
      include: { needles: { include: { threadColor: true }, orderBy: { needleNumber: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({ where: { organizationId }, orderBy: { name: "asc" } }),
  ]);
  return { threadColors, products, machines, clients };
}
