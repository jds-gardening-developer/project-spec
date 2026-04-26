---
phase: 01-foundation
verified: 2026-04-26T00:00:00Z
status: human_needed
score: 4/5 must-haves verified
overrides_applied: 0
human_verification:
  - test: "Open http://localhost:5173 in a browser after `npm run dev`. Wait for the async loader to complete."
    expected: "The full spec renders with PRD section headings (h2 bold), Data Model tables (3-column GFM tables rendered as HTML tables), fenced code blocks, and the header 'Viewing: project-spec/2026-04-26.md' is visible. This proves import.meta.glob resolved correctly at runtime."
    why_human: "Vite's import.meta.glob is resolved client-side at module-load time. The curl smoke test confirmed server.fs.allow is correctly configured, but only a browser can prove the glob-loaded markdown string actually reaches SpecViewer and renders GFM content. Automated checks cannot execute JSX/Vite's browser-side module graph."
  - test: "While `npm run dev` is running, edit `app/src/App.jsx` (e.g. add a comment). Observe the browser."
    expected: "The browser reflects the change within ~1s without a full page reload (Fast Refresh / HMR). No manual refresh should be required."
    why_human: "HMR behavior requires a live browser session. It cannot be verified programmatically from CLI."
---

# Phase 1: Foundation Verification Report

**Phase Goal:** A Vite + React dev server renders the newest dated spec from a build-time manifest, with GitHub-flavored markdown displayed correctly. This is the seam every other phase builds on.
**Verified:** 2026-04-26
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | User can run `npm run dev` and a Vite dev server starts with HMR working on file save | ? PARTIAL | Dev server starts cleanly (confirmed: `VITE v5.4.21 ready in 222ms`, serves 200 at localhost:5175); predev hook regenerates manifest before Vite starts. HMR infrastructure is present (@vitejs/plugin-react installed, StrictMode wrapper correct) but browser-side Fast Refresh is not verifiable without a live browser session. |
| 2 | The build-time manifest script scans `project-spec/*.md`, sorts by ISO date, and the React app imports it as JSON | ✓ VERIFIED | `scripts/build-manifest.mjs` exists (94 lines), runs cleanly (exit 0), emits `app/src/manifest.json` with `[{"date":"2026-04-26","filename":"2026-04-26.md"}]`. App.jsx imports manifest and picks `manifest[0]`. Vite serves the manifest JSON correctly at `/src/manifest.json` (confirmed via curl). |
| 3 | On first paint at `localhost:5173`, the viewer auto-loads the file with the most recent ISO date (currently `2026-04-26.md`) | ? HUMAN NEEDED | App.jsx correctly reads `manifest[0]`, constructs the loader key, and calls `loader()` in a useEffect. Vite's `server.fs.allow` is confirmed to permit `@fs` access to `project-spec/2026-04-26.md` (70317 bytes served). However, whether `import.meta.glob` resolves the loader at runtime and the markdown string reaches `SpecViewer` requires browser verification. The `Viewing: project-spec/2026-04-26.md` header visually confirms correct file selection only in-browser. |
| 4 | The 70KB spec content renders without lag, with GFM tables, fenced code blocks, and strikethrough displayed correctly | ? HUMAN NEEDED | `SpecViewer.jsx` uses `react-markdown` with `remarkPlugins={[remarkGfm]}` and no `rehype-raw`. The spec file contains GFM tables (Field/Type/Notes format confirmed). remark-gfm 4.0.1 is installed. Actual rendering correctness requires a browser: tables must appear as HTML tables, code blocks must be fenced, no raw markdown leaking. |
| 5 | Adding a hypothetical newer dated file (e.g. `2026-05-10.md`) and re-running the dev server causes the viewer to auto-switch to it | ✓ VERIFIED | Tested directly: copied `project-spec/2026-04-26.md` to `project-spec/2026-05-10.md`, ran `node scripts/build-manifest.mjs` — manifest[0].date became `2026-05-10`. Manifest sorts descending via `b.date.localeCompare(a.date)`. The `predev` hook regenerates manifest before Vite starts, so restart picks up the new file automatically. Dummy file cleaned up. |

