---
phase: 260501-wll
plan: 01
subsystem: sidebar-navigation
tags: [sidebar, scroll-spy, h1-h2-migration]
requires: []
provides:
  - sidebar-h1-h2-grouping
  - prd-prefix-filter
affects:
  - app/src/components/Sidebar.jsx
  - app/src/components/useScrollSpy.js
  - app/src/components/useScrollSpy.test.js
tech-stack:
  added: []
  patterns:
    - PRD- prefix filter on H1 text (case-sensitive, exact-prefix)
    - Non-PRD H1 resets the current group so child H2s under it are also dropped
key-files:
  created: []
  modified:
    - app/src/components/Sidebar.jsx
    - app/src/components/useScrollSpy.js
    - app/src/components/useScrollSpy.test.js
decisions:
  - "Class names sidebar-link--h2 / --h3 are cosmetic group/child indicators, intentionally decoupled from the underlying heading level. Not renamed (CSS untouched)."
  - "PRD- prefix filter is case-sensitive and exact-prefix. 'prd-' (lowercase) and 'APRD-' do not qualify."
  - "Non-PRD H1s reset current=null so any subsequent H2 children under them are dropped, not silently attached to the previous PRD."
metrics:
  duration: ~3 min
  completed: 2026-05-01T22:38:47Z
  tasks_completed: 2 of 3 (Task 3 is human verification, deferred per orchestrator constraints)
---

# Phase 260501-wll Plan 01: Fix Sidebar to Group by H1 PRDs with H2 Sub-sections — Summary

Sidebar now collects H1+H2 from the rendered DOM, filters H1s to those starting with "PRD-", and groups H2 sub-sections under each PRD — restoring PRD-grouped navigation after the spec migrated from `## **PRD-N**` (H2) to `# **PRD-N**` (H1) headings.

## What Changed

**Root cause:** The spec format moved PRD titles from H2 to H1 (and sub-sections from H3 to H2). The Sidebar's `collectHeadings` was still querying `h2[id], h3[id]`, so it picked up the repeated H2 sub-section labels ("Data Model", "What Is It", etc.) as flat top-level entries instead of the actual PRD titles.

**Fix:**

1. **`useScrollSpy.js` — `groupHeadingsByPrd`** (commit 99c4988):
   - Switched group level from 2 → 1 and child level from 3 → 2.
   - Added a `PRD-` prefix filter on H1 text: only H1s whose text starts with `'PRD-'` become groups. Non-PRD H1s (empty H1s, "Meeting Action Items", "Scope Decisions Summary") are dropped.
   - When a non-PRD H1 is encountered, `current` is reset to `null` so any H2 children that follow under that non-PRD H1 are also dropped (rather than being silently attached to the previous PRD group).
   - JSDoc updated for `groupHeadingsByPrd`, `findActivePrd`, and the file header to reflect new H1/H2 levels.
   - `findActivePrd` implementation is unchanged — it iterates `groups` and `children` purely by `id`, with no level reference.

2. **`Sidebar.jsx` — `collectHeadings`** (commit 50761c7):
   - DOM selector: `'.spec-viewer h2[id], .spec-viewer h3[id]'` → `'.spec-viewer h1[id], .spec-viewer h2[id]'`.
   - Level mapping: `el.tagName === 'H2' ? 2 : 3` → `el.tagName === 'H1' ? 1 : 2`.
   - Updated the `Decisions` JSDoc block (D-18, D-01) to reference H1/H2 instead of H2/H3.
   - Added a comment block above the schema-index static link documenting the class-name decoupling decision (`sidebar-link--h2` / `--h3` are cosmetic group/child indicators, not heading levels).

3. **`useScrollSpy.test.js`** (commit 2503b66, RED phase):
   - Rewrote tests 2-5 to use H1/H2 levels with PRD-prefixed text.
   - Added tests 6-9: empty-text H1 filter, non-PRD H1 with H2 children dropped, lone H2 dropped, case-sensitive `PRD-` prefix.
   - `pickActiveHeading` and `findActivePrd` tests untouched (level-agnostic).

## Tasks

| Task | Name                                                          | Status              | Commit  |
| ---- | ------------------------------------------------------------- | ------------------- | ------- |
| 1    | Update groupHeadingsByPrd + tests for H1/H2 with PRD- filter  | Done (TDD)          | 2503b66 (RED), 99c4988 (GREEN) |
| 2    | Update Sidebar.jsx collectHeadings to query H1/H2             | Done                | 50761c7 |
| 3    | Manual sidebar verification in dev server                     | Deferred to user    | n/a     |

## Verification

**Automated (passed):**
- `npm test` → 129 tests pass (4 new tests added: groupHeadingsByPrd Tests 6, 7, 8, 9; net +4 from 125 baseline). All groupHeadingsByPrd, pickActiveHeading, and findActivePrd cases green.
- `npm run build` → Vite production build succeeds.

