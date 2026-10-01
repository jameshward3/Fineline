import assert from "node:assert/strict";
import test from "node:test";
import {
  createStitchSimulation,
  STITCH_SEGMENT_STRIDE,
} from "./stitch-simulation";

function solidArtwork() {
  const width = 40;
  const height = 24;
  const clusters = new Int16Array(width * height).fill(-1);
  for (let y = 2; y < height - 2; y++) {
    for (let x = 3; x < width - 3; x++) clusters[y * width + x] = 0;
  }
  return { width, height, clusters };
}

function simulate(overrides: Partial<Parameters<typeof createStitchSimulation>[0]> = {}) {
  const artwork = solidArtwork();
  return createStitchSimulation({
    sourceWidth: artwork.width,
    sourceHeight: artwork.height,
    sourceClusters: artwork.clusters,
    targetHexes: ["#17365D"],
    outputWidth: 240,
    outputHeight: 160,
    contentX: 12,
    contentY: 12,
    contentWidth: 216,
    contentHeight: 136,
    densityMm: 0.45,
    threadWeight: "W40",
    stitchStyle: "PATCH",
    borderStyle: "NONE",
    borderColor: "#B52336",
    borderWidthMm: 2,
    maximumSegments: 4_000,
    ...overrides,
  });
}

test("stitch fields are deterministic and cover a two-dimensional region", () => {
  const first = simulate();
  const second = simulate();
  assert.equal(first.length, 1);
  assert.deepEqual(Array.from(first[0].segments), Array.from(second[0].segments));
  assert.equal(first[0].segments.length % STITCH_SEGMENT_STRIDE, 0);
  assert.ok(first[0].segments.length / STITCH_SEGMENT_STRIDE > 80);

  const centers: Array<[number, number]> = [];
  for (let offset = 0; offset < first[0].segments.length; offset += STITCH_SEGMENT_STRIDE) {
    centers.push([first[0].segments[offset], first[0].segments[offset + 1]]);
    assert.ok(Number.isFinite(first[0].segments[offset + 2]));
    assert.ok(Number.isFinite(first[0].segments[offset + 3]));
    assert.ok(first[0].segments[offset + 4] > 0);
  }
  const meanX = centers.reduce((sum, [x]) => sum + x, 0) / centers.length;
  const meanY = centers.reduce((sum, [, y]) => sum + y, 0) / centers.length;
  const covarianceX = centers.reduce((sum, [x]) => sum + (x - meanX) ** 2, 0) / centers.length;
  const covarianceY = centers.reduce((sum, [, y]) => sum + (y - meanY) ** 2, 0) / centers.length;
  const covarianceXY = centers.reduce((sum, [x, y]) => sum + (x - meanX) * (y - meanY), 0) / centers.length;
  assert.ok(covarianceX * covarianceY - covarianceXY ** 2 > 0.0001);
});

test("configured borders add a raised, separately colored satin layer", () => {
  const layers = simulate({ borderStyle: "SATIN", borderWidthMm: 3 });
  const border = layers.find((layer) => layer.colorHex === "#B52336");
  assert.ok(border);
  assert.ok(border.segments.length > 0);
  for (let offset = 0; offset < border.segments.length; offset += STITCH_SEGMENT_STRIDE) {
    assert.ok(border.segments[offset + 5] > 1.2);
  }
});
