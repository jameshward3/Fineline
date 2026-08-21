import assert from "node:assert/strict";
import test from "node:test";
import { maskPhoneNumber, normalizePhoneNumber, phoneLookupCandidates } from "./phone";

test("normalizes common US phone input to E.164", () => {
  assert.equal(normalizePhoneNumber("(203) 555-0142"), "+12035550142");
  assert.equal(normalizePhoneNumber("1-203-555-0142"), "+12035550142");
  assert.equal(normalizePhoneNumber("+44 20 7946 0958"), "+442079460958");
});

test("rejects numbers that cannot receive a verification code", () => {
  assert.equal(normalizePhoneNumber("555-0123"), null);
  assert.equal(normalizePhoneNumber("+0000000000"), null);
  assert.equal(normalizePhoneNumber(""), null);
});

test("masks and creates lookup variants without exposing the full number", () => {
  assert.equal(maskPhoneNumber("+12035550142"), "(***) ***-0142");
  assert.deepEqual(phoneLookupCandidates("+12035550142"), [
    "+12035550142",
    "2035550142",
    "203-555-0142",
    "(203) 555-0142",
  ]);
});
