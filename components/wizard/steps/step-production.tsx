"use client";

import { useMemo } from "react";
import { CheckCircle2, RefreshCw } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Select, Field } from "@/components/ui/form";
import { optimizeNeedleAssignment } from "@/lib/services/needle-optimizer";
import type { WizardState } from "../types";
import type { ProductOption, MachineOption, ClientOption } from "../reference-types";

export function StepProduction({
  state,
  patch,
  products,
  machines,
  clients,
}: {
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
  products: ProductOption[];
  machines: MachineOption[];
  clients: ClientOption[];
}) {
  const selectedProduct = products.find((p) => p.id === state.productId);
  const relevantSetups = selectedProduct?.productionSetups.filter(
    (s) => !state.locationId || s.locationId === state.locationId
  );

  const activeRows = useMemo(
    () => state.colorMappings.filter((m) => m.mergedInto === null && m.threadColorId).sort((a, b) => a.sequence - b.sequence),
    [state.colorMappings]
  );

  const selectedMachine = machines.find((m) => m.id === state.machineId);

  const optimization = useMemo(() => {
    if (!selectedMachine) return null;
    return optimizeNeedleAssignment(
      activeRows.map((r) => ({
        sequence: r.sequence,
        threadColorId: r.threadColorId!,
        hex: r.artworkColorHex,
        companyName: r.threadLabel ?? r.artworkColorHex,
      })),
      selectedMachine.needles.map((n) => ({
        needleNumber: n.needleNumber,
        threadColorId: n.threadColorId,
        hex: n.hex,
        companyName: n.companyName,
      }))
    );
  }, [selectedMachine, activeRows]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Associate Product &amp; Machine</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Link this design to a product, embroidery location, and production setup.
        </p>
      </div>

      <Panel>
        <PanelHeader title="Client" />
        <Select value={state.clientId ?? ""} onChange={(e) => patch({ clientId: e.target.value || null })}>
          <option value="">No client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
      </Panel>

      <Panel>
        <PanelHeader title="Product &amp; Location" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Product">
            <Select
              value={state.productId ?? ""}
              onChange={(e) => patch({ productId: e.target.value || null, locationId: null, setupId: null })}
            >
              <option value="">None</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Embroidery Location">
            <Select
              value={state.locationId ?? ""}
              disabled={!selectedProduct}
              onChange={(e) => patch({ locationId: e.target.value || null })}
            >
              <option value="">None</option>
              {selectedProduct?.locations.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.name} (max {l.maxWidthInches}&quot; × {l.maxHeightInches}&quot;)
                </option>
              ))}
            </Select>
          </Field>
        </div>

        {relevantSetups && relevantSetups.length > 0 && (
          <div className="mt-4 rounded-md border border-status-success/30 bg-status-success/5 p-3">
            <p className="text-xs text-ink flex items-center gap-1.5 mb-2">
              <CheckCircle2 size={13} className="text-status-success" />
              {relevantSetups.length} saved setup{relevantSetups.length === 1 ? "" : "s"} exist for this product.
              Use a previous successful setup:
            </p>
            <div className="flex flex-wrap gap-2">
              {[...relevantSetups]
                .sort((a, b) => (b.successRate ?? -1) - (a.successRate ?? -1) || b.runCount - a.runCount)
                .map((s) => (
                  <button
                    key={s.id}
                    onClick={() => patch({ setupId: s.id })}
                    className={`text-xs px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                      state.setupId === s.id
                        ? "bg-accent text-accent-foreground border-accent"
                        : "border-border text-ink-muted hover:text-ink"
                    }`}
                  >
                    {s.name}
                    {s.runCount > 0 && (
                      <span className="opacity-70">
                        · {s.runCount} run{s.runCount === 1 ? "" : "s"}
                        {s.successRate != null && ` · ${Math.round(s.successRate * 100)}%`}
                      </span>
                    )}
                  </button>
                ))}
            </div>
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Machine — 15-Needle Optimizer" subtitle="Minimize spool changes for this run" />
        <Field label="Machine" className="mb-4 max-w-xs">
          <Select value={state.machineId ?? ""} onChange={(e) => patch({ machineId: e.target.value || null })}>
            <option value="">Select machine…</option>
            {machines.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>

        {optimization && (
          <div>
            <p className="text-sm text-ink mb-3">
              <span className="font-semibold text-accent">
                {optimization.loadedCount} of {optimization.totalRequired}
              </span>{" "}
              colors already loaded.{" "}
              {optimization.changeCount > 0 && (
                <span className="text-status-warning">{optimization.changeCount} needle change(s) required.</span>
              )}
            </p>
            <div className="space-y-1.5">
              {optimization.assignments.map((a) => (
                <div key={a.sequence} className="flex items-center justify-between text-xs rounded-md border border-border bg-surface-inset px-2.5 py-1.5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded border border-black/20" style={{ background: a.requiredHex }} />
                    <span className="text-ink">{a.requiredName}</span>
                  </div>
                  {a.needsChange ? (
                    <span className="flex items-center gap-1 text-status-warning">
                      <RefreshCw size={11} />
                      Needle {a.suggestedNeedle ?? "—"}: {a.suggestedNeedleCurrentColorName ?? "empty"} → {a.requiredName}
                    </span>
                  ) : (
                    <span className="text-status-success">Needle {a.alreadyLoadedNeedle} — loaded</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
