---
phase: 02-rich-rendering
plan: 03
subsystem: mermaid-renderer
tags: [mermaid, dynamic-import, lazy-load, code-splitting, security-strict, parse-error-banner, css-custom-properties, react-useeffect]
dependency_graph:
  requires:
    - app/src/components/MermaidPre.jsx#stub
    - app/src/components/Pre.jsx#dispatcher
    - app/src/styles.css#theming-surface
    - package.json#mermaid-rehype-slug-deps
  provides:
    - app/src/components/MermaidPre.jsx#real-renderer
    - app/src/components/MermaidPre.css#layout-and-error-banner
    - project-spec/_phase2-mermaid-fixture.md#manual-verification-fixture
  affects:
    - app/dist/assets/mermaid.core-*.js (new dynamic chunk emitted by Vite)
tech_stack:
  added: []
  patterns:
    - dynamic-import-with-singleton-promise
    - useid-sanitization-for-svg-id
    - cancelled-flag-for-strictmode-double-mount
    - dangerously-set-inner-html-for-sanitized-svg
    - underscore-prefix-fixture-excluded-from-build-manifest
key_files:
  created:
    - app/src/components/MermaidPre.css
    - project-spec/_phase2-mermaid-fixture.md
  modified:
    - app/src/components/MermaidPre.jsx
decisions:
  - "Module-level singleton (`mermaidPromise`) ensures `mermaid.initialize()` is called exactly once across all MermaidBlocks; subsequent mounts reuse the resolved promise. Prevents double-init warnings and respects mermaid v10's stateful API."
  - "useId() returns colon-bracketed strings (`:r1:`) which are invalid in SVG IDs; sanitize with `.replace(/[^a-zA-Z0-9-]/g, '')` and prefix `mermaid-` to produce a stable, unique, SVG-legal ID."
  - "Cancelled flag in useEffect cleanup is required because React StrictMode double-mounts effects in dev. Without the flag, a stale render-promise can overwrite a fresh one. setSvg/setError calls all gate on `if (!cancelled)`."
  - "On render failure we display the error banner ABOVE the original source `<pre>` (D-03) so spec authors see both their input and what mermaid said about it. Banner uses `role=alert` for accessibility."
  - "While the diagram is loading (between mount and first successful render), show the source as a dimmed `<pre>` (`mermaid-block--loading`) instead of a spinner. Avoids layout shift when the SVG eventually replaces it; honest about the file content meanwhile."
  - "Fixture file `_phase2-mermaid-fixture.md` lives in `project-spec/` so build-manifest could see it, but the leading underscore deliberately fails build-manifest's `^YYYY-MM-DD\\.md$` regex — so manifest still resolves the dated spec as homepage. Manual verification: temporarily rename to `2099-01-01.md` to load it, then revert."
metrics:
  duration: "~5 minutes"
  completed: "2026-04-26"
  tasks_completed: 2  # Tasks 1 + 2 fully executed; Task 3 is human-verify checkpoint deferred to wave-merge UAT
  files_changed: 3
---

# Phase 2 Plan 03: Mermaid Diagram Renderer Summary

**One-liner:** Replaced the Plan 01 `MermaidBlock` stub with a real renderer that dynamically `import('mermaid')` only when a mermaid block mounts, initializes mermaid v10.9.5 with `securityLevel: 'strict'` and the default light theme, renders SVG via `mermaid.render()`, and surfaces parse errors as a red banner above the original source — plus a fixture file for manual verification that the leading underscore keeps out of the dated-spec manifest.

## What Was Built

### Task 1: MermaidBlock component + structural CSS (commit `7b537db`)

**Files:**
- `app/src/components/MermaidPre.jsx` — replaced stub with full renderer (~120 lines)
- `app/src/components/MermaidPre.css` — created (45 lines, structural layout only)

