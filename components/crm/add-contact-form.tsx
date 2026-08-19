"use client";

import { useActionState, useState } from "react";
import { createContact } from "@/lib/actions/crm";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";
import { CONTACT_ROLE_LABELS } from "@/lib/crm-labels";

export function AddContactForm({ clientId }: { clientId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createContact, { error: null });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-accent hover:underline">
        + Add contact
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 bg-surface-inset border border-border rounded-md p-3">
      <input type="hidden" name="clientId" value={clientId} />
      <Field label="Name" required>
        <Input name="name" required placeholder="Emily Richardson" />
      </Field>
      <Field label="Role">
        <Select name="role" defaultValue="OTHER">
          {Object.entries(CONTACT_ROLE_LABELS).map(([v, l]) => (
            <option key={v} value={v}>
              {l}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Title">
        <Input name="title" placeholder="Uniform Coordinator" />
      </Field>
      <Field label="Email">
        <Input name="email" type="email" />
      </Field>
      <Field label="Phone">
        <Input name="phone" />
      </Field>
      <Field label="Preferred Contact Method">
        <Input name="preferredContactMethod" placeholder="Email" />
      </Field>
      {state.error && <p className="col-span-2 text-xs text-status-danger">{state.error}</p>}
      <div className="col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted">
          Cancel
        </button>
        <SubmitButton pending={pending} className="!text-xs !py-1.5 !px-3">
          Save Contact
        </SubmitButton>
      </div>
    </form>
  );
}
