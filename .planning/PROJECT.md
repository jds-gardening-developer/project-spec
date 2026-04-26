# MacPlants Spec Viewer

## What This Is

A small, lightweight Vite + React app that renders the MacPlants ERP project specification as an interactive documentation site. It replaces the current Docsify-based viewer, reads dated markdown snapshots from `project-spec/`, automatically displays the newest snapshot by ISO date, and adds custom interactivity (cross-link navigation, Mermaid diagrams, a styled data-model viewer) that Docsify cannot do natively. The audience is the project owner (Sigurd) and the client (MacPlants) — both reviewing requirements together.

## Core Value

The client and the developer can read the latest spec, follow PRD cross-references in one click, and visually understand data-model relationships — all from a fast static page that mirrors today's Docsify experience and adds the interactivity Docsify lacks.

## Requirements

### Validated

<!-- Inferred from existing Docsify-based site. These are the behaviors that already work and the new viewer must preserve. -->

- ✓ **Static deploy on Netlify** — repo root publishes; push-to-`main` auto-deploys — existing
- ✓ **Markdown content under `project-spec/YYYY-MM-DD.md`** — single source of truth for rendered content — existing
- ✓ **MacPlants green brand** — `#2c8d4f` accent color, custom CSS theme — existing
- ✓ **Sidebar navigation generated from headings** — no separate `_sidebar.md` file — existing
- ✓ **Full-text search via Ctrl+K** — Docsify's built-in plugin — existing
- ✓ **Copy-code buttons on code blocks** — Docsify plugin — existing
- ✓ **`scripts/update-spec.mjs` (LLM transcript fold-in)** — Anthropic-API-driven workflow that produces `README.proposed.md` for review — existing (preserved as-is for this project)
- ✓ **Vite + React + react-markdown SPA renders the newest dated spec automatically** — `app/` Vite scaffold, `import.meta.glob` raw loader, `react-markdown` + `remark-gfm` viewer — Validated in Phase 1: Foundation
- ✓ **Build-time manifest of dated files** — `scripts/build-manifest.mjs` scans `project-spec/*.md`, sorts ISO desc, writes `app/src/manifest.json`; wired via `predev`/`prebuild` npm hooks — Validated in Phase 1: Foundation

### Active

<!-- The new React viewer's must-haves. -->

- [ ] **Sidebar navigation** — H2 entries always visible; H3 entries auto-expanded for the active section (matches existing screenshot behavior)
- [ ] **Cross-link navigation** — `(see PRD-X.Y)` references rendered as in-page links that scroll to the matching section heading
- [ ] **Data-model table renderer** — custom React component that styles `Field | Type | Notes` markdown tables as schema cards
- [ ] **Mermaid diagram support** — render \`\`\`mermaid code blocks inline (entity relationships, flow diagrams)
- [ ] **Client-side full-text search** — Ctrl+K opens a search panel; build-time index via FlexSearch or MiniSearch
- [ ] **MacPlants green theme** — accent color `#2c8d4f`, layout/feel similar to current Docsify view
- [ ] **Netlify deploy** — `npm run build` produces `dist/` which Netlify publishes
- [ ] **Replace `index.html` Docsify entry** — the React build output becomes the new entry point

### Out of Scope

<!-- Explicit boundaries. -->

- **Multi-version dropdown / historical viewer** — newest only for v1; older snapshots remain accessible via git history (deferred to v2 if useful)
- **Side-by-side diff view across snapshots** — too complex for v1; deferred
- **Status badges + Stage 1/Stage 2 filter** — considered, deferred (user did not select for v1)
- **Print / PDF export** — considered, deferred (user did not select for v1)
- **Comments / annotations / persisted client feedback** — would require a backend; out of scope for a static viewer
- **Authentication** — site stays publicly readable, same as today
- **Spec content changes (PRD edits)** — this project is the *viewer*, not the *content*. The spec under `project-spec/` is treated as read-only input
- **Fixing `scripts/update-spec.mjs`** — script currently targets stale `README.md`; user explicitly chose to leave it alone for now (separate effort)
- **Fixing the `README.md` ↔ `project-spec/2026-04-26.md` content duplication** — out of scope for the viewer; flagged in `.planning/codebase/CONCERNS.md` for separate cleanup
- **Server-side rendering / Next.js** — overkill for a static viewer with no auth/API needs
- **MDX** — overkill; plain markdown + a few custom React renderers is sufficient

## Context

