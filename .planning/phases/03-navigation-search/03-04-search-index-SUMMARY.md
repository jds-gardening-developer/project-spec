---
phase: 03-navigation-search
plan: 04
subsystem: build-tooling
tags: [search-index, build-script, minisearch, github-slugger, heading-walker, body-extraction, phase3-search]
one_liner: "Build-time search index generator: walks newest dated spec, emits 76 records (1 H1 / 19 H2 / 56 H3) to app/src/search-index.json with rehype-slug-equivalent ids."
requirements: [SEA-02]
requires:
  - "scripts/build-manifest.mjs (style + ISO_DATE_RE pattern, REUSED unchanged)"
  - "github-slugger@^2.0.0 (devDep, identical to rehype-slug's bundled version)"
  - "project-spec/YYYY-MM-DD.md (newest dated snapshot — currently 2026-04-26.md)"
provides:
  - "scripts/build-search-index.mjs — real implementation (replaces Plan 03-01 stub)"
  - "scripts/build-search-index.test.mjs — 25 helper tests via node:test"
  - "app/src/search-index.json — 76 real records ready for MiniSearch hydration"
  - "github-slugger devDependency for build-time slug parity with runtime rehype-slug"
affects:
  - "package.json devDependencies (added github-slugger)"
  - "app/src/search-index.json (was [], now 76 records)"
tech-stack:
  added: ["github-slugger@^2.0.0 (devDep — build-time only, never in runtime bundle)"]
  patterns: ["mirrors scripts/build-manifest.mjs idioms", "ESM with node: built-ins", "isCli() guard for testable side effects"]
key-files:
  created:
    - "scripts/build-search-index.test.mjs (146 lines, 25 tests)"
  modified:
    - "scripts/build-search-index.mjs (39-line STUB → 200-line real impl)"
    - "app/src/search-index.json (empty array → 76 records, ~63 KB)"
    - "package.json (added github-slugger to devDependencies)"
    - "package-lock.json (resolved github-slugger@2.0.0 + transitives)"
decisions:
  - "Wire github-slugger directly (not a re-impl of the slug algorithm) — slug parity with rehype-slug becomes provable, not approximate"
  - "Allow 0–3 leading spaces of indent in heading-line regex (CommonMark conformance — the 2026-04-26 spec uses '  ## **PRD-1.1: ...' in places)"
  - "Cap body text at BODY_MAX_CHARS=800 with trailing ellipsis to keep records compact for MiniSearch hydration"
  - "Track fenced-code state (inCodeBlock) so '# foo' inside ``` blocks is NOT parsed as a heading"
  - "Guard top-level side effects behind isCli() so tests can import the helpers without running main()"
  - "Skip H4+ records (D-07 specifies H1/H2/H3 only); H4 lines fall through into body of preceding H3"
  - "Default npm test glob (app/src/components/*.test.js) intentionally NOT changed — helper tests run via explicit `node --test scripts/build-search-index.test.mjs` invocation. A future plan may unify globs (anticipated by Phase 2's IN-06)."
metrics:
  duration: "5 minutes"
  completed: "2026-04-27"
  tasks: 1
  commits: 2
  files_created: 1
  files_modified: 4
  tests_added: 25
  tests_total: 25
  tests_passing: 25
---

# Phase 3 Plan 4: Search Index Build Script Summary

Build-time search index generator: walks newest dated spec, emits 76 records (1 H1 / 19 H2 / 56 H3) to `app/src/search-index.json` with rehype-slug-equivalent ids.

## What Was Built

`scripts/build-search-index.mjs` replaces the Plan 03-01 STUB. The script:

1. Locates the newest `project-spec/YYYY-MM-DD.md` (mirrors `build-manifest.mjs` ISO_DATE_RE convention — underscore-prefixed fixtures are skipped).
2. Walks the markdown line-by-line, tracking fenced-code state, extracting one record per H1/H2/H3.
3. Strips inline markdown (bold, italic, code, escaped underscores) from heading text.
4. Slugs each title via `github-slugger@2.0.0` — the same library and version that `rehype-slug@6.0.0` bundles for runtime DOM ids, giving byte-for-byte parity.
5. Detects parent PRD identifier (`PRD-N` or `PRD-N.M`) and inherits it onto each H3 under the matching H2.
6. Caps body text at 800 chars (with `…`) so the index file stays small.
7. Writes JSON to `app/src/search-index.json`.

