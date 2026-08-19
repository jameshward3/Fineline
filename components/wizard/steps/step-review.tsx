"use client";

import { useActionState, useMemo, useState, useTransition } from "react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Badge } from "@/components/ui/badge";
import { scoreDesignReadiness } from "@/lib/services/scoring";
import { bufferToPngBlob } from "@/lib/wizard/canvas-utils";
import { createDesignFromWizard, type SaveDesignState } from "@/lib/actions/designs";
import { clearAutosaveDraft } from "../use-autosave";
import type { WizardState } from "../types";
import type { ProductOption } from "../reference-types";

export function StepReview({
  state,
  patch,
  products,
}: {
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
  products: ProductOption[];
}) {
  const [saveState, formAction, pending] = useActionState<SaveDesignState, FormData>(createDesignFromWizard, {
    error: null,
  });
  const [preparing, setPreparing] = useState(false);
  const [isTransitionPending, startTransition] = useTransition();

  const activeRows = state.colorMappings.filter((m) => m.mergedInto === null);

  const readiness = useMemo(
    () =>
      scoreDesignReadiness({
        detectedColorCount: state.detectedColorCount,
        targetColorCount: state.targetColorCount,
        componentCount: state.componentCount,
        detailWarningCount: state.detailWarnings.length,
        paletteHexes: activeRows.map((r) => r.artworkColorHex),
        vectorObjects: state.vectorObjects.map((v) => ({ stitchType: v.stitchType })),
        hasProductionSetup: !!state.productId,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [state.detectedColorCount, state.targetColorCount, state.componentCount, state.detailWarnings.length, state.vectorObjects, state.productId]
  );

  const product = products.find((p) => p.id === state.productId);
  const location = product?.locations.find((l) => l.id === state.locationId);
  const setup = product?.productionSetups.find((s) => s.id === state.setupId);

  async function handleSave() {
    if (!state.originalFile || !state.cleanedBuffer) return;
    setPreparing(true);
    try {
      const referenceBlob = await bufferToPngBlob(state.cleanedBuffer);
      const referenceFile = new File([referenceBlob], "reference.png", { type: "image/png" });

      const payload = {
        name: state.designName,
        clientId: state.clientId,
        widthInches: state.widthInches,
        heightInches: state.heightInches,
        displayUnit: state.displayUnit,
        detectedColorCount: state.detectedColorCount,
        targetColorCount: state.targetColorCount,
        readinessScore: readiness.score,
        readinessBreakdown: readiness.breakdown,
        readinessClassification: readiness.classification,
        colorMappings: activeRows.map((r) => ({
          sequence: r.sequence,
          artworkColorHex: r.artworkColorHex,
          threadColorId: r.threadColorId,
          needleNumber: r.needleNumber,
          colorDeltaE: r.colorDeltaE,
        })),
        vectorObjects: state.vectorObjects.map((v) => ({
          name: v.name,
          svgPath: v.svgPath,
          threadColorId: v.threadColorId,
          stitchType: v.stitchType,
          stitchTypeAuto: v.stitchTypeAuto,
          stitchDirectionDegrees: v.stitchDirectionDegrees,
          sequenceOrder: v.sequenceOrder,
          areaSqMm: v.areaSqMm,
          minDetailMm: v.minDetailMm,
        })),
        sourceWidthPx: state.naturalWidth!,
        sourceHeightPx: state.naturalHeight!,
        workingWidthPx: state.cleanedBuffer.width,
        workingHeightPx: state.cleanedBuffer.height,
        productId: state.productId,
        locationId: state.locationId,
        setupId: state.setupId,
      };

      const formData = new FormData();
      formData.set("payload", JSON.stringify(payload));
      formData.set("originalFile", state.originalFile);
      formData.set("referenceFile", referenceFile);

      clearAutosaveDraft();
      startTransition(async () => {
        await formAction(formData);
      });
    } finally {
      setPreparing(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Review &amp; Save to Catalog</h1>
        <p className="text-sm text-ink-muted mt-0.5">Confirm production readiness, then save as V1 in the catalog.</p>
      </div>

      <Panel>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-bold text-ink tabular-nums">{readiness.score}</div>
          <div>
            <p className="text-sm text-ink font-medium">/ 100</p>
            <Badge
              tone={
                readiness.score >= 90
                  ? "success"
                  : readiness.score >= 75
                    ? "accent"
                    : readiness.score >= 50
                      ? "warning"
                      : "danger"
              }
            >
              {readiness.classification}
            </Badge>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
          <ScoreRow label="Color Count" value={readiness.breakdown.colorCount} max={10} />
          <ScoreRow label="Shape Complexity" value={readiness.breakdown.shapeComplexity} max={20} />
          <ScoreRow label="Minimum Detail" value={readiness.breakdown.minimumDetail} max={20} />
          <ScoreRow label="Contrast" value={readiness.breakdown.contrast} max={10} />
          <ScoreRow label="Vector Quality" value={readiness.breakdown.vectorQuality} max={20} />
          <ScoreRow label="Production Setup" value={readiness.breakdown.productionSetup} max={20} />
        </div>
        {readiness.recommendations.length > 0 && (
          <ul className="mt-4 space-y-1 text-xs text-ink-muted list-disc list-inside">
            {readiness.recommendations.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Summary" />
        <dl className="text-sm space-y-2">
          <Row label="Design" value={state.designName} />
          <Row label="Physical Size" value={`${state.widthInches.toFixed(2)}" × ${state.heightInches.toFixed(2)}"`} />
          <Row label="Production Colors" value={String(activeRows.length)} />
          <Row label="Vector Objects" value={String(state.vectorObjects.length)} />
          <Row label="Product" value={product?.name ?? "—"} />
          <Row label="Location" value={location?.name ?? "—"} />
          <Row label="Setup" value={setup?.name ?? "—"} />
        </dl>
      </Panel>

      {saveState.error && (
        <div className="text-sm text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-md px-3 py-2">
          {saveState.error}
        </div>
      )}

      <div className="flex justify-between pt-2">
        <button
          onClick={() => patch({ step: 7 })}
          className="text-sm px-4 py-2 rounded-md border border-border text-ink-muted hover:text-ink"
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={pending || preparing || isTransitionPending}
          className="text-sm px-5 py-2 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground font-medium disabled:opacity-50"
        >
          {pending || preparing || isTransitionPending ? "Saving…" : "Save to Catalog"}
        </button>
      </div>
    </div>
  );
}

function ScoreRow({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="bg-surface-inset border border-border rounded-md px-2.5 py-2">
      <p className="text-ink-faint">{label}</p>
      <p className="text-ink font-mono mt-0.5">
        {value}/{max}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-ink text-right">{value}</dd>
    </div>
  );
}
