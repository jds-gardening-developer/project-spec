---
phase: 02-rich-rendering
plan: 01
subsystem: foundation-seam
tags: [vite, react, react-markdown, rehype-slug, mermaid, components-prop, css-custom-properties, parallel-seam]
dependency_graph:
  requires:
    - app/src/SpecViewer.jsx#phase-1-final
    - app/src/styles.css#phase-1-base
    - package.json#phase-1-scripts
  provides:
    - app/src/components/crossLinkPlugin.js#stub
    - app/src/components/CrossLinkText.jsx#stub
    - app/src/components/SchemaTable.jsx#stub
    - app/src/components/SchemaTable.helpers.js#stub
    - app/src/components/Pre.jsx#dispatcher
    - app/src/components/MermaidPre.jsx#stub
    - app/src/SpecViewer.jsx#wired
    - app/src/styles.css#theming-surface
    - package.json#test-script
    - package.json#mermaid-rehype-slug-deps
  affects:
    - package.json
    - package-lock.json
    - app/src/SpecViewer.jsx
    - app/src/styles.css
tech_stack:
  added:
    - mermaid@10.9.5 (D-02 lazy-load via dynamic import in Plan 03)
    - rehype-slug@6.0.0 (D-05 auto-IDs on PRD headings)
  patterns:
    - react-markdown-components-prop
    - remark-plugin-stub
    - rehype-plugin
    - css-custom-properties-theming-surface
    - node-test-with-helpers-extracted
    - jsx-language-class-dispatch
key_files:
  created:
    - app/src/components/crossLinkPlugin.js
    - app/src/components/CrossLinkText.jsx
    - app/src/components/SchemaTable.jsx
    - app/src/components/SchemaTable.helpers.js
    - app/src/components/Pre.jsx
    - app/src/components/MermaidPre.jsx
  modified:
    - app/src/SpecViewer.jsx
    - app/src/styles.css
    - package.json
    - package-lock.json
decisions:
  - "Pinned mermaid@^10 (10.9.5 in lockfile) and rehype-slug@^6 (6.0.0 in lockfile) per CONTEXT.md D-02/D-05/D-18; caret-major lets patch+minor security fixes flow without breaking-major auto-upgrades."
  - "test script targets app/src/components/*.test.js (extension .js, NOT .jsx) so node --test can run pure-JS tests without a JSX parser; Plan 04 extracts helpers into SchemaTable.helpers.js for testability."
  - "Pre.jsx is the only non-stub component file: it dispatches to MermaidBlock for language-mermaid fences and falls through to default <pre> otherwise. Plan 05 wraps the fall-through branch with a copy button (D-13)."
  - "rehype-raw is intentionally absent (T-02-01-02): default react-markdown sanitization is preserved. The string 'rehype-raw' appears once in SpecViewer.jsx but only as a documentary comment naming what is NOT being added."
  - "CSS custom properties grouped by component family (schema-card, cross-link, copy-button, mermaid). Phase 4 overrides --schema-card-accent and --cross-link-color to MacPlants green #2c8d4f without touching Phase 2 component code (D-12, D-19)."
metrics:
  duration: "~3 minutes"
  completed: "2026-04-26"
  tasks_completed: 3
  files_changed: 10
---

# Phase 2 Plan 01: Foundation Seam Summary

**One-liner:** Installed mermaid@10.9.5 and rehype-slug@6.0.0, scaffolded six pass-through stubs under `app/src/components/`, wired SpecViewer's `components`/`remarkPlugins`/`rehypePlugins` props, and declared 14 CSS custom properties so Plans 02–05 each own one disjoint file and run in parallel without touching `package.json` or `SpecViewer.jsx` again.

## What Was Built

### Task 1: Install Phase 2 dependencies + npm test script

**Files modified:** `package.json`, `package-lock.json`

- `npm install --save mermaid@^10 rehype-slug@^6` — resolved to `mermaid@10.9.5` and `rehype-slug@6.0.0` in the lockfile.
- Added one new entry to `package.json` `scripts`: `"test": "node --test app/src/components/*.test.js"`.
- Confirmed `rehype-raw` is NOT in dependencies (T-02-01-02 mitigation).
- `rm -rf app/dist && npm run build` produces a working bundle (301 modules, 311.68 KB / 98.07 KB gzipped, under the 100KB soft budget).
- `npm test` runs cleanly with 0 tests reported, exit 0 — the script is wired and Wave-2 plans can drop in `*.test.js` files without touching `package.json` again.