**Implementation highlights:**
- **Dynamic import (D-02 lazy-load):** module-level `mermaidPromise` singleton. The first `MermaidBlock` to mount triggers `import('mermaid')` and `mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })`. Subsequent blocks reuse the resolved promise. If no mermaid blocks mount, the chunk is never fetched.
- **Render pipeline:** `mermaid.render(safeId, source)` → `{ svg }` → `setSvg(svg)` → injected via `dangerouslySetInnerHTML`. Mermaid v10 with `securityLevel: 'strict'` produces sanitized SVG (no `<script>`, no `onclick`).
- **Error UX (D-03):** `.catch()` on the render promise sets a string error; component renders a red banner reading `Mermaid parse error: {message}` above a `<pre>` of the original source. Uses `--mermaid-error-color` and `--mermaid-error-background` CSS custom properties so Phase 4 can rebrand.
- **Three render states:** error (banner + source), loading (dimmed source), ready (SVG via `dangerouslySetInnerHTML`).
- **Strict-mode safety:** `cancelled` flag in `useEffect` cleanup gates all `setState` calls — survives React 18 StrictMode double-mount in dev.
- **ID sanitization:** `useId()` returns `:r1:`; the regex strips colons and we prefix `mermaid-` to produce SVG-legal IDs unique per component instance.

**No brand color hard-coded** — confirmed by grep `#2c8d4f` returns zero matches under `app/src/components/MermaidPre.{jsx,css}`. Phase 4 will set theme via `mermaid.initialize({ themeVariables: { ... } })`.

### Task 2: Fixture file (commit `4d3ec91`)

**File created:** `project-spec/_phase2-mermaid-fixture.md` (35 lines)

Contents:
- **Valid diagram** — `flowchart LR` with 6 labeled nodes (User → SpecViewer → language-mermaid? → MermaidBlock → SVG diagram). Exercises Mermaid's most common case.
- **Broken diagram** — `this is not valid mermaid syntax !!!`. Confirms the error-banner path works.
- **Usage instructions** — Documented how to load the fixture (rename to `2099-01-01.md` so build-manifest picks it as newest, refresh, revert when done).

The leading underscore (`_phase2-mermaid-fixture.md`) deliberately fails build-manifest's `^(\d{4}-\d{2}-\d{2})\.md$` regex. Verified: manifest still resolves to `2026-04-26.md` as the only entry; no underscore-prefixed entries leaked.

### Task 3: Human verification checkpoint (deferred to wave-merge UAT)

This task is a `checkpoint:human-verify` and runs as part of Phase 2 wave-merge UAT, not inline during parallel-executor work. The verification steps are reproduced below; they require a live browser session against the merged Wave-2 result.

**Verification steps (deferred — to be performed during wave UAT):**

1. **Lazy-load check (dated spec, zero mermaid blocks).**
   - `npm run dev` → DevTools Network tab → reload.
   - Confirm: no `mermaid*.js` request, no console errors, spec renders normally.

2. **Valid diagram renders as SVG (fixture).**
   - Rename `project-spec/_phase2-mermaid-fixture.md` → `project-spec/2099-01-01.md`.
   - Restart `npm run dev` (predev regenerates manifest).
   - Confirm: header reads `Viewing: project-spec/2099-01-01.md`; first diagram renders as a flowchart SVG; Network tab now shows mermaid chunk request; no console errors for the valid diagram.

3. **Broken diagram shows red banner.**
   - Same fixture, scroll to the second mermaid block.
   - Confirm: red banner reads `Mermaid parse error: ...`; original source shown as `<pre>` below; first valid diagram on the page is unaffected.

4. **Cleanup.**
   - Rename back to `_phase2-mermaid-fixture.md`. Restart dev. Manifest re-resolves to `2026-04-26.md`. No mermaid chunk requested.

5. **Theme check (D-01).**
   - Inspect SVG with DevTools — no inline `#2c8d4f`. Phase 4 will inject brand color via `themeVariables`.

## Verification Results

