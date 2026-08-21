import { hexToRgb } from "@/lib/color";
import type { PixelBuffer } from "@/lib/services/image-processing/types";
import type { BorderStyle, ThreadWeightChoice } from "./pricing";
import {
  createStitchSimulation,
  STITCH_SEGMENT_STRIDE,
  type StitchLayer,
  type StitchStyle,
} from "./stitch-simulation";

export interface ThreadTextureMaps {
  colorUrl: string;
  heightUrl: string;
  normalUrl: string;
  stitchLayers: StitchLayer[];
}

function pathForLayer(layer: StitchLayer, width: number, height: number) {
  const path = new Path2D();
  let totalWidth = 0;
  let count = 0;
  for (let offset = 0; offset < layer.segments.length; offset += STITCH_SEGMENT_STRIDE) {
    const centerX = (layer.segments[offset] + 0.5) * width;
    const centerY = (0.5 - layer.segments[offset + 1]) * height;
    const vectorX = layer.segments[offset + 2] * width;
    const vectorY = -layer.segments[offset + 3] * height;
    path.moveTo(centerX - vectorX / 2, centerY - vectorY / 2);
    path.lineTo(centerX + vectorX / 2, centerY + vectorY / 2);
    totalWidth += layer.segments[offset + 4] * width;
    count++;
  }
  return { path, averageWidth: count ? totalWidth / count : 1 };
}

function drawThreadLayer(context: CanvasRenderingContext2D, layer: StitchLayer, width: number, height: number) {
  const { path, averageWidth } = pathForLayer(layer, width, height);
  const color = hexToRgb(layer.colorHex);
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";

  context.translate(0.55, 0.7);
  context.globalAlpha = 0.42;
  context.lineWidth = averageWidth * 1.55;
  context.strokeStyle = `rgb(${Math.round(color.r * 0.34)} ${Math.round(color.g * 0.34)} ${Math.round(color.b * 0.34)})`;
  context.stroke(path);

  context.translate(-0.55, -0.7);
  context.globalAlpha = 1;
  context.lineWidth = averageWidth * 1.12;
  context.strokeStyle = layer.colorHex;
  context.stroke(path);

  context.translate(-0.32, -0.38);
  context.globalAlpha = 0.48;
  context.lineWidth = Math.max(0.34, averageWidth * 0.24);
  context.strokeStyle = "#FFF8E9";
  context.stroke(path);
  context.restore();
}

function drawHeightLayer(context: CanvasRenderingContext2D, layer: StitchLayer, width: number, height: number) {
  const { path, averageWidth } = pathForLayer(layer, width, height);
  context.save();
  context.lineCap = "round";
  context.lineJoin = "round";
  context.lineWidth = averageWidth * 1.7;
  context.strokeStyle = "#B8B8B8";
  context.stroke(path);
  context.lineWidth = averageWidth * 0.72;
  context.strokeStyle = "#FFFFFF";
  context.stroke(path);
  context.restore();
}

function createNormalMap(heightCanvas: HTMLCanvasElement) {
  const context = heightCanvas.getContext("2d")!;
  const source = context.getImageData(0, 0, heightCanvas.width, heightCanvas.height);
  const output = new ImageData(heightCanvas.width, heightCanvas.height);
  const sourceData = source.data;
  const outputData = output.data;
  const luminance = (x: number, y: number) => {
    const sampleX = Math.min(heightCanvas.width - 1, Math.max(0, x));
    const sampleY = Math.min(heightCanvas.height - 1, Math.max(0, y));
    const offset = (sampleY * heightCanvas.width + sampleX) * 4;
    return sourceData[offset] / 255;
  };
  const strength = 4.8;

  for (let y = 0; y < heightCanvas.height; y++) {
    for (let x = 0; x < heightCanvas.width; x++) {
      const normalX = (luminance(x - 1, y) - luminance(x + 1, y)) * strength;
      const normalY = (luminance(x, y - 1) - luminance(x, y + 1)) * strength;
      const inverseLength = 1 / Math.hypot(normalX, normalY, 1);
      const offset = (y * heightCanvas.width + x) * 4;
      outputData[offset] = Math.round((normalX * inverseLength * 0.5 + 0.5) * 255);
      outputData[offset + 1] = Math.round((normalY * inverseLength * 0.5 + 0.5) * 255);
      outputData[offset + 2] = Math.round((inverseLength * 0.5 + 0.5) * 255);
      outputData[offset + 3] = 255;
    }
  }

  const normalCanvas = document.createElement("canvas");
  normalCanvas.width = heightCanvas.width;
  normalCanvas.height = heightCanvas.height;
  normalCanvas.getContext("2d")!.putImageData(output, 0, 0);
  return normalCanvas;
}

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

export function createThreadTextureMaps({
  buffer,
  clusters,
  targetHexes,
  borderStyle,
  borderColor,
  borderWidthMm,
  densityMm,
  threadWeight,
  stitchStyle,
}: {
  buffer: PixelBuffer;
  clusters: Int16Array;
  targetHexes: string[];
  borderStyle: BorderStyle;
  borderColor: string;
  borderWidthMm: number;
  densityMm: number;
  threadWeight: ThreadWeightChoice;
  stitchStyle: StitchStyle;
}): ThreadTextureMaps {
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
  const stitchLayers = createStitchSimulation({
    sourceWidth: buffer.width,
    sourceHeight: buffer.height,
    sourceClusters: clusters,
    targetHexes,
    outputWidth: canvas.width,
    outputHeight: canvas.height,
    contentX: padding,
    contentY: padding,
    contentWidth: drawingWidth,
    contentHeight: drawingHeight,
    densityMm,
    threadWeight,
    stitchStyle,
    borderStyle,
    borderColor,
    borderWidthMm,
  });
  for (const layer of stitchLayers) drawThreadLayer(context, layer, canvas.width, canvas.height);

  // The height and tangent-space normal maps remain useful at wide zooms;
  // close zooms additionally render every generated strand as geometry.
  const heightCanvas = document.createElement("canvas");
  heightCanvas.width = canvas.width;
  heightCanvas.height = canvas.height;
  const heightContext = heightCanvas.getContext("2d")!;
  heightContext.drawImage(canvas, 0, 0);
  heightContext.globalCompositeOperation = "source-in";
  heightContext.fillStyle = "#555555";
  heightContext.fillRect(0, 0, heightCanvas.width, heightCanvas.height);
  heightContext.globalCompositeOperation = "source-over";
  for (const layer of stitchLayers) drawHeightLayer(heightContext, layer, heightCanvas.width, heightCanvas.height);
  const normalCanvas = createNormalMap(heightCanvas);

  return {
    colorUrl: canvas.toDataURL("image/png"),
    heightUrl: heightCanvas.toDataURL("image/png"),
    normalUrl: normalCanvas.toDataURL("image/png"),
    stitchLayers,
  };
}
