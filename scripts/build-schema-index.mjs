#!/usr/bin/env node
/**
 * build-schema-index.mjs — Build-time schema-graph extractor for the spec viewer.
 *
 * Reads the newest project-spec/YYYY-MM-DD.md, walks every '### **Data Model**'
 * block, extracts each '**Entity**' label that is followed by a 3-column
 * Field|Type|Notes table, and emits a JSON file at app/src/schema-index.json.
 *
 * Wired into npm predev / prebuild via package.json (Task 1, 260427-gjf).
 *
 * Output schema:
 *   {
 *     source:        string  // relative path of the parsed spec file
 *     generated_at:  string  // ISO timestamp
 *     entities: [
 *       {
 *         name:    string  // e.g. "Plant", "Plant Variant"
 *         prd_id:  string  // e.g. "prd-1", "prd-1-1" (slug of nearest preceding ## heading)
 *         fields: [
 *           { name, type, notes }   // strings; underscore-escapes unwound
 *         ]
 *       }
 *     ],
 *     relationships: [
 *       { from, to, label }   // one record per FK → X cell; deduped + sorted
 *     ]
 *   }
 *
 * Mirrors scripts/build-search-index.mjs in style (banner comments, CLI/import
 * detection, newest-file selection, exported pure helpers for node:test).
 *
 * Usage:
 *   node scripts/build-schema-index.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";

// ---------- paths + constants ----------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.resolve(REPO_ROOT, "project-spec");
const OUT_PATH = path.resolve(REPO_ROOT, "app/src/schema-index.json");

const ISO_DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;
const PRD_ID_RE = /^\s*(PRD-\d+(?:\.\d+)?)/i;

// Match a stand-alone bold entity label line like:
//   **Plant**
//   **Plant Variant** *(one per pot size; a Plant has many)*
// A trailing italic annotation is allowed after the bold but nothing else.
const ENTITY_LABEL_RE = /^\*\*([^*]+)\*\*(?:\s*\*\([^)]+\)\*)?\s*$/;

// FK Type cell:  "FK → Plant"  /  "FK → Order (nullable)"
const FK_TYPE_RE = /^FK\s*→\s*(.+?)(?:\s*\(([^)]+)\))?\s*$/;

const TABLE_HEADER_RE = /^\s*\|\s*Field\s*\|\s*Type\s*\|\s*Notes\s*\|\s*$/i;
const TABLE_SEPARATOR_RE = /^\s*\|(?:\s*-+\s*\|){3}\s*$/;
const TABLE_ROW_RE = /^\s*\|/;

// ---------- pure helpers (exported for tests) ----------

/**
 * Reverse the spec convention of escaping underscores in field names:
 *   `created\_by`  →  `created_by`
 * Also trims surrounding whitespace.
 */
export function unescapeUnderscores(text) {
  if (typeof text !== "string") return "";
  return text.replace(/\\_/g, "_").trim();
}

/**
 * Slug a heading the same way build-search-index.mjs does so the schema-page's
 * "View in spec →" links match the rehype-slug-emitted DOM ids.
 *
 * For PRD headings ("PRD-1.1: Plant Variants") we additionally normalise dots
 * → dashes so 'PRD-1.1' becomes 'prd-1-1' (matches normalizeRecord in
 * build-search-index.mjs).
 */
export function slugPrdHeading(rawTitle) {
  const slugger = new GithubSlugger();
  const m = rawTitle.match(PRD_ID_RE);
  if (m) {
    return m[1].toLowerCase().replace(/\./g, "-");
  }
  return slugger.slug(rawTitle);
}

/**
 * Parse a row of pipe-separated cells. Returns an array of cell strings (the
 * outer leading/trailing `|` are stripped; surrounding whitespace per cell is
 * trimmed).
 */
function splitRow(line) {
  const trimmed = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return trimmed.split("|").map((c) => c.trim());
}

