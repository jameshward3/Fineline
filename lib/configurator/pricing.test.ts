import assert from "node:assert/strict";
import test from "node:test";
import { calculateConfiguratorQuote, CONFIGURATOR_PRICING_VERSION } from "./pricing";

test("pricing is deterministic and internally consistent", () => {
  const quote = calculateConfiguratorQuote({
    widthInches: 3.5,
    heightInches: 2.5,
    quantity: 24,
    colorCount: 4,
    densityMm: 0.45,
    threadWeight: "W40",
    borderStyle: "SATIN",
    borderWidthMm: 2,
    productCategory: "Polo Shirt",
  });

  assert.equal(quote.version, CONFIGURATOR_PRICING_VERSION);
  assert.equal(quote.total, Math.round((quote.setupFee + quote.quantity * quote.unitPrice) * 100) / 100);
  assert.ok(quote.estimatedStitches > 1_000);
  assert.equal(quote.volumeDiscountRate, 0.1);
});

test("denser artwork and a merrow border increase the estimate", () => {
  const base = {
    widthInches: 4,
    heightInches: 4,
    quantity: 12,
    colorCount: 3,
    threadWeight: "W40" as const,
    productCategory: "Patch",
    borderWidthMm: 3,
  };
  const light = calculateConfiguratorQuote({ ...base, densityMm: 0.6, borderStyle: "NONE" });
  const dense = calculateConfiguratorQuote({ ...base, densityMm: 0.35, borderStyle: "MERROW" });

  assert.ok(dense.estimatedStitches > light.estimatedStitches);
  assert.ok(dense.total > light.total);
});
