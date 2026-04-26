---
phase: 03-navigation-search
plan: 03
type: execute
wave: 2
depends_on: [03-01]
files_modified:
  - app/src/components/useHashScroll.js
  - app/src/components/useHashScroll.test.js
autonomous: true
requirements: [NAV-04]
tags: [hash-deeplink, initial-load, useEffect-once, silent-no-op, phase3-nav]

must_haves:
  truths:
    - "User can paste a deep link like /#/prd-1.1 (or /#prd-1) into a fresh tab and the viewer scrolls to that section once content has rendered"
    - "Unknown hashes are silently ignored — no error banner, no console warning, no URL alteration (D-14 conservative behavior)"
    - "The hash effect fires exactly once per content load (no infinite loop, no re-fire on subsequent renders)"
    - "Browser-native hashchange events continue to work (Phase 2 cross-links + Plan 03-02 sidebar clicks already update location.hash via history.replaceState; no extra wiring needed)"
  artifacts:
    - path: "app/src/components/useHashScroll.js"
      provides: "Real one-shot hash-scroll effect: when content transitions from null/empty to non-empty string, schedule a single scrollIntoView attempt on the next animation frame; silent on miss"
      min_lines: 30
      exports: ["useHashScroll"]
    - path: "app/src/components/useHashScroll.test.js"
      provides: "node:test cases for the pure helper that parses location.hash into a candidate id; hook integration verified at human-UAT (requires a real browser)"
      min_lines: 30
  key_links:
    - from: "App.jsx (already wired by 03-01)"
      to: "useHashScroll.js"
      via: "useHashScroll(content) call inside App component"
      pattern: "useHashScroll\\(content\\)"
    - from: "useHashScroll.js"
      to: "useScrollToAnchor.js"
      via: "import + invoke scrollToAnchor with hash-derived id"
      pattern: "useScrollToAnchor"
    - from: "useHashScroll.js"
      to: "rehype-slug heading IDs"
      via: "document.getElementById(id) inside scrollToAnchor"
      pattern: "scrollToAnchor"
---

<objective>
Replace the Plan 03-01 useHashScroll stub with a real one-shot effect that consumes `location.hash` on first content render. When the user opens `localhost:5173/#prd-1-1` in a fresh tab, the viewer must scroll to the matching heading once SpecViewer has committed its DOM. Closes NAV-04.

Purpose: Phase 2 cross-links and Plan 03-02 sidebar clicks already WRITE the hash via `history.replaceState`. This plan is the missing READ side: consume the hash on initial page load so deep links shared between users (or bookmarks) land in the right place.
Output: Real useHashScroll hook + test for the pure parser. Hook integration tested in browser UAT (requires real `location` + DOM).
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
@app/src/components/useHashScroll.js
@app/src/components/useScrollToAnchor.js
@app/src/components/CrossLinkText.jsx

<interfaces>
<!-- App.jsx already calls useHashScroll(content) — Plan 03-01 wired the call site. -->

useScrollToAnchor (Plan 03-01 — REUSE, do not modify):
```js
// app/src/components/useScrollToAnchor.js
export function useScrollToAnchor(): (id: string) => boolean
//   - getElementById(id), scrollIntoView smooth, history.replaceState '#'+id
//   - returns true on hit, false on miss
//   - silent on miss (D-14)
```

App.jsx call site (already in place from Plan 03-01):
```jsx
const newest = manifest[0];
useHashScroll(content);  // ← this is the call this plan must make REAL
useEffect(() => { /* loads content */ }, [newest]);
```

Hash format from Phase 2 (CrossLinkText.jsx + rehype-slug):
- Cross-link writes: `#prd-1-1` (PRD identifier portion only — uses prefix match on click)
- rehype-slug heading id: `prd-1-1-plant-variants` (full slug)
- D-15 explicitly notes the format match — initial-load handler must do prefix-match like CrossLinkText does, OR full-id match if the URL contains the full slug