/**
 * parseEntitiesFromMarkdown(markdown) → [{ name, prd_id, fields: [{name,type,notes}] }, ...]
 *
 * Walks the document line-by-line, maintains:
 *   - currentPrdSlug      (updated on every `## **PRD-X[.Y]: Title**` heading)
 *   - inDataModel         (true between `### **Data Model**` and the next `### `)
 *   - pendingEntity       (last `**EntityName**` label seen while inDataModel)
 *
 * When a Field|Type|Notes header is encountered while pendingEntity is set,
 * starts a new entity record and consumes table rows until the table ends
 * (blank line or non-table line). Entity labels in narrative prose (no
 * following table) are silently dropped.
 *
 * Tracks fenced code-block state so `**Foo**` inside a fenced block is ignored.
 */
export function parseEntitiesFromMarkdown(markdown) {
  if (typeof markdown !== "string") return [];
  const lines = markdown.split(/\r?\n/);

  const entities = [];
  let currentPrdSlug = "";
  let inDataModel = false;
  let pendingEntity = null;
  let inCodeBlock = false;

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];

    // Code-block fences. While inside a fenced block we suppress all parsing.
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      i += 1;
      continue;
    }
    if (inCodeBlock) {
      i += 1;
      continue;
    }

    // ## heading — update currentPrdSlug if it matches a PRD-N(.M) form, else
    //              keep the previous PRD slug (a non-PRD H2 like "Meeting
    //              Action Items" doesn't reset the surrounding context — but
    //              there are no Data Models inside non-PRD H2 sections in
    //              practice, so the choice is academic).
    const h2Match = line.match(/^ {0,3}##(?!#)\s+(.+?)\s*$/);
    if (h2Match) {
      const title = h2Match[1].replace(/\*\*(.+?)\*\*/g, "$1").trim();
      const prdMatch = title.match(PRD_ID_RE);
      if (prdMatch) {
        currentPrdSlug = prdMatch[1].toLowerCase().replace(/\./g, "-");
      } else {
        currentPrdSlug = "";
      }
      // A new ## also closes any open Data Model section.
      inDataModel = false;
      pendingEntity = null;
      i += 1;
      continue;
    }

    // ### heading — toggle inDataModel.
    const h3Match = line.match(/^ {0,3}###(?!#)\s+(.+?)\s*$/);
    if (h3Match) {
      const title = h3Match[1].replace(/\*\*(.+?)\*\*/g, "$1").trim();
      inDataModel = title.toLowerCase() === "data model";
      pendingEntity = null;
      i += 1;
      continue;
    }

    if (!inDataModel) {
      i += 1;
      continue;
    }

    // Inside a Data Model block. Look for the entity label or a table header.
    const labelMatch = line.match(ENTITY_LABEL_RE);
    if (labelMatch) {
      pendingEntity = labelMatch[1].trim();
      i += 1;
      continue;
    }

    if (TABLE_HEADER_RE.test(line) && pendingEntity) {
      // Confirm this is a 3-column Field|Type|Notes header.
      const headerCells = splitRow(line).map((c) => c.toLowerCase());
      const isSchemaHeader =
        headerCells.length === 3 &&
        headerCells[0] === "field" &&
        headerCells[1] === "type" &&
        headerCells[2] === "notes";
      if (!isSchemaHeader) {
        i += 1;
        continue;
      }

      // Skip the separator row if present.
      let j = i + 1;
      if (j < lines.length && TABLE_SEPARATOR_RE.test(lines[j])) {
        j += 1;
      }

      // Consume body rows until we hit a non-table line (blank or otherwise).
      const fields = [];
      while (j < lines.length && TABLE_ROW_RE.test(lines[j])) {
        const cells = splitRow(lines[j]);
        if (cells.length >= 3) {
          fields.push({
            name: unescapeUnderscores(cells[0]),
            type: unescapeUnderscores(cells[1]),
            notes: unescapeUnderscores(cells[2]),
          });
        }
        j += 1;
      }

      entities.push({
        name: pendingEntity,
        prd_id: currentPrdSlug,
        fields,
      });
      pendingEntity = null;
      i = j;
      continue;
    }

    i += 1;
  }

  return entities;
}

