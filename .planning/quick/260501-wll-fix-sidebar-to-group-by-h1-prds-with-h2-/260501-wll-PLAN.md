---
phase: 260501-wll
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - app/src/components/Sidebar.jsx
  - app/src/components/useScrollSpy.js
  - app/src/components/useScrollSpy.test.js
autonomous: false
requirements:
  - QUICK-260501-wll
must_haves:
  truths:
    - "Sidebar top-level entries are PRD titles (e.g. 'PRD-0: ERP Account Types', 'PRD-1: Plant Database & Inventory'), not the repeated H2 sub-section labels (Data Model, What Is It, etc.)"
    - "Empty H1s and non-PRD H1s ('Meeting Action Items', 'Scope Decisions Summary') do NOT appear as sidebar groups"
    - "Clicking a PRD entry expands its H2 sub-sections (Data Model, What It Must Do, How We Know It's Done, etc.) underneath it"
    - "Scroll-spy still works: scrolling into an H2 sub-section keeps the parent PRD expanded and highlights the active sub-section"
    - "All useScrollSpy unit tests pass, including new tests for the PRD- prefix filter"
  artifacts:
    - path: "app/src/components/Sidebar.jsx"
      provides: "Heading collection updated to query h1[id] + h2[id] with level mapping H1->1, H2->2"
      contains: "h1[id], .spec-viewer h2[id]"
    - path: "app/src/components/useScrollSpy.js"
      provides: "groupHeadingsByPrd groups level-1 as PRDs (text starts with 'PRD-') with level-2 children; findActivePrd verified for new levels"
      contains: "level === 1"
    - path: "app/src/components/useScrollSpy.test.js"
      provides: "Tests updated for H1/H2 grouping; new cases for PRD- prefix filter (empty H1, non-PRD H1, malformed H2-only)"
      contains: "PRD-"
  key_links:
    - from: "Sidebar.jsx collectHeadings()"
      to: "useScrollSpy.js groupHeadingsByPrd()"
      via: "flat headings array with level: 1 | 2"
      pattern: "level: el.tagName === 'H1' \\? 1 : 2"
    - from: "useScrollSpy.js groupHeadingsByPrd()"
      to: "useScrollSpy.js findActivePrd()"
      via: "groups array consumed by Sidebar to compute activePrdId"
      pattern: "h.level === 1.*startsWith\\('PRD-'\\)"
---

<objective>
Fix the Sidebar to match the spec's new H1/H2 heading structure. The spec migrated from `## **PRD-N: ...**` (H2 PRDs) to `# **PRD-N: ...**` (H1 PRDs) with H2 sub-sections. The Sidebar still queries H2/H3, so it currently shows a flat list of repeated H2 sub-section labels ("Data Model", "What Is It", etc.) instead of PRD titles.

Purpose: Restore the PRD-grouped navigation that the sidebar is supposed to provide so the client and developer can navigate the spec by PRD again.

Output: Sidebar collects H1+H2, groupHeadingsByPrd groups H1 (filtered to "PRD-" prefix only) with H2 children, tests cover the new behavior.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
</execution_context>

<context>
@./CLAUDE.md
@app/src/components/Sidebar.jsx
@app/src/components/useScrollSpy.js
@app/src/components/useScrollSpy.test.js

<interfaces>
<!-- Current contracts the executor must update. Extracted from the codebase. -->

From app/src/components/useScrollSpy.js (current):
```js
// Input: [{ id, level, text }] where level is 2 or 3
// Output: [{ id, text, children: [{ id, text }] }]
export function groupHeadingsByPrd(headings) { /* level===2 starts a group, level===3 -> child */ }

// findActivePrd is level-agnostic — works on the groups shape, not levels.
// Should NOT need changes, but verify after the level update.
export function findActivePrd(groups, activeId) { /* ... */ }
```

