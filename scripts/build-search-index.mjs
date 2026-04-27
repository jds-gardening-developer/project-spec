#!/usr/bin/env node
/**
 * build-search-index.mjs — Build-time MiniSearch index for the spec viewer.
 *
 * Reads the newest project-spec/YYYY-MM-DD.md, walks H1/H2/H3 headings,
 * extracts paragraph body text under each heading, and writes one record
 * per heading to app/src/search-index.json.
 *
 * Wired into npm predev / prebuild via package.json (Plan 03-01).
 *
 * Output schema (per CONTEXT.md D-07):
 *   [{ id, title, prd_id, level, body }, ...]
 *
 *   - id      string   github-slugger output of the heading title
 *                       (matches rehype-slug at runtime)
 *   - title   string   heading text with inline markdown stripped
 *   - prd_id  string?  parent PRD identifier (e.g. "prd-1", "prd-1-1")
 *                       or null for H1 / non-PRD H2
 *   - level   number   1, 2, or 3
 *   - body    string   paragraph text under the heading until the next
 *                       heading of equal or higher level (≤ 800 chars + …)
 *
 * Usage:
 *   node scripts/build-search-index.mjs
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import GithubSlugger from "github-slugger";

// ---------- paths + constants ----------

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..");
const SPEC_DIR = path.resolve(REPO_ROOT, "project-spec");
const OUT_PATH = path.resolve(REPO_ROOT, "app/src/search-index.json");

const ISO_DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;
const PRD_ID_RE = /^\s*(PRD-\d+(?:\.\d+)?)/i;
const BODY_MAX_CHARS = 800;

// ---------- pure helpers (exported for tests) ----------

export function stripMarkdownInline(text) {
  if (typeof text !== "string") return "";
  // Order matters: strip italic/bold/code BEFORE unescaping. The spec writes
  // `created\_by` to defeat markdown italics; after we strip real italics the
  // remaining `\_` is the user-facing literal underscore — unescape it last.
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")    // bold
    .replace(/\*(.+?)\*/g, "$1")        // italic (asterisk)
    .replace(/`([^`]+?)`/g, "$1")       // inline code
    .replace(/(^|[^\\])_(.+?)_/g, "$1$2")  // italic (underscore) — but not escaped \_
    .replace(/\\([_*`])/g, "$1")        // unescape spec underscore convention LAST
    .trim();
}

export function slugify(text, slugger) {
  const s = slugger || new GithubSlugger();
  return s.slug(text);
}

/**
 * Walks markdown text line-by-line and returns one record per H1/H2/H3 in the
 * order they appear. Each record's body is the paragraph text under the
 * heading until the next heading (any of H1/H2/H3 — child OR sibling).
 *
 * Behavior notes:
 *  - H4+ (####, #####, ######) are ignored as records and remain in body text.
 *  - Fenced code blocks (```) are tracked so a `# foo` line inside code is
 *    not parsed as a heading.
 *  - The body is `.trim()`ed before return (collapses leading/trailing blank
 *    lines).
 */
export function extractHeadingsAndBodies(markdown) {
  if (typeof markdown !== "string") return [];
  const lines = markdown.split(/\r?\n/);
  const records = [];
  let inCodeBlock = false;
  let current = null;

  const flush = () => {
    if (!current) return;
    records.push({
      level: current.level,
      raw_title: current.raw_title,
      title: stripMarkdownInline(current.raw_title),
      body: current.lines.join("\n").trim(),
    });
    current = null;
  };

  for (const line of lines) {
    if (/^```/.test(line)) {
      inCodeBlock = !inCodeBlock;
      if (current) current.lines.push(line);
      continue;
    }
    if (inCodeBlock) {
      if (current) current.lines.push(line);
      continue;
    }
    // CommonMark allows 0–3 spaces of leading indent before an ATX heading.
    // The 2026-04-26 spec uses "  ## **PRD-1.1: ..." in places; rehype-slug
    // parses those as real H2s, so we must too — otherwise the build-time
    // index ids would not match the runtime DOM ids.
    const m = line.match(/^ {0,3}(#{1,3})(?!#)\s+(.+?)\s*$/);
    if (m) {
      flush();
      current = { level: m[1].length, raw_title: m[2], lines: [] };
      continue;
    }
    if (current) current.lines.push(line);
  }
  flush();
  return records;
}

/**
 * Final search-index.json record shape. Mutates `ctx.currentPrd` so subsequent
 * H3s under the same H2 can inherit the PRD id.
 */
export function normalizeRecord(rec, ctx, slugger) {
  const id = slugify(rec.title, slugger);
  let body = rec.body || "";
  if (body.length > BODY_MAX_CHARS) {
    body = body.slice(0, BODY_MAX_CHARS).trimEnd() + "…";
  }
  let prd_id = null;
  if (rec.level === 2) {
    const m = rec.title.match(PRD_ID_RE);
    if (m) {
      prd_id = m[1].toLowerCase().replace(/\./g, "-");
      ctx.currentPrd = prd_id;
    } else {
      ctx.currentPrd = null;
    }
  } else if (rec.level === 3) {
    prd_id = ctx.currentPrd;
  }
  return { id, title: rec.title, prd_id, level: rec.level, body };
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
    console.error(`build-search-index: project-spec/ not found at ${SPEC_DIR}`);
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
    console.error("build-search-index: no YYYY-MM-DD.md files found in project-spec/");
    console.error(`Scanned ${allEntries.length} entries; ${skipped.length} skipped.`);
    process.exit(1);
  }

  matched.sort((a, b) => b.date.localeCompare(a.date));
  const newest = matched[0];
  const sourcePath = path.resolve(SPEC_DIR, newest.filename);
  const markdown = fs.readFileSync(sourcePath, "utf-8");

  const slugger = new GithubSlugger();
  const ctx = { currentPrd: null };

  const headings = extractHeadingsAndBodies(markdown);
  const records = headings.map((h) => normalizeRecord(h, ctx, slugger));

  // Count truncated bodies so the report tells the operator how many records
  // hit the 800-char cap. (Cosmetic — does not affect output.)
  const truncatedCount = records.filter((r) => r.body.endsWith("…")).length;

  fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
  fs.writeFileSync(OUT_PATH, JSON.stringify(records, null, 2) + "\n", "utf-8");

  console.log(`build-search-index: source     ${path.relative(REPO_ROOT, sourcePath)}`);
  console.log(`build-search-index: scanned    ${allEntries.length} entries`);
  console.log(`build-search-index: skipped    ${skipped.length} non-matching entries`);
  console.log(`build-search-index: headings   ${headings.length}`);
  console.log(`build-search-index: records    ${records.length}`);
  console.log(`build-search-index: truncated  ${truncatedCount} bodies hit ${BODY_MAX_CHARS}-char cap`);
  console.log(`build-search-index: wrote      ${path.relative(REPO_ROOT, OUT_PATH)}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1) Plan 03-05 (Phase 3) hydrates this file into MiniSearch on first Cmd+K.");
}
