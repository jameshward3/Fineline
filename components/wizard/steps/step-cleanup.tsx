"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles, AlertTriangle } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { removeSmallIslands, removeSpeckle, smoothEdges, fillHoles } from "@/lib/services/image-processing/cleanup";
import { alphaMask, labelComponents } from "@/lib/services/image-processing/connected-components";
import { findDetailWarnings, formatDetailWarning } from "@/lib/services/image-processing/size";
import { bufferToDataUrl } from "@/lib/wizard/canvas-utils";
import { hexToRgb } from "@/lib/color";
import type { WizardState } from "../types";

export function StepCleanup({ state, patch }: { state: WizardState; patch: (u: Partial<WizardState>) => void }) {
  const [minIslandPx, setMinIslandPx] = useState(12);
  const [removeIslands, setRemoveIslands] = useState(true);
  const [despeckle, setDespeckle] = useState(true);
  const [smooth, setSmooth] = useState(true);
  const [fillHolesOpt, setFillHolesOpt] = useState(false);

  const source = state.workingBuffer;

  useEffect(() => {
    if (source && !state.cleanedBuffer) runCleanup();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  function runCleanup() {
    if (!source) return;
    let buf = source;

    if (removeIslands) {
      buf = removeSmallIslands(buf, minIslandPx).buffer;
    }
    if (fillHolesOpt) {
      const dominant = state.palette[0]?.hex ?? "#FFFFFF";
      buf = fillHoles(buf, hexToRgb(dominant)).buffer;
    }
    if (despeckle) {
      buf = removeSpeckle(buf, 1);
    }
    if (smooth) {
      buf = smoothEdges(buf, 1, 128);
    }

    const mask = alphaMask(buf);
    const { components } = labelComponents(mask, buf.width, buf.height);
    const warnings = findDetailWarnings(components, buf.width, state.widthInches);

    patch({
      cleanedBuffer: buf,
      detailWarnings: warnings,
      componentCount: components.length,
    });
  }

  const previewUrl = useMemo(() => (state.cleanedBuffer ? bufferToDataUrl(state.cleanedBuffer) : null), [state.cleanedBuffer]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Artwork Simplification</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Clean up details unlikely to embroider properly at {state.widthInches.toFixed(2)}&quot; output width.
        </p>
      </div>

      <Panel>
        <PanelHeader
          title="Cleanup Filters"
          action={
            <button
              onClick={runCleanup}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-md bg-accent text-accent-foreground"
            >
              <Sparkles size={13} />
              Fix Automatically
            </button>
          }
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <FilterToggle
            label="Small-island removal"
            checked={removeIslands}
            onChange={setRemoveIslands}
            extra={
              <label className="flex items-center gap-2 text-xs text-ink-muted ml-6">
                Min size (px²)
                <input
                  type="range"
                  min={2}
                  max={80}
                  value={minIslandPx}
                  onChange={(e) => setMinIslandPx(Number(e.target.value))}
                  className="accent-accent"
                />
                <span className="tabular-nums w-6">{minIslandPx}</span>
              </label>
            }
          />
          <FilterToggle label="Speckle removal (morphological open)" checked={despeckle} onChange={setDespeckle} />
          <FilterToggle label="Edge smoothing / anti-alias cleanup" checked={smooth} onChange={setSmooth} />
          <FilterToggle label="Hole filling" checked={fillHolesOpt} onChange={setFillHolesOpt} />
        </div>
      </Panel>

      {state.detailWarnings.length > 0 && (
        <Panel className="border-status-warning/40 bg-status-warning/5">
          <div className="flex gap-2">
            <AlertTriangle size={16} className="text-status-warning flex-none mt-0.5" />
            <div>
              <p className="text-sm text-ink">{formatDetailWarning(state.detailWarnings, state.widthInches)}</p>
              <p className="text-xs text-ink-muted mt-1">
                Increase the island-removal threshold, or review these regions manually before vectorizing.
              </p>
            </div>
          </div>
        </Panel>
      )}

      {previewUrl && (
        <Panel>
          <PanelHeader title="Preview" subtitle={`${state.componentCount} discrete regions`} />
          <div className="flex justify-center canvas-checker rounded-md p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Cleaned artwork preview" className="max-h-80" style={{ imageRendering: "pixelated" }} />
          </div>
        </Panel>
      )}
    </div>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
  extra,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  extra?: React.ReactNode;
}) {
  return (
    <div>
      <label className="flex items-center gap-2 text-ink cursor-pointer">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="accent-accent" />
        {label}
      </label>
      {checked && extra}
    </div>
  );
}
