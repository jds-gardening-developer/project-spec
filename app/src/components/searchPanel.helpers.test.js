import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSearchHotkey,
  buildSnippet,
  formatBreadcrumb,
} from './searchPanel.helpers.js';

// =====================================================================
// isSearchHotkey — D-09 keyboard binding (Cmd+K macOS, Ctrl+K others)
// =====================================================================

test('isSearchHotkey Test 1: macOS Cmd+K → true', () => {
  assert.equal(isSearchHotkey({ metaKey: true, key: 'k' }), true);
});

test('isSearchHotkey Test 2: Linux/Windows Ctrl+K → true', () => {
  assert.equal(isSearchHotkey({ ctrlKey: true, key: 'k' }), true);
});

test('isSearchHotkey Test 3: case-insensitive — Cmd+K with capital K (Caps/Shift)', () => {
  assert.equal(isSearchHotkey({ metaKey: true, key: 'K' }), true);
});

test('isSearchHotkey Test 4: lone "k" without any modifier → false (just typing)', () => {
  assert.equal(isSearchHotkey({ key: 'k' }), false);
});

test('isSearchHotkey Test 5: Cmd+J (wrong letter) → false', () => {
  assert.equal(isSearchHotkey({ metaKey: true, key: 'j' }), false);
});

test('isSearchHotkey Test 6: Shift+K alone (no Cmd/Ctrl) → false', () => {
  assert.equal(isSearchHotkey({ shiftKey: true, key: 'k' }), false);
});

test('isSearchHotkey Test 7: both metaKey + ctrlKey + k → true (either is enough)', () => {
  assert.equal(isSearchHotkey({ metaKey: true, ctrlKey: true, key: 'k' }), true);
});

test('isSearchHotkey Test 8: null/undefined input → false (defensive, no throw)', () => {
  assert.equal(isSearchHotkey(null), false);
  assert.equal(isSearchHotkey(undefined), false);
  assert.equal(isSearchHotkey({}), false);
  assert.equal(isSearchHotkey({ metaKey: true }), false); // missing key
  assert.equal(isSearchHotkey({ key: 42 }), false);       // non-string key
});

// =====================================================================
// buildSnippet — D-10 segment-list output (XSS-safe)
// =====================================================================

test('buildSnippet Test 1: simple match returns text/mark/text segments', () => {
  const segs = buildSnippet('The quick brown fox', 'quick', 50);
  assert.deepEqual(segs, [
    { type: 'text', text: 'The ' },
    { type: 'mark', text: 'quick' },
    { type: 'text', text: ' brown fox' },
  ]);
});

test('buildSnippet Test 2: body shorter than maxLen returned in full with marks', () => {
  const segs = buildSnippet('foo bar baz', 'bar', 100);
  assert.deepEqual(segs, [
    { type: 'text', text: 'foo ' },
    { type: 'mark', text: 'bar' },
    { type: 'text', text: ' baz' },
  ]);
});

test('buildSnippet Test 3: long body, query in middle → windowed snippet with ellipsis', () => {
  const longPrefix = 'a'.repeat(200);
  const longSuffix = 'b'.repeat(200);
  const body = longPrefix + ' MATCH ' + longSuffix;
  const segs = buildSnippet(body, 'MATCH', 60);
  // Expect at least one mark and surrounding text + ellipsis prefix or suffix
  const hasMark = segs.some((s) => s.type === 'mark' && s.text === 'MATCH');
  assert.equal(hasMark, true);
  const flat = segs.map((s) => s.text).join('');
  assert.equal(flat.includes('…'), true, 'ellipsis present somewhere');
  // Window roughly maxLen + ellipses
  assert.ok(flat.length <= 70, `flat length ${flat.length} should be ~maxLen plus ellipses`);
});

test('buildSnippet Test 4: multi-term query — all terms wrapped in mark', () => {
  const segs = buildSnippet('The quick brown fox', 'quick brown', 100);
  const marks = segs.filter((s) => s.type === 'mark').map((s) => s.text);
  assert.deepEqual(marks, ['quick', 'brown']);
});

