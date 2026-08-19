import { requireSession } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { JobForm } from "@/components/jobs/job-form";

export default async function NewJobPage({
  searchParams,
}: {
  searchParams: Promise<{
    designId?: string;
    designVersionId?: string;
    clientId?: string;
    productId?: string;
    locationId?: string;
    setupId?: string;
  }>;
}) {
  const session = await requireSession();
  const { designId, designVersionId, clientId, productId, locationId, setupId } = await searchParams;

  const [designs, products, clients, machines] = await Promise.all([
    prisma.design.findMany({
      where: { organizationId: session.user.organizationId },
      include: { versions: { orderBy: { versionNumber: "desc" }, select: { id: true, versionNumber: true } } },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.product.findMany({
      where: { organizationId: session.user.organizationId },
      include: { locations: true, productionSetups: true, variants: true },
      orderBy: { name: "asc" },
    }),
    prisma.client.findMany({ where: { organizationId: session.user.organizationId }, orderBy: { name: "asc" } }),
    prisma.machine.findMany({ where: { organizationId: session.user.organizationId, active: true }, orderBy: { name: "asc" } }),
  ]);

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink">New Production Job</h1>
        <p className="text-sm text-ink-muted mt-0.5">Send a production-ready design into the job queue.</p>
      </div>
      <JobForm
        designs={designs}
        products={products.map((p) => ({
          id: p.id,
          name: p.name,
          locations: p.locations,
          productionSetups: p.productionSetups.map((s) => ({ id: s.id, name: s.name, locationId: s.locationId })),
          variants: p.variants.map((v) => ({ id: v.id, colorName: v.colorName })),
        }))}
        clients={clients}
        machines={machines}
        defaultDesignId={designId}
        defaultDesignVersionId={designVersionId}
        defaultClientId={clientId}
        defaultProductId={productId}
        defaultLocationId={locationId}
        defaultSetupId={setupId}
      />
    </div>
  );
}