/**
 * extractRelationships(entities) → [{ from, to, label }, ...]
 *
 * For every field whose `type` matches `FK → Target [(nullable)]`, emit one
 * relationship record. `label` is the field name; `(nullable)` is preserved
 * on the label as a trailing suffix so the diagram + diagnostics show which
 * edges are optional.
 *
 * Duplicate edges (same from + to + label) are de-duped. Output is sorted by
 * from, then to, then label so the JSON is stable across builds.
 */
export function extractRelationships(entities) {
  if (!Array.isArray(entities)) return [];
  const seen = new Set();
  const out = [];

  for (const entity of entities) {
    if (!entity || !Array.isArray(entity.fields)) continue;
    for (const field of entity.fields) {
      if (!field || typeof field.type !== "string") continue;
      const m = field.type.match(FK_TYPE_RE);
      if (!m) continue;
      const target = m[1].trim();
      const annotation = m[2] ? m[2].trim() : null;
      const label =
        annotation && annotation.toLowerCase() === "nullable"
          ? `${field.name} (nullable)`
          : field.name;
      const key = `${entity.name}|${target}|${label}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ from: entity.name, to: target, label });
    }
  }

  out.sort((a, b) => {
    if (a.from !== b.from) return a.from.localeCompare(b.from);
    if (a.to !== b.to) return a.to.localeCompare(b.to);
    return a.label.localeCompare(b.label);
  });

  return out;
}

// ---------- main (only runs as CLI, not when imported by tests) ----------

function isCli() {
  try {
    const me = fileURLToPath(import.meta.url);
    return process.argv[1] && path.resolve(process.argv[1]) === me;
  } catch {
    return false;
  }
}

if (isCli()) {
  main();
}

function main() {
  if (!fs.existsSync(SPEC_DIR)) {
    console.error(`build-schema-index: project-spec/ not found at ${SPEC_DIR}`);
    process.exit(1);
  }

  const allEntries = fs.readdirSync(SPEC_DIR);

  const matched = [];
  const skipped = [];
  for (const entry of allEntries) {
    if (path.basename(entry) !== entry) {
      skipped.push({ entry, reason: "filename contains path separators (refused)" });
      continue;
    }
    const m = entry.match(ISO_DATE_RE);
    if (!m) {
      skipped.push({ entry, reason: "filename does not match YYYY-MM-DD.md" });
      continue;
    }
    matched.push({ date: m[1], filename: entry });
  }

  if (matched.length === 0) {
    console.error("build-schema-index: no YYYY-MM-DD.md files found in project-spec/");
    console.error(`Scanned ${allEntries.length} entries; ${skipped.length} skipped.`);
    process.exit(1);
  }

  matched.sort((a, b) => b.date.localeCompare(a.date));
  const newest = matched[0];
  const sourcePath = path.resolve(SPEC_DIR, newest.filename);
  const markdown = fs.readFileSync(sourcePath, "utf-8");

  const entities = parseEntitiesFromMarkdown(markdown);
  const relationships = extractRelationships(entities);

  const totalFields = entities.reduce((acc, e) => acc + e.fields.length, 0);

  const payload = {
    source: path.relative(REPO_ROOT, sourcePath),
    generated_at: new Date().toISOString(),
    entities,
    relationships,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf-8");

  console.log(`build-schema-index: source        ${path.relative(REPO_ROOT, sourcePath)}`);
  console.log(`build-schema-index: scanned       ${allEntries.length} entries`);
  console.log(`build-schema-index: skipped       ${skipped.length} non-matching entries`);
  console.log(`build-schema-index: entities      ${entities.length}`);
  console.log(`build-schema-index: fields        ${totalFields.toLocaleString()}`);
  console.log(`build-schema-index: relationships ${relationships.length}`);
  console.log(`build-schema-index: wrote         ${path.relative(REPO_ROOT, OUT_PATH)}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1) The Vite app dynamic-imports app/src/schema-index.json from SchemaPage.jsx.");
  console.log("  2) Visit http://localhost:5173/#/schema after `npm run dev` to see the diagram.");
}
