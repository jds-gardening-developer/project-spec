/**
 * build-search-index.test.mjs — node:test cases for the pure helpers in
 * build-search-index.mjs. Run from the repo root with:
 *
 *   node --test scripts/build-search-index.test.mjs
 *
 * Note (per Plan 03-04): the default `npm test` glob covers
 * app/src/components/*.test.js only — these helper tests live under scripts/
 * and are run via the explicit `node --test` invocation above (and the verify
 * block in 03-04-search-index-PLAN.md). A future plan may unify the globs.
 */

import { test } from "node:test";
import assert from "node:assert/strict";
import GithubSlugger from "github-slugger";

import {
  stripMarkdownInline,
  slugify,
  extractHeadingsAndBodies,
  normalizeRecord,
} from "./build-search-index.mjs";

// ---------- stripMarkdownInline ----------

test("stripMarkdownInline: removes bold wrappers", () => {
  assert.equal(stripMarkdownInline("**PRD-1: Foo**"), "PRD-1: Foo");
});

test("stripMarkdownInline: no-op when no markers", () => {
  assert.equal(stripMarkdownInline("PRD-1: Foo"), "PRD-1: Foo");
});

test("stripMarkdownInline: strips backticks (inline code)", () => {
  assert.equal(stripMarkdownInline("`code`"), "code");
});

test("stripMarkdownInline: strips underscore italics", () => {
  assert.equal(stripMarkdownInline("_italic_"), "italic");
});

test("stripMarkdownInline: unescapes spec underscore convention", () => {
  // The spec writes `created\_by` to keep markdown from italicizing the field.
  // The visual user-facing text is `created_by`; the slugger should see that.
  assert.equal(stripMarkdownInline("foo \\_escaped\\_ bar"), "foo _escaped_ bar");
});

// ---------- slugify ----------

test("slugify: matches github-slugger directly for a PRD heading", () => {
  const expected = new GithubSlugger().slug("PRD-1: Plant Database & Inventory");
  assert.equal(slugify("PRD-1: Plant Database & Inventory"), expected);
});

test("slugify: collision suffixing is honored on a single slugger instance", () => {
  const slugger = new GithubSlugger();
  assert.equal(slugify("Data Model", slugger), "data-model");
  assert.equal(slugify("Data Model", slugger), "data-model-1");
});

test("slugify: fresh slugger each call → no suffix", () => {
  assert.equal(slugify("Data Model", new GithubSlugger()), "data-model");
  assert.equal(slugify("Data Model", new GithubSlugger()), "data-model");
});

test("slugify: empty string returns empty string", () => {
  assert.equal(slugify(""), "");
});

// ---------- extractHeadingsAndBodies ----------

test("extractHeadingsAndBodies: empty input → []", () => {
  assert.deepEqual(extractHeadingsAndBodies(""), []);
});

test("extractHeadingsAndBodies: single H1 with body", () => {
  const md = "# Title\n\nBody.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 1);
  assert.equal(out[0].level, 1);
  assert.equal(out[0].title, "Title");
  assert.equal(out[0].body, "Body.");
});

test("extractHeadingsAndBodies: H1 + H2 + paragraph → H1 has empty body, H2 has the paragraph", () => {
  const md = "# H1\n\n## H2\n\nBody under H2.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 2);
  assert.equal(out[0].level, 1);
  assert.equal(out[0].body, "");
  assert.equal(out[1].level, 2);
  assert.equal(out[1].body, "Body under H2.");
});

test("extractHeadingsAndBodies: H2 body does NOT include child H3 section", () => {
  const md = "## H2\n\nH2 body.\n\n### H3\n\nH3 body.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 2);
  assert.equal(out[0].level, 2);
  assert.equal(out[0].body, "H2 body.");
  assert.equal(out[1].level, 3);
  assert.equal(out[1].body, "H3 body.");
});

test("extractHeadingsAndBodies: H2 + H3 + H2 — second H2 starts fresh", () => {
  const md = "## A\n\nA body.\n\n### A.1\n\nA.1 body.\n\n## B\n\nB body.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 3);
  assert.equal(out[0].title, "A");
  assert.equal(out[0].body, "A body.");
  assert.equal(out[1].title, "A.1");
  assert.equal(out[1].body, "A.1 body.");
  assert.equal(out[2].title, "B");
  assert.equal(out[2].body, "B body.");
});

