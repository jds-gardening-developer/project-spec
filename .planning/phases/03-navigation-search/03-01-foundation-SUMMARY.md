---
phase: 03-navigation-search
plan: 01
subsystem: foundation-seam
tags: [layout-shell, scroll-hook, css-custom-properties, parallel-seam, minisearch-dep]
dependency_graph:
  requires:
    - app/src/App.jsx#phase-2-final
    - app/src/styles.css#phase-2-theming-surface
    - app/src/components/CrossLinkText.jsx#phase-2-scroll-mechanic
    - package.json#phase-2-scripts
    - scripts/build-manifest.mjs#phase-1-pattern
  provides:
    - package.json#minisearch-dep
    - package.json#build-search-index-script
    - package.json#predev-prebuild-chain
    - scripts/build-search-index.mjs#stub
    - app/src/search-index.json#placeholder
    - app/src/components/Sidebar.jsx#stub
    - app/src/components/Sidebar.css#layout-only
    - app/src/components/SearchPanel.jsx#stub
    - app/src/components/SearchPanel.css#modal-only
    - app/src/components/useScrollSpy.js#stub
    - app/src/components/useHashScroll.js#stub
    - app/src/components/useScrollToAnchor.js#real
    - app/src/App.jsx#layout-shell
    - app/src/styles.css#phase-3-theming-surface
  affects:
    - package.json
    - package-lock.json
    - app/src/App.jsx
    - app/src/styles.css
tech_stack:
  added:
    - minisearch@7.2.0 (D-05 search library; not yet imported — Plan 03-05 lazy-loads)
  patterns:
    - css-custom-properties-theming-surface (extends Phase 2 D-19)
    - layout-shell-aside-main (D-16 plain flex)
    - reusable-scroll-hook (useScrollToAnchor extracted from CrossLinkText)
    - parallel-seam-stubs (mirror Phase 2 Plan 01)
    - predev-prebuild-chain (manifest && index)
key_files:
  created:
    - app/src/components/Sidebar.jsx
    - app/src/components/Sidebar.css
    - app/src/components/SearchPanel.jsx
    - app/src/components/SearchPanel.css
    - app/src/components/useScrollSpy.js
    - app/src/components/useHashScroll.js
    - app/src/components/useScrollToAnchor.js
    - scripts/build-search-index.mjs
    - app/src/search-index.json
  modified:
    - app/src/App.jsx
    - app/src/styles.css
    - package.json
    - package-lock.json
decisions:
  - "Pinned minisearch@^7 (7.2.0 in lockfile) per D-05; chosen over FlexSearch for the smaller ~14 KB gz footprint that protects the Phase 2 bundle headroom (100.48 KB main + 14 KB MiniSearch chunk stays under any reasonable budget)."
  - "minisearch declared in `dependencies` (not `devDependencies`) because Plan 03-05 imports it at runtime via lazy `import('minisearch')`; runtime import means it ships in the bundle even though the import is deferred."
  - "predev/prebuild chain uses literal `node ... && node ...` (not `npm run build-manifest && npm run build-search-index`) to skip the npm-run-script startup overhead that would double the hook cost on every dev/build invocation."
  - "useScrollToAnchor is the ONE non-stub component file: it extracts the happy-path scroll mechanic from CrossLinkText.jsx (lines 66–83 of Phase 2). CrossLinkText.jsx itself is intentionally NOT modified — it owns broken-link useState/console.warn behavior; the new hook is happy-path only (D-12, D-14)."
  - "useScrollToAnchor uses getElementById (not querySelector prefix-match) because Phase 3 sidebar/search records carry full slug ids per D-15; the prefix match in CrossLinkText only existed because cross-links carry abbreviated `prd-x-y` text. Different inputs → different APIs."
  - "B-02 fix: removed the leftover `<h1>MacPlants ERP — Specification</h1>` from App.jsx error path. D-04 forbids any site title in Phase 3; Phase 4 BRD-04 owns header/branding work."
  - "12 new CSS custom properties grouped by component family (sidebar/search-modal/search-result), all neutral structural colors. No `#2c8d4f` introduced anywhere — Phase 4 will override --sidebar-active-bar and --search-result-highlight to brand."
  - "Layout shell uses plain CSS flex per D-16 (no grid library, no CSS-in-JS). The .app-shell container caps width at 1200 px and centers via margin: 0 auto; the original Phase 1 `#root { max-width: 960px; margin: 0 auto }` rule is overridden via a SECOND #root block (later cascade wins) rather than editing the original."
