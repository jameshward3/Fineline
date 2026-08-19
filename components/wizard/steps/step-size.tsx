"use client";

import { useMemo, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { alphaMask, labelComponents } from "@/lib/services/image-processing/connected-components";
import { pxPerInch, findDetailWarnings, formatDetailWarning, estimateStitchAreaSqInches } from "@/lib/services/image-processing/size";
import { inchesToMm, mmToInches } from "@/lib/utils";
import type { WizardState } from "../types";

export function StepSize({ state, patch }: { state: WizardState; patch: (u: Partial<WizardState>) => void }) {
  const [unit, setUnit] = useState<"in" | "mm">(state.displayUnit);
  const buffer = state.workingBuffer;

  const analysis = useMemo(() => {
    if (!buffer) return null;
    const mask = alphaMask(buffer);
    const { components } = labelComponents(mask, buffer.width, buffer.height);
    const opaque = components.reduce((a, c) => a + c.pixelCount, 0);
    return { components, opaquePixelCount: opaque };
  }, [buffer]);

  const warnings = useMemo(() => {
    if (!buffer || !analysis) return [];
    return findDetailWarnings(analysis.components, buffer.width, state.widthInches);
  }, [buffer, analysis, state.widthInches]);

  const ppi = buffer ? pxPerInch(buffer.width, state.widthInches) : 0;
  const stitchArea =
    buffer && analysis ? estimateStitchAreaSqInches(analysis.opaquePixelCount, buffer.width, state.widthInches) : 0;

  const aspect = state.naturalWidth && state.naturalHeight ? state.naturalWidth / state.naturalHeight : 1;

  function setWidth(value: number) {
    if (state.aspectLocked) {
      patch({ widthInches: value, heightInches: +(value / aspect).toFixed(3) });
    } else {
      patch({ widthInches: value });
    }
  }
  function setHeight(value: number) {
    if (state.aspectLocked) {
      patch({ heightInches: value, widthInches: +(value * aspect).toFixed(3) });
    } else {
      patch({ heightInches: value });
    }
  }

  const displayWidth = unit === "in" ? state.widthInches : inchesToMm(state.widthInches);
  const displayHeight = unit === "in" ? state.heightInches : inchesToMm(state.heightInches);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Physical Embroidery Size</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Set the actual finished dimensions — every downstream calculation depends on this.
        </p>
      </div>

      <Panel>
        <PanelHeader
          title="Dimensions"
          action={
            <div className="flex text-xs rounded-md border border-border overflow-hidden">
              <button
                onClick={() => setUnit("in")}
                className={`px-2 py-1 ${unit === "in" ? "bg-accent text-accent-foreground" : "text-ink-muted"}`}
              >
                inches
              </button>
              <button
                onClick={() => setUnit("mm")}
                className={`px-2 py-1 ${unit === "mm" ? "bg-accent text-accent-foreground" : "text-ink-muted"}`}
              >
                mm
              </button>
            </div>
          }
        />
        <div className="grid grid-cols-2 gap-4 max-w-md">
          <label className="block">
            <span className="block text-[11px] text-ink-muted mb-1">Width</span>
            <input
              type="number"
              step="0.01"
              value={displayWidth.toFixed(2)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setWidth(unit === "in" ? v : mmToInches(v));
              }}
              className="w-full rounded-md bg-surface-inset border border-border px-2.5 py-1.5 text-sm text-ink"
            />
          </label>
          <label className="block">
            <span className="block text-[11px] text-ink-muted mb-1">Height</span>
            <input
              type="number"
              step="0.01"
              value={displayHeight.toFixed(2)}
              onChange={(e) => {
                const v = Number(e.target.value);
                setHeight(unit === "in" ? v : mmToInches(v));
              }}
              className="w-full rounded-md bg-surface-inset border border-border px-2.5 py-1.5 text-sm text-ink"
            />
          </label>
        </div>
        <label className="flex items-center gap-2 text-xs text-ink-muted mt-3">
          <input
            type="checkbox"
            checked={state.aspectLocked}
            onChange={(e) => patch({ aspectLocked: e.target.checked })}
            className="accent-accent"
          />
          Lock aspect ratio
        </label>
      </Panel>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatTile label="Physical Size" value={`${state.widthInches.toFixed(2)}" × ${state.heightInches.toFixed(2)}"`} />
        <StatTile label="Estimated Stitch Area" value={`${stitchArea.toFixed(2)} sq in`} />
        <StatTile label="Pixel-to-Output" value={`${ppi.toFixed(0)} px / in`} />
      </div>

      {warnings.length > 0 && (
        <Panel className="border-status-warning/40 bg-status-warning/5">
          <div className="flex gap-2">
            <AlertTriangle size={16} className="text-status-warning flex-none mt-0.5" />
            <p className="text-sm text-ink">{formatDetailWarning(warnings, state.widthInches)}</p>
          </div>
        </Panel>
      )}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <Panel padded className="!p-4">
      <p className="text-lg font-semibold text-ink tabular-nums">{value}</p>
      <p className="text-xs text-ink-muted mt-1">{label}</p>
    </Panel>
  );
}
