---
phase: 03-navigation-search
plan: 04
type: execute
wave: 2
depends_on: [03-01]
files_modified:
  - scripts/build-search-index.mjs
  - scripts/build-search-index.test.mjs
  - app/src/search-index.json
  - package.json
  - package-lock.json
autonomous: true
requirements: [SEA-02]
tags: [build-script, search-index, minisearch, heading-walker, body-extraction, phase3-search]

must_haves:
  truths:
    - "Running `npm run build-search-index` parses the newest dated spec snapshot and emits app/src/search-index.json with one record per heading"
    - "Each record has: id (rehype-slug-equivalent), title (heading text), prd_id (parent PRD identifier or null), level (1/2/3), body (paragraph text under the heading until the next heading of equal or higher level)"
    - "Underscore-prefixed fixture files are excluded from the index (mirrors build-manifest.mjs convention)"
    - "Only the newest dated snapshot is indexed (per CONTEXT.md scope — multi-version search is v2 deferred)"
    - "The build script runs as part of predev/prebuild (already wired by Plan 03-01) without errors"
  artifacts:
    - path: "scripts/build-search-index.mjs"
      provides: "Real script: walks newest dated snapshot, extracts headings + body text, emits search-index.json with MiniSearch-ready records"
      min_lines: 80
    - path: "scripts/build-search-index.test.mjs"
      provides: "node:test cases for the pure helpers (slugify, extractHeadingsAndBodies, normalizeRecord)"
      min_lines: 30
    - path: "app/src/search-index.json"
      provides: "Real index with N records (one per heading); regenerated on each predev/prebuild"
      min_lines: 1
    - path: "package.json"
      provides: "github-slugger devDependency for build-time slug parity with rehype-slug"
      contains: "github-slugger"
  key_links:
    - from: "package.json#scripts.predev"
      to: "scripts/build-search-index.mjs"
      via: "node scripts/build-search-index.mjs (chained with build-manifest.mjs)"
      pattern: "build-search-index"
    - from: "build-search-index.mjs"
      to: "project-spec/YYYY-MM-DD.md (newest)"
      via: "fs.readFileSync after sorting via the same regex used by build-manifest.mjs"
      pattern: "ISO_DATE_RE"
    - from: "build-search-index.mjs"
      to: "app/src/search-index.json"
      via: "fs.writeFileSync"
      pattern: "writeFileSync"
    - from: "search-index.json record.id"
      to: "rehype-slug heading id in the rendered DOM"
      via: "slugify algorithm equivalent to rehype-slug → github-slugger output"
      pattern: "github-slugger|slugify"
---

<objective>
Replace the Plan 03-01 stub `build-search-index.mjs` with a real script that:
1. Locates the newest `YYYY-MM-DD.md` under `project-spec/` (mirroring build-manifest.mjs).
2. Walks the markdown to extract one record per H1/H2/H3 heading with: id (slug equivalent to rehype-slug), title, prd_id (parent PRD-N if applicable), level, body (paragraph text until the next ≥-level heading).
3. Writes the records as a JSON array to `app/src/search-index.json`.

Closes SEA-02. Produces the data Plan 03-05 hydrates into MiniSearch on first Cmd+K open.

Purpose: Build-time indexing keeps the user's first Cmd+K snappy (no markdown re-parse at runtime) and keeps the runtime bundle minisearch-only (no remark/unified pulled in).
Output: Real script + tests + an actual non-empty search-index.json on disk after run.

**Wave-2 file-overlap note:** This plan adds `github-slugger` to `package.json#devDependencies`. Plan 03-01 (wave 1) is the only OTHER plan that touches package.json — they are sequentially ordered (03-01 first), so this is safe. No conflict with 03-02, 03-03, 03-05 (which are file-disjoint from this plan).
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/phases/03-navigation-search/03-CONTEXT.md
@.planning/phases/03-navigation-search/03-01-foundation-PLAN.md
@scripts/build-manifest.mjs
@scripts/build-search-index.mjs
@project-spec/2026-04-26.md

<interfaces>
<!-- This plan is build-tooling only; no React imports. It mirrors build-manifest.mjs style. -->

build-manifest.mjs (Phase 1 — REUSE its idioms, do NOT modify it):
- Shebang `#!/usr/bin/env node`
- ESM via `node:fs`, `node:path`, `node:url`
- ISO_DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/ — same regex this plan uses
- Sort: matched.sort((a, b) => b.date.localeCompare(a.date)) — newest first
- Console output: "label   : value" lines, "Next steps:" footer
- process.exit(1) on no matches; process.exit(0) on success

