"use client";

import { useMemo, useState } from "react";
import { ArrowUp, ArrowDown, Eye, EyeOff, Wand2 } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { assignToPalette } from "@/lib/services/image-processing/quantize";
import { clusterBounds } from "@/lib/services/image-processing/connected-components";
import { pxPerInch, pxToMm } from "@/lib/services/image-processing/size";
import { getVectorizationService } from "@/lib/services/vectorization";
import { recommendStitchType, recommendStitchDirection } from "@/lib/services/vectorization/stitch-recommendation";
import type { WizardState, WizardVectorObject, WizardStitchType } from "../types";

const STITCH_LABELS: Record<WizardStitchType, string> = {
  RUNNING_STITCH: "Running Stitch",
  SATIN_STITCH: "Satin Stitch",
  TATAMI_FILL: "Tatami / Fill",
  APPLIQUE: "Appliqué",
  MANUAL_REVIEW: "Manual Review",
};

export function StepVectorize({ state, patch }: { state: WizardState; patch: (u: Partial<WizardState>) => void }) {
  const [running, setRunning] = useState(false);
  const buffer = state.cleanedBuffer;

  const activeRows = useMemo(
    () => [...state.colorMappings].filter((m) => m.mergedInto === null).sort((a, b) => a.sequence - b.sequence),
    [state.colorMappings]
  );

  function runVectorize() {
    if (!buffer) return;
    setRunning(true);
    setTimeout(() => {
      const paletteHexes = activeRows.map((r) => r.artworkColorHex);
      const clusters = assignToPalette(buffer, paletteHexes);
      const bounds = clusterBounds(clusters, buffer.width, paletteHexes.length);
      const ppi = pxPerInch(buffer.width, state.widthInches);

      const service = getVectorizationService();
      const layers = service.trace(
        buffer,
        paletteHexes.map((hex) => ({ hex, pixelCount: 0, coverage: 0 }))
      );

      const objects: WizardVectorObject[] = layers.map((layer, i) => {
        const row = activeRows[layer.paletteIndex];
        const bbox = bounds[layer.paletteIndex];
        const widthMm = bbox && bbox.maxX > bbox.minX ? pxToMm(bbox.maxX - bbox.minX, ppi) : 1;
        const heightMm = bbox && bbox.maxY > bbox.minY ? pxToMm(bbox.maxY - bbox.minY, ppi) : 1;
        const areaSqMm = widthMm * heightMm;
        const stitchType = recommendStitchType({ widthMm, heightMm, areaSqMm });
        const direction = recommendStitchDirection(widthMm, heightMm);

        return {
          key: `layer-${i}`,
          name: row?.threadLabel?.split(" — ")[0] ?? `Color ${layer.paletteIndex + 1}`,
          svgPath: layer.pathData,
          threadColorId: row?.threadColorId ?? null,
          hex: layer.hex,
          stitchType,
          stitchTypeAuto: stitchType,
          stitchDirectionDegrees: direction,
          sequenceOrder: i + 1,
          areaSqMm,
          minDetailMm: Math.min(widthMm, heightMm),
          visible: true,
        };
      });

      patch({ vectorLayers: layers, vectorObjects: objects });
      setRunning(false);
    }, 10);
  }

  function updateObject(key: string, update: Partial<WizardVectorObject>) {
    patch({
      vectorObjects: state.vectorObjects.map((o) => (o.key === key ? { ...o, ...update } : o)),
    });
  }

  function moveObject(key: string, direction: -1 | 1) {
    const idx = state.vectorObjects.findIndex((o) => o.key === key);
    const swapWith = state.vectorObjects[idx + direction];
    if (!swapWith) return;
    const current = state.vectorObjects[idx];
    patch({
      vectorObjects: state.vectorObjects.map((o) => {
        if (o.key === current.key) return { ...o, sequenceOrder: swapWith.sequenceOrder };
        if (o.key === swapWith.key) return { ...o, sequenceOrder: current.sequenceOrder };
        return o;
      }),
    });
  }

  const sortedObjects = [...state.vectorObjects].sort((a, b) => a.sequenceOrder - b.sequenceOrder);
  const viewBox = buffer ? `0 0 ${buffer.width} ${buffer.height}` : "0 0 100 100";

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Vectorize &amp; Sewing Order</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Each production color becomes an independent, reorderable vector object with a recommended stitch type.
        </p>
      </div>

      {state.vectorObjects.length === 0 ? (
        <Panel>
          <div className="text-center py-8">
            <button
              onClick={runVectorize}
              disabled={running || !buffer}
              className="inline-flex items-center gap-2 text-sm font-medium px-4 py-2 rounded-md bg-accent text-accent-foreground disabled:opacity-50"
            >
              <Wand2 size={15} />
              {running ? "Vectorizing…" : "Convert to Vector"}
            </button>
          </div>
        </Panel>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4">
          <Panel>
            <PanelHeader title="Production Preview" subtitle="Rendered in sewing order" />
            <div className="flex justify-center bg-white rounded-md p-4">
              <svg viewBox={viewBox} className="max-h-96 max-w-full">
                {sortedObjects
                  .filter((o) => o.visible)
                  .map((o) => (
                    <path key={o.key} d={o.svgPath} fill={o.hex} />
                  ))}
              </svg>
            </div>
          </Panel>

          <Panel>
            <PanelHeader
              title="Sewing Sequence"
              action={
                <button onClick={runVectorize} className="text-xs text-accent hover:underline">
                  Re-run
                </button>
              }
            />
            <div className="space-y-2">
              {sortedObjects.map((o, i) => (
                <div key={o.key} className="rounded-md border border-border bg-surface-inset p-2.5">
                  <div className="flex items-center gap-2">
                    <div className="flex flex-col gap-0.5">
                      <button onClick={() => moveObject(o.key, -1)} disabled={i === 0} className="text-ink-faint hover:text-ink disabled:opacity-30">
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => moveObject(o.key, 1)}
                        disabled={i === sortedObjects.length - 1}
                        className="text-ink-faint hover:text-ink disabled:opacity-30"
                      >
                        <ArrowDown size={12} />
                      </button>
                    </div>
                    <span className="text-[10px] font-mono text-ink-faint w-5">{String(i + 1).padStart(2, "0")}</span>
                    <div className="w-6 h-6 rounded border border-black/20 flex-none" style={{ background: o.hex }} />
                    <input
                      value={o.name}
                      onChange={(e) => updateObject(o.key, { name: e.target.value })}
                      className="flex-1 min-w-0 text-xs bg-transparent border-none text-ink focus:outline-none"
                    />
                    <button onClick={() => updateObject(o.key, { visible: !o.visible })} className="text-ink-faint hover:text-ink">
                      {o.visible ? <Eye size={13} /> : <EyeOff size={13} />}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 mt-2 ml-9">
                    <select
                      value={o.stitchType}
                      onChange={(e) => updateObject(o.key, { stitchType: e.target.value as WizardStitchType })}
                      className="text-[11px] bg-surface border border-border rounded-md px-1.5 py-1 text-ink"
                    >
                      {Object.entries(STITCH_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    {o.stitchType === o.stitchTypeAuto && <Badge tone="accent">Auto</Badge>}
                    <span className="text-[11px] text-ink-faint">{o.stitchDirectionDegrees}°</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </div>
      )}
    </div>
  );
}
