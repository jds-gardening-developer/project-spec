#!/usr/bin/env node
/**
 * build-component-map-index.mjs — Build-time component-map extractor.
 *
 * Reads the newest `project-spec/YYYY-MM-DD.md`, reuses the Data Model entity
 * extraction from build-schema-index, and emits a navigation-style map at:
 *   app/src/component-map-index.json
 *
 * The map is intentionally UI-oriented. For each entity we emit a default
 * sub-page set:
 *   - List
 *   - Create / Edit
 *   - Preview
 *
 * This keeps the component map fully document-driven while giving the frontend
 * a stable structure to render.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  parseEntitiesFromMarkdown,
  extractRelationships,
} from "./build-schema-index.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.resolve(REPO_ROOT, "project-spec");
const OUT_PATH = path.resolve(REPO_ROOT, "app/src/component-map-index.json");

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}\.md$/;

const DEFAULT_SUBPAGES = Object.freeze([
  { id: "list", label: "List" },
  { id: "create-edit", label: "Create / Edit" },
  { id: "preview", label: "Preview" },
]);

export function buildComponentMapFromEntities(entities) {
  if (!Array.isArray(entities)) return [];

  const seenByName = new Map();
  for (const entity of entities) {
    if (!entity || typeof entity.name !== "string") continue;
    const name = entity.name.trim();
    if (!name) continue;
    if (!seenByName.has(name)) {
      seenByName.set(name, {
        name,
        prd_id: typeof entity.prd_id === "string" ? entity.prd_id : "",
        subpages: DEFAULT_SUBPAGES,
      });
    }
  }

  return [...seenByName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

export function buildComponentDependencies(components, relationships) {
  if (!Array.isArray(components) || !Array.isArray(relationships)) return [];

  const known = new Set(components.map((c) => c.name));
  const seen = new Set();
  const out = [];

  for (const rel of relationships) {
    if (!rel || typeof rel.from !== "string" || typeof rel.to !== "string") continue;
    if (rel.from === rel.to) continue;
    if (!known.has(rel.from) || !known.has(rel.to)) continue;

    const label = typeof rel.label === "string" ? rel.label : "depends_on";
    const key = `${rel.from}|${rel.to}|${label}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ from: rel.from, to: rel.to, label });
  }

  out.sort((a, b) => {
    if (a.from !== b.from) return a.from.localeCompare(b.from);
    if (a.to !== b.to) return a.to.localeCompare(b.to);
    return a.label.localeCompare(b.label);
  });

  return out;
}

function isCli() {
  try {
    const me = fileURLToPath(import.meta.url);
    return process.argv[1] && path.resolve(process.argv[1]) === me;
  } catch {
    return false;
  }
}

function newestSpecPath() {
  if (!fs.existsSync(SPEC_DIR)) {
    throw new Error(`project-spec/ not found at ${SPEC_DIR}`);
  }

  const files = fs
    .readdirSync(SPEC_DIR)
    .filter((name) => path.basename(name) === name && ISO_DATE_RE.test(name))
    .sort()
    .reverse();

  if (files.length === 0) {
    throw new Error("No YYYY-MM-DD.md files found in project-spec/");
  }

  return path.resolve(SPEC_DIR, files[0]);
}

function main() {
  let sourcePath;
  try {
    sourcePath = newestSpecPath();
  } catch (err) {
    console.error(`build-component-map-index: ${err.message}`);
    process.exit(1);
  }

  const markdown = fs.readFileSync(sourcePath, "utf-8");
  const entities = parseEntitiesFromMarkdown(markdown);
  const components = buildComponentMapFromEntities(entities);
  const relationships = extractRelationships(entities);
  const dependencies = buildComponentDependencies(components, relationships);

  const payload = {
    source: path.relative(REPO_ROOT, sourcePath),
    generated_at: new Date().toISOString(),
    components,
    dependencies,
  };

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(payload, null, 2) + "\n", "utf-8");

  console.log(`build-component-map-index: source     ${path.relative(REPO_ROOT, sourcePath)}`);
  console.log(`build-component-map-index: entities   ${entities.length}`);
  console.log(`build-component-map-index: components ${components.length}`);
  console.log(`build-component-map-index: deps       ${dependencies.length}`);
  console.log(`build-component-map-index: wrote      ${path.relative(REPO_ROOT, OUT_PATH)}`);
}

if (isCli()) {
  main();
}
