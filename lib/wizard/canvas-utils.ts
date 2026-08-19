import type { PixelBuffer } from "@/lib/services/image-processing/types";

export interface LoadedImage {
  buffer: PixelBuffer;
  naturalWidth: number;
  naturalHeight: number;
}

const MAX_WORKING_DIMENSION = 1400;

export async function loadImageFile(file: File): Promise<LoadedImage> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = reject;
    el.src = dataUrl;
  });

  const naturalWidth = img.naturalWidth;
  const naturalHeight = img.naturalHeight;

  const scale = Math.min(1, MAX_WORKING_DIMENSION / Math.max(naturalWidth, naturalHeight));
  const workingWidth = Math.max(1, Math.round(naturalWidth * scale));
  const workingHeight = Math.max(1, Math.round(naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = workingWidth;
  canvas.height = workingHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0, workingWidth, workingHeight);
  const imageData = ctx.getImageData(0, 0, workingWidth, workingHeight);

  return {
    buffer: { data: new Uint8ClampedArray(imageData.data), width: workingWidth, height: workingHeight },
    naturalWidth,
    naturalHeight,
  };
}

export function bufferToDataUrl(buffer: PixelBuffer): string {
  const canvas = document.createElement("canvas");
  canvas.width = buffer.width;
  canvas.height = buffer.height;
  const ctx = canvas.getContext("2d")!;
  const imageData = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
  ctx.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
}

export function bufferToPngBlob(buffer: PixelBuffer): Promise<Blob> {
  const canvas = document.createElement("canvas");
  canvas.width = buffer.width;
  canvas.height = buffer.height;
  const ctx = canvas.getContext("2d")!;
  const imageData = new ImageData(new Uint8ClampedArray(buffer.data), buffer.width, buffer.height);
  ctx.putImageData(imageData, 0, 0);
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob failed"))), "image/png");
  });
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
