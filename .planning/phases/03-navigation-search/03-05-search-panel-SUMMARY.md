---
phase: 03-navigation-search
plan: 05
subsystem: search-modal
tags: [search-modal, cmd-k, minisearch, lazy-load, keyboard-nav, highlighted-snippets, phase3-search, xss-safe]
requirements: [SEA-01, SEA-03]
dependency_graph:
  requires:
    - 03-01-foundation (SearchPanel stub, useScrollToAnchor hook, CSS custom properties, layout shell)
    - 03-04-search-index (search-index.json — consumed via static JSON import; runs in parallel wave-2)
  provides:
    - SEA-01: Cmd+K (macOS) / Ctrl+K (Linux/Windows) opens a search modal overlay
    - SEA-03: clicking/Entering a search result dismisses the modal and scrolls to that section
  affects:
    - app/src/components/SearchPanel.jsx (real component replaces 03-01 stub)
    - app/src/components/SearchPanel.css (input/list/result/snippet/mark rules added)
    - app/src/components/searchPanel.helpers.js (NEW — pure helpers)
    - app/src/components/searchPanel.helpers.test.js (NEW — node:test suite)
    - bundle topology: minisearch lazy-loaded into a dedicated chunk; main entry stays MiniSearch-free
tech-stack:
  added: []
  patterns:
    - module-level dynamic-import singleton (mirrors MermaidPre.jsx loadMermaid pattern)
    - segment-list snippet rendering — Array<{type,text}> instead of HTML string (XSS-safe by design)
    - createPortal to document.body (modal escapes sticky-sidebar stacking context)
    - reuses useScrollToAnchor hook (Plan 03-01) for selection scroll — same mechanic as sidebar clicks
    - escape-regex helper to defeat regex injection from query terms
key-files:
  created:
    - app/src/components/searchPanel.helpers.js
    - app/src/components/searchPanel.helpers.test.js
  modified:
    - app/src/components/SearchPanel.jsx
    - app/src/components/SearchPanel.css
decisions:
  - "buildSnippet returns segment list, not HTML string — eliminates XSS at the type level (T-03-05-01)"
  - "Module-level miniSearchPromise singleton: import('minisearch') fires once, only on first Cmd+K open"
  - "Selection wraps scrollToAnchor in requestAnimationFrame so the modal unmounts before smooth scroll begins"
  - "Backdrop click closes; modal stops propagation — D-08 click-outside dismisses pattern"
  - "Empty/whitespace-only query returns empty result list AND no <ul> renders (D-11 strict empty state)"
metrics:
  duration_seconds: 356
  duration_minutes: 5.9
  completed_date: 2026-04-27
  task_count: 2
  commits: 3
  test_count_before: 21
  test_count_after: 46
  test_count_delta: +25
  files_modified: 4
  lines_added: 722
  lines_removed: 7
---

# Phase 3 Plan 05: Search Panel Summary

Replaced the Plan 03-01 SearchPanel stub with the real Cmd/Ctrl+K modal: keyboard-triggered, MiniSearch lazy-loaded into its own chunk (5.96 KB gz), keyboard-navigable (Esc/↑/↓/Enter), with regex-safe highlighted snippets rendered as a React segment list (no `dangerouslySetInnerHTML`), and select-to-scroll via the same `useScrollToAnchor` hook the sidebar uses. SEA-01 and SEA-03 are now wired end-to-end; SEA-02 stays with Plan 03-04.

## What Shipped

### Pure helpers — `app/src/components/searchPanel.helpers.js` (173 lines)

Three named exports, all unit-tested under `node --test`:

