---
phase: 01-foundation
plan: 02
subsystem: manifest-viewer
tags: [vite, react, react-markdown, remark-gfm, manifest, build-time, spec-viewer]
dependency_graph:
  requires: [app/index.html, app/vite.config.js, app/src/main.jsx, app/src/styles.css, package.json#vite-scripts]
  provides: [scripts/build-manifest.mjs, app/src/manifest.json, app/src/SpecViewer.jsx, app/src/App.jsx#manifest-wired, package.json#predev-prebuild]
  affects: [package.json, app/src/App.jsx]
tech_stack:
  added: []
  patterns: [vite-json-import, import-meta-glob-raw, npm-pre-hooks, react-markdown-gfm, async-effect-cancellation]
key_files:
  created:
    - scripts/build-manifest.mjs
    - app/src/SpecViewer.jsx
  modified:
    - app/src/App.jsx
    - package.json
decisions:
  - "Preserved --config app/vite.config.js flags in dev/build/preview scripts (Plan 01 deviation) — predev/prebuild hooks only run node, not vite, so they are unaffected"
  - "SpecViewer comment mentions rehype-raw only in a negative/safety context (no rehype-raw) — this is intentional documentation, not a functional reference"
  - "Symlink project-spec/ into worktree for smoke test — not committed; the real project-spec/ is in the main repo working tree and will be there at npm run dev time"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-26"
  tasks_completed: 5
  files_changed: 4
---

# Phase 1 Plan 02: Manifest + Viewer Summary

**One-liner:** Build-time manifest script wired into predev/prebuild, SpecViewer with react-markdown + remark-gfm, and App.jsx lazy-loading the newest dated spec — `npm run dev` now renders the full 70KB spec at http://localhost:5173.

## What Was Built

### Task 1: scripts/build-manifest.mjs

A Node ESM build-time script that:
- Scans `project-spec/` for `YYYY-MM-DD.md` filenames using regex `/^(\d{4}-\d{2}-\d{2})\.md$/`
- Validates each entry with `path.basename(entry) === entry` (path-traversal hardening, T-02-01)
- Sorts matched entries descending by ISO date string (`b.date.localeCompare(a.date)`)
- Writes `app/src/manifest.json` as pretty-printed JSON with trailing newline
- Logs progress in `Label   : value` shape; ends with a numbered "Next steps" block
- Mirrors `scripts/update-spec.mjs` conventions: `node:` prefix, double quotes, shebang, JSDoc header

### Task 2: package.json npm hooks

Added `predev`, `prebuild`, and `build-manifest` scripts to `package.json`. The `predev` and `prebuild` npm lifecycle hooks automatically run `build-manifest.mjs` before Vite starts, ensuring `manifest.json` is always fresh.

### Task 3: app/src/SpecViewer.jsx

A React component that renders a markdown string with:
- `react-markdown` 9.x API (children prop receives the markdown string)
- `remark-gfm` plugin for GFM tables, fenced code, and strikethrough
- Default react-markdown sanitization (no `rehype-raw`, no HTML passthrough) — satisfies T-02-02
- Async load guards: returns `<p>Loading…</p>` for non-string prop, `<p>(spec file is empty)</p>` for empty string
- `className="spec-viewer"` hook for Phase 4 theming

### Task 4: app/src/App.jsx (replaced)

Replaced the Plan 01 placeholder with the full manifest+viewer wiring:
- `import manifest from './manifest.json'` — Vite JSON import, bundled at build time
- `import.meta.glob('../../project-spec/*.md', { query: '?raw', import: 'default' })` — Vite glob, resolved at build time; lazy (not eager), so only the requested file is fetched at runtime
- Picks `manifest[0]` (newest-first from build-manifest.mjs) as `newest`
- `useEffect` loads the spec content asynchronously with a `cancelled` flag for React-correct cleanup
- Error states for: empty manifest, missing glob key, failed load
- `<header>` showing `Viewing: project-spec/{filename}` for Phase 1 verification

### Task 5: Smoke Test (verification only)

End-to-end smoke test results:

| Check | Result |
|-------|--------|
| `rm -f app/src/manifest.json && npm run dev` regenerates manifest via predev hook | PASS |
| `app/src/manifest.json[0].date === '2026-04-26'` | PASS |
| `curl http://localhost:5175/` returns HTML with `<div id="root">` | PASS |
| `curl http://localhost:5175/src/manifest.json` returns JSON with `2026-04-26` | PASS |
| `curl @fs .../project-spec/2026-04-26.md?raw` returns 70317 bytes (>50KB) | PASS |
| No `error`, `failed`, or `cannot find module` in Vite dev log | PASS |
| Root `index.html` (Docsify) unchanged (`git diff index.html` = empty) | PASS |

Note: Vite used port 5175 (5173 and 5174 were in use from other processes). The `@fs` curl test confirmed `server.fs.allow` is correctly configured to permit reading from `project-spec/`.

## Manifest Contents at Completion

```json
[
  {
    "date": "2026-04-26",
    "filename": "2026-04-26.md"
  }
]
```

## Confirmation: npm run dev Boots with predev Hook

```
> macplants-erp-spec@1.0.0 predev
> node scripts/build-manifest.mjs

build-manifest: scanned 1 entries
build-manifest: matched  1 dated files
build-manifest: skipped  0 non-matching entries
build-manifest: newest   2026-04-26
build-manifest: wrote    app/src/manifest.json

> macplants-erp-spec@1.0.0 dev
> vite --config app/vite.config.js

  VITE v5.4.21  ready in 479 ms

  ➜  Local:   http://localhost:5175/
```

## Confirmation: Manifest JSON Served

`curl http://localhost:5175/src/manifest.json` returned:
```json
[{"date":"2026-04-26","filename":"2026-04-26.md"}]
```

## Manual Verification Note

**Open http://localhost:5173 in a browser after `npm run dev`.** You should see:
- A `<small>` header: `Viewing: project-spec/2026-04-26.md`
- The full spec rendered with PRD section headings (h2 bold), sub-headings (h3/h4), Data Model tables (3-column GFM tables), and fenced code blocks.

This visual check is what proves `import.meta.glob` resolved correctly at runtime. The curl smoke test only proved Vite's `server.fs.allow` was configured. If anything looks broken, file a gap for Phase 1 closure before moving to Phase 2.

## New-Dated-File Flow Verification

To verify success criterion 5 (newest file auto-switch):
1. `cp project-spec/2026-04-26.md project-spec/2026-05-10.md`
2. Restart `npm run dev`
3. Refresh the browser — the header should show `Viewing: project-spec/2026-05-10.md`
4. `rm project-spec/2026-05-10.md` when done

This works because `predev` re-runs `build-manifest.mjs` which rescans `project-spec/`, picks the newer ISO date, and rewrites `manifest.json` before Vite starts.

## Deviations from Plan

### Auto-fixed Issues

None — plan executed as written, with one intentional adaptation:

**1. [Plan 01 Deviation Preserved] --config app/vite.config.js flags retained in dev/build/preview**

- **Found during:** Task 2
- **Issue:** The plan's Task 2 template showed `"dev": "vite"` (no `--config` flag). Plan 01 already fixed this as a deviation — without `--config app/vite.config.js`, Vite picks up the repo root `index.html` (Docsify) and serves the wrong app.
- **Fix:** Retained `"dev": "vite --config app/vite.config.js"`, `"build": "vite build --config app/vite.config.js"`, and `"preview": "vite preview --config app/vite.config.js"`. Only added `predev`, `prebuild`, `build-manifest` entries.
- **Files modified:** `package.json`

## Known Stubs

None — `App.jsx` is fully wired. The `SpecViewer` renders actual spec content, not placeholder data. The manifest is generated from real `project-spec/` files.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes beyond what the plan's threat model documents (T-02-01 through T-02-06).

## Self-Check: PASSED

Verified files exist:
- FOUND: scripts/build-manifest.mjs
- FOUND: app/src/manifest.json
- FOUND: app/src/SpecViewer.jsx
- FOUND: app/src/App.jsx (replaced)
- FOUND: package.json (predev/prebuild hooks)

Verified commits exist:
- FOUND: 24ffe99 (Task 1: build-manifest.mjs)
- FOUND: 4d603b6 (Task 2: npm hooks)
- FOUND: d769e56 (Task 3: SpecViewer.jsx)
- FOUND: 17209de (Task 4: App.jsx replaced)
