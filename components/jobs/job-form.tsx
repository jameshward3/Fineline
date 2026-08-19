"use client";

import { useActionState, useState } from "react";
import { createJob } from "@/lib/actions/jobs";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Field, Input, Select, SubmitButton } from "@/components/ui/form";

interface DesignOption {
  id: string;
  name: string;
  versions: { id: string; versionNumber: number }[];
}
interface ProductOption {
  id: string;
  name: string;
  locations: { id: string; name: string }[];
  productionSetups: { id: string; name: string; locationId: string | null }[];
  variants: { id: string; colorName: string }[];
}
interface SimpleOption {
  id: string;
  name: string;
}

export function JobForm({
  designs,
  products,
  clients,
  machines,
  defaultDesignId,
  defaultDesignVersionId,
  defaultClientId,
  defaultProductId,
  defaultLocationId,
  defaultSetupId,
}: {
  designs: DesignOption[];
  products: ProductOption[];
  clients: SimpleOption[];
  machines: SimpleOption[];
  defaultDesignId?: string;
  defaultDesignVersionId?: string;
  defaultClientId?: string;
  defaultProductId?: string;
  defaultLocationId?: string;
  defaultSetupId?: string;
}) {
  const [state, formAction, pending] = useActionState(createJob, { error: null });
  const [designId, setDesignId] = useState(defaultDesignId ?? "");
  const [productId, setProductId] = useState(defaultProductId ?? "");

  const selectedDesign = designs.find((d) => d.id === designId);
  const selectedProduct = products.find((p) => p.id === productId);

  return (
    <form action={formAction}>
      <Panel className="space-y-4">
        <PanelHeader title="New Production Job" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Client">
            <Select name="clientId" defaultValue={defaultClientId ?? ""}>
              <option value="">No client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Design" required>
            <Select name="designId" required value={designId} onChange={(e) => setDesignId(e.target.value)}>
              <option value="" disabled>
                Select design…
              </option>
              {designs.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Design Version" required>
            <Select name="designVersionId" required defaultValue={defaultDesignVersionId ?? ""} disabled={!selectedDesign}>
              <option value="" disabled>
                Select version…
              </option>
              {selectedDesign?.versions.map((v) => (
                <option key={v.id} value={v.id}>
                  V{v.versionNumber}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Quantity" required>
            <Input name="quantity" type="number" min={1} defaultValue={1} required />
          </Field>

          <Field label="Product" required>
            <Select name="productId" required value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="" disabled>
                Select product…
              </option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Garment Color / Variant">
            <Select name="productVariantId" disabled={!selectedProduct} defaultValue="">
              <option value="">None</option>
              {selectedProduct?.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.colorName}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Garment Color (free text)">
            <Input name="garmentColor" placeholder="Navy" />
          </Field>
          <Field label="Embroidery Location">
            <Select name="locationId" disabled={!selectedProduct} defaultValue={defaultLocationId ?? ""}>
              <option value="">None</option>
              {selectedProduct?.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Production Setup">
            <Select name="setupId" disabled={!selectedProduct} defaultValue={defaultSetupId ?? ""}>
              <option value="">None</option>
              {selectedProduct?.productionSetups.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Machine">
            <Select name="machineId" defaultValue="">
              <option value="">Unassigned</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {state.error && <p className="text-xs text-status-danger">{state.error}</p>}

        <div className="flex justify-end">
          <SubmitButton pending={pending}>Create Job</SubmitButton>
        </div>
      </Panel>
    </form>
  );
}
