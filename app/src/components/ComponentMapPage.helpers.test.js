import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import { buildComponentGraphSource } from './ComponentMapPage.helpers.js';

describe('buildComponentGraphSource', () => {
  it('returns flowchart header for empty input', () => {
    assert.equal(buildComponentGraphSource(null), 'flowchart LR\n');
    assert.equal(buildComponentGraphSource({ components: [] }), 'flowchart LR\n');
  });

  it('creates subgraph per component with separate view nodes', () => {
    const out = buildComponentGraphSource({
      components: [
        {
          name: 'Plant',
          subpages: [
            { label: 'List' },
            { label: 'Create / Edit' },
            { label: 'Preview' },
          ],
        },
      ],
      dependencies: [],
    });

    assert.match(out, /flowchart LR/);
    assert.match(out, /subgraph sg_plant\["Plant"\]/);
    assert.match(out, /c_plant_list\["List"\]/);
    assert.match(out, /c_plant_create_edit\["Create \/ Edit"\]/);
    assert.match(out, /c_plant_preview\["Preview"\]/);
    assert.match(out, /c_plant_list --> c_plant_preview/);
    assert.match(out, /c_plant_create_edit --> c_plant_preview/);
  });

  it('creates directed edges with labels for dependencies', () => {
    const out = buildComponentGraphSource({
      components: [
        { name: 'Plant', subpages: [] },
        { name: 'Plant Variant', subpages: [] },
      ],
      dependencies: [
        { from: 'Plant Variant', to: 'Plant', label: 'plant' },
      ],
    });

    assert.match(out, /c_plant_variant_preview -->\|plant\| c_plant_preview/);
  });

  it('sanitises edge labels with nullable annotations for Mermaid flowchart', () => {
    const out = buildComponentGraphSource({
      components: [
        { name: 'Invoice', subpages: [] },
        { name: 'User', subpages: [] },
      ],
      dependencies: [
        { from: 'Invoice', to: 'User', label: 'marked_paid_by (nullable)' },
      ],
    });

    assert.match(out, /c_invoice_preview -->\|marked_paid_by_nullable\| c_user_preview/);
  });

  it('adds classDef color themes and assigns Plant/User nodes to expected groups', () => {
    const out = buildComponentGraphSource({
      components: [
        { name: 'Plant', subpages: [] },
        { name: 'User', subpages: [] },
        { name: 'Supplier', subpages: [] },
        { name: 'Order', subpages: [] },
      ],
      dependencies: [],
    });

    assert.match(out, /classDef plant fill:/);
    assert.match(out, /classDef user fill:/);
    assert.match(out, /classDef partner fill:/);
    assert.match(out, /classDef commercial fill:/);
    assert.match(out, /class c_plant_list,c_plant_create_edit,c_plant_preview plant;/);
    assert.match(out, /class c_user_list,c_user_create_edit,c_user_preview user;/);
    assert.match(out, /class c_supplier_list,c_supplier_create_edit,c_supplier_preview partner;/);
    assert.match(out, /class c_order_list,c_order_create_edit,c_order_preview commercial;/);
  });
});