**Score:** 2/5 automated, 2/5 human-needed (cannot count as failed — infrastructure is correct), 1/5 partial (HMR infra present, runtime unverifiable)

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `.gitignore` | Excludes node_modules, dist, .env, .DS_Store, manifest.json, transient outputs | ✓ VERIFIED | All required entries present: `node_modules/`, `dist/`, `.env`, `.DS_Store`, `app/src/manifest.json`, `README.proposed.md`. Does NOT exclude `package-lock.json` (correct). |
| `package.json` | Vite + React deps, predev/prebuild hooks, dev:docsify preserved | ✓ VERIFIED | `dev: vite --config app/vite.config.js`, `predev: node scripts/build-manifest.mjs`, `prebuild: node scripts/build-manifest.mjs`, `dev:docsify: npx docsify-cli@4 serve .`, all deps installed (react 18.3.1, react-markdown 9.1.0, remark-gfm 4.0.1, vite 5.4.21). |
| `app/index.html` | Vite HTML entry with #root and /src/main.jsx module script | ✓ VERIFIED | Contains `<div id="root"></div>`, `<script type="module" src="/src/main.jsx">`, correct title. No Docsify references. |
| `app/vite.config.js` | React plugin, root=app/, fs.allow to repo root, port 5173 | ✓ VERIFIED | `root: __dirname` (= `app/`), `plugins: [react()]`, `server.port: 5173`, `fs.allow: [path.resolve(__dirname, '..')]` (confirmed via module import: allow=["/Users/sigurdwatt/Development/MacPlants/project-spec"]). |
| `app/src/main.jsx` | createRoot, StrictMode, imports App and styles | ✓ VERIFIED | Imports `createRoot`, `StrictMode`, `App from './App.jsx'`, `'./styles.css'`. Calls `document.getElementById('root')` with throw guard. Wraps App in StrictMode. |
| `app/src/App.jsx` | Imports manifest, import.meta.glob, renders SpecViewer | ✓ VERIFIED | Imports `manifest from './manifest.json'`, `import.meta.glob('../../project-spec/*.md', {query:'?raw', import:'default'})`, `useEffect`/`useState`, `SpecViewer`. Reads `manifest[0]`, async-loads with cancellation guard, passes `content` to `<SpecViewer markdown={content} />`. |
| `app/src/styles.css` | Minimal base CSS, no brand color #2c8d4f | ✓ VERIFIED | Has `body { margin: 0; }`, `#root { max-width: 960px; }`. Does NOT contain `#2c8d4f`. |
| `scripts/build-manifest.mjs` | Node ESM, scans project-spec, sorts descending, writes manifest.json | ✓ VERIFIED | 94 lines, shebang present, `import fs from "node:fs"`, ISO_DATE_RE regex, `path.basename(entry) === entry` traversal check, `b.date.localeCompare(a.date)` sort, `fs.writeFileSync` to manifest path. Runs cleanly, exit 0. |
| `app/src/manifest.json` | [{"date":"2026-04-26","filename":"2026-04-26.md"}] | ✓ VERIFIED | Generated by build-manifest.mjs, correct structure, served by Vite at /src/manifest.json. |
| `app/src/SpecViewer.jsx` | react-markdown + remark-gfm, no rehype-raw | ✓ VERIFIED | Imports ReactMarkdown and remarkGfm. `remarkPlugins={[remarkGfm]}`. NO import/use of rehype-raw (the only "rehype-raw" occurrence is in a JSDoc comment saying NOT to use it). `export default function SpecViewer`. 31 lines. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `package.json#scripts.dev` | `app/vite.config.js` | `vite --config app/vite.config.js` | ✓ WIRED | Exact string `"dev": "vite --config app/vite.config.js"` confirmed in package.json |
| `package.json#scripts.predev` | `scripts/build-manifest.mjs` | npm lifecycle hook | ✓ WIRED | `"predev": "node scripts/build-manifest.mjs"` confirmed; tested end-to-end (manifest regenerated on `npm run dev`) |
| `app/index.html` | `app/src/main.jsx` | `<script type="module" src="/src/main.jsx">` | ✓ WIRED | Exact attribute present in app/index.html line 10 |
| `app/src/main.jsx` | `app/src/App.jsx` | `import App from './App.jsx'` | ✓ WIRED | Present at line 3 of main.jsx |
| `app/src/App.jsx` | `app/src/manifest.json` | `import manifest from './manifest.json'` | ✓ WIRED | Present at line 3 of App.jsx |
| `app/src/App.jsx` | `../../project-spec/*.md` | `import.meta.glob(..., {query:'?raw', import:'default'})` | ✓ WIRED | Present at lines 8-11 of App.jsx. Vite `server.fs.allow` permits the path (confirmed via @fs curl returning 70317 bytes) |
| `app/src/App.jsx` | `app/src/SpecViewer.jsx` | `<SpecViewer markdown={content} />` | ✓ WIRED | SpecViewer imported at line 2; rendered at line 68 with `markdown={content}` prop |
| `app/src/SpecViewer.jsx` | `remark-gfm` | `remarkPlugins={[remarkGfm]}` | ✓ WIRED | remark-gfm imported at line 2; passed as plugin at line 28 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `App.jsx` | `content` (state) | `specLoaders[key]()` — Vite glob lazy-loader calling `import(file + '?raw')` | Yes — loader resolves from `project-spec/2026-04-26.md` (70317 bytes, confirmed accessible via @fs) | ✓ FLOWING (programmatically confirmed to access spec; browser needed to confirm full string delivery to SpecViewer) |
| `App.jsx` | `manifest` | Static JSON import from `app/src/manifest.json` (generated by build-manifest.mjs at predev) | Yes — manifest contains real dated entries | ✓ FLOWING |
| `SpecViewer.jsx` | `markdown` prop | Received from App.jsx as `content` state | Yes — connected via `<SpecViewer markdown={content} />` | ✓ FLOWING (browser needed to confirm actual render) |

