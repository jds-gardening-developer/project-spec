---
phase: 03-navigation-search
plan: 05
type: execute
wave: 2
depends_on: [03-01]
files_modified:
  - app/src/components/SearchPanel.jsx
  - app/src/components/SearchPanel.css
  - app/src/components/searchPanel.helpers.js
  - app/src/components/searchPanel.helpers.test.js
autonomous: true
requirements: [SEA-01, SEA-03]
tags: [search-modal, cmd-k, minisearch, lazy-load, keyboard-nav, highlighted-snippets, phase3-search]

must_haves:
  truths:
    - "User can press Cmd+K (macOS) or Ctrl+K (other platforms) and a centered search modal opens with a search input and an empty results list"
    - "User typing in the input executes a MiniSearch query against the build-time index and renders up to 20 results"
    - "Each result line shows: heading text (bold), parent PRD context (small grey, e.g. 'PRD-1 / Plants'), and a 1-line body snippet with matched terms wrapped in <mark>"
    - "User can press ↑/↓ to navigate results, Enter to select the active result, Esc to close the modal; clicking a result also selects it"
    - "Selecting a result dismisses the modal, updates location.hash to the result's id, and smooth-scrolls the heading into view (reuses useScrollToAnchor)"
    - "Clicking the backdrop (outside the modal box) dismisses the modal"
    - "MiniSearch is lazy-loaded — its bundle chunk is NOT in the main entry chunk; first dynamic-import happens on first Cmd+K open"
    - "Empty input shows nothing (no recently-searched, no placeholder list); placeholder text in the input is 'Search the spec...'"
  artifacts:
    - path: "app/src/components/SearchPanel.jsx"
      provides: "Real SearchPanel: Cmd/Ctrl+K trigger, modal with input + results list, keyboard nav, MiniSearch lazy-load, scroll-on-select"
      min_lines: 150
      exports: ["SearchPanel"]
    - path: "app/src/components/SearchPanel.css"
      provides: "Real input styling, results list, hover/active states, snippet/mark styling, mobile full-width modal"
      contains: "var(--search-result-active-bg)"
    - path: "app/src/components/searchPanel.helpers.js"
      provides: "Pure helpers: isSearchHotkey(event), buildSnippet(body, query, maxLen), formatBreadcrumb(prd_id, level)"
      min_lines: 50
      exports: ["isSearchHotkey", "buildSnippet", "formatBreadcrumb"]
    - path: "app/src/components/searchPanel.helpers.test.js"
      provides: "node:test cases for the three pure helpers"
      min_lines: 40
  key_links:
    - from: "SearchPanel.jsx"
      to: "minisearch (npm)"
      via: "dynamic import('minisearch') on first open"
      pattern: "import\\(['\"]minisearch['\"]\\)"
    - from: "SearchPanel.jsx"
      to: "app/src/search-index.json"
      via: "static JSON import"
      pattern: "search-index.json"
    - from: "SearchPanel.jsx select handler"
      to: "useScrollToAnchor"
      via: "scrollToAnchor(record.id) call after closing modal"
      pattern: "scrollToAnchor"
    - from: "SearchPanel.jsx Cmd+K handler"
      to: "window keydown listener"
      via: "addEventListener('keydown', ...) in useEffect"
      pattern: "keydown"
---

<objective>
Replace the Plan 03-01 SearchPanel stub (returning null) with the real Cmd+K modal: keyboard-triggered, MiniSearch-lazy-loaded, keyboard-navigable, with highlighted snippets and select-to-scroll. Closes SEA-01 and SEA-03 (SEA-02 is owned by Plan 03-04, which produces the index this plan consumes).

