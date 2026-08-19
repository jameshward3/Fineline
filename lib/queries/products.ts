import { prisma } from "@/lib/prisma";

export async function getProducts(organizationId: string) {
  return prisma.product.findMany({
    where: { organizationId },
    include: { locations: true, _count: { select: { locations: true, productionSetups: true } } },
    orderBy: { updatedAt: "desc" },
  });
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      locations: true,
      variants: true,
      productionSetups: { include: { location: true } },
    },
  });
}

export async function getProductionSetups(organizationId: string) {
  return prisma.productionSetup.findMany({
    where: { organizationId },
    include: { product: true, location: true, _count: { select: { productionRuns: true } } },
    orderBy: [{ isFavorite: "desc" }, { updatedAt: "desc" }],
  });
}

export async function getProductionSetup(id: string) {
  return prisma.productionSetup.findUnique({
    where: { id },
    include: {
      product: true,
      location: true,
      productionRuns: { orderBy: { recordedAt: "desc" }, take: 20, include: { recordedBy: true } },
    },
  });
}

/**
 * "Use Previous Successful Setup" — surfaces the best-performing production
 * setup for a given product, based on recorded production run outcomes.
 */
export async function getRecommendedSetupsForProduct(productId: string) {
  const setups = await prisma.productionSetup.findMany({
    where: { productId },
    include: {
      location: true,
      productionRuns: true,
    },
  });

  return setups
    .map((setup) => {
      const runs = setup.productionRuns;
      const score =
        runs.reduce((acc, r) => {
          if (r.result === "EXCELLENT") return acc + 2;
          if (r.result === "ACCEPTABLE") return acc + 1;
          if (r.result === "NEEDS_REVISION") return acc - 1;
          return acc - 2;
        }, 0) / Math.max(runs.length, 1);
      return { setup, runCount: runs.length, successScore: score };
    })
    .sort((a, b) => b.successScore - a.successScore || b.runCount - a.runCount);
}
