# Requirements: MacPlants Spec Viewer

**Defined:** 2026-04-26
**Core Value:** The client and the developer can read the latest spec, follow PRD cross-references in one click, and visually understand data-model relationships — all from a fast static page that mirrors today's Docsify experience and adds the interactivity Docsify lacks.

## v1 Requirements

### Viewer Foundation

- [ ] **VIEW-01**: A Vite + React app builds to a static `dist/` directory ready for static hosting
- [ ] **VIEW-02**: A build-time script scans `project-spec/*.md`, sorts files by ISO date (`YYYY-MM-DD.md`), and emits a manifest JSON the React app imports
- [ ] **VIEW-03**: On first paint the viewer auto-loads the spec file with the most recent ISO date from the manifest
- [ ] **VIEW-04**: The new build output replaces the current Docsify-based `index.html` as the site entry point

### Content Rendering

- [ ] **REND-01**: User can read GitHub-flavored markdown content with tables, fenced code blocks, and strikethrough rendered correctly
- [ ] **REND-02**: User can click any inline `(see PRD-X.Y)` reference in body text and the page scrolls to the matching PRD heading
- [ ] **REND-03**: Data-model tables (3-column `Field | Type | Notes`) render as styled schema cards instead of plain markdown tables, while non-data-model tables continue to render as standard tables
- [ ] **REND-04**: User sees diagrams rendered live when the markdown contains a ` ```mermaid ` fenced code block; Mermaid loads on demand to keep the main bundle small
- [ ] **REND-05**: User can click a copy-to-clipboard button on any code block to copy its contents

### Navigation

- [ ] **NAV-01**: User sees every H2 heading (PRD-N entries) listed in the left sidebar at all times
- [ ] **NAV-02**: User sees H3 sub-headings auto-expanded under the PRD section currently in view; sub-headings collapse for inactive sections
- [ ] **NAV-03**: User can click any sidebar entry to scroll that section into view; the URL hash updates to reflect the active section
- [ ] **NAV-04**: User can load a deep hash link (e.g. `/#/prd-1.1`) directly and the viewer scrolls to that section on initial render

### Search

- [ ] **SEA-01**: User can press Ctrl+K (or Cmd+K on macOS) to open a search panel overlay
- [ ] **SEA-02**: A build-time index of all headings and body text is generated using a small client-side search library (FlexSearch or MiniSearch — final choice during planning)
- [ ] **SEA-03**: User can click any search result to dismiss the panel and scroll to that section in the spec

### Branding & Layout

- [ ] **BRD-01**: The accent color `#2c8d4f` (MacPlants green) is used for active sidebar entries, links, and primary headings
- [ ] **BRD-02**: The layout matches the existing Docsify view — left sidebar with site title and section list, main content area on the right
- [ ] **BRD-03**: Typography and spacing produce a clean, readable long-form document similar in feel to the current site
- [ ] **BRD-04**: The site title "MacPlants ERP" appears in the sidebar header

### Deploy & Dev

- [ ] **DEP-01**: `npm run build` produces a static `dist/` directory containing all assets needed to serve the viewer
- [ ] **DEP-02**: `netlify.toml` is updated so Netlify runs the build (`command = "npm run build"`) and serves `dist/` (`publish = "dist"`); cache headers are migrated as appropriate
- [ ] **DEP-03**: `npm run dev` starts a local Vite dev server with hot module replacement for fast iteration

## v2 Requirements

Deferred to a future release. Tracked but not in current roadmap.

### Multi-Version Browsing

- **VER-01**: User can switch to an older dated snapshot via a version dropdown
- **VER-02**: User can view two snapshots side-by-side with a diff highlight

### Status & Filtering

- **FILT-01**: PRD sections display status badges (Stage 1 / Stage 2 / Open Decision / Discuss)
- **FILT-02**: User can toggle a Stage 1-only view that hides deferred content

### Export

- **EXP-01**: User can print or export the current view as a clean PDF

### Spec Workflow Cleanup

- **WF-01**: `scripts/update-spec.mjs` retargets `project-spec/<newest>.md` instead of stale `README.md`
- **WF-02**: `README.md` is reduced to a meta-readme (no duplicated PRD content)
- **WF-03**: `CONTRIBUTING.md` describes the dated-snapshot workflow

## Out of Scope

Explicitly excluded from any release of this project. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Authentication / login | Site stays publicly readable, same as today |
| Comments / persisted client feedback | Would require a backend; out of scope for a static viewer |
| Server-side rendering / Next.js | Overkill for a static viewer with no auth/API needs |
| MDX content authoring | Spec is plain markdown; MDX adds tooling complexity for no benefit |
| Editing the PRD content from the viewer | This project is the viewer, not a CMS |
| Building the actual MacPlants ERP application | The spec under `project-spec/` is the *input*, not the deliverable |
| Replacing the LLM transcript fold-in script | User explicitly chose to leave `scripts/update-spec.mjs` alone |
| Writing tests for the existing Docsify era code | Out of scope; new code in this project gets its own tests |
| Cross-link checker as a CI build step | Considered, deferred to v2+ if needed |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| VIEW-01 | Phase 1 | Pending |
| VIEW-02 | Phase 1 | Pending |
| VIEW-03 | Phase 1 | Pending |
| VIEW-04 | Phase 5 | Pending |
| REND-01 | Phase 1 | Pending |
| REND-02 | Phase 2 | Pending |
| REND-03 | Phase 2 | Pending |
| REND-04 | Phase 2 | Pending |
| REND-05 | Phase 2 | Pending |
| NAV-01 | Phase 3 | Pending |
| NAV-02 | Phase 3 | Pending |
| NAV-03 | Phase 3 | Pending |
| NAV-04 | Phase 3 | Pending |
| SEA-01 | Phase 3 | Pending |
| SEA-02 | Phase 3 | Pending |
| SEA-03 | Phase 3 | Pending |
| BRD-01 | Phase 4 | Pending |
| BRD-02 | Phase 4 | Pending |
| BRD-03 | Phase 4 | Pending |
| BRD-04 | Phase 4 | Pending |
| DEP-01 | Phase 5 | Pending |
| DEP-02 | Phase 5 | Pending |
| DEP-03 | Phase 1 | Pending |

**Coverage:**
- v1 requirements: 23 total
- Mapped to phases: 23
- Unmapped: 0 ✓

**Phase totals:**
- Phase 1 (Foundation): 5 requirements (VIEW-01, VIEW-02, VIEW-03, REND-01, DEP-03)
- Phase 2 (Rich Rendering): 4 requirements (REND-02, REND-03, REND-04, REND-05)
- Phase 3 (Navigation & Search): 7 requirements (NAV-01..04, SEA-01..03)
- Phase 4 (Branding & Layout): 4 requirements (BRD-01..04)
- Phase 5 (Deploy & Cutover): 3 requirements (VIEW-04, DEP-01, DEP-02)

---
*Requirements defined: 2026-04-26*
*Last updated: 2026-04-26 after roadmap creation (traceability filled)*