metrics:
  duration: "~7 minutes"
  completed: "2026-04-27"
  tasks_completed: 3
  bundle_main_gz_before: "100.48 KB"
  bundle_main_gz_after: "100.51 KB"
  bundle_delta_gz: "+0.03 KB"
  tests_total: 21
  tests_passing: 21
---

# Phase 3 Plan 01: Foundation Summary

**One-liner:** Phase 3 parallel-seam: minisearch installed (deferred runtime import), App.jsx wrapped in `<aside>+<main>+<SearchPanel/>` layout shell with 12 CSS custom properties, useScrollToAnchor hook extracted from CrossLinkText, six file-disjoint stubs ready for Wave 2.

## What This Plan Built

1. **minisearch installed** as a runtime dep (`^7.2.0`) — not yet imported anywhere; Plan 03-05 will lazy-load it on first Cmd/Ctrl+K open.
2. **`scripts/build-search-index.mjs` stub** wired into both `predev` and `prebuild` via the literal chain `node scripts/build-manifest.mjs && node scripts/build-search-index.mjs`. The stub writes `[]` to `app/src/search-index.json` — Plan 03-04 replaces it with real spec parsing + index emission.
3. **`app/src/search-index.json` placeholder** — exactly `[]\n` so the JSON import in Plan 03-05's SearchPanel resolves on day one, even before the real index exists.
4. **Seven new files under `app/src/components/`**:
   - **REAL**: `useScrollToAnchor.js` — `useCallback`-stable function that does `getElementById(id) → scrollIntoView({behavior:'smooth', block:'start'}) → history.replaceState(null,'','#'+id)` and returns `true` on hit, `false` on miss (silent — no console.warn).
   - **Stubs** (each JSDoc names the downstream plan that owns its real impl): `Sidebar.jsx`, `Sidebar.css`, `SearchPanel.jsx`, `SearchPanel.css`, `useScrollSpy.js`, `useHashScroll.js`.
5. **`App.jsx` layout shell**: imports `Sidebar`, `SearchPanel`, `useHashScroll`; calls `useHashScroll(content)` once; wraps the success-path return in `<div class="app-shell"><Sidebar /><main class="app-main">{header + SpecViewer}</main><SearchPanel /></div>`. Error path keeps its `<main>` wrapper. **B-02 fix:** the leftover `<h1>MacPlants ERP — Specification</h1>` was removed from the error path per D-04.
6. **`styles.css` extension**: 12 new CSS custom properties (sidebar 6 + search-modal 3 + search-result 3) declared in a second `:root` block, plus `.app-shell` / `.app-main` flex layout rules and a `#root` override that releases the Phase 1 max-width cap so the layout shell can own centering.

## Resolved Versions

| Package | Range in package.json | Resolved (lockfile) |
|---------|------------------------|---------------------|
| minisearch | `^7.2.0` | 7.2.0 |

## NPM Scripts: Hook Chain

The `predev` and `prebuild` hooks now run BOTH the manifest scan AND the (stub) search-index build before every dev/build:

```json
"predev":   "node scripts/build-manifest.mjs && node scripts/build-search-index.mjs",
"prebuild": "node scripts/build-manifest.mjs && node scripts/build-search-index.mjs",
"build-manifest":      "node scripts/build-manifest.mjs",
"build-search-index":  "node scripts/build-search-index.mjs",
```

The literal `node ... && node ...` form is intentional — it skips the npm-run-script startup overhead that `npm run build-manifest && npm run build-search-index` would add (≈200 ms × 2 per invocation).

