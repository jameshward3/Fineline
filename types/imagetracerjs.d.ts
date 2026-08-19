declare module "imagetracerjs" {
  interface RGBA {
    r: number;
    g: number;
    b: number;
    a: number;
  }

  interface ImageTracerOptions {
    ltres?: number;
    qtres?: number;
    pathomit?: number;
    rightangleenhance?: boolean;
    colorsampling?: number;
    numberofcolors?: number;
    mincolorratio?: number;
    colorquantcycles?: number;
    layering?: number;
    pal?: RGBA[];
    scale?: number;
    roundcoords?: number;
    linefilter?: boolean;
    blurradius?: number;
    blurdelta?: number;
  }

  interface TracedPath {
    segments: unknown[];
    boundingbox: [number, number, number, number];
  }

  interface TraceData {
    layers: TracedPath[][];
    palette: RGBA[];
    width: number;
    height: number;
  }

  interface ImgLike {
    width: number;
    height: number;
    data: Uint8ClampedArray;
  }

  interface ImageTracerInstance {
    imagedataToTracedata(imgd: ImgLike, options?: ImageTracerOptions): TraceData;
    svgpathstring(tracedata: TraceData, layerIndex: number, pathIndex: number, options?: ImageTracerOptions): string;
  }

  const ImageTracer: ImageTracerInstance;
  export default ImageTracer;
}
