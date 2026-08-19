"use client";

import { useActionState, useState } from "react";
import { createProductionSetup } from "@/lib/actions/products";
import { Panel } from "@/components/ui/panel";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";

interface ProductOption {
  id: string;
  name: string;
  locations: { id: string; name: string }[];
}

export function SetupForm({
  products,
  defaultProductId,
}: {
  products: ProductOption[];
  defaultProductId?: string;
}) {
  const [state, formAction, pending] = useActionState(createProductionSetup, { error: null });
  const [productId, setProductId] = useState(defaultProductId ?? "");
  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <form action={formAction}>
      <Panel className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Setup Name" required className="sm:col-span-2">
            <Input name="name" required placeholder="Heavy Hoodie — Left Chest" />
          </Field>
          <Field label="Product">
            <Select name="productId" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Embroidery Location">
            <Select name="locationId" disabled={!selectedProduct} defaultValue="">
              <option value="">None</option>
              {selectedProduct?.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Hoop">
            <Input name="hoop" placeholder='5" x 7"' />
          </Field>
          <Field label="Stabilizer">
            <Input name="stabilizer" placeholder="Medium cutaway" />
          </Field>
          <Field label="Topping">
            <Input name="topping" placeholder="None" />
          </Field>
          <Field label="Needle Size">
            <Input name="needleSize" placeholder="75/11" />
          </Field>
          <Field label="Thread Weight">
            <Input name="threadWeight" placeholder="40 wt polyester" />
          </Field>
          <Field label="Bobbin">
            <Input name="bobbin" placeholder="Standard polyester" />
          </Field>
          <Field label="Speed (SPM)">
            <Input name="speedSpm" type="number" placeholder="700" />
          </Field>
          <Field label="Density Notes">
            <Input name="densityNotes" placeholder="Stored as reference" />
          </Field>
        </div>
        <Field label="Notes">
          <Input name="notes" placeholder="Hoop garment with backing." />
        </Field>

        {state.error && <p className="text-xs text-status-danger">{state.error}</p>}

        <div className="flex justify-end">
          <SubmitButton pending={pending}>Save Setup</SubmitButton>
        </div>
      </Panel>
    </form>
  );
}
