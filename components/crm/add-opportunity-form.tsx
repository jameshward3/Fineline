"use client";

import { useActionState, useState } from "react";
import { createOpportunity } from "@/lib/actions/crm";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";
import { OPPORTUNITY_STAGE_LABELS } from "@/lib/crm-labels";

export function AddOpportunityForm({ clients }: { clients: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createOpportunity, { error: null });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium">
        New Opportunity
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-inset border border-border rounded-md p-4 mb-4">
      <Field label="Account" required>
        <Select name="clientId" required defaultValue="">
          <option value="" disabled>
            Select…
          </option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Opportunity Name" required>
        <Input name="name" required placeholder="Faculty Apparel Program" />
      </Field>
      <Field label="Potential Value">
        <Input name="potentialValue" type="number" step="0.01" placeholder="12500" />
      </Field>
      <Field label="Stage">
        <Select name="stage" defaultValue="INQUIRY">
          {Object.entries(OPPORTUNITY_STAGE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Next Action" className="col-span-2 md:col-span-4">
        <Input name="nextAction" placeholder="Review cardigan embroidery sample" />
      </Field>
      {state.error && <p className="col-span-2 md:col-span-4 text-xs text-status-danger">{state.error}</p>}
      <div className="col-span-2 md:col-span-4 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted">
          Cancel
        </button>
        <SubmitButton pending={pending} className="!text-xs !py-1.5 !px-3">
          Create
        </SubmitButton>
      </div>
    </form>
  );
}
