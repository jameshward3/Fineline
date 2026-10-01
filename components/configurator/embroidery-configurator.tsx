"use client";

import { upload } from "@vercel/blob/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  Lock,
  Maximize2,
  Minus,
  PackageCheck,
  Plus,
  RotateCcw,
  Sparkles,
  UploadCloud,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoLockup } from "@/components/story/marks";
import { analyzeColors } from "@/lib/services/image-processing/color-analysis";
import { quantizeColors, type QuantizeResult } from "@/lib/services/image-processing/quantize";
import { fromImageData, type PaletteEntry, type PixelBuffer } from "@/lib/services/image-processing/types";
import { loadImageFile, formatBytes } from "@/lib/wizard/canvas-utils";
import { deltaE76, hexToLab } from "@/lib/color";
import {
  FALLBACK_CATALOG,
  type ConfiguratorCatalog,
  type PublicThreadColor,
} from "@/lib/configurator/catalog";
import { createThreadTextureMaps, prepareArtworkBuffer, type ThreadTextureMaps } from "@/lib/configurator/artwork-texture";
import {
  calculateConfiguratorQuote,
  calculateLetteringQuote,
  countLetteringCharacters,
  LETTERING_RATE_PER_LETTER,
  type BorderStyle,
  type ThreadWeightChoice,
} from "@/lib/configurator/pricing";
import { STITCH_STYLES, stitchStyleLabel, type StitchStyle } from "@/lib/configurator/stitch-simulation";
import {
  LETTERING_FONTS,
  ensureLetteringFontLoaded,
  letteringFontOption,
  type LetteringFont,
} from "@/lib/configurator/lettering-fonts";
import type { ConfiguratorThreadMapping } from "@/lib/configurator/schema";
import type { ConfiguratorUploadIntent } from "@/lib/configurator/upload-intent";
import styles from "./embroidery-configurator.module.css";

const EmbroideryPreview3D = dynamic(
  () => import("./embroidery-preview-3d").then((module) => module.EmbroideryPreview3D),
  { ssr: false },
);

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const;
const STEPS = ["Item, quantity & design", "Thread & finish", "Size & placement", "Review & submit"] as const;
const STITCH_STYLE_COPY: Record<StitchStyle, string> = {
  AUTO: "Adapts to each shape",
  PATCH: "Layered badge depth",
  SATIN: "Long, glossy columns",
  TATAMI: "Compact woven fill",
};
const EMPTY_STITCH_LAYERS: ThreadTextureMaps["stitchLayers"] = [];

type ObjectType = "SHIRT" | "HAT" | "JACKET" | "BAG" | "ACCESSORY" | "OTHER";
const OBJECT_TYPES: { value: ObjectType; label: string }[] = [
  { value: "SHIRT", label: "Shirt" },
  { value: "HAT", label: "Hat" },
  { value: "JACKET", label: "Jacket" },
  { value: "BAG", label: "Bag" },
  { value: "ACCESSORY", label: "Accessory" },
  { value: "OTHER", label: "Other" },
];
/** All items are currently customer-supplied — the studio doesn't sell the
 * blank, so there's no per-unit product charge regardless of object type. */
const DEFAULT_PLACEMENT_MAX_INCHES = 12;

interface ArtworkState {
  file: File;
  buffer: PixelBuffer;
  naturalWidth: number;
  naturalHeight: number;
}

interface QuantizedState extends QuantizeResult {
  preparedBuffer: PixelBuffer;
}

interface SubmissionResult {
  orderReference: string;
  submissionId: string;
  quote: ReturnType<typeof calculateConfiguratorQuote>;
}

interface EmbroideryConfiguratorProps {
  embedded: boolean;
  headingLevel?: "h1" | "h2";
  uploadIntent: ConfiguratorUploadIntent;
  blobStorageReady: boolean;
}

function threadKey(thread: PublicThreadColor) {
  return thread.id ?? `${thread.manufacturer}:${thread.manufacturerCode}:${thread.hex}`;
}

function threadForMapping(mapping: ConfiguratorThreadMapping, threads: PublicThreadColor[]) {
  const idMatch = mapping.threadColorId
    ? threads.find((thread) => thread.id === mapping.threadColorId)
    : undefined;
  return idMatch
    ?? threads.find((thread) => thread.hex.toUpperCase() === mapping.targetHex.toUpperCase())
    ?? threads[0];
}

function nearestThread(sourceHex: string, threads: PublicThreadColor[]) {
  const target = hexToLab(sourceHex);
  return threads.reduce<{ thread: PublicThreadColor; delta: number } | null>((best, thread) => {
    const delta = deltaE76(target, hexToLab(thread.hex));
    return !best || delta < best.delta ? { thread, delta } : best;
  }, null)?.thread ?? threads[0];
}

function mappingsFor(palette: PaletteEntry[], threads: PublicThreadColor[]): ConfiguratorThreadMapping[] {
  return palette.map((entry, index) => {
    const thread = nearestThread(entry.hex, threads);
    return {
      sequence: index + 1,
      sourceHex: entry.hex,
      targetHex: thread?.hex ?? entry.hex,
      threadColorId: thread?.id ?? null,
      threadName: thread?.name ?? "Custom color",
      manufacturerCode: thread?.manufacturerCode ?? "",
      coverage: entry.coverage,
    };
  });
}

/** Custom lettering has no analyzed artwork colors to map from — the customer
 * picks the thread count and spools directly. sourceHex mirrors targetHex
 * since there is no "detected" color to translate from. */
function isBlackThread(thread: PublicThreadColor) {
  return thread.hex.toUpperCase() === "#1A1A1A" || thread.name.trim().toLowerCase() === "black";
}

/** Black is the standard default lettering thread — put it first (if the
 * available palette has one) so a single-color order defaults to black
 * instead of whatever happens to sort first. */
function letteringMappingsFor(count: number, threads: PublicThreadColor[]): ConfiguratorThreadMapping[] {
  const blackIndex = threads.findIndex(isBlackThread);
  const ordered = blackIndex > 0
    ? [threads[blackIndex], ...threads.filter((_, index) => index !== blackIndex)]
    : threads;
  return Array.from({ length: count }, (_, index) => {
    const thread = ordered[index % Math.max(1, ordered.length)];
    const hex = thread?.hex ?? "#1A1A1A";
    return {
      sequence: index + 1,
      sourceHex: hex,
      targetHex: hex,
      threadColorId: thread?.id ?? null,
      threadName: thread?.name ?? "Custom color",
      manufacturerCode: thread?.manufacturerCode ?? "",
      coverage: 1 / count,
    };
  });
}