Purpose: Restores the Docsify-style full-text search the user expects, but as a Cmd+K modal (more familiar than Docsify's inline search) and indexed at build time so first-open is snappy. Must keep MiniSearch out of the main bundle to honor the soft 100 KB gz budget (currently at 100.48 KB after Phase 2).
Output: Real SearchPanel.jsx + SearchPanel.css + pure-JS helpers (with tests). Visual verification at human UAT (keyboard, lazy-load chunks, smooth scroll all browser-only).
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
@.planning/phases/03-navigation-search/03-04-search-index-PLAN.md
@app/src/App.jsx
@app/src/styles.css
@app/src/components/SearchPanel.jsx
@app/src/components/SearchPanel.css
@app/src/components/useScrollToAnchor.js
@app/src/components/MermaidPre.jsx

<interfaces>
<!-- Plan 03-01 mounted <SearchPanel /> in App.jsx already; this plan fills it in. -->

useScrollToAnchor (Plan 03-01 — REUSE, do not modify):
```js
export function useScrollToAnchor(): (id: string) => boolean
//   getElementById(id), scrollIntoView smooth, history.replaceState '#'+id
//   returns true on hit, false on miss
```

search-index.json (Plan 03-04 — consumed via static import):
```json
[
  { "id": "prd-1-plant-database--inventory", "title": "PRD-1: Plant Database & Inventory",
    "prd_id": "prd-1", "level": 2, "body": "..." },
  { "id": "what-is-it", "title": "What Is It", "prd_id": "prd-1", "level": 3, "body": "..." }
]
```

MermaidPre.jsx is the existing dynamic-import precedent in this codebase (Phase 2):
```js
// Module-level singleton promise — initializes once across all instances
let mermaidPromise = null;
function loadMermaid() {
  if (!mermaidPromise) {
    mermaidPromise = import('mermaid').then((mod) => { ... });
  }
  return mermaidPromise;
}
```
SearchPanel mirrors this pattern for MiniSearch — module-level promise, hydrated on first open.

CSS custom properties available (declared by Plan 03-01 in styles.css):
- --search-modal-bg, --search-modal-backdrop, --search-modal-border
- --search-result-highlight, --search-result-active-bg, --search-result-context

Plan 03-01 also declared structural rules:
- .search-modal-backdrop (fixed overlay, flex-center)
- .search-modal (640px box, max-height 70vh, mobile full-width)

This plan adds the input/list/result/snippet/mark rules INSIDE those containers.

D-09 keyboard binding:
- Cmd+K on macOS (event.metaKey + key === 'k')
- Ctrl+K on other platforms (event.ctrlKey + key === 'k')
- Detection: `(event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k'`
- Always preventDefault() to avoid browser conflicts (Chrome's Cmd+K opens search bar in some configs)
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Pure helpers TDD — isSearchHotkey, buildSnippet, formatBreadcrumb</name>
  <files>app/src/components/searchPanel.helpers.js, app/src/components/searchPanel.helpers.test.js</files>
  <read_first>
    - app/src/components/SchemaTable.helpers.js (Phase 2 pure-helper pattern: named exports, no JSX, node:test exercised)
    - app/src/components/SchemaTable.helpers.test.js (Phase 2 test pattern)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-09 keyboard, D-10 result format)
  </read_first>
  <behavior>
    `isSearchHotkey(event)` — returns true when the keydown event matches Cmd+K (macOS) or Ctrl+K (others):
    - Test 1: `{ metaKey: true, key: 'k' }` → true (macOS Cmd+K)
    - Test 2: `{ ctrlKey: true, key: 'k' }` → true (Linux/Windows Ctrl+K)
    - Test 3: `{ metaKey: true, key: 'K' }` → true (case-insensitive — Caps Lock or Shift)
    - Test 4: `{ key: 'k' }` (no modifier) → false (lone 'k' is just typing)
    - Test 5: `{ metaKey: true, key: 'j' }` → false
    - Test 6: `{ shiftKey: true, key: 'k' }` → false (Shift+K is not the binding)
    - Test 7: `{ metaKey: true, ctrlKey: true, key: 'k' }` → true (either modifier alone is enough; both is fine too)
    - Test 8: `null` or `undefined` → false (defensive, no throw)

    `buildSnippet(body, query, maxLen)` — produces a plaintext snippet of ≤ maxLen chars, centered on the first occurrence of any query term, with `<mark>...</mark>` around each matched substring. Used to render the body line under each result.
    - Test 1: body 'The quick brown fox', query 'quick', maxLen 50 → `'The <mark>quick</mark> brown fox'`
    - Test 2: body shorter than maxLen → returned in full with marks
    - Test 3: body much longer than maxLen, query in the middle → snippet windowed around the match with `…` prefix/suffix as needed
    - Test 4: query has multiple terms ('quick brown') → all matched terms wrapped in `<mark>`
    - Test 5: query not found in body → first maxLen chars returned without marks (truncated with `…` if exceeded)
    - Test 6: empty body → empty string
    - Test 7: empty query → first maxLen chars without marks
    - Test 8: query contains regex special chars (e.g. '(see PRD-1)') → escaped before regex (no regex injection); still matches literal text
    - Test 9: case-insensitive matching — query 'QUICK' matches body 'The quick brown fox' (all lowercase variants in body get wrapped, preserving original casing)
    - Test 10: HTML entities in body — escape `<`, `>`, `&` BEFORE inserting `<mark>` so the rendered snippet is safe to inject via dangerouslySetInnerHTML (or render via React fragments — both options viable; pick one and document. RECOMMENDED: do NOT use dangerouslySetInnerHTML; instead return an array of `{type: 'text'|'mark', text}` segments and render via React. This avoids the entire XSS surface. Update test 10 to assert the segments structure instead of the HTML string. Tests for prior cases use the segments structure too.)

    DECISION: buildSnippet returns `Array<{type: 'text'|'mark', text: string}>` — segment-list, not HTML string. SearchPanel.jsx renders `{seg.type === 'mark' ? <mark>{seg.text}</mark> : seg.text}`. Eliminates XSS at the type level.

    Re-cast tests:
    - Test 1: body 'The quick brown fox', query 'quick' → `[{type:'text',text:'The '},{type:'mark',text:'quick'},{type:'text',text:' brown fox'}]`
    - Test 5: query not found → `[{type:'text',text:<truncated body or full body>}]`
    - Test 8: regex chars escaped — query `'(see PRD-1)'` against body `'(see PRD-1) ref'` produces a single mark segment for the literal `(see PRD-1)` substring.

    `formatBreadcrumb(prd_id, level)` — returns the small grey context label per D-10:
    - Test 1: `formatBreadcrumb('prd-1', 2)` → `'PRD-1'` (an H2 IS the PRD section — show just the PRD identifier)
    - Test 2: `formatBreadcrumb('prd-1', 3)` → `'PRD-1 /'` (H3 sub-heading — show parent PRD with separator implying child)
       Hmm — D-10 says "PRD-1 / Plants" — the title 'Plants' is the heading itself, and the breadcrumb is the parent. Re-read: "heading text (bold), parent PRD context (small grey, e.g., 'PRD-1 / Plants')". So the breadcrumb 'PRD-1 / Plants' is constructed in JSX by combining `formatBreadcrumb` (returns 'PRD-1') with the title elsewhere? Or does the breadcrumb include the heading's own title?
       Re-reading: "PRD-1 / Plants" suggests breadcrumb shows the parent's text. For an H3 'Plants' under H2 'PRD-1: Plant Database & Inventory', the breadcrumb under it would be 'PRD-1' (the parent identifier). The 'Plants' part IS the heading text shown bold above. So breadcrumb is just the PRD identifier, not 'PRD-1 / Plants'. The `/` in CONTEXT.md's example might be a misleading visual hint about hierarchy.
       SIMPLEST: formatBreadcrumb returns the prd_id formatted as `'PRD-1'` for both H2 and H3 results. The H2 result happens to have the same heading text as the breadcrumb ('PRD-1: Plant Database & Inventory' and 'PRD-1') — that's fine; the breadcrumb is short context and the heading is the full title.
       Test 1: `formatBreadcrumb('prd-1', 2)` → `'PRD-1'`
       Test 2: `formatBreadcrumb('prd-1-1', 3)` → `'PRD-1.1'` (re-format dashes to dots for the human-readable PRD identifier)
       Test 3: `formatBreadcrumb(null, 1)` → `''` (no breadcrumb for the H1 doc title)
       Test 4: `formatBreadcrumb(null, 2)` → `''` (non-PRD H2 like 'Meeting Action Items' has no breadcrumb)
  </behavior>
  <action>
    1. **RED commit:** Create `app/src/components/searchPanel.helpers.js` with bare named-export stubs (returning empty/falsy values) so the test file can import them. Then create `app/src/components/searchPanel.helpers.test.js` with all three sets of tests above. Run `npm test` — the helper tests fail. Commit: `test(03-05): add failing tests for searchPanel helpers`.

    2. **GREEN commit:** Implement the three helpers in `searchPanel.helpers.js`:

       ```js
       /**
        * searchPanel.helpers — pure JS for the SearchPanel component.
        * Plan 03-05 (Phase 3, SEA-01/SEA-03). Implements D-09 (keyboard) and D-10 (result format).
        *
        * Kept as pure functions so node:test can exercise them without JSDOM.
        */

       export function isSearchHotkey(event) {
         if (!event || typeof event !== 'object') return false;
         if (typeof event.key !== 'string') return false;
         if (event.key.toLowerCase() !== 'k') return false;
         return Boolean(event.metaKey || event.ctrlKey);
       }

       /**
        * formatBreadcrumb(prd_id, level) — small grey context label per D-10.
        * Converts our internal slug ('prd-1-1') back to human PRD identifier ('PRD-1.1').
        * Returns empty string when no breadcrumb is appropriate (H1 doc title, non-PRD H2).
        */
       export function formatBreadcrumb(prd_id, _level) {
         if (typeof prd_id !== 'string' || prd_id.length === 0) return '';
         // 'prd-1-1' → ['prd', '1', '1'] → 'PRD-1.1'
         const m = prd_id.match(/^prd-(\d+)(?:-(\d+))?$/i);
         if (!m) return prd_id.toUpperCase();
         return m[2] ? `PRD-${m[1]}.${m[2]}` : `PRD-${m[1]}`;
       }

       /**
        * buildSnippet(body, query, maxLen) — segment list with <mark> ranges.
        * Returns Array<{type: 'text'|'mark', text: string}>. SearchPanel renders
        * each segment as React text or a <mark> element — no dangerouslySetInnerHTML.
        */
       export function buildSnippet(body, query, maxLen = 160) {
         if (typeof body !== 'string' || body.length === 0) return [];
         const trimmedQuery = (typeof query === 'string') ? query.trim() : '';
         if (trimmedQuery.length === 0) {
           return [{ type: 'text', text: body.length > maxLen ? body.slice(0, maxLen) + '…' : body }];
         }

         // Build case-insensitive regex of all whitespace-split query terms, escaped.
         const terms = trimmedQuery.split(/\s+/).filter(Boolean).map(escapeRegex);
         if (terms.length === 0) {
           return [{ type: 'text', text: body.length > maxLen ? body.slice(0, maxLen) + '…' : body }];
         }
         const re = new RegExp('(' + terms.join('|') + ')', 'gi');

         // Find first match for windowing.
         re.lastIndex = 0;
         const first = re.exec(body);
         let windowStart = 0;
         let windowEnd = body.length;
         let prefix = '';
         let suffix = '';
         if (first && body.length > maxLen) {
           const half = Math.floor(maxLen / 2);
           windowStart = Math.max(0, first.index - half);
           windowEnd = Math.min(body.length, windowStart + maxLen);
           if (windowStart > 0) prefix = '…';
           if (windowEnd < body.length) suffix = '…';
         } else if (!first && body.length > maxLen) {
           windowEnd = maxLen;
           suffix = '…';
         }

         const window_ = body.slice(windowStart, windowEnd);

         // Walk window with re, splitting into text/mark segments.
         const segments = [];
         if (prefix) segments.push({ type: 'text', text: prefix });
         re.lastIndex = 0;
         let cursor = 0;
         let m;
         while ((m = re.exec(window_)) !== null) {
           if (m.index > cursor) {
             segments.push({ type: 'text', text: window_.slice(cursor, m.index) });
           }
           segments.push({ type: 'mark', text: m[0] });
           cursor = m.index + m[0].length;
           if (m[0].length === 0) re.lastIndex++; // avoid infinite loop on zero-width
         }
         if (cursor < window_.length) {
           segments.push({ type: 'text', text: window_.slice(cursor) });
         }
         if (suffix) segments.push({ type: 'text', text: suffix });
         return segments;
       }

       function escapeRegex(s) {
         return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
       }
       ```

       Run `npm test` — all helper tests pass.

       Commit: `feat(03-05): implement searchPanel helpers (isSearchHotkey, buildSnippet, formatBreadcrumb)`.
  </action>
  <verify>
    <automated>
      grep -q "export function isSearchHotkey" app/src/components/searchPanel.helpers.js &&
      grep -q "export function buildSnippet" app/src/components/searchPanel.helpers.js &&
      grep -q "export function formatBreadcrumb" app/src/components/searchPanel.helpers.js &&
      grep -q "metaKey" app/src/components/searchPanel.helpers.js &&
      grep -q "ctrlKey" app/src/components/searchPanel.helpers.js &&
      ! grep -q "dangerouslySetInnerHTML" app/src/components/searchPanel.helpers.js &&
      cd app/.. && npm test 2>&1 | tail -10
    </automated>
  </verify>
  <acceptance_criteria>
    - `searchPanel.helpers.js` exports `isSearchHotkey`, `buildSnippet`, `formatBreadcrumb` as named functions.
    - `isSearchHotkey` checks both `metaKey` AND `ctrlKey`, AND `key.toLowerCase() === 'k'`.
    - `buildSnippet` does NOT return an HTML string and does NOT contain `dangerouslySetInnerHTML` anywhere in the file (XSS-safe by design).
    - `buildSnippet` escapes regex special chars in query terms before constructing the regex.
    - `formatBreadcrumb` converts `'prd-1-1'` → `'PRD-1.1'` (dashes → dots, uppercase PRD).
    - `npm test` exits 0 with all new tests passing alongside Phase 2's 21.
  </acceptance_criteria>
  <done>Three pure helpers tested and green. SearchPanel.jsx (Task 2) consumes them.</done>
</task>

<task type="auto">
  <name>Task 2: Real SearchPanel component (Cmd+K modal, MiniSearch lazy-load, keyboard nav, scroll-on-select)</name>
  <files>app/src/components/SearchPanel.jsx, app/src/components/SearchPanel.css</files>
  <read_first>
    - app/src/components/SearchPanel.jsx (current Plan 03-01 stub returning null — replace it)
    - app/src/components/SearchPanel.css (current Plan 03-01 modal/backdrop layout — extend with input/list/result rules)
    - app/src/components/searchPanel.helpers.js (just made real in Task 1)
    - app/src/components/MermaidPre.jsx (existing dynamic-import precedent — module-level promise singleton, securityLevel pattern)
    - app/src/components/useScrollToAnchor.js (Plan 03-01 real hook)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-08 modal shape, D-09 keyboard, D-10 result format, D-11 empty state, D-12 selection behavior)
    - app/src/search-index.json (Plan 03-04 output)
  </read_first>
  <action>
    Replace `app/src/components/SearchPanel.jsx` (the Plan 03-01 stub returning `null`) with the full implementation. Extend `app/src/components/SearchPanel.css` with the input/list/result/mark/active styles.

    **`SearchPanel.jsx` requirements (D-08..D-12, D-19):**

    1. **Imports:**
       ```js
       import { useState, useEffect, useRef, useCallback } from 'react';
       import { createPortal } from 'react-dom';
       import searchIndexData from '../search-index.json';
       import { isSearchHotkey, buildSnippet, formatBreadcrumb } from './searchPanel.helpers.js';
       import { useScrollToAnchor } from './useScrollToAnchor.js';
       import './SearchPanel.css';
       ```

    2. **Module-level MiniSearch hydration singleton (mirrors MermaidPre.jsx pattern):**
       ```js
       let miniSearchPromise = null;
       function loadMiniSearch() {
         if (!miniSearchPromise) {
           miniSearchPromise = import('minisearch').then((mod) => {
             const MiniSearch = mod.default || mod;
             const ms = new MiniSearch({
               idField: 'id',
               fields: ['title', 'body', 'prd_id'],   // searchable
               storeFields: ['id', 'title', 'prd_id', 'level', 'body'], // returned in results
               searchOptions: {
                 boost: { title: 3, prd_id: 2, body: 1 },
                 prefix: true,
                 fuzzy: 0.2,
               },
             });
             ms.addAll(searchIndexData);
             return ms;
           });
         }
         return miniSearchPromise;
       }
       ```
       Critical: this must NOT be called at module top-level. Only invoked from inside the open() handler. Vite splits `import('minisearch')` into a separate chunk; main bundle stays minisearch-free until first open.

    3. **Component state:**
       - `open` (boolean) — modal visibility
       - `query` (string) — current search input
       - `results` (array) — current search results (max 20)
       - `activeIndex` (number) — keyboard-nav cursor (0-based; -1 when no results)
       - `miniSearch` (object | null) — hydrated instance after first open

    4. **Global Cmd+K listener (useEffect):**
       ```js
       useEffect(() => {
         const onKey = (event) => {
           if (isSearchHotkey(event)) {
             event.preventDefault();
             setOpen(true);
           }
         };
         window.addEventListener('keydown', onKey);
         return () => window.removeEventListener('keydown', onKey);
       }, []);
       ```

    5. **Lazy-load on first open (useEffect on `open`):**
       When `open` flips to true and `miniSearch` is null, call `loadMiniSearch()` and `setMiniSearch(ms)` once resolved.

    6. **Search effect (useEffect on `query, miniSearch`):**
       - Empty query → `setResults([])` (D-11 empty state).
       - Otherwise → `miniSearch?.search(query, { prefix: true, fuzzy: 0.2 }).slice(0, 20)`.

    7. **Modal-scoped keyboard handlers (input onKeyDown):**
       - `Escape` → close().
       - `ArrowDown` → activeIndex = Math.min(activeIndex + 1, results.length - 1); preventDefault to keep input cursor still.
       - `ArrowUp` → activeIndex = Math.max(activeIndex - 1, 0); preventDefault.
       - `Enter` → select(results[activeIndex]).
       - Reset activeIndex to 0 whenever results change.

    8. **Selection handler (D-12):**
       ```js
       const scrollToAnchor = useScrollToAnchor();
       const select = useCallback((record) => {
         if (!record) return;
         setOpen(false);
         setQuery('');
         // Wait one paint cycle so the modal unmounts before scrolling
         requestAnimationFrame(() => {
           scrollToAnchor(record.id);
         });
       }, [scrollToAnchor]);
       ```

    9. **Render via React portal to document.body** (D-08 — modal must render above everything else, including the sticky sidebar):
       ```jsx
       if (!open) return null;
       return createPortal(
         <div className="search-modal-backdrop" onClick={close} role="presentation">
           <div className="search-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Search the spec">
             <input
               type="search"
               className="search-modal-input"
               placeholder="Search the spec..."
               value={query}
               onChange={(e) => setQuery(e.target.value)}
               onKeyDown={onInputKeyDown}
               autoFocus
               aria-label="Search query"
             />
             <ul className="search-results" role="listbox">
               {results.map((r, i) => (
                 <li
                   key={r.id}
                   className={'search-result' + (i === activeIndex ? ' search-result--active' : '')}
                   onClick={() => select(r)}
                   onMouseEnter={() => setActiveIndex(i)}
                   role="option"
                   aria-selected={i === activeIndex}
                 >
                   <div className="search-result-title">{r.title}</div>
                   {formatBreadcrumb(r.prd_id, r.level) && (
                     <div className="search-result-context">{formatBreadcrumb(r.prd_id, r.level)}</div>
                   )}
                   <div className="search-result-snippet">
                     {buildSnippet(r.body, query, 160).map((seg, j) =>
                       seg.type === 'mark' ? <mark key={j}>{seg.text}</mark> : <span key={j}>{seg.text}</span>
                     )}
                   </div>
                 </li>
               ))}
             </ul>
           </div>
         </div>,
         document.body
       );
       ```

    10. **Empty state (D-11):** When `query === ''`, render only the input — the `<ul>` is empty (or omit entirely). NO "recently-searched", NO "search the spec" placeholder list. The input's `placeholder="Search the spec..."` is the only ambient text.

    11. **Backdrop dismiss (D-08):** Click on `.search-modal-backdrop` triggers close. The inner `.search-modal` calls `e.stopPropagation()` to prevent inside-clicks from bubbling.

    12. **Body scroll lock when open** (UX polish, optional — document choice):
        ```js
        useEffect(() => {
          if (!open) return;
          const prev = document.body.style.overflow;
          document.body.style.overflow = 'hidden';
          return () => { document.body.style.overflow = prev; };
        }, [open]);
        ```

    13. **MUST NOT contain:** `#2c8d4f` (Phase 4 owns brand). Active result uses `var(--search-result-active-bg)`. Highlighted matches (`<mark>`) use `var(--search-result-highlight)` (already declared by Plan 03-01).

    **`SearchPanel.css` additions** (extend the Plan 03-01 layout block with input/list/result rules):

    ```css
    /* Plan 03-05: input, results list, result rows, snippet, mark */

    .search-modal-input {
      width: 100%;
      box-sizing: border-box;
      padding: 14px 18px;
      font-size: 16px;
      border: none;
      border-bottom: 1px solid var(--search-modal-border);
      outline: none;
      background: transparent;
      color: inherit;
    }

    .search-results {
      list-style: none;
      margin: 0;
      padding: 4px 0;
      overflow-y: auto;
      flex: 1 1 auto;
    }

    .search-result {
      padding: 8px 18px;
      cursor: pointer;
      border-left: 3px solid transparent;
    }
    .search-result--active {
      background: var(--search-result-active-bg);
      border-left-color: var(--sidebar-active-bar);
    }

    .search-result-title {
      font-weight: 600;
      font-size: 14px;
      line-height: 1.3;
    }

    .search-result-context {
      font-size: 12px;
      color: var(--search-result-context);
      margin-top: 2px;
    }

    .search-result-snippet {
      font-size: 13px;
      color: var(--search-result-context);
      margin-top: 4px;
      line-height: 1.45;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
    }

    .search-result-snippet mark {
      background: var(--search-result-highlight);
      color: inherit;
      padding: 0 2px;
      border-radius: 2px;
    }

    @media (prefers-reduced-motion: no-preference) {
      .search-modal {
        animation: search-modal-in 120ms ease-out;
      }
    }
    @keyframes search-modal-in {
      from { transform: translateY(-8px); opacity: 0.7; }
      to   { transform: translateY(0); opacity: 1; }
    }
    ```

    Reference: D-08 (modal shape), D-09 (keyboard), D-10 (result format), D-11 (empty), D-12 (selection), D-19 (CSS variables — no brand color).
  </action>
  <verify>
    <automated>
      ! grep -q "STUB" app/src/components/SearchPanel.jsx &&
      grep -q "import('minisearch')" app/src/components/SearchPanel.jsx &&
      grep -q "createPortal" app/src/components/SearchPanel.jsx &&
      grep -q "isSearchHotkey" app/src/components/SearchPanel.jsx &&
      grep -q "buildSnippet" app/src/components/SearchPanel.jsx &&
      grep -q "formatBreadcrumb" app/src/components/SearchPanel.jsx &&
      grep -q "useScrollToAnchor" app/src/components/SearchPanel.jsx &&
      grep -q "scrollToAnchor" app/src/components/SearchPanel.jsx &&
      grep -q 'placeholder="Search the spec..."' app/src/components/SearchPanel.jsx &&
      grep -q "ArrowDown" app/src/components/SearchPanel.jsx &&
      grep -q "ArrowUp" app/src/components/SearchPanel.jsx &&
      grep -q "Escape" app/src/components/SearchPanel.jsx &&
      grep -q "search-result--active" app/src/components/SearchPanel.jsx &&
      grep -q "search-result--active" app/src/components/SearchPanel.css &&
      grep -q "var(--search-result-highlight)" app/src/components/SearchPanel.css &&
      ! grep -q "#2c8d4f" app/src/components/SearchPanel.jsx &&
      ! grep -q "#2c8d4f" app/src/components/SearchPanel.css &&
      ! grep -q "dangerouslySetInnerHTML" app/src/components/SearchPanel.jsx &&
      cd app/.. && npm run build 2>&1 | tail -5 &&
      ls app/dist/assets/ | grep -E 'minisearch|MiniSearch' &&
      ! grep -lE 'MiniSearch' app/dist/assets/index-*.js
    </automated>
  </verify>
  <acceptance_criteria>
    - `SearchPanel.jsx` no longer contains the literal string `STUB`.
    - `SearchPanel.jsx` contains a literal `import('minisearch')` (dynamic import — Vite splits this into a separate chunk).
    - `SearchPanel.jsx` imports and uses `createPortal` from `react-dom`.
    - `SearchPanel.jsx` imports `searchIndexData` from `../search-index.json` (static JSON import — produced by Plan 03-04).
    - `SearchPanel.jsx` calls `isSearchHotkey`, `buildSnippet`, `formatBreadcrumb` from `./searchPanel.helpers.js`.
    - `SearchPanel.jsx` contains a global `window.addEventListener('keydown', ...)` that calls `event.preventDefault()` AND `setOpen(true)` when isSearchHotkey returns true.
    - `SearchPanel.jsx` handles `Escape`, `ArrowUp`, `ArrowDown`, `Enter` keys on the input.
    - `SearchPanel.jsx` placeholder text is the literal string `"Search the spec..."`.
    - `SearchPanel.jsx` does NOT contain `dangerouslySetInnerHTML` (XSS-safe via segment rendering).
    - `SearchPanel.jsx` does NOT contain `#2c8d4f`.
    - `SearchPanel.css` contains rules for `.search-modal-input`, `.search-result`, `.search-result--active`, `.search-result-snippet`, `.search-result-snippet mark`.
    - `SearchPanel.css` references `var(--search-result-highlight)` and `var(--search-result-active-bg)`.
    - `SearchPanel.css` does NOT contain `#2c8d4f`.
    - `npm run build` exits 0 (full Vite build).
    - After build, a chunk file matching `*minisearch*` or `*MiniSearch*` (Vite-named chunk for the dynamic import) exists under `app/dist/assets/` — proving lazy-load chunk separation. Vite typically names this chunk by its export name; an alternate verification is `grep -RE "MiniSearch|minisearch" app/dist/assets/ | grep -v index-` returning at least one match in a non-entry chunk.
    - The entry chunk (`app/dist/assets/index-*.js`) does NOT contain the string `MiniSearch` (the class name) — proving minisearch is NOT bundled into the main entry. (Use grep with `-l` to list files; main entry MUST NOT match.)
    - `npm test` still exits 0 (Phase 2 + Plan 03-01..03-04 helpers all green).
  </acceptance_criteria>
  <done>SearchPanel is real: Cmd+K opens the modal, MiniSearch lazy-loads on first open, results show heading + breadcrumb + highlighted snippet, keyboard nav works, selection scrolls to heading via the same useScrollToAnchor hook used by the sidebar. Visual + interactive verification at human UAT. SEA-01 + SEA-03 fully wired.</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| user query → MiniSearch | User-controlled input; MiniSearch tokenizes and matches; no eval |
