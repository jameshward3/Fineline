"use client";

import { useEffect, useRef, useState } from "react";
import { Wand2, Eraser, Paintbrush, Pipette, Eye, type LucideIcon } from "lucide-react";
import { Panel } from "@/components/ui/panel";
import { cn } from "@/lib/utils";
import {
  autoRemoveBackground,
  magicSelect,
  colorKeyRemove,
  applyBrush,
  applyMask,
} from "@/lib/services/image-processing/background-removal";
import { cloneBuffer, type PixelBuffer } from "@/lib/services/image-processing/types";
import { rgbToHex } from "@/lib/color";
import type { WizardState } from "../types";

type Mode = "auto" | "magic-select" | "color-remove" | "erase" | "restore";

export function StepBackground({
  state,
  patch,
}: {
  state: WizardState;
  patch: (u: Partial<WizardState>) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<PixelBuffer | null>(null);
  const [mode, setMode] = useState<Mode>("auto");
  const [tolerance, setTolerance] = useState(28);
  const [brushRadius, setBrushRadius] = useState(14);
  const [showOriginal, setShowOriginal] = useState(false);
  const painting = useRef(false);

  useEffect(() => {
    if (state.workingBuffer) bufferRef.current = cloneBuffer(state.workingBuffer);
  }, [state.workingBuffer]);

  const displayBuffer = showOriginal ? state.originalBuffer : state.workingBuffer;

  useEffect(() => {
    if (!displayBuffer || !canvasRef.current) return;
    drawToCanvas(canvasRef.current, displayBuffer);
  }, [displayBuffer]);

  function drawToCanvas(canvas: HTMLCanvasElement, buffer: PixelBuffer) {
    canvas.width = buffer.width;
    canvas.height = buffer.height;
    const ctx = canvas.getContext("2d")!;
    ctx.putImageData(new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height), 0, 0);
  }

  function canvasPoint(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: Math.floor((e.clientX - rect.left) * scaleX),
      y: Math.floor((e.clientY - rect.top) * scaleY),
    };
  }

  function commit(buffer: PixelBuffer) {
    bufferRef.current = buffer;
    if (canvasRef.current) drawToCanvas(canvasRef.current, buffer);
    patch({ workingBuffer: buffer, error: null });
  }

  function handleAuto() {
    if (!state.workingBuffer) return;
    commit(autoRemoveBackground(state.workingBuffer, tolerance));
  }

  function handleClick(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!bufferRef.current || showOriginal) return;
    const { x, y } = canvasPoint(e);
    if (x < 0 || y < 0 || x >= bufferRef.current.width || y >= bufferRef.current.height) return;

    if (mode === "magic-select") {
      const mask = magicSelect(bufferRef.current, x, y, tolerance);
      commit(applyMask(bufferRef.current, mask, true));
    } else if (mode === "color-remove") {
      const p = (y * bufferRef.current.width + x) * 4;
      const hex = rgbToHex({ r: bufferRef.current.data[p], g: bufferRef.current.data[p + 1], b: bufferRef.current.data[p + 2] });
      commit(colorKeyRemove(bufferRef.current, hex, tolerance));
    }
  }

  function handlePaintStart(e: React.MouseEvent<HTMLCanvasElement>) {
    if ((mode !== "erase" && mode !== "restore") || !bufferRef.current || !state.originalBuffer) return;
    painting.current = true;
    paintAt(e);
  }

  function paintAt(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!bufferRef.current || !state.originalBuffer) return;
    const { x, y } = canvasPoint(e);
    applyBrush(bufferRef.current, state.originalBuffer, x, y, brushRadius, mode as "erase" | "restore");
    if (canvasRef.current) drawToCanvas(canvasRef.current, bufferRef.current);
  }

  function handlePaintEnd() {
    if (!painting.current) return;
    painting.current = false;
    if (bufferRef.current) patch({ workingBuffer: cloneBuffer(bufferRef.current) });
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-ink">Remove Background</h1>
        <p className="text-sm text-ink-muted mt-0.5">
          The original source image is never altered — this operates on a working copy.
        </p>
      </div>

      <Panel>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <ToolButton icon={Wand2} label="Auto Remove" active={mode === "auto"} onClick={() => setMode("auto")} />
          <ToolButton icon={Eye} label="Magic Select" active={mode === "magic-select"} onClick={() => setMode("magic-select")} />
          <ToolButton icon={Pipette} label="Color Remove" active={mode === "color-remove"} onClick={() => setMode("color-remove")} />
          <ToolButton icon={Eraser} label="Erase Brush" active={mode === "erase"} onClick={() => setMode("erase")} />
          <ToolButton icon={Paintbrush} label="Restore Brush" active={mode === "restore"} onClick={() => setMode("restore")} />

          <div className="flex-1" />
          <label className="flex items-center gap-2 text-xs text-ink-muted">
            <input
              type="checkbox"
              checked={showOriginal}
              onChange={(e) => setShowOriginal(e.target.checked)}
              className="accent-accent"
            />
            Show original
          </label>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-ink-muted">
          {(mode === "auto" || mode === "magic-select" || mode === "color-remove") && (
            <label className="flex items-center gap-2">
              Tolerance
              <input
                type="range"
                min={4}
                max={80}
                value={tolerance}
                onChange={(e) => setTolerance(Number(e.target.value))}
                className="accent-accent"
              />
              <span className="tabular-nums w-6">{tolerance}</span>
            </label>
          )}
          {(mode === "erase" || mode === "restore") && (
            <label className="flex items-center gap-2">
              Brush size
              <input
                type="range"
                min={3}
                max={60}
                value={brushRadius}
                onChange={(e) => setBrushRadius(Number(e.target.value))}
                className="accent-accent"
              />
              <span className="tabular-nums w-6">{brushRadius}</span>
            </label>
          )}
          {mode === "auto" && (
            <button
              onClick={handleAuto}
              className="text-xs px-3 py-1.5 rounded-md bg-accent text-accent-foreground font-medium"
            >
              Run Auto Remove
            </button>
          )}
        </div>

        <div className="flex justify-center canvas-checker rounded-md p-4 overflow-auto">
          <canvas
            ref={canvasRef}
            onClick={handleClick}
            onMouseDown={handlePaintStart}
            onMouseMove={(e) => painting.current && paintAt(e)}
            onMouseUp={handlePaintEnd}
            onMouseLeave={handlePaintEnd}
            className={cn(
              "max-w-full",
              (mode === "magic-select" || mode === "color-remove") && "cursor-crosshair",
              (mode === "erase" || mode === "restore") && "cursor-cell"
            )}
            style={{ imageRendering: "pixelated" }}
          />
        </div>
      </Panel>
    </div>
  );
}

function ToolButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border transition-colors",
        active ? "bg-accent/15 border-accent/50 text-accent" : "border-border text-ink-muted hover:text-ink"
      )}
    >
      <Icon size={13} />
      {label}
    </button>
  );
}
