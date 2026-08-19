"use client";

import { useActionState, useState } from "react";
import { addProgramProduct } from "@/lib/actions/crm";
import { Field, Select, SubmitButton } from "@/components/ui/form";

interface ProductOption {
  id: string;
  name: string;
  locations: { id: string; name: string }[];
}
interface DesignOption {
  id: string;
  name: string;
}
interface SetupOption {
  id: string;
  name: string;
}

export function AddProgramProductForm({
  programId,
  products,
  designs,
  setups,
}: {
  programId: string;
  products: ProductOption[];
  designs: DesignOption[];
  setups: SetupOption[];
}) {
  const [open, setOpen] = useState(false);
  const [productId, setProductId] = useState("");
  const [state, formAction, pending] = useActionState(addProgramProduct, { error: null });
  const selectedProduct = products.find((p) => p.id === productId);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-xs font-medium text-accent hover:underline">
        + Add approved product
      </button>
    );
  }

  return (
    <form action={formAction} className="grid grid-cols-2 gap-3 bg-surface-inset border border-border rounded-md p-3">
      <input type="hidden" name="programId" value={programId} />
      <Field label="Product" required>
        <Select name="productId" required value={productId} onChange={(e) => setProductId(e.target.value)}>
          <option value="" disabled>
            Select…
          </option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Placement">
        <Select name="locationId" disabled={!selectedProduct} defaultValue="">
          <option value="">None</option>
          {selectedProduct?.locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Approved Artwork">
        <Select name="designId" defaultValue="">
          <option value="">None</option>
          {designs.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Production Setup">
        <Select name="setupId" defaultValue="">
          <option value="">None</option>
          {setups.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </Select>
      </Field>
      {state.error && <p className="col-span-2 text-xs text-status-danger">{state.error}</p>}
      <div className="col-span-2 flex justify-end gap-2">
        <button type="button" onClick={() => setOpen(false)} className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted">
          Cancel
        </button>
        <SubmitButton pending={pending} className="!text-xs !py-1.5 !px-3">
          Save
        </SubmitButton>
      </div>
    </form>
  );
}