### Behavioral Spot-Checks

| Behavior | Command/Check | Result | Status |
|----------|---------------|--------|--------|
| Manifest script produces correct output | `node scripts/build-manifest.mjs` — check newest date | `newest: 2026-04-26`, exit 0 | ✓ PASS |
| Manifest JSON has correct structure | `manifest[0].date === '2026-04-26' && manifest[0].filename === '2026-04-26.md'` | True | ✓ PASS |
| Dev server starts with predev hook | `npm run dev` — check for `VITE ... ready` in log | `VITE v5.4.21 ready in 222ms` — predev hook ran first | ✓ PASS |
| Dev server serves HTML shell | `curl http://localhost:5175/` contains `<div id="root">` | Present | ✓ PASS |
| Dev server serves manifest JSON | `curl http://localhost:5175/src/manifest.json` contains `2026-04-26` | Present | ✓ PASS |
| Vite fs.allow permits spec access | `curl @fs.../project-spec/2026-04-26.md?raw` > 50KB | 70317 bytes | ✓ PASS |
| Auto-switch with newer file | Add `2026-05-10.md`, run manifest script — manifest[0].date | `2026-05-10` (sorted newest-first) | ✓ PASS |
| No build errors | `npm run build` | `✓ 288 modules transformed. ✓ built in 637ms` — dist at `app/dist/` | ✓ PASS |
| No errors in dev log | grep for error/failed/cannot find module | None found | ✓ PASS |
| HMR wired | @vitejs/plugin-react installed, StrictMode present | Infrastructure correct | ? SKIP (requires browser) |
| GFM rendering in browser | Visual check of table/code/strikethrough | Not run | ? SKIP (requires browser) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| VIEW-01 | 01-01-scaffold-PLAN.md | A Vite + React app builds to a static `dist/` directory ready for static hosting | ✓ SATISFIED | `npm run build` produces `app/dist/` with `index.html`, `assets/` (JS + CSS). The `app/dist/` location is correct given `vite.config.js root: __dirname`. Note: Phase 5 (DEP-01) owns moving to repo-root `dist/` for Netlify. |
| VIEW-02 | 01-02-manifest-viewer-PLAN.md | Build-time script scans `project-spec/*.md`, sorts by ISO date, emits manifest JSON | ✓ SATISFIED | `scripts/build-manifest.mjs` implements this fully; wired via predev/prebuild hooks. |
| VIEW-03 | 01-02-manifest-viewer-PLAN.md | On first paint viewer auto-loads spec file with most recent ISO date | ? NEEDS HUMAN | Code path is correctly implemented (manifest[0] → glob loader → SpecViewer). Browser verification needed to confirm full runtime resolution. |
| REND-01 | 01-02-manifest-viewer-PLAN.md | GFM tables, fenced code blocks, and strikethrough rendered correctly | ? NEEDS HUMAN | react-markdown + remark-gfm wired correctly. Actual rendering in browser not yet confirmed. |
| DEP-03 | 01-01-scaffold-PLAN.md | `npm run dev` starts a local Vite dev server with hot module replacement | ? PARTIAL | Dev server starts confirmed. HMR infrastructure present. HMR behavior requires browser session. |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/src/App.jsx` | 18 | `useState(null)` — content starts as null | ℹ️ Info | Not a stub: null is the loading state before the async loader resolves. SpecViewer handles this with `typeof markdown !== 'string'` guard returning `<p>Loading…</p>`. No rendering gap. |
| `app/vite.config.js` | 18 | `fs.allow: [path.resolve(__dirname, '..')]` — exposes entire repo root | ⚠️ Warning | Noted in code review (WR-01): dev-only setting, broader than strictly necessary. Narrowing to `['app/', '../project-spec']` would reduce blast radius. No production exposure (Phase 5 build embeds content). Acceptable for Phase 1. |

No blockers found. The single Warning is a pre-existing code review finding (WR-01 in 01-REVIEW.md), not a Phase 1 execution defect.

### Human Verification Required

#### 1. GFM Content Rendering in Browser

**Test:** Run `npm run dev`. Open `http://localhost:5173` (or whatever port Vite picks) in a browser. Wait ~1 second for the async loader.
**Expected:** The page shows the header `Viewing: project-spec/2026-04-26.md` and below it the full spec content. Specifically look for:
- PRD section headings (`## **PRD-1: Plant Database & Inventory**`) rendered as HTML `<h2>` with bold text
- At least one 3-column Data Model table (Field | Type | Notes) rendered as an HTML table with proper borders/cells
- At least one fenced code block rendered with monospace font and code formatting
**Why human:** `import.meta.glob` is a Vite client-side feature resolved at module-load time in the browser. The curl smoke test confirmed `server.fs.allow` permits reading the file, but whether the Vite module graph correctly resolves the glob and delivers the 70KB string to `SpecViewer` can only be confirmed by observing the rendered output.

