---
phase: 03-navigation-search
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/src/App.jsx
  - app/src/styles.css
  - package.json
  - package-lock.json
  - app/src/components/Sidebar.jsx
  - app/src/components/Sidebar.css
  - app/src/components/SearchPanel.jsx
  - app/src/components/SearchPanel.css
  - app/src/components/useScrollSpy.js
  - app/src/components/useHashScroll.js
  - app/src/components/useScrollToAnchor.js
  - app/src/search-index.json
  - scripts/build-search-index.mjs
autonomous: true
requirements: [NAV-01, NAV-02, NAV-03, NAV-04, SEA-01, SEA-02, SEA-03]
tags: [layout-shell, scroll-hook, css-custom-properties, parallel-seam, minisearch-dep]

must_haves:
  truths:
    - "Viewer renders the spec identically to Phase 2 — sidebar and search panel stubs are mounted but produce no visible behavior change yet"
    - "App.jsx is wrapped in a sidebar+main layout shell with the search panel mounted via React portal"
    - "minisearch is installed and resolvable; bundle still builds cleanly"
    - "All Wave-2 plans (03-02, 03-03, 03-04, 03-05) have a disjoint implementation file to fill in — none of them needs to touch App.jsx, styles.css, or package.json again"
    - "CSS custom property surface includes 8 new variables for sidebar/search/modal so Phase 4 can re-theme without touching component code"
  artifacts:
    - path: "package.json"
      provides: "minisearch dependency + build-search-index npm script wired into predev/prebuild"
      contains: "minisearch"
    - path: "app/src/App.jsx"
      provides: "Layout shell (aside + main + portal); calls useHashScroll(content); mounts <Sidebar>, <SearchPanel>"
      contains: "Sidebar"
    - path: "app/src/styles.css"
      provides: "Phase 3 CSS custom property surface (sidebar, search modal, search highlight)"
      contains: "--sidebar-bg"
    - path: "app/src/components/Sidebar.jsx"
      provides: "Stub Sidebar component (renders empty <aside>)"
      min_lines: 5
    - path: "app/src/components/Sidebar.css"
      provides: "Layout styles using CSS custom properties; mobile drawer hidden by default"
      contains: "--sidebar-bg"
    - path: "app/src/components/SearchPanel.jsx"
      provides: "Stub SearchPanel component (renders nothing when closed)"
      min_lines: 5
    - path: "app/src/components/SearchPanel.css"
      provides: "Modal overlay structural styles using CSS custom properties"
      contains: "--search-modal-bg"
    - path: "app/src/components/useScrollSpy.js"
      provides: "Stub hook (returns null/empty)"
      min_lines: 5
    - path: "app/src/components/useHashScroll.js"
      provides: "Stub hook (no-op effect)"
      min_lines: 5
    - path: "app/src/components/useScrollToAnchor.js"
      provides: "REAL reusable hook returning scrollToAnchor(id) — extracted from CrossLinkText scroll mechanic"
      min_lines: 15
      exports: ["useScrollToAnchor"]
    - path: "app/src/search-index.json"
      provides: "Empty array placeholder so JSON import resolves; real index built by 03-04"
      contains: "[]"
    - path: "scripts/build-search-index.mjs"
      provides: "Script stub that writes [] to app/src/search-index.json so predev/prebuild hooks succeed"
      min_lines: 10
  key_links:
    - from: "package.json#scripts.predev"
      to: "scripts/build-search-index.mjs"
      via: "predev hook chain"
      pattern: "build-search-index"
    - from: "App.jsx"
      to: "Sidebar.jsx + SearchPanel.jsx + useHashScroll.js"
      via: "imports + JSX mount + hook call"
      pattern: "import.*Sidebar"
    - from: "Sidebar.css + SearchPanel.css"
      to: "styles.css custom properties"
      via: "var(--sidebar-bg) / var(--search-modal-bg) / etc."
      pattern: "var\\(--sidebar"
    - from: "useScrollToAnchor.js"
      to: "DOM heading + browser scroll + history API"
      via: "querySelector + scrollIntoView + history.replaceState"
      pattern: "scrollIntoView"
