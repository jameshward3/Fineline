import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateConfiguratorQuote,
  calculateLetteringQuote,
  countLetteringCharacters,
  CONFIGURATOR_PRICING_VERSION,
  LETTERING_RATE_PER_LETTER,
  LETTERING_SETUP_FEE,
} from "./pricing";

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

test("countLetteringCharacters ignores whitespace but counts punctuation", () => {
  assert.equal(countLetteringCharacters("Amelia Grace"), 11);
  assert.equal(countLetteringCharacters("  J & R  "), 3);
  assert.equal(countLetteringCharacters(""), 0);
});

test("lettering quote is a flat setup fee plus a per-letter rate with one color included", () => {
  const quote = calculateLetteringQuote({
    text: "AMELIA",
    quantity: 1,
    colorCount: 1,
    productCategory: "Polo Shirt",
  });

  assert.equal(quote.version, CONFIGURATOR_PRICING_VERSION);
  assert.equal(quote.setupFee, LETTERING_SETUP_FEE);
  assert.equal(quote.unitDecoration, Math.round(6 * LETTERING_RATE_PER_LETTER * 100) / 100);
  assert.equal(quote.volumeDiscountRate, 0);
  assert.equal(quote.total, Math.round((quote.setupFee + quote.quantity * quote.unitPrice) * 100) / 100);
});

test("each additional color adds a 25% surcharge to the per-letter rate, not the setup fee", () => {
  const oneColor = calculateLetteringQuote({ text: "TEAM", quantity: 1, colorCount: 1, productCategory: "Patch" });
  const twoColor = calculateLetteringQuote({ text: "TEAM", quantity: 1, colorCount: 2, productCategory: "Patch" });
  const threeColor = calculateLetteringQuote({ text: "TEAM", quantity: 1, colorCount: 3, productCategory: "Patch" });

  assert.equal(oneColor.setupFee, twoColor.setupFee);
  assert.equal(twoColor.unitDecoration, Math.round(oneColor.unitDecoration * 1.25 * 100) / 100);
  assert.equal(threeColor.unitDecoration, Math.round(oneColor.unitDecoration * 1.5 * 100) / 100);
});

test("lettering volume discount tiers match the standard configurator", () => {
  const quote = calculateLetteringQuote({ text: "TEAM ROSTER", quantity: 24, colorCount: 1, productCategory: "Patch" });
  assert.equal(quote.volumeDiscountRate, 0.1);
});
