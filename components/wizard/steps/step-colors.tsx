"use client";

import { useEffect, useMemo, useState } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { analyzeColors } from "@/lib/services/image-processing/color-analysis";
import { quantizeColors } from "@/lib/services/image-processing/quantize";
import type { WizardState } from "../types";

const TARGET_OPTIONS = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15];

function recommendTargetCount(detected: number): number {
  if (detected <= 3) return detected;
  if (detected <= 8) return Math.min(detected, 6);
  if (detected <= 20) return 8;
  return 10;
}

export function StepColors({ state, patch }: { state: WizardState; patch: (u: Partial<WizardState>) => void }) {
  const [applying, setApplying] = useState(false);
  const buffer = state.workingBuffer;

  const detected = useMemo(() => (buffer ? analyzeColors(buffer) : null), [buffer]);

  useEffect(() => {
    if (detected && state.detectedColorCount !== detected.detectedColorCount) {
      const recommended = recommendTargetCount(detected.detectedColorCount);
      patch({
        detectedColorCount: detected.detectedColorCount,
        targetColorCount: state.targetColorCount || recommended,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detected]);

  function applyReduction(target: number) {
    if (!buffer) return;
    setApplying(true);
    // Yield to the browser so the button press feels responsive before the
    // (synchronous, potentially heavy) k-means pass runs.
    setTimeout(() => {
      const result = quantizeColors(buffer, target);
      patch({
        targetColorCount: target,
        palette: result.palette,
        colorMappings: result.palette.map((p, i) => ({
          sequence: i + 1,
          artworkColorHex: p.hex,
          threadColorId: null,
          threadLabel: null,
          needleNumber: null,
          colorDeltaE: null,
          mergedInto: null,
        })),
      });
      setApplying(false);
    }, 10);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Analyze &amp; Reduce Colors</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          The 15-needle production profile supports at most 15 thread colors.
        </p>
      </div>

      <Panel>
        <PanelHeader
          title={`Detected Colors: ${state.detectedColorCount}`}
          subtitle={
            state.detectedColorCount > 15
              ? "This artwork contains more colors than the current 15-needle production profile. Reduce or merge colors before continuing."
              : `Recommended Embroidery Palette: ${recommendTargetCount(state.detectedColorCount)} Colors`
          }
        />

        <div className="flex flex-wrap gap-2 mb-4">
          {TARGET_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => applyReduction(n)}
              disabled={applying || !buffer}
              className={`text-sm w-10 h-10 rounded-md border font-mono transition-colors disabled:opacity-40 ${
                state.targetColorCount === n && state.palette.length > 0
                  ? "bg-accent text-accent-foreground border-accent"
                  : "border-border text-ink-muted hover:text-ink"
              }`}
            >
              {n}
            </button>
          ))}
        </div>

        {applying && <p className="text-xs text-ink-faint mb-3">Reducing colors…</p>}

        {state.palette.length > 0 && (
          <div>
            <p className="text-xs text-ink-muted mb-2">{state.palette.length} Production Colors</p>
            <div className="flex flex-wrap gap-2">
              {state.palette.map((p, i) => (
                <div key={p.hex + i} className="flex items-center gap-2 rounded-md border border-border bg-surface-inset px-2 py-1.5">
                  <div className="w-6 h-6 rounded border border-black/20" style={{ background: p.hex }} />
                  <div className="text-[11px]">
                    <p className="font-mono text-ink">{p.hex}</p>
                    <p className="text-ink-faint">{(p.coverage * 100).toFixed(1)}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Panel>
    </div>
  );
}
