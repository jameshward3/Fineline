import { requireSession } from "@/lib/current-user";
import { getWizardReferenceData } from "@/lib/queries/designs";
import { DesignWizard } from "@/components/wizard/design-wizard";

export default async function NewDesignPage() {
  const session = await requireSession();
  const { threadColors, products, machines, clients } = await getWizardReferenceData(session.user.organizationId);

  return (
    <DesignWizard
      threadColors={threadColors.map((t) => ({
        id: t.id,
        hex: t.hex,
        companyName: t.companyName,
        manufacturerName: t.manufacturerName,
        manufacturerCode: t.manufacturerCode,
        lab: t.lab as { l: number; a: number; b: number } | null,
      }))}
      products={products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        locations: p.locations.map((l) => ({
          id: l.id,
          name: l.name,
          maxWidthInches: l.maxWidthInches,
          maxHeightInches: l.maxHeightInches,
        })),
        productionSetups: p.productionSetups.map((s) => {
          const runCount = s.productionRuns.length;
          const successCount = s.productionRuns.filter((r) => r.result === "EXCELLENT" || r.result === "ACCEPTABLE").length;
          return {
            id: s.id,
            name: s.name,
            locationId: s.locationId,
            runCount,
            successRate: runCount > 0 ? successCount / runCount : null,
          };
        }),
      }))}
      machines={machines.map((m) => ({
        id: m.id,
        name: m.name,
        needles: m.needles.map((n) => ({
          needleNumber: n.needleNumber,
          threadColorId: n.threadColorId,
          hex: n.threadColor?.hex ?? null,
          companyName: n.threadColor?.companyName ?? null,
        })),
      }))}
      clients={clients.map((c) => ({ id: c.id, name: c.name }))}
    />
  );
}
