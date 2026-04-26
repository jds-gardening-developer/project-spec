---
phase: 02-rich-rendering
plan: 04
subsystem: schema-card-renderer
tags: [react-markdown, components-prop, schema-card, css-custom-properties, node-test, tdd, wave-2]
dependency_graph:
  requires:
    - app/src/components/SchemaTable.jsx#stub
    - app/src/components/SchemaTable.helpers.js#stub
    - app/src/styles.css#theming-surface
    - package.json#test-script
  provides:
    - app/src/components/SchemaTable.helpers.js#impl
    - app/src/components/SchemaTable.helpers.test.js#11-tests
    - app/src/components/SchemaTable.jsx#dispatcher
    - app/src/components/SchemaTable.css#layout
  affects:
    - app/src/components/SchemaTable.jsx
    - app/src/components/SchemaTable.helpers.js
tech_stack:
  added:
    - (none — used existing react-markdown@9 components prop seam from Plan 01)
  patterns:
    - tdd-red-green-cycle
    - pure-helpers-extracted-for-node-test
    - react-markdown-components-table-override
    - css-custom-properties-theming-surface
    - jsx-dispatcher-with-fallthrough
key_files:
  created:
    - app/src/components/SchemaTable.helpers.test.js
    - app/src/components/SchemaTable.css
  modified:
    - app/src/components/SchemaTable.helpers.js
    - app/src/components/SchemaTable.jsx
decisions:
  - "Detection helpers extracted into SchemaTable.helpers.js (pure JS, no JSX) so they are exercised by node --test directly — Node 20+ has no built-in JSX parser, so a .test.js file that imported SchemaTable.jsx would SyntaxError at module load. Full-render JSX behavior is verified by the human checkpoint (Task 3)."
  - "isSchemaHeader is intentionally strict: exactly 3 columns AND lowercased+trimmed cells equal ['field','type','notes']. False positives are essentially impossible without the spec author writing that exact header. Verified by Tests 4-7 (4-col, Decision|Rationale|Outcome, Field|Type|Description, Stage|Status|Reason all rejected)."
  - "SchemaTable.jsx import was placed on a single line (not multi-line destructuring) so the plan's <verify> grep -q passes literally — the deeper key_links pattern was already multi-line tolerant, but normalizing to single-line satisfies both checks at no readability cost."
  - "FK chip modifier (--fk) is implemented via a thin readChildText helper duplicated locally in SchemaTable.jsx rather than imported from helpers.js. This keeps the JSX file from pulling pure-JS helpers into the render path for non-schema tables (where they are not needed)."
metrics:
  duration: "~10 minutes"
  completed: "2026-04-26"
  tasks_completed: 3
  files_changed: 4
  commits: 3
---

# Phase 2 Plan 04: Schema-Card Renderer Summary

**One-liner:** Replaced the Plan 01 stubs in `SchemaTable.{jsx,helpers.js}` with a full schema-card renderer — pure-JS detection + traversal helpers (11 node:test cases, RED→GREEN), a JSX dispatcher that routes 3-col `Field|Type|Notes` tables to a card layout while falling through to plain `<table>` for everything else, and a CSS file that themes exclusively via the seven `--schema-card-*` custom properties declared in Plan 01.

## What Was Built

### Task 1: Pure-JS schema-card helpers (RED → GREEN)

**Files:**
- Created `app/src/components/SchemaTable.helpers.test.js` (101 lines, 11 tests)
- Replaced `app/src/components/SchemaTable.helpers.js` (was `export {}`, now exports four named helpers)

**Helpers exported:**
- `isSchemaHeader(headerCells)` — D-08 detection: array of length 3 whose lowercased+trimmed entries equal `['field','type','notes']`.
- `extractHeaderCells(children)` — walks a React-element-like tree (`{type, props:{children}}`) for `<thead><tr><th>` and returns the array of header text strings (or `null` if structure missing).
- `extractBodyRows(children)` — walks for `<tbody><tr><td>` and returns rows-of-cells where each cell preserves its raw `children` (so backslash-escaped strings like `created\_by` survive D-10 untouched).
- `detectFkType(typeText)` — returns `true` iff the input string contains the literal substring `FK →`.

**TDD cycle (two commits):**
1. `cd1afd1` — `test(02-04): add failing tests for schema-card helpers` — RED. Test file references four named imports the helpers stub does not yet provide; node --test exits non-zero with a SyntaxError at module load.
2. `7a38795` — `feat(02-04): implement schema-card detection and traversal helpers` — GREEN. All 11 tests pass:

