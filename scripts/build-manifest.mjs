#!/usr/bin/env node
/**
 * build-manifest.mjs — Build-time scan of dated spec snapshots.
 *
 * Reads project-spec/YYYY-MM-DD.md files, sorts by ISO date descending,
 * and writes app/src/manifest.json. Wired into `npm run dev` and `npm run build`
 * via the `predev` / `prebuild` hooks in package.json so it runs automatically.
 *
 * Usage:
 *   node scripts/build-manifest.mjs
 *
 * Output:
 *   app/src/manifest.json — [{ "date": "YYYY-MM-DD", "filename": "YYYY-MM-DD.md" }, ...]
 *   sorted newest-first.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------- paths ----------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.resolve(REPO_ROOT, "project-spec");
const MANIFEST_PATH = path.resolve(REPO_ROOT, "app/src/manifest.json");

const ISO_DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;

// ---------- pre-flight ----------

if (!fs.existsSync(SPEC_DIR)) {
  console.error(`build-manifest: project-spec/ not found at ${SPEC_DIR}`);
  process.exit(1);
}

const stat = fs.statSync(SPEC_DIR);
if (!stat.isDirectory()) {
  console.error(`build-manifest: ${SPEC_DIR} is not a directory`);
  process.exit(1);
}

// ---------- scan ----------

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
  console.error("build-manifest: no YYYY-MM-DD.md files found in project-spec/");
  console.error(`Scanned ${allEntries.length} entries; ${skipped.length} skipped.`);
  for (const s of skipped) console.error(`  - ${s.entry}: ${s.reason}`);
  process.exit(1);
}

matched.sort((a, b) => b.date.localeCompare(a.date));

// ---------- write ----------

fs.mkdirSync(path.dirname(MANIFEST_PATH), { recursive: true });
fs.writeFileSync(MANIFEST_PATH, JSON.stringify(matched, null, 2) + "\n", "utf-8");

// ---------- report ----------

console.log(`build-manifest: scanned ${allEntries.length} entries`);
console.log(`build-manifest: matched  ${matched.length} dated files`);
console.log(`build-manifest: skipped  ${skipped.length} non-matching entries`);
console.log(`build-manifest: newest   ${matched[0].date}`);
console.log(`build-manifest: wrote    ${path.relative(REPO_ROOT, MANIFEST_PATH)}`);

if (skipped.length > 0) {
  console.log("");
  console.log("Skipped entries (non-fatal):");
  for (const s of skipped) console.log(`  - ${s.entry}: ${s.reason}`);
}

console.log("");
console.log("Next steps:");
console.log("  1) Vite (npm run dev) will import this manifest from app/src/manifest.json.");
console.log("  2) Add a new project-spec/YYYY-MM-DD.md and re-run npm run dev to refresh.");