- **`isSearchHotkey(event)`** — D-09 keyboard binding. Returns `true` iff `(event.metaKey || event.ctrlKey)` AND `event.key.toLowerCase() === 'k'`. Defensive on null/undefined/non-string inputs (no throw).
- **`buildSnippet(body, query, maxLen)`** — D-10 result snippet. Returns `Array<{type: 'text'|'mark', text: string}>` — a segment list, NOT an HTML string. Window centered on first match with `…` prefix/suffix; multi-term whitespace-split queries each escape-regex'd before alternation construction; case-insensitive matching preserves body's original casing. SearchPanel renders each segment as React text or a `<mark>` JSX element via normal text path → no XSS surface (T-03-05-01).
- **`formatBreadcrumb(prd_id, level)`** — D-10 small grey context label. Converts `'prd-1-1'` → `'PRD-1.1'` (dashes → dots, uppercase). Returns `''` for null/missing prd_id (H1 doc title, non-PRD H2 like "Meeting Action Items").

### Test suite — `app/src/components/searchPanel.helpers.test.js` (178 lines, 25 tests)

- 8 tests for `isSearchHotkey` covering macOS Cmd+K, Linux/Windows Ctrl+K, case-insensitivity, lone-K rejection, wrong-letter rejection, both-modifiers acceptance, null/empty/non-string defensive paths.
- 11 tests for `buildSnippet` covering simple match, full-body return, windowed snippet with ellipsis, multi-term highlighting, no-match truncation, empty body/empty query/whitespace-only query, regex special-char escaping, case-insensitive matching, segment-list shape contract (XSS-safe assertion).
- 6 tests for `formatBreadcrumb` covering H2/H3 levels, null prd_id, empty prd_id, PRD-1.1 round-trip, PRD-3.4 round-trip.

### Real SearchPanel component — `app/src/components/SearchPanel.jsx` (279 lines)

Replaces the 13-line stub. Key sections (line numbers in current file):

