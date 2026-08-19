import { prisma } from "@/lib/prisma";

export async function getDashboardData(organizationId: string) {
  const [
    recentDesignVersions,
    recentJobs,
    awaitingDigitization,
    readyForProduction,
    recentProducts,
    favoriteSetups,
    primaryMachine,
    stats,
  ] = await Promise.all([
    prisma.designVersion.findMany({
      where: { design: { organizationId } },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { design: true },
    }),
    prisma.job.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { client: true, items: { include: { product: true } } },
    }),
    prisma.designVersion.findMany({
      where: {
        design: { organizationId },
        status: { in: ["COLOR_REVIEW", "PRODUCTION_PREP"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { design: true },
    }),
    prisma.designVersion.findMany({
      where: { design: { organizationId }, status: "READY_FOR_INSTITCH" },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { design: true },
    }),
    prisma.product.findMany({
      where: { organizationId },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.productionSetup.findMany({
      where: { organizationId, isFavorite: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { product: true, location: true },
    }),
    prisma.machine.findFirst({
      where: { organizationId, active: true },
      include: { needles: { include: { threadColor: true }, orderBy: { needleNumber: "asc" } } },
    }),
    Promise.all([
      prisma.job.count({ where: { organizationId, status: { notIn: ["COMPLETE", "ARCHIVED"] } } }),
      prisma.design.count({ where: { organizationId } }),
      prisma.threadColor.count({ where: { organizationId, active: true } }),
      prisma.machine.count({ where: { organizationId, active: true } }),
    ]),
  ]);

  const [activeJobs, totalDesigns, activeThreadColors, activeMachines] = stats;

  return {
    recentDesignVersions,
    recentJobs,
    awaitingDigitization,
    readyForProduction,
    recentProducts,
    favoriteSetups,
    primaryMachine,
    stats: { activeJobs, totalDesigns, activeThreadColors, activeMachines },
  };
}