---

<objective>
Establish the Phase 3 foundation seam: install minisearch, wrap App.jsx in a sidebar+main layout shell that mounts stub Sidebar / SearchPanel components, extract the reusable scroll-to-anchor hook from CrossLinkText, declare the CSS custom property surface for sidebar/search/modal, and wire `scripts/build-search-index.mjs` into the predev/prebuild hooks (as a no-op stub for now). After this plan, Wave 2 can drop in real implementations into disjoint files without touching App.jsx, styles.css, or package.json again.

Purpose: Single-shot foundation so Wave 2 can run 03-02, 03-03, 03-04, 03-05 in parallel with zero file-modification overlap. Mirrors the Phase 2 Plan 01 pattern that successfully enabled four parallel sibling plans.
Output: Layout shell + CSS surface + 4 hook/component stubs + 1 real reusable hook + minisearch installed + build-search-index script wired (stub) + empty search-index.json placeholder.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
@.planning/STATE.md
@.planning/phases/03-navigation-search/03-CONTEXT.md
@.planning/phases/02-rich-rendering/02-01-foundation-SUMMARY.md
@app/src/App.jsx
@app/src/styles.css
@app/src/components/CrossLinkText.jsx
@package.json
@scripts/build-manifest.mjs

<interfaces>
<!-- Existing exports executors will need. Extracted from codebase. -->

From app/src/SpecViewer.jsx (Phase 2):
```js
// SpecViewer is the default export; it does NOT need modification in Phase 3.
// rehype-slug already adds id="prd-1-1-plant-variants" style attributes to every heading.
// Sidebar (03-02) and SearchPanel (03-05) consume those IDs via querySelector.
export default function SpecViewer({ markdown }) { /* ... */ }
```

From app/src/components/CrossLinkText.jsx (Phase 2 — DO NOT modify):
```js
// The scroll mechanic to extract into useScrollToAnchor.js is on lines 66–83:
//   target.scrollIntoView({ behavior: 'smooth', block: 'start' });
//   window.history.replaceState(null, '', '#' + target.id);
// Reuse this exact behavior in the new hook so sidebar clicks (03-02) and
// search-result selection (03-05) feel identical to existing cross-links.
```

