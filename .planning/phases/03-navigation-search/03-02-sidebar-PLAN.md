---
phase: 03-navigation-search
plan: 02
type: execute
wave: 2
depends_on: [03-01]
files_modified:
  - app/src/components/Sidebar.jsx
  - app/src/components/Sidebar.css
  - app/src/components/useScrollSpy.js
  - app/src/components/useScrollSpy.test.js
autonomous: true
requirements: [NAV-01, NAV-02, NAV-03]
tags: [sidebar, scroll-spy, intersection-observer, mobile-drawer, dom-driven-headings, phase3-nav]

must_haves:
  truths:
    - "User sees every H2 (PRD-N) heading listed in the left sidebar at all times"
    - "User sees H3 sub-headings expanded under the PRD currently in view; H3s under inactive PRDs are collapsed"
    - "User can click any sidebar entry to smooth-scroll that section into view; URL hash updates accordingly"
    - "Below 768px, sidebar is hidden by default; a hamburger button toggles it as an overlay drawer; reading area gets full width"
    - "Active sidebar entry shows a left accent bar (3-4px) plus bolded text — neutral structural color, NOT MacPlants green (Phase 4 owns brand)"
  artifacts:
    - path: "app/src/components/Sidebar.jsx"
      provides: "Real Sidebar: builds heading list from DOM after SpecViewer mounts (D-18); shows H2 always, H3 expanded for active PRD only (D-01); active-state via left bar (D-03); mobile drawer toggle (D-02)"
      min_lines: 80
      exports: ["Sidebar"]
    - path: "app/src/components/Sidebar.css"
      provides: "Real list styles, active-state bar, expand/collapse, mobile drawer + hamburger; uses CSS custom properties from styles.css"
      contains: "var(--sidebar-active-bar)"
    - path: "app/src/components/useScrollSpy.js"
      provides: "Real hook: IntersectionObserver tracks all H2[id]/H3[id] elements; returns active heading id (D-17)"
      min_lines: 30
      exports: ["useScrollSpy"]
    - path: "app/src/components/useScrollSpy.test.js"
      provides: "node:test cases for scroll-spy logic (pure helper functions extracted for testability)"
      min_lines: 30
  key_links:
    - from: "Sidebar.jsx"
      to: "DOM headings"
      via: "querySelectorAll('h2[id], h3[id]') after SpecViewer renders"
      pattern: "querySelectorAll.*h2\\[id\\]"
    - from: "Sidebar.jsx"
      to: "useScrollSpy"
      via: "import + invocation with collected heading ids"
      pattern: "useScrollSpy\\("
    - from: "Sidebar.jsx click handler"
      to: "useScrollToAnchor"
      via: "scrollToAnchor(id) call on entry click"
      pattern: "scrollToAnchor"
    - from: "useScrollSpy.js"
      to: "IntersectionObserver"
      via: "new IntersectionObserver in useEffect"
      pattern: "IntersectionObserver"
---

<objective>
Replace the Plan 03-01 Sidebar/useScrollSpy stubs with a real, functioning sidebar that lists every H2 PRD heading, auto-expands H3s for the section currently in view, smooth-scrolls on click with hash update, and collapses to a drawer on mobile. Closes NAV-01, NAV-02, NAV-03.

Purpose: First killer feature of Phase 3 — restores the Docsify-style left navigation that the user explicitly asked to preserve (CONTEXT.md "keep what works, replace the engine").
Output: Real Sidebar.jsx + Sidebar.css + useScrollSpy.js + tests. Visible runtime behavior: a populated sidebar with smooth-scroll navigation matching today's Docsify viewer.
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
@app/src/App.jsx
@app/src/styles.css
@app/src/components/Sidebar.jsx
@app/src/components/Sidebar.css
@app/src/components/useScrollSpy.js
@app/src/components/useScrollToAnchor.js

<interfaces>
<!-- Phase 3-01 already created the foundation; this plan fills in two of its files. -->

useScrollToAnchor (created by Plan 03-01, REAL):
```js
// app/src/components/useScrollToAnchor.js
export function useScrollToAnchor(): (id: string) => boolean
//   Returns a memoized callback that smooth-scrolls to id and updates location.hash
//   via history.replaceState. Returns true on hit, false on miss. Silent on miss.
```

