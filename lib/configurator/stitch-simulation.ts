export const STITCH_SEGMENT_STRIDE = 6;

export const STITCH_STYLES = ["AUTO", "PATCH", "SATIN", "TATAMI"] as const;
export type StitchStyle = (typeof STITCH_STYLES)[number];

/**
 * Interleaved segment data: center x/y, vector x/y, strand width, relief.
 * Positions and vectors are normalized to the final square artwork plane.
 */
export interface StitchLayer {
  colorHex: string;
  segments: Float32Array;
}

interface StitchSimulationInput {
  sourceWidth: number;
  sourceHeight: number;
  sourceClusters: Int16Array;
  targetHexes: string[];
  outputWidth: number;
  outputHeight: number;
  contentX: number;
  contentY: number;
  contentWidth: number;
  contentHeight: number;
  densityMm: number;
  threadWeight: "W30" | "W40" | "W60";
  stitchStyle: StitchStyle;
  borderStyle: "NONE" | "SATIN" | "MERROW";
  borderColor: string;
  borderWidthMm: number;
  maximumSegments?: number;
}

interface Component {
  id: number;
  cluster: number;
  count: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  sumX: number;
  sumY: number;
  sumXX: number;
  sumYY: number;
  sumXY: number;
}

interface MutableLayer {
  colorHex: string;
  segments: number[];
}

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

function deterministicNoise(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return value - Math.floor(value);
}

function makeSimulationGrid(input: StitchSimulationInput) {
  const scale = Math.min(1, 320 / Math.max(input.sourceWidth, input.sourceHeight));
  const width = Math.max(1, Math.round(input.sourceWidth * scale));
  const height = Math.max(1, Math.round(input.sourceHeight * scale));
  const clusters = new Int16Array(width * height).fill(-1);

  for (let y = 0; y < height; y++) {
    const sourceY = Math.min(input.sourceHeight - 1, Math.floor(((y + 0.5) / height) * input.sourceHeight));
    for (let x = 0; x < width; x++) {
      const sourceX = Math.min(input.sourceWidth - 1, Math.floor(((x + 0.5) / width) * input.sourceWidth));
      clusters[y * width + x] = input.sourceClusters[sourceY * input.sourceWidth + sourceX];
    }
  }

  return { width, height, clusters };
}

function findComponents(clusters: Int16Array, width: number, height: number) {
  const componentIds = new Int32Array(clusters.length).fill(-1);
  const queue = new Int32Array(clusters.length);
  const components: Component[] = [];

  for (let start = 0; start < clusters.length; start++) {
    const cluster = clusters[start];
    if (cluster < 0 || componentIds[start] >= 0) continue;

    const component: Component = {
      id: components.length,
      cluster,
      count: 0,
      minX: width,
      maxX: 0,
      minY: height,
      maxY: 0,
      sumX: 0,
      sumY: 0,
      sumXX: 0,
      sumYY: 0,
      sumXY: 0,
    };
    let head = 0;
    let tail = 0;
    queue[tail++] = start;
    componentIds[start] = component.id;

    while (head < tail) {
      const pixel = queue[head++];
      const x = pixel % width;
      const y = Math.floor(pixel / width);
      component.count++;
      component.minX = Math.min(component.minX, x);
      component.maxX = Math.max(component.maxX, x);
      component.minY = Math.min(component.minY, y);
      component.maxY = Math.max(component.maxY, y);
      component.sumX += x;
      component.sumY += y;
      component.sumXX += x * x;
      component.sumYY += y * y;
      component.sumXY += x * y;

      const neighbors = [
        x > 0 ? pixel - 1 : -1,
        x + 1 < width ? pixel + 1 : -1,
        y > 0 ? pixel - width : -1,
        y + 1 < height ? pixel + width : -1,
      ];
      for (const neighbor of neighbors) {
        if (neighbor < 0 || componentIds[neighbor] >= 0 || clusters[neighbor] !== cluster) continue;
        componentIds[neighbor] = component.id;
        queue[tail++] = neighbor;
      }
    }
    components.push(component);
  }

  return { componentIds, components };
}

