import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  buildComponentMapFromEntities,
  buildComponentDependencies,
} from "./build-component-map-index.mjs";

describe("buildComponentMapFromEntities", () => {
  it("maps each entity to a component with default subpages", () => {
    const out = buildComponentMapFromEntities([
      { name: "Plant", prd_id: "prd-1", fields: [] },
      { name: "Order", prd_id: "prd-3", fields: [] },
    ]);

    assert.equal(out.length, 2);
    assert.deepEqual(out[0].subpages, [
      { id: "list", label: "List" },
      { id: "create-edit", label: "Create / Edit" },
      { id: "preview", label: "Preview" },
    ]);
  });

  it("deduplicates entity names and keeps first prd_id", () => {
    const out = buildComponentMapFromEntities([
      { name: "Plant", prd_id: "prd-1", fields: [] },
      { name: "Plant", prd_id: "prd-99", fields: [] },
    ]);

    assert.equal(out.length, 1);
    assert.equal(out[0].name, "Plant");
    assert.equal(out[0].prd_id, "prd-1");
  });

  it("returns [] for non-array input", () => {
    assert.deepEqual(buildComponentMapFromEntities(null), []);
    assert.deepEqual(buildComponentMapFromEntities(undefined), []);
    assert.deepEqual(buildComponentMapFromEntities("bad"), []);
  });
});

describe("buildComponentDependencies", () => {
  it("maps relationship edges between known components", () => {
    const components = [
      { name: "Plant" },
      { name: "Plant Variant" },
      { name: "Order" },
    ];
    const relationships = [
      { from: "Plant Variant", to: "Plant", label: "plant" },
      { from: "Plant Variant", to: "Order", label: "reserved_against" },
    ];

    const out = buildComponentDependencies(components, relationships);
    assert.deepEqual(out, [
      { from: "Plant Variant", to: "Order", label: "reserved_against" },
      { from: "Plant Variant", to: "Plant", label: "plant" },
    ]);
  });

  it("filters unknown/self dependencies and deduplicates", () => {
    const components = [{ name: "A" }, { name: "B" }];
    const relationships = [
      { from: "A", to: "B", label: "x" },
      { from: "A", to: "B", label: "x" },
      { from: "A", to: "A", label: "self" },
      { from: "A", to: "C", label: "unknown" },
    ];

    const out = buildComponentDependencies(components, relationships);
    assert.deepEqual(out, [{ from: "A", to: "B", label: "x" }]);
  });

  it("returns [] for invalid input", () => {
    assert.deepEqual(buildComponentDependencies(null, []), []);
    assert.deepEqual(buildComponentDependencies([], null), []);
  });
});