The newest spec to index (verified at planning time):
- project-spec/2026-04-26.md (~70 KB, ~14 PRD H2s, dozens of H3s)

rehype-slug uses github-slugger under the hood. To match its output deterministically, this plan adds `github-slugger` as a devDependency. github-slugger is build-time-only; never ships in the runtime bundle. This makes the slug match between build-time index and runtime DOM provably exact.

CONTEXT.md D-07: One record per heading (H1, H2, H3). Each record:
  { id, title, prd_id, body }
This plan adds `level` for clarity (H2 vs H3 results can be presented differently in Plan 03-05) — superset of D-07, not a deviation.

PRD identifier slug behavior:
  ## **PRD-1.1: Plant Variants** — github-slugger output for the stripped title `'PRD-1.1: Plant Variants'` is `'prd-11-plant-variants'` (the dot is dropped because non-alphanumeric chars collapse). BUT the runtime DOM ID via rehype-slug on the same input is whatever github-slugger emits — they must match. Using github-slugger directly here guarantees parity.
  Separately, `prd_id` (the PARENT-PRD bookkeeping field) is normalized to `'prd-1-1'` (dots → dashes, lowercased) so it composes with Phase 2's CrossLinkText cross-link convention. The two values may differ; record both. The runtime hash navigation uses `id` (full slug); `prd_id` is metadata for grouping/breadcrumb display only.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Pure helper TDD — slugify, extractHeadingsAndBodies, normalizeRecord</name>
  <files>scripts/build-search-index.test.mjs, scripts/build-search-index.mjs, package.json, package-lock.json, app/src/search-index.json</files>
  <read_first>
    - scripts/build-manifest.mjs (style guide: shebang, JSDoc header, console.log shape, ISO_DATE_RE)
    - scripts/build-search-index.mjs (current Plan 03-01 stub — replace it)
    - project-spec/2026-04-26.md (sample input — verify behavior against real headings)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-07 record shape, D-06 build-time)
    - package.json (current devDependencies — append github-slugger, do not remove anything)
  </read_first>
  <behavior>
    `slugify(text, slugger?)` produces github-slugger-equivalent output:
    - Test 1: `'PRD-1: Plant Database & Inventory'` → matches `new GithubSlugger().slug('PRD-1: Plant Database & Inventory')` (assert against the live output, not a hardcoded string — keeps the test resilient if github-slugger changes)
    - Test 2: `'Data Model'` called twice on the same slugger instance → first returns `'data-model'`, second returns `'data-model-1'` (collision suffixing is github-slugger's stateful behavior; verify it works)
    - Test 3: `'Data Model'` called twice with FRESH slugger each time → both return `'data-model'` (verifies the slugger param is honored)
    - Test 4: `''` → returns `''` (defensive)

    `stripMarkdownInline(text)` removes inline markdown markers from heading text BEFORE slugifying:
    - Test 1: `'**PRD-1: Foo**'` → `'PRD-1: Foo'`
    - Test 2: `'PRD-1: Foo'` → `'PRD-1: Foo'` (no-op)
    - Test 3: `'\`code\`'` → `'code'` (backticks stripped)
    - Test 4: `'_italic_'` → `'italic'` (underscores stripped)
    - Test 5: `'foo \\_escaped\\_ bar'` (the spec's escaped underscore convention) → `'foo _escaped_ bar'`

    `extractHeadingsAndBodies(markdown)` walks markdown text line-by-line, returning `[{level, raw_title, title, body}]` ordered as they appear. Body is paragraph text under the heading until the next heading of equal or HIGHER level.
    - Test 1: Empty markdown → `[]`
    - Test 2: `'# Title\n\nBody.'` → one record: level 1, title 'Title', body 'Body.'
    - Test 3: H1 + H2 + paragraph → two records: H1 with empty body, H2 with the paragraph
    - Test 4: H2 + p + H3 + p → TWO records: H2's body is the H2-level paragraph (NOT including the H3 section), H3's body is the H3-level paragraph. (Boundary: a child heading does NOT pull its body up. Implementation: each new heading flushes the current accumulator regardless of level.)
    - Test 5: H2 + p + H3 + p + H2 — first H2 closes at first H3; second H2 starts fresh
    - Test 6: Fenced code block containing `# fake heading` — must NOT be parsed as a heading. (Track fence state with `inCodeBlock` boolean toggled by ```.)
    - Test 7: Headings with markdown bold wrappers `## **PRD-1: Foo**` → title is `'PRD-1: Foo'` (markdown stripped); raw_title is `'**PRD-1: Foo**'` (preserved internally)
    - Test 8: H4 (####) and deeper → IGNORED (D-07 specifies H1/H2/H3 only). Lines starting with #### are treated as plain text; they appear in the body of the preceding H3 (or H2 if no H3) — NOT as records.

    `normalizeRecord(rec, ctx, slugger)` produces the final search-index.json record:
    - Test 1: H2 'PRD-1: Plant Database & Inventory' → `{ id: <slug>, title: 'PRD-1: Plant Database & Inventory', prd_id: 'prd-1', level: 2, body: <truncated to 800> }` (and ctx.currentPrd is mutated to `'prd-1'`)
    - Test 2: H3 'What Is It' called AFTER Test 1 (sharing ctx) → prd_id === 'prd-1' (inherited)
    - Test 3: H1 → `{ ..., prd_id: null, ... }` (no parent PRD)
    - Test 4: H2 NOT matching `PRD-N` (e.g., `## Meeting Action Items`) → `{ ..., prd_id: null, ... }` AND ctx.currentPrd reset to null (so subsequent H3s under it don't inherit a stale PRD)
    - Test 5: H2 'PRD-1.1: Plant Variants' → prd_id === 'prd-1-1' (dots → dashes)
    - Test 6: Long body (>800 chars) → truncated to 800 chars + ellipsis '…'

    PRD detection regex: `/^(?:\*\*)?\s*(PRD-\d+(?:\.\d+)?)/i` applied to the stripped title — captures the PRD identifier even when wrapped in `**...**` (defensive; stripMarkdownInline normally handles this).
  </behavior>
  <action>
    1. **Add github-slugger devDep:** Run `npm install --save-dev github-slugger` from the repo root. Verify the resolved version is 2.x (or whatever `^2` resolves to) in package.json#devDependencies and package-lock.json.

    2. **RED commit:** Create `scripts/build-search-index.test.mjs` with all the test cases above. Use `node:test` + `node:assert/strict`. Import `stripMarkdownInline`, `slugify`, `extractHeadingsAndBodies`, `normalizeRecord` as named exports from `./build-search-index.mjs`. Run from the repo root: `node --test scripts/build-search-index.test.mjs`. The tests fail because the stub does not export those functions. Commit: `test(03-04): add failing tests for search-index helpers`.

       Note on `npm test` glob: Phase 2's package.json#scripts.test glob is `app/src/components/*.test.js` and does NOT cover `scripts/*.test.mjs`. Updating the glob would conflict with Plan 03-01's package.json edits. Resolution: this plan's helper tests are run via the explicit `node --test scripts/build-search-index.test.mjs` invocation in the verify block (and in CI later). The default `npm test` continues to cover the React-component side. Document this in the SUMMARY so a future plan can unify globs. (This is the same compromise Phase 2's IN-06 info finding anticipated.)

    3. **GREEN commit:** Replace `scripts/build-search-index.mjs` (the Plan 03-01 stub) with the real script:

       ```js
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
        * Usage:
        *   node scripts/build-search-index.mjs
        */

       import fs from 'node:fs';
       import path from 'node:path';
       import { fileURLToPath } from 'node:url';
       import GithubSlugger from 'github-slugger';

       // ---------- paths + constants ----------

       const __dirname = path.dirname(fileURLToPath(import.meta.url));
       const REPO_ROOT = path.resolve(__dirname, '..');
       const SPEC_DIR  = path.resolve(REPO_ROOT, 'project-spec');
       const OUT_PATH  = path.resolve(REPO_ROOT, 'app/src/search-index.json');
       const ISO_DATE_RE = /^(\d{4}-\d{2}-\d{2})\.md$/;
       const PRD_ID_RE = /^\s*(PRD-\d+(?:\.\d+)?)/i;
       const BODY_MAX_CHARS = 800;

       // ---------- pure helpers (exported for tests) ----------

       export function stripMarkdownInline(text) {
         if (typeof text !== 'string') return '';
         return text
           .replace(/\*\*(.+?)\*\*/g, '$1')   // bold
           .replace(/\*(.+?)\*/g, '$1')       // italic
           .replace(/`([^`]+?)`/g, '$1')      // inline code
           .replace(/_(.+?)_/g, '$1')          // underscore italic
           .replace(/\\([_*`])/g, '$1')        // escaped markers
           .trim();
       }

       export function slugify(text, slugger) {
         const s = slugger || new GithubSlugger();
         return s.slug(text);
       }

       export function extractHeadingsAndBodies(markdown) {
         if (typeof markdown !== 'string') return [];
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
             body: current.lines.join('\n').trim(),
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
           const m = line.match(/^(#{1,3})(?!#)\s+(.+?)\s*$/);
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

       export function normalizeRecord(rec, ctx, slugger) {
         const id = slugify(rec.title, slugger);
         let body = rec.body || '';
         if (body.length > BODY_MAX_CHARS) {
           body = body.slice(0, BODY_MAX_CHARS).trimEnd() + '…';
         }
         let prd_id = null;
         if (rec.level === 2) {
           const m = rec.title.match(PRD_ID_RE);
           if (m) {
             prd_id = m[1].toLowerCase().replace(/\./g, '-');
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

         const matched = fs.readdirSync(SPEC_DIR)
           .filter((entry) => path.basename(entry) === entry)
           .map((entry) => ({ entry, m: entry.match(ISO_DATE_RE) }))
           .filter(({ m }) => m)
           .map(({ entry, m }) => ({ date: m[1], filename: entry }));

         if (matched.length === 0) {
           console.error('build-search-index: no YYYY-MM-DD.md files found in project-spec/');
           process.exit(1);
         }

         matched.sort((a, b) => b.date.localeCompare(a.date));
         const newest = matched[0];
         const sourcePath = path.resolve(SPEC_DIR, newest.filename);
         const markdown = fs.readFileSync(sourcePath, 'utf-8');

         const slugger = new GithubSlugger();
         const ctx = { currentPrd: null };

         const headings = extractHeadingsAndBodies(markdown);
         const records = headings.map((h) => normalizeRecord(h, ctx, slugger));

         fs.mkdirSync(path.dirname(OUT_PATH), { recursive: true });
         fs.writeFileSync(OUT_PATH, JSON.stringify(records, null, 2) + '\n', 'utf-8');

         console.log(`build-search-index: source   ${path.relative(REPO_ROOT, sourcePath)}`);
         console.log(`build-search-index: headings ${headings.length}`);
         console.log(`build-search-index: records  ${records.length}`);
         console.log(`build-search-index: wrote    ${path.relative(REPO_ROOT, OUT_PATH)}`);
         console.log('');
         console.log('Next steps:');
         console.log('  1) Plan 03-05 (Phase 3) hydrates this file into MiniSearch on first Cmd+K.');
       }
       ```

    4. Run `node --test scripts/build-search-index.test.mjs` → all helper tests pass.

    5. Run `npm run build-search-index` → produces a non-empty `app/src/search-index.json` with N records (where N is the heading count of the dated spec).

    6. Run `npm run build` → predev/prebuild chain runs cleanly; index regenerated as part of prebuild.

    Commit: `feat(03-04): implement build-search-index script with three pure helpers`.
  </action>
  <verify>
    <automated>
      grep -q "github-slugger" package.json &&
      grep -q "export function stripMarkdownInline" scripts/build-search-index.mjs &&
      grep -q "export function slugify" scripts/build-search-index.mjs &&
      grep -q "export function extractHeadingsAndBodies" scripts/build-search-index.mjs &&
      grep -q "export function normalizeRecord" scripts/build-search-index.mjs &&
      grep -q "GithubSlugger" scripts/build-search-index.mjs &&
      ! grep -q "STUB" scripts/build-search-index.mjs &&
      node --test scripts/build-search-index.test.mjs 2>&1 | tail -10 &&
      npm run build-search-index 2>&1 | tail -5 &&
      node -e "const r=require('./app/src/search-index.json'); if(!Array.isArray(r)||r.length===0)process.exit(1); const first=r[0]; if(!first.id||typeof first.title!=='string'||typeof first.level!=='number')process.exit(2); const hasPrd1=r.some(x=>x.prd_id==='prd-1'); if(!hasPrd1)process.exit(3); console.log('records:',r.length);"
    </automated>
  </verify>
  <acceptance_criteria>
    - `package.json#devDependencies.github-slugger` present (any 2.x version).
    - `package-lock.json` updated to include github-slugger.
    - `scripts/build-search-index.mjs` exports the four named helpers (`stripMarkdownInline`, `slugify`, `extractHeadingsAndBodies`, `normalizeRecord`).
    - `scripts/build-search-index.mjs` no longer contains the literal `STUB`.
    - `scripts/build-search-index.mjs` references `GithubSlugger` (imported from github-slugger).
    - `node --test scripts/build-search-index.test.mjs` exits 0 with all tests passing.
    - `npm run build-search-index` exits 0; output reports `records  N` where N > 10.
    - `app/src/search-index.json` is valid JSON, parses to a non-empty array.
    - Each record has the keys `id` (string), `title` (string), `prd_id` (string|null), `level` (number 1/2/3), `body` (string).
    - At least one record has `prd_id === 'prd-1'` (verifies PRD detection on PRD-1 H2).
    - At least one record exists where `prd_id` is `null` (verifies non-PRD H2 / H1 handling).
    - Body lengths are bounded ≤ 801 chars (800 + ellipsis character).
    - Underscore-prefixed fixture files (e.g. `_phase2-cross-link-fixture.md`) are NOT indexed (the script only reads the newest dated YYYY-MM-DD.md).
    - `npm run build` exits 0 (predev/prebuild chain works end-to-end after this plan).
  </acceptance_criteria>
  <done>build-search-index.mjs is real: walks the newest dated spec, emits one record per H1/H2/H3 with id/title/prd_id/level/body, writes JSON. github-slugger pinned for build-time slug parity with rehype-slug. SEA-02 fully wired. Plan 03-05 has real index data to hydrate.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| project-spec/*.md → script reader | Trusted (committed in repo); script does not eval, only parses |
| extracted body text → search-index.json | Body text is plain UTF-8; serialized via JSON.stringify (auto-escapes) — safe to embed in import |
| search-index.json → runtime bundle | Imported via Vite static JSON import; no eval; consumed by MiniSearch + React in Plan 03-05 |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-04-01 | Tampering | extractHeadingsAndBodies (line-walker) | accept | Pure markdown parse; if input is truncated mid-fence, fence state is correctly tracked (toggle on each ```). Worst case: wrong body boundaries — does not affect security, only relevance ranking. |
| T-03-04-02 | Information Disclosure | search-index.json contents | accept | All indexed text is already public (the spec is published verbatim on Netlify). No PII, no secrets. |
| T-03-04-03 | Spoofing | record.id (slug) | accept | Slug derived from heading text via github-slugger; deterministic; cannot be attacker-controlled at build time (only authors edit project-spec/). |
| T-03-04-04 | Denial of Service | extractHeadingsAndBodies on a 10MB spec | accept | Linear scan O(n); the spec is 70 KB; no growth concern. BODY_MAX_CHARS caps each record body. |
| T-03-04-05 | Elevation of Privilege | github-slugger devDep | accept | Build-time only; not in runtime bundle. Verified by grep'ing dist/ for `github-slugger` after build (no matches expected). |
</threat_model>

<verification>
- `node --test scripts/build-search-index.test.mjs` exits 0.
- `npm run build-search-index` exits 0; produces `app/src/search-index.json` with > 10 records.
- `npm run build` exits 0 (full chain: build-manifest + build-search-index + Vite build).
- `grep -lE 'github-slugger' app/dist/assets/*.js` returns no matches (devDep stays out of runtime bundle).
- One record per heading; schema verified via the inline `node -e` check in the verify block.
- No regression: Phase 2's existing `npm test` count still green.
</verification>

<success_criteria>
- SEA-02: Build-time index of all H1/H2/H3 headings + body text generated using a small client-side search library (MiniSearch — chosen by D-05; this plan emits the records, Plan 03-05 hydrates them).
- D-06: Index is build-time, not runtime.
- D-07: One record per heading; carries id, title, prd_id, body (level added for plan-time clarity, superset of D-07).
- File-overlap with 03-01: limited to package.json/package-lock.json (sequentially safe — 03-01 is wave 1, 03-04 is wave 2). No conflict with sibling wave-2 plans 03-02, 03-03, 03-05.
</success_criteria>

<output>
After completion, create `.planning/phases/03-navigation-search/03-04-search-index-SUMMARY.md` documenting:
- github-slugger version pinned.
- Total record count from running against the dated 2026-04-26 spec.
- Distribution of records by level (e.g., 1 H1, 14 H2, 80 H3).
- Sample record (one H2 with prd_id, one H3 inheriting it).
- Confirmation that github-slugger does NOT appear in the runtime bundle (`grep` against dist/).
- Confirmation that underscore-prefixed fixtures were NOT indexed.
- Body truncation count (how many records hit BODY_MAX_CHARS).
- Bundle delta if any (the JSON file is imported by Plan 03-05; alone it doesn't affect bundle until import).
</output>
