/**
 * SchemaPage.helpers.test.js — covers the pure helpers extracted from
 * SchemaPage.jsx so the diagram synthesis + slug logic can be exercised
 * without booting Vite or react-dom (matches SchemaTable.helpers.test.js
 * pattern — JSX-free unit tests under `node --test`).
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  slugify,
  safeMermaidIdent,
  buildErDiagramSource,
  sortedEntities,
  DIAGRAM_FIELD_CAP,
} from './SchemaPage.helpers.js';

// ---------- slugify ----------

describe('slugify', () => {
  it("'Plant Variant' → 'plant-variant'", () => {
    assert.equal(slugify('Plant Variant'), 'plant-variant');
  });

  it("collapses runs of non-alphanum and trims leading/trailing dashes", () => {
    assert.equal(slugify('  Foo   Bar!! '), 'foo-bar');
  });

  it("'Order Line Item' → 'order-line-item'", () => {
    assert.equal(slugify('Order Line Item'), 'order-line-item');
  });
});

// ---------- safeMermaidIdent ----------

describe('safeMermaidIdent', () => {
  it("'date (nullable)' → 'date_nullable_' style — non-alphanum collapsed to '_'", () => {
    // The exact internal underscores aren't load-bearing; we just need to
    // know the result is mermaid-safe (only [A-Za-z0-9_]).
    const out = safeMermaidIdent('date (nullable)');
    assert.match(out, /^[A-Za-z0-9_]+$/);
  });

  it("falls back to 'unnamed' when input is all junk", () => {
    assert.equal(safeMermaidIdent('!!!'), 'unnamed');
  });

  it("preserves alphanumerics + underscore as-is", () => {
    assert.equal(safeMermaidIdent('plant_variant'), 'plant_variant');
  });
});

// ---------- sortedEntities ----------

describe('sortedEntities', () => {
  it('sorts alphabetically by name and does not mutate input', () => {
    const input = [
      { name: 'Plant Variant', prd_id: 'prd-1', fields: [] },
      { name: 'Order', prd_id: 'prd-2', fields: [] },
      { name: 'Plant', prd_id: 'prd-1', fields: [] },
    ];
    const snapshot = JSON.stringify(input);
    const out = sortedEntities(input);
    assert.deepEqual(
      out.map((e) => e.name),
      ['Order', 'Plant', 'Plant Variant']
    );
    assert.equal(JSON.stringify(input), snapshot, 'input should not be mutated');
  });

  it('returns [] for non-array input', () => {
    assert.deepEqual(sortedEntities(null), []);
    assert.deepEqual(sortedEntities(undefined), []);
  });
});

// ---------- buildErDiagramSource ----------

describe('buildErDiagramSource', () => {
  const FAKE = {
    entities: [
      {
        name: 'Plant',
        prd_id: 'prd-1',
        fields: [
          { name: 'name', type: 'string', notes: '' },
          { name: 'category', type: 'string', notes: '' },
        ],
      },
      {
        name: 'Plant Variant',
        prd_id: 'prd-1-1',
        fields: [
          { name: 'plant', type: 'FK → Plant', notes: '' },
          { name: 'pot_size', type: 'enum', notes: '' },
        ],
      },
    ],
    relationships: [
      { from: 'Plant Variant', to: 'Plant', label: 'plant' },
    ],
  };

  it('contains the literal "erDiagram" line after the init directive', () => {
    const out = buildErDiagramSource(FAKE);
    assert.match(out, /^%%\{init:.*?\}%%\nerDiagram\n/);
  });

  it('declares every entity with quoted name and an attribute block', () => {
    const out = buildErDiagramSource(FAKE);
    assert.match(out, /"Plant" \{/);
    assert.match(out, /"Plant Variant" \{/);
    // Closing braces — one per entity (2 here).
    const closes = out.match(/^ {4}\}$/gm) || [];
    assert.equal(closes.length, 2);
  });

  it('emits one }o--|| edge per relationship with quoted endpoints + label', () => {
    const out = buildErDiagramSource(FAKE);
    assert.match(out, /"Plant Variant" \}o--\|\| "Plant" : "plant"/);
  });

  it('caps fields per entity at DIAGRAM_FIELD_CAP', () => {
    const big = {
      entities: [
        {
          name: 'Wide',
          prd_id: 'prd-9',
          fields: Array.from({ length: 20 }, (_, i) => ({
            name: `f${i}`,
            type: 'string',
            notes: '',
          })),
        },
      ],
      relationships: [],
    };
    const out = buildErDiagramSource(big);
    const indented = out.split('\n').filter((l) => /^ {8}\S/.test(l));
    assert.equal(indented.length, DIAGRAM_FIELD_CAP);
  });

  it('returns init directive + "erDiagram" for malformed input', () => {
    for (const bad of [null, {}, { entities: 'not-an-array' }]) {
      const out = buildErDiagramSource(bad);
      assert.match(out, /^%%\{init:.*?\}%%\nerDiagram\n$/);
    }
  });

  it('escapes embedded double-quotes in relationship labels', () => {
    const data = {
      entities: [],
      relationships: [{ from: 'A', to: 'B', label: 'has "weird" quote' }],
    };
    const out = buildErDiagramSource(data);
    assert.match(out, /: "has \\"weird\\" quote"/);
  });

  it('handles entities with empty fields array gracefully', () => {
    const data = {
      entities: [{ name: 'Empty', prd_id: 'prd-9', fields: [] }],
      relationships: [],
    };
    const out = buildErDiagramSource(data);
    assert.match(out, /"Empty" \{\n {4}\}/);
  });
});

// ---------- entity rendering contract (slug + href derivation) ----------
//
// SchemaPage.jsx renders
//     <article id={`entity-${slugify(entity.name)}`}>
//       <a href={`#/${entity.prd_id}`}>View in spec →</a>
//
// These tests pin those derivations so a future refactor can't silently break
// the "click an entity → land on its PRD" UX contract.

describe('entity-id + spec-link derivation', () => {
  it('article id for "Plant Variant" is "entity-plant-variant"', () => {
    assert.equal(`entity-${slugify('Plant Variant')}`, 'entity-plant-variant');
  });

  it('article id for "Order Line Item" is "entity-order-line-item"', () => {
    assert.equal(`entity-${slugify('Order Line Item')}`, 'entity-order-line-item');
  });

  it('spec-link href for prd_id "prd-1-1" is "#/prd-1-1"', () => {
    const entity = { name: 'Plant Variant', prd_id: 'prd-1-1' };
    assert.equal(`#/${entity.prd_id}`, '#/prd-1-1');
  });

  it('spec-link href for prd_id "prd-2" is "#/prd-2"', () => {
    const entity = { name: 'Order', prd_id: 'prd-2' };
    assert.equal(`#/${entity.prd_id}`, '#/prd-2');
  });
});
