# Phase 3: Navigation & Search - Context

**Gathered:** 2026-04-26
**Status:** Ready for planning

<domain>
## Phase Boundary

Phase 3 layers three navigation/discovery affordances on top of the rendered spec:

1. **NAV-01..03** — Left sidebar lists every H2 PRD entry; H3 sub-headings auto-expand for the section currently in view; clicking any entry scrolls to that section and updates `location.hash`
2. **NAV-04** — On initial load, if the URL contains a hash like `#prd-1.1`, the viewer scrolls to that section once content has rendered
3. **SEA-01..03** — Cmd+K (macOS) / Ctrl+K (other) opens a search panel; build-time-indexed full-text search across all headings + body; clicking a result dismisses the panel and scrolls to the section

Out of scope (other phases): MacPlants green branding (Phase 4), Netlify build/publish migration (Phase 5).

The natural integration seam is `app/src/App.jsx` — Phase 3 introduces a layout wrapper around `<SpecViewer>` (sidebar + main column) and a portal/overlay for the search panel.

</domain>

<decisions>
## Implementation Decisions

### Sidebar Layout & Behavior (user-decided)

- **D-01: H3 expansion** — Auto-expand for active section only via scroll-spy. As the user scrolls, the H3 sub-headings under the currently-visible PRD expand; H3s under inactive PRDs stay collapsed. Matches Docsify's behavior, which is the explicit goal in ROADMAP § Phase 3.
- **D-02: Mobile breakpoint** — Drawer-with-hamburger pattern below 768px. Sidebar is hidden by default on mobile; a hamburger button in the top-left of the main content area slides it in from the left as an overlay. Reading area gets full width. Above 768px the sidebar is persistent.
- **D-03: Active-section indicator** — Left accent bar (3-4px vertical strip on the left edge of the active entry) plus bolded text. Phase 4 will color the bar with `#2c8d4f`; Phase 3 ships it in a neutral structural color via CSS custom property. Mirrors VS Code / Docusaurus active-state pattern.
- **D-04: Sidebar header** — None. The first sidebar entry is the first PRD heading. Site title ("MacPlants ERP") and any branding header are deferred entirely to Phase 4 (BRD-04). Phase 3's sidebar is structurally neutral nav-only.

### Search Library & Index (Claude's Discretion)

- **D-05: Library** — **MiniSearch** (over FlexSearch). Smaller bundle (~14KB gz vs ~28KB gz), idiomatic JS API, sufficient for the ~70KB spec scope. The bundle budget (PROJECT.md "Bundle (soft) <100KB gz excl. Mermaid") is already at 100.48 KB after Phase 2; the smaller library leaves more headroom for sidebar + search UI code without exceeding the budget materially.
- **D-06: Index timing** — Build-time. A new build script (`scripts/build-search-index.mjs`) reads each `project-spec/*.md` listed in the manifest, walks headings + paragraph text, and emits `app/src/search-index.json`. The React app imports this JSON statically (Vite tree-shakes if Cmd+K never opens; first open hydrates MiniSearch from the prebuilt records). Avoids parsing the spec at runtime which would make Cmd+K's first open feel sluggish.
- **D-07: Index granularity** — One record per heading (H1, H2, H3). Each record carries: `id` (the rehype-slug heading ID), `title` (heading text), `prd_id` (the parent PRD-N if applicable), `body` (paragraph text under the heading until the next heading of equal or higher level). This balances result precision against index size.

### Search UI (Claude's Discretion)

- **D-08: Shape** — Modal overlay, centered, ~640px wide on desktop, full-width on mobile. Backdrop dim, click-outside dismisses. Familiar pattern (VS Code Cmd+P, Linear, Raycast).
- **D-09: Trigger** — `Cmd+K` on macOS, `Ctrl+K` on Windows/Linux (detect via `navigator.platform` or `event.metaKey`/`event.ctrlKey`). `Esc` dismisses. `↑`/`↓` navigate results. `Enter` selects the active result. Click on any result also selects it.
- **D-10: Result format** — Each result line shows: heading text (bold), parent PRD context (small grey, e.g., "PRD-1 / Plants"), and a 1-line body snippet with the matched query terms highlighted (`<mark>` tags). Maximum 20 results displayed; user can keep typing to narrow.
- **D-11: Empty state** — When the search input is empty, show nothing (no "search through the spec" placeholder list, no recently-searched). Cleanest signal that the user is in control. Placeholder text in the input: "Search the spec..."
- **D-12: Selection behavior** — Clicking or `Enter` on a result: (1) dismisses the modal, (2) updates `location.hash` to the result's heading ID, (3) scrolls the heading into view via `scrollIntoView({behavior: 'smooth', block: 'start'})`. Reuses the same scroll mechanic as Phase 2's CrossLinkText for consistency.

### Hash Deep-Linking on Initial Load (Claude's Discretion)