From app/src/components/Sidebar.jsx:43-52 (current collectHeadings):
```js
const nodes = document.querySelectorAll('.spec-viewer h2[id], .spec-viewer h3[id]');
// level: el.tagName === 'H2' ? 2 : 3
```

Spec H1 reality (project-spec/2026-05-01.md):
- Valid PRDs: `# **PRD-0: ERP Account Types**`, `# **PRD-1: Plant Database & Inventory**`, `# **PRD-3.4: ...**`, `# **PRD-XX: DPD ...**`
- Empty H1s exist in source: `# ` (no text — generated H1 has empty `id` and empty `textContent`)
- Non-PRD H1s exist: `# **Meeting Action Items (April 2026)**`, `# **Scope Decisions Summary (...)**`

Filter rule: only headings whose `text` starts with `PRD-` become groups. The check runs against the literal text (after react-markdown strips the `**` markdown emphasis, the rendered textContent is e.g. `"PRD-0: ERP Account Types"`).

CSS class decision (D-NOTE):
- Keep `sidebar-link--h2` for group entries and `sidebar-link--h3` for child entries.
- Rationale: the class names are purely cosmetic — they style "group" vs "child" indentation/weight, not the literal heading level. Renaming would touch Sidebar.css for zero behavioral gain and risk regressing the schema-index static link (line 167) which also uses `sidebar-link--h2`.
- Do NOT rename. Add a brief comment in Sidebar.jsx near the className strings explaining the class names are decoupled from heading level.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Update groupHeadingsByPrd + tests for H1/H2 with PRD- filter</name>
  <files>app/src/components/useScrollSpy.js, app/src/components/useScrollSpy.test.js</files>
  <behavior>
    Tests to add/update in useScrollSpy.test.js (test-first):
    - Test 2 (rewrite): "Only H1s with PRD- prefix yield one group per H1 with empty children"
        Input: [{id:'prd-0', level:1, text:'PRD-0: ERP Account Types'}, {id:'prd-1', level:1, text:'PRD-1: Plants'}]
        Expect: 2 groups, both with empty children.
    - Test 3 (rewrite): "PRD H1 followed by 2 H2s yields one group with 2 children"
        Input: [{id:'prd-1', level:1, text:'PRD-1'}, {id:'what-is-it', level:2, text:'What Is It'}, {id:'data-model', level:2, text:'Data Model'}]
        Expect: 1 group with 2 children.
    - Test 4 (rewrite): "Two PRD H1s with H2s between them assign correctly"
    - Test 5 (rewrite): "H2 before any H1 is dropped (orphan)"
    - NEW Test 6: "Empty-text H1 is NOT a group"
        Input: [{id:'', level:1, text:''}, {id:'prd-1', level:1, text:'PRD-1'}, {id:'what-is-it', level:2, text:'What Is It'}]
        Expect: 1 group ('prd-1') with one child. The empty H1 must not appear, and the H2 must attach to PRD-1, not be dropped.
    - NEW Test 7: "Non-PRD H1 is NOT a group, and its child H2s are dropped (no current group)"
        Input: [{id:'meeting-items', level:1, text:'Meeting Action Items (April 2026)'}, {id:'item-1', level:2, text:'Item 1'}, {id:'prd-1', level:1, text:'PRD-1: Plants'}, {id:'data-model', level:2, text:'Data Model'}]
        Expect: 1 group ('prd-1') with 1 child ('data-model'). The non-PRD H1 and its H2 child must not appear.
    - NEW Test 8: "Lone H2 without a preceding PRD H1 is dropped (malformed)"
        Input: [{id:'data-model', level:2, text:'Data Model'}]
        Expect: empty array.
    - NEW Test 9: "PRD- prefix filter is case-sensitive and exact prefix"
        Input: [{id:'prd-foo', level:1, text:'prd-1: lowercase'}, {id:'aprd', level:1, text:'APRD-1'}, {id:'real', level:1, text:'PRD-1: Real'}]
        Expect: 1 group ('real'). Only the exact 'PRD-' prefix qualifies.
    - findActivePrd tests (Test 1-4): keep as-is. findActivePrd is level-agnostic — it operates on the groups shape, not on levels. Verify by re-running existing tests unchanged after the implementation update.
  </behavior>
  <action>
    1. RED — Update useScrollSpy.test.js with the test cases above. Replace existing groupHeadingsByPrd tests 2-5 with the H1/H2 versions and append new tests 6-9. Keep pickActiveHeading tests untouched (level-agnostic). Keep findActivePrd tests untouched (level-agnostic). Run `cd app && npm test` — new/updated groupHeadingsByPrd tests MUST fail.

    2. GREEN — Update `groupHeadingsByPrd` in useScrollSpy.js:
       - Change `if (h.level === 2)` to `if (h.level === 1)` for the PRD-group branch.
       - Add the prefix filter inside the level===1 branch: only push a new group if `(h.text || '').startsWith('PRD-')`. If the H1 fails the filter, set `current = null` so any subsequent H2s under that non-PRD H1 are dropped (matches Test 7 expectation).
       - Change `else if (h.level === 3)` to `else if (h.level === 2)` for the children branch.
       - Update the JSDoc comment block at lines 61-72: replace "level is 2 or 3" → "level is 1 or 2"; "Each H2 starts a new group" → "Each H1 whose text starts with 'PRD-' starts a new group"; "Each H3 is appended" → "Each H2 is appended"; "H3s before any H2" → "H2s before any qualifying H1"; "(H1 site title, H4 detail groups)" → "(H3 entity headings, H4 detail groups)".

    3. Verify findActivePrd is unchanged — read its body (lines 103-114): it iterates groups and children purely by `id`, no level reference. No code change needed. Update its JSDoc comment lines 92-102: rename "H2's own id" → "PRD H1's own id"; "child H3's id" → "child H2's id"; "parent H2 id" → "parent PRD H1 id" (twice).

    4. Update the file-header JSDoc (lines 1-28): change "H3 sub-headings expand only under the active PRD" → "H2 sub-sections expand only under the active PRD"; "H3-active state back to its parent H2 id" → "H2-active state back to its parent PRD H1 id"; "resolve H3-active to its parent H2" → "resolve H2-active to its parent PRD H1".

    5. Run `cd app && npm test` — ALL tests pass, including the new ones.
  </action>
  <verify>
    <automated>cd app && npm test</automated>
  </verify>
  <done>
    All useScrollSpy tests pass. groupHeadingsByPrd groups level-1 with PRD- prefix filter and level-2 children. findActivePrd code is unchanged but its comments reflect new levels. New tests 6-9 cover empty H1, non-PRD H1, lone H2, and case-sensitive prefix.
  </done>