**Manual (deferred — user to run after merge):**

The original plan's Task 3 listed 11 checks for the user to perform via the dev server. Per orchestrator constraint (the dev server cannot be opened from a subagent worktree usefully), these are recorded here for the user to run after merging the plan branch:

1. From the repo root, run `npm run dev`.
2. Open the URL it prints (typically http://localhost:5173).
3. Confirm the LEFT SIDEBAR shows top-level entries that look like PRD titles:
   - "PRD-0: ERP Account Types"
   - "PRD-0.1 - Login Permissions" (or similar — the dash escape is content)
   - "PRD-1: Plant Database & Inventory"
   - "PRD-1.1: Purchase Orders — Lifecycle"
   - "PRD-2.0: Customers"
   - "PRD-2.1.1: Trade Customer Accounts"
   - "PRD-2.1.2: Retail Customer Accounts"
   - "PRD-03: Order Lifecycle"
   - "PRD-3.1", "PRD-3.2", "PRD-3.3", "PRD-3.4"
   - "PRD-04", "PRD-05", "PRD-6", "PRD-06", "PRD-7", "PRD-XX"
4. Confirm "Meeting Action Items (April 2026)" and "Scope Decisions Summary (Confirmed in Meeting)" do NOT appear as sidebar entries (they're H1s but not PRD- prefixed).
5. Confirm there are NO empty entries from the empty H1 lines in the source.
6. Confirm "Data Model", "What Is It", "What It Must Do", "How We Know It's Done" do NOT appear as TOP-LEVEL entries (the bug being fixed).
7. Click "PRD-1: Plant Database & Inventory" — confirm:
   (a) the page scrolls smoothly to that section,
   (b) the entry highlights as active (bold + left accent bar),
   (c) the H2 sub-sections (Data Model, What It Must Do, etc.) appear INDENTED below it as children.
8. Scroll down through PRD-1's content — confirm the active sub-section highlight follows scroll (scroll-spy works), and PRD-1 stays expanded.
9. Scroll to PRD-2.0 — confirm PRD-1 collapses and PRD-2.0 expands with its own children.
10. Confirm "Schema Index" entry at the top still works (click it, route changes to #/schema, page shows the schema index).
11. Resize browser to <768px width — confirm the hamburger button appears and toggles the drawer with the new PRD list.

## Decisions Made

- **Keep CSS class names `sidebar-link--h2` / `--h3` as-is.** They're cosmetic indicators of group/child, not literal heading levels. Renaming would require touching `Sidebar.css` and the schema-index static link (which also uses `sidebar-link--h2`) for zero behavioral gain. A comment was added in `Sidebar.jsx` to document this decoupling so a future reader doesn't try to "fix" the apparent mismatch.
- **PRD- prefix filter is case-sensitive and exact-prefix** (`text.startsWith('PRD-')`). `'prd-'` lowercase and `'APRD-'` do not qualify. This matches how the spec is authored (always uppercase `PRD-`) and avoids false positives.
- **Non-PRD H1s reset `current = null`.** When the parser encounters an H1 that fails the prefix filter, any subsequent H2 children are dropped, not attached to the previously seen PRD. This matches Test 7 expectation: an H2 under "Meeting Action Items" should not silently appear under the previous PRD.

## Deviations from Plan

None — plan executed exactly as written. The plan's note that the regenerated `schema-index.json` / `search-index.json` files might appear during build verification was confirmed: `npm run build` regenerated them via the `prebuild` script, but the deltas are unrelated to this plan's scope (they reflect drift between the committed indexes and the current spec content). Those changes were reverted to keep the Task 2 commit focused. If the user wants the indexes refreshed, that's a separate one-line `npm run build && git add app/src/{schema-index,search-index}.json` step.

## Follow-ups for the User

1. **Empty H1 lines in `project-spec/2026-05-01.md`** — the source has bare `# ` heading lines (no text) that this plan now correctly filters out of the sidebar. They're still present in the source markdown and may render as empty H1 elements in the page body. That's content cleanup the user owns; it's outside the scope of a sidebar fix.
2. **Stale `schema-index.json` / `search-index.json`** — committed indexes are out of sync with the current spec. Running `npm run build && git add app/src/{schema-index,search-index}.json` and committing will refresh them, but doing so is unrelated to this fix.

## Self-Check: PASSED

- [x] FOUND: app/src/components/Sidebar.jsx (modified)
- [x] FOUND: app/src/components/useScrollSpy.js (modified)
- [x] FOUND: app/src/components/useScrollSpy.test.js (modified)
- [x] FOUND commit 2503b66 (test: RED phase)
- [x] FOUND commit 99c4988 (feat: GREEN phase, groupHeadingsByPrd)
- [x] FOUND commit 50761c7 (feat: Sidebar collectHeadings)
- [x] All 129 tests pass (4 new + 125 baseline)
- [x] `npm run build` succeeds