- **D-13: Trigger timing** — On first content render (when `App.jsx`'s `content` state transitions from `null` → loaded markdown string and the `<SpecViewer>` has mounted), attempt to resolve `location.hash`. Use a single-shot effect that fires after the markdown is rendered to the DOM (one tick after content state changes). Hash listening for subsequent `hashchange` events is browser-native — no extra wiring needed since Phase 2 cross-links already use `location.hash` updates.
- **D-14: Unknown-hash handling** — If `location.hash` matches no element in the rendered DOM (after rehype-slug ID generation), silently do nothing. Page renders normally at the top; no error banner, no console warning, no alteration to the URL. Conservative: a stale link from a deleted PRD section should not loudly break the read experience.
- **D-15: Hash-to-ID mapping** — `rehype-slug` is already in the SpecViewer pipeline (Phase 2 D-05). Hash format `#prd-1-1` matches the slug it generates from `## **PRD-1.1: Plant Variants**` directly. No special parsing needed.

### Cross-Cutting

- **D-16: Layout architecture** — `App.jsx` becomes a thin layout shell: `<aside>` (sidebar) + `<main>` (existing SpecViewer). The sidebar is `position: sticky` on desktop with its own scroll inside the viewport. Below the breakpoint the sidebar collapses to the drawer pattern. No layout libraries — plain CSS grid or flex.
- **D-17: Scroll-spy mechanism** — `IntersectionObserver` (one observer for all H2/H3 elements, threshold tuned so the topmost visible heading wins). Avoids manual scroll listeners and per-frame work. Performance is appropriate for the ~70KB spec.
- **D-18: Sidebar source-of-truth** — Build the heading list from the rendered DOM after `SpecViewer` mounts (one `querySelector` pass for `h2[id], h3[id]`). The sidebar component receives this list via a callback or context. Avoids parsing the markdown twice or maintaining a parallel AST.
- **D-19: CSS theming boundary** — Phase 3 CSS uses CSS custom properties for any color/accent: `--sidebar-bg`, `--sidebar-active-bar`, `--search-modal-bg`, `--search-result-highlight`. Phase 4 overrides these with brand values. Phase 3 ships neutral structural colors only (no `#2c8d4f`).
- **D-20: Component file shape** — New components live under `app/src/components/`: `Sidebar.jsx` + `Sidebar.css`, `SearchPanel.jsx` + `SearchPanel.css`, `useScrollSpy.js` (hook), `useHashScroll.js` (hook for D-13/D-14). Plus `scripts/build-search-index.mjs` and the import target `app/src/search-index.json`. Mirrors Phase 2's per-feature file organization.

### Folded Todos

None — no pending todos surfaced for Phase 3.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Phase Goal & Acceptance Criteria
- `.planning/REQUIREMENTS.md` § NAV-01..04, SEA-01..03 — Acceptance text. Verifier checks must-haves against this.
- `.planning/ROADMAP.md` § "Phase 3: Navigation & Search" — Goal statement and 5 success criteria.

### Project Constraints & Decisions
- `.planning/PROJECT.md` § Constraints — Stack lock (Vite + React + react-markdown), bundle budget (<100KB gz excl. Mermaid — currently at 100.48 KB after Phase 2), brand color, Phase 4 owns theming.
- `.planning/PROJECT.md` § Out of Scope — Confirms what Phase 3 does NOT touch.
- `.planning/STATE.md` — Current phase position and accumulated context.

### Existing Codebase (Phase 1 + Phase 2 output)
- `app/src/App.jsx` — Composition root; loads newest spec via `import.meta.glob` and renders `<SpecViewer>`. Phase 3 wraps this in a layout shell.
- `app/src/SpecViewer.jsx` — `<ReactMarkdown>` with `remarkPlugins={[remarkGfm, crossLinkPlugin]}`, `rehypePlugins={[rehypeSlug]}`, `components={{table: SchemaOrTable, pre: Pre}}`. Heading IDs already exist via rehype-slug — Phase 3 consumes them directly.
- `app/src/components/CrossLinkText.jsx` — Click handler that does `scrollIntoView({behavior: 'smooth'})` + `location.hash` update. The same scroll mechanism is reused by sidebar entries and search results (D-12, D-17 hooks).
- `app/src/styles.css` — CSS custom properties surface declared in Phase 2 D-19. Phase 3 adds sidebar/search variables to the same surface.
- `app/package.json` — Current deps include `react-markdown@^9`, `remark-gfm@^4`, `mermaid@^10`, `rehype-slug@^6`. Phase 3 adds: `minisearch` (for D-05).
- `scripts/build-manifest.mjs` — Existing build hook pattern (predev/prebuild). Phase 3 adds a sibling `build-search-index.mjs` and wires it into the same hooks.

### Content to Render & Index
- `project-spec/2026-04-26.md` — The 70KB spec. Contains 14+ PRD H2 headings with H3 sub-headings, ~20 schema tables, fenced code blocks. Used as the canonical input for the search index.
- `project-spec/_phase2-*-fixture.md` — Underscore-prefixed fixtures used for Phase 2 UAT. The build-search-index script must mirror `build-manifest.mjs`'s exclusion of underscore-prefixed files (only `^YYYY-MM-DD\.md$` files are indexed).

### Codebase Patterns
- `.planning/codebase/STACK.md` — Stack details, dependency rationale.
- `.planning/codebase/CONVENTIONS.md` — Code style for `app/`.
- `.planning/codebase/ARCHITECTURE.md` — Layered overview.
- `.planning/codebase/STRUCTURE.md` — Where files live.

### Phase 2 Artifacts (for continuity)
- `.planning/phases/02-rich-rendering/02-CONTEXT.md` — D-05/D-19 establish the rehype-slug + CSS-custom-property contracts that Phase 3 inherits.
- `.planning/phases/02-rich-rendering/02-VERIFICATION.md` — Confirms the integration seam Phase 3 builds on.
- `.planning/phases/02-rich-rendering/02-01-foundation-SUMMARY.md` — Documents the styles.css custom-property surface; Phase 3 extends this surface, doesn't replace it.

No external ADRs or specs — all design decisions captured in the project's own `.planning/` artifacts.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **`rehype-slug` IDs on every heading** — Phase 2 D-05 already wired this. `## **PRD-1.1: Plant Variants**` becomes `<h2 id="prd-1-1-plant-variants">`. Sidebar links and search results both reference these IDs directly; no separate ID generation needed.
- **`CrossLinkText.jsx` scroll mechanic** — `scrollIntoView({behavior: 'smooth', block: 'start'})` + `location.hash` mutation. Refactor candidate: extract this into `useScrollToAnchor(id)` hook so sidebar (D-17/click) and search (D-12) can reuse it without copying. Keeps the cross-link warn-on-broken behavior local to CrossLinkText.
- **`scripts/build-manifest.mjs` build hook pattern** — predev/prebuild npm hooks regenerate manifest before each dev/build. Phase 3 adds `scripts/build-search-index.mjs` as a sibling and wires both into the same hooks (composable with `&&` or as a chain script).
- **`styles.css` CSS custom property surface** — Phase 2 D-19 established the convention. Phase 3 adds `--sidebar-bg`, `--sidebar-active-bar`, `--search-modal-bg`, `--search-result-highlight` to the same surface. Phase 4 brand pass overrides these without touching component code.

### Established Patterns
- Component-scoped CSS files next to JSX components (Phase 2 pattern: `Pre.jsx` + no separate CSS, `MermaidPre.jsx` + `MermaidPre.css`, `SchemaTable.jsx` + `SchemaTable.css`). Phase 3 follows: `Sidebar.jsx` + `Sidebar.css`, `SearchPanel.jsx` + `SearchPanel.css`.
- Hooks live alongside components in `app/src/components/`. Plan 3 may extract `useScrollSpy`, `useHashScroll`, `useScrollToAnchor` to keep components readable.
- Pure-JS utilities (no JSX) get a `*.js` extension and are unit-tested via `node --test` (Phase 2 D-09 / SchemaTable.helpers.js precedent). Search index builder logic and any pure functions get the same treatment.
- ESM throughout; no TypeScript. Stay consistent.

### Integration Points
- `App.jsx` becomes the layout shell. The existing `<main>` block is wrapped by `<aside>Sidebar</aside><main>SpecViewer</main>`. The search panel mounts via React portal at `document.body`.
- `package.json` for `minisearch` dep + the new `build-search-index` npm script. The predev/prebuild hooks chain manifest then index, e.g.:
  ```
  "predev": "npm run build-manifest && npm run build-search-index"
  ```
- `vite.config.js` is unchanged — JSON imports from `app/src/search-index.json` are handled natively.

</code_context>

<specifics>
## Specific Ideas

- The user picked sidebar defaults that match Docsify's existing behavior closely (auto-expand H3 for active section, drawer on mobile, no header text in sidebar). The mental model is "keep what works, replace the engine." Phase 3 should preserve that feel; do not introduce novel sidebar patterns.
- The user explicitly deferred branding ("nothing in sidebar header") to Phase 4. Phase 3 must NOT introduce the site title, brand colors, or any visual identity element. Structural neutral only.
- The user delegated search library, search UI, and hash deep-link timing to Claude. The defaults above are conservative and reversible; the user retains the right to override D-05 through D-15 by editing this file before `/gsd-plan-phase 3` runs.

</specifics>

<deferred>
## Deferred Ideas

- **Heading anchor `#` icons on hover** — A common doc-site affordance that pairs well with rehype-slug. Belongs in Phase 4 alongside the brand pass.
- **Sidebar pinning / "stay open across reloads"** — Persisting sidebar drawer open/closed state in localStorage on mobile. Not explicitly asked for; defer.
- **Search filters by PRD section / Stage 1 vs Stage 2** — Filtering search by metadata (e.g., "only Stage 1 results"). Tied to v2 FILT-01. Defer.
- **Search across multiple dated snapshots** — Currently the index is built from the newest snapshot only. Multi-version search aligns with v2 VER-01/VER-02. Defer.
- **Recently-viewed sections / breadcrumbs** — Useful for long reading sessions. Out of scope for v1; capture as v2 idea.
- **Keyboard shortcuts beyond Cmd+K** — e.g., `g g` to top, `[`/`]` to navigate PRDs. Defer to a focused interaction-design pass post-v1.

</deferred>

---

*Phase: 03-navigation-search*
*Context gathered: 2026-04-26*