### Task 2: Six renderer/plugin/helper stubs under `app/src/components/`

**Files created:**
- `app/src/components/crossLinkPlugin.js` — `export default remarkCrossLinks()` returns identity transformer (Plan 02 fills in).
- `app/src/components/CrossLinkText.jsx` — `export CrossLinkAnchor` renders default `<a>` (Plan 02 fills in).
- `app/src/components/SchemaTable.jsx` — `export SchemaOrTable` renders default `<table>` (Plan 04 fills in).
- `app/src/components/SchemaTable.helpers.js` — pure-JS module, `export {}` placeholder. Plan 04 fills in `isSchemaHeader`, `extractHeaderCells`, `extractBodyRows`, `detectFkType` for `node --test` exercising.
- `app/src/components/Pre.jsx` — dispatcher; only non-stub file in this set. Reads `children`'s code className; routes `language-mermaid` to `MermaidBlock`, else default `<pre>` (D-13 enforcement).
- `app/src/components/MermaidPre.jsx` — `export MermaidBlock` renders source as `<pre className="mermaid-source-stub">` (Plan 03 fills in dynamic-import mermaid render).

Each file's JSDoc names the downstream plan that owns its real implementation.

### Task 3: SpecViewer wiring + CSS theming surface

**Files modified:** `app/src/SpecViewer.jsx`, `app/src/styles.css`

`SpecViewer.jsx` now imports:
- `rehypeSlug` from `rehype-slug` (D-05)
- `remarkCrossLinks` from `./components/crossLinkPlugin.js`
- `CrossLinkAnchor`, `SchemaOrTable`, `Pre` from `./components/...`

…and passes three props to `<ReactMarkdown>`:
- `remarkPlugins={[remarkGfm, remarkCrossLinks]}`
- `rehypePlugins={[rehypeSlug]}`
- `components={{ a: CrossLinkAnchor, table: SchemaOrTable, pre: Pre }}`

`styles.css` appends a second `:root` block declaring 14 CSS custom properties grouped under four sections: schema-card (8), cross-link (2), copy-button (3), mermaid (2). Phase 4's brand pass overrides these without touching Phase 2 component code.

## Verification Results

| Check | Expected | Actual |
|-------|----------|--------|
| `package.json#dependencies.mermaid` | matches `^10` | `^10.9.5` |
| `package.json#dependencies.rehype-slug` | matches `^6` | `^6.0.0` |
| `package.json#dependencies.rehype-raw` | absent | absent |
| `package.json#scripts.test` | `node --test app/src/components/*.test.js` | matches |
| Six stub files exist with documented exports | YES | YES |
| `SpecViewer.jsx` imports + components object + plugin arrays | YES | YES |
| `styles.css` contains all 14 documented CSS custom properties | YES | 15 properties (one extra: `--schema-card-type-color`, additive — does not violate criterion) |
| `rm -rf app/dist && npm run build` exits 0 | YES | YES (built in 682ms, 301 modules transformed) |
| `app/dist/assets/` contains NO `mermaid-*.js` chunk | YES | confirmed (only `index-*.js`, `2026-04-26-*.js`, `index-*.css`) |
| `npm test` exits 0 with 0 tests | YES | YES (`tests 0`, `pass 0`, `fail 0`) |

## Bundle Size at Plan 01 Completion

```
dist/index.html                       0.42 kB │ gzip:  0.30 kB
dist/assets/index-BvAgDrrp.css        0.70 kB │ gzip:  0.35 kB
dist/assets/2026-04-26-DSQwaBHq.js   70.07 kB │ gzip: 24.13 kB
dist/assets/index-Cc7HcDzV.js       311.68 kB │ gzip: 98.07 kB
```

Main JS bundle is **98.07 KB gzipped**, just under the 100 KB soft budget. Plans 03 introduces mermaid as a dynamic-import chunk, which keeps the main bundle from absorbing it.

## Wave-2 Parallelization Confirmation

Plans 02, 03, 04, and 05 each own exactly ONE implementation file under `app/src/components/`:

| Plan | File | Stub Status |
|------|------|-------------|
| 02 (REND-02 cross-link) | `crossLinkPlugin.js` + `CrossLinkText.jsx` | identity / pass-through |
| 03 (REND-04 mermaid) | `MermaidPre.jsx` | renders source as `<pre>` |
| 04 (REND-03 schema-card) | `SchemaTable.jsx` + `SchemaTable.helpers.js` | pass-through `<table>` / empty exports |
| 05 (REND-05 copy-button) | `Pre.jsx` (fall-through branch) | `<pre>` default |

