/**
 * crossLinkPlugin.test.js — node:test cases for the remarkCrossLinks plugin.
 *
 * Plan 02-02 (REND-02). Pure JS — no JSX, no React imports — so node --test runs
 * directly without a JSX parser. Plan 01 wired the npm test script to
 * `node --test app/src/components/*.test.js`.
 *
 * Behaviors covered (10 tests):
 *   1. (see PRD-1)              -> single link, url=#prd-1
 *   2. (see PRD-1.1)            -> single link, url=#prd-1-1
 *   3. (see PRD-1, PRD-3.4)     -> two links separated by literal ", "
 *   4. surrounding "(see " and ")" remain text nodes around the link(s)
 *   5. bare PRD-1.1 (no see prefix) is NOT linked
 *   6. text inside `code` parent is left untouched
 *   7. text inside `inlineCode` parent is left untouched
 *   8. text inside `heading` parent is left untouched
 *   9. bare PRD-XX placeholder inside a heading is left untouched
 *  10. idempotency — second run on the once-mutated tree yields same structure
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import remarkCrossLinks from './crossLinkPlugin.js';

function runPlugin(tree) {
  const transform = remarkCrossLinks();
  transform(tree);
  return tree;
}

function paragraph(value) {
  return {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ type: 'text', value }] },
    ],
  };
}

test('Test 1: single (see PRD-1) becomes a link', () => {
  const tree = paragraph('Foo (see PRD-1) bar.');
  runPlugin(tree);
  const para = tree.children[0];
  // Expect: text "Foo (see ", link[PRD-1], text ") bar."
  assert.equal(para.children.length, 3);
  assert.equal(para.children[0].type, 'text');
  assert.equal(para.children[0].value, 'Foo (see ');
  assert.equal(para.children[1].type, 'link');
  assert.equal(para.children[1].url, '#prd-1');
  assert.equal(para.children[1].children[0].type, 'text');
  assert.equal(para.children[1].children[0].value, 'PRD-1');
  assert.equal(para.children[2].type, 'text');
  assert.equal(para.children[2].value, ') bar.');
});

test('Test 2: decimal (see PRD-1.1) becomes a link with anchor #prd-1-1', () => {
  const tree = paragraph('See (see PRD-1.1) here.');
  runPlugin(tree);
  const para = tree.children[0];
  assert.equal(para.children.length, 3);
  assert.equal(para.children[0].value, 'See (see ');
  assert.equal(para.children[1].type, 'link');
  assert.equal(para.children[1].url, '#prd-1-1');
  assert.equal(para.children[1].children[0].value, 'PRD-1.1');
  assert.equal(para.children[2].value, ') here.');
});

test('Test 3: comma-separated (see PRD-1, PRD-3.4) becomes two links separated by ", "', () => {
  const tree = paragraph('Refs (see PRD-1, PRD-3.4) end.');
  runPlugin(tree);
  const para = tree.children[0];
  // Expect: text "Refs (see ", link[PRD-1], text ", ", link[PRD-3.4], text ") end."
  assert.equal(para.children.length, 5);
  assert.equal(para.children[0].type, 'text');
  assert.equal(para.children[0].value, 'Refs (see ');
  assert.equal(para.children[1].type, 'link');
  assert.equal(para.children[1].url, '#prd-1');
  assert.equal(para.children[1].children[0].value, 'PRD-1');
  assert.equal(para.children[2].type, 'text');
  assert.equal(para.children[2].value, ', ');
  assert.equal(para.children[3].type, 'link');
  assert.equal(para.children[3].url, '#prd-3-4');
  assert.equal(para.children[3].children[0].value, 'PRD-3.4');
  assert.equal(para.children[4].type, 'text');
  assert.equal(para.children[4].value, ') end.');
});

test('Test 4: surrounding "(see " and ")" remain as text nodes (not consumed into the link)', () => {
  const tree = paragraph('A (see PRD-2) B');
  runPlugin(tree);
  const para = tree.children[0];
  // First text must end with `(see ` (with trailing space); last text must start with `)`.
  assert.equal(para.children[0].type, 'text');
  assert.ok(para.children[0].value.endsWith('(see '), `expected trailing "(see " in: ${JSON.stringify(para.children[0].value)}`);
  assert.equal(para.children[1].type, 'link');
  assert.equal(para.children[1].children[0].value, 'PRD-2');
  // The link's text must not include the literal "see " or the parens.
  assert.ok(!para.children[1].children[0].value.includes('see'));
  assert.ok(!para.children[1].children[0].value.includes('('));
  assert.ok(!para.children[1].children[0].value.includes(')'));
  assert.equal(para.children[2].type, 'text');
  assert.ok(para.children[2].value.startsWith(')'), `expected leading ")" in: ${JSON.stringify(para.children[2].value)}`);
});

test('Test 5: bare PRD-1.1 (no "see" prefix) is NOT linked', () => {
  const tree = paragraph('Bare PRD-1.1 token.');
  runPlugin(tree);
  const para = tree.children[0];
  // Should remain as a single text node, no link nodes.
  assert.equal(para.children.length, 1);
  assert.equal(para.children[0].type, 'text');
  assert.equal(para.children[0].value, 'Bare PRD-1.1 token.');
});

test('Test 6: text inside a `code` (block code) parent is left untouched', () => {
  const tree = {
    type: 'root',
    children: [
      { type: 'code', value: 'The string (see PRD-1) inside code must not be rewritten.' },
    ],
  };
  runPlugin(tree);
  const codeNode = tree.children[0];
  // Code blocks store text in `value`, no children — plugin should not touch it.
  assert.equal(codeNode.type, 'code');
  assert.equal(codeNode.value, 'The string (see PRD-1) inside code must not be rewritten.');
});

test('Test 7: text inside an `inlineCode` parent is left untouched', () => {
  // inlineCode stores its content in `value` (not children) — but to exercise the
  // skip rule for tree walkers that might encounter a text-bearing inlineCode,
  // also build a defensive variant where inlineCode hypothetically contains a text child.
  const tree = {
    type: 'root',
    children: [
      {
        type: 'paragraph',
        children: [
          { type: 'text', value: 'See ' },
          {
            type: 'inlineCode',
            // Real inlineCode uses `value`; we also nest a text child to ensure the
            // ancestor-skip rule applies.
            value: '(see PRD-1)',
            children: [{ type: 'text', value: '(see PRD-1)' }],
          },
          { type: 'text', value: ' yes.' },
        ],
      },
    ],
  };
  runPlugin(tree);
  const para = tree.children[0];
  // The inlineCode's nested text child should remain untouched.
  const inlineCode = para.children[1];
  assert.equal(inlineCode.type, 'inlineCode');
  assert.equal(inlineCode.value, '(see PRD-1)');
  assert.equal(inlineCode.children.length, 1);
  assert.equal(inlineCode.children[0].type, 'text');
  assert.equal(inlineCode.children[0].value, '(see PRD-1)');
});

test('Test 8: text inside a `heading` parent is left untouched', () => {
  const tree = {
    type: 'root',
    children: [
      {
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'PRD-1.1: Plant Variants (see PRD-1)' }],
      },
    ],
  };
  runPlugin(tree);
  const heading = tree.children[0];
  assert.equal(heading.children.length, 1);
  assert.equal(heading.children[0].type, 'text');
  assert.equal(heading.children[0].value, 'PRD-1.1: Plant Variants (see PRD-1)');
});

test('Test 9: bare PRD-XX placeholder inside a heading is left untouched', () => {
  const tree = {
    type: 'root',
    children: [
      {
        type: 'heading',
        depth: 2,
        children: [{ type: 'text', value: 'PRD-XX: DPD Shipping Integration' }],
      },
    ],
  };
  runPlugin(tree);
  const heading = tree.children[0];
  assert.equal(heading.children.length, 1);
  assert.equal(heading.children[0].type, 'text');
  assert.equal(heading.children[0].value, 'PRD-XX: DPD Shipping Integration');
});

test('Test 10: idempotency — running plugin twice yields the same tree', () => {
  const input = paragraph('See (see PRD-1.1) and (see PRD-3.4).');
  // First run on a deep clone so we can compare structure later.
  const onceTree = JSON.parse(JSON.stringify(input));
  runPlugin(onceTree);
  const oneRunSnapshot = JSON.parse(JSON.stringify(onceTree));
  // Second run: feed the once-mutated tree back through the plugin.
  runPlugin(onceTree);
  assert.deepEqual(onceTree, oneRunSnapshot, 'second pass should produce identical structure');
});