</task>

<task type="auto">
  <name>Task 2: Update Sidebar.jsx collectHeadings to query H1/H2</name>
  <files>app/src/components/Sidebar.jsx</files>
  <action>
    1. Update `collectHeadings` (lines 43-52):
       - Change selector from `'.spec-viewer h2[id], .spec-viewer h3[id]'` to `'.spec-viewer h1[id], .spec-viewer h2[id]'`.
       - Change level mapping from `el.tagName === 'H2' ? 2 : 3` to `el.tagName === 'H1' ? 1 : 2`.

    2. Update the `Decisions` JSDoc block at lines 14-27:
       - Line 16: change `'.spec-viewer h2[id], .spec-viewer h3[id]'` to `'.spec-viewer h1[id], .spec-viewer h2[id]'`.
       - Line 18: change "H3 sub-headings auto-expand under the active PRD" → "H2 sub-sections auto-expand under the active PRD".
       - Line 19: change "flat id list through useScrollSpy + findActivePrd" → leave as-is (still accurate).

    3. Add a comment ABOVE the first `sidebar-link--h2` className string (around line 167 or 194) explaining the class-name decision:

       ```jsx
       {/* Class names sidebar-link--h2 / --h3 are cosmetic group/child
           indicators, intentionally decoupled from the underlying heading
           level (which migrated H2->H1 and H3->H2 with the spec format
           change). Do not rename — it would touch Sidebar.css and the
           Schema Index static link for zero behavioral gain. */}
       ```

       Place this comment once, immediately above the schema-index `<a>` block at line 164 (so it documents the class naming for the whole component in a single visible place).

    4. Do NOT change the className strings themselves. Do NOT touch Sidebar.css. Do NOT touch the schema-index entry's behavior — only add the comment above it.

    5. Run `cd app && npm test` — confirms tests still pass (Sidebar has no direct unit tests; this verifies nothing regressed in the helpers).

    6. Run `cd app && npm run build` — confirms the production build still compiles (catches typos/syntax errors in JSX).
  </action>
  <verify>
    <automated>cd app && npm test && npm run build</automated>
  </verify>
  <done>
    Sidebar.jsx queries h1[id]+h2[id], maps H1->1 and H2->2, has a comment documenting the class-name decoupling decision. CSS classes unchanged. Tests pass. Production build succeeds.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Manual sidebar verification in dev server</name>
  <what-built>
    Sidebar now collects H1+H2 from the rendered spec, filters H1s to those starting with "PRD-", and groups H2 sub-sections under each PRD. The repeating "Data Model"/"What Is It"/etc. flat list is replaced with PRD-numbered top-level entries.
  </what-built>
  <how-to-verify>
    1. From the repo root, run `cd app && npm run dev` (or whatever the existing dev script is — check app/package.json).
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
    6. Confirm "Data Model", "What Is It", "What It Must Do", "How We Know It's Done" do NOT appear as TOP-LEVEL entries (the bug we're fixing).
    7. Click "PRD-1: Plant Database & Inventory" — confirm:
       (a) the page scrolls smoothly to that section,
       (b) the entry highlights as active (bold + left accent bar),
       (c) the H2 sub-sections (Data Model, What It Must Do, etc.) appear INDENTED below it as children.
    8. Scroll down through PRD-1's content — confirm the active sub-section highlight follows scroll (scroll-spy works), and PRD-1 stays expanded.
    9. Scroll to PRD-2.0 — confirm PRD-1 collapses and PRD-2.0 expands with its own children.
    10. Confirm "Schema Index" entry at the top still works (click it, route changes to #/schema, page shows the schema index).
    11. Resize browser to <768px width — confirm the hamburger button appears and toggles the drawer with the new PRD list.
  </how-to-verify>
  <resume-signal>Type "approved" if all 11 checks pass. If any fail, describe which check and what you saw, and the plan will be revised.</resume-signal>
</task>

</tasks>

<verification>
- `cd app && npm test` passes (all useScrollSpy tests including new prefix-filter tests).
- `cd app && npm run build` succeeds.
- Manual verification (Task 3) confirms PRDs are grouped, sub-sections expand under active PRD, empty/non-PRD H1s are filtered out, scroll-spy still tracks the active section.
</verification>

<success_criteria>
- Sidebar shows PRD titles as top-level entries, NOT "Data Model"/"What Is It" etc.
- Empty H1s and non-PRD H1s ("Meeting Action Items", "Scope Decisions Summary") are filtered out.
- Active PRD expands to show its H2 sub-sections; scroll-spy keeps the right group expanded as the user scrolls.
- All useScrollSpy unit tests pass, including 4 new tests covering the PRD- prefix filter.
- CSS classes (`sidebar-link--h2`, `sidebar-link--h3`) preserved as documented cosmetic indicators — Sidebar.css untouched.
- Schema Index static link still works.
</success_criteria>

<output>
After completion, create `.planning/quick/260501-wll-fix-sidebar-to-group-by-h1-prds-with-h2-/260501-wll-SUMMARY.md` documenting the change, the class-name decision, and any follow-ups (e.g. "the empty H1 lines in project-spec/2026-05-01.md are content cleanup the user owns").
</output>