From app/src/manifest.json (built by scripts/build-manifest.mjs):
```json
[ { "date": "2026-04-26", "filename": "2026-04-26.md" } ]
```
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Install minisearch + wire build-search-index npm script (no-op stub)</name>
  <files>package.json, package-lock.json, scripts/build-search-index.mjs, app/src/search-index.json</files>
  <read_first>
    - package.json (current scripts + deps; do NOT remove anything)
    - scripts/build-manifest.mjs (mirror its style: shebang, JSDoc header, console.log progress lines, ISO_DATE_RE filter)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-05 MiniSearch, D-06 build-time, D-07 one record per heading)
  </read_first>
  <action>
    1. Run `npm install --save minisearch` from the repo root. This must add `"minisearch": "^7"` (latest 7.x) to `package.json#dependencies` and update `package-lock.json`. Verify the actual resolved version after install.
    2. Add a new npm script entry to `package.json#scripts`: `"build-search-index": "node scripts/build-search-index.mjs"`. Place it adjacent to `"build-manifest"`.
    3. Update `package.json#scripts.predev` to chain manifest then index: `"predev": "node scripts/build-manifest.mjs && node scripts/build-search-index.mjs"`. Same for `prebuild`. (Use the literal `node ... && node ...` form — do NOT call `npm run build-manifest` from inside another script as that adds startup overhead.)
    4. Create `scripts/build-search-index.mjs` as a STUB that satisfies the predev/prebuild hook without doing any real work. Mirror `build-manifest.mjs` style:
       - `#!/usr/bin/env node` shebang
       - JSDoc header naming this as "STUB — Plan 03-04 (Phase 3) replaces this with real spec parsing + MiniSearch index emission"
       - ESM imports for `node:fs`, `node:path`, `node:url`
       - Resolve `OUT_PATH = app/src/search-index.json` relative to the script
       - Write `[]` to OUT_PATH (JSON.stringify with newline trailing)
       - Print one progress line: `build-search-index: wrote stub (empty array) to app/src/search-index.json`
       - Print "STUB — Plan 03-04 will replace this with real index emission"
       - Exit 0
    5. Create `app/src/search-index.json` containing exactly `[]\n` (so the JSON import in 03-05 resolves immediately even before the build script runs in dev mode).
    6. Verify locally: run `node scripts/build-search-index.mjs` and confirm exit 0. Run `npm run build-search-index` and confirm exit 0. Run `npm run build` and confirm exit 0 (manifest + stub-index both run during prebuild).
    Reference: D-05 (MiniSearch over FlexSearch), D-06 (build-time index).
  </action>
  <verify>
    <automated>
      grep -q '"minisearch"' package.json &&
      grep -q '"build-search-index": "node scripts/build-search-index.mjs"' package.json &&
      grep -q 'build-search-index' package.json &&
      test -f scripts/build-search-index.mjs &&
      test -f app/src/search-index.json &&
      node -e "const j=require('./app/src/search-index.json'); if(!Array.isArray(j))process.exit(1)" &&
      node scripts/build-search-index.mjs &&
      npm run build 2>&1 | tail -5
    </automated>
  </verify>
  <acceptance_criteria>
    - `package.json` has `"minisearch": "^7..."` (or `^7.x.x`) under `dependencies` (NOT devDependencies — it ships in the runtime bundle).
    - `package.json#scripts.predev` literal value contains both `build-manifest.mjs` AND `build-search-index.mjs` joined by `&&`.
    - `package.json#scripts.prebuild` literal value contains both scripts joined by `&&`.
    - `package.json#scripts.build-search-index` exists with value `"node scripts/build-search-index.mjs"`.
    - `scripts/build-search-index.mjs` exists, is ≥10 lines, contains the literal string `STUB` in its JSDoc header (so `grep -q STUB scripts/build-search-index.mjs` matches).
    - `app/src/search-index.json` is valid JSON parsing to `[]` (empty array).
    - Running `node scripts/build-search-index.mjs` exits 0.
    - Running `npm run build` exits 0 (full prebuild chain works).
    - `npm test` still exits 0 (Phase 2's 21 tests remain passing — no regression).
  </acceptance_criteria>
  <done>minisearch installed; build-search-index script + search-index.json placeholder + npm script + predev/prebuild chain all wired; full build green; Phase 2 tests still pass.</done>
</task>

<task type="auto">
  <name>Task 2: Create stubs (Sidebar, SearchPanel, useScrollSpy, useHashScroll) + REAL useScrollToAnchor hook</name>
  <files>
    app/src/components/Sidebar.jsx,
    app/src/components/Sidebar.css,
    app/src/components/SearchPanel.jsx,
    app/src/components/SearchPanel.css,
    app/src/components/useScrollSpy.js,
    app/src/components/useHashScroll.js,
    app/src/components/useScrollToAnchor.js
  </files>
  <read_first>
    - app/src/components/CrossLinkText.jsx (lines 66–83 — the exact scroll mechanic to extract)
    - app/src/components/Pre.jsx (existing component file shape: imports + JSDoc + named export)
    - app/src/components/MermaidPre.jsx (existing component-with-CSS pattern)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-17 IntersectionObserver, D-13/D-14 hash scroll on first render, D-20 file shape, D-12 reuse cross-link scroll)
  </read_first>
  <action>
    Create seven files. SIX are stubs (real implementation comes in Wave 2); ONE is a real reusable hook.

    **(A) `app/src/components/useScrollToAnchor.js` — REAL HOOK (used by 03-02 and 03-05 in Wave 2):**
    ```js
    /**
     * useScrollToAnchor — reusable scroll-to-heading mechanism (D-12, D-17).
     *
     * Extracted from CrossLinkText.jsx (Phase 2) so sidebar entries (Plan 03-02)
     * and search results (Plan 03-05) can reuse the same scroll + hash semantics
     * without copying logic. CrossLinkText.jsx itself is intentionally NOT
     * modified in Phase 3 (it owns its broken-link useState branch); this hook
     * just exposes the happy-path scroll mechanic separately.
     *
     * Returns scrollToAnchor(id) — a stable function that:
     *   1. Resolves the heading via document.getElementById(id) (Phase 3 hash format
     *      matches rehype-slug output exactly per D-15, so getElementById is
     *      sufficient; no querySelector prefix-match needed here — sidebar/search
     *      records carry full slug ids).
     *   2. On hit: scrollIntoView({behavior:'smooth', block:'start'}) and
     *      history.replaceState(null,'','#'+id) — replaceState (NOT pushState)
     *      so back-button history is not polluted (mirrors CrossLinkText.jsx).
     *   3. On miss: silently returns false (D-14 unknown-hash handling).
     *
     * Returns true on hit, false on miss, so callers can branch (Plan 03-03's
     * useHashScroll uses the boolean to decide whether to retry on next paint).
     */
    import { useCallback } from 'react';

    export function useScrollToAnchor() {
      return useCallback((id) => {
        if (typeof document === 'undefined' || !id) return false;
        const target = document.getElementById(id);
        if (!target) return false;
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const hash = '#' + id;
        if (typeof window !== 'undefined' && window.location.hash !== hash) {
          window.history.replaceState(null, '', hash);
        }
        return true;
      }, []);
    }
    ```

    **(B) `app/src/components/useScrollSpy.js` — STUB (Plan 03-02 fills in):**
    ```js
    /**
     * useScrollSpy — STUB. Plan 03-02 (Phase 3, NAV-02) replaces this with a
     * real IntersectionObserver-based scroll-spy hook (D-01, D-17).
     *
     * Real signature (per Plan 03-02 contract):
     *   useScrollSpy(headingIds: string[]) -> string | null  // active id
     */
    export function useScrollSpy() {
      return null;
    }
    ```

    **(C) `app/src/components/useHashScroll.js` — STUB (Plan 03-03 fills in):**
    ```js
    /**
     * useHashScroll — STUB. Plan 03-03 (Phase 3, NAV-04) replaces this with a
     * real one-shot effect that resolves location.hash on first content render
     * (D-13, D-14, D-15).
     *
     * Real signature (per Plan 03-03 contract):
     *   useHashScroll(content: string | null) -> void
     *     - When content transitions from null → non-empty string, schedule a
     *       single scroll-to-hash attempt on the next animation frame.
     *     - Silent no-op if hash is empty or matches no element.
     */
    export function useHashScroll(_content) {
      // No-op until Plan 03-03.
    }
    ```

    **(D) `app/src/components/Sidebar.jsx` — STUB (Plan 03-02 fills in):**
    ```jsx
    import './Sidebar.css';

    /**
     * Sidebar — STUB. Plan 03-02 (Phase 3, NAV-01..03) replaces this with the
     * real PRD list, scroll-spy active-state, mobile drawer (D-01..D-04, D-17,
     * D-18). Renders an empty <aside> for now so App.jsx layout is structurally
     * correct.
     */
    export function Sidebar() {
      return <aside className="sidebar" aria-label="PRD navigation" />;
    }
    ```

    **(E) `app/src/components/Sidebar.css` — Layout structure only (no real list styling yet):**
    ```css
    /* Sidebar layout — uses CSS custom properties declared in app/src/styles.css.
     * Plan 03-02 adds the entry list, active-state bar, mobile drawer. */

    .sidebar {
      width: 260px;
      flex-shrink: 0;
      background: var(--sidebar-bg);
      border-right: 1px solid var(--sidebar-border);
      overflow-y: auto;
      position: sticky;
      top: 0;
      align-self: flex-start;
      max-height: 100vh;
      padding: 16px 0;
    }

    /* Mobile drawer pattern (D-02) — hidden by default below 768px.
     * Plan 03-02 adds the hamburger trigger and aria state. */
    @media (max-width: 767px) {
      .sidebar {
        display: none;
      }
      .sidebar[data-drawer-open="true"] {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        bottom: 0;
        z-index: 100;
        width: 80%;
        max-width: 320px;
        box-shadow: 2px 0 8px rgba(0, 0, 0, 0.15);
      }
    }
    ```

    **(F) `app/src/components/SearchPanel.jsx` — STUB (Plan 03-05 fills in):**
    ```jsx
    import './SearchPanel.css';

    /**
     * SearchPanel — STUB. Plan 03-05 (Phase 3, SEA-01, SEA-03) replaces this
     * with the real Cmd/Ctrl+K modal: MiniSearch lazy-load on first open,
     * keyboard navigation (↑↓/Enter/Esc), highlighted snippets, click-outside
     * dismiss (D-08..D-12).
     *
     * Stub renders nothing — the real component decides its own visibility.
     */
    export function SearchPanel() {
      return null;
    }
    ```

    **(G) `app/src/components/SearchPanel.css` — Modal structural styles only:**
    ```css
    /* SearchPanel modal — uses CSS custom properties declared in app/src/styles.css.
     * Plan 03-05 adds the input, results list, highlighting, hover/active states. */

    .search-modal-backdrop {
      position: fixed;
      inset: 0;
      background: var(--search-modal-backdrop);
      z-index: 200;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10vh;
    }

    .search-modal {
      width: 640px;
      max-width: 92vw;
      background: var(--search-modal-bg);
      border: 1px solid var(--search-modal-border);
      border-radius: 8px;
      box-shadow: 0 12px 32px rgba(0, 0, 0, 0.18);
      max-height: 70vh;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    @media (max-width: 480px) {
      .search-modal {
        width: 100vw;
        max-width: none;
        border-radius: 0;
      }
    }
    ```

    Each stub's JSDoc must explicitly name the downstream plan number that owns its real implementation, mirroring the Phase 2 Plan 01 pattern.
  </action>
  <verify>
    <automated>
      test -f app/src/components/useScrollToAnchor.js &&
      test -f app/src/components/useScrollSpy.js &&
      test -f app/src/components/useHashScroll.js &&
      test -f app/src/components/Sidebar.jsx &&
      test -f app/src/components/Sidebar.css &&
      test -f app/src/components/SearchPanel.jsx &&
      test -f app/src/components/SearchPanel.css &&
      grep -q "export function useScrollToAnchor" app/src/components/useScrollToAnchor.js &&
      grep -q "scrollIntoView" app/src/components/useScrollToAnchor.js &&
      grep -q "history.replaceState" app/src/components/useScrollToAnchor.js &&
      grep -q "STUB" app/src/components/useScrollSpy.js &&
      grep -q "STUB" app/src/components/useHashScroll.js &&
      grep -q "STUB" app/src/components/Sidebar.jsx &&
      grep -q "STUB" app/src/components/SearchPanel.jsx &&
      grep -q "var(--sidebar-bg)" app/src/components/Sidebar.css &&
      grep -q "var(--search-modal-bg)" app/src/components/SearchPanel.css
    </automated>
  </verify>
  <acceptance_criteria>
    - All seven files exist at the paths listed.
    - `useScrollToAnchor.js` exports a `useScrollToAnchor` named function returning a memoized callback; the callback contains `scrollIntoView({ behavior: 'smooth', block: 'start' })` AND `history.replaceState(null, '', '#'`.
    - `useScrollToAnchor.js` does NOT contain `console.warn` (broken-link behavior stays in CrossLinkText.jsx; this hook is happy-path only — D-14 silent no-op).
    - `useScrollSpy.js`, `useHashScroll.js`, `Sidebar.jsx`, `SearchPanel.jsx` each contain the literal string `STUB` in their JSDoc header (grep-verifiable).
    - `Sidebar.jsx` exports `Sidebar` (named export) returning JSX with `className="sidebar"`.
    - `SearchPanel.jsx` exports `SearchPanel` (named export); stub returns `null`.
    - `Sidebar.css` references `var(--sidebar-bg)` AND `var(--sidebar-border)`.
    - `SearchPanel.css` references `var(--search-modal-bg)` AND `var(--search-modal-backdrop)` AND `var(--search-modal-border)`.
    - No file references the literal `#2c8d4f` (Phase 4 owns brand) — `grep -E '#2c8d4f' app/src/components/{Sidebar,SearchPanel,useScrollToAnchor,useScrollSpy,useHashScroll}.{jsx,css,js}` returns no matches.
  </acceptance_criteria>
  <done>Seven files committed; one real hook (useScrollToAnchor) and six stubs with downstream-plan annotations. Wave-2 plans now have unambiguous, file-disjoint targets.</done>
