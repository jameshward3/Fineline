import { hexToRgb } from "@/lib/color";
import type { PixelBuffer } from "@/lib/services/image-processing/types";
import type { BorderStyle, ThreadWeightChoice } from "./pricing";

export function prepareArtworkBuffer(source: PixelBuffer, removeLightBackground: boolean): PixelBuffer {
  const data = new Uint8ClampedArray(source.data);
  if (removeLightBackground) {
    for (let offset = 0; offset < data.length; offset += 4) {
      const minimum = Math.min(data[offset], data[offset + 1], data[offset + 2]);
      const maximum = Math.max(data[offset], data[offset + 1], data[offset + 2]);
      if (minimum > 238 && maximum - minimum < 14) data[offset + 3] = 0;
    }
  }
  return { data, width: source.width, height: source.height };
}

export function createThreadTextureDataUrl({
  buffer,
  clusters,
  targetHexes,
  borderStyle,
  borderColor,
  borderWidthMm,
  densityMm,
  threadWeight,
}: {
  buffer: PixelBuffer;
  clusters: Int16Array;
  targetHexes: string[];
  borderStyle: BorderStyle;
  borderColor: string;
  borderWidthMm: number;
  densityMm: number;
  threadWeight: ThreadWeightChoice;
}) {
  const recolored = new Uint8ClampedArray(buffer.data);
  const palette = targetHexes.map(hexToRgb);
  for (let pixel = 0, offset = 0; pixel < clusters.length; pixel++, offset += 4) {
    const cluster = clusters[pixel];
    if (cluster < 0 || !palette[cluster]) {
      recolored[offset + 3] = 0;
      continue;
    }
    const color = palette[cluster];
    recolored[offset] = color.r;
    recolored[offset + 1] = color.g;
    recolored[offset + 2] = color.b;
  }

  const sourceCanvas = document.createElement("canvas");
  sourceCanvas.width = buffer.width;
  sourceCanvas.height = buffer.height;
  const sourceContext = sourceCanvas.getContext("2d")!;
  sourceContext.putImageData(new ImageData(recolored, buffer.width, buffer.height), 0, 0);

  const maximumDimension = 900;
  const scale = Math.min(1, maximumDimension / Math.max(buffer.width, buffer.height));
  const drawingWidth = Math.max(1, Math.round(buffer.width * scale));
  const drawingHeight = Math.max(1, Math.round(buffer.height * scale));
  const padding = borderStyle === "NONE" ? 12 : Math.max(18, Math.round(borderWidthMm * 8));
  const canvas = document.createElement("canvas");
  canvas.width = drawingWidth + padding * 2;
  canvas.height = drawingHeight + padding * 2;
  const context = canvas.getContext("2d")!;

  if (borderStyle !== "NONE") {
    const mask = document.createElement("canvas");
    mask.width = drawingWidth;
    mask.height = drawingHeight;
    const maskContext = mask.getContext("2d")!;
    maskContext.drawImage(sourceCanvas, 0, 0, drawingWidth, drawingHeight);
    maskContext.globalCompositeOperation = "source-in";
    maskContext.fillStyle = borderColor;
    maskContext.fillRect(0, 0, drawingWidth, drawingHeight);

    const radius = Math.max(2, Math.round(borderWidthMm * (borderStyle === "MERROW" ? 3.8 : 2.8)));
    const steps = borderStyle === "MERROW" ? 28 : 20;
    for (let index = 0; index < steps; index++) {
      const angle = (index / steps) * Math.PI * 2;
      context.drawImage(mask, padding + Math.cos(angle) * radius, padding + Math.sin(angle) * radius);
    }
  }

  context.drawImage(sourceCanvas, padding, padding, drawingWidth, drawingHeight);
  context.globalCompositeOperation = "source-atop";
  const spacing = Math.max(3, Math.round(3 + densityMm * 8));
  const lineWidth = threadWeight === "W30" ? 1.45 : threadWeight === "W60" ? 0.7 : 1;
  context.lineWidth = lineWidth;
  context.strokeStyle = "rgba(255,255,255,0.23)";
  for (let x = -canvas.height; x < canvas.width + canvas.height; x += spacing) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + canvas.height, canvas.height);
    context.stroke();
  }
  context.strokeStyle = "rgba(22,18,15,0.12)";
  for (let x = -canvas.height + spacing / 2; x < canvas.width + canvas.height; x += spacing) {
    context.beginPath();
    context.moveTo(x, 0);
    context.lineTo(x + canvas.height, canvas.height);
    context.stroke();
  }
  context.globalCompositeOperation = "source-over";
  return canvas.toDataURL("image/png");
}