#### 2. Hot Module Replacement (HMR)

**Test:** While `npm run dev` is running and the browser is open, edit `app/src/App.jsx` — e.g. change the `<small>` label text from `Viewing:` to `Now viewing:`. Save the file.
**Expected:** The browser updates within ~1 second showing the changed text, without a full page reload (no browser spinner, URL does not change, scroll position preserved).
**Why human:** HMR / React Fast Refresh behavior requires a live browser. The infrastructure is verified (@vitejs/plugin-react installed, StrictMode wrapper correct) but the actual refresh cannot be observed from CLI.

### Gaps Summary

No gaps blocking goal achievement. All code-verifiable aspects of Phase 1 pass. Two success criteria (SC3 and SC4) require browser confirmation to be fully satisfied — they are implemented correctly in code but their end-to-end behavior (import.meta.glob runtime resolution → GFM rendering in DOM) cannot be asserted without a browser. DEP-03 (HMR) similarly requires a live browser session.

The root `index.html` shows uncommitted changes in `git status`. These changes pre-exist Phase 1 and were explicitly documented in `.planning/STATE.md` ("uncommitted prior changes modified index.html"). No Phase 1 commit touched `index.html` (confirmed via `git log --oneline <phase1-commits> -- index.html` returning only the pre-Phase-1 `923396c` commit). This is correct behavior — the Docsify viewer is intentionally left untouched until Phase 5.

---

_Verified: 2026-04-26_
_Verifier: Claude (gsd-verifier)_