</task>

<task type="auto">
  <name>Task 3: Wire App.jsx layout shell + extend styles.css with Phase 3 CSS custom properties</name>
  <files>app/src/App.jsx, app/src/styles.css</files>
  <read_first>
    - app/src/App.jsx (current implementation; Phase 3 wraps it, doesn't replace it)
    - app/src/styles.css (Phase 2 surface — Phase 3 APPENDS, does not modify existing properties)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-04 no header, D-13 hash scroll on content load, D-16 layout shape, D-19 CSS surface)
    - app/src/components/Sidebar.jsx (just created — confirm import path)
    - app/src/components/SearchPanel.jsx (just created)
    - app/src/components/useHashScroll.js (just created — stub hook to call)
  </read_first>
  <action>
    **(A) Modify `app/src/App.jsx`** — Wrap the existing `<main>` block in a sidebar+main layout shell, mount the SearchPanel, and call useHashScroll(content). Preserve everything else (state, error path, header, manifest loading).

    Required structural changes only — do NOT rewrite working code:

    1. Add imports at the top:
       ```js
       import { Sidebar } from './components/Sidebar.jsx';
       import { SearchPanel } from './components/SearchPanel.jsx';
       import { useHashScroll } from './components/useHashScroll.js';
       ```
    2. Inside the component body, after `const newest = manifest[0];`, call:
       ```js
       useHashScroll(content);
       ```
       (The stub is a no-op; Plan 03-03 fills in the real effect.)
    3. Replace the final return (the success path; line 61-71 of current App.jsx) with the layout shell:
       ```jsx
       return (
         <div className="app-shell">
           <Sidebar />
           <main className="app-main">
             <header>
               <small>
                 Viewing: <code>project-spec/{newest?.filename}</code>
               </small>
             </header>
             <SpecViewer markdown={content} />
           </main>
           <SearchPanel />
         </div>
       );
       ```
    4. The error-path return (with `<main>` only) stays unchanged (no need to mount the sidebar when we have nothing to show). Just leave it alone.
    5. D-04: NO sidebar header text. D-16: plain CSS flex (no layout libraries). The `<aside>` lives inside the Sidebar component itself (already in stub); App.jsx only mounts `<Sidebar />`.

    **(B) Append to `app/src/styles.css`** — Add a new `:root` block declaring 8 Phase 3 CSS custom properties + add the `.app-shell` and `.app-main` layout rules. Do NOT modify any existing Phase 2 properties or rules.

    Append after the existing Phase 2 block (which ends at line 43):
    ```css

    /* --- Phase 3 component theming surface (Phase 4 will override these) --- */
    :root {
      /* Sidebar (NAV-01..03, D-03, D-19) */
      --sidebar-bg: #fafbfc;
      --sidebar-border: #e1e4e8;
      --sidebar-text: #24292e;
      --sidebar-text-active: #24292e;
      --sidebar-active-bar: #586069;        /* Phase 4 sets to MacPlants green #2c8d4f */
      --sidebar-hover-bg: #f0f3f5;

      /* Search modal (SEA-01, D-08, D-19) */
      --search-modal-bg: #ffffff;
      --search-modal-backdrop: rgba(27, 31, 35, 0.5);
      --search-modal-border: #d1d5da;

      /* Search results (SEA-03, D-10, D-19) */
      --search-result-highlight: #fff5b1;   /* Phase 4 may override */
      --search-result-active-bg: #f6f8fa;
      --search-result-context: #586069;
    }

    /* --- Phase 3 layout shell (App.jsx) --- */
    /* Override the Phase 1 #root max-width because the shell is the layout now. */
    #root {
      max-width: none;
      margin: 0;
    }

    .app-shell {
      display: flex;
      align-items: flex-start;
      gap: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .app-main {
      flex: 1 1 auto;
      min-width: 0;
      max-width: 960px;
    }

    @media (max-width: 767px) {
      .app-shell {
        gap: 0;
      }
    }
    ```

    Notes:
    - The existing Phase 1 `#root { max-width: 960px; ... }` rule MUST be overridden because the layout shell now owns max-width. Use a second `#root` rule (CSS cascade — later wins) rather than editing line 14-17.
    - 8 new custom properties total (3 sidebar-color, 3 search-modal, 3 search-result, minus the 1 active-bar overlap counted in sidebar). Recount: 6 sidebar + 3 search-modal + 3 search-result = 12. Document the actual number in the SUMMARY.
  </action>
  <verify>
    <automated>
      grep -q "import { Sidebar } from './components/Sidebar.jsx';" app/src/App.jsx &&
      grep -q "import { SearchPanel } from './components/SearchPanel.jsx';" app/src/App.jsx &&
      grep -q "import { useHashScroll } from './components/useHashScroll.js';" app/src/App.jsx &&
      grep -q "useHashScroll(content)" app/src/App.jsx &&
      grep -q '<Sidebar />' app/src/App.jsx &&
      grep -q '<SearchPanel />' app/src/App.jsx &&
      grep -q 'className="app-shell"' app/src/App.jsx &&
      grep -q 'className="app-main"' app/src/App.jsx &&
      grep -q -- '--sidebar-bg' app/src/styles.css &&
      grep -q -- '--sidebar-active-bar' app/src/styles.css &&
      grep -q -- '--search-modal-bg' app/src/styles.css &&
      grep -q -- '--search-modal-backdrop' app/src/styles.css &&
      grep -q -- '--search-result-highlight' app/src/styles.css &&
      grep -q '\.app-shell' app/src/styles.css &&
      grep -q '\.app-main' app/src/styles.css &&
      ! grep -q '#2c8d4f' app/src/styles.css &&
      ! grep -q '#2c8d4f' app/src/App.jsx &&
      cd app && npm run build 2>&1 | tail -3
    </automated>
  </verify>
  <acceptance_criteria>
    - `App.jsx` imports `Sidebar`, `SearchPanel`, `useHashScroll` from the three files Task 2 created.
    - `App.jsx` calls `useHashScroll(content)` exactly once inside the component body, after `const newest = manifest[0];`.
    - `App.jsx` success-path return contains `<div className="app-shell">` wrapping `<Sidebar />`, `<main className="app-main">...{SpecViewer}...</main>`, and `<SearchPanel />` in that order.
    - `App.jsx` error-path return is unchanged (still uses `<main>` directly).
    - `App.jsx` does NOT contain the literal `MacPlants ERP` site-title text (D-04: no header in Phase 3).
    - `app/src/styles.css` contains all of: `--sidebar-bg`, `--sidebar-border`, `--sidebar-text`, `--sidebar-text-active`, `--sidebar-active-bar`, `--sidebar-hover-bg`, `--search-modal-bg`, `--search-modal-backdrop`, `--search-modal-border`, `--search-result-highlight`, `--search-result-active-bg`, `--search-result-context` (12 new variables grep-verifiable).
    - `app/src/styles.css` contains `.app-shell` and `.app-main` rules.
    - `app/src/styles.css` contains a second `#root` rule that nullifies the original `max-width: 960px` (search for `max-width: none` and confirm it is INSIDE a `#root` block declared AFTER line 17).
    - No file modified by Phase 3 contains `#2c8d4f` (verify via grep).
    - `npm run build` exits 0 (no module-resolution errors, no syntax errors). Bundle increase is acceptable (minisearch ~14 KB gz target, but only contributes when imported by 03-05; foundation alone should add <1 KB gz).
    - `npm test` still exits 0 (Phase 2's 21 tests remain green).
  </acceptance_criteria>
  <done>Layout shell mounted; 12 new CSS custom properties declared; build clean; Phase 2 tests still pass; viewer at runtime shows the spec inside a `<main class="app-main">` flanked by an empty `<aside class="sidebar">`. Visible behavior: SAME as Phase 2 (sidebar is empty stub; SearchPanel returns null).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| markdown content → DOM | Trusted (rehype-slug + react-markdown sanitize); Phase 3 only reads heading IDs back out, never injects new HTML |
| URL hash → scroll target | `location.hash` is user-controlled but consumed only via `getElementById` (no querySelector with attribute interpolation); cannot inject CSS/HTML |
| build-search-index.json → bundle | Build-time JSON; trusted because it's emitted by our own script. Plan 03-04 must escape body text appropriately. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-01-01 | Tampering | scripts/build-search-index.mjs (stub) | accept | Stub writes static `[]`; no input parsing. Plan 03-04 will introduce real input handling and own its own threat model. |
| T-03-01-02 | Information Disclosure | app/src/search-index.json placeholder | accept | Empty array; no content yet. |
| T-03-01-03 | Denial of Service | useScrollToAnchor scroll mechanic | accept | Pure DOM API call; getElementById is O(1); no loop or recursion. Cannot be DoSed by malformed hash because miss path returns false silently. |
| T-03-01-04 | Spoofing | useScrollToAnchor history.replaceState | mitigate | Hash is constructed from `target.id` (the resolved DOM element's id, not the input) — not from raw user input. So even if `id` argument were attacker-controlled, the hash written to history matches what's actually in the DOM, preserving URL integrity. |
| T-03-01-05 | Elevation of Privilege | minisearch dependency | accept | Pure-JS library, no DOM access in Plan 01 (not imported yet). Plan 03-05 will lazy-load it; threat reassessed there. |
</threat_model>

<verification>
After Task 3:
- `npm run build` exits 0 with bundle size reported.
- `npm test` exits 0 (21 Phase 2 tests still pass — no regression).
- `grep -c -- '--' app/src/styles.css` ≥ 27 (15 Phase 2 properties + 12 Phase 3 properties; double-dash form catches both `--var` and CSS comments — this is a sanity floor, not a tight count).
- `grep -RE '#2c8d4f' app/src/ scripts/ package.json` returns no matches in Phase 3 files.
- `node -e "require('./app/src/search-index.json')"` exits 0 (valid JSON, importable).
</verification>

<success_criteria>
- minisearch installed and resolvable; predev/prebuild hook chain runs both manifest and index scripts.
- App.jsx wraps SpecViewer in a sidebar+main layout shell with SearchPanel mounted.
- 12 new CSS custom properties declared in styles.css for Phase 3 components.
- 7 new files under app/src/components/ (Sidebar.jsx, Sidebar.css, SearchPanel.jsx, SearchPanel.css, useScrollSpy.js, useHashScroll.js, useScrollToAnchor.js) — 1 real, 6 stubs.
- Build is clean; Phase 2's 21 unit tests still pass.
- Visible runtime behavior is unchanged from Phase 2 (the empty sidebar and null SearchPanel make this Wave-1 plan structurally complete but visually invisible — by design).
- Wave-2 plans 03-02, 03-03, 03-04, 03-05 each own a disjoint implementation file (Sidebar.jsx+useScrollSpy.js / useHashScroll.js / build-search-index.mjs+search-index.json / SearchPanel.jsx) and never need to touch App.jsx, styles.css, or package.json again.
</success_criteria>

<output>
After completion, create `.planning/phases/03-navigation-search/03-01-foundation-SUMMARY.md` documenting:
- minisearch resolved version
- The exact predev/prebuild script chain
- All 12 new CSS custom properties (one bullet each)
- The 6 stubs and 1 real hook
- Bundle size delta vs Phase 2 (98.98 KB gz → ?? KB gz; goal: minimal increase since minisearch is not imported yet)
- Wave-2 file-disjointness confirmation table (mirroring Phase 2 Plan 01's table)
</output>