function safeArtworkName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(-180) || "artwork.png";
}

const LETTERING_FONT_SIZE = 220;
const LETTERING_PADDING_X = 60;
const LETTERING_PADDING_Y = 90;

interface LetteringGlyph {
  char: string;
  x: number;
  width: number;
}

interface LetteringLayout {
  width: number;
  height: number;
  glyphs: LetteringGlyph[];
}

/** Lays out each character's x-position once so the final artwork render and
 * the live 3D-preview render stay pixel-consistent with each other. */
function layoutLettering(text: string, cssFont: string): LetteringLayout {
  const measure = document.createElement("canvas").getContext("2d");
  if (!measure) throw new Error("Could not measure the lettering text.");
  measure.font = `700 ${LETTERING_FONT_SIZE}px ${cssFont}`;
  let cursorX = LETTERING_PADDING_X;
  const glyphs: LetteringGlyph[] = [];
  for (const char of text) {
    const width = measure.measureText(char).width;
    glyphs.push({ char, x: cursorX, width });
    cursorX += width;
  }
  return {
    width: Math.max(1, Math.ceil(cursorX)) + LETTERING_PADDING_X,
    height: Math.round(LETTERING_FONT_SIZE * 1.4) + LETTERING_PADDING_Y * 2,
    glyphs,
  };
}

/**
 * Custom lettering doesn't come from an uploaded file, but submission still
 * requires a real artwork image (the studio reviews a proof either way and
 * downstream storage/DB plumbing all expects one). Render the text onto a
 * canvas — each billable character in its own color, cycling through the
 * selected spools — and package it exactly like a user upload so the rest of
 * the pipeline — upload, verification, ArtworkAsset — needs no special-casing.
 */
async function renderLetteringArtwork(text: string, cssFont: string, colorHexes: string[]): Promise<ArtworkState> {
  const layout = layoutLettering(text, cssFont);
  const canvas = document.createElement("canvas");
  canvas.width = layout.width;
  canvas.height = layout.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not render the lettering preview.");
  ctx.font = `700 ${LETTERING_FONT_SIZE}px ${cssFont}`;
  ctx.textBaseline = "middle";

  let colorIndex = 0;
  for (const glyph of layout.glyphs) {
    if (glyph.char.trim() === "") continue;
    ctx.fillStyle = colorHexes[colorIndex % Math.max(1, colorHexes.length)] ?? "#1A1A1A";
    ctx.fillText(glyph.char, glyph.x, layout.height / 2);
    colorIndex++;
  }

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => (result ? resolve(result) : reject(new Error("Could not render the lettering preview."))), "image/png");
  });
  const file = new File([blob], `lettering-${Date.now()}.png`, { type: "image/png" });
  const buffer = fromImageData(ctx.getImageData(0, 0, canvas.width, canvas.height));
  return { file, buffer, naturalWidth: canvas.width, naturalHeight: canvas.height };
}

/**
 * Builds the alpha mask + per-pixel color-cluster assignment the 3D preview's
 * thread-texture pipeline needs, without running real color quantization —
 * each billable character's pixels are tagged with its own cluster index
 * (cycling through the selected color count) as it's drawn, so there's no
 * color-matching/anti-aliasing ambiguity to resolve afterward.
 */
function buildLetteringClusterPixels(text: string, cssFont: string, colorCount: number): { buffer: PixelBuffer; clusters: Int16Array } {
  const layout = layoutLettering(text, cssFont);
  const { width, height } = layout;
  const clusters = new Int16Array(width * height).fill(-1);
  const alpha = new Uint8ClampedArray(width * height);

  let colorIndex = 0;
  for (const glyph of layout.glyphs) {
    if (glyph.char.trim() === "") continue;
    const clusterIndex = colorIndex % Math.max(1, colorCount);
    const glyphWidth = Math.max(1, Math.ceil(glyph.width) + 20);
    const glyphCanvas = document.createElement("canvas");
    glyphCanvas.width = glyphWidth;
    glyphCanvas.height = height;
    const gctx = glyphCanvas.getContext("2d");
    if (!gctx) continue;
    gctx.font = `700 ${LETTERING_FONT_SIZE}px ${cssFont}`;
    gctx.textBaseline = "middle";
    gctx.fillStyle = "#000000";
    gctx.fillText(glyph.char, 10, height / 2);
    const glyphData = gctx.getImageData(0, 0, glyphWidth, height).data;
    const destX = Math.round(glyph.x - 10);
    for (let gy = 0; gy < height; gy++) {
      for (let gx = 0; gx < glyphWidth; gx++) {
        const a = glyphData[(gy * glyphWidth + gx) * 4 + 3];
        if (a <= 10) continue;
        const destXAbs = destX + gx;
        if (destXAbs < 0 || destXAbs >= width) continue;
        const destIndex = gy * width + destXAbs;
        clusters[destIndex] = clusterIndex;
        if (a > alpha[destIndex]) alpha[destIndex] = a;
      }
    }
    colorIndex++;
  }

  const bufferData = new Uint8ClampedArray(width * height * 4);
  for (let i = 0, p = 0; i < width * height; i++, p += 4) {
    bufferData[p + 3] = alpha[i];
  }
  return { buffer: { data: bufferData, width, height }, clusters };
}

