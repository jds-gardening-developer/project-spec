---
phase: 02-rich-rendering
verified: 2026-04-26T23:00:00Z
status: human_needed
score: 5/5 must-haves code-verified; 4/4 success criteria require browser confirmation
overrides_applied: 0
re_verification:
  previous_status: none
  previous_score: n/a
  gaps_closed: []
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Cross-link click navigation against the dated spec"
    expected: "After `npm run dev`, open the viewer in a browser. The current dated spec (`2026-04-26.md`) contains zero `(see PRD-X.Y)` parenthesized references — that is intentional and verified by grep. To exercise REND-02 against the in-fixture cases, rename `project-spec/_phase2-cross-link-fixture.md` → `project-spec/2099-01-01.md` and restart `npm run dev`. The header should read `Viewing: project-spec/2099-01-01.md`. Then perform: (a) click `PRD-1` inside `(see PRD-1)` — the page must smooth-scroll to the in-fixture `## PRD-1: Sample Section` heading and the URL bar must show `#prd-1...`. (b) Click `PRD-3.4` inside `(see PRD-3.4)` — smooth scroll to `## PRD-3.4: Decimal Section`; URL shows `#prd-3-4...`. (c) In `(see PRD-1, PRD-3.4)` confirm there are TWO distinct linked tokens; click each independently and confirm each navigates to its own heading. After verification, rename the fixture back to `_phase2-cross-link-fixture.md`."
    why_human: "Click handler runs against the live DOM. Smooth scroll is a browser visual behavior; URL hash mutation via history.replaceState requires a real Location object. Cannot be observed from CLI."
  - test: "Cross-link broken-target fallback UX"
    expected: "With the cross-link fixture activated, click `PRD-99` inside `(see PRD-99)`. Confirm: (1) the link transforms in place to a dimmed span (greyed out, `not-allowed` cursor, dotted underline using `--cross-link-broken-color`), (2) hovering shows the tooltip `PRD-99 not found in current spec`, (3) the browser console shows EXACTLY ONE warning containing `[spec-viewer] cross-link: PRD-99 not found`, (4) clicking the now-dimmed span does nothing. Negative checks on the same fixture: bare `PRD-1` (no `(see ` prefix) renders as plain text; `(see PRD-1)` inside backticks (inline code) renders as monospaced text without becoming a link; the same string inside a fenced ` ```text ` block renders as preformatted text without becoming a link; the `### PRD-XX placeholder heading` heading text is NOT auto-linked."
    why_human: "Broken-link UX swap is gated on a useState flag flipped inside a click handler — this is render-loop behavior that can only be observed in a browser. Console.warn dedupe behavior likewise requires a live console. The negative cases also need DOM observation to confirm absence of a click handler / cross-link styling."
  - test: "Schema-card rendering across the real dated spec"
    expected: "Run `npm run dev` against the real dated `project-spec/2026-04-26.md`. The spec contains 20 schema tables (verified: `grep -c '^| Field' project-spec/2026-04-26.md` returns 20). Scroll to PRD-0 / `Users (Internal Staff)` (~line 23). Confirm: (1) the Field|Type|Notes table renders as a card (rounded border, light background, one row per field) — NOT as a plain HTML table, (2) field names appear in monospace, (3) the type column shows a small chip (pill) per row with the type text, (4) backslash escapes are visible — `created\\_by` renders with a literal backslash before the underscore (D-10), (5) `FK → User` appears with the arrow intact in the chip and the chip has a subtle border (the `--fk` modifier — D-11). Scroll to PRD-1 (Plant Database & Inventory) and confirm sub-tables (Plants, Plant Variants, Plant Batches, etc.) each render as their own card. Scroll to PRD-3 (Order Lifecycle) and confirm orderable-related tables also become cards. DevTools check: inspect any schema card; confirm computed border resolves from `var(--schema-card-border)` and the chip background from `var(--schema-card-type-background)`. No `#2c8d4f` should appear in computed styles for any card-related element (Phase 4 introduces that). Mobile check: resize browser to <640px wide; field rows must collapse to a vertical stack (the `@media` rule kicks in)."
    why_human: "Schema-card detection is unit-tested at the helper level (11/11 passing) but the JSX dispatcher → DOM render path is verified only against hand-built test fixtures, not against a real react-markdown@9 + remark-gfm tree. Visual layout, monospace fonts, chip backgrounds, mobile collapse, and computed-style theming sources can only be confirmed in a browser. WR-04 from the code review notes that the `data-prd-id` prop-passing convention through `hast-util-to-jsx-runtime` is implicit; SchemaTable does NOT depend on that, but the equivalent risk for SchemaTable is that react-markdown's table-children shape needs to match what `extractHeaderCells` expects — only browser observation against the real spec confirms it."
  - test: "Schema-card NEGATIVE case (non-Field/Type/Notes 3-col tables)"
    expected: "On the real dated spec, find any 3-column table that is NOT `Field | Type | Notes` (e.g., decision tables or action-item tables near the spec end). Per planning-time grep there are zero such tables in the current dated spec, so this is a structural check: (1) confirm any non-data-model tables you find render as plain markdown tables, NOT as schema cards, (2) confirm the 'Meeting Action Items' or 'Scope Decisions Summary' sections (if they contain tables) render as standard tables. Then, with the cross-link fixture activated (renamed to 2099-01-01.md), confirm that fixture's headings like `## PRD-1: Sample Section` exist with proper IDs (rehype-slug should produce `prd-1-sample-section` — inspect via DevTools)."
    why_human: "Confirms detection is conservative (D-08 strict 3-col + lowercased equality with [field, type, notes]). Without a browser, we cannot confirm what react-markdown actually emits for non-schema 3-col tables in the live render."
  - test: "Mermaid lazy-load on the dated spec"
    expected: "Run `npm run dev`. Open DevTools → Network tab. Reload the page. The dated spec contains zero ` ```mermaid ` blocks (verified: `grep -c '^```' project-spec/2026-04-26.md` returns 0). Confirm: (1) no Network request for any file matching `mermaid*.js` is made when loading the dated spec; (2) no chunk matching `flowchart-*`, `mermaid.core-*`, or any of the other mermaid sub-chunks is requested; (3) the spec renders normally with no console errors related to mermaid. The build-time chunk audit already confirmed `app/dist/assets/index-CU0WdlXe.js` (the entry chunk) does NOT contain the strings `flowchart` or `mermaidAPI` — proving the lazy-load is structurally intact at build time. Browser observation confirms it at runtime."
    why_human: "Lazy-load behavior is a runtime browser concern (network requests, dynamic import resolution). The code-level audit shows the chunk is split correctly; only a browser can confirm the chunk is not eagerly fetched."
  - test: "Mermaid valid-diagram render"
    expected: "Rename `project-spec/_phase2-mermaid-fixture.md` → `project-spec/2099-01-01.md`. Restart `npm run dev`. Confirm: (1) header reads `Viewing: project-spec/2099-01-01.md`, (2) the first diagram (a `flowchart LR` with 6 labeled nodes: User → SpecViewer → language-mermaid? → MermaidBlock → SVG diagram) renders as an SVG flowchart with boxes and arrows, (3) DevTools Network tab now shows requests for the mermaid chunks (mermaid.core-*.js, flowchart-elk-definition-*.js, etc.), (4) no console errors related to the valid diagram. Inspect the SVG via DevTools — none of its inline styles or attribute values should contain the literal `#2c8d4f` (Phase 4 introduces brand color via mermaid `themeVariables`)."
    why_human: "SVG render is a browser-only output. The dynamic import resolution, mermaid.render() → SVG injection, and visual diagram correctness can only be confirmed by viewing the rendered DOM."
  - test: "Mermaid parse-error banner"
    expected: "Same fixture (renamed to 2099-01-01.md), scroll to the second mermaid block (intentionally broken syntax: `this is not valid mermaid syntax !!!`). Confirm: (1) a red banner appears reading `Mermaid parse error: ...` (the exact message is mermaid implementation-defined), (2) below the banner, the original broken source is shown as a `<pre>` block, (3) the first valid diagram on the page is still rendered correctly (one broken block does not break the page). Then cleanup: rename `project-spec/2099-01-01.md` back to `project-spec/_phase2-mermaid-fixture.md` and restart `npm run dev`."
    why_human: "Banner styling, role=alert accessibility hint, and the layout of the original source preservation are all browser-rendered behaviors. Mermaid's promise rejection path runs at render time."
  - test: "Copy-button visibility on bash and JSON code blocks"
    expected: "Rename `project-spec/_phase2-codeblock-fixture.md` → `project-spec/2099-01-02.md`. Restart `npm run dev`. The header should read `Viewing: project-spec/2099-01-02.md`. Confirm: (1) the bash block shows a small copy-icon button at its top-right corner; the button is low-contrast (~60% opacity) and becomes more prominent on hover, (2) the JSON block shows the same button. Click the bash button. Confirm: (3) the icon swaps to a checkmark, (4) after ~1.5 seconds it reverts to the clipboard icon, (5) open a text editor and paste — the clipboard contains the exact bash source (newlines and `# comment` lines preserved). Repeat steps 3–5 against the JSON block; pasted content must include `{`, `}`, key-value pairs, and indentation."
    why_human: "Copy-button visual state, hover transition, 1500ms checkmark feedback, and clipboard contents are all browser/system behaviors. `navigator.clipboard.writeText` is not exercised in unit tests."
  - test: "Copy-button mermaid exclusion (D-13)"
    expected: "Same fixture (renamed to 2099-01-02.md). Scroll to the mermaid block in the fixture. Confirm: (1) the block renders as an SVG flowchart (Plan 03's MermaidBlock — D-13 dispatch via `language-mermaid` className check), (2) there is NO copy-icon button anywhere on or around the diagram, (3) the original mermaid source text is NOT visible (replaced by the rendered diagram). Then verify inline-code exclusion: scroll to the paragraph containing `npm run dev` and `navigator.clipboard.writeText` in inline backticks; confirm there is NO copy button on the inline code (the dispatcher attaches to `<pre>` only, not inline `<code>`)."
    why_human: "D-13 enforcement is a render-time decision in Pre.jsx; the absence of a button on mermaid blocks AND the presence of the SVG diagram both need browser observation. Inline-code exclusion likewise needs DOM inspection."
  - test: "Copy-button fallback path (clipboard API unavailable)"
    expected: "With the codeblock fixture still active, open DevTools → Console. Run: `const orig = navigator.clipboard; Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true});`. Then click any copy button. Confirm: (1) nothing visible happens (no checkmark, no error toast), (2) the console shows EXACTLY ONE warning containing `clipboard API unavailable`, (3) clicking the same button a second time produces NO additional warning (deduped per page lifetime). Restore via: `Object.defineProperty(navigator, 'clipboard', {value: orig, configurable: true});`. Cleanup: rename `project-spec/2099-01-02.md` back to `project-spec/_phase2-codeblock-fixture.md` and restart `npm run dev`."
    why_human: "Fallback path requires runtime mutation of navigator.clipboard, which is only meaningful in a browser. Console output and dedupe behavior are runtime observable only."
  - test: "Cross-link prop-passing wiring (WR-04 mitigation)"
    expected: "Code review WR-04 flagged that `data-prd-id` prop-passing depends on react-markdown@9's hast-util-to-jsx-runtime kebab-case convention. There is no end-to-end render test verifying that. Browser verification: with the cross-link fixture activated (renamed to 2099-01-01.md), open DevTools → Elements panel; find a rendered `<a>` for `PRD-1` inside `(see PRD-1)`. Confirm: (1) the element has class `cross-link`, (2) the element has a `data-prd-id` attribute with value `prd-1` (kebab-case in the rendered DOM), (3) clicking the element produces the smooth-scroll behavior described above. If the attribute appears as `dataPrdId` (camelCase) or is missing, the wiring is broken even though everything else looks fine — this is the WR-04 silent-failure mode and would degrade every cross-link to a non-cross-link `<a>` that 404s on hash navigation."
    why_human: "WR-04 risk surfaces only in the live React render path; unit tests assert mdast-tree shape but not React prop names. DOM inspection is the only programmatic check for this."
