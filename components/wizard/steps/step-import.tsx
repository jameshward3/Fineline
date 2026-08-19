"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { UploadCloud, Clipboard } from "lucide-react";
import { Panel, PanelHeader } from "@/components/ui/panel";
import { Field, Input } from "@/components/ui/form";
import { loadImageFile, bufferToDataUrl, formatBytes } from "@/lib/wizard/canvas-utils";
import type { WizardState } from "../types";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"];

export function StepImport({
  state,
  patch,
}: {
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const previewUrl = useMemo(
    () => (state.workingBuffer ? bufferToDataUrl(state.workingBuffer) : null),
    [state.workingBuffer]
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        patch({ error: `Unsupported file type: ${file.type || "unknown"}. Use JPEG, PNG, WebP, or SVG.` });
        return;
      }
      setLoading(true);
      patch({ error: null });
      try {
        const { buffer, naturalWidth, naturalHeight } = await loadImageFile(file);
        patch({
          originalFile: file,
          originalBuffer: buffer,
          workingBuffer: buffer,
          fileName: file.name,
          fileSizeBytes: file.size,
          naturalWidth,
          naturalHeight,
          designName: state.designName || file.name.replace(/\.[^.]+$/, ""),
        });
      } catch {
        patch({ error: "Could not read that image file." });
      } finally {
        setLoading(false);
      }
    },
    [patch, state.designName]
  );

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">New Design — Import Artwork</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          Import AI-generated or source artwork to begin production preparation.
        </p>
      </div>

      <Panel>
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          onPaste={(e) => {
            const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
            const file = item?.getAsFile();
            if (file) handleFile(file);
          }}
          tabIndex={0}
          className={`flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-10 text-center transition-colors focus:outline-none ${
            dragOver ? "border-accent bg-accent/5" : "border-border-strong"
          }`}
        >
          {previewUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Imported artwork" className="max-h-64 rounded-md canvas-checker" />
          ) : (
            <>
              <UploadCloud size={32} className="text-ink-faint" />
              <p className="text-sm text-ink">Drag and drop artwork here</p>
              <p className="text-xs text-ink-muted flex items-center gap-1">
                <Clipboard size={12} /> or paste from clipboard
              </p>
            </>
          )}
          <button
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-accent hover:underline mt-1"
          >
            {loading ? "Loading…" : state.workingBuffer ? "Choose a different file" : "Browse files"}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={ACCEPTED_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
          />
        </div>

        {state.fileName && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 text-xs">
            <InfoTile label="Filename" value={state.fileName} />
            <InfoTile
              label="Dimensions"
              value={state.naturalWidth ? `${state.naturalWidth} × ${state.naturalHeight} px` : "—"}
            />
            <InfoTile
              label="Aspect Ratio"
              value={
                state.naturalWidth && state.naturalHeight
                  ? (state.naturalWidth / state.naturalHeight).toFixed(3)
                  : "—"
              }
            />
            <InfoTile label="File Size" value={state.fileSizeBytes ? formatBytes(state.fileSizeBytes) : "—"} />
          </div>
        )}
      </Panel>

      <Panel>
        <PanelHeader title="Design Name" subtitle="Example: South Orange Tigers — Chest Logo" />
        <Field label="Name" required>
          <Input
            value={state.designName}
            onChange={(e) => patch({ designName: e.target.value })}
            placeholder="South Orange Tigers — Chest Logo"
          />
        </Field>
      </Panel>
    </div>
  );
}

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface-inset border border-border rounded-md px-3 py-2">
      <p className="text-ink-faint">{label}</p>
      <p className="text-ink mt-0.5 truncate">{value}</p>
    </div>
  );
}
