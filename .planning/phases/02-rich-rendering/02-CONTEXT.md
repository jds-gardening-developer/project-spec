# Phase 2: Rich Rendering - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 2 layers four interactive renderers on top of the Phase 1 `SpecViewer` (`react-markdown` + `remark-gfm`):

1. **REND-02** — Inline `(see PRD-X.Y)` references become in-page links that scroll to the matching PRD heading
2. **REND-03** — `Field | Type | Notes` data-model tables render as schema cards; other 3-column tables remain plain markdown tables
3. **REND-04** — ` ```mermaid ` fenced blocks render as live diagrams; Mermaid loads on demand, not in the main bundle
4. **REND-05** — Code blocks get a copy-to-clipboard button

Out of scope (other phases): sidebar navigation and hash deep-linking (Phase 3), Cmd+K search (Phase 3), full brand theming including MacPlants green `#2c8d4f` (Phase 4), Netlify build/publish migration (Phase 5).

The natural integration seam is the `components` prop on `<ReactMarkdown>` in [app/src/SpecViewer.jsx](app/src/SpecViewer.jsx) — Phase 1 left it empty for exactly this purpose.

</domain>

<decisions>
## Implementation Decisions

### Mermaid Behavior (user-decided)

- **D-01: Theme** — Use Mermaid's default light theme in Phase 2. Phase 4 owns brand theming and will pass MacPlants green `#2c8d4f` via Mermaid's `themeVariables` configuration. Phase 2 must NOT hard-code colors that would conflict with a later theme switch.
- **D-02: Lazy-load trigger** — Scan the rendered markdown for ` ```mermaid ` fenced blocks; if at least one is present, dynamically `import('mermaid')`. If the document has zero mermaid blocks (which is true of today's `2026-04-26.md`), Mermaid bytes are not shipped. This satisfies the PROJECT.md "loads on demand" constraint precisely.
- **D-03: Parse-error UX** — On Mermaid parse error, render a small visible error banner ("Mermaid parse error: {message}") above the original ` ```mermaid ` source. Spec authors edit markdown directly and need to see both their input and what broke.

### PRD Cross-Link Navigation (Claude's Discretion)