| body text + query → snippet | buildSnippet escapes regex special chars; returns segment list (no HTML string); rendered via React text — XSS-safe |
| record.id → scroll target | record.id comes from the build-time index, not user input; safe to pass to getElementById |
| dynamic import → minisearch chunk | Vite resolves to a static chunk path at build time; no user-controlled URL |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-05-01 | Tampering | buildSnippet output | mitigate | Returns Array<{type, text}> — segment list, NOT an HTML string. SearchPanel renders via React's normal text path; <mark> elements are React nodes, not parsed HTML. Eliminates XSS at the type level. (Verifiable: grep -q dangerouslySetInnerHTML returns no matches in any Phase 3 file.) |
| T-03-05-02 | Information Disclosure | search-index.json contents | accept | All indexed text is already public on the deployed site. No PII. |
| T-03-05-03 | Denial of Service | regex from query terms | mitigate | escapeRegex() escapes all 11 regex special chars before constructing the alternation; no catastrophic backtracking possible (no nested quantifiers). Body capped at 800 chars by Plan 03-04 (BODY_MAX_CHARS). Window slicing in buildSnippet is O(n). MiniSearch tokenizes input deterministically. |
| T-03-05-04 | Spoofing | Cmd+K listener | accept | Listener calls preventDefault() so browser-native Cmd+K (where it exists) is replaced by our modal — intentional UX, not a spoofing concern. |
| T-03-05-05 | Elevation of Privilege | dynamic import('minisearch') | accept | Vite resolves the import path at build time; no user-controlled URL. The minisearch package is pinned in package.json; supply chain risk equivalent to any other npm dependency. |
| T-03-05-06 | Information Disclosure | autoFocus on modal input | accept | Standard pattern; no covert data capture. |
</threat_model>

