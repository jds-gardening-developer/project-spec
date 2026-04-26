import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  isSchemaHeader,
  extractHeaderCells,
  extractBodyRows,
  detectFkType,
} from './SchemaTable.helpers.js';

// ---- isSchemaHeader (D-08) ----

test('Test 1: Title-Case Field|Type|Notes detected', () => {
  assert.equal(isSchemaHeader(['Field', 'Type', 'Notes']), true);
});

test('Test 2: lowercase field|type|notes detected', () => {
  assert.equal(isSchemaHeader(['field', 'type', 'notes']), true);
});

test('Test 3: whitespace trimmed', () => {
  assert.equal(isSchemaHeader(['  Field  ', 'Type', 'Notes']), true);
});

test('Test 4: 4-column Field|Type|Notes|Default NOT detected', () => {
  assert.equal(isSchemaHeader(['Field', 'Type', 'Notes', 'Default']), false);
});

test('Test 5: Decision|Rationale|Outcome NOT detected', () => {
  assert.equal(isSchemaHeader(['Decision', 'Rationale', 'Outcome']), false);
});

test('Test 6: Field|Type|Description NOT detected (third column wrong)', () => {
  assert.equal(isSchemaHeader(['Field', 'Type', 'Description']), false);
});

test('Test 7: Stage|Status|Reason NOT detected', () => {
  assert.equal(isSchemaHeader(['Stage', 'Status', 'Reason']), false);
});

test('Test 8: null/empty/short input returns false', () => {
  assert.equal(isSchemaHeader(null), false);
  assert.equal(isSchemaHeader([]), false);
  assert.equal(isSchemaHeader(['a', 'b']), false);
  assert.equal(isSchemaHeader(undefined), false);
});

// ---- extractHeaderCells / extractBodyRows ----

function elem(type, children) {
  return { type, props: { children } };
}

test('Test 9: extractHeaderCells reads thead > tr > th text', () => {
  const tableChildren = [
    elem('thead', elem('tr', [
      elem('th', 'Field'),
      elem('th', 'Type'),
      elem('th', 'Notes'),
    ])),
    elem('tbody', []),
  ];
  assert.deepEqual(extractHeaderCells(tableChildren), ['Field', 'Type', 'Notes']);
});

test('Test 10: extractBodyRows preserves cell children including backslash escapes', () => {
  const tableChildren = [
    elem('thead', elem('tr', [
      elem('th', 'Field'), elem('th', 'Type'), elem('th', 'Notes'),
    ])),
    elem('tbody', [
      elem('tr', [
        elem('td', 'created\\_by'),
        elem('td', 'FK → User'),
        elem('td', 'creator'),
      ]),
      elem('tr', [
        elem('td', 'name'),
        elem('td', 'string'),
        elem('td', ''),
      ]),
    ]),
  ];
  const rows = extractBodyRows(tableChildren);
  assert.equal(rows.length, 2);
  assert.equal(rows[0][0], 'created\\_by');   // backslash preserved literal
  assert.equal(rows[0][1], 'FK → User');
  assert.equal(rows[0][2], 'creator');
  assert.equal(rows[1][0], 'name');
  assert.equal(rows[1][1], 'string');
});

// ---- detectFkType (D-11) ----

test('Test 11: detectFkType identifies the FK arrow', () => {
  assert.equal(detectFkType('FK → Plant'), true);
  assert.equal(detectFkType('FK → User'), true);
  assert.equal(detectFkType('string'), false);
  assert.equal(detectFkType('decimal'), false);
  assert.equal(detectFkType(''), false);
  assert.equal(detectFkType(null), false);
});
