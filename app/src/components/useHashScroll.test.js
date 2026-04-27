import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseHashToId } from './useHashScroll.js';

// ---- parseHashToId (Plan 03-03, NAV-04) ----
//
// Behaviour spec from PLAN.md <behavior>:
//   Pure helper that extracts the candidate id from location.hash, normalising
//   the common formats users actually paste. The hook integration (rAF +
//   getElementById + querySelector prefix-match) is verified at human UAT —
//   these tests cover only the deterministic string-parsing surface.

test('Test 1: "#prd-1" returns "prd-1"', () => {
  assert.equal(parseHashToId('#prd-1'), 'prd-1');
});

test('Test 2: "#prd-1-1" returns "prd-1-1"', () => {
  assert.equal(parseHashToId('#prd-1-1'), 'prd-1-1');
});

test('Test 3: "#/prd-1-1" strips leading "/" and returns "prd-1-1"', () => {
  assert.equal(parseHashToId('#/prd-1-1'), 'prd-1-1');
});

test('Test 4: empty string returns null', () => {
  assert.equal(parseHashToId(''), null);
});

test('Test 5: lone "#" marker returns null', () => {
  assert.equal(parseHashToId('#'), null);
});

test('Test 6: null input returns null', () => {
  assert.equal(parseHashToId(null), null);
});

test('Test 7: "#some-other-anchor" returns "some-other-anchor" (D-14 silent miss handles unresolved ids)', () => {
  assert.equal(parseHashToId('#some-other-anchor'), 'some-other-anchor');
});

test('Test 8: "#prd-1?query=foo" strips query portion and returns "prd-1"', () => {
  assert.equal(parseHashToId('#prd-1?query=foo'), 'prd-1');
});

test('Test 9: "#prd-1 " trims trailing whitespace and returns "prd-1"', () => {
  assert.equal(parseHashToId('#prd-1 '), 'prd-1');
});

test('Test 10: "#PRD-1" preserves case (uppercase will miss getElementById; D-14 silent no-op handles it)', () => {
  assert.equal(parseHashToId('#PRD-1'), 'PRD-1');
});

test('Test 11: "#/prd-1.1" normalises dot form to dash form ("prd-1-1") — ROADMAP success criterion 3', () => {
  assert.equal(parseHashToId('#/prd-1.1'), 'prd-1-1');
});

test('Test 12: "#/prd-1.1.2" normalises multi-level dot form to "prd-1-1-2"', () => {
  assert.equal(parseHashToId('#/prd-1.1.2'), 'prd-1-1-2');
});

test('Test 13: "#some.thing" non-PRD id with a dot is left unchanged (only PRD pattern is normalised)', () => {
  assert.equal(parseHashToId('#some.thing'), 'some.thing');
});