test('buildSnippet Test 5: query not found → text-only segment, truncated with ellipsis if too long', () => {
  const longBody = 'x'.repeat(500);
  const segs = buildSnippet(longBody, 'NOMATCH', 50);
  // No mark segments
  assert.equal(segs.every((s) => s.type === 'text'), true);
  const flat = segs.map((s) => s.text).join('');
  assert.equal(flat.endsWith('…'), true);
  // Length is roughly maxLen + 1 char ellipsis
  assert.ok(flat.length <= 51, `flat length ${flat.length} should be ~maxLen+1`);
});

test('buildSnippet Test 6: empty body → empty segment list', () => {
  assert.deepEqual(buildSnippet('', 'foo', 10), []);
});

test('buildSnippet Test 7: empty query → first maxLen chars without marks', () => {
  const segs = buildSnippet('hello world', '', 100);
  assert.deepEqual(segs, [{ type: 'text', text: 'hello world' }]);
});

test('buildSnippet Test 7b: whitespace-only query → first maxLen chars without marks', () => {
  const segs = buildSnippet('hello world', '   ', 100);
  assert.deepEqual(segs, [{ type: 'text', text: 'hello world' }]);
});

test('buildSnippet Test 8: regex special chars in query are escaped (no regex injection)', () => {
  const body = '(see PRD-1) ref';
  const segs = buildSnippet(body, '(see PRD-1)', 100);
  // The literal substring should be one mark (multi-term split treats whitespace, so
  // the parens-wrapped phrase is split into "(see" and "PRD-1)" — both literal matches).
  const marks = segs.filter((s) => s.type === 'mark').map((s) => s.text);
  // Must NOT throw, and must produce at least one mark covering literal text from body.
  assert.ok(marks.length >= 1, 'at least one mark from a literal regex-special query term');
  for (const m of marks) {
    assert.equal(body.includes(m), true, `match ${JSON.stringify(m)} is literal substring of body`);
  }
});

test('buildSnippet Test 9: case-insensitive matching — uppercase query matches lowercase body', () => {
  const segs = buildSnippet('The quick brown fox', 'QUICK', 100);
  // Mark segment preserves original casing from body
  const marks = segs.filter((s) => s.type === 'mark').map((s) => s.text);
  assert.deepEqual(marks, ['quick']);
});

test('buildSnippet Test 10: returns segment list, never an HTML string', () => {
  const segs = buildSnippet('<script>alert(1)</script> ok', 'ok', 100);
  // No segment may contain raw HTML constructed by buildSnippet; all segments are
  // {type, text} where text is a substring of the body. React's text rendering will
  // escape these on render — XSS-safe by design.
  for (const s of segs) {
    assert.equal(typeof s.type, 'string');
    assert.equal(typeof s.text, 'string');
    // No segment should embed an HTML tag from our processing — the body's literal
    // < > characters pass through as text segments unchanged.
    assert.ok(s.type === 'text' || s.type === 'mark');
  }
  // Must not be an HTML string with embedded <mark>...</mark>
  assert.ok(Array.isArray(segs));
});

// =====================================================================
// formatBreadcrumb — D-10 breadcrumb context label
// =====================================================================

test('formatBreadcrumb Test 1: prd-1, level 2 → "PRD-1"', () => {
  assert.equal(formatBreadcrumb('prd-1', 2), 'PRD-1');
});

test('formatBreadcrumb Test 2: prd-1-1, level 3 → "PRD-1.1" (dashes → dots, uppercase)', () => {
  assert.equal(formatBreadcrumb('prd-1-1', 3), 'PRD-1.1');
});

test('formatBreadcrumb Test 3: null prd_id, level 1 → "" (no breadcrumb for H1 doc title)', () => {
  assert.equal(formatBreadcrumb(null, 1), '');
});

test('formatBreadcrumb Test 4: null prd_id, level 2 → "" (non-PRD H2 like Meeting Action Items)', () => {
  assert.equal(formatBreadcrumb(null, 2), '');
});

test('formatBreadcrumb Test 5: empty string prd_id → ""', () => {
  assert.equal(formatBreadcrumb('', 2), '');
});

test('formatBreadcrumb Test 6: PRD-3.4 round-trip — prd-3-4 → "PRD-3.4"', () => {
  assert.equal(formatBreadcrumb('prd-3-4', 3), 'PRD-3.4');
});