gaps:
  - truth: "Bundle main entry chunk is 100.48 KB gzipped — slightly over the 100 KB soft budget"
    status: partial
    reason: "Per the orchestrator's note, the 100 KB budget is a soft target, not a blocking constraint. Phase 1 Plan 01 noted 98.07 KB; cumulative Phase 2 cost is +2.41 KB gz. The mermaid runtime is correctly isolated to a lazy chunk (mermaid.core-*.js at ~72 KB gz); the entry chunk is mermaid-vocab-free (verified: `grep -lE 'flowchart|mermaidAPI' app/dist/assets/index-CU0WdlXe.js` returns no matches). User explicitly noted this is non-blocking."
    artifacts:
      - path: "app/dist/assets/index-CU0WdlXe.js"
        issue: "319.01 KB raw / 100.48 KB gzipped — 0.48 KB over the 100 KB soft budget"
    missing:
      - "(none — soft budget overrun was acknowledged by the user as non-blocking; tracked here for transparency, not as an actionable gap)"
deferred:
  - truth: "Phase 4 (Branding & Layout) will override the 14 CSS custom properties declared in styles.css to apply MacPlants green and the full brand pass"
    addressed_in: "Phase 4"
    evidence: "ROADMAP Phase 4 covers BRD-01..04 (`#2c8d4f` accent color for active sidebar/links/headings, layout match to existing Docsify view). Phase 2's CSS custom property surface (`--schema-card-accent`, `--cross-link-color`, `--copy-button-color-success`, `--mermaid-error-color`, etc.) is the explicit hand-off point."
  - truth: "Mermaid theme via themeVariables / brand color injection into diagram SVGs"
    addressed_in: "Phase 4"
    evidence: "CONTEXT.md D-01 explicitly defers brand theming to Phase 4. Plan 03 SUMMARY documents the entry point: `mermaid.initialize({ themeVariables: { ... } })` in MermaidPre.jsx#loadMermaid."
  - truth: "Hash deep-linking on initial load (URL with #prd-x-y resolves on page load)"
    addressed_in: "Phase 3"
    evidence: "ROADMAP Phase 3 covers NAV-04 (`User can load a deep hash link directly and the viewer scrolls to that section on initial render`). Phase 2's CrossLinkAnchor only writes the hash on click via history.replaceState; it does NOT consume the hash on first paint. CONTEXT.md D-07 explicitly notes this boundary."
  - truth: "Sidebar navigation listing PRD entries (NAV-01, NAV-02, NAV-03)"
    addressed_in: "Phase 3"
    evidence: "ROADMAP Phase 3 explicitly covers NAV-01..04 (left sidebar, expandable sub-headings, click-to-scroll, hash sync). Phase 2's `rehype-slug` integration creates the heading IDs that Phase 3 sidebar entries will link to."
  - truth: "Cmd+K / Ctrl+K search with build-time index (SEA-01, SEA-02, SEA-03)"
    addressed_in: "Phase 3"
    evidence: "ROADMAP Phase 3 covers SEA-01..03. Out of scope for Phase 2."
  - truth: "Netlify build/publish migration to dist/ output (DEP-02)"
    addressed_in: "Phase 5"
    evidence: "ROADMAP Phase 5 covers DEP-01, DEP-02, VIEW-04. Phase 2 produces a working `app/dist/` from `npm run build` but does not change `netlify.toml`."