function componentDirection(component: Component, style: StitchStyle) {
  const meanX = component.sumX / component.count;
  const meanY = component.sumY / component.count;
  const covarianceX = component.sumXX / component.count - meanX * meanX;
  const covarianceY = component.sumYY / component.count - meanY * meanY;
  const covarianceXY = component.sumXY / component.count - meanX * meanY;
  const trace = covarianceX + covarianceY;
  const difference = covarianceX - covarianceY;
  const discriminant = Math.sqrt(Math.max(0, difference * difference + 4 * covarianceXY * covarianceXY));
  const major = Math.max(0.001, (trace + discriminant) / 2);
  const minor = Math.max(0.001, (trace - discriminant) / 2);
  const elongation = Math.sqrt(major / minor);
  const principal = 0.5 * Math.atan2(2 * covarianceXY, difference);
  const fallback = (((component.cluster * 47 + component.id * 17) % 150) - 75) * (Math.PI / 180);
  const variation = (deterministicNoise(component.id * 31 + component.cluster * 7) - 0.5) * 0.16;

  if (style === "SATIN") return { angle: principal + Math.PI / 2 + variation, elongation, satin: true };
  if (style === "TATAMI") return { angle: fallback * 0.55 + (component.cluster % 2 ? 0.58 : -0.58), elongation, satin: false };
  if (style === "PATCH") {
    return {
      angle: elongation > 1.38 ? principal + Math.PI / 2 + variation : fallback + variation,
      elongation,
      satin: elongation > 2.15 || component.count < 150,
    };
  }
  return {
    angle: elongation > 1.9 ? principal + Math.PI / 2 + variation : fallback + variation,
    elongation,
    satin: elongation > 2.4 || component.count < 85,
  };
}

function addSegment(
  layer: MutableLayer,
  input: StitchSimulationInput,
  simulationWidth: number,
  simulationHeight: number,
  centerX: number,
  centerY: number,
  vectorX: number,
  vectorY: number,
  strandWidth: number,
  relief: number,
) {
  const outputCenterX = input.contentX + (centerX / simulationWidth) * input.contentWidth;
  const outputCenterY = input.contentY + (centerY / simulationHeight) * input.contentHeight;
  const outputVectorX = (vectorX / simulationWidth) * input.contentWidth;
  const outputVectorY = (vectorY / simulationHeight) * input.contentHeight;
  const contentScale = Math.min(input.contentWidth / simulationWidth, input.contentHeight / simulationHeight);
  const outputStrandWidth = strandWidth * contentScale;

  layer.segments.push(
    outputCenterX / input.outputWidth - 0.5,
    0.5 - outputCenterY / input.outputHeight,
    outputVectorX / input.outputWidth,
    -outputVectorY / input.outputHeight,
    outputStrandWidth / input.outputWidth,
    relief,
  );
}

