"use client";

import { upload } from "@vercel/blob/client";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ImagePlus,
  LoaderCircle,
  Lock,
  Maximize2,
  RotateCcw,
  Sparkles,
  UploadCloud,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LogoLockup } from "@/components/story/marks";
import { analyzeColors } from "@/lib/services/image-processing/color-analysis";
import { quantizeColors, type QuantizeResult } from "@/lib/services/image-processing/quantize";
import type { PaletteEntry, PixelBuffer } from "@/lib/services/image-processing/types";
import { loadImageFile, formatBytes } from "@/lib/wizard/canvas-utils";
import { deltaE76, hexToLab } from "@/lib/color";
import {
  FALLBACK_CATALOG,
  type ConfiguratorCatalog,
  type PublicProduct,
  type PublicThreadColor,
} from "@/lib/configurator/catalog";
import { createThreadTextureDataUrl, prepareArtworkBuffer } from "@/lib/configurator/artwork-texture";
import { calculateConfiguratorQuote, type BorderStyle, type ThreadWeightChoice } from "@/lib/configurator/pricing";
import type { ConfiguratorThreadMapping } from "@/lib/configurator/schema";
import type { ConfiguratorUploadIntent } from "@/lib/configurator/upload-intent";
import styles from "./embroidery-configurator.module.css";

const EmbroideryPreview3D = dynamic(
  () => import("./embroidery-preview-3d").then((module) => module.EmbroideryPreview3D),
  { ssr: false },
);

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/svg+xml"] as const;
const STEPS = ["Artwork", "Thread & finish", "Size & placement", "Order details"] as const;

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
  uploadIntent: ConfiguratorUploadIntent;
}

function catalogKey(item: { id: string | null; name: string }) {
  return item.id ?? `fallback:${item.name}`;
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

function safeArtworkName(fileName: string) {
  const normalized = fileName.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "-");
  return normalized.replace(/^-+|-+$/g, "").slice(-180) || "artwork.png";
}

function productFor(catalog: ConfiguratorCatalog, key: string): PublicProduct {
  return catalog.products.find((product) => catalogKey(product) === key) ?? catalog.products[0];
}

function money(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(value);
}

