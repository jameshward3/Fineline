"use client";

import { useActionState, useState } from "react";
import { createEmbroideryLocation } from "@/lib/actions/products";
import { Field, Input, SubmitButton } from "@/components/ui/form";

export function AddLocationForm({ productId }: { productId: string }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createEmbroideryLocation, { error: null });

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-accent hover:underline">
        + Add embroidery location
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-inset border border-border rounded-md p-4">
      <input type="hidden" name="productId" value={productId} />
      <Field label="Location Name" required className="col-span-2">
        <Input name="name" required placeholder="Left Chest" />
      </Field>
      <Field label="Max Width (in)" required>
        <Input name="maxWidthInches" type="number" step="0.01" required placeholder="4.0" />
      </Field>
      <Field label="Max Height (in)" required>
        <Input name="maxHeightInches" type="number" step="0.01" required placeholder="4.0" />
      </Field>
      <Field label="Standard Width Min (in)">
        <Input name="standardWidthMinInches" type="number" step="0.01" placeholder="3.25" />
      </Field>
      <Field label="Standard Width Max (in)">
        <Input name="standardWidthMaxInches" type="number" step="0.01" placeholder="3.75" />
      </Field>
      <Field label="Recommended Hoop">
        <Input name="recommendedHoop" placeholder='4" x 4"' />
      </Field>
      <Field label="Recommended Stabilizer">
        <Input name="recommendedStabilizer" placeholder="Medium cutaway" />
      </Field>
      <Field label="Orientation">
        <Input name="orientation" placeholder="Upright" />
      </Field>
      <Field label="Placement Notes" className="col-span-2 md:col-span-4">
        <Input name="placementNotes" placeholder='7.5"–9" below shoulder seam' />
      </Field>

      {state.error && <p className="col-span-2 md:col-span-4 text-xs text-status-danger">{state.error}</p>}

      <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted hover:text-ink"
        >
          Cancel
        </button>
        <SubmitButton pending={pending} className="!text-xs !py-1.5 !px-3">
          Save Location
        </SubmitButton>
      </div>
    </form>
  );
}