None of those plans needs to touch `package.json`, `SpecViewer.jsx`, or `styles.css` (the structural CSS will be component-scoped or use the custom properties already declared). The seam is the components prop; collisions cannot occur in Wave 2.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Intentional Adaptations Preserved from Phase 1

**1. [Plan 01 of Phase 1 — Documentation Pattern Preserved] `rehype-raw` mentioned in JSDoc**

- **Found during:** Task 3 verification grep
- **Issue:** `grep -q "rehype-raw" app/src/SpecViewer.jsx` matches because line 22 of the rewritten `SpecViewer.jsx` contains the JSDoc string `* Default react-markdown sanitization is preserved — NO rehype-raw, NO HTML passthrough.`
- **Resolution:** This is the same intentional safety-comment pattern documented in Phase 1 Plan 02 SUMMARY (decision #2). The acceptance criterion is "does NOT import `rehype-raw`" — the import line is absent (`grep "from 'rehype-raw'"` returns nothing) and `package.json#dependencies.rehype-raw` is absent. The JSDoc is documentary, naming what is intentionally NOT being added (T-02-01-02 mitigation visibility).
- **No code change needed** — preserving Phase 1's documentation discipline.

### Environmental Setup (Worktree, Not Committed)

- Symlinked `project-spec/` → main repo's `project-spec/` so `build-manifest.mjs` could find dated snapshots at build time. Untracked, not committed.
- Ran `npm install` to materialize `node_modules/` for the build. Untracked, not committed.

## Auth Gates

None encountered.

## Known Stubs

This plan is INTENTIONALLY all stubs. Six files are pass-through scaffolds awaiting downstream plans:

| File | Stub Behavior | Filled In By |
|------|---------------|--------------|
| `crossLinkPlugin.js` | identity transformer (returns tree unmodified) | Plan 02 (REND-02) |
| `CrossLinkText.jsx` | renders default `<a href={href}>` | Plan 02 (REND-02) |
| `SchemaTable.jsx` | renders default `<table>` | Plan 04 (REND-03) |
| `SchemaTable.helpers.js` | empty (`export {}`) | Plan 04 (REND-03) |
| `MermaidPre.jsx` | renders source as `<pre>` | Plan 03 (REND-04) |
| `Pre.jsx` (fall-through branch) | renders default `<pre>` (mermaid branch is real) | Plan 05 (REND-05) |

The viewer at runtime renders the spec **identically to Phase 1** — no visible change yet, by design. Plans 02–05 deliver the visible Phase 2 enhancements.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries beyond what the plan's `<threat_model>` documents (T-02-01-01 through T-02-01-05).

## Downstream Plan Readiness

After this plan, the following statements are true (per `must_haves.truths` in PLAN frontmatter):

- ✓ Viewer renders the spec identically to Phase 1 (no visible behavior change yet).
- ✓ rehype-slug is installed and active so PRD headings receive auto-generated id attributes (verified via build success — `rehypeSlug` import resolves).
- ✓ react-markdown's components prop is wired to four renderer files, each containing a pass-through stub (a, table, pre + the cross-link via remark plugin).
- ✓ The four downstream plans (02, 03, 04, 05) each have a disjoint implementation file to fill in.
- ✓ CSS custom properties for color/accent values are declared so Phase 4 has a known theming surface (15 properties total).
- ✓ An `npm test` script exists in package.json so downstream Wave-2 plans can add `*.test.js` files without touching package.json.

## Self-Check: PASSED

Verified files exist:
- FOUND: package.json (mermaid + rehype-slug deps; test script)
- FOUND: package-lock.json (updated)
- FOUND: app/src/components/crossLinkPlugin.js
- FOUND: app/src/components/CrossLinkText.jsx
- FOUND: app/src/components/SchemaTable.jsx
- FOUND: app/src/components/SchemaTable.helpers.js
- FOUND: app/src/components/Pre.jsx
- FOUND: app/src/components/MermaidPre.jsx
- FOUND: app/src/SpecViewer.jsx (wired)
- FOUND: app/src/styles.css (CSS custom properties appended)

Verified commits exist:
- FOUND: f2088e7 (Task 1: deps + test script)
- FOUND: 3b310f1 (Task 2: six stubs)
- FOUND: 8171257 (Task 3: SpecViewer wiring + CSS surface)