```
✔ Test 1: Title-Case Field|Type|Notes detected
✔ Test 2: lowercase field|type|notes detected
✔ Test 3: whitespace trimmed
✔ Test 4: 4-column Field|Type|Notes|Default NOT detected
✔ Test 5: Decision|Rationale|Outcome NOT detected
✔ Test 6: Field|Type|Description NOT detected (third column wrong)
✔ Test 7: Stage|Status|Reason NOT detected
✔ Test 8: null/empty/short input returns false
✔ Test 9: extractHeaderCells reads thead > tr > th text
✔ Test 10: extractBodyRows preserves cell children including backslash escapes
✔ Test 11: detectFkType identifies the FK arrow
ℹ tests 11   ℹ pass 11   ℹ fail 0
```

### Task 2: SchemaOrTable JSX dispatcher + CSS

**Files:**
- Modified `app/src/components/SchemaTable.jsx` — replaced the pass-through stub with a real dispatcher.
- Created `app/src/components/SchemaTable.css` — 73 lines of structural layout, no hex colors.

**Dispatcher behavior:**
- Reads `props.children` via `extractHeaderCells`.
- If the header doesn't match the schema-card pattern → returns `<table {...props}>{children}</table>` (plain markdown table fall-through).
- If the header matches → returns a `<div className="schema-card" role="group" aria-label="Data model">` wrapping `<div className="schema-card__row">` blocks for each body row, each containing `__field`, `__type` (with chip), and `__notes` cells.
- Type chips for FK types receive an additional `schema-card__type-chip--fk` class via `detectFkType` (D-11). The arrow `→` is preserved literally inside the chip text.
- Cell content flows through React's normal text-child path, so backslash escapes (D-10) survive untouched in the rendered DOM.

**CSS structure:**
- `.schema-card` — bordered container (`var(--schema-card-border)` + `var(--schema-card-background)`), 6px radius, 12px×16px padding.
- `.schema-card__row` — three-column grid: `minmax(140px, max-content) minmax(120px, max-content) 1fr`. Border-top separator between rows (suppressed on `:first-child`).
- `.schema-card__field` — monospace, `var(--schema-card-field-color)`.
- `.schema-card__type-chip` — pill background (`var(--schema-card-type-background)`), monospace, no-wrap.
- `.schema-card__type-chip--fk` — adds `1px solid var(--schema-card-accent)` border (Phase 4 will theme `--schema-card-accent` to MacPlants green).
- `.schema-card__notes` — `var(--schema-card-notes-color)`, slightly larger font.
- `@media (max-width: 640px)` — collapses the three-column grid to a single vertical stack.

**Verification:**
- `npm run build` exits 0. Bundle: `dist/assets/index-CJTKQVY0.js` 313.52 KB / **98.58 KB gzipped** — still under the 100 KB soft budget (Plan 01 was 98.07 KB; Plan 04 adds ~0.5 KB gz for the dispatcher + helpers + CSS).
- Bundle CSS jumped from 0.70 KB → 1.78 KB (the SchemaTable.css contribution).
- `npm test` exits 0 with 11 tests passing.
- `package.json` UNTOUCHED — Wave-2 file-disjointness contract holds.

**Commit:** `c855f93 feat(02-04): wire SchemaOrTable JSX dispatcher and schema-card CSS`.

### Task 3: Human verification checkpoint

This task is a `checkpoint:human-verify` — buildable/testable verification has passed (Tasks 1 and 2). Visual verification across the real spec must be performed by the human reviewer in the orchestrator's checkpoint review.

**Verification steps for the orchestrator/human reviewer:**

1. From the merged Wave-2 branch, run `npm run dev` and open the URL.
2. Scroll to the first PRD with a Data Model section (PRD-0 / `Users (Internal Staff)` around line 23 of `2026-04-26.md`). Confirm:
   - The Field|Type|Notes table appears as a card (rounded border, light background) with a row per field.
   - The field name is in monospace.
   - The type column shows a small "chip" (pill) with the type text.
   - Backslash escapes are visible — `created\_by` should render with a literal backslash before the underscore (D-10).
   - `FK → User` appears with the arrow intact in the chip, and the chip has a subtle border (the `--fk` modifier class — D-11).
