export interface PixelBuffer {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

export function cloneBuffer(buf: PixelBuffer): PixelBuffer {
  return { data: new Uint8ClampedArray(buf.data), width: buf.width, height: buf.height };
}

export function fromImageData(imageData: ImageData): PixelBuffer {
  return { data: new Uint8ClampedArray(imageData.data), width: imageData.width, height: imageData.height };
}

export function toImageData(buf: PixelBuffer): ImageData {
  return new ImageData(new Uint8ClampedArray(buf.data), buf.width, buf.height);
}

export interface PaletteEntry {
  hex: string;
  pixelCount: number;
  coverage: number; // 0-1 share of opaque pixels
}