---

# Phase 2: Rich Rendering Verification Report

**Phase Goal:** The viewer adds the interactivity Docsify cannot do natively — clickable cross-references, schema-card data-model tables, live Mermaid diagrams, and copy-code buttons.
**Verified:** 2026-04-26T23:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth (from ROADMAP success criteria) | Status | Evidence |
|---|---|---|---|
| 1 | User can click any inline `(see PRD-X.Y)` reference and the page scrolls to the matching PRD heading | ? CODE-VERIFIED, BROWSER-NEEDED | `crossLinkPlugin.js` rewrites `(see PRD-X[.Y])` text into `link` mdast nodes with `url: '#prd-x-y'` and `data-prd-id` hProperty. `CrossLinkText.jsx#CrossLinkAnchor` calls `event.preventDefault()`, `document.querySelector('[id^="${prdId}"]')` (D-05 prefix match), `target.scrollIntoView({behavior:'smooth', block:'start'})` (D-07), and `history.replaceState`. 10 unit tests pass (idempotency Test 10 with deep-clone equality). The dated spec has zero `(see PRD-X.Y)` parenthesized references (intentional — fixture exercises the cases). |
| 2 | Three-column `Field \| Type \| Notes` tables render as schema cards while regular tables continue to render as standard tables | ? CODE-VERIFIED, BROWSER-NEEDED | `SchemaTable.helpers.js#isSchemaHeader` requires exactly 3 columns + lowercased trimmed equality with `['field','type','notes']` (D-08). 11 unit tests pass (case-insensitive, whitespace-trimmed, all 3-col negative cases — `Decision\|Rationale\|Outcome`, `Stage\|Status\|Reason`, `Field\|Type\|Description` — correctly rejected). Dispatcher in `SchemaTable.jsx` falls through to `<table>` on miss. Backslash escapes preserved (D-10) via React's text-child path. FK chip modifier wired via `detectFkType` (D-11). 20 schema tables in dated spec (verified by grep). |
| 3 | User sees Mermaid diagrams rendered live for ` ```mermaid ` fenced blocks, and Mermaid loads on demand (not in the main bundle) | ? CODE-VERIFIED, BROWSER-NEEDED | `MermaidPre.jsx` uses `import('mermaid')` (dynamic) inside useEffect with module-level `mermaidPromise` singleton. `mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })`. SVG injected via `dangerouslySetInnerHTML` (sanitized by mermaid v10 strict mode). Parse-error banner per D-03. **Lazy-load programmatically verified:** entry chunk `app/dist/assets/index-CU0WdlXe.js` (referenced by `index.html`) does NOT contain `flowchart` or `mermaidAPI` strings; mermaid runtime is in a separate `mermaid.core-BpET4WTy.js` chunk (~72 KB gzipped) plus 16 dynamic sub-chunks for diagram types. |
| 4 | User can click a copy-to-clipboard button on any code block and the contents are copied | ? CODE-VERIFIED, BROWSER-NEEDED | `Pre.jsx` dispatcher: `language-mermaid` → `MermaidBlock` (D-13 enforces no copy button on diagrams); else → `<div className="copy-button-wrapper">` with `<CopyButton text={...}>` and `<pre>`. `CopyButton.jsx` calls `navigator.clipboard.writeText(text)`, sets `copied=true` for 1500ms (D-15), and emits `[spec-viewer] clipboard API unavailable` warn-once (D-16) when the API is missing. Inline `<code>` excluded (dispatcher attaches to `<pre>` only). |

**Score:** 4/4 truths code-verified at the artifact + wiring level; all 4 require browser observation to confirm end-to-end visual/interactive behavior.

### Deferred Items

Items not yet met but explicitly addressed in later milestone phases.

| # | Item | Addressed In | Evidence |
|---|------|-------------|----------|
| 1 | Hash deep-linking on initial load (URL with `#prd-x-y` resolves on first paint) | Phase 3 | NAV-04 in ROADMAP Phase 3; CONTEXT.md D-07 explicitly defers initial-load hash consumption |
| 2 | Sidebar navigation (PRD list, expandable sub-headings, click-to-scroll) | Phase 3 | NAV-01..03 in ROADMAP Phase 3; rehype-slug heading IDs created in Phase 2 are the hand-off |
| 3 | Cmd+K / Ctrl+K search with build-time index | Phase 3 | SEA-01..03 in ROADMAP Phase 3 |
| 4 | MacPlants green brand theme override across components | Phase 4 | BRD-01..04 in ROADMAP Phase 4; Phase 2 ships 14 CSS custom properties as the theming surface |
| 5 | Mermaid `themeVariables` brand-color injection | Phase 4 | CONTEXT.md D-01 explicitly defers; loadMermaid() in MermaidPre.jsx is the entry point |
| 6 | Netlify build/publish migration (`publish = "dist"`, `command = "npm run build"`) | Phase 5 | DEP-02 in ROADMAP Phase 5 |

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/src/SpecViewer.jsx` | Imports rehypeSlug, remarkCrossLinks, CrossLinkAnchor, SchemaOrTable, Pre; passes `remarkPlugins=[remarkGfm, remarkCrossLinks]`, `rehypePlugins=[rehypeSlug]`, `components={a, table, pre}` | ✓ VERIFIED | All five imports present (lines 3–7); components object on lines 24–28; remarkPlugins on line 30; rehypePlugins on line 31; passed to ReactMarkdown on lines 42–46. Default sanitization preserved (NO `import` of `rehype-raw`; line 22 mentions `NO rehype-raw` only as a documentary safety comment). |
| `app/src/components/crossLinkPlugin.js` | Real remark plugin; rewrites `(see PRD-X[.Y])` text into link mdast nodes with `data-prd-id` hProperty | ✓ VERIFIED | 143 lines. `SEE_GROUP` regex (line 32) matches the parenthesized group; `PRD_TOKEN` (line 28) walks identifiers. Skip set `{'code','inlineCode','heading'}` (line 34). `prdToAnchor` produces `prd-N[-M]` (line 43). `buildLinkNode` attaches `className: ['cross-link']` and `data-prd-id` (line 58). Walker on line 120 mutates in place. 10 unit tests pass. |
| `app/src/components/CrossLinkText.jsx` | CrossLinkAnchor component: click-time DOM resolution, scrollIntoView+hash on hit, swap-to-dimmed-span+console.warn on miss; useState for broken state | ✓ VERIFIED | 117 lines. `useState(false)` for broken state (line 38). Three-branch render: non-cross-link external (line 41), broken span (line 54), active anchor with onClick (line 85). onClick uses `document.querySelector('[id^="${prdId}"]')` (line 69), `scrollIntoView({behavior:'smooth', block:'start'})` (line 77), `history.replaceState` (line 81). `_warned` Set dedupes warnings (line 99). |
| `app/src/components/CrossLinkText.css` | Anchor + dimmed-span styling using `--cross-link-color`, `--cross-link-broken-color` | ✓ VERIFIED | 25 lines. References both custom properties. `cursor: not-allowed` and `opacity: 0.7` on broken state. |
| `app/src/components/MermaidPre.jsx` | MermaidBlock: dynamic `import('mermaid')`, `securityLevel: 'strict'`, `theme: 'default'`, render-error banner, no hard-coded brand color | ✓ VERIFIED | 127 lines. `import('mermaid')` on line 27 inside module-level `mermaidPromise` singleton. `mermaid.initialize({ startOnLoad: false, securityLevel: 'strict', theme: 'default' })` on lines 29–33. `dangerouslySetInnerHTML` for sanitized SVG (line 123). Error banner on lines 95–105 with `role="alert"`. `cancelled` flag in useEffect for StrictMode safety. No `#2c8d4f` (verified by grep). |
| `app/src/components/MermaidPre.css` | Layout + error-banner styling using `--mermaid-error-color`, `--mermaid-error-background` | ✓ VERIFIED | References both custom properties. |
| `app/src/components/SchemaTable.jsx` | Dispatcher: detect schema header via helpers, route to schema-card render or fall through to plain table; FK chip modifier | ✓ VERIFIED | 62 lines. Imports four named helpers from `./SchemaTable.helpers.js` (line 2). Falls through to `<table>` on detection miss (line 25). On match: renders `<div className="schema-card">` with one `__row` per body row, each with `__field`, `__type` (chip), `__notes` cells. FK chip modifier `--fk` applied via `detectFkType` result (line 35). |
| `app/src/components/SchemaTable.helpers.js` | Pure JS (no JSX): `isSchemaHeader`, `extractHeaderCells`, `extractBodyRows`, `detectFkType` | ✓ VERIFIED | 105 lines. All four named exports present. Operates on `{type, props:{children}}` shape. 11 unit tests pass. |
| `app/src/components/SchemaTable.helpers.test.js` | 11 node:test cases covering detection edge cases + traversal | ✓ VERIFIED | All 11 tests pass per `npm test`. |
| `app/src/components/SchemaTable.css` | Schema-card layout using 7+ `--schema-card-*` custom properties; mobile @media collapse | ✓ VERIFIED | References `--schema-card-border`, `--background`, `--field-color`, `--type-background`, `--type-color`, `--notes-color`, `--accent`. Mobile rule at `@media (max-width: 640px)` collapses to single column. No `#2c8d4f` (verified). |
| `app/src/components/Pre.jsx` | Dispatcher: language-mermaid → MermaidBlock; else → wrapper + CopyButton + pre | ✓ VERIFIED | 48 lines. Imports both `MermaidBlock` and `CopyButton`. Mermaid branch on lines 38–40. Non-mermaid branch wraps in `<div className="copy-button-wrapper" style={{position: 'relative'}}>` with `<CopyButton text={text}>` adjacent to `<pre>`. |
| `app/src/components/CopyButton.jsx` | navigator.clipboard.writeText, 1500ms feedback, console.warn fallback, inline SVG icons | ✓ VERIFIED | 73 lines. `navigator.clipboard.writeText` call on line 34. Guard for `typeof navigator === 'undefined'`, `!navigator.clipboard`, `typeof navigator.clipboard.writeText !== 'function'` on line 29. `setTimeout(() => setCopied(false), FEEDBACK_MS)` with FEEDBACK_MS=1500. Module-level `_warned` boolean dedupes warnings. Inline SVG `ClipboardIcon` and `CheckIcon`. `aria-label` on button. `type="button"`. |
| `app/src/components/CopyButton.css` | Position absolute top-right; --copy-button-color, --copy-button-color-success, --copy-button-background | ✓ VERIFIED | All three custom properties referenced. `top: 6px; right: 6px`. Opacity 0.6 → 1 on hover/focus-visible. |
| `app/src/components/crossLinkPlugin.test.js` | 10 node:test cases including idempotency Test 10 with deep-clone equality | ✓ VERIFIED | All 10 tests pass per `npm test`. |
| `app/src/styles.css` | 14+ CSS custom properties grouped by component family (schema-card, cross-link, copy-button, mermaid) | ✓ VERIFIED | All four groups present (Phase 2 component theming surface block at lines 21–46). 15 properties total: 8 schema-card, 2 cross-link, 3 copy-button, 2 mermaid. No `#2c8d4f` (Phase 4 will override). |
| `package.json` | `mermaid@^10`, `rehype-slug@^6` deps; `test` script targets `app/src/components/*.test.js`; no `rehype-raw` | ✓ VERIFIED | `mermaid: ^10.9.5`, `rehype-slug: ^6.0.0`. Test script: `"test": "node --test app/src/components/*.test.js"`. No `rehype-raw` key. |
| `project-spec/_phase2-cross-link-fixture.md` | Underscore-prefixed; bash + json + mermaid blocks; underscore prefix excluded from manifest | ✓ VERIFIED | 6 `(see PRD-...)` references (single, decimal, comma-list, broken, plus negative cases inside fenced/inline code/heading). Underscore prefix excluded from manifest (verified). |
| `project-spec/_phase2-mermaid-fixture.md` | Underscore-prefixed; one valid + one broken diagram | ✓ VERIFIED | 2 ` ```mermaid ` fence openers (one valid `flowchart LR`, one intentionally broken). Underscore-excluded. |
| `project-spec/_phase2-codeblock-fixture.md` | Underscore-prefixed; bash + json + mermaid + inline code | ✓ VERIFIED | 3 fence types (bash, json, mermaid). Inline backtick references for negative-exclusion check. Underscore-excluded. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `SpecViewer.jsx` | `Pre.jsx` | `import { Pre }` + `components={{ pre: Pre }}` | ✓ WIRED | Import on line 7; mapped on line 27 |
| `SpecViewer.jsx` | `SchemaTable.jsx` | `import { SchemaOrTable }` + `components={{ table: SchemaOrTable }}` | ✓ WIRED | Import on line 6; mapped on line 26 |
| `SpecViewer.jsx` | `CrossLinkText.jsx` | `import { CrossLinkAnchor }` + `components={{ a: CrossLinkAnchor }}` | ✓ WIRED | Import on line 5; mapped on line 25 |
| `SpecViewer.jsx` | `rehype-slug` | `rehypePlugins={[rehypeSlug]}` | ✓ WIRED | Import on line 3; pass on line 31 |
| `SpecViewer.jsx` | `crossLinkPlugin.js` | `remarkPlugins` includes `remarkCrossLinks` | ✓ WIRED | Import on line 4; pass on line 30 |
| `crossLinkPlugin.js` | mdast tree | recursive `walk` mutates `node.children` in place | ✓ WIRED | walk function on lines 120–135; type checks for `'text'`, `'link'`, `'code'`, `'inlineCode'`, `'heading'` |
| `CrossLinkText.jsx` | DOM heading | `document.querySelector('[id^="${prdId}"]')` inside onClick | ✓ WIRED | Line 69; click-time only (NOT during render — see Plan 02 SUMMARY decision) |
| `CrossLinkText.jsx` | browser scroll | `target.scrollIntoView({behavior:'smooth', block:'start'})` | ✓ WIRED | Line 77 |
| `Pre.jsx` | `MermaidPre.jsx` | `import { MermaidBlock }` + dispatch on `language-mermaid` className | ✓ WIRED | Import on line 10; dispatch on lines 38–40 |
| `Pre.jsx` | `CopyButton.jsx` | `import { CopyButton }` + render in non-mermaid branch | ✓ WIRED | Import on line 11; render on line 44 |
| `MermaidPre.jsx` | mermaid npm package | dynamic `import('mermaid')` inside useEffect | ✓ WIRED | Line 27 |
| `CopyButton.jsx` | browser clipboard | `navigator.clipboard.writeText(text)` | ✓ WIRED | Line 34 |
| `SchemaTable.jsx` | `SchemaTable.helpers.js` | `import { isSchemaHeader, extractHeaderCells, extractBodyRows, detectFkType }` | ✓ WIRED | Line 2 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `crossLinkPlugin.js` walker | `tree.children` (mdast) | react-markdown's remark pipeline (real markdown text) | Yes — receives the parsed AST of the dated spec | ✓ FLOWING |
| `CrossLinkAnchor` props | `props['data-prd-id']` | `crossLinkPlugin.js#buildLinkNode` writes `hProperties: { 'data-prd-id': anchor }` | Yes — but depends on hast-util-to-jsx-runtime kebab-case forwarding (WR-04 risk) | ⚠️ STATIC — code-verified that the plugin emits the property in kebab-case; browser inspection of the rendered DOM is the only programmatic check that the prop survives the toolchain unchanged |
| `MermaidBlock` source extract | `children.props.children` | react-markdown's `<pre><code className="language-mermaid">{rawSource}</code></pre>` for fenced mermaid blocks | Yes — when blocks exist | ✓ FLOWING (no mermaid blocks in dated spec, but fixture exercises the path) |
| `SchemaOrTable` headerCells | `extractHeaderCells(children)` walks `<thead><tr><th>` from react-markdown's table render | Yes — 20 schema tables in dated spec; helper unit-tested against equivalent shapes | ✓ FLOWING (helper unit tests pass; live render needs browser confirmation) |
| `CopyButton` text prop | `Pre.jsx#getCodeText(children)` walks `<code>` string children | react-markdown emits raw fenced source as `<code>`'s child string | Yes (when blocks exist; dated spec has zero, fixture exercises) | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| Unit tests (cross-link plugin + schema-card helpers) | `npm test` | 21 passed / 0 failed / 51ms; `tests 21 pass 21 fail 0` | ✓ PASS |
| Clean production build | `rm -rf app/dist && npm run build` | exit 0; built in 7.99s; mermaid in separate lazy chunk | ✓ PASS |
| Manifest excludes underscore fixtures | `node scripts/build-manifest.mjs` then read manifest.json | 1 entry (`2026-04-26.md`); 3 fixtures correctly skipped with reason `filename does not match YYYY-MM-DD.md` | ✓ PASS |
| Lazy-load: entry chunk free of mermaid vocab | `grep -lE "flowchart\|mermaidAPI" app/dist/assets/index-CU0WdlXe.js` | no matches → entry chunk does NOT contain mermaid-internal vocab | ✓ PASS |
| Lazy-load: mermaid chunk exists | `ls app/dist/assets/ \| grep -i mermaid.core` | `mermaid.core-BpET4WTy.js` present (260.73 KB raw / 72.47 KB gzipped) | ✓ PASS |
| No brand color hard-coded in Phase 2 components | `grep -nE "#2c8d4f" app/src/components/*.{jsx,css}` | no matches → Phase 4 theming hand-off intact | ✓ PASS |
| rehype-raw NOT imported (T-02-01-02 mitigation) | `grep -E "from 'rehype-raw'\|require\\('rehype-raw'\\)" app/src/SpecViewer.jsx` | no matches; only documentary JSDoc reference | ✓ PASS |
| Schema-table count in dated spec | `grep -c "^\| Field" project-spec/2026-04-26.md` | 20 (matches Plan 04 SUMMARY's expected count) | ✓ PASS |
| Cross-link references in dated spec | `grep -E "\\(see PRD-" project-spec/2026-04-26.md` | 0 matches → confirms fixtures are the verification surface, not the dated spec | ✓ PASS (consistent with plan documentation) |
| Bundle main entry under 100 KB gz | inspect `dist/assets/index-CU0WdlXe.js` gzipped size | 100.48 KB gz (0.48 KB OVER soft budget) | ⚠️ SOFT-EXCEEDED (orchestrator noted non-blocking) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| REND-02 | 02-01-foundation-PLAN.md, 02-02-cross-links-PLAN.md | User can click any inline `(see PRD-X.Y)` reference and the page scrolls to the matching PRD heading | ✓ SATISFIED (code) / ? NEEDS HUMAN (visual) | Plugin + click handler + 10 tests + fixture all in place. End-to-end browser verification deferred to wave UAT (see Human Verification section). |
| REND-03 | 02-01-foundation-PLAN.md, 02-04-schema-card-PLAN.md | Data-model tables (3-column Field/Type/Notes) render as styled schema cards while non-data-model tables render as standard tables | ✓ SATISFIED (code) / ? NEEDS HUMAN (visual) | Helpers + dispatcher + CSS + 11 tests in place. 20 schema tables identified in dated spec. End-to-end browser verification deferred. |
| REND-04 | 02-01-foundation-PLAN.md, 02-03-mermaid-PLAN.md | User sees diagrams rendered live for ` ```mermaid ` blocks; Mermaid loads on demand | ✓ SATISFIED (code+lazy-load) / ? NEEDS HUMAN (SVG render) | Component + dynamic import + securityLevel:'strict' + parse-error banner all in place. Lazy-load programmatically verified at build time. End-to-end SVG render verification deferred. |
| REND-05 | 02-01-foundation-PLAN.md, 02-05-copy-code-PLAN.md | User can click a copy-to-clipboard button on any code block to copy its contents | ✓ SATISFIED (code) / ? NEEDS HUMAN (clipboard) | CopyButton + dispatcher + fallback + fixture all in place. End-to-end clipboard verification deferred. |

All four phase requirements have full code coverage with test infrastructure. No orphaned requirements (every REQUIREMENTS.md ID for Phase 2 is claimed by at least one plan).

### Anti-Patterns Found

Code review (`02-REVIEW.md`) identified 0 critical, 4 warnings, 6 info findings. None are blocking; all are tracked.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `CopyButton.jsx` | 36 | `setTimeout` callback fires after unmount; not cleared via `useRef` + `useEffect` cleanup | ⚠️ Warning (WR-01) | StrictMode console warning if user navigates within 1500ms feedback window; minor leak; race on rapid double-copy. Not blocking; noted for Phase 4 cleanup. |
| `Pre.jsx` | 38 | `cls.includes('language-mermaid')` substring match too loose; would match `language-mermaidian` | ⚠️ Warning (WR-02) | No language alias collides today. Tokenized split would be more idiomatic. Not blocking. |
| `CrossLinkText.jsx` | 69 | `document.querySelector('[id^="${prdId}"]')` interpolates without CSS.escape — relies on upstream regex constraint | ⚠️ Warning (WR-03) | The plugin's regex is `PRD-\d+(?:\.\d+)?` so `prdId` is always `[a-z0-9-]+` — safe today. Defense-in-depth gap if a future plugin produces a malformed prdId. Not blocking. |
| `CrossLinkText.jsx` | 37 | `props['data-prd-id']` depends on hast-util-to-jsx-runtime kebab-case convention; no end-to-end render test | ⚠️ Warning (WR-04) | Silent-failure risk if toolchain changes casing. Mitigations: defensively read both `props['data-prd-id'] ?? props.dataPrdId`; add a JSDOM render test. **Browser DOM inspection during human UAT is the only programmatic check today** (see Human Verification item 11). Not blocking — current toolchain confirmed working at build time. |
| `Pre.jsx` | 43 | Inline `style={{position: 'relative'}}` bypasses CSS layer; would break under strict CSP | ℹ️ Info (IN-01) | Non-blocking; Phase 4 may consolidate. |
| `CopyButton.jsx` | 15 | `_warned` flag shared between "API unavailable" and "permission denied" branches; warning message is misleading for the latter | ℹ️ Info (IN-02) | Minor polish. Not blocking. |
| `MermaidPre.jsx` | 57 | `useId()` sanitization could produce empty IDs in unfamiliar environments | ℹ️ Info (IN-03) | Forward-compat hardening. Not blocking. |
| `crossLinkPlugin.js` | 28, 32 | Module-level `/g` regex `lastIndex` state is fragile under future recursion/async refactors | ℹ️ Info (IN-04) | Currently safe (synchronous walker, explicit `lastIndex = 0` resets). Idempotency Test 10 catches simple regressions. |
| `SchemaTable.jsx` | 55–61 | `readChildText` byte-identical to private `readText` in helpers.js | ℹ️ Info (IN-05) | Tree-shaking does not justify duplication; export from helpers and import. Minor cleanup. |
| `package.json` | 19 | `npm test` glob matches only one directory level | ℹ️ Info (IN-06) | Phase 3+ may need recursive glob; no impact today. |

### Human Verification Required

(Detailed test scripts in YAML frontmatter; the orchestrator should persist this section as `02-HUMAN-UAT.md`.)

#### 1. Cross-link click navigation against the dated spec

**Test:** Activate the cross-link fixture (rename `_phase2-cross-link-fixture.md` → `2099-01-01.md`), restart `npm run dev`. Click `PRD-1`, `PRD-3.4`, and the two tokens in the comma-separated list.
**Expected:** Each click smooth-scrolls to the matching in-fixture heading; URL hash updates to `#prd-1...`, `#prd-3-4...`, etc.; no console errors.
**Why human:** Smooth scroll, hash mutation via `history.replaceState`, click handler against live DOM — all browser-only behaviors.

#### 2. Cross-link broken-target fallback UX

**Test:** Click `PRD-99` inside `(see PRD-99)`.
**Expected:** Link transforms in place to a dimmed `<span class="cross-link cross-link--broken">` with `title="PRD-99 not found in current spec"`; console shows EXACTLY one `[spec-viewer] cross-link: PRD-99 not found` warning; second click on dimmed span does nothing. Negative cases: bare `PRD-1`, `(see PRD-1)` inside backticks, `(see PRD-1)` inside fenced ` ```text `, and `### PRD-XX placeholder heading` are NOT linked.
**Why human:** Render-loop state flip, console dedupe, DOM presence/absence of click handlers.

#### 3. Schema-card rendering across the real dated spec

**Test:** Run `npm run dev` against the real `2026-04-26.md`. Scroll through PRD-0, PRD-1, PRD-3.
**Expected:** All 20 `Field|Type|Notes` tables render as cards (rounded border, light background, monospace field name, type chip). Backslash-escaped underscores render literal (`created\_by`). `FK → User` chips have a subtle `--fk` border. Computed border resolves from `var(--schema-card-border)`. No `#2c8d4f` in computed styles. Mobile <640px collapses to vertical stack.
**Why human:** Visual layout, fonts, computed-style theming sources, and react-markdown@9 → React table-children shape behavior require browser confirmation.

#### 4. Schema-card NEGATIVE case (non-Field/Type/Notes 3-col tables)

**Test:** Find any 3-column non-data-model table in the dated spec (planning grep returned 0; structural assertion). Confirm action-item / decision tables render as plain markdown tables.
**Expected:** Detection is conservative (D-08); non-schema 3-col tables fall through to default `<table>`.
**Why human:** Browser observation of live render confirms the dispatcher routes correctly under real react-markdown output.

#### 5. Mermaid lazy-load on the dated spec

**Test:** Run `npm run dev`, open DevTools Network tab, reload.
**Expected:** Zero requests for `mermaid*.js`, `flowchart-*`, or any other mermaid sub-chunk. No console errors.
**Why human:** Network requests are runtime-only; build-time chunk audit (already passed) only confirms the structural separation.

#### 6. Mermaid valid-diagram render

**Test:** Activate the mermaid fixture (rename `_phase2-mermaid-fixture.md` → `2099-01-01.md`). Restart and reload.
**Expected:** `flowchart LR` renders as an SVG with 6 labeled nodes. Network tab shows mermaid chunk requests. No `#2c8d4f` in SVG inline styles.
**Why human:** SVG render is browser-only output.

#### 7. Mermaid parse-error banner

**Test:** Same fixture, scroll to the broken diagram (`this is not valid mermaid syntax !!!`).
**Expected:** Red banner reads `Mermaid parse error: ...`; original source shown as `<pre>` below banner; first valid diagram still rendered. Cleanup: rename back.
**Why human:** Banner styling, role=alert, render-time error path are browser-only.

#### 8. Copy-button visibility on bash and JSON code blocks

**Test:** Activate the codeblock fixture (rename `_phase2-codeblock-fixture.md` → `2099-01-02.md`). Restart and reload.
**Expected:** Bash and JSON blocks each show a top-right copy button at ~60% opacity. Click → checkmark for ~1.5s → reverts. Pasted content matches source byte-for-byte (newlines + indentation preserved).
**Why human:** Visual button state, hover transition, clipboard contents.

#### 9. Copy-button mermaid exclusion (D-13) and inline-code exclusion

**Test:** Same fixture. Scroll to mermaid block; confirm SVG render with NO copy button. Find inline backtick references; confirm NO copy button.
**Expected:** D-13 enforcement: dispatcher routes mermaid to MermaidBlock (no button) and inline code is left untouched (button only on `<pre>`).
**Why human:** Render-time dispatch decision; presence/absence in DOM.

#### 10. Copy-button fallback path (clipboard API unavailable)

**Test:** Open DevTools Console; run `Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true})`; click any copy button; verify single `clipboard API unavailable` warning; second click produces no additional warning. Restore via the original-binding object. Cleanup: rename codeblock fixture back.
**Expected:** Silent UI; one warning per page lifetime.
**Why human:** Runtime mutation of `navigator.clipboard` is browser-only; console dedupe is observable only in a live console.

#### 11. Cross-link prop-passing wiring (WR-04 mitigation)

**Test:** With cross-link fixture activated, open DevTools Elements panel; locate a rendered `<a>` for `PRD-1`; verify it has `class="cross-link"` AND `data-prd-id="prd-1"` (kebab-case).
**Expected:** Attribute survives the react-markdown@9 → `hast-util-to-jsx-runtime` → React props pipeline in kebab-case form.
**Why human:** No unit test asserts this; browser DOM inspection is the only programmatic check. Silent-failure mode if toolchain ever camelCases the attribute.

### Gaps Summary

**No blocking gaps.** All four ROADMAP success criteria are satisfied at the code/artifact/wiring level, with all 21 unit tests passing and a clean production build. The mermaid lazy-load is structurally proven by build-time chunk inspection (entry chunk is mermaid-vocab-free; mermaid runtime is in a separate ~72 KB gzipped chunk).

**Status is `human_needed`** because every one of the four success criteria culminates in a visual / interactive behavior that cannot be observed from CLI: smooth scroll, hash mutation, dimmed-span swap, schema-card visual layout, SVG diagram render, copy-button checkmark animation, clipboard contents. The code review (`02-REVIEW.md`) flagged 4 warnings and 6 info items; none are blocking, but WR-04 (data-prd-id prop-passing convention) is partially mitigated by the human DOM-inspection step (Human Verification item 11) and could be hardened in a follow-up by reading both kebab and camelCase forms defensively + adding a JSDOM render test.

**Bundle budget:** main entry is 100.48 KB gz, 0.48 KB over the 100 KB soft budget (orchestrator noted non-blocking). The mermaid runtime is correctly isolated. No regression risk to the lazy-load contract.

**Phase boundary respected:** Phase 2 ships structurally complete and visually neutral as CONTEXT.md specifies. Brand theming (Phase 4), hash deep-linking + sidebar + search (Phase 3), and Netlify cutover (Phase 5) are correctly deferred and have explicit hand-off surfaces (CSS custom properties, rehype-slug heading IDs, working `dist/` output).

---

_Verified: 2026-04-26T23:00:00Z_
_Verifier: Claude (gsd-verifier)_
