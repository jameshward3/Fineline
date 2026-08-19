"use client";

import { useActionState, useState } from "react";
import { createSample } from "@/lib/actions/crm";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";

export function AddSampleForm({ clientId, programs }: { clientId: string; programs: { id: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createSample, { error: null });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-accent hover:underline">
        + Track sample
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 bg-surface-inset border border-border rounded-md p-3">
      <input type="hidden" name="clientId" value={clientId} />
      <Field label="Sample Name" required className="col-span-2">
        <Input name="name" required placeholder="Hathaway Cardigan Crest Sample" />
      </Field>
      <Field label="Program">
        <Select name="programId" defaultValue="">
          <option value="">None</option>
          {programs.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Status">
        <Select name="status" defaultValue="REQUESTED">
          <option value="REQUESTED">Requested</option>
          <option value="DELIVERED">Delivered</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </Select>
      </Field>
      <Field label="Notes" className="col-span-2">
        <Input name="notes" placeholder="Client prefers Antique Gold over Bright Gold." />
      </Field>
      {state.error && <p className="col-span-2 text-xs text-status-danger">{state.error}</p>}
      <div className="col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted">
          Cancel
        </button>
        <SubmitButton pending={pending} className="!text-xs !py-1.5 !px-3">
          Save Sample
        </SubmitButton>
      </div>
    </form>
  );
}