3. Scroll to PRD-1 (Plant Database & Inventory). Sub-tables (Plants, Plant Variants, Plant Batches, …) each render as their own card.
4. Scroll to PRD-3 (Order Lifecycle). Orderable-related tables also become cards.
5. **Negative check:** Search the spec for any 3-column table that is NOT `Field|Type|Notes`. Planning-time grep confirmed there are none (`grep -c "^| Field"` returns 20; no `Decision|`, `Stage|`, `Feature|` rows). Action-item / decision tables (if present at the spec end) should render as plain markdown tables.
6. **DevTools:** inspect any schema card. Confirm computed border resolves from `var(--schema-card-border)` and chip background from `var(--schema-card-type-background)`. No `#2c8d4f` should appear in card-related computed styles (Phase 4 will introduce that override).
7. **Mobile:** resize <640px wide. Confirm field rows collapse vertically.
8. **Console:** no SchemaTable-related errors.

## Verification Results

| Check | Expected | Actual |
|-------|----------|--------|
| Schema tables in current spec | ~20 (per planning grep) | **20** (`grep -c "^| Field" project-spec/2026-04-26.md`) |
| `app/src/components/SchemaTable.helpers.js` exports four named functions | YES | YES (`isSchemaHeader`, `extractHeaderCells`, `extractBodyRows`, `detectFkType`) |
| `app/src/components/SchemaTable.helpers.test.js` has 11 `Test N:` blocks, no JSX, no React | YES | YES |
| `npm test` | exit 0, 11 pass | exit 0, 11 pass |
| `app/src/components/SchemaTable.jsx` imports the four helpers and renders `schema-card__row` / `__type-chip` | YES | YES |
| FK detection wired via `detectFkType` → `__type-chip--fk` modifier class | YES | YES (line 49 of SchemaTable.jsx) |
| `app/src/components/SchemaTable.css` references all six required CSS custom properties + `--schema-card-accent` | YES | YES (`--schema-card-border`, `--background`, `--field-color`, `--type-background`, `--type-color`, `--notes-color`, `--accent`) |
| No hex color codes in SchemaTable.{jsx,css} | YES | YES (`grep -E "#[0-9a-fA-F]{3,6}\b"` returns nothing) |
| `npm run build` | exit 0 | exit 0 (built in 632ms, 303 modules) |
| Bundle stays under 100 KB gz soft budget | YES | 98.58 KB gz (was 98.07 KB after Plan 01) |
| `package.json` modified by this plan | NO | NO (`git diff --stat package.json` empty) |

## Schema-Card Detection — False-Positive / False-Negative Audit

**Strict per D-08:** detection requires both `length === 3` AND `lowercased+trimmed` equality with `['field','type','notes']`.

**False-positive risk:** zero in the current spec. `grep -nE "^\| (Decision|Stage|Feature)" project-spec/2026-04-26.md` returns no matches. The only 3-column tables in the spec are the data-model tables themselves (verified at line 23 onward — every table line begins with field-name patterns, never headers like `Decision`, `Stage`, or `Feature`).

**False-negative risk:** zero for the current spec convention (`Field | Type | Notes`, Title-Case). Tests 1, 2, 3 cover the case-insensitive + trim edge cases that would be the only failure mode for a future spec author who writes `field | type | notes` or `  Field   ` instead.

**Defensive degradation:** if a future spec violates the convention (e.g. `FIELDS | TYPE | NOTE`), the table falls through to plain markdown rendering — looks like Phase 1 — degraded but never broken.

## Bundle Size Delta (vs Plan 01 baseline)

```
Before Plan 04 (Plan 01 final):
dist/assets/index-Cc7HcDzV.js       311.68 kB │ gzip: 98.07 kB
dist/assets/index-BvAgDrrp.css        0.70 kB │ gzip:  0.35 kB

After Plan 04:
dist/assets/index-CJTKQVY0.js       313.52 kB │ gzip: 98.58 kB   (+0.51 KB gz)
dist/assets/index-FEpeM92A.css        1.78 kB │ gzip:  0.71 kB   (+0.36 KB gz)
```

Total Plan-04 cost: **~0.87 KB gzipped** for the entire schema-card renderer (helpers + dispatcher + CSS). Headroom under the 100 KB soft budget remains comfortable for Plans 02, 03, 05.

## Wave-2 File-Disjointness Confirmation

Plan 04 touched only files inside its declared `files_modified` set:

| File | Plan 04 action | Owned by another Wave-2 plan? |
|------|----------------|-------------------------------|
| `app/src/components/SchemaTable.jsx` | modified | NO (this plan) |
| `app/src/components/SchemaTable.helpers.js` | modified | NO (this plan) |
| `app/src/components/SchemaTable.helpers.test.js` | created | NO (this plan) |
| `app/src/components/SchemaTable.css` | created | NO (this plan) |
| `package.json` | NOT touched | Plan 01 only |
| `app/src/SpecViewer.jsx` | NOT touched | Plan 01 only |
| `app/src/styles.css` | NOT touched | Plan 01 only |