| Decision | Code location | Behavior |
|----------|--------------|----------|
| **D-05** MiniSearch lazy-load | `loadMiniSearch()` lines 35–53 | Module-level `miniSearchPromise` singleton; `import('minisearch')` resolves to a separate Vite chunk; `ms.addAll(searchIndexData)` runs only on first Cmd+K |
| **D-08** Modal shape + click-outside dismiss | `createPortal` JSX lines 197–271 | Renders into `document.body`; `.search-modal-backdrop onClick={close}`; inner `.search-modal onClick={stopPropagation}` |
| **D-09** Cmd+K global listener | `useEffect` lines 92–101 | `window.addEventListener('keydown', onKey)` calls `isSearchHotkey(event)` → `event.preventDefault()` → `setOpen(true)` |
| **D-09** Modal keyboard nav | `onInputKeyDown` lines 162–193 | `Escape` → close; `ArrowDown/Up` → move activeIndex with bounds; `Enter` → `select(results[activeIndex])` |
| **D-10** Result format | JSX lines 234–258 | Title (`<div className="search-result-title">`), breadcrumb via `formatBreadcrumb(r.prd_id, r.level)` (omitted when empty), snippet via `buildSnippet(r.body, query, 160)` rendered as text/`<mark>` segments |
| **D-11** Empty state | useEffect lines 130–137 + conditional `<ul>` lines 226 | Empty/whitespace query → `setResults([])`; results list `<ul>` only renders when `results.length > 0` (no recently-searched, no placeholder list) |
| **D-12** Selection behavior | `select` callback lines 71–85 | `setOpen(false)` → clear state → `requestAnimationFrame(() => scrollToAnchor(record.id))`. The rAF lets the modal unmount + body-scroll-lock release before the smooth scroll fires (otherwise the modal's `overflow:hidden` can cancel the smooth animation) |
| **D-19** No brand color | (entire file) | `! grep -q "#2c8d4f"` returns 0 matches in JSX and CSS; active row uses `var(--search-result-active-bg)`, marks use `var(--search-result-highlight)` |

### CSS additions — `app/src/components/SearchPanel.css` (132 lines)

Phase-3 structural styling layered onto Plan 03-01's modal/backdrop scaffold:

- `.search-modal-input` — borderless 14px×18px input with bottom border using `var(--search-modal-border)`, `font-size:16px` to defeat iOS input-zoom.
- `.search-results` — `flex:1 1 auto; overflow-y:auto`; bounded by the modal's `max-height:70vh`.
- `.search-result` — 10px×18px hit target, transparent left border that animates in on active.
- `.search-result--active` — `var(--search-result-active-bg)` background + `var(--sidebar-active-bar)` left bar (3px). Transitions are 80ms for keyboard-nav fluidity.
- `.search-result-title` / `.search-result-context` / `.search-result-snippet` — typographic hierarchy; snippet `-webkit-line-clamp:2` keeps results compact.
- `.search-result-snippet mark` — `var(--search-result-highlight)` background, 2px radius pill, font-weight 600.
- `@keyframes search-modal-in` — 120ms slide+fade gated by `prefers-reduced-motion: no-preference`.

## Selection-Flow Trace (D-09 + D-12)

```
User presses Cmd+K
  → window keydown listener (line 95)
  → isSearchHotkey(event) === true
  → event.preventDefault() (suppress browser-native binding)
  → setOpen(true)

open transitions to true → useEffect (line 105)
  → loadMiniSearch() — singleton, fires only first time
  → Vite resolves dynamic import('minisearch') → fetch index-YAyeC_kg.js (5.96 KB gz)
  → new MiniSearch({ idField, fields, storeFields, searchOptions })
  → ms.addAll(searchIndexData)  // currently [] — Plan 03-04 will fill it
  → setMiniSearch(ms)

User types in <input> → setQuery(value) → effect (line 130)
  → trimmedQuery.length === 0 → setResults([])
  → otherwise: miniSearch.search(query, { prefix: true, fuzzy: 0.2 }).slice(0, 20)
  → setResults(hits); setActiveIndex(hits.length > 0 ? 0 : -1)

Results render → <ul role="listbox"> with each <li role="option">
  Active row gets ref={activeItemRef}; effect at line 156 calls scrollIntoView({block:'nearest'})

User presses ArrowDown/Up → onInputKeyDown (line 162)
  → setActiveIndex with bounds clamp; preventDefault keeps input cursor still

User presses Enter → onInputKeyDown
  → select(results[activeIndex])

select(record) (line 71)
  → setOpen(false); reset query/results/activeIndex
  → requestAnimationFrame(() => scrollToAnchor(record.id))
  → useScrollToAnchor (Plan 03-01) → document.getElementById(record.id).scrollIntoView({behavior:'smooth', block:'start'}) + history.replaceState(null, '', '#'+id)
```

The rAF wrap matters: without it, `setOpen(false)` triggers state cleanup AND the `document.body.style.overflow` scroll-lock is restored on the same paint, which can race with `scrollIntoView` on Safari. With the rAF, the modal commit/unmount completes before the scroll request lands.

## Bundle Topology

| Chunk | Path | Raw | Gzipped | Contents |
|-------|------|-----|---------|----------|
| **Main entry** | `app/dist/assets/index-DGeWawbQ.js` | 323.93 KB | **102.11 KB** | React + react-markdown + viewer + Sidebar + SearchPanel JSX (no MiniSearch) |
| MiniSearch lazy chunk | `app/dist/assets/index-YAyeC_kg.js` | 18.02 KB | **5.96 KB** | minisearch package — loaded on first Cmd+K |
| Mermaid lazy chunk | `app/dist/assets/index-5325376f-BTtkmD7R.js` | 11.99 KB | 4.17 KB | Phase 2 mermaid bootstrap |
| Spec text chunk | `app/dist/assets/2026-04-26-DSQwaBHq.js` | 70.07 KB | 24.13 KB | Phase 1 raw markdown payload |

Verification commands (run from worktree root):

```bash
$ grep -L "MiniSearch" app/dist/assets/index-DGeWawbQ.js
app/dist/assets/index-DGeWawbQ.js   # main entry — listed by -L means MiniSearch is ABSENT
$ grep -l "MiniSearch" app/dist/assets/*.js
app/dist/assets/index-YAyeC_kg.js   # MiniSearch lives here only
```

Main bundle is **102.11 KB gz** — same as Phase 2 baseline (100.48 KB) plus a tiny SearchPanel/Sidebar layer. The +1.6 KB gz comes from Plan 03-01..03-03 components and the new SearchPanel JSX glue (NOT from minisearch — that is fully isolated). Soft budget remains in the same neighborhood we entered Phase 3 with; minisearch isolation worked exactly as designed.

## Security: XSS-Safe Snippet Rendering (T-03-05-01)

`buildSnippet` does NOT return an HTML string. It returns `Array<{type: 'text'|'mark', text: string}>` and SearchPanel renders each segment as a React text node or `<mark>` JSX element. React's normal text path escapes special characters automatically. No `dangerouslySetInnerHTML` anywhere in this plan's files:

```bash
$ grep -l "dangerouslySetInnerHTML" app/src/components/SearchPanel.jsx app/src/components/searchPanel.helpers.js
(no output — both files are clean)
```

Regex injection is also defended: every query term flows through `escapeRegex(s)` before joining into the alternation pattern, escaping all 11 regex metacharacters (`.*+?^${}()|[]\\`). Test 8 confirms this with the literal query `'(see PRD-1)'`, which contains parens that would otherwise create a capture group; the test asserts that the marks are literal substrings of the body.

## Key Behaviors Verified

| Acceptance | Verification |
|-----------|--------------|
| `npm test` passes 46/46 (21 prior + 25 new) | `npm test` exits 0 |
| `npm run build` exits 0 | Vite produced `dist/` with all chunks |
| Main entry chunk is MiniSearch-free | `grep -l MiniSearch app/dist/assets/index-DGeWawbQ.js` → no output |
| MiniSearch in dedicated lazy chunk | `grep -l MiniSearch app/dist/assets/*.js` → only `index-YAyeC_kg.js` |
| No brand color in plan files | `grep "#2c8d4f" app/src/components/SearchPanel.jsx app/src/components/SearchPanel.css` → no matches |
| No XSS surface | `grep "dangerouslySetInnerHTML" app/src/components/SearchPanel.jsx app/src/components/searchPanel.helpers.js` → no matches |
| Stub marker removed | `grep "STUB" app/src/components/SearchPanel.jsx` → no matches |
| Required APIs wired | `grep -q "createPortal\|isSearchHotkey\|buildSnippet\|formatBreadcrumb\|useScrollToAnchor\|scrollToAnchor\|ArrowDown\|ArrowUp\|Escape\|placeholder=\"Search the spec...\"" SearchPanel.jsx` all match |
| CSS variables | `grep "var(--search-result-highlight)\|var(--search-result-active-bg)" SearchPanel.css` matches |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking] Comment text triggered grep verification false-positive**
- **Found during:** Task 2 grep verification gate
- **Issue:** The plan's verify gate runs `! grep -q "dangerouslySetInnerHTML" app/src/components/SearchPanel.jsx` and `! grep -q "dangerouslySetInnerHTML" app/src/components/searchPanel.helpers.js`. My initial implementation included documentation comments stating "NO dangerouslySetInnerHTML — XSS-safe by design" that explicitly named the API to document its absence. The grep gate cannot distinguish documentation from code, so the verify check fired.
- **Fix:** Rephrased two doc comments to use "no raw HTML injection" / "never via raw HTML injection" instead of the literal token. Behavior identical; verification now satisfied.
- **Files modified:** `app/src/components/SearchPanel.jsx` (1 comment line), `app/src/components/searchPanel.helpers.js` (2 comment lines)
- **Commit:** `843257e` (bundled with Task 2)