function hatchComponent({
  component,
  componentIds,
  width,
  height,
  input,
  layer,
  segmentBudget,
}: {
  component: Component;
  componentIds: Int32Array;
  width: number;
  height: number;
  input: StitchSimulationInput;
  layer: MutableLayer;
  segmentBudget: { remaining: number };
}) {
  if (component.count < 2 || segmentBudget.remaining <= 0) return;
  const direction = componentDirection(component, input.stitchStyle);
  const dx = Math.cos(direction.angle);
  const dy = Math.sin(direction.angle);
  const nx = -dy;
  const ny = dx;
  const centerX = component.sumX / component.count;
  const centerY = component.sumY / component.count;
  const corners = [
    [component.minX - centerX, component.minY - centerY],
    [component.maxX - centerX, component.minY - centerY],
    [component.minX - centerX, component.maxY - centerY],
    [component.maxX - centerX, component.maxY - centerY],
  ];
  const directionProjections = corners.map(([x, y]) => x * dx + y * dy);
  const normalProjections = corners.map(([x, y]) => x * nx + y * ny);
  const minimumDirection = Math.min(...directionProjections) - 1;
  const maximumDirection = Math.max(...directionProjections) + 1;
  const minimumNormal = Math.min(...normalProjections) - 1;
  const maximumNormal = Math.max(...normalProjections) + 1;
  const densityT = clamp((input.densityMm - 0.3) / 0.35, 0, 1);
  const weightScale = input.threadWeight === "W30" ? 1.2 : input.threadWeight === "W60" ? 0.82 : 1;
  const rowSpacing = (1.35 + densityT * 1.2) * weightScale;
  const strandWidth = (input.threadWeight === "W30" ? 1.62 : input.threadWeight === "W60" ? 0.9 : 1.24)
    * (input.stitchStyle === "PATCH" ? 1.08 : 1);
  const targetLength = input.stitchStyle === "SATIN"
    ? 24
    : input.stitchStyle === "PATCH"
      ? 10
      : input.stitchStyle === "TATAMI"
        ? 6.2
        : 8;
  let row = 0;

  const flushRun = (start: number, end: number, rowNormal: number) => {
    const runLength = end - start;
    if (runLength < 0.8 || segmentBudget.remaining <= 0) return;
    const shouldSpan = direction.satin && runLength <= 34;
    const stagger = row % 2 === 0 ? 0 : targetLength * 0.47;
    const pieceCount = shouldSpan ? 1 : Math.max(1, Math.ceil((runLength + stagger) / targetLength));
    const pieceLength = runLength / pieceCount;
    const seam = Math.min(0.18, pieceLength * 0.06);

    for (let piece = 0; piece < pieceCount && segmentBudget.remaining > 0; piece++) {
      const from = start + piece * pieceLength + seam / 2;
      const to = start + (piece + 1) * pieceLength - seam / 2;
      const middle = (from + to) / 2;
      const length = Math.max(0.35, to - from);
      addSegment(
        layer,
        input,
        width,
        height,
        centerX + nx * rowNormal + dx * middle,
        centerY + ny * rowNormal + dy * middle,
        dx * length,
        dy * length,
        strandWidth,
        shouldSpan ? 1.16 : 1,
      );
      segmentBudget.remaining--;
    }
  };

  for (let normal = minimumNormal; normal <= maximumNormal && segmentBudget.remaining > 0; normal += rowSpacing) {
    let runStart: number | null = null;
    let lastInside = minimumDirection;
    for (let distance = minimumDirection; distance <= maximumDirection + 0.51; distance += 0.72) {
      const x = centerX + nx * normal + dx * distance;
      const y = centerY + ny * normal + dy * distance;
      const sampleX = Math.round(x);
      const sampleY = Math.round(y);
      const inside = sampleX >= 0
        && sampleX < width
        && sampleY >= 0
        && sampleY < height
        && componentIds[sampleY * width + sampleX] === component.id;
      if (inside && runStart === null) runStart = distance - 0.36;
      if (inside) lastInside = distance + 0.36;
      if (!inside && runStart !== null) {
        flushRun(runStart, lastInside, normal);
        runStart = null;
      }
    }
    if (runStart !== null) flushRun(runStart, lastInside, normal);
    row++;
  }
}

