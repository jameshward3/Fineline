import { prisma } from "@/lib/prisma";

export async function getMachines(organizationId: string) {
  return prisma.machine.findMany({
    where: { organizationId },
    include: { needles: { include: { threadColor: true }, orderBy: { needleNumber: "asc" } } },
    orderBy: { name: "asc" },
  });
}

export async function getMachine(id: string) {
  return prisma.machine.findUnique({
    where: { id },
    include: { needles: { include: { threadColor: true }, orderBy: { needleNumber: "asc" } } },
  });
}
