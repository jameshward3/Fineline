"use client";

import { useActionState } from "react";
import { createProduct } from "@/lib/actions/products";
import { Panel } from "@/components/ui/panel";
import { Field, Input, SubmitButton } from "@/components/ui/form";

const CATEGORIES = [
  "Polo Shirt",
  "T-Shirt",
  "Hoodie",
  "Baseball Cap",
  "Trucker Hat",
  "Beanie",
  "Jacket",
  "Tote Bag",
  "Patch",
  "Apron",
  "Work Shirt",
  "Custom Item",
];

export function ProductForm() {
  const [state, formAction, pending] = useActionState(createProduct, { error: null });

  return (
    <form action={formAction}>
      <Panel className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product Name" required>
            <Input name="name" required placeholder="Nike Dri-FIT Polo" />
          </Field>
          <Field label="Category" required>
            <select
              name="category"
              required
              className="w-full rounded-md bg-surface-inset border border-border px-2.5 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-accent/50"
              defaultValue=""
            >
              <option value="" disabled>
                Select category…
              </option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Brand">
            <Input name="brand" placeholder="Nike" />
          </Field>
          <Field label="Manufacturer">
            <Input name="manufacturer" placeholder="Nike Team Sports" />
          </Field>
          <Field label="SKU / Model">
            <Input name="sku" placeholder="NKE-838956" />
          </Field>
          <Field label="Cost">
            <Input name="cost" type="number" step="0.01" placeholder="34.50" />
          </Field>
          <Field label="Material">
            <Input name="material" placeholder="100% Polyester Dri-FIT" />
          </Field>
          <Field label="Fabric Weight">
            <Input name="fabricWeight" placeholder="4.1 oz" />
          </Field>
          <Field label="Stretch Characteristics">
            <Input name="stretch" placeholder="Low stretch, woven-feel knit" />
          </Field>
          <Field label="Available Colors (comma separated)">
            <Input name="availableColors" placeholder="Navy, Black, White" />
          </Field>
          <Field label="Supplier">
            <Input name="supplier" placeholder="BSN Sports" />
          </Field>
          <Field label="Supplier URL">
            <Input name="supplierUrl" placeholder="https://…" />
          </Field>
        </div>
        <Field label="Notes">
          <Input name="notes" placeholder="Optional" />
        </Field>

        {state.error && <p className="text-xs text-status-danger">{state.error}</p>}

        <div className="flex justify-end">
          <SubmitButton pending={pending}>Create Product</SubmitButton>
        </div>
      </Panel>
    </form>
  );
}