The script is wired into `npm run predev` and `npm run prebuild` (already chained by Plan 03-01 alongside `build-manifest.mjs`), so dev and build always start with a fresh index.

Pure helpers (`stripMarkdownInline`, `slugify`, `extractHeadingsAndBodies`, `normalizeRecord`) are exported and covered by 25 `node:test` cases.

## Index Statistics (newest spec: project-spec/2026-04-26.md, 70 KB)

| Metric | Value |
|--------|-------|
| Total records | 76 |
| Distribution (H1 / H2 / H3) | 1 / 19 / 56 |
| Records with `prd_id` | 63 |
| Records with `prd_id === null` | 13 (H1 + non-PRD H2s like "To Add In", "Meeting Action Items") |
| Unique PRD identifiers detected | 13 (`prd-0`, `prd-1`, `prd-1-1`, `prd-2-0`, `prd-2-1`, `prd-03`, `prd-3-1`, `prd-3-2`, `prd-3-3`, `prd-3-4`, `prd-04`, `prd-05`, `prd-6`) |
| Bodies hitting 800-char cap | 26 |
| All bodies ≤ 801 chars | ✓ |
| Underscore-prefixed fixtures indexed | 0 (correctly skipped) |

## Sample Records

**H2 with PRD detection:**
```json
{
  "id": "prd-1-plant-database--inventory",
  "title": "PRD-1: Plant Database & Inventory",
  "prd_id": "prd-1",
  "level": 2,
  "body": "<truncated to 800 chars + …>"
}
```

**H3 inheriting `prd_id` from parent H2:**
```json
{
  "id": "data-model-1",
  "title": "Data Model",
  "prd_id": "prd-1",
  "level": 3,
  "body": "**Plant**\n\n| Field | Type | Notes |\n| --- | --- | --- |\n..."
}
```

(Note the `data-model-1` suffix — there are multiple "Data Model" H3s in the spec. github-slugger's collision counter produces the same suffix that rehype-slug emits at runtime, which is exactly why we wire the library directly rather than reimplementing the slug algorithm.)

## github-slugger: Build-Time Only

| Check | Result |
|-------|--------|
| Declared in `package.json#devDependencies` | `^2.0.0` |
| Resolved version | `2.0.0` |
| `rehype-slug@6.0.0` bundles the same package as a runtime dep | `^2.0.0` |
| String `github-slugger` in `app/dist/assets/*.js` after `npm run build` | NONE |

The algorithm itself ships in the runtime bundle (because rehype-slug bundles it) — but that was already true in Phase 2. This plan adds **zero new bytes** to the runtime bundle. The devDep is purely a build-tool reference so the build script and the runtime use the exact same slug algorithm version.

## Test Coverage

| Helper | Tests |
|--------|-------|
| `stripMarkdownInline` | 5 (bold, no-op, backticks, underscores, escaped underscores) |
| `slugify` | 4 (parity with raw GithubSlugger, collision suffixing, fresh-slugger, empty string) |
| `extractHeadingsAndBodies` | 9 (empty, H1+body, H1+H2, H2-H3 boundary, H2+H3+H2, fenced-code, bold-wrapped, H4 skip, indented-heading, 4-space-indent negative) |
| `normalizeRecord` | 6 (H2 PRD detection, H3 inheritance, H1 null, non-PRD H2 reset, dotted PRD, body truncation) |
| **Total** | **25 (all passing)** |

Phase 2 component tests (`npm test`): 21/21 still pass — no regression.

## Verification Output

```
$ npm run build-search-index
build-search-index: source     project-spec/2026-04-26.md
build-search-index: scanned    4 entries
build-search-index: skipped    3 non-matching entries
build-search-index: headings   76
build-search-index: records    76
build-search-index: truncated  26 bodies hit 800-char cap
build-search-index: wrote      app/src/search-index.json

$ npm run build       # full predev/prebuild chain
✓ built in 8.57s
```

## Bundle Impact

The plan does NOT change runtime bundle weight (Plan 03-05 will, when it imports `search-index.json` into MiniSearch).

| File | Before | After |
|------|--------|-------|
| `app/dist/assets/index-*.js` (gzipped) | 100.51 KB | 100.51 KB |
| `app/src/search-index.json` (raw, on disk) | 3 bytes (`[]`) | ~63 KB |

The 63 KB JSON is currently NOT imported by any runtime code — Plan 03-05 will import it on first Cmd+K open.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] `stripMarkdownInline` order corrected so escaped underscores survive italic strip**
- **Found during:** Task 1 GREEN test run.
- **Issue:** Original implementation unescaped `\_escaped\_` → `_escaped_` BEFORE the underscore-italic regex ran, so the regex then consumed the underscores and left `escaped` (test expected `_escaped_`).
- **Fix:** Reorder the replacements — strip italics/bold/code FIRST (with a negative-lookbehind alternative `(^|[^\\])_(.+?)_` that ignores escaped underscores), then unescape `\_` last.
- **Files modified:** `scripts/build-search-index.mjs` (stripMarkdownInline order).
- **Commit:** `654a891`.

