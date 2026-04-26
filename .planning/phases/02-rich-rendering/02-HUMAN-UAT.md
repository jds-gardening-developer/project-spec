---
status: partial
phase: 02-rich-rendering
source: [02-VERIFICATION.md]
started: 2026-04-26T22:15:00Z
updated: 2026-04-26T22:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Cross-link click navigation against the dated spec
expected: After `npm run dev`, open the viewer in a browser. The current dated spec (`2026-04-26.md`) contains zero `(see PRD-X.Y)` parenthesized references — that is intentional. To exercise REND-02 against the in-fixture cases, rename `project-spec/_phase2-cross-link-fixture.md` → `project-spec/2099-01-01.md` and restart `npm run dev`. The header should read `Viewing: project-spec/2099-01-01.md`. Then perform: (a) click `PRD-1` inside `(see PRD-1)` — the page must smooth-scroll to `## PRD-1: Sample Section` and the URL bar must show `#prd-1...`. (b) Click `PRD-3.4` inside `(see PRD-3.4)` — smooth scroll to `## PRD-3.4: Decimal Section`; URL shows `#prd-3-4...`. (c) In `(see PRD-1, PRD-3.4)` confirm two distinct linked tokens; each navigates independently. After verification, rename the fixture back.
result: [pending]

### 2. Cross-link broken-target fallback UX
expected: With the cross-link fixture activated, click `PRD-99` inside `(see PRD-99)`. Confirm: (1) link transforms to a dimmed span (greyed, `not-allowed` cursor, dotted underline), (2) tooltip reads `PRD-99 not found in current spec`, (3) console shows EXACTLY ONE warning containing `[spec-viewer] cross-link: PRD-99 not found`, (4) clicking the dimmed span does nothing. Negative checks: bare `PRD-1` (no `(see ` prefix) renders as plain text; `(see PRD-1)` inside backticks renders as monospaced code; same string inside a fenced ` ```text ` block stays preformatted; `### PRD-XX placeholder heading` is not auto-linked.
result: [pending]

### 3. Schema-card rendering across the real dated spec
expected: Run `npm run dev` against the real dated `project-spec/2026-04-26.md` (20 schema tables present). Scroll to PRD-0 / `Users (Internal Staff)`. Confirm: (1) the Field|Type|Notes table renders as a card (rounded border, light background, one row per field), NOT a plain HTML table, (2) field names in monospace, (3) type column shows a chip per row, (4) backslash escapes visible (`created\_by` shows the literal backslash), (5) `FK → User` chip has subtle border (the `--fk` modifier). Scroll to PRD-1 sub-tables (Plants, Plant Variants, Plant Batches) and PRD-3 order tables — each renders as a card. DevTools: confirm computed border resolves from `var(--schema-card-border)`, chip background from `var(--schema-card-type-background)`. No `#2c8d4f` in computed styles. Mobile: resize <640px, field rows must collapse to vertical stack.
result: [pending]

### 4. Schema-card NEGATIVE case (non-Field/Type/Notes 3-col tables)
expected: On the real dated spec, find any 3-column table that is NOT `Field | Type | Notes` (decision tables, action items). Confirm any such tables render as plain markdown tables, not schema cards. With cross-link fixture activated, confirm fixture's headings like `## PRD-1: Sample Section` exist with rehype-slug IDs (`prd-1-sample-section`).
result: [pending]

### 5. Mermaid lazy-load on the dated spec
expected: Run `npm run dev`. Open DevTools → Network. Reload. The dated spec has zero ` ```mermaid ` blocks. Confirm: (1) no Network request for any `mermaid*.js`, (2) no `flowchart-*` / `mermaid.core-*` chunks requested, (3) page renders normally with no mermaid-related console errors. (Build-time audit already proved entry chunk lacks `flowchart` / `mermaidAPI` strings.)
result: [pending]

### 6. Mermaid valid-diagram render
expected: Rename `project-spec/_phase2-mermaid-fixture.md` → `project-spec/2099-01-01.md`. Restart `npm run dev`. Confirm: (1) header reads `Viewing: project-spec/2099-01-01.md`, (2) the `flowchart LR` (User → SpecViewer → language-mermaid? → MermaidBlock → SVG diagram) renders as an SVG flowchart with boxes and arrows, (3) DevTools Network now shows mermaid chunks, (4) no console errors for the valid diagram. Inspect the SVG: no `#2c8d4f` in inline styles (Phase 4 introduces brand color via mermaid `themeVariables`).
result: [pending]

### 7. Mermaid parse-error banner
expected: Same fixture (renamed). Scroll to second mermaid block (intentionally broken: `this is not valid mermaid syntax !!!`). Confirm: (1) red banner reads `Mermaid parse error: ...`, (2) below the banner, original broken source shows as `<pre>`, (3) the first valid diagram still renders correctly (one broken block doesn't break the page). Cleanup: rename back.
result: [pending]

### 8. Copy-button visibility on bash and JSON code blocks
expected: Rename `project-spec/_phase2-codeblock-fixture.md` → `project-spec/2099-01-02.md`. Restart `npm run dev`. Header reads `Viewing: project-spec/2099-01-02.md`. Confirm: (1) bash block shows a small copy-icon button at top-right (~60% opacity, more prominent on hover), (2) JSON block shows the same button. Click bash button: (3) icon swaps to checkmark, (4) reverts to clipboard after ~1.5s, (5) paste into a text editor — clipboard contains the exact bash source. Repeat for JSON block.
result: [pending]

### 9. Copy-button mermaid exclusion (D-13)
expected: Same fixture. Scroll to mermaid block. Confirm: (1) renders as SVG flowchart, (2) NO copy-icon button on or around the diagram, (3) original mermaid source text NOT visible (replaced by SVG). Inline-code exclusion: scroll to a paragraph with `npm run dev` in inline backticks; confirm NO copy button on inline code.
result: [pending]

### 10. Copy-button fallback path (clipboard API unavailable)
expected: With codeblock fixture active, open DevTools Console. Run: `const orig = navigator.clipboard; Object.defineProperty(navigator, 'clipboard', {value: undefined, configurable: true});`. Click any copy button. Confirm: (1) nothing visible happens, (2) console shows EXACTLY ONE warning containing `clipboard API unavailable`, (3) clicking the same button again produces NO additional warning. Restore: `Object.defineProperty(navigator, 'clipboard', {value: orig, configurable: true});`. Cleanup: rename fixture back.
result: [pending]

### 11. Cross-link prop-passing wiring (WR-04 mitigation)
expected: With cross-link fixture activated, open DevTools Elements panel. Find a rendered `<a>` for `PRD-1` inside `(see PRD-1)`. Confirm: (1) element has class `cross-link`, (2) element has `data-prd-id` attribute with value `prd-1` (kebab-case), (3) clicking produces smooth-scroll. If the attribute appears as `dataPrdId` (camelCase) or is missing, the wiring is broken silently.
result: [pending]

## Summary

total: 11
passed: 0
issues: 0
pending: 11
skipped: 0
blocked: 0

## Gaps