## CSS Custom Property Surface (12 new variables)

**Sidebar group (6):**
- `--sidebar-bg` — background of the aside (`#fafbfc` neutral). Phase 4 may override.
- `--sidebar-border` — right border of the aside (`#e1e4e8`).
- `--sidebar-text` — default entry text color (`#24292e`).
- `--sidebar-text-active` — active entry text color (`#24292e` — same in Phase 3; Phase 4 may darken or color).
- `--sidebar-active-bar` — left accent bar on the active entry (D-03; `#586069` neutral). **Phase 4 sets this to MacPlants green.**
- `--sidebar-hover-bg` — hover row background (`#f0f3f5`).

**Search-modal group (3):**
- `--search-modal-bg` — modal background (`#ffffff`).
- `--search-modal-backdrop` — overlay color behind the modal (`rgba(27, 31, 35, 0.5)`).
- `--search-modal-border` — modal border (`#d1d5da`).

**Search-result group (3):**
- `--search-result-highlight` — `<mark>` background for matched terms (`#fff5b1`). Phase 4 may override.
- `--search-result-active-bg` — keyboard-active result row background (`#f6f8fa`).
- `--search-result-context` — small grey context line color (`#586069`).

All values are neutral structural colors; **no `#2c8d4f`** appears anywhere in Phase-3-introduced CSS or JSX.

## Stubs vs Real Implementations (Wave 2 contract)

| File | Phase 3 Plan 01 (this plan) | Wave 2 Owner |
|------|------------------------------|--------------|
| `app/src/components/Sidebar.jsx` | empty `<aside class="sidebar">` | Plan 03-02 (NAV-01..03) |
| `app/src/components/Sidebar.css` | layout-only (sticky desktop, drawer mobile) | Plan 03-02 |
| `app/src/components/SearchPanel.jsx` | `return null` | Plan 03-05 (SEA-01, SEA-03) |
| `app/src/components/SearchPanel.css` | modal structural styles only | Plan 03-05 |
| `app/src/components/useScrollSpy.js` | returns `null` | Plan 03-02 (D-17 IntersectionObserver) |
| `app/src/components/useHashScroll.js` | no-op effect | Plan 03-03 (NAV-04, D-13/D-14/D-15) |
| `app/src/components/useScrollToAnchor.js` | **REAL** — used immediately by 03-02 sidebar clicks and 03-05 result selection | (consumed by 03-02 + 03-05) |
| `scripts/build-search-index.mjs` | writes `[]` to JSON | Plan 03-04 (build-time spec parsing) |
| `app/src/search-index.json` | `[]\n` placeholder | Plan 03-04 (real records) |

## Wave-2 File-Disjointness (mirroring Phase 2 Plan 01 table)

After this plan, each Wave-2 plan can drop its real implementation into a disjoint set of files **without touching App.jsx, styles.css, or package.json again.**

| Plan | Owns these files | Touches App.jsx? | Touches styles.css? | Touches package.json? |
|------|------------------|------------------|---------------------|------------------------|
| 03-02 sidebar | `Sidebar.jsx`, `Sidebar.css`, `useScrollSpy.js` | No | No | No |
| 03-03 hash-deeplink | `useHashScroll.js` | No | No | No |
| 03-04 search-index | `scripts/build-search-index.mjs`, `app/src/search-index.json` | No | No | No |
| 03-05 search-panel | `SearchPanel.jsx`, `SearchPanel.css` | No | No | No |

Each plan in Wave 2 has a single primary file (or a tight pair) to fill in. Cross-cutting concerns — App.jsx wiring, CSS variable surface, the dependency, and the build hook chain — are all already in place.

## Bundle Size

| Snapshot | Main bundle (gzipped) |
|----------|------------------------|
| End of Phase 2 | 100.48 KB |
| End of Phase 3 Plan 01 (this plan) | 100.51 KB |
| Delta | **+0.03 KB** |