test("extractHeadingsAndBodies: fenced code block containing # is NOT a heading", () => {
  const md = "## Heading\n\n```\n# fake heading\nstill code\n```\n\nReal body.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "Heading");
  // The fenced block + post-fence body are all inside the H2's body.
  assert.match(out[0].body, /# fake heading/);
  assert.match(out[0].body, /Real body\./);
});

test("extractHeadingsAndBodies: bold-wrapped heading title — title stripped, raw_title preserved", () => {
  const md = "## **PRD-1: Foo**\n\nBody.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 1);
  assert.equal(out[0].title, "PRD-1: Foo");
  assert.equal(out[0].raw_title, "**PRD-1: Foo**");
});

test("extractHeadingsAndBodies: H4+ are ignored — appear as body of preceding H3 (or H2)", () => {
  const md = "## H2\n\n### H3\n\nbefore.\n\n#### H4 should be body\n\nafter.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 2);
  assert.equal(out[0].level, 2);
  assert.equal(out[1].level, 3);
  assert.match(out[1].body, /H4 should be body/);
  assert.match(out[1].body, /after\./);
});

test("extractHeadingsAndBodies: indented heading (0–3 leading spaces) is still parsed as a heading", () => {
  // CommonMark behavior — and the 2026-04-26 spec uses "  ## **PRD-1.1:..."
  // in places. rehype-slug parses these as real H2s, so we must too.
  const md = "  ## **PRD-1.1: Plant Variants**\n\nBody.";
  const out = extractHeadingsAndBodies(md);
  assert.equal(out.length, 1);
  assert.equal(out[0].level, 2);
  assert.equal(out[0].title, "PRD-1.1: Plant Variants");
  assert.equal(out[0].body, "Body.");
});

test("extractHeadingsAndBodies: 4-space-indented heading is NOT parsed (CommonMark would treat as code block start, but we only need the negative case)", () => {
  const md = "    ## Not A Heading\n\nbody.";
  const out = extractHeadingsAndBodies(md);
  // No headings → no records.
  assert.equal(out.length, 0);
});

// ---------- normalizeRecord ----------

test("normalizeRecord: H2 PRD-1 → prd_id 'prd-1' and ctx.currentPrd updated", () => {
  const slugger = new GithubSlugger();
  const ctx = { currentPrd: null };
  const out = normalizeRecord(
    { level: 2, title: "PRD-1: Plant Database & Inventory", body: "x" },
    ctx,
    slugger,
  );
  assert.equal(out.title, "PRD-1: Plant Database & Inventory");
  assert.equal(out.level, 2);
  assert.equal(out.prd_id, "prd-1");
  assert.equal(typeof out.id, "string");
  assert.notEqual(out.id, "");
  assert.equal(ctx.currentPrd, "prd-1");
});

test("normalizeRecord: H3 inherits prd_id from ctx.currentPrd set by prior H2", () => {
  const slugger = new GithubSlugger();
  const ctx = { currentPrd: null };
  normalizeRecord(
    { level: 2, title: "PRD-1: Plant Database & Inventory", body: "" },
    ctx,
    slugger,
  );
  const out = normalizeRecord({ level: 3, title: "What Is It", body: "" }, ctx, slugger);
  assert.equal(out.prd_id, "prd-1");
});

test("normalizeRecord: H1 → prd_id null", () => {
  const slugger = new GithubSlugger();
  const ctx = { currentPrd: null };
  const out = normalizeRecord({ level: 1, title: "Spec Title", body: "" }, ctx, slugger);
  assert.equal(out.prd_id, null);
});

test("normalizeRecord: H2 not matching PRD-N → prd_id null AND ctx.currentPrd reset", () => {
  const slugger = new GithubSlugger();
  const ctx = { currentPrd: "prd-1" };
  const out = normalizeRecord(
    { level: 2, title: "Meeting Action Items", body: "" },
    ctx,
    slugger,
  );
  assert.equal(out.prd_id, null);
  assert.equal(ctx.currentPrd, null);
});

test("normalizeRecord: H2 'PRD-1.1: Plant Variants' → prd_id 'prd-1-1' (dots → dashes)", () => {
  const slugger = new GithubSlugger();
  const ctx = { currentPrd: null };
  const out = normalizeRecord(
    { level: 2, title: "PRD-1.1: Plant Variants", body: "" },
    ctx,
    slugger,
  );
  assert.equal(out.prd_id, "prd-1-1");
});

test("normalizeRecord: long body truncated to 800 chars + ellipsis", () => {
  const slugger = new GithubSlugger();
  const ctx = { currentPrd: null };
  const longBody = "a".repeat(900);
  const out = normalizeRecord({ level: 2, title: "PRD-9: Foo", body: longBody }, ctx, slugger);
  assert.ok(out.body.length <= 801, `expected <=801 chars, got ${out.body.length}`);
  assert.ok(out.body.endsWith("…"), "expected trailing ellipsis");
});
