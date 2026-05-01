#!/usr/bin/env node
/**
 * pull-doc.mjs
 * ------------
 * Fetches the canonical MacPlants spec Google Doc as markdown and writes
 * it to project-spec/<YYYY-MM-DD>.md (today's date by default).
 *
 * The Google Doc must be shared "anyone with the link can view" — the
 * script hits the public /export?format=md endpoint, so no OAuth or API
 * key is needed.
 *
 * Usage:
 *   node scripts/pull-doc.mjs            # writes project-spec/<today>.md
 *   node scripts/pull-doc.mjs --force    # overwrite if file already exists
 *
 * Env overrides (optional):
 *   DOC_ID=<google-doc-id>               # default: hard-coded constant below
 *   OUTPUT_DIR=<path>                    # default: project-spec
 *
 * Example:
 *   npm run pull-doc
 *   npm run pull-doc -- --force
 */

import fs from "node:fs";
import path from "node:path";

// ---------- args ----------
const DEFAULT_DOC_ID = "1AFj8xlFnNWD609hpKOWQ4u3xq63d-dZCAe03770XuzM";
const DEFAULT_OUTPUT_DIR = "project-spec";

const docId = process.env.DOC_ID || DEFAULT_DOC_ID;
const outputDir = path.resolve(process.env.OUTPUT_DIR || DEFAULT_OUTPUT_DIR);
const force = process.argv.includes("--force");

if (!fs.existsSync(outputDir)) {
  console.error(`Output directory not found: ${outputDir} — run this from the repo root.`);
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);
const outputPath = path.join(outputDir, `${today}.md`);

if (fs.existsSync(outputPath) && !force) {
  console.error(`Refusing to overwrite existing file: ${outputPath}`);
  console.error("Pass --force to overwrite.");
  process.exit(1);
}

const exportUrl = `https://docs.google.com/document/d/${docId}/export?format=md`;

// ---------- fetch ----------
console.log(`Doc ID         : ${docId}`);
console.log(`Export URL     : ${exportUrl}`);
console.log(`Output path    : ${outputPath}`);
console.log("Fetching…");

const startedAt = Date.now();

const response = await fetch(exportUrl, { redirect: "follow" });

if (!response.ok) {
  console.error(`Fetch failed: HTTP ${response.status} ${response.statusText}`);
  if (response.status === 401 || response.status === 403 || response.status === 404) {
    console.error("Make sure the Google Doc is shared 'anyone with the link can view'.");
  }
  process.exit(1);
}

const contentType = response.headers.get("content-type") || "";
if (!contentType.includes("markdown") && !contentType.includes("text/plain")) {
  console.error(`Unexpected content-type: ${contentType}`);
  console.error("This usually means the Doc isn't public or the export format is unsupported.");
  process.exit(1);
}

const markdown = await response.text();
const elapsed = ((Date.now() - startedAt) / 1000).toFixed(1);

if (markdown.length < 100) {
  console.error(`Suspiciously small response (${markdown.length} chars). Aborting without writing.`);
  process.exit(1);
}

// ---------- write ----------
fs.writeFileSync(outputPath, markdown);

console.log("");
console.log(`Done in ${elapsed}s.`);
console.log(`Wrote ${markdown.length.toLocaleString()} chars to ${outputPath}`);
console.log("");
console.log("Next steps:");
console.log(`  1. Review the snapshot: open ${outputPath}`);
console.log(`  2. Update viewer entry: edit homepage in index.html (or app config) to point at ${path.basename(outputPath)}`);
console.log("  3. Commit when ready:   git add project-spec/ && git commit");
