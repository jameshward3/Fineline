import { prisma } from "@/lib/prisma";

export async function getJobs(organizationId: string) {
  return prisma.job.findMany({
    where: { organizationId },
    include: {
      client: true,
      machine: true,
      items: { include: { product: true, design: true, location: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getJob(id: string) {
  return prisma.job.findUnique({
    where: { id },
    include: {
      client: true,
      machine: { include: { needles: { include: { threadColor: true }, orderBy: { needleNumber: "asc" } } } },
      createdBy: true,
      items: {
        include: {
          product: true,
          productVariant: true,
          design: true,
          designVersion: {
            include: {
              colorMappings: { include: { threadColor: { include: { manufacturer: true } } }, orderBy: { sequence: "asc" } },
            },
          },
          location: true,
          setup: true,
        },
      },
      exports: { orderBy: { createdAt: "desc" } },
      productionRuns: { orderBy: { recordedAt: "desc" }, include: { recordedBy: true } },
    },
  });
}
