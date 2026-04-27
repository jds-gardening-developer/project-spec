#!/usr/bin/env node
/**
 * build-search-index.mjs — STUB.
 *
 * Plan 03-04 (Phase 3) replaces this with real spec parsing + MiniSearch index
 * emission. For now this writes an empty array to app/src/search-index.json so
 * the predev/prebuild hook chain succeeds and downstream JSON imports resolve.
 *
 * Mirrors the shape of scripts/build-manifest.mjs (shebang, JSDoc header, ESM
 * imports with node: prefix, ISO_DATE_RE filter convention will be reused once
 * Plan 03-04 fills in the real scan loop).
 *
 * Usage:
 *   node scripts/build-search-index.mjs
 *
 * Output:
 *   app/src/search-index.json — currently `[]` (empty array placeholder).
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------- paths ----------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.resolve(REPO_ROOT, "app/src/search-index.json");

// ---------- write stub ----------

fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
fs.writeFileSync(OUT_PATH, JSON.stringify([], null, 2) + "\n", "utf-8");

// ---------- report ----------

console.log(`build-search-index: wrote stub (empty array) to ${path.relative(REPO_ROOT, OUT_PATH)}`);
console.log("STUB — Plan 03-04 will replace this with real index emission");