**2. [Rule 3 — Blocking] Missing project-spec/2026-04-26.md and unbuilt minisearch in worktree**
- **Found during:** First `npm run build` invocation
- **Issue:** The `prebuild` hook calls `build-manifest.mjs` which scans `project-spec/*.md` for ISO-dated files and exits 1 if none found. Worktree was reset to commit `fc0041a` which does not track `2026-04-26.md` (it's an untracked file in the parent repo). Additionally, even though `minisearch@^7.2.0` is declared in `package.json`, the worktree had no `node_modules/` directory at all.
- **Fix:** Copied `2026-04-26.md` from the parent repo into the worktree's `project-spec/` (NOT committed — it's input data outside this plan's scope, and the orchestrator's parent worktree owns it). Ran `npm install minisearch --no-save` to populate `node_modules/`. Build then completed successfully.
- **Files modified:** none committed; transient worktree-only fixture for verification.
- **Commit:** none — the `project-spec/2026-04-26.md` file remains untracked in this worktree, exactly matching its state in the parent repo's working tree (per `git status` at session start).

### Architectural Changes

None — the plan was executed exactly as written.

### Authentication Gates

None.

## Test Count Delta

- **Before this plan:** 21 tests (Phase 2: SchemaTable.helpers + crossLinkPlugin)
- **After this plan:** 46 tests
- **Delta:** +25 tests (8 isSearchHotkey + 11 buildSnippet + 6 formatBreadcrumb)