<verification>
- `npm test` exits 0 with all helper tests passing.
- `npm run build` exits 0; bundle inspection confirms minisearch is in a separate chunk (NOT in the index-*.js entry chunk).
- `grep -RE '#2c8d4f' app/src/components/SearchPanel.{jsx,css} app/src/components/searchPanel.helpers.js` returns no matches.
- `grep -q dangerouslySetInnerHTML app/src/components/SearchPanel.jsx` returns no match (XSS-safe).
- Stub markers removed.
</verification>

<success_criteria>
- SEA-01: Cmd+K (macOS) / Ctrl+K (other) opens search panel overlay.
- SEA-03: User can click any search result to dismiss the panel and scroll to that section.
- D-08: Modal centered, ~640px desktop, full-width mobile, click-outside dismisses.
- D-09: Esc closes, ↑/↓ navigate, Enter selects.
- D-10: Each result shows heading text (bold) + parent PRD breadcrumb (small grey) + 1-line snippet with `<mark>` highlights.
- D-11: Empty input → empty results list (no placeholder list, no recently-searched).
- D-12: Selection updates location.hash via useScrollToAnchor + smooth scroll.
- MiniSearch lazy-loaded — entry chunk does NOT contain MiniSearch class string.
- Phase 4 boundary intact: NO `#2c8d4f` in any file modified by this plan.
- File-disjointness: this plan touches only SearchPanel.jsx + SearchPanel.css + searchPanel.helpers.{js,test.js}. No conflict with sibling wave-2 plans.
</success_criteria>

<output>
After completion, create `.planning/phases/03-navigation-search/03-05-search-panel-SUMMARY.md` documenting:
- Test count delta after this plan.
- Bundle size delta (entry chunk: ?? KB gz; minisearch chunk: ?? KB gz).
- Confirmation that `index-*.js` is MiniSearch-free (grep verification).
- D-08..D-12 mapping to specific code locations (line numbers + file).
- Selection-flow trace: Cmd+K → setOpen(true) → useEffect → loadMiniSearch() → ms.addAll(searchIndexData) → user types → ms.search(q) → results → keyboard nav → select() → setOpen(false) → rAF → scrollToAnchor(id) → DOM scroll.
- Confirmation that no `dangerouslySetInnerHTML` is used (XSS-safe via segment list pattern).
</output>