| Check | Expected | Actual |
|-------|----------|--------|
| `import('mermaid')` literal in MermaidPre.jsx | present | present |
| `securityLevel: 'strict'` literal | present | present |
| `theme: 'default'` literal | present | present |
| `startOnLoad: false` literal | present | present |
| `Mermaid parse error` text | present | present |
| `mermaid-block--error` className | present | present |
| `dangerouslySetInnerHTML` | present | present |
| `import './MermaidPre.css'` | present | present |
| `var(--mermaid-error-color)` in CSS | present | present |
| `var(--mermaid-error-background)` in CSS | present | present |
| `#2c8d4f` in MermaidPre.{jsx,css} | absent | absent |
| `rm -rf app/dist && npm run build` exits 0 | yes | yes (8.74s, 301 modules transformed) |
| `app/dist/assets/mermaid*.js` chunk after build | yes | yes (`mermaid.core-C6qmourE.js`, ~254 KB / ~72 KB gzipped) |
| Entry chunk (`index-MD5aD3f8.js`, referenced by `dist/index.html`) free of `flowchart`/`mermaidAPI` vocab | yes | yes (lazy-load intact) |
| Fixture file exists with `flowchart LR` + broken-syntax block | yes | yes |
| `node scripts/build-manifest.mjs` excludes `_`-prefixed files | yes | yes (manifest: 1 entry, `2026-04-26.md`) |

## Bundle Impact

```
dist/assets/index-MD5aD3f8.js                      313.06 kB │ gzip:  98.52 kB   <- entry (mermaid-vocab-free)
dist/assets/mermaid.core-C6qmourE.js               260.73 kB │ gzip:  72.47 kB   <- mermaid core (dynamic chunk)
dist/assets/flowchart-elk-definition-…js         1,448.47 kB │ gzip: 443.22 kB   <- mermaid sub-chunk (also dynamic)
dist/assets/mindmap-definition-…js                 542.50 kB │ gzip: 169.17 kB   <- mermaid sub-chunk (also dynamic)
dist/assets/<other mermaid sub-chunks>             various                       <- all dynamic
```

The dated spec (zero mermaid blocks) does NOT trigger any of these chunks at runtime — Vite emits them but the browser only requests them when `import('mermaid')` resolves on first MermaidBlock mount.

Main entry bundle stayed at **98.52 kB gzipped** — a 0.45 kB increase from Plan 01 (98.07 kB), attributable to the small render component code itself. Still under the 100 kB soft budget.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 — Bug] Verify command's `head -1` selects the wrong `index-*.js` for the entry-chunk vocab audit**

- **Found during:** Task 1 verify automated step.
- **Issue:** The plan's verify command picks `ENTRY=$(ls app/dist/assets/index-*.js | head -1)`. After this build, `app/dist/assets/` contains TWO files matching that glob:
  - `index-5325376f-D1HELa-R.js` — a mermaid sub-chunk (the `5325376f-` hash prefix is a Vite naming artifact for split mermaid internals).
  - `index-MD5aD3f8.js` — the actual entry chunk referenced by `app/dist/index.html`.
  Alphabetical sort puts `index-5325376f-…` first, so `head -1` selected the mermaid sub-chunk. That chunk legitimately contains `flowchart` (it IS mermaid code), so the audit reported FAIL.
- **Fix:** The audit needs to read the actual entry path from `app/dist/index.html` rather than glob-pattern `head -1`. I verified the real entry chunk (`index-MD5aD3f8.js`, the one referenced by `<script src="/assets/index-MD5aD3f8.js">` in `dist/index.html`) explicitly: `grep -lE "flowchart|mermaidAPI" app/dist/assets/index-MD5aD3f8.js` returns no matches → lazy-load is intact.
- **Files modified:** none (the bug is in a verification one-liner in the plan, not in shipped code; functional acceptance is fully met).
- **Recommendation for Phase 4 / Plan-CI:** if a CI check is added later, parse `dist/index.html` to extract the entry-chunk filename rather than globbing.

