import { requireSession } from "@/lib/current-user";
import { getOpportunities } from "@/lib/queries/crm";
import { prisma } from "@/lib/prisma";
import { OpportunityCard } from "@/components/crm/opportunity-card";
import { AddOpportunityForm } from "@/components/crm/add-opportunity-form";
import { OPPORTUNITY_STAGE_ORDER, OPPORTUNITY_STAGE_LABELS } from "@/lib/crm-labels";

export default async function OpportunitiesPage() {
  const session = await requireSession();
  const [opportunities, clients] = await Promise.all([
    getOpportunities(session.user.organizationId),
    prisma.client.findMany({
      where: { organizationId: session.user.organizationId },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-6 max-w-[1600px]">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-ink">Opportunity Pipeline</h1>
          <p className="text-sm text-ink-muted mt-0.5">Future work, tracked before it becomes an order.</p>
        </div>
        <AddOpportunityForm clients={clients} />
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2">
        {OPPORTUNITY_STAGE_ORDER.map((stage) => {
          const items = opportunities.filter((o) => o.stage === stage);
          return (
            <div key={stage} className="w-[240px] flex-none">
              <p className="text-xs font-medium text-ink-muted mb-2 flex items-center gap-1.5">
                {OPPORTUNITY_STAGE_LABELS[stage]}
                <span className="text-ink-faint">({items.length})</span>
              </p>
              <div className="space-y-2">
                {items.map((o) => (
                  <OpportunityCard key={o.id} opportunity={o} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
