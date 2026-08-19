"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { initialWizardState, STEP_LABELS, type WizardState } from "./types";
import { StepImport } from "./steps/step-import";
import { StepBackground } from "./steps/step-background";
import { StepSize } from "./steps/step-size";
import { StepColors } from "./steps/step-colors";
import { StepThreadMapping } from "./steps/step-thread-mapping";
import { StepCleanup } from "./steps/step-cleanup";
import { StepVectorize } from "./steps/step-vectorize";
import { StepProduction } from "./steps/step-production";
import { StepReview } from "./steps/step-review";
import { AiAssistantPanel } from "./ai-assistant-panel";
import { useAutosave } from "./use-autosave";
import { AutosaveIndicator } from "./autosave-indicator";
import type { ThreadColorOption, ProductOption, MachineOption, ClientOption } from "./reference-types";

export function DesignWizard({
  threadColors,
  products,
  machines,
  clients,
}: {
  threadColors: ThreadColorOption[];
  products: ProductOption[];
  machines: MachineOption[];
  clients: ClientOption[];
}) {
  const [state, setState] = useState<WizardState>(initialWizardState);
  const { lastSavedAt } = useAutosave(state);

  function patch(update: Partial<WizardState>) {
    setState((prev) => ({ ...prev, ...update }));
  }

  const canAdvance = getCanAdvance(state);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-6">
      <AiAssistantPanel state={state} patch={patch} threadColors={threadColors} machines={machines} />
      <nav className="lg:sticky lg:top-20 h-fit space-y-0.5">
        {STEP_LABELS.map((label, i) => {
          const active = i === state.step;
          const done = i < state.step;
          return (
            <button
              key={label}
              onClick={() => i <= state.step && patch({ step: i })}
              disabled={i > state.step}
              className={cn(
                "w-full flex items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm transition-colors",
                active && "bg-surface-raised text-ink font-medium",
                !active && done && "text-ink-muted hover:text-ink hover:bg-surface-raised/60 cursor-pointer",
                !active && !done && "text-ink-faint cursor-not-allowed"
              )}
            >
              <span
                className={cn(
                  "flex-none w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-mono",
                  active && "bg-accent text-accent-foreground",
                  done && "bg-status-success/20 text-status-success",
                  !active && !done && "bg-surface-inset text-ink-faint"
                )}
              >
                {done ? <Check size={12} /> : i + 1}
              </span>
              {label}
            </button>
          );
        })}
        <AutosaveIndicator lastSavedAt={lastSavedAt} />
      </nav>

      <div className="min-w-0 space-y-4">
        {state.error && (
          <div className="text-sm text-status-danger bg-status-danger/10 border border-status-danger/30 rounded-md px-3 py-2">
            {state.error}
          </div>
        )}

        {state.step === 0 && <StepImport state={state} patch={patch} />}
        {state.step === 1 && <StepBackground state={state} patch={patch} />}
        {state.step === 2 && <StepSize state={state} patch={patch} />}
        {state.step === 3 && <StepColors state={state} patch={patch} />}
        {state.step === 4 && <StepThreadMapping state={state} patch={patch} threadColors={threadColors} />}
        {state.step === 5 && <StepCleanup state={state} patch={patch} />}
        {state.step === 6 && <StepVectorize state={state} patch={patch} />}
        {state.step === 7 && (
          <StepProduction state={state} patch={patch} products={products} machines={machines} clients={clients} />
        )}
        {state.step === 8 && <StepReview state={state} patch={patch} products={products} />}

        {state.step < 8 && (
          <div className="sticky bottom-0 z-50 flex justify-between bg-canvas/95 backdrop-blur border-t border-border -mx-4 px-4 py-3 mt-4">
            <button
              onClick={() => patch({ step: Math.max(0, state.step - 1) })}
              disabled={state.step === 0}
              className="text-sm px-4 py-2 rounded-md border border-border text-ink-muted hover:text-ink disabled:opacity-40"
            >
              Back
            </button>
            <button
              onClick={() => patch({ step: state.step + 1, error: null })}
              disabled={!canAdvance}
              className="text-sm px-5 py-2 rounded-md bg-accent hover:bg-accent/90 text-accent-foreground font-medium disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function getCanAdvance(state: WizardState): boolean {
  switch (state.step) {
    case 0:
      return !!state.originalBuffer && state.designName.trim().length > 0;
    case 1:
      return !!state.workingBuffer;
    case 2:
      return state.widthInches > 0 && state.heightInches > 0;
    case 3:
      return state.palette.length > 0;
    case 4:
      return state.colorMappings.every((m) => m.mergedInto !== null || m.threadColorId !== null);
    case 5:
      return !!state.cleanedBuffer;
    case 6:
      return state.vectorObjects.length > 0;
    case 7:
      return true;
    default:
      return true;
  }
}