**The repo today (brownfield, branch `web-app-refactor`):**
- Static doc site rendered by Docsify v4 from CDN, no build step, served by Netlify
- The PRD content (~70KB markdown, 14 PRD subsections covering Plants/Variants/Batches, Purchase Orders, Trade & Retail Customers, Order Lifecycle, etc.) lives in `project-spec/2026-04-26.md`
- `index.html` hardcodes the homepage at `project-spec/2026-04-26.md`; updating to a new dated snapshot requires manually editing this line — exactly the friction this project removes
- Working tree has uncommitted changes (modified `README.md`, `index.html`, untracked `project-spec/`); the dated-snapshot model is a partial refactor that will be finalized as part of this project
- No `.gitignore`, no tests, no CI — known gaps from `.planning/codebase/CONCERNS.md`

**Why now:**
- Docsify is good enough as a viewer but its plugin model and customization options are limited
- The project owner is iterating on the spec with the client and wants a smoother review experience — particularly for the data model (lots of `Field|Type|Notes` tables) and PRD cross-references
- New dated snapshots will be added regularly; the manual `homepage` edit in `index.html` is fragile and will be forgotten

**Audience for the rendered output:**
- The MacPlants client (non-technical) — needs to read and discuss requirements
- The project owner (Sigurd) — needs to navigate quickly between PRDs and follow cross-references during meetings

**Codebase map:** see `.planning/codebase/` for full architecture, stack, structure, and concerns analysis (generated 2026-04-26).

## Constraints

- **Tech stack**: Vite + React + react-markdown + remark-gfm — chosen for smallest viable footprint, no SSR, deploy-static-files simplicity
- **Markdown library**: `react-markdown` with `remark-gfm` (tables, strikethrough) — handles 95% of the spec; custom renderers for cross-links + data-model tables
- **Search library**: FlexSearch or MiniSearch (decision deferred to research/planning) — must be client-side, build-time-indexed, <20KB
- **Diagram library**: Mermaid (latest stable) — rendered via dynamic import to keep main bundle small
- **Runtime**: Node 20+ for build (already required for the existing tooling layer)
- **Deploy**: Netlify (existing; switch from `publish = "."` to `publish = "dist"`, add `command = "npm run build"`)
- **Branch**: work continues on `web-app-refactor` (already checked out; uncommitted refactor will be folded in)
- **No backend**: viewer stays a static SPA — no server, database, or auth
- **Performance**: must render the existing 70KB spec without lag; first-paint target similar to Docsify (<1s on broadband)
- **Bundle budget (soft)**: aim for <100KB gzipped main bundle excluding Mermaid (which loads on demand)
- **Brand**: keep MacPlants green `#2c8d4f` and the general visual feel from the Docsify version

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Vite + React + react-markdown over Astro/Next.js | Smallest viable footprint for a static SPA viewer; user is comfortable with React; no SSR or server features needed in v1 | — Pending |
| Newest-only viewer (no version dropdown in v1) | Matches the screenshot, simpler, history stays in git | — Pending |
| Plain markdown + custom React renderers (not MDX) | Spec content is plain markdown; MDX adds tooling complexity for no v1 benefit | — Pending |
| Build-time manifest of dated files (not runtime FS scan) | Static deploys can't read filesystem at runtime; a tiny build script is the cleanest seam | — Pending |
| Leave `scripts/update-spec.mjs` untouched for now | User explicitly scoped it out; LLM workflow is broken anyway and will be addressed separately | — Pending |
| Keep `project-spec/` folder structure unchanged | The spec is the input; the viewer adapts to the existing layout, not the other way around | — Pending |
| MacPlants green `#2c8d4f` and similar visual feel | Continuity for the client; no design phase needed | — Pending |
| Cross-link nav, Data-model viewer, Mermaid as v1 killer-features | User explicitly selected these; status badges / stage filter / PDF export deferred | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

## Current State

**Phase 1: Foundation — complete (2026-04-26).** Vite + React app stood up under `app/` (legacy Docsify viewer at repo-root `index.html` left untouched). `scripts/build-manifest.mjs` regenerates `app/src/manifest.json` from `project-spec/*.md` before every dev/build via `predev`/`prebuild` hooks. `App.jsx` lazy-loads the newest manifest entry through `import.meta.glob` and renders it via `SpecViewer.jsx` (`react-markdown` + `remark-gfm`). 2 items pending live-browser confirmation in `01-HUMAN-UAT.md` (GFM render, HMR). Foundation seam ready for Phase 2 (Rich Rendering: cross-link nav, data-model cards, Mermaid).

---
*Last updated: 2026-04-26 after Phase 1: Foundation*