## Manual UAT Required (browser-only)

These behaviors require the live page and cannot be exercised under `node --test`:

1. **Cmd+K opens** — press `Cmd+K` (macOS) or `Ctrl+K` (Linux/Windows) anywhere on the page; the modal should overlay everything (including the sticky sidebar).
2. **Lazy-load chunk fetch** — open DevTools Network tab BEFORE pressing Cmd+K; confirm the minisearch chunk (`index-YAyeC_kg.js`, ~5.96 KB gz) appears only AFTER first open.
3. **Empty state** — modal opens with empty input; only the input shows; no result list, no placeholder text below.
4. **Type query** — once Plan 03-04 has populated `search-index.json`, typing should produce up to 20 results; H2 results show breadcrumb `PRD-N`; H3 results show `PRD-N.M`; matched terms wrapped in `<mark>` with yellow background.
5. **Keyboard nav** — `ArrowDown` advances active row (highlighted); `ArrowUp` retreats; `Enter` selects; `Esc` closes.
6. **Backdrop dismiss** — clicking the backdrop (outside the white box) closes the modal.
7. **Smooth scroll on select** — selecting a result dismisses the modal and smooth-scrolls the heading into view; URL hash updates to the heading slug.
8. **Mobile** — at viewport ≤480px the modal goes full-width with no border-radius (already verified in Plan 03-01 styling, but exercise the new input/list layout under the new break).
9. **Reduced motion** — `prefers-reduced-motion: reduce` should suppress the 120ms slide-fade animation; modal pops in instantly.

Note: items 4–7 depend on Plan 03-04 producing a non-empty `search-index.json`. With the current empty placeholder index, the modal opens and renders an empty state correctly (verified at the unit-test level + manual smoke during build inspection).

## Self-Check: PASSED

Created files exist:
- `app/src/components/searchPanel.helpers.js` — FOUND
- `app/src/components/searchPanel.helpers.test.js` — FOUND

Modified files exist:
- `app/src/components/SearchPanel.jsx` — FOUND (no longer contains "STUB")
- `app/src/components/SearchPanel.css` — FOUND (contains `.search-result--active`)

Commits exist on branch `worktree-agent-a70c30b39fc7799e6`:
- `e19c78c` — `test(03-05): add failing tests for searchPanel helpers` — FOUND
- `330fe89` — `feat(03-05): implement searchPanel helpers (isSearchHotkey, buildSnippet, formatBreadcrumb)` — FOUND
- `843257e` — `feat(03-05): real SearchPanel with Cmd+K, MiniSearch lazy-load, keyboard nav, scroll-on-select` — FOUND

Verification commands all pass:
- `npm test` → 46 pass / 0 fail
- `npm run build` → exits 0
- `grep -L MiniSearch app/dist/assets/index-DGeWawbQ.js` → main entry MiniSearch-free
- `grep -l MiniSearch app/dist/assets/*.js` → minisearch in dedicated lazy chunk
- `grep dangerouslySetInnerHTML` plan files → 0 matches
- `grep "#2c8d4f"` plan files → 0 matches
- `grep STUB SearchPanel.jsx` → 0 matches