function hasTransparentPixels(buffer: PixelBuffer) {
  for (let offset = 3; offset < buffer.data.length; offset += 4) {
    if (buffer.data[offset] < 245) return true;
  }
  return false;
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function EmbroideryConfigurator({
  embedded,
  headingLevel = "h1",
  uploadIntent,
  blobStorageReady,
}: EmbroideryConfiguratorProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const autoPalettePendingRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const idempotencyRef = useRef(
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `cfg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [catalog, setCatalog] = useState<ConfiguratorCatalog>(FALLBACK_CATALOG);
  const [activeStep, setActiveStep] = useState(0);
  const [designMode, setDesignMode] = useState<"ARTWORK" | "LETTERING">("ARTWORK");
  const [letteringText, setLetteringText] = useState("");
  const [letteringFont, setLetteringFont] = useState<LetteringFont>("SANS");
  const [letteringColorCount, setLetteringColorCount] = useState(1);
  const [artwork, setArtwork] = useState<ArtworkState | null>(null);
  const [quantized, setQuantized] = useState<QuantizedState | null>(null);
  const [mappings, setMappings] = useState<ConfiguratorThreadMapping[]>([]);
  const [targetColorCount, setTargetColorCount] = useState(4);
  const [detectedColorCount, setDetectedColorCount] = useState(0);
  const [removeLightBackground, setRemoveLightBackground] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [textureMaps, setTextureMaps] = useState<ThreadTextureMaps | null>(null);
  const [designName, setDesignName] = useState("");
  const [threadWeight, setThreadWeight] = useState<ThreadWeightChoice>("W40");
  const [densityMm, setDensityMm] = useState(0.45);
  const [stitchStyle, setStitchStyle] = useState<StitchStyle>("PATCH");
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("NONE");
  const [borderColor, setBorderColor] = useState("#1A1A1A");
  const [borderWidthMm, setBorderWidthMm] = useState(2);
  const [objectType, setObjectType] = useState<ObjectType>("SHIRT");
  const [placementName, setPlacementName] = useState("");
  const [garmentColor, setGarmentColor] = useState("#E9E1D4");
  const [widthInches, setWidthInches] = useState(3.5);
  const [heightInches, setHeightInches] = useState(2.5);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [positionX, setPositionX] = useState(-0.32);
  const [positionY, setPositionY] = useState(0.22);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [previewZoom, setPreviewZoom] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [projectType, setProjectType] = useState<"PERSONAL" | "CORPORATE" | "INSTITUTIONAL" | "OTHER">("PERSONAL");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", organization: "", notes: "", consent: false });
  const [website, setWebsite] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const sourceAspect = artwork ? artwork.naturalWidth / artwork.naturalHeight : widthInches / heightInches;
  const objectTypeLabel = OBJECT_TYPES.find((item) => item.value === objectType)?.label ?? "Item";
  // Lettering runs without a separate color re-matching pass, so it only
  // offers what's actually threaded on a machine right now; fall back to the
  // full catalog if no machine has reported loaded colors yet.
  const letteringThreadChoices = catalog.loadedThreads.length > 0 ? catalog.loadedThreads : catalog.threads;
  const threadChoicesForMode = designMode === "LETTERING" ? letteringThreadChoices : catalog.threads;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/configurator/options")
      .then((response) => response.json())
      .then((data: ConfiguratorCatalog) => {
        if (cancelled || !data.threads?.length) return;
        setCatalog(data);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!artwork || designMode !== "ARTWORK") return;
    let cancelled = false;
    setProcessing(true);
    const timer = window.setTimeout(() => {
      const preparedBuffer = prepareArtworkBuffer(artwork.buffer, removeLightBackground);
      const next = quantizeColors(preparedBuffer, targetColorCount, { maxSamples: 12_000, iterations: 10 });
      if (cancelled) return;
      if (autoPalettePendingRef.current) {
        autoPalettePendingRef.current = false;
        const smallestCoverage = Math.min(...next.palette.map((entry) => entry.coverage));
        if (targetColorCount === 4 && next.palette.length === 4 && smallestCoverage < 0.075) {
          setTargetColorCount(3);
          return;
        }
      }
      setQuantized({ ...next, preparedBuffer });
      setMappings(mappingsFor(next.palette, catalog.threads));
      setProcessing(false);
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [artwork, catalog.threads, designMode, removeLightBackground, targetColorCount]);

  useEffect(() => {
    if (designMode !== "LETTERING") return;
    setMappings(letteringMappingsFor(letteringColorCount, letteringThreadChoices));
  }, [designMode, letteringColorCount, letteringThreadChoices]);

  useEffect(() => {
    if (designMode !== "LETTERING" || !letteringText.trim()) return;
    setDesignName((current) =>
      current.trim() === "" || current.startsWith("Custom lettering — ")
        ? `Custom lettering — ${letteringText.trim()}`
        : current
    );
  }, [designMode, letteringText]);

  useEffect(() => {
    if (designMode !== "ARTWORK") return;
    if (!quantized || mappings.length !== quantized.palette.length) {
      setTextureMaps(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setTextureMaps(createThreadTextureMaps({
        buffer: quantized.preparedBuffer,
        clusters: quantized.pixelClusters,
        targetHexes: mappings.map((mapping) => mapping.targetHex),
        borderStyle,
        borderColor,
        borderWidthMm,
        densityMm,
        threadWeight,
        stitchStyle,
      }));
    }, 24);
    return () => window.clearTimeout(timer);
  }, [borderColor, borderStyle, borderWidthMm, densityMm, designMode, mappings, quantized, stitchStyle, threadWeight]);

  useEffect(() => {
    if (designMode !== "LETTERING") return;
    const text = letteringText.trim();
    if (!text || mappings.length === 0) {
      setTextureMaps(null);
      return;
    }
    let cancelled = false;
    setProcessing(true);
    const timer = window.setTimeout(() => {
      void (async () => {
        await ensureLetteringFontLoaded(letteringFont);
        if (cancelled) return;
        const cssFont = letteringFontOption(letteringFont).cssFont;
        const { buffer, clusters } = buildLetteringClusterPixels(text, cssFont, mappings.length);
        if (cancelled) return;
        setTextureMaps(createThreadTextureMaps({
          buffer,
          clusters,
          targetHexes: mappings.map((mapping) => mapping.targetHex),
          borderStyle: "NONE",
          borderColor: "#1A1A1A",
          borderWidthMm: 0,
          densityMm,
          threadWeight,
          stitchStyle: "SATIN",
        }));
        setProcessing(false);
      })();
    }, 280);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [densityMm, designMode, letteringFont, letteringText, mappings, threadWeight]);

  const quote = useMemo(() => {
    if (designMode === "LETTERING") {
      return calculateLetteringQuote({
        text: letteringText,
        quantity,
        colorCount: Math.max(1, mappings.length),
        productCategory: objectType,
      });
    }
    return calculateConfiguratorQuote({
      widthInches,
      heightInches,
      quantity,
      colorCount: Math.max(1, mappings.length),
      densityMm,
      threadWeight,
      borderStyle,
      borderWidthMm,
      productCategory: objectType,
    });
  }, [
    borderStyle,
    borderWidthMm,
    densityMm,
    designMode,
    heightInches,
    letteringText,
    mappings.length,
    objectType,
    quantity,
    threadWeight,
    widthInches,
  ]);

  const parentOrigin = useMemo(() => {
    if (!embedded || typeof document === "undefined" || !document.referrer) return null;
    try {
      return new URL(document.referrer).origin;
    } catch {
      return null;
    }
  }, [embedded]);

  const notifyParent = useCallback((payload: Record<string, unknown>) => {
    if (embedded && parentOrigin) window.parent.postMessage({ source: "fine-line-configurator", ...payload }, parentOrigin);
  }, [embedded, parentOrigin]);

  useEffect(() => {
    if (!embedded) return;
    const observer = new ResizeObserver(() => {
      notifyParent({ type: "resize", height: Math.ceil(document.documentElement.getBoundingClientRect().height) });
    });
    observer.observe(document.documentElement);
    notifyParent({ type: "ready" });
    return () => observer.disconnect();
  }, [embedded, notifyParent]);

  const handleFile = useCallback(async (file: File) => {
    setError(null);
    if (!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])) {
      setError("Use a PNG, JPEG, WebP, or SVG artwork file.");
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError("Artwork must be 20 MB or smaller.");
      return;
    }
    setProcessing(true);
    try {
      const loaded = await loadImageFile(file);
      const shouldRemoveLightBackground = !hasTransparentPixels(loaded.buffer);
      const prepared = prepareArtworkBuffer(loaded.buffer, shouldRemoveLightBackground);
      const analysis = analyzeColors(prepared, { step: 18 });
      const recommended = Math.max(1, Math.min(6, analysis.detectedColorCount <= 3 ? analysis.detectedColorCount : 4));
      setDetectedColorCount(analysis.detectedColorCount);
      autoPalettePendingRef.current = true;
      setTargetColorCount(recommended);
      setRemoveLightBackground(shouldRemoveLightBackground);
      setArtwork({ file, ...loaded });
      setDesignName(file.name.replace(/\.[^.]+$/, ""));
      const aspect = loaded.naturalWidth / loaded.naturalHeight;
      const nextWidth = Math.min(3.5, DEFAULT_PLACEMENT_MAX_INCHES);
      setWidthInches(nextWidth);
      setHeightInches(Math.min(nextWidth / aspect, DEFAULT_PLACEMENT_MAX_INCHES));
    } catch {
      setError("We could not read that artwork file. Try exporting it again as PNG or SVG.");
      setProcessing(false);
    }
  }, []);

  function updateMapping(sequence: number, key: string) {
    const thread = threadChoicesForMode.find((item) => threadKey(item) === key);
    if (!thread) return;
    setMappings((current) => current.map((mapping) => mapping.sequence === sequence ? {
      ...mapping,
      targetHex: thread.hex,
      threadColorId: thread.id,
      threadName: thread.name,
      manufacturerCode: thread.manufacturerCode,
    } : mapping));
  }

  function updateWidth(value: number) {
    const next = Math.max(0.25, Math.min(value, 15));
    setWidthInches(next);
    if (aspectLocked) setHeightInches(Math.max(0.25, Math.min(next / sourceAspect, 15)));
  }

  function updateHeight(value: number) {
    const next = Math.max(0.25, Math.min(value, 15));
    setHeightInches(next);
    if (aspectLocked) setWidthInches(Math.max(0.25, Math.min(next * sourceAspect, 15)));
  }

  function canContinue() {
    if (activeStep === 0 && quantity < 1) return "Set a quantity to continue.";
    if (activeStep === 0 && designMode === "ARTWORK" && !artwork) return "Upload artwork to continue.";
    if (activeStep === 0 && designMode === "LETTERING" && !letteringText.trim()) return "Enter the custom lettering text to continue.";
    if (activeStep === 0 && !designName.trim()) return "Give this design a name.";
    if (activeStep === 1 && mappings.length === 0) return "Choose at least one production color.";
    if (activeStep === 2 && !placementName.trim()) return "Describe where the design should be placed.";
    return null;
  }

  function nextStep() {
    const message = canContinue();
    if (message) {
      setError(message);
      return;
    }
    setError(null);
    setActiveStep((step) => Math.min(3, step + 1));
  }

  async function submitConfiguration() {
    if (designMode === "LETTERING" && !letteringText.trim()) {
      setActiveStep(0);
      setError("Enter the custom lettering text before submitting.");
      return;
    }
    if (designMode === "ARTWORK" && !artwork) {
      setActiveStep(0);
      setError("Upload artwork before submitting.");
      return;
    }
    if (!customer.name.trim() || !customer.email.trim() || !customer.phone.trim() || !customer.consent) {
      setError("Add your name, email, and mobile number, then confirm that the studio may contact you about this request.");
      return;
    }
    if (!blobStorageReady) {
      setError("Artwork storage is temporarily unavailable. Your configuration is still saved in this browser; please try again shortly.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setUploadProgress(0);

    try {
      const activeArtwork = designMode === "LETTERING"
        ? await renderLetteringArtwork(
            letteringText.trim(),
            letteringFontOption(letteringFont).cssFont,
            mappings.map((mapping) => mapping.targetHex)
          )
        : artwork!;
      if (designMode === "LETTERING") setArtwork(activeArtwork);

      const blob = await upload(
        `configurator/${uploadIntent.nonce}/${Date.now()}-${safeArtworkName(activeArtwork.file.name)}`,
        activeArtwork.file,
        {
          access: "public",
          handleUploadUrl: "/api/public/configurator/upload",
          clientPayload: JSON.stringify({ uploadIntent: uploadIntent.token }),
          multipart: activeArtwork.file.size > 5 * 1024 * 1024,
          onUploadProgress: ({ percentage }) => setUploadProgress(Math.round(percentage)),
        },
      );

      const response = await fetch("/api/public/configurator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idempotencyKey: idempotencyRef.current,
          startedAt: startedAtRef.current,
          website,
          projectType,
          customer: {
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
            organization: customer.organization,
            consent: customer.consent,
          },
          artwork: {
            url: blob.url,
            pathname: blob.pathname,
            fileName: activeArtwork.file.name,
            contentType: activeArtwork.file.type,
            fileSizeBytes: activeArtwork.file.size,
            widthPx: activeArtwork.naturalWidth,
            heightPx: activeArtwork.naturalHeight,
          },
          configuration: {
            designMode,
            lettering: designMode === "LETTERING" ? { text: letteringText.trim() } : null,
            designName: designName.trim(),
            productId: null,
            productName: `Customer-supplied ${objectTypeLabel}`,
            productCategory: objectType,
            locationId: null,
            placementName: placementName.trim(),
            garmentColorHex: garmentColor,
            widthInches,
            heightInches,
            positionX,
            positionY,
            rotationDegrees,
            threadWeight,
            densityMm,
            stitchStyle,
            colors: mappings,
            border: { style: borderStyle, colorHex: borderColor, widthMm: borderWidthMm },
            quantity,
            notes: customer.notes,
          },
        }),
      });
      const payload = await response.json() as SubmissionResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The studio could not receive this configuration.");
      const portalUrl = `/orders/sign-in?order=${encodeURIComponent(payload.orderReference)}`;
      notifyParent({ type: "submitted", orderReference: payload.orderReference, portalUrl });
      router.push(portalUrl);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The studio could not receive this configuration.");
    } finally {
      setSubmitting(false);
    }
  }

  const IntroHeading = headingLevel;

  return (
    <section className={`${styles.configurator} ${embedded ? styles.embedded : ""}`}>
      {!embedded && (
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Fine Line Studio home">
            <svg viewBox="-115 -120 230 260" aria-hidden><LogoLockup id="configurator-brand" showThread showWordmark={false} /></svg>
            <span><strong>FINE LINE</strong><small>STUDIO</small></span>
          </Link>
          <div className={styles.secureLabel}><Lock size={12} aria-hidden /> Secure artwork intake</div>
        </header>
      )}

      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Embroidery atelier</p>
          <IntroHeading>See your mark<br />in thread.</IntroHeading>
        </div>
        <p>Upload an idea, refine its thread and scale, then place it on the object. Every proof remains subject to a studio sew test.</p>
      </div>

      <nav className={styles.stepNav} aria-label="Configurator progress">
        {STEPS.map((label, index) => (
          <button
            key={label}
            type="button"
            className={index === activeStep ? styles.activeStep : index < activeStep ? styles.completeStep : ""}
            onClick={() => index <= activeStep && setActiveStep(index)}
            disabled={index > activeStep}
            aria-current={index === activeStep ? "step" : undefined}
          >
            <span>{index < activeStep ? <Check size={12} /> : String(index + 1).padStart(2, "0")}</span>
            {label}
          </button>
        ))}
      </nav>

      <div className={styles.workspace}>
        <div className={styles.controls}>
          {activeStep === 0 && (
            <div className={styles.stepPanel}>
              <StepHeading number="01" title="Describe the order, then add your design." copy="Tell us what you're sending in and how many, then upload artwork or enter custom lettering." />
              <div className={styles.startSection}>
                <div className={styles.startSectionHeading}><span>Design type</span><small>Upload your own artwork, or have a name or monogram lettered</small></div>
                <fieldset className={styles.choiceGroup}>
                  <legend className={styles.visuallyHidden}>Design type</legend>
                  <button type="button" className={designMode === "ARTWORK" ? styles.choiceSelected : ""} onClick={() => setDesignMode("ARTWORK")} aria-pressed={designMode === "ARTWORK"}>
                    <strong>Upload artwork</strong><small>Logo, crest, or custom graphic</small>
                  </button>
                  <button type="button" className={designMode === "LETTERING" ? styles.choiceSelected : ""} onClick={() => setDesignMode("LETTERING")} aria-pressed={designMode === "LETTERING"}>
                    <strong>Custom lettering</strong><small>Name, initials, or monogram — priced per letter</small>
                  </button>
                </fieldset>
              </div>
              <div className={styles.startSection}>
                <div className={styles.startSectionHeading}><span>Item type</span><small>Every item is currently customer-supplied — send it in, and tell us what kind it is</small></div>
                <fieldset className={styles.choiceGroup}>
                  <legend className={styles.visuallyHidden}>Item type</legend>
                  {OBJECT_TYPES.map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={objectType === item.value ? styles.choiceSelected : ""}
                      onClick={() => setObjectType(item.value)}
                      aria-pressed={objectType === item.value}
                    >
                      <strong>{item.label}</strong>
                    </button>
                  ))}
                </fieldset>
              </div>
              <div className={styles.startSection}>
                <div className={styles.startSectionHeading}><span>Quantity</span><small>Volume pricing updates immediately</small></div>
                <label className={styles.quantityField}>
                  <span className={styles.visuallyHidden}>Quantity</span>
                  <div>
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={14} /></button>
                    <input aria-label="Quantity" type="number" min="1" max="5000" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(5000, Number(event.target.value) || 1)))} />
                    <button type="button" aria-label="Increase quantity" onClick={() => setQuantity((value) => Math.min(5000, value + 1))}><Plus size={14} /></button>
                  </div>
                </label>
                <div className={styles.quantityPresets}>{[1, 12, 24, 48, 100, 250].map((amount) => <button key={amount} type="button" className={quantity === amount ? styles.selectedPill : ""} onClick={() => setQuantity(amount)} aria-pressed={quantity === amount}>{amount}</button>)}</div>
              </div>
              {designMode === "ARTWORK" && (
                <>
                  <div className={styles.startSectionHeading}><span>Artwork</span><small>Transparent PNG or SVG gives the cleanest proof</small></div>
                  <div
                    className={`${styles.dropzone} ${dragging ? styles.dropzoneActive : ""}`}
                    onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
                    onDragLeave={() => setDragging(false)}
                    onDrop={(event) => {
                      event.preventDefault();
                      setDragging(false);
                      const file = event.dataTransfer.files[0];
                      if (file) void handleFile(file);
                    }}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") inputRef.current?.click();
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    {artwork ? (
                      <>
                        <div className={styles.uploadedIcon}><ImagePlus size={24} /></div>
                        <strong>{artwork.file.name}</strong>
                        <span>{artwork.naturalWidth} × {artwork.naturalHeight} px · {formatBytes(artwork.file.size)}</span>
                        <button type="button" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}>Replace artwork</button>
                      </>
                    ) : (
                      <>
                        <UploadCloud size={28} aria-hidden />
                        <strong>Drop artwork here</strong>
                        <span>or select a file · PNG, JPG, WebP, SVG · 20 MB max</span>
                        <button type="button">Choose artwork</button>
                      </>
                    )}
                    <input
                      ref={inputRef}
                      className={styles.hiddenInput}
                      type="file"
                      accept={ACCEPTED_TYPES.join(",")}
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) void handleFile(file);
                        event.target.value = "";
                      }}
                    />
                  </div>
                </>
              )}
              {designMode === "LETTERING" && (
                <>
                  <div className={styles.startSectionHeading}><span>Lettering</span><small>{money(LETTERING_RATE_PER_LETTER)} per letter, 1 thread color included</small></div>
                  <label className={styles.field}>
                    <span>Text to embroider</span>
                    <input
                      value={letteringText}
                      onChange={(event) => setLetteringText(event.target.value.slice(0, 60))}
                      placeholder="Amelia"
                      maxLength={60}
                    />
                  </label>
                  <fieldset className={styles.choiceGroup}>
                    <legend>Font</legend>
                    {LETTERING_FONTS.map((option) => (
                      <button
                        key={option.value}
                        type="button"
                        className={letteringFont === option.value ? styles.choiceSelected : ""}
                        onClick={() => setLetteringFont(option.value)}
                        aria-pressed={letteringFont === option.value}
                        style={{ fontFamily: option.cssFont }}
                      >
                        <strong style={{ fontFamily: option.cssFont }}>Aa</strong>
                        <small>{option.label}</small>
                      </button>
                    ))}
                  </fieldset>
                  <div className={styles.analysisLine}>
                    <Sparkles size={14} /> {countLetteringCharacters(letteringText)} billable character{countLetteringCharacters(letteringText) === 1 ? "" : "s"} · spaces are free
                  </div>
                </>
              )}
              <label className={styles.field}>
                <span>Design name</span>
                <input value={designName} onChange={(event) => setDesignName(event.target.value)} placeholder="Family crest — left chest" maxLength={240} />
              </label>
              {designMode === "ARTWORK" && artwork && (
                <label className={styles.toggleRow}>
                  <input type="checkbox" checked={removeLightBackground} onChange={(event) => setRemoveLightBackground(event.target.checked)} />
                  <span><strong>Remove a light background</strong><small>Useful for logos exported on white.</small></span>
                </label>
              )}
              {designMode === "ARTWORK" && artwork && <div className={styles.analysisLine}><Sparkles size={14} /> {detectedColorCount.toLocaleString()} tonal values detected · preview reduced to {targetColorCount} thread colors</div>}
            </div>
          )}

          {activeStep === 1 && (
            <div className={styles.stepPanel}>
              <StepHeading
                number="02"
                title="Translate color into thread."
                copy={designMode === "LETTERING"
                  ? "One thread color is included in the per-letter rate. Pick more to cycle colors letter-by-letter — each additional color adds a surcharge to the lettering price."
                  : "We’ve matched the dominant artwork colors to the studio palette. Change any spool, then tune weight, density and edge finish."}
              />
              <div className={styles.colorCountRow}>
                <span>{designMode === "LETTERING" ? "Lettering colors" : "Production colors"}</span>
                <div>
                  {(designMode === "LETTERING" ? [1, 2, 3, 4] : [1, 2, 3, 4, 5, 6, 8]).map((count) => (
                    <button
                      key={count}
                      type="button"
                      onClick={() => designMode === "LETTERING" ? setLetteringColorCount(count) : setTargetColorCount(count)}
                      className={(designMode === "LETTERING" ? letteringColorCount : targetColorCount) === count ? styles.selectedPill : ""}
                      aria-pressed={(designMode === "LETTERING" ? letteringColorCount : targetColorCount) === count}
                    >
                      {count}
                    </button>
                  ))}
                </div>
              </div>
              {designMode === "LETTERING" && (
                <small className={styles.fieldHint}>
                  {catalog.loadedThreads.length > 0
                    ? "Showing colors currently threaded on the studio machine."
                    : "No machine is reporting loaded colors right now — showing the full studio palette."}
                </small>
              )}
              <div className={styles.mappingList}>
                {mappings.map((mapping) => (
                  <div className={styles.mappingRow} key={mapping.sequence}>
                    <span className={styles.mappingNumber}>{String(mapping.sequence).padStart(2, "0")}</span>
                    {designMode === "ARTWORK" && (
                      <>
                        <span className={styles.sourceSwatch} style={{ backgroundColor: mapping.sourceHex }} title={`Artwork ${mapping.sourceHex}`} />
                        <ArrowRight size={14} aria-hidden />
                      </>
                    )}
                    <span className={styles.threadSwatch} style={{ backgroundColor: mapping.targetHex }} />
                    <label>
                      <span className={styles.visuallyHidden}>Thread for color {mapping.sequence}</span>
                      <select value={threadKey(threadForMapping(mapping, threadChoicesForMode))} onChange={(event) => updateMapping(mapping.sequence, event.target.value)}>
                        {threadChoicesForMode.map((thread) => <option key={threadKey(thread)} value={threadKey(thread)}>{thread.name} · {thread.manufacturerCode}</option>)}
                      </select>
                      <ChevronDown size={13} aria-hidden />
                    </label>
                    {designMode === "ARTWORK" && <span className={styles.coverage}>{Math.round(mapping.coverage * 100)}%</span>}
                  </div>
                ))}
              </div>
              <div className={styles.twoColumns}>
                <fieldset className={styles.choiceGroup}>
                  <legend>Thread weight</legend>
                  {(["W30", "W40", "W60"] as ThreadWeightChoice[]).map((weight) => (
                    <button key={weight} type="button" className={threadWeight === weight ? styles.choiceSelected : ""} onClick={() => setThreadWeight(weight)} aria-pressed={threadWeight === weight}>
                      <strong>{weight.replace("W", "")} wt</strong><small>{weight === "W30" ? "Bold" : weight === "W60" ? "Fine detail" : "Studio standard"}</small>
                    </button>
                  ))}
                </fieldset>
                <label className={styles.rangeField}>
                  <span>Stitch density <strong>{densityMm.toFixed(2)} mm</strong></span>
                  <input type="range" min="0.3" max="0.65" step="0.01" value={densityMm} onChange={(event) => setDensityMm(Number(event.target.value))} />
                  <small><span>Dense</span><span>Open</span></small>
                </label>
              </div>
              {designMode === "ARTWORK" && (
                <>
                  <fieldset className={`${styles.choiceGroup} ${styles.constructionGroup}`}>
                    <legend>Stitch construction</legend>
                    {STITCH_STYLES.map((style) => (
                      <button key={style} type="button" className={stitchStyle === style ? styles.choiceSelected : ""} onClick={() => setStitchStyle(style)} aria-pressed={stitchStyle === style}>
                        <strong>{stitchStyleLabel(style)}</strong><small>{STITCH_STYLE_COPY[style]}</small>
                      </button>
                    ))}
                  </fieldset>
                  <fieldset className={styles.borderGroup}>
                    <legend>Edge finish</legend>
                    {(["NONE", "SATIN", "MERROW"] as BorderStyle[]).map((style) => (
                      <button key={style} type="button" className={borderStyle === style ? styles.choiceSelected : ""} onClick={() => setBorderStyle(style)} aria-pressed={borderStyle === style}>
                        <span className={`${styles.borderSample} ${styles[`border${style}`]}`} />
                        <strong>{style === "NONE" ? "No border" : style === "SATIN" ? "Satin edge" : "Merrow edge"}</strong>
                      </button>
                    ))}
                  </fieldset>
                  {borderStyle !== "NONE" && (
                    <div className={styles.inlineFields}>
                      <label className={styles.colorField}><span>Border color</span><input type="color" value={borderColor} onChange={(event) => setBorderColor(event.target.value.toUpperCase())} /><code>{borderColor}</code></label>
                      <label className={styles.field}><span>Border width (mm)</span><input type="number" min="0.5" max="6" step="0.5" value={borderWidthMm} onChange={(event) => setBorderWidthMm(Number(event.target.value))} /></label>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeStep === 2 && (
            <div className={styles.stepPanel}>
              <StepHeading number="03" title="Set scale and placement." copy="Describe where on your item the design should go, then size and position it. The studio confirms exact feasibility once your item arrives." />
              <div className={styles.productRecap}>
                <span><PackageCheck size={18} /><span><small>Item type</small><strong>{objectTypeLabel}</strong></span></span>
                <span><small>Order quantity</small><strong>{quantity} units</strong></span>
                <button type="button" onClick={() => { setError(null); setActiveStep(0); }}>Change</button>
              </div>
              <label className={styles.field}>
                <span>Placement</span>
                <input
                  value={placementName}
                  onChange={(event) => setPlacementName(event.target.value)}
                  placeholder="Left chest, full back, sleeve…"
                  maxLength={160}
                />
              </label>
              <div className={styles.sizeGrid}>
                <label className={styles.field}><span>Width (in)</span><input type="number" min="0.25" max={15} step="0.05" value={Number(widthInches.toFixed(2))} onChange={(event) => updateWidth(Number(event.target.value))} /></label>
                <button type="button" className={`${styles.aspectButton} ${aspectLocked ? styles.aspectLocked : ""}`} onClick={() => setAspectLocked((locked) => !locked)} title="Lock artwork aspect ratio" aria-pressed={aspectLocked}><Lock size={14} /><span>{aspectLocked ? "Locked" : "Free"}</span></button>
                <label className={styles.field}><span>Height (in)</span><input type="number" min="0.25" max={15} step="0.05" value={Number(heightInches.toFixed(2))} onChange={(event) => updateHeight(Number(event.target.value))} /></label>
              </div>
              <div className={styles.placementSliders}>
                <label className={styles.rangeField}><span>Horizontal placement <strong>{positionX > 0 ? "+" : ""}{positionX.toFixed(2)}</strong></span><input type="range" min="-1" max="1" step="0.01" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label>
                <label className={styles.rangeField}><span>Vertical placement <strong>{positionY > 0 ? "+" : ""}{positionY.toFixed(2)}</strong></span><input type="range" min="-1" max="1" step="0.01" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label>
                <label className={styles.rangeField}><span>Rotation <strong>{rotationDegrees}°</strong></span><input type="range" min="-20" max="20" step="1" value={rotationDegrees} onChange={(event) => setRotationDegrees(Number(event.target.value))} /></label>
              </div>
              <div className={styles.inlineFields}>
                <label className={styles.colorField}><span>Item color</span><input type="color" value={garmentColor} onChange={(event) => setGarmentColor(event.target.value.toUpperCase())} /><code>{garmentColor}</code></label>
                <button type="button" className={styles.resetButton} onClick={() => { setPositionX(-0.32); setPositionY(0.22); setRotationDegrees(0); }}><RotateCcw size={14} /> Reset placement</button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className={styles.stepPanel}>
              <StepHeading number="04" title="Prepare the studio request." copy={`Review the ${objectTypeLabel.toLowerCase()} order for ${quantity} units, then add the contact who will receive proofs and secure order updates. No payment is taken here.`} />
              {designMode === "LETTERING" && (
                <div className={styles.analysisLine}>
                  <Sparkles size={14} /> Custom lettering: “{letteringText.trim()}” · {countLetteringCharacters(letteringText)} letters · {mappings.length} color{mappings.length === 1 ? "" : "s"}
                </div>
              )}
              <fieldset className={styles.projectTypes}>
                <legend>This project is for</legend>
                {([
                  ["PERSONAL", "Personal"], ["CORPORATE", "A company"], ["INSTITUTIONAL", "An institution"], ["OTHER", "Something else"],
                ] as const).map(([value, label]) => <button key={value} type="button" className={projectType === value ? styles.choiceSelected : ""} onClick={() => setProjectType(value)} aria-pressed={projectType === value}>{label}</button>)}
              </fieldset>
              <div className={styles.twoColumns}>
                <label className={styles.field}><span>Your name *</span><input autoComplete="name" value={customer.name} onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className={styles.field}><span>Email *</span><input type="email" autoComplete="email" value={customer.email} onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className={styles.field}><span>Mobile number *</span><input type="tel" inputMode="tel" autoComplete="tel" value={customer.phone} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} /><small className={styles.fieldHint}>Used for secure order access after submission.</small></label>
                <label className={styles.field}><span>Organization</span><input autoComplete="organization" value={customer.organization} onChange={(event) => setCustomer((current) => ({ ...current, organization: event.target.value }))} /></label>
              </div>
              <label className={styles.field}><span>Notes for the atelier</span><textarea rows={4} value={customer.notes} onChange={(event) => setCustomer((current) => ({ ...current, notes: event.target.value }))} placeholder="Material, deadline, sizing mix, or anything the studio should know." /></label>
              <label className={styles.honeypot} aria-hidden><span>Website</span><input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
              <label className={styles.consent}><input type="checkbox" checked={customer.consent} onChange={(event) => setCustomer((current) => ({ ...current, consent: event.target.checked }))} /><span>I agree that Fine Line Studio may contact me about this configuration and retain the uploaded artwork for production review.</span></label>
            </div>
          )}

          {error && <div className={styles.error} role="alert">{error}</div>}
          <div className={styles.navigationButtons}>
            <button type="button" className={styles.backButton} disabled={activeStep === 0 || submitting} onClick={() => { setError(null); setActiveStep((step) => Math.max(0, step - 1)); }}><ArrowLeft size={14} /> Back</button>
            {activeStep < 3 ? (
              <button type="button" className={styles.primaryButton} onClick={nextStep} disabled={processing}>Continue <ArrowRight size={14} /></button>
            ) : (
              <button type="button" className={styles.primaryButton} onClick={() => void submitConfiguration()} disabled={submitting || processing}>
                {submitting ? <><LoaderCircle className={styles.spinner} size={15} /> {uploadProgress < 100 ? `Uploading ${uploadProgress}%` : "Sending to studio"}</> : <>Send to the atelier <ArrowRight size={14} /></>}
              </button>
            )}
          </div>
        </div>

        <aside className={styles.previewColumn} aria-label="Live embroidery proof and estimate">
          <div className={styles.previewCard}>
            <div className={styles.previewHeader}><span>Live studio proof</span><span><span className={styles.liveDot} /> 3D preview</span></div>
            <div className={styles.previewStage}>
              <EmbroideryPreview3D
                textureUrl={textureMaps?.colorUrl ?? null}
                heightTextureUrl={textureMaps?.heightUrl ?? null}
                normalTextureUrl={textureMaps?.normalUrl ?? null}
                stitchLayers={textureMaps?.stitchLayers ?? EMPTY_STITCH_LAYERS}
                garmentColor={garmentColor}
                productCategory={objectType}
                widthInches={widthInches}
                heightInches={heightInches}
                positionX={positionX}
                positionY={positionY}
                rotationDegrees={rotationDegrees}
                densityMm={densityMm}
                threadWeight={threadWeight}
                zoom={previewZoom}
                onZoomChange={setPreviewZoom}
                className={styles.threePreview}
              />
              {!textureMaps?.colorUrl && (
                <div className={styles.previewEmpty}>
                  {processing ? <LoaderCircle className={styles.spinner} size={22} /> : <Maximize2 size={22} />}
                  <span>
                    {designMode === "LETTERING"
                      ? processing ? "Stitching your lettering…" : "Type your lettering to see a live thread proof"
                      : processing ? "Translating artwork into thread…" : "Your thread proof will appear here"}
                  </span>
                </div>
              )}
              <div className={styles.zoomControls} aria-label="Preview zoom controls">
                <button type="button" aria-label="Zoom out" disabled={previewZoom <= 0.65} onClick={() => setPreviewZoom((value) => Math.max(0.65, Number((value - 0.25).toFixed(2))))}><ZoomOut size={14} /></button>
                <button type="button" aria-label="Reset zoom" onClick={() => setPreviewZoom(1)}>{Math.round(previewZoom * 100)}%</button>
                <button type="button" aria-label="Zoom in" disabled={previewZoom >= 2.75} onClick={() => setPreviewZoom((value) => Math.min(2.75, Number((value + 0.25).toFixed(2))))}><ZoomIn size={14} /></button>
              </div>
              <span className={styles.previewHint}>Drag to rotate · scroll or use controls to zoom</span>
            </div>
            <div className={styles.proofMeta}>
              <div><span>Item</span><strong>{objectTypeLabel}</strong></div>
              <div><span>Placement</span><strong>{placementName.trim() || "—"}</strong></div>
              <div><span>Finished size</span><strong>{widthInches.toFixed(2)} × {heightInches.toFixed(2)} in</strong></div>
              <div>
                <span>Thread construction</span>
                <strong>
                  {designMode === "LETTERING"
                    ? `Lettering · ${threadWeight.replace("W", "")} wt · ${mappings.length} colors`
                    : `${stitchStyleLabel(stitchStyle)} · ${threadWeight.replace("W", "")} wt · ${mappings.length || targetColorCount} colors`}
                </strong>
              </div>
            </div>
          </div>
          <div className={styles.quoteCard}>
            <div><p className={styles.eyebrow}>Working estimate</p><strong className={styles.quoteTotal}>{money(quote.total)}</strong></div>
            <dl>
              <div><dt>One-time setup</dt><dd>{money(quote.setupFee)}</dd></div>
              {designMode === "LETTERING" && (
                <div><dt>{countLetteringCharacters(letteringText)} letters · {mappings.length} color{mappings.length === 1 ? "" : "s"}</dt><dd>{money(quote.unitDecoration)} / object</dd></div>
              )}
              <div><dt>{quantity} objects · {money(quote.unitPrice)} each</dt><dd>{money(quote.unitPrice * quantity)}</dd></div>
              <div><dt>Estimated stitches</dt><dd>{quote.estimatedStitches.toLocaleString()}</dd></div>
              {quote.volumeSavings > 0 && <div className={styles.savings}><dt>Volume savings</dt><dd>−{money(quote.volumeSavings)}</dd></div>}
            </dl>
            <p>Indicative only. A studio review and sew test confirm the final quote.</p>
          </div>
        </aside>
      </div>
    </section>
  );
}

function StepHeading({ number, title, copy }: { number: string; title: string; copy: string }) {
  return <div className={styles.stepHeading}><span>{number}</span><div><h2>{title}</h2><p>{copy}</p></div></div>;
}
