"use client";

import { useActionState, useState } from "react";
import { createThreadColor } from "@/lib/actions/threads";

interface Manufacturer {
  id: string;
  name: string;
}

export function AddThreadForm({ manufacturers }: { manufacturers: Manufacturer[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(createThreadColor, { error: null });

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="text-xs font-medium text-accent hover:underline"
      >
        + Add thread to library
      </button>
    );
  }

  return (
    <form
      action={formAction}
      className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-surface-inset border border-border rounded-md p-4"
    >
      <Field label="Company Name">
        <input name="companyName" required className="input" placeholder="Bright White" />
      </Field>
      <Field label="Manufacturer">
        <select name="manufacturerId" required className="input">
          <option value="">Select…</option>
          {manufacturers.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </Field>
      <Field label="Manufacturer Color Name">
        <input name="manufacturerName" required className="input" placeholder="White" />
      </Field>
      <Field label="Manufacturer Code">
        <input name="manufacturerCode" required className="input" placeholder="1001" />
      </Field>
      <Field label="Hex Approximation">
        <input name="hex" required className="input font-mono" placeholder="#F5F3EA" />
      </Field>
      <Field label="Thread Type">
        <input name="threadType" defaultValue="Polyester" required className="input" />
      </Field>
      <Field label="Weight">
        <select name="threadWeight" defaultValue="W40" className="input">
          <option value="W12">12 wt</option>
          <option value="W30">30 wt</option>
          <option value="W40">40 wt</option>
          <option value="W60">60 wt</option>
          <option value="OTHER">Other</option>
        </select>
      </Field>
      <Field label="Inventory Qty">
        <input name="inventoryQuantity" type="number" min={0} defaultValue={0} className="input" />
      </Field>
      <Field label="Material">
        <input name="material" className="input" placeholder="Polyester" />
      </Field>
      <Field label="Finish">
        <input name="finish" className="input" placeholder="Rayon-look sheen" />
      </Field>
      <div className="col-span-2 md:col-span-4">
        <Field label="Notes">
          <input name="notes" className="input" placeholder="Optional" />
        </Field>
      </div>

      {state.error && (
        <p className="col-span-2 md:col-span-4 text-xs text-status-danger">{state.error}</p>
      )}

      <div className="col-span-2 md:col-span-4 flex gap-2 justify-end">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-xs px-3 py-1.5 rounded-md border border-border text-ink-muted hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="text-xs px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-medium disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save Thread"}
        </button>
      </div>

      <style jsx>{`
        .input {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: 6px;
          padding: 6px 8px;
          font-size: 12px;
          color: var(--ink);
          width: 100%;
        }
        .input:focus {
          outline: none;
          border-color: var(--accent);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] text-ink-muted mb-1">{label}</span>
      {children}
    </label>
  );
}