- **D-04: Detection patterns** — Match the literal string `(see PRD-X)` and `(see PRD-X.Y)` in body text, including comma-separated lists like `(see PRD-1, PRD-3.4)`. Detection runs on text nodes only — never inside fenced code blocks, inline code, or heading text. Bare `PRD-X.Y` (no `see` prefix) is NOT auto-linked, to avoid false positives in heading text and tables.
- **D-05: Anchor strategy** — Add `rehype-slug` to the `<ReactMarkdown>` pipeline. PRD headings like `## **PRD-1.1: Plant Variants**` get IDs derived by slug (e.g., `prd-1-1-plant-variants`); cross-links resolve a target by scanning the rendered DOM for `[id^="prd-1-1"]` (prefix match on the PRD identifier portion).
- **D-06: Broken-link fallback** — If no matching heading is found, render the reference as a dimmed `<span>` (not a link) with a `title` attribute reading "PRD-X.Y not found in current spec" and emit a single `console.warn("[spec-viewer] cross-link: PRD-X.Y not found")`. Visible to the author during review without breaking the read for the client.
- **D-07: Click behavior** — `event.preventDefault()` + `element.scrollIntoView({behavior: 'smooth', block: 'start'})`. Update `location.hash` to `#prd-x-y` so the URL reflects the current section. (Hash deep-linking on initial load is Phase 3's job — Phase 2 only writes the hash on click.)

### Schema-Card Renderer (Claude's Discretion)

- **D-08: Detection rule** — A `<table>` becomes a schema card iff it has exactly 3 columns AND its `<thead>` row text content, lowercased and trimmed, is `["field", "type", "notes"]`. Implementation: the custom `table` component in `components` reads its first child `thead > tr > th` cells, decides schema vs plain, and routes accordingly. This precisely excludes other 3-column tables in the spec (e.g., `Decision | Rationale | Outcome`, `Stage | Status | Reason`, `Feature | Reason`).
- **D-09: Visual layout** — **Card-per-table**: the whole table becomes one card (rounded border, subtle background) titled by the preceding `####` sub-header text (e.g., "Plants", "Plant Variants") when present. Each table row is a horizontal "field row" containing: field name in monospace (left), type chip (middle, monospace, neutral background), notes (right, prose). Mirrors the database-schema mental model and stays compact for a 14-PRD spec with dozens of fields. Card-per-row would generate too much vertical noise.
- **D-10: Field-name handling** — Field names in the spec contain backslash-escaped underscores (`created\_by`, `last\_updated\_at`) — these are part of the markdown convention and must NOT be unescaped. Render the literal text `react-markdown` produces; do not strip backslashes.
- **D-11: FK markers** — Type values like `FK → Plant` should render as a chip with the arrow preserved (no special parsing in Phase 2). If users want clickable FK navigation later, that's a future phase, not scope creep here.
- **D-12: Theming boundary** — Phase 2 ships the card with neutral structural styling (border, padding, monospace for field/type, layout grid). Phase 4 applies MacPlants green to chip backgrounds and card accents. Use CSS custom properties (e.g., `--schema-card-accent`) so Phase 4 can re-theme without touching Phase 2 component code.

### Copy-Code Button (Claude's Discretion)

- **D-13: Scope** — Apply the copy button to all fenced code blocks EXCEPT ` ```mermaid ` (those render as diagrams, not as readable code). Inline `code` is excluded. The custom `pre` component checks `children.props.className` for `language-mermaid` and skips the button.
- **D-14: Visibility** — Always visible, positioned top-right of each `<pre>`, with low contrast so it doesn't dominate. Hover-only adds discovery friction (especially on touch devices) and breaks parity with the current Docsify behavior the client is used to.
- **D-15: Feedback** — On click, copy via `navigator.clipboard.writeText(textContent)`. Swap the icon from clipboard to checkmark for 1500ms, then revert. No tooltip, no toast — minimal motion, recognizable pattern.
- **D-16: Failure handling** — If `navigator.clipboard` is unavailable (insecure context / older browser), the button silently does nothing AND logs `console.warn("[spec-viewer] clipboard API unavailable")`. The site is HTTPS-only on Netlify, so this is an edge case for local file:// previews.

### Cross-Cutting

- **D-17: react-markdown integration pattern** — All four renderers attach via the `components` prop on `<ReactMarkdown>` (custom `p`, `table`, `pre`, plus a `remarkPlugin` or `components.text` strategy for cross-links). No `rehype-raw`, no MDX. The `SpecViewer` stays a pure functional component that receives markdown text and renders enriched output.
- **D-18: Plugin choice** — Add `rehype-slug` (for D-05). Cross-link detection itself is a custom remark plugin OR a custom `text` component; planner picks the cleanest implementation.
- **D-19: Phase 4 deferral** — Component CSS in Phase 2 uses CSS custom properties for any color or spacing that Phase 4 will rebrand. Structural CSS (layout, monospace, borders) lives directly in component styles.

### Claude's Discretion

The user explicitly asked Claude to pick defaults for cross-link detection, schema cards, and copy-code UX after locking the Mermaid decisions. All choices above marked "(Claude's Discretion)" are reasonable defaults documented for the planner. The user retains the right to override any of D-04 through D-19 by editing this file before `/gsd-plan-phase 2` runs.

### Folded Todos

None — no pending todos surfaced via `gsd-tools todo match-phase` for Phase 2.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Goal & Acceptance Criteria
- `.planning/REQUIREMENTS.md` — REND-02 through REND-05 acceptance text (lines 18–21). The verifier checks must-haves against this.
- `.planning/ROADMAP.md` §"Phase 2: Rich Rendering" — Goal statement and 4 success criteria.

### Project Constraints & Decisions
- `.planning/PROJECT.md` §Constraints — Stack lock (Vite + React + react-markdown + remark-gfm), bundle budget (<100KB gz excl. Mermaid), brand color, no SSR/MDX, Phase 4 owns theming.
- `.planning/PROJECT.md` §Out of Scope — Confirms what Phase 2 does NOT touch.
- `.planning/STATE.md` — Current phase position and accumulated context.

### Existing Codebase (Phase 1 output)
- `app/src/SpecViewer.jsx` — Pure component to extend. Currently `<ReactMarkdown remarkPlugins={[remarkGfm]}>` with no custom components. The `components` prop is the integration seam.
- `app/src/App.jsx` — Composition root; loads newest spec via `import.meta.glob` and passes markdown text to `SpecViewer`.
- `app/src/styles.css` — Phase 1 left this minimal intentionally; Phase 4 owns the full brand pass. Phase 2 adds component-scoped structural CSS.
- `app/package.json` — Current deps: `react-markdown@^9.0.1`, `remark-gfm@^4.0.0`. Phase 2 adds: `mermaid`, `rehype-slug` (and possibly a remark plugin for cross-links if planner picks that route).
- `app/vite.config.js` — Allows `../../project-spec` via `server.fs.allow`. No changes expected here in Phase 2.

### Content to Render (sample inputs for testing)
- `project-spec/2026-04-26.md` — The 70KB spec. Contains: many `(see PRD-X.Y)` cross-references, ~10+ `Field | Type | Notes` data-model tables, several non-data-model 3-column tables that must NOT become cards, fenced code blocks (`bash`, `json`), zero mermaid blocks (Phase 2 must work even when no mermaid is present).

### Codebase Patterns
- `.planning/codebase/STACK.md` — Stack details, dependency rationale.
- `.planning/codebase/CONVENTIONS.md` — Code style for `app/`.
- `.planning/codebase/ARCHITECTURE.md` — Layered overview (content / presentation / tooling / deploy).
- `.planning/codebase/STRUCTURE.md` — Where files live.

### Phase 1 Artifacts (for continuity)
- `.planning/phases/01-foundation/01-VERIFICATION.md` — Confirms Phase 1 acceptance.
- `.planning/phases/01-foundation/01-02-SUMMARY.md` — How the Phase 1 viewer ended up wired.
- `.planning/phases/01-foundation/01-HUMAN-UAT.md` — 2 outstanding UAT items (GFM render + HMR confirmation) that don't block Phase 2 planning.

No external ADRs or specs — all design decisions are captured in the project's own `.planning/` artifacts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets

- `<ReactMarkdown>` from `react-markdown@9` (already installed) — the `components` prop accepts custom renderers keyed by HTML element name. Phase 2 attaches `p`, `table`, `pre`, and possibly `text` here. No new framework needed.
- `remark-gfm@4` (already installed) — keeps GFM tables/strikethrough working. Phase 2 plugins compose alongside it.
- `import.meta.glob` raw-loader pattern in `App.jsx` — Phase 2 doesn't change this; markdown text continues to flow `App.jsx → SpecViewer.jsx`.

### Established Patterns

- Phase 1 left `SpecViewer.jsx` deliberately tiny with explicit "out of scope here" comments naming each Phase 2 requirement. Honor that contract: Phase 2 work happens inside `SpecViewer.jsx` and any new sibling components, not in `App.jsx`.
- Component-scoped CSS lives next to the component (no global styles beyond `styles.css`). Phase 4 will likely consolidate; Phase 2 should not pre-empt that.
- ESM throughout, no TypeScript (the current app is `.jsx`, not `.tsx`). Stay consistent — no TS migration in this phase.

### Integration Points

- `<SpecViewer markdown={content}>` is the single entry point. All four Phase 2 features attach inside it.
- `app/package.json` for new deps. Use `mermaid` (latest stable v10+) and `rehype-slug`. Estimate ~30KB gz for `rehype-slug`'s slug helper (negligible) and Mermaid is the dynamic-import case.
- `vite.config.js` is unchanged — Mermaid's dynamic import is handled by Vite's code-splitting automatically; no manualChunks config needed.

</code_context>

<specifics>
## Specific Ideas

- The user wants Phase 2 to be **structurally complete and visually neutral**, not visually finished. Phase 4 owns the full brand pass. Components should expose CSS custom properties for any color/accent values so Phase 4 can theme without rewriting JSX.
- Mermaid behavior was the only area the user wanted to discuss — the other three were left to Claude's discretion, signaling trust in reasonable defaults rather than disengagement. The defaults above must be conservative and reversible.

</specifics>

<deferred>
## Deferred Ideas

- **Clickable FK relationships** — `FK → Plant` rendering as a hyperlink that jumps to the Plant data-model card. Interesting future enhancement; not in REND-03 scope. Capture as v2 idea if user wants it.
- **Cross-link checker as CI step** — Currently logged as v2 (`.planning/REQUIREMENTS.md`). Phase 2's broken-link console warning is the manual fallback.
- **Heading anchor `#` icons on hover** — Common doc-site pattern, would pair well with `rehype-slug`. Belongs in Phase 3 or Phase 4 alongside sidebar/theme work, not Phase 2.
- **Mermaid pan/zoom** — Diagrams can get complex. svg-pan-zoom adds another dep. Defer; revisit if real diagrams demand it.

</deferred>

---

*Phase: 02-rich-rendering*
*Context gathered: 2026-04-26*
