import { prisma } from "@/lib/prisma";

export async function getAccounts(organizationId: string) {
  return prisma.client.findMany({
    where: { organizationId },
    include: {
      _count: { select: { jobs: true, designs: true, programs: true } },
      programs: { where: { status: "ACTIVE" }, select: { id: true, name: true } },
      jobs: { orderBy: { updatedAt: "desc" }, take: 1, select: { updatedAt: true } },
      relationshipOwner: true,
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getAccount(id: string) {
  return prisma.client.findUnique({
    where: { id },
    include: {
      relationshipOwner: true,
      contacts: { orderBy: { createdAt: "asc" } },
      programs: {
        include: {
          approvedItems: { include: { product: true, location: true, design: true, setup: true } },
          threadPalette: { include: { threadColor: true } },
        },
        orderBy: { updatedAt: "desc" },
      },
      opportunities: { orderBy: { updatedAt: "desc" } },
      samples: { orderBy: { createdAt: "desc" } },
      monogramProfiles: { include: { threadColor: true }, orderBy: { createdAt: "desc" } },
      designs: {
        include: { versions: { orderBy: { versionNumber: "desc" }, take: 1 } },
        orderBy: { updatedAt: "desc" },
      },
      jobs: { orderBy: { updatedAt: "desc" }, include: { items: { include: { product: true } } } },
    },
  });
}

export async function getAccountNotes(clientId: string) {
  return prisma.note.findMany({
    where: { entityType: "CLIENT", entityId: clientId },
    include: { author: true },
    orderBy: { createdAt: "desc" },
  });
}

export async function getPrograms(organizationId: string) {
  return prisma.program.findMany({
    where: { client: { organizationId } },
    include: {
      client: true,
      approvedItems: { include: { product: true } },
      _count: { select: { approvedItems: true } },
    },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProgram(id: string) {
  return prisma.program.findUnique({
    where: { id },
    include: {
      client: true,
      approvedItems: { include: { product: true, location: true, design: true, setup: true } },
      threadPalette: { include: { threadColor: { include: { manufacturer: true } } } },
      opportunities: true,
      samples: true,
    },
  });
}

export async function getOpportunities(organizationId: string) {
  return prisma.opportunity.findMany({
    where: { organizationId },
    include: { client: true, program: true },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getCrmDashboardData(organizationId: string) {
  const [accountCount, activeProgramCount, openOpportunities, upcomingFollowUps, recentSamples] = await Promise.all([
    prisma.client.count({ where: { organizationId } }),
    prisma.program.count({ where: { client: { organizationId }, status: "ACTIVE" } }),
    prisma.opportunity.findMany({
      where: { organizationId, stage: { not: "ORDER" } },
      include: { client: true },
      orderBy: { nextActionDate: "asc" },
      take: 8,
    }),
    prisma.opportunity.findMany({
      where: {
        organizationId,
        stage: { not: "ORDER" },
        nextActionDate: { lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      },
      include: { client: true },
      orderBy: { nextActionDate: "asc" },
      take: 5,
    }),
    prisma.sample.findMany({
      where: { client: { organizationId }, status: "DELIVERED" },
      include: { client: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  const topAccounts = await prisma.client.findMany({
    where: { organizationId },
    include: { _count: { select: { jobs: true } } },
    orderBy: { jobs: { _count: "desc" } },
    take: 5,
  });

  return { accountCount, activeProgramCount, openOpportunities, upcomingFollowUps, recentSamples, topAccounts };
}
