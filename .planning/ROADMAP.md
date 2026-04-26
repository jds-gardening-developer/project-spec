# Roadmap: MacPlants Spec Viewer

## Overview

This project rebuilds the MacPlants ERP spec viewer as a Vite + React static SPA, replacing the current Docsify-based site. Work proceeds in five phases: scaffold the app and its build-time manifest so the newest dated spec auto-loads (1), layer in the killer-feature renderers — cross-links, data-model cards, Mermaid (2), restore navigation and search to match Docsify parity (3), apply the MacPlants green brand and layout (4), and finally cut over `index.html` plus the Netlify config so the new build serves production (5). Earlier phases iterate against `npm run dev`; the live site only swaps over in Phase 5.

**Branch:** `web-app-refactor` (uncommitted refactor in progress; folded into Phase 1).

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation** - Vite + React scaffold, build-time manifest, newest-by-date loader, basic markdown rendering
- [ ] **Phase 2: Rich Rendering** - Cross-link navigation, data-model cards, Mermaid diagrams, copy-code buttons
- [ ] **Phase 3: Navigation & Search** - Sidebar with H2/H3 behavior, hash-deep-linking, Cmd+K search panel with build-time index
- [ ] **Phase 4: Branding & Layout** - MacPlants green theme, sidebar/main layout, typography, site title
- [ ] **Phase 5: Deploy & Cutover** - Replace `index.html`, update `netlify.toml`, ship `dist/` to Netlify

## Phase Details

### Phase 1: Foundation
**Goal**: A Vite + React dev server renders the newest dated spec from a build-time manifest, with GitHub-flavored markdown displayed correctly. This is the seam every other phase builds on.
**Depends on**: Nothing (first phase)
**Requirements**: VIEW-01, VIEW-02, VIEW-03, REND-01, DEP-03
**Success Criteria** (what must be TRUE):
  1. User can run `npm run dev` and a Vite dev server starts with HMR working on file save
  2. The build-time manifest script scans `project-spec/*.md`, sorts by ISO date, and the React app imports it as JSON
  3. On first paint at `localhost:5173`, the viewer auto-loads the file with the most recent ISO date (currently `2026-04-26.md`)
  4. The 70KB spec content renders without lag, with GFM tables, fenced code blocks, and strikethrough displayed correctly
  5. Adding a hypothetical newer dated file (e.g. `2026-05-10.md`) and re-running the dev server causes the viewer to auto-switch to it
**Plans**: TBD
**UI hint**: yes

### Phase 2: Rich Rendering
**Goal**: The viewer adds the interactivity Docsify cannot do natively — clickable cross-references, schema-card data-model tables, live Mermaid diagrams, and copy-code buttons.
**Depends on**: Phase 1
**Requirements**: REND-02, REND-03, REND-04, REND-05
**Success Criteria** (what must be TRUE):
  1. User can click any inline `(see PRD-X.Y)` reference in body text and the page scrolls to the matching PRD heading
  2. Three-column `Field | Type | Notes` markdown tables render as styled schema cards while regular tables continue to render as standard tables
  3. User sees Mermaid diagrams rendered live for ` ```mermaid ` fenced blocks, and Mermaid loads on demand (not in the main bundle)
  4. User can click a copy-to-clipboard button on any code block and the block's contents are copied
**Plans**: TBD
**UI hint**: yes

### Phase 3: Navigation & Search
**Goal**: Sidebar navigation matches the existing Docsify behavior (H2 always visible, H3 expanded for active section), deep links work on initial load, and Cmd+K opens a build-time-indexed full-text search panel.
**Depends on**: Phase 1
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, SEA-01, SEA-02, SEA-03
**Success Criteria** (what must be TRUE):
  1. User sees every H2 (PRD-N) heading listed in the left sidebar at all times, with H3 sub-headings auto-expanded for the section currently in view and collapsed for inactive sections
  2. User can click any sidebar entry to scroll that section into view, and the URL hash updates accordingly
  3. User can paste a deep link like `localhost:5173/#/prd-1.1` into a fresh tab and the viewer scrolls to that section on initial render
  4. User can press Cmd+K (macOS) or Ctrl+K (other platforms) and a search panel overlay opens with the spec content already indexed
  5. User can click any search result and the panel dismisses and the page scrolls to that section
**Plans**: TBD
**UI hint**: yes

### Phase 4: Branding & Layout
**Goal**: The viewer visually matches the existing MacPlants Docsify site — green accent, sidebar+content layout, clean long-form typography, "MacPlants ERP" title in the sidebar header.
**Depends on**: Phase 3 (sidebar must exist before it can be themed)
**Requirements**: BRD-01, BRD-02, BRD-03, BRD-04
**Success Criteria** (what must be TRUE):
  1. The accent color `#2c8d4f` is applied to active sidebar entries, links, and primary headings
  2. The layout shows a left sidebar (site title + section list) and a main content area on the right, matching the existing Docsify view
  3. Typography and spacing produce a clean, readable long-form document comparable in feel to the current site (no jarring differences side-by-side)
  4. The sidebar header displays "MacPlants ERP" as the site title
**Plans**: TBD
**UI hint**: yes

### Phase 5: Deploy & Cutover
**Goal**: The React build replaces the Docsify entry point in production. After this phase, push-to-`main` deploys the new viewer to Netlify.
**Depends on**: Phase 4 (don't ship until the visual feel is right)
**Requirements**: VIEW-04, DEP-01, DEP-02
**Success Criteria** (what must be TRUE):
  1. `npm run build` produces a static `dist/` directory containing all assets needed to serve the viewer
  2. `netlify.toml` is updated so Netlify runs `npm run build` and serves `dist/`, with cache headers migrated as appropriate
  3. The previous Docsify `index.html` is replaced (or made obsolete by the build output) so the new React app is the production site entry point
  4. Pushing the branch and merging to `main` results in Netlify auto-deploying the new viewer with the same URL as today
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 0/TBD | Not started | - |
| 2. Rich Rendering | 0/TBD | Not started | - |
| 3. Navigation & Search | 0/TBD | Not started | - |
| 4. Branding & Layout | 0/TBD | Not started | - |
| 5. Deploy & Cutover | 0/TBD | Not started | - |

---
*Roadmap created: 2026-04-26*
*Granularity: coarse (5 phases)*
*Coverage: 23/23 v1 requirements mapped*
