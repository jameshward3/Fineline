"use client";

import { useState } from "react";
import { ZoomIn, ZoomOut } from "lucide-react";
import { cn } from "@/lib/utils";

type Mode = "original" | "reduced" | "vector" | "thread" | "simulation" | "placement";
type Background = "transparent" | "light" | "dark" | "gray" | "garment";

const MODES: { value: Mode; label: string }[] = [
  { value: "original", label: "Original" },
  { value: "reduced", label: "Reduced Color" },
  { value: "vector", label: "Vector" },
  { value: "thread", label: "Thread Colors" },
  { value: "simulation", label: "Embroidery Simulation" },
  { value: "placement", label: "Product Placement" },
];

const BACKGROUNDS: { value: Background; label: string; swatch: string }[] = [
  { value: "transparent", label: "Transparent", swatch: "" },
  { value: "light", label: "Light", swatch: "#F5F5F4" },
  { value: "dark", label: "Dark", swatch: "#1A1A1A" },
  { value: "gray", label: "Gray", swatch: "#6B7280" },
  { value: "garment", label: "Garment", swatch: "#17375E" },
];

export interface PreviewObject {
  key: string;
  svgPath: string;
  vectorHex: string;
  threadHex: string;
  visible: boolean;
}

export function DesignPreview({
  originalUrl,
  reducedUrl,
  objects,
  viewBoxWidth,
  viewBoxHeight,
  garmentColor,
}: {
  originalUrl: string | null;
  reducedUrl: string | null;
  objects: PreviewObject[];
  viewBoxWidth: number;
  viewBoxHeight: number;
  garmentColor?: string | null;
}) {
  const [mode, setMode] = useState<Mode>(reducedUrl ? "vector" : "original");
  const [background, setBackground] = useState<Background>("transparent");
  const [zoom, setZoom] = useState(1);

  const bgSwatch = BACKGROUNDS.find((b) => b.value === background)!;
  const resolvedBg = background === "garment" ? garmentColor ?? bgSwatch.swatch : bgSwatch.swatch;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <div className="flex rounded-md border border-border overflow-hidden text-xs">
          {MODES.map((m) => (
            <button
              key={m.value}
              onClick={() => setMode(m.value)}
              className={cn(
                "px-2.5 py-1.5 transition-colors",
                mode === m.value ? "bg-accent text-accent-foreground" : "text-ink-muted hover:text-ink"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1">
          {BACKGROUNDS.map((b) => (
            <button
              key={b.value}
              onClick={() => setBackground(b.value)}
              title={b.label}
              className={cn(
                "w-6 h-6 rounded-full border-2",
                background === b.value ? "border-accent" : "border-border",
                b.value === "transparent" && "canvas-checker"
              )}
              style={b.value !== "transparent" ? { background: b.value === "garment" ? garmentColor ?? bgSwatch.swatch : bgSwatch.swatch } : undefined}
            />
          ))}
        </div>
        <div className="flex items-center gap-1 ml-2">
          <button onClick={() => setZoom((z) => Math.max(0.25, z - 0.25))} className="p-1 text-ink-faint hover:text-ink">
            <ZoomOut size={14} />
          </button>
          <span className="text-xs text-ink-muted w-10 text-center tabular-nums">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.25))} className="p-1 text-ink-faint hover:text-ink">
            <ZoomIn size={14} />
          </button>
        </div>
      </div>

      <div
        className={cn("rounded-md p-6 flex items-center justify-center overflow-auto min-h-[320px]", !resolvedBg && "canvas-checker")}
        style={resolvedBg ? { background: resolvedBg } : undefined}
      >
        <div style={{ transform: `scale(${zoom})`, transformOrigin: "center" }}>
          {(mode === "original" || mode === "reduced") && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={(mode === "original" ? originalUrl : reducedUrl) ?? ""}
              alt="Design preview"
              className="max-h-96 max-w-full"
            />
          )}

          {(mode === "vector" || mode === "thread" || mode === "simulation" || mode === "placement") && (
            <svg
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              width={Math.min(400, viewBoxWidth)}
              height={Math.min(400, viewBoxHeight)}
            >
              {mode === "simulation" && (
                <defs>
                  <pattern id="stitch-hatch" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <line x1="0" y1="0" x2="0" y2="3" stroke="rgba(0,0,0,0.18)" strokeWidth="1" />
                  </pattern>
                </defs>
              )}
              {objects
                .filter((o) => o.visible)
                .map((o) => (
                  <g key={o.key}>
                    <path d={o.svgPath} fill={mode === "vector" ? o.vectorHex : o.threadHex} />
                    {mode === "simulation" && <path d={o.svgPath} fill="url(#stitch-hatch)" />}
                  </g>
                ))}
            </svg>
          )}
        </div>
      </div>
      {mode === "placement" && (
        <p className="text-xs text-ink-faint mt-2 text-center">
          Basic placement preview — full product-photo mockup positioning is planned for a future phase.
        </p>
      )}
    </div>
  );
}