CSS custom properties available (declared by Plan 03-01 in styles.css):
- --sidebar-bg, --sidebar-border, --sidebar-text, --sidebar-text-active
- --sidebar-active-bar (Phase 4 will set to MacPlants green)
- --sidebar-hover-bg

App.jsx already mounts <Sidebar /> as a sibling to <main className="app-main">.
Sidebar must:
  1. After SpecViewer renders (which is OUTSIDE Sidebar — they are siblings), find headings in document.querySelector('.spec-viewer h2[id], .spec-viewer h3[id]').
  2. Use a MutationObserver or a one-shot effect tied to a re-mount key — react-markdown emits its DOM synchronously when content arrives, so a useEffect with a re-poll on next animation frame works (mirrors Plan 03-01's useScrollToAnchor pattern of waiting for paint).
  3. Re-collect headings if SpecViewer re-renders (e.g., manifest reload). Easiest approach: read on every paint, or expose a re-collect callback on a content-version prop.

Heading id format from rehype-slug:
  ## **PRD-1: Plant Database & Inventory** → id="prd-1-plant-database--inventory"
  ### **What Is It**                       → id="what-is-it"
  ### **Data Model**                       → id="data-model"
  Multiple "Data Model" h3s get suffixed: id="data-model-1", "data-model-2", etc.
  Sidebar must work with these as opaque ids — do NOT try to parse PRD numbers from them.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: useScrollSpy hook (TDD: pure-helper RED → GREEN; integration via IntersectionObserver)</name>
  <files>app/src/components/useScrollSpy.js, app/src/components/useScrollSpy.test.js</files>
  <read_first>
    - app/src/components/useScrollSpy.js (current stub returning null — replace it)
    - app/src/components/SchemaTable.helpers.js (Phase 2 pure-JS helper pattern: pure functions that node --test can exercise without JSDOM)
    - app/src/components/SchemaTable.helpers.test.js (Phase 2 test pattern: node:test, no JSDOM)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-01 H3 expand active only, D-17 IntersectionObserver)
  </read_first>
  <behavior>
    Pure helper `pickActiveHeading(entries)` chooses the most-visible heading among IntersectionObserver entries:
    - Test 1: Empty entries array → returns null
    - Test 2: Single intersecting entry → returns its target.id
    - Test 3: Multiple intersecting entries → returns the one with the smallest boundingClientRect.top (topmost-visible-in-viewport rule per D-01/D-17)
    - Test 4: Multiple entries, none intersecting (intersectionRatio: 0) → returns null (do NOT change active state when nothing is visible — the previously-active section stays)
    - Test 5: Mixed (some intersecting, some not) → returns topmost intersecting entry, ignoring non-intersecting ones
    - Test 6: Entry with no target.id (defensive) → skipped, returns next-best

    Pure helper `groupHeadingsByPrd(headings)` takes a flat list of `{id, level, text}` and groups H3s under the preceding H2:
    - Test 1: Empty input → []
    - Test 2: Only H2s → array of `{id, text, children: []}` for each H2
    - Test 3: H2 followed by 2 H3s → one group with children of length 2
    - Test 4: Two H2s with H3s between them → H3s correctly assigned to their preceding H2
    - Test 5: H3 before any H2 (defensive — would be malformed spec) → orphan H3 dropped (or surfaced as a top-level entry; pick one and document)

    Pure helper `findActivePrd(groups, activeId)` returns the H2 id whose group contains activeId (so even if an H3 is "active", the parent H2 is the section to expand):
    - Test 1: activeId is an H2's own id → returns that H2 id
    - Test 2: activeId is a child H3's id → returns parent H2 id
    - Test 3: activeId is null → returns null
    - Test 4: activeId not found in any group → returns null
  </behavior>
  <action>
    1. **RED commit:** Create `app/src/components/useScrollSpy.test.js` with all the test cases listed in `<behavior>`. Use the Phase 2 pattern: `import { test } from 'node:test'; import assert from 'node:assert/strict';`. Import three named exports from `./useScrollSpy.js`: `pickActiveHeading`, `groupHeadingsByPrd`, `findActivePrd`. Run `npm test` and confirm at least the helper tests fail (the stub `useScrollSpy.js` doesn't export those names yet). Commit: `test(03-02): add failing tests for scroll-spy helpers`.

    2. **GREEN commit:** Replace `app/src/components/useScrollSpy.js` with the real implementation:
       - Three pure helpers (named exports for testability): `pickActiveHeading(entries)`, `groupHeadingsByPrd(headings)`, `findActivePrd(groups, activeId)`.
       - One React hook (default named export): `useScrollSpy(headingIds)` that:
         - Takes an array of heading ids (string[]).
         - Uses `useState` to track the current active id.
         - In `useEffect`, creates an IntersectionObserver with `rootMargin: '0px 0px -70% 0px'` (the "topmost visible" tuning per D-17 — only triggers active-state when a heading is in the top 30% of the viewport, prevents flicker as user scrolls past).
         - Observes every `document.getElementById(id)` for the input array (filter out misses).
         - On each callback, runs `pickActiveHeading(entries)` and calls `setActiveId` if the result differs from current.
         - Cleanup: disconnect the observer on unmount.
         - Re-runs effect when `headingIds.join('|')` changes (so live re-collection in Sidebar works without infinite loops).
         - Returns the active id (string | null).

       Run `npm test` — all helper tests must pass. Hook integration is verified at human-UAT time (IntersectionObserver requires a real browser; node:test cannot exercise it without JSDOM, which is intentionally NOT a project dependency per the tested-via-node-only pattern).

       Commit: `feat(03-02): implement useScrollSpy hook with IntersectionObserver and three pure helpers`.

    Reference: D-01 (H3 expand for active section only), D-17 (IntersectionObserver, threshold tuned for topmost-visible). Phase 2 D-09 / SchemaTable.helpers.js precedent for pure helpers under unit test.
  </action>
  <verify>
    <automated>
      grep -q "export function pickActiveHeading" app/src/components/useScrollSpy.js &&
      grep -q "export function groupHeadingsByPrd" app/src/components/useScrollSpy.js &&
      grep -q "export function findActivePrd" app/src/components/useScrollSpy.js &&
      grep -q "export function useScrollSpy" app/src/components/useScrollSpy.js &&
      grep -q "IntersectionObserver" app/src/components/useScrollSpy.js &&
      grep -q "rootMargin" app/src/components/useScrollSpy.js &&
      ! grep -q "STUB" app/src/components/useScrollSpy.js &&
      cd app/.. && npm test 2>&1 | tail -10
    </automated>
  </verify>
  <acceptance_criteria>
    - `useScrollSpy.js` exports four named functions: `pickActiveHeading`, `groupHeadingsByPrd`, `findActivePrd`, `useScrollSpy`.
    - `useScrollSpy.js` no longer contains the literal string `STUB`.
    - `useScrollSpy.js` references `IntersectionObserver` and `rootMargin` (tuning).
    - All test cases in `useScrollSpy.test.js` pass — `npm test` reports the new tests as PASS (Phase 2 had 21; Plan 03-02 adds at least 15 — final count documented in SUMMARY).
    - The hook handles `headingIds` being empty (returns null, does not throw, does not create an observer).
    - The hook returns the same memoized `null` reference when `headingIds` is empty (no infinite re-render loop).
    - No regression: Phase 2's 21 tests still pass.
  </acceptance_criteria>
  <done>useScrollSpy is real with three pure helpers (unit-tested) and one React hook (integration-tested at UAT). Tests green. Stub annotation removed.</done>
</task>

<task type="auto">
  <name>Task 2: Real Sidebar component (DOM-driven heading list, scroll-spy active-state, click-to-scroll, mobile drawer)</name>
  <files>app/src/components/Sidebar.jsx, app/src/components/Sidebar.css</files>
  <read_first>
    - app/src/components/Sidebar.jsx (current Plan 03-01 stub — replace it)
    - app/src/components/Sidebar.css (current Plan 03-01 layout-only styles — extend)
    - app/src/components/useScrollSpy.js (just made real in Task 1)
    - app/src/components/useScrollToAnchor.js (Plan 03-01 real hook)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-01..D-04, D-17, D-18, D-20)
    - app/src/components/CrossLinkText.jsx (existing scroll precedent — Sidebar must feel identical)
  </read_first>
  <action>
    Replace `app/src/components/Sidebar.jsx` (the Plan 03-01 stub returning empty `<aside>`) with the full implementation, and extend `app/src/components/Sidebar.css` with the entry-list styles + active-state bar + mobile drawer + hamburger.

    **`Sidebar.jsx` requirements (D-01..D-04, D-17, D-18, D-20):**

    1. **DOM-driven heading source (D-18):** On mount and on a content-version trigger, run `document.querySelectorAll('.spec-viewer h2[id], .spec-viewer h3[id]')` and build an array of `{id, level, text}`. The Phase 2 SpecViewer's wrapper class `.spec-viewer` is the scoping selector.
       - Use a `useEffect` with no dependencies + an inner `setTimeout(fn, 0)` OR `requestAnimationFrame` to wait for the SpecViewer's first paint.
       - To re-collect when the spec content changes (e.g., a future hot-reload), expose a poll via `MutationObserver` on `document.querySelector('.spec-viewer')` with `{childList: true, subtree: true}` (debounced — re-run heading collection at most once every 200ms via a trailing timer).
       - If `.spec-viewer` is not in the DOM yet (first paint not committed), retry once on the next animation frame; after 3 retries, give up silently (sidebar shows empty, no crash).

    2. **Build PRD groups:** Pass the heading list through `groupHeadingsByPrd` (from `useScrollSpy.js`) to get `[{id, text, children: [{id, text}, ...]}, ...]`.

    3. **Scroll-spy active state:** Pass the FLAT id list `[h2.id, ...all h3 ids]` to `useScrollSpy(ids)`. Then call `findActivePrd(groups, activeId)` to determine which H2 group should expand its H3s.

    4. **Render:**
       - `<aside className="sidebar" data-drawer-open={drawerOpen} aria-label="PRD navigation">`
       - Inside aside: `<nav><ul className="sidebar-list">`
       - For each group: one `<li className="sidebar-item">` containing:
         - One H2 entry: `<a href={'#' + h2.id} className={"sidebar-link sidebar-link--h2" + (activeId === h2.id ? ' sidebar-link--active' : '')} onClick={...}>` text `</a>`
         - If `activePrdId === h2.id`: render the children list `<ul className="sidebar-sublist">` with each H3 as `<li><a href={'#' + h3.id} className={...}>` text `</a></li>`
         - If NOT the active group: omit the children entirely (collapsed, D-01).

    5. **Click handler:** `onClick={(e) => { e.preventDefault(); scrollToAnchor(id); setDrawerOpen(false); }}` — closes the drawer on click for mobile (D-02). Use `useScrollToAnchor` from Plan 03-01.

    6. **Mobile drawer (D-02):** Render the hamburger `<button>` outside the `<aside>` (since aside is `display:none` on mobile). The hamburger must live in App.jsx... no wait — D-02 says "hamburger button in the top-left of the main content area". To keep file ownership clean, the Sidebar component renders a `<button className="sidebar-hamburger" aria-expanded={drawerOpen} aria-controls="sidebar-nav">☰</button>` BEFORE the `<aside>`. CSS positions it `position: fixed; top: 12px; left: 12px;` and only displays it below 768px.
       - `useState(false)` for `drawerOpen`.
       - Hamburger toggles it.
       - Clicking outside the drawer (a backdrop element) closes it.
       - Pressing Escape closes it: a `useEffect` adds a global `keydown` listener while drawerOpen is true.

    7. **Active-state visual (D-03):** Bolded text + a left accent bar (3-4px solid `var(--sidebar-active-bar)`). Inactive entries use `var(--sidebar-text)`; active uses `var(--sidebar-text-active)` + bold.

    8. **Sidebar header (D-04):** NONE. The first child of `<aside>` is the `<nav>`. Do NOT add a "MacPlants ERP" or "Sections" header — Phase 4 owns that.

    9. **Defensive: empty heading list** — render a small `<p className="sidebar-empty">(no sections)</p>` instead of crashing. Should never trigger against the dated spec.

    **`Sidebar.css` additions** (extend, do NOT replace the Plan 03-01 layout block):

    ```css
    /* Plan 03-02: list, items, active-state, mobile hamburger */

    .sidebar nav { padding: 0 12px; }
    .sidebar-list { list-style: none; margin: 0; padding: 0; }
    .sidebar-item { margin: 0; }

    .sidebar-link {
      display: block;
      padding: 6px 8px 6px 12px;
      color: var(--sidebar-text);
      text-decoration: none;
      border-left: 3px solid transparent;
      font-size: 14px;
      line-height: 1.4;
      border-radius: 0 4px 4px 0;
    }
    .sidebar-link:hover {
      background: var(--sidebar-hover-bg);
    }
    .sidebar-link--h2 {
      font-weight: 500;
    }
    .sidebar-link--h3 {
      font-size: 13px;
      padding-left: 24px;
    }
    .sidebar-link--active {
      color: var(--sidebar-text-active);
      font-weight: 700;
      border-left-color: var(--sidebar-active-bar);
    }
    .sidebar-sublist {
      list-style: none;
      margin: 0 0 8px 0;
      padding: 0;
    }
    .sidebar-empty {
      padding: 12px;
      color: var(--sidebar-text);
      opacity: 0.6;
      font-size: 13px;
    }

    /* Hamburger — visible only below 768px (D-02) */
    .sidebar-hamburger {
      display: none;
      background: var(--sidebar-bg);
      border: 1px solid var(--sidebar-border);
      border-radius: 4px;
      padding: 6px 10px;
      font-size: 18px;
      cursor: pointer;
      color: var(--sidebar-text);
    }
    @media (max-width: 767px) {
      .sidebar-hamburger {
        display: block;
        position: fixed;
        top: 12px;
        left: 12px;
        z-index: 101;
      }
    }
    /* Drawer backdrop on mobile (when open) */
    .sidebar-backdrop {
      display: none;
    }
    @media (max-width: 767px) {
      .sidebar-backdrop[data-open="true"] {
        display: block;
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.4);
        z-index: 99;
      }
    }
    ```

    **MUST NOT contain:** `#2c8d4f` (Phase 4 owns brand). Active bar uses `var(--sidebar-active-bar)` which Plan 03-01 set to neutral grey `#586069`.
  </action>
  <verify>
    <automated>
      ! grep -q "STUB" app/src/components/Sidebar.jsx &&
      grep -q "useScrollSpy" app/src/components/Sidebar.jsx &&
      grep -q "useScrollToAnchor" app/src/components/Sidebar.jsx &&
      grep -q "querySelectorAll" app/src/components/Sidebar.jsx &&
      grep -q '\.spec-viewer h2' app/src/components/Sidebar.jsx &&
      grep -q "groupHeadingsByPrd" app/src/components/Sidebar.jsx &&
      grep -q "findActivePrd" app/src/components/Sidebar.jsx &&
      grep -q "sidebar-link--active" app/src/components/Sidebar.jsx &&
      grep -q "sidebar-link--active" app/src/components/Sidebar.css &&
      grep -q "var(--sidebar-active-bar)" app/src/components/Sidebar.css &&
      grep -q "sidebar-hamburger" app/src/components/Sidebar.jsx &&
      grep -q "sidebar-hamburger" app/src/components/Sidebar.css &&
      grep -q "@media (max-width: 767px)" app/src/components/Sidebar.css &&
      grep -q "scrollToAnchor" app/src/components/Sidebar.jsx &&
      ! grep -q "MacPlants ERP" app/src/components/Sidebar.jsx &&
      ! grep -q "#2c8d4f" app/src/components/Sidebar.jsx &&
      ! grep -q "#2c8d4f" app/src/components/Sidebar.css &&
      cd app/.. && npm run build 2>&1 | tail -3 &&
      npm test 2>&1 | tail -3
    </automated>
  </verify>
  <acceptance_criteria>
    - `Sidebar.jsx` no longer contains the literal `STUB`.
    - `Sidebar.jsx` imports both `useScrollSpy` (or its three named helpers) AND `useScrollToAnchor`.
    - `Sidebar.jsx` calls `document.querySelectorAll('.spec-viewer h2[id], .spec-viewer h3[id]')` (verbatim selector — grep-verifiable).
    - `Sidebar.jsx` calls `groupHeadingsByPrd` and `findActivePrd` (the helpers exported from `useScrollSpy.js`).
    - `Sidebar.jsx` does NOT contain the literal text `MacPlants ERP` (D-04: no header in Phase 3).
    - `Sidebar.jsx` does NOT contain `#2c8d4f` (D-19/Phase 4 boundary).
    - `Sidebar.jsx` renders `<button className="sidebar-hamburger">` for the mobile toggle.
    - `Sidebar.jsx` click handler calls `event.preventDefault()` AND `scrollToAnchor(id)` AND `setDrawerOpen(false)`.
    - `Sidebar.css` defines `.sidebar-link`, `.sidebar-link--h2`, `.sidebar-link--h3`, `.sidebar-link--active`, `.sidebar-sublist`, `.sidebar-hamburger` rules.
    - `Sidebar.css` `.sidebar-link--active` rule contains `border-left-color: var(--sidebar-active-bar);` (the D-03 left accent bar).
    - `Sidebar.css` has a `@media (max-width: 767px)` block that displays the hamburger and hides the regular sidebar.
    - `Sidebar.css` does NOT contain `#2c8d4f`.
    - `npm run build` exits 0.
    - `npm test` exits 0 (Plan 03-01 tests + Task 1 tests all green; no JSX-render unit test added — visual verification is human-UAT).
  </acceptance_criteria>
  <done>Sidebar is real: lists every PRD H2, expands H3s for the active section only, smooth-scrolls on click with hash update, collapses to drawer below 768px with hamburger toggle. Visual confirmation deferred to human UAT (IntersectionObserver requires a browser). NAV-01, NAV-02, NAV-03 fully wired.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| DOM heading IDs → sidebar entries | rehype-slug output is trusted (already sanitized by react-markdown); Sidebar reads `id` attributes verbatim |