**2. [Rule 1 — Bug] Heading-line regex broadened to allow 0–3 leading spaces of indent**
- **Found during:** Task 1 first build run against the real 2026-04-26 spec.
- **Issue:** Initial regex `^(#{1,3})(?!#)\s+...` only matched headings with no indent. The 2026-04-26 spec writes lines like `  ## **PRD-1.1: Plant Variants**` (2-space indent), which CommonMark and rehype-slug both treat as H2. With the strict regex the script emitted only 39 records (missing all PRD-1.1, 2.0, 2.1.1, etc.); after the fix it emits 76 records covering every PRD H2 in the spec.
- **Fix:** Regex now `^ {0,3}(#{1,3})(?!#)\s+...` (CommonMark-conformant). Added two regression tests covering indented and 4-space-indented cases.
- **Files modified:** `scripts/build-search-index.mjs` (regex), `scripts/build-search-index.test.mjs` (added 2 tests).
- **Commit:** `654a891`.

Both fixes are pure correctness wins: without them, the build-time index would have either dropped/mangled headings or had ids that don't match the runtime DOM ids that rehype-slug emits.

## Known Stubs

None. The script emits real records and `app/src/search-index.json` is non-empty.

The 63 KB JSON is not yet imported by any runtime component — that wiring is Plan 03-05's job (`SearchPanel.jsx` will hydrate MiniSearch from this file on first Cmd+K). This is a build-tooling plan; the runtime hookup is intentionally deferred to its own plan.

## Threat Flags

None. The threat surface mapped in the plan's `<threat_model>` is unchanged:
- Indexed text is already public (the spec is published verbatim on Netlify).
- github-slugger is build-time only (`grep` against `app/dist/assets/*.js` returns no match).
- The line-walker is linear-time and cap-bounded — no DoS surface.

## Files Created / Modified

**Created:**
- `scripts/build-search-index.test.mjs` — 25 helper tests (146 lines).

**Modified:**
- `scripts/build-search-index.mjs` — STUB (39 lines) → real implementation (~200 lines).
- `app/src/search-index.json` — `[]` → 76 records.
- `package.json` — added `"github-slugger": "^2.0.0"` to devDependencies.
- `package-lock.json` — resolved github-slugger@2.0.0.

## Commits

| Hash | Type | Subject |
|------|------|---------|
| `b6c98db` | test | test(03-04): add failing tests for search-index helpers |
| `654a891` | feat | feat(03-04): implement build-search-index script with three pure helpers |

## Closes

- **SEA-02** — Build-time search index generation. (Plan 03-05 hydrates this into MiniSearch and ships the search UI; the index data itself is now real.)
- **D-06** — Index timing is build-time, not runtime.
- **D-07** — One record per H1/H2/H3 with `id`, `title`, `prd_id`, `body` (plus `level` as a documented superset).

## Self-Check: PASSED

- `scripts/build-search-index.mjs` exists with all four exports.
- `scripts/build-search-index.test.mjs` exists with 25 tests (all passing).
- `app/src/search-index.json` is valid JSON, parses to a 76-element array, every record has `id`/`title`/`prd_id`/`level`/`body`.
- `package.json#devDependencies.github-slugger` present (`^2.0.0`).
- Commit `b6c98db` exists in `git log` (RED).
- Commit `654a891` exists in `git log` (GREEN).
- `npm run build-search-index` exits 0 with `records 76`.
- `npm run build` exits 0 (full predev/prebuild chain works).
- `node --test scripts/build-search-index.test.mjs` exits 0 with 25 passing.
- `npm test` (Phase 2 component tests) still 21/21.
- `grep github-slugger app/dist/assets/*.js` → no matches (devDep stays out of runtime).