No collisions with Plan 02 (cross-link), Plan 03 (mermaid), or Plan 05 (copy-button) are possible.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 — Blocking issue] Multi-line `import { ... }` failed plan's `<verify>` `grep -q "import { isSchemaHeader"` line check**

- **Found during:** Task 2 verification.
- **Issue:** The plan's snippet uses multi-line destructuring import; the `<verify>` shell uses `grep -q "import { isSchemaHeader"` which only matches single-line. The deeper `must_haves.key_links.pattern` regex `import \{[^}]*isSchemaHeader` is multi-line tolerant, but the literal verify command would have failed.
- **Fix:** Collapsed the destructured import onto a single line in `SchemaTable.jsx` (line 2). Both the `<verify>` grep and the `must_haves` regex now pass.
- **Files modified:** `app/src/components/SchemaTable.jsx` (line 2 — pre-commit edit, captured in commit `c855f93`).
- **Commit:** included in `c855f93 feat(02-04): wire SchemaOrTable JSX dispatcher and schema-card CSS`.

### Intentional Adaptations Preserved from Plan 01

**2. [Plan 01 environmental setup pattern preserved] `project-spec/` symlinked, `node_modules/` materialized**

- **Found during:** Worktree initial state check (no `project-spec/`, no `node_modules/`).
- **Resolution:** Mirrored Plan 01's environmental setup: `ln -s /…/project-spec/project-spec ./project-spec` and `npm install`. Both untracked, not committed (same as Plan 01 SUMMARY § "Environmental Setup").

## Auth Gates

None encountered.

## Known Stubs

None. The Plan 04 deliverables are real implementations; the only remaining stubs in `app/src/components/` are owned by Plans 02 (`crossLinkPlugin.js` + `CrossLinkText.jsx`), 03 (`MermaidPre.jsx`), and 05 (`Pre.jsx` fall-through branch). Each will be filled in by its own Wave-2 worktree.

## Threat Flags

None. No new network endpoints, auth paths, file access patterns, or schema changes at trust boundaries beyond what the plan's `<threat_model>` already documents (T-02-04-01 through T-02-04-05). The dispatcher uses no `dangerouslySetInnerHTML`; React's default text-child escaping handles T-02-04-01.

## Phase 4 Handoff

The seven CSS custom properties Phase 4 should override to apply MacPlants green to the schema-card layout:

| Property | Default | Phase 4 likely target |
|----------|---------|-----------------------|
| `--schema-card-accent` | `#586069` | `#2c8d4f` (used by FK chip border) |
| `--schema-card-type-background` | `#eaecef` | green-tinted neutral |
| `--schema-card-type-color` | `#24292e` | unchanged or darker |
| `--schema-card-border` | `#e1e4e8` | unchanged or green-tinted |
| `--schema-card-background` | `#fafbfc` | unchanged or pale green |
| `--schema-card-field-color` | `#24292e` | unchanged |
| `--schema-card-notes-color` | `#586069` | unchanged |

Phase 4 should override these in `:root` (or under a `.theme-macplants` class) — no JSX or component CSS changes required.

## Self-Check: PASSED

Verified files exist:
- FOUND: app/src/components/SchemaTable.helpers.js (modified — exports four helpers)
- FOUND: app/src/components/SchemaTable.helpers.test.js (created — 11 tests)
- FOUND: app/src/components/SchemaTable.jsx (modified — real dispatcher)
- FOUND: app/src/components/SchemaTable.css (created — layout + custom-property theming)

Verified commits exist:
- FOUND: cd1afd1 (Task 1 RED — `test(02-04): add failing tests for schema-card helpers`)
- FOUND: 7a38795 (Task 1 GREEN — `feat(02-04): implement schema-card detection and traversal helpers`)
- FOUND: c855f93 (Task 2 — `feat(02-04): wire SchemaOrTable JSX dispatcher and schema-card CSS`)

Verified test + build pass:
- FOUND: `npm test` exit 0, 11 tests pass
- FOUND: `npm run build` exit 0, 303 modules transformed in 632ms, bundle 98.58 KB gz

Verified no hex colors:
- FOUND: `grep -E "#[0-9a-fA-F]{3,6}\b" app/src/components/SchemaTable.{jsx,css}` returns no matches.
