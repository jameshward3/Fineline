"use client";

import { useActionState, useState } from "react";
import { createMonogramProfile } from "@/lib/actions/crm";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";

interface ThreadOption {
  id: string;
  companyName: string;
}

export function AddMonogramForm({ clientId, threadColors }: { clientId: string; threadColors: ThreadOption[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createMonogramProfile, { error: null });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-accent hover:underline">
        + Add monogram profile
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 bg-surface-inset border border-border rounded-md p-3">
      <input type="hidden" name="clientId" value={clientId} />
      <Field label="Person Name" required>
        <Input name="personName" required placeholder="James H. Ward III" />
      </Field>
      <Field label="Monogram" required>
        <Input name="monogramText" required placeholder="JHW" className="uppercase" />
      </Field>
      <Field label="Style">
        <Input name="style" placeholder="Classic Serif" />
      </Field>
      <Field label="Arrangement">
        <Input name="arrangement" placeholder="Traditional Center Initial" />
      </Field>
      <Field label="Thread Color">
        <Select name="threadColorId" defaultValue="">
          <option value="">None</option>
          {threadColors.map((t) => (
            <option key={t.id} value={t.id}>
              {t.companyName}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Preferred Size (in)">
        <Input name="preferredSizeInches" type="number" step="0.01" placeholder="1.25" />
      </Field>
      <Field label="Saved Applications (comma separated)" className="col-span-2">
        <Input name="savedApplications" placeholder="Dress Shirt Cuff, Bath Towel, Linen Napkin" />
      </Field>
      {state.error && <p className="col-span-2 text-xs text-status-danger">{state.error}</p>}
      <div className="col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted">
          Cancel
        </button>
        <SubmitButton pending={pending} className="!text-xs !py-1.5 !px-3">
          Save Monogram
        </SubmitButton>
      </div>
    </form>
  );
}