Decision for this plan (mirrors CrossLinkText behavior):
- If `location.hash === '#prd-1-1'` (PRD prefix), use `document.querySelector('[id^="prd-1-1"]')` — match.
- If `location.hash === '#prd-1-1-plant-variants'` (full slug), `document.getElementById('prd-1-1-plant-variants')` works.
- Strategy: try `getElementById` first (full slug); if miss, try `querySelector('[id^="..."]')` for the prefix.
- BUT useScrollToAnchor only does getElementById. Two options:
  (A) Extend useScrollToAnchor to optionally accept a "prefix-match" flag.
  (B) Do the prefix-match resolution INSIDE useHashScroll, then call scrollToAnchor with the full id.
- Pick (B) — keeps useScrollToAnchor simple and aligned with its name (an "anchor" is a full id). useHashScroll owns the hash-format heuristics.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Real useHashScroll hook (TDD: pure helper RED → GREEN; effect verified at UAT)</name>
  <files>app/src/components/useHashScroll.js, app/src/components/useHashScroll.test.js</files>
  <read_first>
    - app/src/components/useHashScroll.js (current Plan 03-01 stub — replace it)
    - app/src/components/useScrollToAnchor.js (Plan 03-01 real hook — reuse, do not modify)
    - app/src/components/CrossLinkText.jsx (line 69 — `[id^="${prdId}"]` prefix-match pattern; mirror this)
    - .planning/phases/03-navigation-search/03-CONTEXT.md (D-13 first content render trigger, D-14 silent unknown-hash, D-15 rehype-slug format match)
    - app/src/App.jsx (already calls `useHashScroll(content)`; do not modify)
  </read_first>
  <behavior>
    Pure helper `parseHashToId(hash)` extracts the candidate id from location.hash, normalizing common formats:

    - Test 1: `'#prd-1'` → returns `'prd-1'`
    - Test 2: `'#prd-1-1'` → returns `'prd-1-1'`
    - Test 3: `'#/prd-1-1'` → returns `'prd-1-1'` (strip leading `/` if present — Docsify-style hashes the user might paste from bookmarks)
    - Test 4: `''` (empty hash) → returns `null`
    - Test 5: `'#'` (just the marker) → returns `null`
    - Test 6: `null` (no location) → returns `null`
    - Test 7: `'#some-other-anchor'` → returns `'some-other-anchor'` (still attempt resolution; D-14 silent miss handles it if not found)
    - Test 8: `'#prd-1?query=foo'` (defensive — query in hash) → returns `'prd-1'` (strip from `?` onward)
    - Test 9: `'#prd-1 '` (trailing whitespace) → returns `'prd-1'`
    - Test 10: `'#PRD-1'` (uppercase — rehype-slug always lowercases, so this should miss; do NOT lowercase here, let getElementById return null and silent no-op kick in) → returns `'PRD-1'`
  </behavior>
  <action>
    1. **RED commit:** Create `app/src/components/useHashScroll.test.js` with the 10 test cases for `parseHashToId`. Use Phase 2 pattern (`node:test` + `node:assert/strict`). Import `parseHashToId` as a named export from `./useHashScroll.js`. Run `npm test` — the new tests fail (the stub does not export `parseHashToId`). Commit: `test(03-03): add failing tests for parseHashToId helper`.

    2. **GREEN commit:** Replace `app/src/components/useHashScroll.js` (the Plan 03-01 stub) with the real implementation:

       ```js
       /**
        * useHashScroll — consume location.hash on first content render (NAV-04).
        *
        * Plan 03-03 of Phase 3. Implements CONTEXT.md D-13, D-14, D-15.
        *
        * Behavior:
        *   - When `content` transitions from null/empty → non-empty string AND a hash
        *     is present in the URL, schedule a single scrollIntoView attempt on the
        *     next animation frame (after react-markdown commits its DOM).
        *   - Two resolution strategies (mirrors CrossLinkText.jsx D-05 pattern):
        *       1. document.getElementById(id) — full slug match
        *       2. document.querySelector(`[id^="${id}"]`) — prefix match for PRD-only
        *          hashes like #prd-1-1 (rehype-slug emits #prd-1-1-plant-variants)
        *   - On miss: silently do nothing (D-14). No console warn, no URL alteration.
        *   - Re-fires only when `content` itself transitions (not on every render).
        *     Implementation: `useRef` flag set after first successful run for a given
        *     content value.
        *
        * Why animation frame instead of setTimeout(0):
        *   - rAF runs after layout but before paint of the next frame. setTimeout(0)
        *     can fire BEFORE rehype-slug ids are committed in StrictMode double-render.
        *   - rAF is the documented React-friendly "wait for DOM" primitive.
        *
        * Why ONE attempt (no retries):
        *   - The content prop transition gates the effect — if SpecViewer commits late
        *     (which it doesn't; markdown is synchronous), `content` won't have flipped
        *     to non-empty yet, so the effect won't fire prematurely.
        *   - Simpler than retry-with-backoff; D-14 silent miss is the safety net.
        */
       import { useEffect, useRef } from 'react';

       export function parseHashToId(hash) {
         if (typeof hash !== 'string' || hash.length === 0) return null;
         let id = hash.startsWith('#') ? hash.slice(1) : hash;
         if (id.startsWith('/')) id = id.slice(1);
         // Strip query/whitespace defensively
         const qIdx = id.indexOf('?');
         if (qIdx >= 0) id = id.slice(0, qIdx);
         id = id.trim();
         return id.length > 0 ? id : null;
       }

       function resolveHeading(id) {
         if (typeof document === 'undefined' || !id) return null;
         const direct = document.getElementById(id);
         if (direct) return direct;
         // Prefix match for PRD-only hashes (e.g. #prd-1-1 → prd-1-1-plant-variants)
         // CSS.escape guards against malformed ids; fall back to no-op on error.
         try {
           const escaped = (typeof CSS !== 'undefined' && CSS.escape) ? CSS.escape(id) : id;
           return document.querySelector(`[id^="${escaped}"]`);
         } catch {
           return null;
         }
       }

       export function useHashScroll(content) {
         const consumedRef = useRef(false);

         useEffect(() => {
           // Fire once per content transition. If content hasn't loaded yet (null/empty), wait.
           if (typeof content !== 'string' || content.length === 0) {
             consumedRef.current = false; // reset so a new content load re-triggers
             return;
           }
           if (consumedRef.current) return; // already handled this content
           consumedRef.current = true;

           if (typeof window === 'undefined') return;
           const id = parseHashToId(window.location.hash);
           if (!id) return;

           // Wait for SpecViewer's DOM to be committed before resolving.
           const rafId = window.requestAnimationFrame(() => {
             const target = resolveHeading(id);
             if (!target) return; // D-14 silent no-op on unknown hash
             target.scrollIntoView({ behavior: 'smooth', block: 'start' });
             // Note: do NOT alter location.hash — preserve the user's deep link verbatim
             // so they can copy/share the URL and a refresh re-triggers the same scroll.
           });

           return () => window.cancelAnimationFrame(rafId);
         }, [content]);
       }
       ```

       Run `npm test` — all 10 helper tests pass. Hook integration is verified at UAT (real browser, real location.hash, real getElementById against rehype-slug-emitted IDs).

       Commit: `feat(03-03): implement useHashScroll one-shot hash deep-link consumer`.

    Reference: D-13 (first content render trigger), D-14 (silent unknown-hash), D-15 (rehype-slug format match — already in DOM from Phase 2).

    **Note on `useScrollToAnchor` reuse:** This hook intentionally does NOT call `useScrollToAnchor` because:
      (a) useScrollToAnchor only does getElementById, but useHashScroll needs prefix-match fallback like CrossLinkText.
      (b) useScrollToAnchor mutates location.hash via replaceState, but D-14 implies preserving the user's deep-link-as-typed (a refresh should still scroll the same way).
    The two hooks share intent but have different shapes. Document this in the SUMMARY so the Phase 3 verifier doesn't flag the apparent duplication.
  </action>
  <verify>
    <automated>
      grep -q "export function parseHashToId" app/src/components/useHashScroll.js &&
      grep -q "export function useHashScroll" app/src/components/useHashScroll.js &&
      grep -q "requestAnimationFrame" app/src/components/useHashScroll.js &&
      grep -q "useRef" app/src/components/useHashScroll.js &&
      grep -q 'id\^="' app/src/components/useHashScroll.js &&
      ! grep -q "STUB" app/src/components/useHashScroll.js &&
      ! grep -q "console.warn" app/src/components/useHashScroll.js &&
      cd app/.. && npm test 2>&1 | tail -10 &&
      npm run build 2>&1 | tail -3
    </automated>
  </verify>
  <acceptance_criteria>
    - `useHashScroll.js` no longer contains the literal string `STUB`.
    - `useHashScroll.js` exports both `parseHashToId` and `useHashScroll` as named exports.
    - `useHashScroll.js` references `requestAnimationFrame` (NOT `setTimeout(0)` — see D-13 timing note).
    - `useHashScroll.js` uses `useRef` to gate single-fire-per-content-transition (verifiable: grep `useRef`).
    - `useHashScroll.js` resolves headings via BOTH `document.getElementById(id)` AND `[id^="..."]` prefix match (matching CrossLinkText D-05 behavior).
    - `useHashScroll.js` does NOT contain `console.warn` (D-14 silent on miss).
    - `useHashScroll.js` does NOT modify `location.hash` (D-14 conservative; preserve user's deep-link verbatim — verifiable: grep returns no `replaceState` call inside this file).
    - `useHashScroll.js` cleans up via `cancelAnimationFrame` returned from useEffect.
    - All 10 `parseHashToId` tests pass; total `npm test` count = 21 (Phase 2) + N (Plan 03-02 useScrollSpy) + 10 (this plan).
    - `npm run build` exits 0.
    - File does NOT modify `App.jsx` (Plan 03-01 already wired the call site).
  </acceptance_criteria>
  <done>useHashScroll is real: one-shot effect on first content render, dual-strategy heading resolution, silent on miss, preserves user's hash. NAV-04 fully wired. Visual confirmation deferred to human UAT (requires `location.hash` + browser scroll).</done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| location.hash → DOM lookup | User-controlled input crosses here; consumed via getElementById (no interpolation) and querySelector with CSS.escape |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-03-03-01 | Tampering | parseHashToId input | accept | Pure string parsing; no DOM mutation, no eval. Output is a string used only as a DOM lookup key. |
| T-03-03-02 | Information Disclosure | resolveHeading querySelector | mitigate | Use CSS.escape() on the prefix-match path so a malformed hash like `']` cannot become a CSS selector injection. Fallback to no-op on querySelector throw. |
| T-03-03-03 | Spoofing | scrollIntoView target | accept | Target is the resolved DOM element. If hash matches no element, silent no-op (D-14). |
| T-03-03-04 | Denial of Service | requestAnimationFrame loop | accept | Single rAF call per content transition, gated by useRef flag. No loop, no recursion. cancelAnimationFrame on cleanup. |
| T-03-03-05 | Elevation of Privilege | useEffect re-fire | mitigate | useRef gate prevents repeated fires for the same content; re-armed only when content transitions back to empty. Cannot create infinite loop or memory churn. |
</threat_model>

<verification>
- `npm test` exits 0 with all 10 parseHashToId cases plus all prior tests passing.
- `npm run build` exits 0; bundle delta is ~0.3 KB gz (small hook + parser).
- Hook integration verified at human UAT: paste `localhost:5173/#prd-1-1` into a fresh tab, confirm smooth scroll to PRD-1.1 heading. Confirm `localhost:5173/#nonsense` does nothing (no error, no warning).
</verification>

<success_criteria>
- NAV-04: User can paste a deep link into a fresh tab and viewer scrolls to that section once content loads.
- D-13: Effect fires after first content render (uses requestAnimationFrame inside an effect gated on content prop).
- D-14: Unknown hashes silent no-op (no warning, no URL alteration).
- D-15: rehype-slug format matched directly via getElementById, with prefix-match fallback for PRD-only hashes (CrossLinkText behavior parity).
- File-disjointness: this plan touches only useHashScroll.js + useHashScroll.test.js (App.jsx call site was wired by Plan 03-01).
</success_criteria>

<output>
After completion, create `.planning/phases/03-navigation-search/03-03-hash-deeplink-SUMMARY.md` documenting:
- Final test count after this plan.
- Why useHashScroll does NOT call useScrollToAnchor (the prefix-match + no-replaceState requirements diverge — explain to verifier).
- Confirmation that App.jsx was NOT modified (Plan 03-01 owns the call site).
- Bundle size delta.
</output>