| User click → scroll target | Click handler reads the heading id from React state (built from DOM); does not interpolate user input |
| URL hash update | Uses `history.replaceState` with the resolved DOM element's id, not raw input |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-02-01 | Tampering | Sidebar.jsx querySelectorAll | accept | Selector is hardcoded; no user input. rehype-slug guarantees IDs are URL-safe slugs. |
| T-03-02-02 | Information Disclosure | Sidebar entry text | accept | Text is the heading text already visible in main content; no new exposure surface. |
| T-03-02-03 | Denial of Service | MutationObserver on .spec-viewer | mitigate | Debounce re-collection to 200ms trailing edge; disconnect observer on unmount; cap retries to 3 if .spec-viewer is missing. |
| T-03-02-04 | Spoofing | sidebar-link href values | mitigate | href is constructed as `'#' + id` where id is from rehype-slug (regex-bound `[a-z0-9-]+`). preventDefault() means href is never followed; it exists only for accessibility (right-click "open in new tab" works). |
| T-03-02-05 | Elevation of Privilege | IntersectionObserver | accept | Browser API; no user-controlled inputs reach it. Observation targets are DOM nodes by reference. |
</threat_model>

<verification>
- `npm test` exits 0 with all useScrollSpy helper tests passing.
- `npm run build` exits 0; bundle size delta within budget (sidebar + hook code ≤ 2 KB gz expected).
- `grep -RE '#2c8d4f' app/src/components/Sidebar.{jsx,css} app/src/components/useScrollSpy.js` returns no matches.
- Stub markers removed from useScrollSpy.js and Sidebar.jsx.
</verification>

<success_criteria>
- NAV-01: Every H2 (PRD-N) heading in the dated spec appears in the sidebar at all times.
- NAV-02: H3 sub-headings expand under the active PRD only; inactive PRDs show no children.
- NAV-03: Click any sidebar entry → smooth-scroll + URL hash update.
- D-02: Below 768px, sidebar hides, hamburger appears, drawer slides in on tap, click-outside / Escape / entry-click closes it.
- D-03: Active entry shows left accent bar + bold text.
- D-04: NO sidebar header text.
- Phase 4 boundary intact: NO `#2c8d4f` in any file modified by this plan.
</success_criteria>

<output>
After completion, create `.planning/phases/03-navigation-search/03-02-sidebar-SUMMARY.md` documenting:
- Test count delta (Phase 2: 21 → Plan 03-02: 21 + N where N is the number of new helper tests).
- Bundle size delta (98.98 KB gz → ?? KB gz).
- D-01..D-04, D-17, D-18 mapping to specific code locations (line numbers + file).
- Whether MutationObserver was needed in practice or whether one-shot effect sufficed.
- Confirmation that `Sidebar.jsx`, `Sidebar.css`, `useScrollSpy.js` are the only files modified by this plan (Wave-2 file-disjointness).
</output>
