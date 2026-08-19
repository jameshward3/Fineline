"use client";

import { useTransition } from "react";
import Link from "next/link";
import { updateOpportunityStage } from "@/lib/actions/crm";
import { OPPORTUNITY_STAGE_ORDER, OPPORTUNITY_STAGE_LABELS } from "@/lib/crm-labels";
import type { OpportunityStage } from "@/app/generated/prisma/enums";

export function OpportunityCard({
  opportunity,
}: {
  opportunity: { id: string; name: string; stage: OpportunityStage; potentialValue: number | null; nextAction: string | null; clientId: string; client: { name: string } };
}) {
  const [pending, startTransition] = useTransition();
  const currentIndex = OPPORTUNITY_STAGE_ORDER.indexOf(opportunity.stage);

  return (
    <div className="rounded-md border border-border bg-surface-inset p-2.5 space-y-1.5">
      <Link href={`/crm/accounts/${opportunity.clientId}`} className="block">
        <p className="text-xs font-medium text-ink truncate">{opportunity.name}</p>
        <p className="text-[11px] text-ink-muted truncate">{opportunity.client.name}</p>
      </Link>
      {opportunity.potentialValue != null && (
        <p className="text-[11px] text-accent font-mono">${opportunity.potentialValue.toLocaleString()}</p>
      )}
      {opportunity.nextAction && <p className="text-[11px] text-ink-faint">{opportunity.nextAction}</p>}
      <div className="flex gap-1 pt-1">
        <button
          disabled={pending || currentIndex === 0}
          onClick={() =>
            startTransition(() => updateOpportunityStage(opportunity.id, OPPORTUNITY_STAGE_ORDER[currentIndex - 1]))
          }
          className="text-[10px] px-1.5 py-0.5 rounded border border-border text-ink-faint hover:text-ink disabled:opacity-30"
        >
          ← Back
        </button>
        <button
          disabled={pending || currentIndex === OPPORTUNITY_STAGE_ORDER.length - 1}
          onClick={() =>
            startTransition(() => updateOpportunityStage(opportunity.id, OPPORTUNITY_STAGE_ORDER[currentIndex + 1]))
          }
          className="text-[10px] px-1.5 py-0.5 rounded border border-border text-ink-faint hover:text-ink disabled:opacity-30"
        >
          Advance →
        </button>
      </div>
    </div>
  );
}

export { OPPORTUNITY_STAGE_ORDER, OPPORTUNITY_STAGE_LABELS };
