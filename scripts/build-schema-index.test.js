/**
 * build-schema-index.test.js — node:test cases for the pure helpers in
 * build-schema-index.mjs. Picked up automatically by `npm test`'s
 * `scripts/*.test.js` glob (Task 1, 260427-gjf).
 *
 * Mirrors the style of build-search-index.test.mjs (its sibling) — fixture
 * markdown is embedded inline so each test reads as a self-contained
 * specification.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  unescapeUnderscores,
  parseEntitiesFromMarkdown,
  extractRelationships,
  slugPrdHeading,
} from "./build-schema-index.mjs";

// ---------- unescapeUnderscores ----------

describe("unescapeUnderscores", () => {
  it("unescapes the spec convention `created\\_by` → `created_by`", () => {
    assert.equal(unescapeUnderscores("created\\_by"), "created_by");
  });

  it("trims surrounding whitespace", () => {
    assert.equal(unescapeUnderscores("  foo  "), "foo");
  });

  it("no-op when input has no escapes", () => {
    assert.equal(unescapeUnderscores("plant"), "plant");
  });

  it("returns empty string for non-strings", () => {
    assert.equal(unescapeUnderscores(null), "");
    assert.equal(unescapeUnderscores(undefined), "");
  });
});

// ---------- slugPrdHeading ----------

describe("slugPrdHeading", () => {
  it("PRD-1 → prd-1", () => {
    assert.equal(slugPrdHeading("PRD-1: Plant Database & Inventory"), "prd-1");
  });

  it("PRD-1.1 → prd-1-1 (dots → dashes, mirrors normalizeRecord)", () => {
    assert.equal(slugPrdHeading("PRD-1.1: Plant Variants"), "prd-1-1");
  });

  it("non-PRD heading falls back to github-slugger", () => {
    // Bare heading text — no PRD prefix — gets the standard slug treatment.
    assert.equal(slugPrdHeading("Meeting Action Items"), "meeting-action-items");
  });
});

// ---------- parseEntitiesFromMarkdown ----------

describe("parseEntitiesFromMarkdown", () => {
  // Fixture covers:
  //   - PRD-1 with three entities (Plant + Plant Variant + Plant Batch) sharing
  //     a single `### **Data Model**` block.
  //   - PRD-2 with a single entity (Order).
  //   - An FK with `(nullable)` annotation.
  //   - An underscore-escaped field name (`created\_by`).
  //   - An entity-looking `**SomeProse**` label OUTSIDE any Data Model section
  //     that must NOT be collected.
  //   - A label inside a Data Model section that has NO following table — also
  //     must NOT be collected.
  const FIXTURE = [
    "# Spec",
    "",
    "## **PRD-1: Plant Database & Inventory**",
    "",
    "### **Data Model**",
    "",
    "**Plant**",
    "",
    "| Field | Type | Notes |",
    "| --- | --- | --- |",
    "| name | string | |",
    "| latin\\_name | string | |",
    "| created\\_by | FK → User | |",
    "",
    "**Plant Variant** *(one per pot size; a Plant has many)*",
    "",
    "| Field | Type | Notes |",
    "| --- | --- | --- |",
    "| plant | FK → Plant | |",
    "| pot\\_size | enum | 7cm/9cm/1L |",
    "",
    "**Plant Batch**",
    "",
    "| Field | Type | Notes |",
    "| --- | --- | --- |",
    "| plant\\_variant | FK → Plant Variant | |",
    "| reserved\\_against | FK → Order (nullable) | |",
    "",
    "### **What Is It**",
    "",
    "**SomeProseLabel** is something we mention in narrative.",
    "",
    "## **PRD-2: Order Lifecycle**",
    "",
    "### **Data Model**",
    "",
    "**Order**",
    "",
    "| Field | Type | Notes |",
    "| --- | --- | --- |",
    "| customer | FK → User | |",
    "| status | enum | draft/issued/paid |",
    "",
    "**EntityWithoutTable**",
    "",
    "Some narrative paragraph and not a Field|Type|Notes table.",
    "",
  ].join("\n");

  it("Test 1: emits one record per `**Entity**` label that is followed by a Field|Type|Notes table", () => {
    const entities = parseEntitiesFromMarkdown(FIXTURE);
    const names = entities.map((e) => e.name);
    assert.deepEqual(names, ["Plant", "Plant Variant", "Plant Batch", "Order"]);
    // Each record has the expected shape.
    for (const e of entities) {
      assert.equal(typeof e.name, "string");
      assert.equal(typeof e.prd_id, "string");
      assert.ok(Array.isArray(e.fields), "fields is an array");
      assert.ok(e.fields.length > 0, "entity has at least one field");
      for (const f of e.fields) {
        assert.equal(typeof f.name, "string");
        assert.equal(typeof f.type, "string");
        assert.equal(typeof f.notes, "string");
      }
    }
  });

  it("Test 2: underscore-escaped field names (`created\\_by`) are unescaped to `created_by`", () => {
    const entities = parseEntitiesFromMarkdown(FIXTURE);
    const plant = entities.find((e) => e.name === "Plant");
    assert.ok(plant, "Plant entity present");
    const fieldNames = plant.fields.map((f) => f.name);
    assert.ok(fieldNames.includes("created_by"), `expected 'created_by' in ${JSON.stringify(fieldNames)}`);
    assert.ok(fieldNames.includes("latin_name"), `expected 'latin_name' in ${JSON.stringify(fieldNames)}`);
  });

  it("Test 4: prd_id is the slug of the closest preceding ## **PRD-N(.M): Title** heading", () => {
    const entities = parseEntitiesFromMarkdown(FIXTURE);
    for (const e of entities) {
      if (["Plant", "Plant Variant", "Plant Batch"].includes(e.name)) {
        assert.equal(e.prd_id, "prd-1", `${e.name} should belong to prd-1`);
      }
      if (e.name === "Order") {
        assert.equal(e.prd_id, "prd-2");
      }
    }
  });

  it("Test 4b: PRD-N.M heading produces 'prd-n-m' slug (dots → dashes)", () => {
    const md = [
      "## **PRD-1.1: Plant Variants**",
      "",
      "### **Data Model**",
      "",
      "**Plant Variant**",
      "",
      "| Field | Type | Notes |",
      "| --- | --- | --- |",
      "| sku | string | |",
      "",
    ].join("\n");
    const entities = parseEntitiesFromMarkdown(md);
    assert.equal(entities.length, 1);
    assert.equal(entities[0].prd_id, "prd-1-1");
  });

  it("Test 5: entities outside any Data Model block are NOT collected", () => {
    const entities = parseEntitiesFromMarkdown(FIXTURE);
    const names = entities.map((e) => e.name);
    assert.ok(!names.includes("SomeProseLabel"), "narrative-prose label was wrongly collected");
  });

  it("Test 5b: entity label inside a Data Model block but with no following table is NOT collected", () => {
    const entities = parseEntitiesFromMarkdown(FIXTURE);
    const names = entities.map((e) => e.name);
    assert.ok(
      !names.includes("EntityWithoutTable"),
      "label without a following table was wrongly collected"
    );
  });

  it("Test 6: a single Data Model section containing multiple entities emits all of them", () => {
    const entities = parseEntitiesFromMarkdown(FIXTURE);
    const prd1Entities = entities.filter((e) => e.prd_id === "prd-1");
    assert.equal(prd1Entities.length, 3, `expected 3 entities under prd-1, got ${prd1Entities.length}`);
    const prd1Names = prd1Entities.map((e) => e.name);
    assert.deepEqual(prd1Names.sort(), ["Plant", "Plant Batch", "Plant Variant"]);
  });

  it("returns [] for non-string input", () => {
    assert.deepEqual(parseEntitiesFromMarkdown(null), []);
    assert.deepEqual(parseEntitiesFromMarkdown(123), []);
  });

  it("ignores fenced code blocks (a `**Foo**` line inside ```...``` is not an entity)", () => {
    const md = [
      "## **PRD-9: Foo**",
      "",
      "### **Data Model**",
      "",
      "```",
      "**FakeEntity**",
      "",
      "| Field | Type | Notes |",
      "| --- | --- | --- |",
      "| x | int | |",
      "```",
      "",
    ].join("\n");
    const entities = parseEntitiesFromMarkdown(md);
    assert.equal(entities.length, 0);
  });
});

// ---------- extractRelationships ----------

describe("extractRelationships", () => {
  it("Test 3: emits one record per FK → X cell", () => {
    const entities = [
      {
        name: "Plant Variant",
        prd_id: "prd-1",
        fields: [
          { name: "plant", type: "FK → Plant", notes: "" },
          { name: "pot_size", type: "enum", notes: "" },
        ],
      },
      {
        name: "Plant Batch",
        prd_id: "prd-1",
        fields: [
          { name: "plant_variant", type: "FK → Plant Variant", notes: "" },
        ],
      },
    ];
    const rels = extractRelationships(entities);
    assert.equal(rels.length, 2);
    assert.deepEqual(
      rels.find((r) => r.from === "Plant Variant"),
      { from: "Plant Variant", to: "Plant", label: "plant" }
    );
    assert.deepEqual(
      rels.find((r) => r.from === "Plant Batch"),
      { from: "Plant Batch", to: "Plant Variant", label: "plant_variant" }
    );
  });

  it("Test 3b: (nullable) annotation is preserved on the label and stripped from the target", () => {
    const entities = [
      {
        name: "Plant Batch",
        prd_id: "prd-1",
        fields: [
          { name: "reserved_against", type: "FK → Order (nullable)", notes: "" },
        ],
      },
    ];
    const rels = extractRelationships(entities);
    assert.equal(rels.length, 1);
    assert.equal(rels[0].from, "Plant Batch");
    assert.equal(rels[0].to, "Order"); // (nullable) stripped from target
    assert.equal(rels[0].label, "reserved_against (nullable)"); // preserved on label
  });

  it("Test 3c: duplicate edges with the same from + to + label are de-duplicated", () => {
    const entities = [
      {
        name: "X",
        prd_id: "prd-9",
        fields: [
          { name: "y_ref", type: "FK → Y", notes: "" },
          { name: "y_ref", type: "FK → Y", notes: "duplicate" }, // same key
        ],
      },
    ];
    const rels = extractRelationships(entities);
    assert.equal(rels.length, 1);
  });

  it("output is sorted by from, then to, then label (stable across builds)", () => {
    const entities = [
      {
        name: "B",
        prd_id: "prd-1",
        fields: [{ name: "a_ref", type: "FK → A", notes: "" }],
      },
      {
        name: "A",
        prd_id: "prd-1",
        fields: [
          { name: "z_ref", type: "FK → Z", notes: "" },
          { name: "y_ref", type: "FK → Y", notes: "" },
        ],
      },
    ];
    const rels = extractRelationships(entities);
    assert.deepEqual(
      rels.map((r) => `${r.from}→${r.to}:${r.label}`),
      ["A→Y:y_ref", "A→Z:z_ref", "B→A:a_ref"]
    );
  });

  it("returns [] for non-array input", () => {
    assert.deepEqual(extractRelationships(null), []);
    assert.deepEqual(extractRelationships(undefined), []);
  });

  it("ignores fields whose type is not an FK arrow", () => {
    const entities = [
      {
        name: "Plant",
        prd_id: "prd-1",
        fields: [
          { name: "name", type: "string", notes: "" },
          { name: "category", type: "enum", notes: "" },
        ],
      },
    ];
    assert.deepEqual(extractRelationships(entities), []);
  });
});
