import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  pickActiveHeading,
  groupHeadingsByPrd,
  findActivePrd,
} from './useScrollSpy.js';

// ----------------------------------------------------------------------------
// pickActiveHeading — picks the topmost-visible heading among IO entries
// ----------------------------------------------------------------------------

/**
 * Synthesize an IntersectionObserverEntry-like object for testing.
 * `top` is the boundingClientRect.top in px (smaller = closer to viewport top).
 */
function entry({ id, isIntersecting = true, top = 0, ratio = isIntersecting ? 0.5 : 0 }) {
  return {
    isIntersecting,
    intersectionRatio: ratio,
    boundingClientRect: { top },
    target: id == null ? {} : { id },
  };
}

test('pickActiveHeading Test 1: Empty entries array returns null', () => {
  assert.equal(pickActiveHeading([]), null);
});

test('pickActiveHeading Test 2: Single intersecting entry returns its target.id', () => {
  assert.equal(pickActiveHeading([entry({ id: 'prd-1', top: 100 })]), 'prd-1');
});

test('pickActiveHeading Test 3: Multiple intersecting entries returns the one with smallest top', () => {
  const result = pickActiveHeading([
    entry({ id: 'prd-2', top: 300 }),
    entry({ id: 'prd-1', top: 50 }),
    entry({ id: 'prd-3', top: 600 }),
  ]);
  assert.equal(result, 'prd-1');
});

test('pickActiveHeading Test 4: No intersecting entries returns null', () => {
  const result = pickActiveHeading([
    entry({ id: 'prd-1', isIntersecting: false, top: 100 }),
    entry({ id: 'prd-2', isIntersecting: false, top: 300 }),
  ]);
  assert.equal(result, null);
});

test('pickActiveHeading Test 5: Mixed entries returns topmost intersecting, ignoring non-intersecting', () => {
  const result = pickActiveHeading([
    entry({ id: 'prd-1', isIntersecting: false, top: 50 }),
    entry({ id: 'prd-2', isIntersecting: true, top: 200 }),
    entry({ id: 'prd-3', isIntersecting: true, top: 400 }),
  ]);
  assert.equal(result, 'prd-2');
});

test('pickActiveHeading Test 6: Entry with no target.id is skipped', () => {
  const result = pickActiveHeading([
    entry({ id: null, top: 50 }), // no id — should be skipped
    entry({ id: 'prd-1', top: 200 }),
  ]);
  assert.equal(result, 'prd-1');
});

// ----------------------------------------------------------------------------
// groupHeadingsByPrd — flat heading list -> [{id, text, children: [...]}, ...]
// ----------------------------------------------------------------------------

test('groupHeadingsByPrd Test 1: Empty input returns empty array', () => {
  assert.deepEqual(groupHeadingsByPrd([]), []);
});

test('groupHeadingsByPrd Test 2: Only H2s yields one group per H2 with empty children', () => {
  const headings = [
    { id: 'prd-1', level: 2, text: 'PRD-1: Plants' },
    { id: 'prd-2', level: 2, text: 'PRD-2: Orders' },
  ];
  assert.deepEqual(groupHeadingsByPrd(headings), [
    { id: 'prd-1', text: 'PRD-1: Plants', children: [] },
    { id: 'prd-2', text: 'PRD-2: Orders', children: [] },
  ]);
});

test('groupHeadingsByPrd Test 3: H2 followed by 2 H3s yields one group with 2 children', () => {
  const headings = [
    { id: 'prd-1', level: 2, text: 'PRD-1' },
    { id: 'what-is-it', level: 3, text: 'What Is It' },
    { id: 'data-model', level: 3, text: 'Data Model' },
  ];
  const result = groupHeadingsByPrd(headings);
  assert.equal(result.length, 1);
  assert.equal(result[0].children.length, 2);
  assert.deepEqual(result[0].children, [
    { id: 'what-is-it', text: 'What Is It' },
    { id: 'data-model', text: 'Data Model' },
  ]);
});

test('groupHeadingsByPrd Test 4: Two H2s with H3s between them assign correctly', () => {
  const headings = [
    { id: 'prd-1', level: 2, text: 'PRD-1' },
    { id: 'what-is-it', level: 3, text: 'What Is It' },
    { id: 'prd-2', level: 2, text: 'PRD-2' },
    { id: 'data-model', level: 3, text: 'Data Model' },
    { id: 'how-we-know', level: 3, text: 'How We Know' },
  ];
  const result = groupHeadingsByPrd(headings);
  assert.equal(result.length, 2);
  assert.deepEqual(result[0].children, [{ id: 'what-is-it', text: 'What Is It' }]);
  assert.deepEqual(result[1].children, [
    { id: 'data-model', text: 'Data Model' },
    { id: 'how-we-know', text: 'How We Know' },
  ]);
});

test('groupHeadingsByPrd Test 5: H3 before any H2 is dropped (orphan)', () => {
  const headings = [
    { id: 'orphan', level: 3, text: 'Orphan H3' },
    { id: 'prd-1', level: 2, text: 'PRD-1' },
    { id: 'what-is-it', level: 3, text: 'What Is It' },
  ];
  const result = groupHeadingsByPrd(headings);
  assert.equal(result.length, 1);
  assert.equal(result[0].id, 'prd-1');
  assert.deepEqual(result[0].children, [{ id: 'what-is-it', text: 'What Is It' }]);
});

// ----------------------------------------------------------------------------
// findActivePrd — given groups + active heading id, returns parent H2 id
// ----------------------------------------------------------------------------

const fixtureGroups = [
  {
    id: 'prd-1',
    text: 'PRD-1',
    children: [
      { id: 'what-is-it', text: 'What Is It' },
      { id: 'data-model', text: 'Data Model' },
    ],
  },
  {
    id: 'prd-2',
    text: 'PRD-2',
    children: [{ id: 'how-we-know', text: 'How We Know' }],
  },
];

test('findActivePrd Test 1: activeId is an H2 returns that H2 id', () => {
  assert.equal(findActivePrd(fixtureGroups, 'prd-1'), 'prd-1');
  assert.equal(findActivePrd(fixtureGroups, 'prd-2'), 'prd-2');
});

test('findActivePrd Test 2: activeId is a child H3 returns parent H2 id', () => {
  assert.equal(findActivePrd(fixtureGroups, 'data-model'), 'prd-1');
  assert.equal(findActivePrd(fixtureGroups, 'how-we-know'), 'prd-2');
});

test('findActivePrd Test 3: activeId is null returns null', () => {
  assert.equal(findActivePrd(fixtureGroups, null), null);
});

test('findActivePrd Test 4: activeId not found in any group returns null', () => {
  assert.equal(findActivePrd(fixtureGroups, 'unknown-id'), null);
});
