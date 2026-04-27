---
phase: 03-navigation-search
plan: 02
subsystem: ui
tags: [sidebar, scroll-spy, intersection-observer, mobile-drawer, dom-driven-headings, react-hooks, phase3-nav]

# Dependency graph
requires:
  - phase: 03-navigation-search
    provides: "Plan 03-01 foundation — Sidebar.jsx stub, useScrollSpy.js stub, useScrollToAnchor.js (real), App.jsx layout shell, sidebar CSS custom properties in styles.css"
  - phase: 02-rich-rendering
    provides: "SpecViewer.jsx with .spec-viewer wrapper class and rehype-slug heading IDs (D-15 hash-format compatibility)"
provides:
  - Real Sidebar.jsx that lists every H2 PRD entry from the rendered DOM
  - H3 sub-headings auto-expand under the active PRD only (D-01)
  - Scroll-spy active-state highlighting via IntersectionObserver (D-17)
  - Click-to-scroll with smooth-scroll + URL hash update (NAV-03)
  - Mobile drawer pattern below 768px with hamburger toggle, backdrop, Escape-close (D-02)
  - Three pure helpers reusable in other components: pickActiveHeading, groupHeadingsByPrd, findActivePrd
  - 15 new node:test cases for the scroll-spy helpers
affects: [phase-03-search-panel, phase-04-brand-pass]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "DOM-driven heading source with debounced MutationObserver (D-18)"
    - "IntersectionObserver scroll-spy with rootMargin top-30% trigger zone (D-17)"
    - "Pure helpers separated from React hook for unit-testability (Phase 2 D-09 / SchemaTable.helpers.js precedent)"
    - "CSS custom properties for theming boundary (D-19) — no #2c8d4f in Phase 3"

key-files:
  created:
    - "app/src/components/useScrollSpy.test.js — 15 node:test cases for the three pure helpers"
  modified:
    - "app/src/components/useScrollSpy.js — replaced stub with three pure helpers + React hook (10 → 180 lines)"
    - "app/src/components/Sidebar.jsx — replaced stub with real component (12 → 203 lines)"
    - "app/src/components/Sidebar.css — extended with list/active/hamburger/backdrop styles (35 → 134 lines)"

key-decisions:
  - "Pure helpers (pickActiveHeading, groupHeadingsByPrd, findActivePrd) exported separately from the React hook — enables Sidebar to call groupHeadingsByPrd and findActivePrd outside the IO callback, and unit tests can exercise them without JSDOM"
  - "MutationObserver IS used (not just one-shot effect) — debounced to 200ms trailing edge per T-03-02-03 mitigation. Future content reloads (manifest hot-reload, post-Phase-3 features) will repopulate the sidebar without an App.jsx render-tree change"
  - "useScrollSpy effect dep key is headingIds.join('|') instead of the array reference — avoids infinite re-render when Sidebar re-creates the array on every group recompute"
  - "IntersectionObserver rootMargin '0px 0px -70% 0px' — only triggers active-state when a heading is in the top 30% of the viewport. Prevents flicker as user scrolls past long sections"
  - "Hamburger and backdrop are siblings of <aside> (not inside it) so they remain tappable when the drawer is hidden via display:none"

patterns-established:
  - "Heading collection: querySelectorAll('.spec-viewer h2[id], .spec-viewer h3[id]') is the single source of truth — no parallel AST, no markdown re-parse"
  - "Drawer overlay: <button> + <div backdrop> + <aside> rendered as a fragment from the Sidebar component; CSS controls visibility via @media (max-width: 767px) on each piece"

requirements-completed: [NAV-01, NAV-02, NAV-03]

# Metrics
duration: 18min
completed: 2026-04-27
---

# Phase 3 Plan 02: Sidebar Summary

**Real PRD sidebar — DOM-driven heading list with IntersectionObserver scroll-spy, smooth-scroll click handler, and mobile drawer toggle. Closes NAV-01..03.**

## Performance

- **Duration:** ~18 min
- **Started:** 2026-04-27T11:31:00Z (worktree adf47af)
- **Completed:** 2026-04-27T11:42:00Z
- **Tasks:** 2 (TDD: 1 RED + 1 GREEN; plus 1 feat for the Sidebar component)
- **Files modified:** 3 (Sidebar.jsx, Sidebar.css, useScrollSpy.js); 1 created (useScrollSpy.test.js)

## Accomplishments