function addSilhouetteStitches({
  input,
  clusters,
  width,
  height,
  layers,
  borderLayer,
  segmentBudget,
}: {
  input: StitchSimulationInput;
  clusters: Int16Array;
  width: number;
  height: number;
  layers: MutableLayer[];
  borderLayer: MutableLayer | null;
  segmentBudget: { remaining: number };
}) {
  const baseLength = input.stitchStyle === "SATIN" ? 5.8 : input.stitchStyle === "PATCH" ? 5.1 : 3.8;
  const configuredExtension = input.borderStyle === "NONE" ? 0 : clamp(input.borderWidthMm * 1.35, 1, 8);
  const length = baseLength + configuredExtension;
  const strandWidth = input.threadWeight === "W30" ? 1.76 : input.threadWeight === "W60" ? 1 : 1.36;

  for (let y = 0; y < height && segmentBudget.remaining > 0; y++) {
    for (let x = 0; x < width && segmentBudget.remaining > 0; x++) {
      const cluster = clusters[y * width + x];
      if (cluster < 0) continue;
      const left = x > 0 ? clusters[y * width + x - 1] : -1;
      const right = x + 1 < width ? clusters[y * width + x + 1] : -1;
      const top = y > 0 ? clusters[(y - 1) * width + x] : -1;
      const bottom = y + 1 < height ? clusters[(y + 1) * width + x] : -1;
      if (left >= 0 && right >= 0 && top >= 0 && bottom >= 0) continue;

      const gradientX = (right >= 0 ? 1 : 0) - (left >= 0 ? 1 : 0);
      const gradientY = (bottom >= 0 ? 1 : 0) - (top >= 0 ? 1 : 0);
      const magnitude = Math.hypot(gradientX, gradientY);
      if (magnitude < 0.1) continue;
      const inwardX = gradientX / magnitude;
      const inwardY = gradientY / magnitude;
      const centerShift = configuredExtension > 0 ? -length * 0.24 : -length * 0.12;
      const layer = borderLayer ?? layers[cluster];
      if (!layer) continue;
      addSegment(
        layer,
        input,
        width,
        height,
        x + inwardX * centerShift,
        y + inwardY * centerShift,
        inwardX * length,
        inwardY * length,
        strandWidth * (input.borderStyle === "MERROW" ? 1.22 : 1),
        input.borderStyle === "NONE" ? 1.28 : 1.48,
      );
      segmentBudget.remaining--;
    }
  }
}

/**
 * Creates a deterministic, browser-independent stitch field from a quantized
 * artwork mask. The renderer consumes the resulting strands as real 3D
 * instances; this function intentionally contains no machine-file logic.
 */
export function createStitchSimulation(input: StitchSimulationInput): StitchLayer[] {
  if (
    input.sourceWidth < 1
    || input.sourceHeight < 1
    || input.sourceClusters.length !== input.sourceWidth * input.sourceHeight
    || input.targetHexes.length === 0
  ) return [];

  const grid = makeSimulationGrid(input);
  const { componentIds, components } = findComponents(grid.clusters, grid.width, grid.height);
  const layers: MutableLayer[] = input.targetHexes.map((colorHex) => ({ colorHex, segments: [] }));
  const borderLayer = input.borderStyle === "NONE"
    ? null
    : { colorHex: input.borderColor, segments: [] };
  const segmentBudget = { remaining: input.maximumSegments ?? 16_000 };

  // Reserve the silhouette first so a complex fill can never consume the
  // complete geometry budget and flatten a requested satin/merrow edge.
  addSilhouetteStitches({
    input,
    clusters: grid.clusters,
    width: grid.width,
    height: grid.height,
    layers,
    borderLayer,
    segmentBudget,
  });
  for (const component of components.sort((a, b) => b.count - a.count)) {
    const layer = layers[component.cluster];
    if (!layer || segmentBudget.remaining <= 0) break;
    hatchComponent({
      component,
      componentIds,
      width: grid.width,
      height: grid.height,
      input,
      layer,
      segmentBudget,
    });
  }
  if (borderLayer?.segments.length) layers.push(borderLayer);

  return layers
    .filter((layer) => layer.segments.length > 0)
    .map((layer) => ({ colorHex: layer.colorHex, segments: new Float32Array(layer.segments) }));
}

export function stitchStyleLabel(style: StitchStyle) {
  if (style === "PATCH") return "Badge relief";
  if (style === "SATIN") return "Satin fill";
  if (style === "TATAMI") return "Tatami fill";
  return "Auto direction";
}
