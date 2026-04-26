---
phase: 01-foundation
plan: 01
subsystem: scaffold
tags: [vite, react, setup, gitignore, package-json]
dependency_graph:
  requires: []
  provides: [app/index.html, app/vite.config.js, app/src/main.jsx, app/src/App.jsx, app/src/styles.css, .gitignore, package.json#vite-scripts]
  affects: [package.json, package-lock.json]
tech_stack:
  added: [vite@5.4.21, "@vitejs/plugin-react@4.7.0", react@18.3.1, react-dom@18.3.1, react-markdown@9.1.0, remark-gfm@4.0.1]
  patterns: [vite-root-config, react-createroot, esm-single-package]
key_files:
  created:
    - .gitignore
    - app/index.html
    - app/vite.config.js
    - app/src/main.jsx
    - app/src/App.jsx
    - app/src/styles.css
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Vite scripts use --config app/vite.config.js flag so npm run dev/build/preview all route to the app/ root rather than picking up the repo root index.html (Docsify)"
  - "Single-package repo: all deps in root package.json, no app/package.json"
  - "JSX/React files use single quotes per React ecosystem convention (intentional deviation from CLAUDE.md double-quote rule which applies to Node tooling layer only)"
metrics:
  duration: "~3 minutes"
  completed: "2026-04-26"
  tasks_completed: 7
  files_changed: 8
---

# Phase 1 Plan 01: Scaffold Summary

**One-liner:** Vite + React scaffold under `app/` with `.gitignore`, updated `package.json`, and working `npm run dev` at port 5173 — legacy Docsify preserved as `dev:docsify`.

## What Was Built

A minimal but fully working Vite + React shell that:

- Lives entirely under `app/` so the live Docsify `index.html` at the repo root is untouched
- Mounts a placeholder `<App>` component via React 18 `createRoot` + `StrictMode`
- Has a Vite config with the React plugin, port 5173, and `server.fs.allow` extended to the repo root so Plan 02 can import markdown from `../project-spec/`
- Is wired via `npm run dev` (and `npm run build`, `npm run preview`) in `package.json`
- Preserves the legacy Docsify workflow under `npm run dev:docsify`
- Has a `.gitignore` covering `node_modules/`, `dist/`, `.env`, `.DS_Store`, `app/src/manifest.json` (build artifact for Plan 02), and the three transient `scripts/update-spec.mjs` outputs

## Resolved Dependency Versions

| Package | Requested | Resolved |
|---------|-----------|---------|
| react | ^18.3.1 | 18.3.1 |
| react-dom | ^18.3.1 | 18.3.1 |
| react-markdown | ^9.0.1 | 9.1.0 |
| remark-gfm | ^4.0.0 | 4.0.1 |
| vite | ^5.4.0 | 5.4.21 |
| @vitejs/plugin-react | ^4.3.0 | 4.7.0 |
| @anthropic-ai/sdk | ^0.90.0 | 0.90.0 (preserved) |
| dotenv | ^16.4.5 | 16.6.1 (preserved) |

Minor versions are all within the declared caret ranges. No major-version surprises.

## npm install Output

213 packages added. 2 moderate severity vulnerabilities (transitive dependencies — not in direct deps added by this plan). No action needed in Phase 1; these are known issues in the transitive dependency tree and do not affect the dev/build workflow.

## Smoke Test Result

`npm run dev` started Vite v5.4.21 in 214ms, served the placeholder app at http://localhost:5173/.

- `curl http://localhost:5173/` returned HTML containing `<div id="root">` — PASS
- `curl http://localhost:5173/src/main.jsx` returned module containing `createRoot` — PASS
- Dev log contained no `error`, `failed`, or `cannot find` lines — PASS

## Root index.html Status

`git diff index.html` shows no changes. The live Docsify entry at the repo root is completely untouched.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Vite dev script not pointing at app/vite.config.js**

- **Found during:** Task 7 (smoke test)
- **Issue:** The plan specified `"dev": "vite"` in `package.json`. When `vite` runs from the repo root without a `--config` flag, it finds the root `index.html` (Docsify) and serves that instead of `app/index.html`. The smoke test confirmed this: `curl http://localhost:5173/` returned the Docsify entry.
- **Fix:** Changed all three Vite scripts to pass `--config app/vite.config.js`:
  - `"dev": "vite --config app/vite.config.js"`
  - `"build": "vite build --config app/vite.config.js"`
  - `"preview": "vite preview --config app/vite.config.js"`
- **Files modified:** `package.json`
- **Commit:** b5288e1

**Note for Plan 02:** The `--config app/vite.config.js` flag must be used in any new scripts or tooling that invokes Vite. The `predev`/`prebuild` hooks planned for Plan 02 (running `build-manifest.mjs`) run before the Vite invocation so they are unaffected.

## Known Stubs

`app/src/App.jsx` — the component body is intentionally a placeholder. It renders a static heading and paragraph. Plan 02 replaces this with `<SpecViewer />` that imports the manifest and renders the newest dated spec. This stub is intentional and Plan 02 resolves it.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced beyond what the plan's threat model documents (T-01-01 through T-01-06).

## Self-Check: PASSED

Verified files exist:
- FOUND: .gitignore
- FOUND: app/index.html
- FOUND: app/vite.config.js
- FOUND: app/src/main.jsx
- FOUND: app/src/App.jsx
- FOUND: app/src/styles.css
- FOUND: package-lock.json

Verified commits exist:
- FOUND: e48dfaf (Task 1: .gitignore)
- FOUND: 2776029 (Task 2: package.json + npm install)
- FOUND: ce2b9c0 (Task 3: app/index.html)
- FOUND: 0a2bf64 (Task 4: app/vite.config.js)
- FOUND: bf3728f (Task 5: main.jsx + styles.css)
- FOUND: cdf89fd (Task 6: App.jsx)
- FOUND: b5288e1 (Deviation fix: --config flag)
