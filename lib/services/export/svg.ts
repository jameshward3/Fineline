export interface ExportVectorObject {
  name: string;
  svgPath: string;
  sequenceOrder: number;
  hex: string;
  companyName: string;
  manufacturerCode: string;
  stitchType: string;
}

/**
 * Separated production SVG — each production color is its own named,
 * labeled `<g>` layer in sewing order, so InStitch (or a human digitizer)
 * can select colors independently rather than working from a flattened
 * raster trace.
 */
export function buildDesignSvg(
  objects: ExportVectorObject[],
  width: number,
  height: number
): string {
  const layers = [...objects]
    .sort((a, b) => a.sequenceOrder - b.sequenceOrder)
    .map(
      (o) => `  <g id="layer-${o.sequenceOrder}-${slug(o.name)}" data-sequence="${o.sequenceOrder}" data-thread-color="${escapeAttr(o.companyName)}" data-thread-code="${escapeAttr(o.manufacturerCode)}" data-stitch-type="${o.stitchType}">
    <path d="${o.svgPath}" fill="${o.hex}" />
  </g>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
${layers}
</svg>
`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "layer";
}

function escapeAttr(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
