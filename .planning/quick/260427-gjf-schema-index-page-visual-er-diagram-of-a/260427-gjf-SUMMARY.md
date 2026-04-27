---
phase: 260427-gjf
plan: 01
subsystem: schema-index-page
tags: [schema, mermaid, lazy-load, routing, build-script]
dependency-graph:
  requires: [phase-2 mermaid renderer, phase-3 sidebar shell]
  provides: [#/schema route, app/src/schema-index.json, SchemaPage component]
  affects: [App.jsx routing, Sidebar.jsx static entry, package.json predev/prebuild hooks, npm test glob]
tech-stack:
  added: []
  patterns: [hash-router via parseHashRoute + hashchange, React.lazy + Suspense for code-split, dynamic JSON import for data isolation, pure-helper extraction for node:test coverage]
key-files:
  created:
    - scripts/build-schema-index.mjs
    - scripts/build-schema-index.test.js
    - app/src/components/useRoute.js
    - app/src/components/useRoute.test.js
    - app/src/components/SchemaPage.jsx
    - app/src/components/SchemaPage.css
    - app/src/components/SchemaPage.helpers.js
    - app/src/components/SchemaPage.helpers.test.js
    - app/src/schema-index.json
  modified:
    - app/src/App.jsx
    - app/src/components/Sidebar.jsx
    - app/src/components/Sidebar.css
    - package.json
decisions:
  - "Pure-helper extraction (SchemaPage.helpers.js) for testability — node:test has no JSX/CSS loader, so the diagram-source synthesis + slug logic live in a JS module that SchemaPage.jsx re-imports. Same pattern as SchemaTable.helpers.js."
  - "Schema Index sidebar entry is STATIC (not derived from heading collection) — the spec viewer is unmounted on the schema route, so collectHeadings() returns []. Static entry above the dynamic <ul> keeps it always visible."
  - "schema-index.json is committed to the repo (not gitignored) — matches search-index.json policy. Both are deterministic build outputs but reviewers benefit from seeing diff in PRs."
  - "Mermaid erDiagram caps fields per entity at DIAGRAM_FIELD_CAP=6 inside the diagram for legibility; the full field list still appears in the reference table below."
  - "useHashScroll(content) is gated to route === 'spec' so the hook ignores the '/schema' segment instead of treating it as a heading id (would silent-no-op anyway, but explicit gating documents intent)."
metrics:
  duration: ~25 minutes
  completed: 2026-04-27
---

# Phase 260427-gjf Plan 01: Schema Index Page Summary

## One-liner

A lazy-loaded `#/schema` route renders an interactive Mermaid `erDiagram` of every entity in the spec plus an alphabetised reference list with PRD jump-links — backed by a build-time parser that emits `app/src/schema-index.json` and a 1.2 KB gzipped page chunk that loads only when visited.

## What Was Built

### Build-time parser (`scripts/build-schema-index.mjs`)

Mirrors `build-search-index.mjs` exactly in style (banner comments, CLI/import detection, newest-file selection). Walks the newest `project-spec/YYYY-MM-DD.md`:

1. Tracks `currentPrdSlug` — updated on every `## **PRD-N(.M): Title**` (PRD-1.1 → `prd-1-1`, mirroring `normalizeRecord`).
2. Toggles `inDataModel` on `### **Data Model**` (off on the next H3 or H2).
3. Inside Data Model blocks, captures `**EntityName**` labels and emits a record only when followed by a 3-column Field|Type|Notes table (narrative-prose labels with no table are dropped).
4. Unescapes the spec's `created\_by` underscore convention.
5. Detects `FK → Target` Type cells (with optional `(nullable)` annotation preserved on the relationship label).
6. De-duplicates relationships by `from|to|label` and sorts the output for stable diffs.

**Output:** `app/src/schema-index.json` — 20 entities, 165 fields, 34 FK relationships from `project-spec/2026-04-26.md`.

Wired into `predev` + `prebuild` hooks; available standalone as `npm run build-schema-index`.

### Hash router (`app/src/components/useRoute.js`)

Tiny hook (~25 lines) that returns `'schema'` when `location.hash` matches `^#?/?schema(?:/.*)?$/i` and `'spec'` otherwise. Updates on `hashchange`. Pure parser exported as `parseHashRoute()` for test coverage. No external dependencies.

### Schema page (`app/src/components/SchemaPage.jsx` + `.css`)

Lazy-loaded route component:
- On mount, `import('../schema-index.json')` — Vite emits the JSON as a separate chunk.
- Renders three sections:
  1. `<header>` with title + subtitle.
  2. `<section className="schema-page__diagram">` — synthesises a Mermaid `erDiagram` source (one declaration block per entity capped at 6 fields, one `}o--||` edge per relationship) and feeds it into the existing `<MermaidBlock>` (which already lazy-loads `mermaid`). Card has `overflow-x: auto` so wide diagrams scroll horizontally on small screens.
  3. `<section className="schema-page__entities">` — alphabetised list of `<article id="entity-<slug>">` cards with the entity name, a "View in spec →" anchor (`href="#/<prd_id>"`), and a 3-column Field/Type/Notes table.
- Loading state: `<p>Loading schema…</p>`. Error state: `<p role="alert">Failed to load schema index: {err}</p>`.
- `initialData` prop is a TEST SEAM only.

### App + Sidebar wiring

- **`App.jsx`**: imports `useRoute` + `lazy(() => import('./components/SchemaPage.jsx'))`. Renders `<Suspense><SchemaPage /></Suspense>` when `route === 'schema'`, otherwise the existing spec viewer. `useHashScroll(content)` gated to the spec route.
- **`Sidebar.jsx`**: reads `useRoute()`, renders a static "Schema Index" entry at the top of the nav above the dynamic PRD list. Active class when on the schema route. Empty-state text adapts (`(open the spec to see PRD nav)` on schema route vs `(no sections)` on spec route).
- **`Sidebar.css`**: `.sidebar-list--static` separator (border-bottom + spacing) between the static entry and the dynamic list.

## Counts

| Metric | Value |
|---|---|
| Entities indexed | **20** |
| Fields indexed | **165** |
| FK relationships extracted | **34** |
| Tests added | **50** (22 parser + 28 component helpers/router) |
| Total tests passing | **124** (74 baseline + 50 new) |

Spot-check: `Plant Variant → Plant`, `Plant Batch → Plant Variant`, `Plant Batch → Order (nullable)` all present in the relationships array, with `(nullable)` preserved on the label.

## Bundle Impact

| Chunk | Raw | Gzipped |
|---|---|---|
| Main bundle (`index-DsTPsrAp.js`) | 370,793 B | **118,395 B** (118.38 KB) |
| SchemaPage code chunk | 2,720 B | **1,189 B** |
| schema-index data chunk | 14,166 B | **3,422 B** |
| SchemaPage CSS | 1,661 B | **585 B** |

**Main bundle delta from this plan: ≈0 KB.** The lazy chunks total ~5 KB gzipped and are fetched only on `#/schema` entry.

Note: the main bundle is 118 KB gz versus the Phase 2 baseline of 100.48 KB gz — the ~18 KB growth is attributable to Phase 3 (Sidebar, SearchPanel, MiniSearch hydration), already accounted for in Phase 3's completion. This plan adds nothing measurable to the main bundle.

## Code-Splitting Verification

```
$ ls app/dist/assets/ | grep -i "schema\|^index-"
SchemaPage-DRc9F45v.js          ← code chunk, lazy-loaded
SchemaPage-U7b2-4Gt.css         ← styles chunk, lazy-loaded
index-5325376f-BQY18132.js      ← unrelated mermaid sub-chunk
index-DsTPsrAp.js               ← main bundle
index-YAyeC_kg.js               ← unrelated minisearch chunk
index-re28KMkF.css              ← main CSS
schema-index-CqVurZSO.js        ← data chunk, lazy-loaded
```

The main bundle's `__vite__mapDeps` references `SchemaPage-DRc9F45v.js` as a string for the lazy loader, but the SchemaPage component code itself does NOT appear in the main bundle. The string `"Plant Variant"` (from the schema-index data) appears ONLY in `schema-index-CqVurZSO.js`.

## Manual UAT (Browser)

After running `npm run dev` and opening http://localhost:5173:

1. Sidebar shows **"Schema Index"** at the top, separated from the PRD list by a thin border.
2. Click **Schema Index** → URL becomes `#/schema`, sidebar entry gets the active-state bar, main pane swaps to the schema page (loading text appears briefly, then the ER diagram renders followed by the entity reference list).
3. Open dev-tools → Network tab. Confirm three new network requests fire on schema-route entry: `SchemaPage-*.js`, `SchemaPage-*.css`, `schema-index-*.js`. (Mermaid chunks already cached if any spec page used them.)
4. In the entity reference list, click **"View in spec →"** under "Plant Variant" → URL becomes `#/prd-1-1`, sidebar switches back to PRD nav mode, page scrolls to the **"PRD-1.1: Plant Variants"** heading inside the spec.
5. Refresh on `#/schema` → page boots straight into the schema view (no flash of the spec viewer; `useRoute` initialises from `window.location.hash` synchronously).
6. Resize the browser narrow → the ER diagram scrolls horizontally inside its card without overflowing the page.
7. Open `Cmd+K` from the schema route → search panel still works (it overlays on top, route-independent).

## Known Stubs

None. Every code path is wired to real data:
- The schema page renders real `app/src/schema-index.json` data.
- The static "Schema Index" sidebar entry routes to a real implemented page.
- All FK edges in the diagram correspond to actual `FK → X` cells in the spec.

## Threat Flags

None. No new network endpoints, auth paths, or trust boundaries — the entire feature is build-time parsing + a client-side render of a JSON file already shipped to the user.

## Deferred Items

Explicit non-goals per the plan:
- **Theming polish** — Phase 4 owns full brand/theme work; the schema page reuses existing `--schema-card-*` and `--cross-link-color` custom properties so the page will pick up the MacPlants green automatically when those properties are unified.
- **Two-way active highlighting** — clicking the schema diagram or an entity heading does NOT highlight the corresponding PRD in the sidebar (and vice versa). Out of scope; the "View in spec →" link is the navigation contract.
- **Search integration of entity records** — entity names are not searchable via `Cmd+K` (search index only contains heading bodies). Could be added by a future plan if requested.
- **Field-list cap inside the diagram** — currently 6 fields per entity in the Mermaid diagram; the full list is in the reference table. If the diagram becomes hard to read with 20 entities, consider grouping by PRD or adding a toggle. Not a problem at current scale.

## Deviations from Plan

**None — plan executed as written**, with two minor refinements documented in Decisions:

1. **Test file extension** — the plan specified `scripts/build-schema-index.test.js` (matching the proposed test glob `scripts/*.test.js`). The existing sibling test was `build-search-index.test.mjs`. I followed the plan's `.test.js` extension (the project is ESM-by-default via `"type": "module"`, so `.js` files are also ESM and the `node --test` runner picks them up). The package.json glob now covers `scripts/*.test.js` only — the existing `.test.mjs` file is still runnable via the explicit `node --test scripts/build-search-index.test.mjs` invocation noted in its header.
2. **Helper extraction** — the plan envisioned a `SchemaPage.test.js` that imports `SchemaPage.jsx` and uses `react-dom/server`. Because the project's `node --test` runner has no JSX/CSS loader, importing `SchemaPage.jsx` would fail at module load. I extracted the pure logic (`buildErDiagramSource`, `slugify`, `safeMermaidIdent`, `sortedEntities`) into `SchemaPage.helpers.js` and tested it directly — same pattern the existing codebase uses for `SchemaTable.helpers.js` / `searchPanel.helpers.js`. The plan's required string-match assertions (`erDiagram`, `}o--||`, `entity-plant-variant`, `#/prd-1-1`) are all covered by the helpers tests via direct derivation.

## Self-Check: PASSED

**Files exist:**
- FOUND: scripts/build-schema-index.mjs
- FOUND: scripts/build-schema-index.test.js
- FOUND: app/src/components/useRoute.js
- FOUND: app/src/components/useRoute.test.js
- FOUND: app/src/components/SchemaPage.jsx
- FOUND: app/src/components/SchemaPage.css
- FOUND: app/src/components/SchemaPage.helpers.js
- FOUND: app/src/components/SchemaPage.helpers.test.js
- FOUND: app/src/schema-index.json

**Commits exist:**
- FOUND: 063ca81 feat(260427-gjf-01): build-time schema-index parser
- FOUND: 5795478 feat(260427-gjf-02): hash router + SchemaPage component
- FOUND: 1fef3c7 feat(260427-gjf-03): wire schema route into App + Sidebar

**Build verification:**
- FOUND: app/dist/assets/SchemaPage-*.js (1.2 KB gz)
- FOUND: app/dist/assets/schema-index-*.js (3.4 KB gz)
- Main bundle does NOT contain SchemaPage component code (verified via `grep -l` on dist).
- All 124 tests pass.