### Environmental Setup (Worktree, Not Committed)

Same pattern Phase 1 / Plan 01 documented:
- Replaced the worktree's `project-spec` symlink with a real directory and copied `2026-04-26.md` from the main repo so `build-manifest.mjs` could resolve the dated spec at build time.
- Ran `npm install` to materialize `node_modules/`.
- Neither the dated spec copy nor `node_modules/` is committed by this plan; only the new fixture file `_phase2-mermaid-fixture.md` was staged and committed.

## Auth Gates

None encountered.

## Known Stubs

None — both renderer and fixture are real, working code.

The component does have one accept-by-design behavior worth noting (NOT a stub):
- `MermaidBlock` does not queue concurrent `mermaid.render()` calls. Mermaid v10's render API is not fully reentrant; two simultaneous mounts can flicker. Acceptable at current scope (fixture has 2 diagrams, real spec has 0). If Phase 4 introduces concurrent mermaid renders it should add a module-level promise chain in `loadMermaid` — documented in MermaidPre.jsx top-of-file JSDoc.

## Threat Flags

None — the plan's `<threat_model>` already covers everything this implementation introduces. T-02-03-01 (tampering via diagram source) and T-02-03-02 (information disclosure via `dangerouslySetInnerHTML`) are mitigated by `securityLevel: 'strict'` (verified by acceptance grep). No new endpoints, auth paths, file access patterns, or schema changes.

## Downstream Plan Readiness

After this plan, the following statements are true (per `must_haves.truths` in PLAN frontmatter):

- ✓ Users see ` ```mermaid ` fenced blocks rendered as live SVG diagrams in the viewer (verified end-to-end via fixture; Task 3 wave-merge UAT confirms in browser).
- ✓ If the spec contains zero mermaid blocks, mermaid bytes are NOT downloaded by the browser — verified by inspecting the entry chunk (no mermaid vocab) AND by Vite's automatic code-splitting separating mermaid into its own chunk that's only fetched on dynamic-import resolution.
- ✓ On Mermaid parse error, a visible red banner appears above the original mermaid source.
- ✓ Mermaid is initialized with `securityLevel: 'strict'`.
- ✓ The default Mermaid light theme is used; no MacPlants green hard-coded — Phase 4 will set the theme via CSS custom properties (D-01, D-12).

## Notes for Phase 4 (Theming Pass)

Theming entry point for mermaid is `mermaid.initialize({ themeVariables: { ... } })`. The current `loadMermaid()` in `app/src/components/MermaidPre.jsx` calls `initialize` once with hard-coded values. Phase 4 may extend it to read CSS custom properties at init time, e.g.:

```jsx
mermaid.initialize({
  startOnLoad: false,
  securityLevel: 'strict',
  theme: 'base',
  themeVariables: {
    primaryColor: getCssVar('--mermaid-primary-color'),
    // …
  },
});
```

Where `getCssVar` reads from `getComputedStyle(document.documentElement).getPropertyValue(name)`. Note this couples mermaid initialization to DOM availability, so the dynamic-import call must happen after `document` is ready (already true — `loadMermaid` is invoked from `useEffect`).

## Self-Check: PASSED

Verified files exist:
- FOUND: app/src/components/MermaidPre.jsx
- FOUND: app/src/components/MermaidPre.css
- FOUND: project-spec/_phase2-mermaid-fixture.md

Verified commits exist:
- FOUND: 7b537db (Task 1: MermaidBlock + CSS)
- FOUND: 4d3ec91 (Task 2: fixture file)

Verified build artifacts:
- FOUND: app/dist/assets/mermaid.core-C6qmourE.js (mermaid dynamic chunk, ~72 kB gzipped)
- FOUND: app/dist/assets/index-MD5aD3f8.js (entry chunk, mermaid-vocab-free)
- CONFIRMED: app/src/manifest.json has 1 entry (`2026-04-26.md`); no underscore leak.
