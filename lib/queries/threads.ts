import { prisma } from "@/lib/prisma";

export async function getThreadColors(organizationId: string) {
  return prisma.threadColor.findMany({
    where: { organizationId },
    include: { manufacturer: true },
    orderBy: [{ active: "desc" }, { companyName: "asc" }],
  });
}

export async function getThreadManufacturers(organizationId: string) {
  return prisma.threadManufacturer.findMany({
    where: { organizationId },
    orderBy: { name: "asc" },
  });
}

export async function getCompanyPalette(organizationId: string) {
  return prisma.companyPalette.findUnique({
    where: { organizationId },
    include: {
      slots: {
        include: { threadColor: { include: { manufacturer: true } } },
        orderBy: { slotNumber: "asc" },
      },
    },
  });
}