export function EmbroideryConfigurator({ embedded, uploadIntent }: EmbroideryConfiguratorProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const startedAtRef = useRef(Date.now());
  const idempotencyRef = useRef(
    typeof globalThis.crypto?.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `cfg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
  );
  const [catalog, setCatalog] = useState<ConfiguratorCatalog>(FALLBACK_CATALOG);
  const [activeStep, setActiveStep] = useState(0);
  const [artwork, setArtwork] = useState<ArtworkState | null>(null);
  const [quantized, setQuantized] = useState<QuantizedState | null>(null);
  const [mappings, setMappings] = useState<ConfiguratorThreadMapping[]>([]);
  const [targetColorCount, setTargetColorCount] = useState(4);
  const [detectedColorCount, setDetectedColorCount] = useState(0);
  const [removeLightBackground, setRemoveLightBackground] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [textureUrl, setTextureUrl] = useState<string | null>(null);
  const [designName, setDesignName] = useState("");
  const [threadWeight, setThreadWeight] = useState<ThreadWeightChoice>("W40");
  const [densityMm, setDensityMm] = useState(0.45);
  const [borderStyle, setBorderStyle] = useState<BorderStyle>("NONE");
  const [borderColor, setBorderColor] = useState("#1A1A1A");
  const [borderWidthMm, setBorderWidthMm] = useState(2);
  const [productKey, setProductKey] = useState(catalogKey(FALLBACK_CATALOG.products[0]));
  const [placementKey, setPlacementKey] = useState(catalogKey(FALLBACK_CATALOG.products[0].placements[0]));
  const [garmentColor, setGarmentColor] = useState("#E9E1D4");
  const [widthInches, setWidthInches] = useState(3.5);
  const [heightInches, setHeightInches] = useState(2.5);
  const [aspectLocked, setAspectLocked] = useState(true);
  const [positionX, setPositionX] = useState(-0.32);
  const [positionY, setPositionY] = useState(0.22);
  const [rotationDegrees, setRotationDegrees] = useState(0);
  const [quantity, setQuantity] = useState(12);
  const [projectType, setProjectType] = useState<"PERSONAL" | "CORPORATE" | "INSTITUTIONAL" | "OTHER">("PERSONAL");
  const [customer, setCustomer] = useState({ name: "", email: "", phone: "", organization: "", notes: "", consent: false });
  const [website, setWebsite] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [result, setResult] = useState<SubmissionResult | null>(null);

  const product = productFor(catalog, productKey);
  const placement = product.placements.find((item) => catalogKey(item) === placementKey) ?? product.placements[0];
  const sourceAspect = artwork ? artwork.naturalWidth / artwork.naturalHeight : widthInches / heightInches;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/public/configurator/options")
      .then((response) => response.json())
      .then((data: ConfiguratorCatalog) => {
        if (cancelled || !data.products?.length || !data.threads?.length) return;
        setCatalog(data);
        setProductKey((current) => data.products.some((item) => catalogKey(item) === current) ? current : catalogKey(data.products[0]));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!product?.placements.length) return;
    if (!product.placements.some((item) => catalogKey(item) === placementKey)) {
      setPlacementKey(catalogKey(product.placements[0]));
    }
  }, [placementKey, product]);

  useEffect(() => {
    if (!placement) return;
    setWidthInches((value) => Math.min(value, placement.maxWidthInches));
    setHeightInches((value) => Math.min(value, placement.maxHeightInches));
  }, [placement]);

  useEffect(() => {
    if (!artwork) return;
    let cancelled = false;
    setProcessing(true);
    const timer = window.setTimeout(() => {
      const preparedBuffer = prepareArtworkBuffer(artwork.buffer, removeLightBackground);
      const next = quantizeColors(preparedBuffer, targetColorCount, { maxSamples: 12_000, iterations: 10 });
      if (cancelled) return;
      setQuantized({ ...next, preparedBuffer });
      setMappings(mappingsFor(next.palette, catalog.threads));
      setProcessing(false);
    }, 30);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [artwork, catalog.threads, removeLightBackground, targetColorCount]);

  useEffect(() => {
    if (!quantized || mappings.length !== quantized.palette.length) {
      setTextureUrl(null);
      return;
    }
    const timer = window.setTimeout(() => {
      setTextureUrl(createThreadTextureDataUrl({
        buffer: quantized.preparedBuffer,
        clusters: quantized.pixelClusters,
        targetHexes: mappings.map((mapping) => mapping.targetHex),
        borderStyle,
        borderColor,
        borderWidthMm,
        densityMm,
        threadWeight,
      }));
    }, 24);
    return () => window.clearTimeout(timer);
  }, [borderColor, borderStyle, borderWidthMm, densityMm, mappings, quantized, threadWeight]);

  const quote = useMemo(() => calculateConfiguratorQuote({
    widthInches,
    heightInches,
    quantity,
    colorCount: Math.max(1, mappings.length),
    densityMm,
    threadWeight,
    borderStyle,
    borderWidthMm,
    productCategory: product.category,
  }), [borderStyle, borderWidthMm, densityMm, heightInches, mappings.length, product.category, quantity, threadWeight, widthInches]);

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
      const prepared = prepareArtworkBuffer(loaded.buffer, true);
      const analysis = analyzeColors(prepared, { step: 18 });
      const recommended = Math.max(1, Math.min(6, analysis.detectedColorCount <= 3 ? analysis.detectedColorCount : 4));
      setDetectedColorCount(analysis.detectedColorCount);
      setTargetColorCount(recommended);
      setArtwork({ file, ...loaded });
      setDesignName(file.name.replace(/\.[^.]+$/, ""));
      const aspect = loaded.naturalWidth / loaded.naturalHeight;
      const nextWidth = Math.min(3.5, placement?.maxWidthInches ?? 3.5);
      setWidthInches(nextWidth);
      setHeightInches(Math.min(nextWidth / aspect, placement?.maxHeightInches ?? 4));
    } catch {
      setError("We could not read that artwork file. Try exporting it again as PNG or SVG.");
      setProcessing(false);
    }
  }, [placement]);

  function updateMapping(sequence: number, key: string) {
    const thread = catalog.threads.find((item) => threadKey(item) === key);
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
    const next = Math.max(0.25, Math.min(value, placement?.maxWidthInches ?? 15));
    setWidthInches(next);
    if (aspectLocked) setHeightInches(Math.max(0.25, Math.min(next / sourceAspect, placement?.maxHeightInches ?? 15)));
  }

  function updateHeight(value: number) {
    const next = Math.max(0.25, Math.min(value, placement?.maxHeightInches ?? 15));
    setHeightInches(next);
    if (aspectLocked) setWidthInches(Math.max(0.25, Math.min(next * sourceAspect, placement?.maxWidthInches ?? 15)));
  }

  function canContinue() {
    if (activeStep === 0 && !artwork) return "Upload artwork to continue.";
    if (activeStep === 0 && !designName.trim()) return "Give this design a name.";
    if (activeStep === 1 && mappings.length === 0) return "Choose at least one production color.";
    if (activeStep === 2 && (!product || !placement)) return "Choose a product and placement.";
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
    if (!artwork) {
      setActiveStep(0);
      setError("Upload artwork before submitting.");
      return;
    }
    if (!customer.name.trim() || !customer.email.trim() || !customer.consent) {
      setError("Add your name and email, then confirm that the studio may contact you about this request.");
      return;
    }
    setError(null);
    setSubmitting(true);
    setUploadProgress(0);

    try {
      const blob = await upload(
        `configurator/${uploadIntent.nonce}/${Date.now()}-${safeArtworkName(artwork.file.name)}`,
        artwork.file,
        {
          access: "public",
          handleUploadUrl: "/api/public/configurator/upload",
          clientPayload: JSON.stringify({ uploadIntent: uploadIntent.token }),
          multipart: artwork.file.size > 5 * 1024 * 1024,
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
            fileName: artwork.file.name,
            contentType: artwork.file.type,
            fileSizeBytes: artwork.file.size,
            widthPx: artwork.naturalWidth,
            heightPx: artwork.naturalHeight,
          },
          configuration: {
            designName: designName.trim(),
            productId: product.id,
            productName: product.name,
            productCategory: product.category,
            locationId: placement.id,
            placementName: placement.name,
            garmentColorHex: garmentColor,
            widthInches,
            heightInches,
            positionX,
            positionY,
            rotationDegrees,
            threadWeight,
            densityMm,
            colors: mappings,
            border: { style: borderStyle, colorHex: borderColor, widthMm: borderWidthMm },
            quantity,
            notes: customer.notes,
          },
        }),
      });
      const payload = await response.json() as SubmissionResult & { error?: string };
      if (!response.ok) throw new Error(payload.error || "The studio could not receive this configuration.");
      setResult(payload);
      notifyParent({ type: "submitted", orderReference: payload.orderReference });
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "The studio could not receive this configuration.");
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <section className={`${styles.configurator} ${embedded ? styles.embedded : ""}`}>
        <div className={styles.successPanel}>
          <div className={styles.successMark}><Check aria-hidden size={30} /></div>
          <p className={styles.eyebrow}>Configuration received</p>
          <h1>Your idea is now with the studio.</h1>
          <p>We’ll review stitch feasibility, confirm the material and placement, and return with a production-ready quote.</p>
          <div className={styles.referenceCard}>
            <span>Studio reference</span>
            <strong>{result.orderReference}</strong>
            <span>Current estimate</span>
            <strong>{money(result.quote.total)}</strong>
          </div>
          <p className={styles.finePrint}>The estimate is not a charge. Final pricing follows artwork and material review.</p>
        </div>
      </section>
    );
  }

  return (
    <section className={`${styles.configurator} ${embedded ? styles.embedded : ""}`}>
      {!embedded && (
        <header className={styles.header}>
          <Link href="/" className={styles.brand} aria-label="Fine Line Studio home">
            <svg viewBox="-115 -120 230 260" aria-hidden><LogoLockup id="configurator-brand" showThread /></svg>
            <span><strong>FINE LINE</strong><small>STUDIO</small></span>
          </Link>
          <div className={styles.secureLabel}><Lock size={12} aria-hidden /> Secure artwork intake</div>
        </header>
      )}

      <div className={styles.intro}>
        <div>
          <p className={styles.eyebrow}>Embroidery atelier</p>
          <h1>See your mark<br />in thread.</h1>
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
              <StepHeading number="01" title="Begin with the artwork." copy="Transparent PNG or SVG gives the cleanest proof. A photograph or JPEG works too; we’ll isolate a light background for you." />
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
              <label className={styles.field}>
                <span>Design name</span>
                <input value={designName} onChange={(event) => setDesignName(event.target.value)} placeholder="Family crest — left chest" maxLength={240} />
              </label>
              {artwork && (
                <label className={styles.toggleRow}>
                  <input type="checkbox" checked={removeLightBackground} onChange={(event) => setRemoveLightBackground(event.target.checked)} />
                  <span><strong>Remove a light background</strong><small>Useful for logos exported on white.</small></span>
                </label>
              )}
              {artwork && <div className={styles.analysisLine}><Sparkles size={14} /> {detectedColorCount.toLocaleString()} tonal values detected · preview reduced to {targetColorCount} thread colors</div>}
            </div>
          )}

          {activeStep === 1 && (
            <div className={styles.stepPanel}>
              <StepHeading number="02" title="Translate color into thread." copy="We’ve matched the dominant artwork colors to the studio palette. Change any spool, then tune weight, density and edge finish." />
              <div className={styles.colorCountRow}>
                <span>Production colors</span>
                <div>
                  {[1, 2, 3, 4, 5, 6, 8].map((count) => (
                    <button key={count} type="button" onClick={() => setTargetColorCount(count)} className={targetColorCount === count ? styles.selectedPill : ""} aria-pressed={targetColorCount === count}>{count}</button>
                  ))}
                </div>
              </div>
              <div className={styles.mappingList}>
                {mappings.map((mapping) => (
                  <div className={styles.mappingRow} key={mapping.sequence}>
                    <span className={styles.mappingNumber}>{String(mapping.sequence).padStart(2, "0")}</span>
                    <span className={styles.sourceSwatch} style={{ backgroundColor: mapping.sourceHex }} title={`Artwork ${mapping.sourceHex}`} />
                    <ArrowRight size={14} aria-hidden />
                    <span className={styles.threadSwatch} style={{ backgroundColor: mapping.targetHex }} />
                    <label>
                      <span className={styles.visuallyHidden}>Thread for color {mapping.sequence}</span>
                      <select value={threadKey(threadForMapping(mapping, catalog.threads))} onChange={(event) => updateMapping(mapping.sequence, event.target.value)}>
                        {catalog.threads.map((thread) => <option key={threadKey(thread)} value={threadKey(thread)}>{thread.name} · {thread.manufacturerCode}</option>)}
                      </select>
                      <ChevronDown size={13} aria-hidden />
                    </label>
                    <span className={styles.coverage}>{Math.round(mapping.coverage * 100)}%</span>
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
            </div>
          )}

          {activeStep === 2 && (
            <div className={styles.stepPanel}>
              <StepHeading number="03" title="Set scale and placement." copy="Choose the object and its embroidery zone. The limits below come from the live StitchOS product catalog and production setups." />
              <div className={styles.twoColumns}>
                <label className={styles.field}><span>Object</span><select value={productKey} onChange={(event) => setProductKey(event.target.value)}>{catalog.products.map((item) => <option key={catalogKey(item)} value={catalogKey(item)}>{item.name}</option>)}</select></label>
                <label className={styles.field}><span>Placement</span><select value={placementKey} onChange={(event) => setPlacementKey(event.target.value)}>{product.placements.map((item) => <option key={catalogKey(item)} value={catalogKey(item)}>{item.name}</option>)}</select></label>
              </div>
              <div className={styles.catalogNote}><span>{product.material}</span><span>Maximum {placement.maxWidthInches} × {placement.maxHeightInches} in</span></div>
              <div className={styles.sizeGrid}>
                <label className={styles.field}><span>Width (in)</span><input type="number" min="0.25" max={placement.maxWidthInches} step="0.05" value={Number(widthInches.toFixed(2))} onChange={(event) => updateWidth(Number(event.target.value))} /></label>
                <button type="button" className={`${styles.aspectButton} ${aspectLocked ? styles.aspectLocked : ""}`} onClick={() => setAspectLocked((locked) => !locked)} title="Lock artwork aspect ratio" aria-pressed={aspectLocked}><Lock size={14} /><span>{aspectLocked ? "Locked" : "Free"}</span></button>
                <label className={styles.field}><span>Height (in)</span><input type="number" min="0.25" max={placement.maxHeightInches} step="0.05" value={Number(heightInches.toFixed(2))} onChange={(event) => updateHeight(Number(event.target.value))} /></label>
              </div>
              <div className={styles.placementSliders}>
                <label className={styles.rangeField}><span>Horizontal placement <strong>{positionX > 0 ? "+" : ""}{positionX.toFixed(2)}</strong></span><input type="range" min="-1" max="1" step="0.01" value={positionX} onChange={(event) => setPositionX(Number(event.target.value))} /></label>
                <label className={styles.rangeField}><span>Vertical placement <strong>{positionY > 0 ? "+" : ""}{positionY.toFixed(2)}</strong></span><input type="range" min="-1" max="1" step="0.01" value={positionY} onChange={(event) => setPositionY(Number(event.target.value))} /></label>
                <label className={styles.rangeField}><span>Rotation <strong>{rotationDegrees}°</strong></span><input type="range" min="-20" max="20" step="1" value={rotationDegrees} onChange={(event) => setRotationDegrees(Number(event.target.value))} /></label>
              </div>
              <div className={styles.inlineFields}>
                <label className={styles.colorField}><span>Material color</span><input type="color" value={garmentColor} onChange={(event) => setGarmentColor(event.target.value.toUpperCase())} /><code>{garmentColor}</code></label>
                <button type="button" className={styles.resetButton} onClick={() => { setPositionX(-0.32); setPositionY(0.22); setRotationDegrees(0); }}><RotateCcw size={14} /> Reset placement</button>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className={styles.stepPanel}>
              <StepHeading number="04" title="Prepare the studio request." copy="The estimate updates with quantity. Tell us who the proof belongs to; no payment is taken here." />
              <label className={styles.quantityField}><span>Quantity</span><div><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><input type="number" min="1" max="5000" value={quantity} onChange={(event) => setQuantity(Math.max(1, Math.min(5000, Number(event.target.value))))} /><button type="button" onClick={() => setQuantity((value) => Math.min(5000, value + 1))}>+</button></div></label>
              <div className={styles.quantityPresets}>{[1, 12, 24, 48, 100, 250].map((amount) => <button key={amount} type="button" className={quantity === amount ? styles.selectedPill : ""} onClick={() => setQuantity(amount)} aria-pressed={quantity === amount}>{amount}</button>)}</div>
              <fieldset className={styles.projectTypes}>
                <legend>This project is for</legend>
                {([
                  ["PERSONAL", "Personal"], ["CORPORATE", "A company"], ["INSTITUTIONAL", "An institution"], ["OTHER", "Something else"],
                ] as const).map(([value, label]) => <button key={value} type="button" className={projectType === value ? styles.choiceSelected : ""} onClick={() => setProjectType(value)} aria-pressed={projectType === value}>{label}</button>)}
              </fieldset>
              <div className={styles.twoColumns}>
                <label className={styles.field}><span>Your name *</span><input autoComplete="name" value={customer.name} onChange={(event) => setCustomer((current) => ({ ...current, name: event.target.value }))} /></label>
                <label className={styles.field}><span>Email *</span><input type="email" autoComplete="email" value={customer.email} onChange={(event) => setCustomer((current) => ({ ...current, email: event.target.value }))} /></label>
                <label className={styles.field}><span>Phone</span><input type="tel" autoComplete="tel" value={customer.phone} onChange={(event) => setCustomer((current) => ({ ...current, phone: event.target.value }))} /></label>
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
                textureUrl={textureUrl}
                garmentColor={garmentColor}
                productCategory={product.category}
                widthInches={widthInches}
                heightInches={heightInches}
                positionX={positionX}
                positionY={positionY}
                rotationDegrees={rotationDegrees}
                densityMm={densityMm}
                threadWeight={threadWeight}
                className={styles.threePreview}
              />
              {!textureUrl && <div className={styles.previewEmpty}>{processing ? <LoaderCircle className={styles.spinner} size={22} /> : <Maximize2 size={22} />}<span>{processing ? "Translating artwork into thread…" : "Your thread proof will appear here"}</span></div>}
              <span className={styles.previewHint}>Drag to rotate · scroll to inspect</span>
            </div>
            <div className={styles.proofMeta}>
              <div><span>Object</span><strong>{product.name}</strong></div>
              <div><span>Placement</span><strong>{placement.name}</strong></div>
              <div><span>Finished size</span><strong>{widthInches.toFixed(2)} × {heightInches.toFixed(2)} in</strong></div>
              <div><span>Thread</span><strong>{threadWeight.replace("W", "")} wt · {mappings.length || targetColorCount} colors</strong></div>
            </div>
          </div>
          <div className={styles.quoteCard}>
            <div><p className={styles.eyebrow}>Working estimate</p><strong className={styles.quoteTotal}>{money(quote.total)}</strong></div>
            <dl>
              <div><dt>One-time setup</dt><dd>{money(quote.setupFee)}</dd></div>
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