`minisearch` is **not yet contributing** to the main bundle because nothing imports it yet. Plan 03-05 will introduce a `lazy import('minisearch')` so the library lands in its own dynamic chunk on first Cmd/Ctrl+K open. The +0.03 KB delta is from the 7 new component/hook files being statically reachable via App.jsx (Sidebar render path), useHashScroll call, and the import declarations.

## Verification

| Check | Result |
|-------|--------|
| `npm run build` | exit 0; main bundle 100.51 KB gz |
| `npm test` | 21/21 passing (no regression vs Phase 2) |
| `node scripts/build-search-index.mjs` (direct) | exit 0; `[]` written |
| `node -e "require('./app/src/search-index.json')"` | exit 0; valid JSON |
| `grep -c -- '--' app/src/styles.css` | 30 (≥ 27 threshold) |
| `grep -RE '#2c8d4f' app/src/components/{Sidebar,SearchPanel,useScrollToAnchor,useScrollSpy,useHashScroll}*` | 0 matches in Plan-introduced files |
| `grep -E '#2c8d4f' app/src/App.jsx` | 0 matches (B-02 fix, no MacPlants ERP h1) |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking issue] Restored worktree branch base**

- **Found during:** Pre-task setup (initial worktree branch verification).
- **Issue:** The worktree branch `worktree-agent-a6b405e5919f8f1b1` had been initialized from a much older commit (`923396ce`, before the `web-app-refactor` `.planning/` and `app/` scaffolding existed) instead of the expected base `0ad3f9c2`. Without this fix, all referenced project files (PLAN.md, App.jsx, styles.css, scripts/build-manifest.mjs, etc.) would have been unreadable and Task 1 could not have started.
- **Fix:** `git reset --hard 0ad3f9c2c6c6743b6a1bb6c73b701187f970354b` to align the worktree HEAD with the expected base.
- **Files modified:** None (working tree state only).
- **Commit:** N/A (pre-task setup, no code changes).

**2. [Rule 3 - Blocking issue] Restored project-spec/2026-04-26.md so the build hook can succeed**

- **Found during:** Baseline build before Task 1.
- **Issue:** `npm run build` failed at the prebuild manifest step because `project-spec/2026-04-26.md` was absent from the worktree (it was untracked in the parent repo per the original `git status` snapshot, and worktrees don't inherit untracked files). Without this file the manifest scan exits 1 and the build never reaches Vite — Task 1's verification step "`npm run build` exits 0" would be impossible to satisfy.
- **Fix:** Copied the file from the parent worktree at `/Users/sigurdwatt/Development/MacPlants/project-spec/project-spec/2026-04-26.md`. The file remains untracked (it is not Phase 3 scope to commit; it's the canonical spec content that pre-dates this branch's planning work and is tracked separately upstream).
- **Files modified:** `project-spec/2026-04-26.md` (untracked, not committed).
- **Commit:** N/A.

No other deviations. The plan executed exactly as written for all three tasks.

### Authentication Gates

None — this plan involves no external services.

## Self-Check: PASSED

**Files created (verified on disk):**
- FOUND: app/src/components/Sidebar.jsx
- FOUND: app/src/components/Sidebar.css
- FOUND: app/src/components/SearchPanel.jsx
- FOUND: app/src/components/SearchPanel.css
- FOUND: app/src/components/useScrollSpy.js
- FOUND: app/src/components/useHashScroll.js
- FOUND: app/src/components/useScrollToAnchor.js
- FOUND: scripts/build-search-index.mjs
- FOUND: app/src/search-index.json

**Files modified (verified via git log):**
- FOUND: app/src/App.jsx (commit 248a1fc)
- FOUND: app/src/styles.css (commit 248a1fc)
- FOUND: package.json (commit a394090)
- FOUND: package-lock.json (commit a394090)

**Commits (verified via git log):**
- FOUND: a394090 — chore(03-01): install minisearch + wire build-search-index hook chain
- FOUND: 980c236 — feat(03-01): add 6 stub components + REAL useScrollToAnchor hook
- FOUND: 248a1fc — feat(03-01): wire layout shell in App.jsx + 12 Phase 3 CSS custom properties
