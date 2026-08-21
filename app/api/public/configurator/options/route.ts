import { NextResponse } from "next/server";
import { FALLBACK_CATALOG } from "@/lib/configurator/catalog";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    const preferredOrganizationId = process.env.STITCHOS_PUBLIC_ORGANIZATION_ID;
    const organization = preferredOrganizationId
      ? await prisma.organization.findUnique({ where: { id: preferredOrganizationId }, select: { id: true } })
      : await prisma.organization.findFirst({ orderBy: { createdAt: "asc" }, select: { id: true } });
    if (!organization) throw new Error("No public organization");

    const [threads, products] = await Promise.all([
      prisma.threadColor.findMany({
        where: { organizationId: organization.id, active: true },
        include: { manufacturer: { select: { name: true } } },
        orderBy: [{ favorite: "desc" }, { companyName: "asc" }],
        take: 60,
      }),
      prisma.product.findMany({
        where: { organizationId: organization.id },
        include: { locations: { orderBy: { name: "asc" } } },
        orderBy: { name: "asc" },
        take: 40,
      }),
    ]);

    const response = NextResponse.json({
      source: "database",
      threads: threads.map((thread) => ({
        id: thread.id,
        name: thread.companyName,
        manufacturer: thread.manufacturer.name,
        manufacturerCode: thread.manufacturerCode,
        hex: thread.hex,
        weight: thread.threadWeight,
      })),
      products: products
        .filter((product) => product.locations.length > 0)
        .map((product) => ({
          id: product.id,
          name: product.name,
          category: product.category,
          material: product.material,
          availableColors: product.availableColors,
          placements: product.locations.map((location) => ({
            id: location.id,
            name: location.name,
            maxWidthInches: location.maxWidthInches,
            maxHeightInches: location.maxHeightInches,
            placementNotes: location.placementNotes,
          })),
        })),
    });
    response.headers.set("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return response;
  } catch (error) {
    console.warn("Using fallback public configurator catalog", error);
    const response = NextResponse.json(FALLBACK_CATALOG);
    response.headers.set("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    return response;
  }
}