- **NAV-01:** Sidebar lists every H2 (PRD-N) heading from the rendered DOM at all times
- **NAV-02:** H3 sub-headings auto-expand under the active PRD only (collapsed for inactive PRDs)
- **NAV-03:** Click any sidebar entry → smooth-scroll into view + URL hash update via `history.replaceState`
- **D-02 Mobile drawer:** Below 768px the sidebar hides; a fixed-position hamburger button toggles it as an overlay drawer with a translucent backdrop. Click-outside, Escape, and entry-click all close the drawer
- **D-03 Active visual:** 3px left accent bar (`var(--sidebar-active-bar)` neutral grey #586069) + bold text on the active entry. Phase 4 will swap the variable to MacPlants green
- **D-04 No header:** First child of `<aside>` is `<nav>`. No "MacPlants ERP" or "Sections" text — Phase 4 owns site title
- **D-17 Scroll-spy:** IntersectionObserver with `rootMargin: '0px 0px -70% 0px'` — only triggers when a heading enters the top 30% of the viewport, preventing flicker
- **D-18 DOM-driven:** `querySelectorAll('.spec-viewer h2[id], .spec-viewer h3[id]')` is the single source of truth; debounced MutationObserver re-collects on content change
- **15 new helper tests** all green (36 total: 21 baseline + 15 new) via `node --test`

## Task Commits

Each task was committed atomically:

1. **Task 1 (RED): failing tests for scroll-spy helpers** — `d6dfb1b` (test)
2. **Task 1 (GREEN): implement useScrollSpy hook with IntersectionObserver and three pure helpers** — `30987f3` (feat)
3. **Task 2: real Sidebar — DOM-driven PRD list, scroll-spy active state, mobile drawer** — `cfebc25` (feat)

_Plan metadata commit (SUMMARY) is owned by the orchestrator after the wave completes._

## Files Created/Modified

- `app/src/components/useScrollSpy.test.js` — **CREATED** — 15 `node:test` cases (6 for `pickActiveHeading`, 5 for `groupHeadingsByPrd`, 4 for `findActivePrd`)
- `app/src/components/useScrollSpy.js` — **REPLACED** stub (10 lines) with real implementation (180 lines): 3 pure helpers + 1 React hook
- `app/src/components/Sidebar.jsx` — **REPLACED** stub (12 lines) with real component (203 lines): DOM heading collection, MutationObserver re-collection, scroll-spy wiring, click handler, mobile drawer state + Escape listener
- `app/src/components/Sidebar.css` — **EXTENDED** layout-only stub (35 lines → 134 lines) with list/link/active/sublist/empty styles, hamburger button, backdrop, mobile media query

## Decisions Made

### Decision-to-code mapping (per Plan 03-02 `<output>` requirement)

| Decision | File:Line | What it does |
|----------|-----------|--------------|
| **D-01** (H3 expand active only) | `Sidebar.jsx:151` (`isActiveGroup ? render <ul.sidebar-sublist>`) + `Sidebar.jsx:103` (`activePrdId = findActivePrd(groups, activeId)`) | Sublist is rendered ONLY when `activePrdId === g.id`; non-active groups omit children entirely |
| **D-02** (Mobile drawer) | `Sidebar.jsx:117-129` (hamburger button + backdrop) + `Sidebar.css:97-133` (`@media (max-width: 767px)` block) | Below 768px `.sidebar` is `display:none`; drawer-open data attr toggles it to `position:fixed`; backdrop covers viewport; Escape closes (`Sidebar.jsx:107-114`) |
| **D-03** (Active accent bar) | `Sidebar.css:75-79` (`.sidebar-link--active { font-weight:700; border-left-color: var(--sidebar-active-bar); }`) | Each `.sidebar-link` has a transparent 3px left border that becomes accent-colored on the active entry |
| **D-04** (No sidebar header) | `Sidebar.jsx:131` (first `<aside>` child is `<nav id="sidebar-nav">`) | No `<h1>`, no site title, no brand text |
| **D-17** (IntersectionObserver) | `useScrollSpy.js:131-153` (observer setup with `rootMargin: '0px 0px -70% 0px'`) | One observer for all heading targets; threshold 0; topmost-visible wins via `pickActiveHeading` |
| **D-18** (DOM-driven headings) | `Sidebar.jsx:36-44` (`collectHeadings()` reads `querySelectorAll('.spec-viewer h2[id], .spec-viewer h3[id]')`) + `Sidebar.jsx:53-89` (one-shot collect with paint retries + debounced MutationObserver) | Single DOM read pass; rehype-slug IDs are consumed verbatim |

### MutationObserver: needed in practice or one-shot effect sufficient?

**MutationObserver IS wired** (debounced 200ms trailing edge). The one-shot effect alone would miss future content changes — e.g., a manifest hot-reload swapping the dated spec without remounting `<App>`. Today's app loads content once via `useState`, so the observer rarely fires after the initial collection, but the cost is near-zero (one observer; debounced; disconnects on unmount) and it future-proofs the sidebar against content swaps without requiring App.jsx to thread a content-version prop. Decision per T-03-02-03 mitigation in the threat register.

### Bundle size delta

- **Before (Phase 2 baseline):** 100.48 KB gz main bundle
- **After (Plan 03-02):** 101.65 KB gz main bundle (`dist/assets/index-DCmaqqfd.js`)
- **Delta:** +1.17 KB gz for sidebar + scroll-spy code
- **Verdict:** Marginally over the 100 KB soft budget (already breached in Phase 2). Phase 4 brand pass and Phase 5 build migration may revisit; not blocking.

### Test count delta

- **Baseline (after Phase 2):** 21 passing
- **Plan 03-02 added:** 15 helper tests (6 + 5 + 4)
- **Total now:** 36 passing
- **Hook-level integration:** verified at human-UAT (IntersectionObserver requires a real browser; project deliberately avoids JSDOM per Phase 2 D-09)

## Deviations from Plan

**None — plan executed exactly as written.**

The plan called for `requestAnimationFrame` retries OR `setTimeout(0)` for paint-wait; chose `requestAnimationFrame` (mirrors the established pattern in `useScrollToAnchor.js` from Plan 03-01). All other behaviors match the plan verbatim including the literal CSS block in `<action>`.

## Issues Encountered

**1. Worktree base mismatch on entry.** Worktree HEAD was at `923396c` (a separate root commit `86d587f` "first commit") rather than the orchestrator's `fc0041a`. Resolved with `git reset --hard fc0041a5dc096c888ca7b1406260fd89ff2cce29`. The discarded commits (`923396c`, `86d587f`) contained only an unrelated `README.md` and were not part of any work-in-progress. Documented in this section per execution-flow guidance.

**2. Build prereq missing.** `npm run build` initially failed with EXIT=1 because `project-spec/2026-04-26.md` (the dated spec, ~70 KB) is untracked in the parent repo and was therefore absent from the fresh worktree. Copied the file from the parent repo's working tree (`/Users/sigurdwatt/Development/MacPlants/project-spec/project-spec/2026-04-26.md`) into the worktree to enable the manifest build hook. The file is gitignored (`.gitignore` has `app/src/manifest.json` but not `project-spec/*.md`); it is now untracked in the worktree and **was NOT committed by this plan** since it is a content artifact owned by the parent workflow, not a Plan 03-02 deliverable. After the file was placed, `npm run build` exited 0 with the main bundle at 101.65 KB gz.

## Next Phase Readiness

- **Plan 03-03 (hash deep-link):** can proceed in this same wave — owns `useHashScroll.js` only, disjoint from this plan's files
- **Plan 03-04 (search index build):** can proceed in this same wave — owns `scripts/build-search-index.mjs` and `app/src/search-index.json`
- **Plan 03-05 (search panel):** can proceed in this same wave — owns `SearchPanel.jsx`, `SearchPanel.css`, `searchPanel.helpers.js`
- **Phase 4 (brand pass):** must keep `--sidebar-active-bar` as a CSS custom property override; component code does not need to change
- **No blockers** for downstream work in this wave

## File-disjointness confirmation (Wave 2)

Plan 03-02 modified or created **only**:
- `app/src/components/Sidebar.jsx`
- `app/src/components/Sidebar.css`
- `app/src/components/useScrollSpy.js`
- `app/src/components/useScrollSpy.test.js`

Did NOT touch any sibling-owned files (App.jsx, styles.css, useHashScroll.js, build-search-index.mjs, SearchPanel.*). Confirmed via `git show --name-only d6dfb1b 30987f3 cfebc25`.

## Self-Check: PASSED

- All 4 deliverable files exist (Sidebar.jsx, Sidebar.css, useScrollSpy.js, useScrollSpy.test.js)
- SUMMARY.md exists at the documented path
- All 3 commits present in git log (`d6dfb1b` RED, `30987f3` GREEN, `cfebc25` Sidebar)
- No `STUB` markers remain in Sidebar.jsx or useScrollSpy.js
- `npm test`: 36/36 passing
- `npm run build`: EXIT=0, main bundle 101.65 KB gz

---
*Phase: 03-navigation-search*
*Completed: 2026-04-27*
