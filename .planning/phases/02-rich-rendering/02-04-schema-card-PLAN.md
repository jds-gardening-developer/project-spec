---
phase: 02-rich-rendering
plan: 04
type: execute
wave: 2
depends_on:
  - 02-01
files_modified:
  - app/src/components/SchemaTable.jsx
  - app/src/components/SchemaTable.helpers.js
  - app/src/components/SchemaTable.helpers.test.js
  - app/src/components/SchemaTable.css
requirements:
  - REND-03
autonomous: false
must_haves:
  truths:
    - "Three-column tables whose header row reads (case-insensitive, trimmed) `Field | Type | Notes` render as styled schema cards."
    - "All other tables — including comma-separated 3-column tables, 4-column tables, action-item tables — render as plain markdown tables."
    - "Field names retain their backslash-escaped underscores literally (e.g. `created\\_by` stays as `created\\_by`); the renderer does not unescape."
    - "Type values like `FK → Plant` render as a chip with the arrow preserved."
    - "All color values in the schema-card visual theme come from CSS custom properties declared in styles.css (no hard-coded brand color)."
    - "Pure-JS detection + traversal helpers live in SchemaTable.helpers.js so they are unit-testable under `node --test` (Node 20+ does not parse JSX)."
  artifacts:
    - path: "app/src/components/SchemaTable.helpers.js"
      provides: "Pure-JS helpers: isSchemaHeader (D-08), extractHeaderCells, extractBodyRows, detectFkType (D-11). No JSX, no React imports, no DOM."
      contains: "isSchemaHeader"
    - path: "app/src/components/SchemaTable.helpers.test.js"
      provides: "node:test cases covering isSchemaHeader detection rules and the AST traversal helpers."
    - path: "app/src/components/SchemaTable.jsx"
      provides: "SchemaOrTable dispatcher: imports helpers, detects schema-card pattern, routes to SchemaCard rendering, falls through to default <table> otherwise."
      contains: "isSchemaHeader"
    - path: "app/src/components/SchemaTable.css"
      provides: "Visual layout for schema cards (border, padding, monospace, type chip, field-row grid)."
  key_links:
    - from: "app/src/components/SchemaTable.jsx"
      to: "app/src/components/SchemaTable.helpers.js"
      via: "import { isSchemaHeader, extractHeaderCells, extractBodyRows, detectFkType }"
      pattern: "import \\{[^}]*isSchemaHeader"
    - from: "app/src/components/SchemaTable.helpers.js"
      to: "thead row text content"
      via: "extractHeaderCells walks React children to find the <thead><tr><th> cells"
      pattern: "thead|extractHeaderCells"
---

<objective>
Implement REND-03. Replace the Plan 01 stubs in `SchemaTable.jsx` and `SchemaTable.helpers.js`. Architectural note: detection + traversal logic lives in `SchemaTable.helpers.js` (pure JS, no JSX) so it can be exercised by `node --test`. The thin JSX wrapper in `SchemaTable.jsx` is verified by the human checkpoint (Task 3) — Node 20+ has no built-in JSX parser, so attempting to test full-render via `renderToStaticMarkup` from a `.test.js` file that imports `.jsx` would fail at module load with a SyntaxError.

The dispatcher:

1. **Detects the schema-card pattern** strictly per D-08: a `<table>` qualifies as a schema card iff it has exactly 3 columns AND its `<thead>` row text content, lowercased and trimmed cell-by-cell, equals `["field", "type", "notes"]`. Anything else falls through to a default `<table>` render so action-item tables, decision tables, etc. continue to look normal.

2. **Renders schema cards** per D-09: card-per-table layout. The whole table becomes one bordered card. Each row becomes a horizontal "field row":
   - Left: field name in monospace (e.g. `created\_by` — backslash kept literal per D-10)
   - Middle: type chip (monospace, neutral background; arrow `→` preserved literally per D-11)
   - Right: notes prose

3. **Defers theming** per D-12 / D-19. All colors come from `--schema-card-*` CSS custom properties declared in `app/src/styles.css` by Plan 01. Phase 4 overrides those to apply MacPlants green to chip backgrounds and accents.

Today's spec (`project-spec/2026-04-26.md`) contains roughly 20 schema tables and zero non-schema 3-column tables — verified by `grep -c "^| Field" project-spec/2026-04-26.md` at planning time. Detection is conservative on purpose: if a future spec adds e.g. a `Decision | Rationale | Outcome` table, it will render as a normal table, not as a schema card.

Purpose: The data-model viewer is the single most-mentioned win in CONTEXT.md. ~20 tables become readable cards instead of dense markdown tables.
Output: SchemaTable.helpers.js (pure JS) + helpers test (`*.test.js`, no JSX) + SchemaTable.jsx (thin JSX wrapper) + SchemaTable.css.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/02-rich-rendering/02-CONTEXT.md
@.planning/phases/02-rich-rendering/02-01-foundation-PLAN.md
@app/src/SpecViewer.jsx
@app/src/components/SchemaTable.jsx
@app/src/components/SchemaTable.helpers.js
@app/src/styles.css
@project-spec/2026-04-26.md

<interfaces>
<!-- Plan 01 wired components.table = SchemaOrTable in SpecViewer.jsx. -->
<!-- Plan 01 also created the empty SchemaTable.helpers.js stub (`export {}`) so this plan can land
     pure-JS helpers in a stable file path without contention. -->
<!-- Plan 01 added `npm test` to package.json targeting `app/src/components/*.test.js` —
     Plan 04 does NOT modify package.json. -->

react-markdown@9 calls SchemaOrTable with: { node, children, ...props } where children is a tree
of React elements: typically [<thead>...<tr>...<th>...</th>...</tr></thead>, <tbody>...].

Inspecting children:
  - children is usually an array of two nodes: <thead> and <tbody>.
  - <thead>.props.children is a single <tr>; <tr>.props.children is an array of <th> elements.
  - <th>.props.children is a string (the header text) or a small element tree (if the header
    contained markdown formatting like bold — though in the spec, headers are plain text).

The helpers walk this tree using only object-property reads (no React internals, no JSX parsing).
That is why everything testable lives in `SchemaTable.helpers.js`: the helpers operate on plain
JS object trees with the shape `{type, props: {children}}` — they happily accept either real
React elements (in production) or hand-built test fixtures (in `.test.js`).

Reading text content from a React-element-like tree:
  function readText(el) {
    if (el == null) return '';
    if (typeof el === 'string' || typeof el === 'number') return String(el);
    if (Array.isArray(el)) return el.map(readText).join('');
    if (el.props && el.props.children !== undefined) return readText(el.props.children);
    return '';
  }

For preceding-heading lookup (D-09 card title), the simplest reliable mechanism would be a
module-level Map<line, headingText> populated by also overriding `h3`/`h4` components. CONTEXT.md
D-09 says "titled by the preceding `####` sub-header text WHEN PRESENT" — meaning the title is
optional. Plan 04 omits the heading lookup; the card has no title strip. The acceptance criteria
treat the title as optional and the human checkpoint does not test for it. If wanted later,
Phase 4 polish can add the heading-tracking trick.

JSX-in-tests is a deliberate non-goal:
  - The original draft of this plan tested SchemaOrTable via `renderToStaticMarkup`, requiring
    JSX in the test file. Node 20+ does not parse JSX, so importing `./SchemaTable.jsx` from a
    `.test.js` file fails at module load.
  - Workarounds considered and rejected: (a) add `tsx`/`esbuild`/`vitest` (extra dep, slower,
    bigger context cost); (b) write tests as `.test.jsx` and update the npm-test glob (touches
    `package.json`, breaks Wave-2 file disjointness with Plan 02); (c) use `React.createElement`
    inside `.test.js` to assemble trees and assert on `renderToStaticMarkup` output (still needs
    react-dom/server which is fine, but the test exercises React's own rendering — not the
    behavior we care about).
  - The chosen approach (extract pure helpers, test only those) is the simplest and matches the
    revision feedback exactly. Full-render verification happens in Task 3's human checkpoint.
</interfaces>
</context>

<tasks>

<task type="auto" tdd="true">
  <name>Task 1: Implement and test pure-JS schema-card helpers (RED→GREEN)</name>
  <files>
    app/src/components/SchemaTable.helpers.js,
    app/src/components/SchemaTable.helpers.test.js
  </files>
  <read_first>
    - app/src/components/SchemaTable.helpers.js (Plan 01 stub — currently `export {}` with a JSDoc describing the four planned helpers)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-08 detection rule, D-09 card layout, D-10 escape preservation, D-11 FK arrow)
    - project-spec/2026-04-26.md lines 23-30 (sample data-model table)
    - project-spec/2026-04-26.md grep `^| Field` for the count of schema tables (~20 expected)
  </read_first>
  <behavior>
    These tests target ONLY the pure helpers in `SchemaTable.helpers.js`. The helpers operate on
    plain JS object trees of the shape `{type, props: {children}}`, which lets us hand-build test
    fixtures without JSX. Render-time JSX behavior is verified by the human checkpoint in Task 3.

    - Test 1: `isSchemaHeader(['Field', 'Type', 'Notes'])` returns `true` (Title-Case).
    - Test 2: `isSchemaHeader(['field', 'type', 'notes'])` returns `true` (lowercase).
    - Test 3: `isSchemaHeader(['  Field  ', 'Type', 'Notes'])` returns `true` (trimmed).
    - Test 4: `isSchemaHeader(['Field', 'Type', 'Notes', 'Default'])` returns `false` (4 columns).
    - Test 5: `isSchemaHeader(['Decision', 'Rationale', 'Outcome'])` returns `false`.
    - Test 6: `isSchemaHeader(['Field', 'Type', 'Description'])` returns `false` (third column wrong).
    - Test 7: `isSchemaHeader(['Stage', 'Status', 'Reason'])` returns `false`.
    - Test 8: `isSchemaHeader(null)` and `isSchemaHeader([])` and `isSchemaHeader(['a','b'])` all return `false`.
    - Test 9: `extractHeaderCells` reads a hand-built `[{type:'thead', props:{children:{type:'tr', props:{children:[{type:'th', props:{children:'Field'}}, ...]}}}}, ...]` tree and returns `['Field','Type','Notes']`.
    - Test 10: `extractBodyRows` reads a hand-built tree with `<tbody><tr><td>...</td>...</tr>...</tbody>` shape and returns an array-of-arrays where the inner arrays preserve cell `children` as-is (so backslash-escaped strings like `'created\\_by'` survive untouched).
    - Test 11: `detectFkType('FK → Plant')` returns `true`; `detectFkType('string')` returns `false`; `detectFkType('FK → User')` returns `true` (D-11 — FK arrow detection used by SchemaTable.jsx to decide chip style; preserves the arrow literal).
  </behavior>
  <action>
    **Step A — Write tests (RED).** Create `app/src/components/SchemaTable.helpers.test.js`. Pure JS, no JSX, no React imports.

    ```js
    import { test } from 'node:test';
    import assert from 'node:assert/strict';
    import {
      isSchemaHeader,
      extractHeaderCells,
      extractBodyRows,
      detectFkType,
    } from './SchemaTable.helpers.js';

    // ---- isSchemaHeader (D-08) ----

    test('Test 1: Title-Case Field|Type|Notes detected', () => {
      assert.equal(isSchemaHeader(['Field', 'Type', 'Notes']), true);
    });

    test('Test 2: lowercase field|type|notes detected', () => {
      assert.equal(isSchemaHeader(['field', 'type', 'notes']), true);
    });

    test('Test 3: whitespace trimmed', () => {
      assert.equal(isSchemaHeader(['  Field  ', 'Type', 'Notes']), true);
    });

    test('Test 4: 4-column Field|Type|Notes|Default NOT detected', () => {
      assert.equal(isSchemaHeader(['Field', 'Type', 'Notes', 'Default']), false);
    });

    test('Test 5: Decision|Rationale|Outcome NOT detected', () => {
      assert.equal(isSchemaHeader(['Decision', 'Rationale', 'Outcome']), false);
    });

    test('Test 6: Field|Type|Description NOT detected (third column wrong)', () => {
      assert.equal(isSchemaHeader(['Field', 'Type', 'Description']), false);
    });

    test('Test 7: Stage|Status|Reason NOT detected', () => {
      assert.equal(isSchemaHeader(['Stage', 'Status', 'Reason']), false);
    });

    test('Test 8: null/empty/short input returns false', () => {
      assert.equal(isSchemaHeader(null), false);
      assert.equal(isSchemaHeader([]), false);
      assert.equal(isSchemaHeader(['a', 'b']), false);
      assert.equal(isSchemaHeader(undefined), false);
    });

    // ---- extractHeaderCells / extractBodyRows ----

    function elem(type, children) {
      return { type, props: { children } };
    }

    test('Test 9: extractHeaderCells reads thead > tr > th text', () => {
      const tableChildren = [
        elem('thead', elem('tr', [
          elem('th', 'Field'),
          elem('th', 'Type'),
          elem('th', 'Notes'),
        ])),
        elem('tbody', []),
      ];
      assert.deepEqual(extractHeaderCells(tableChildren), ['Field', 'Type', 'Notes']);
    });

    test('Test 10: extractBodyRows preserves cell children including backslash escapes', () => {
      const tableChildren = [
        elem('thead', elem('tr', [
          elem('th', 'Field'), elem('th', 'Type'), elem('th', 'Notes'),
        ])),
        elem('tbody', [
          elem('tr', [
            elem('td', 'created\\_by'),
            elem('td', 'FK → User'),
            elem('td', 'creator'),
          ]),
          elem('tr', [
            elem('td', 'name'),
            elem('td', 'string'),
            elem('td', ''),
          ]),
        ]),
      ];
      const rows = extractBodyRows(tableChildren);
      assert.equal(rows.length, 2);
      assert.equal(rows[0][0], 'created\\_by');   // backslash preserved literal
      assert.equal(rows[0][1], 'FK → User');
      assert.equal(rows[0][2], 'creator');
      assert.equal(rows[1][0], 'name');
      assert.equal(rows[1][1], 'string');
    });

    // ---- detectFkType (D-11) ----

    test('Test 11: detectFkType identifies the FK arrow', () => {
      assert.equal(detectFkType('FK → Plant'), true);
      assert.equal(detectFkType('FK → User'), true);
      assert.equal(detectFkType('string'), false);
      assert.equal(detectFkType('decimal'), false);
      assert.equal(detectFkType(''), false);
      assert.equal(detectFkType(null), false);
    });
    ```

    Run `npm test` — all 11 tests must FAIL (the helpers file is currently `export {}`).

    **Step B — Implement helpers (GREEN).** Replace `app/src/components/SchemaTable.helpers.js`:

    ```js
    /**
     * SchemaTable helpers — pure JS, no JSX.
     *
     * These functions are exported separately from SchemaTable.jsx so they can be unit-tested
     * under `node --test` (Node 20+ has no built-in JSX parser, so a `.test.js` file that
     * imports a `.jsx` file would fail at module load).
     *
     * The helpers operate on plain JS object trees of the shape `{type, props: {children}}`,
     * which is exactly the shape of React elements. In production, SchemaTable.jsx passes
     * `props.children` from react-markdown into these helpers; in tests, hand-built fixtures
     * with the same shape work without React.
     *
     * Functions:
     *   - isSchemaHeader(headerCells)        — D-08 detection (3-col field|type|notes)
     *   - extractHeaderCells(reactChildren)  — walk to find thead's <tr> cell text
     *   - extractBodyRows(reactChildren)     — walk to find tbody rows, preserve cell children
     *   - detectFkType(typeText)             — D-11 (returns whether type contains FK arrow)
     */

    /**
     * Read text content from a React-element-like tree. Strings/numbers return as-is;
     * arrays are concatenated; objects with `props.children` recurse.
     */
    function readText(el) {
      if (el == null) return '';
      if (typeof el === 'string' || typeof el === 'number') return String(el);
      if (Array.isArray(el)) return el.map(readText).join('');
      if (el.props && el.props.children !== undefined) return readText(el.props.children);
      return '';
    }

    /**
     * D-08 — detect the schema-card header.
     * Header qualifies iff it is an array of length 3 whose entries, lowercased and trimmed,
     * equal ['field', 'type', 'notes'].
     */
    export function isSchemaHeader(headerCells) {
      if (!Array.isArray(headerCells) || headerCells.length !== 3) return false;
      const normalized = headerCells.map((h) => String(h).trim().toLowerCase());
      return normalized[0] === 'field' && normalized[1] === 'type' && normalized[2] === 'notes';
    }

    /**
     * Walk children for a <thead> > <tr> > <th>* sequence and return the array of header text
     * values (strings). Returns null if the structure is missing.
     */
    export function extractHeaderCells(children) {
      const arr = Array.isArray(children) ? children : [children];
      for (const child of arr) {
        if (!child || child.type !== 'thead') continue;
        const tr = childByType(child, 'tr');
        if (!tr) continue;
        const ths = childrenByType(tr, 'th');
        return ths.map((th) => readText(th.props && th.props.children));
      }
      return null;
    }

    /**
     * Walk children for a <tbody> > <tr>* > <td>* sequence and return rows-of-cells. Each cell
     * is the raw `children` value from the <td> (preserving strings, including backslash
     * escapes, and any nested elements like <em> for italics).
     */
    export function extractBodyRows(children) {
      const arr = Array.isArray(children) ? children : [children];
      for (const child of arr) {
        if (!child || child.type !== 'tbody') continue;
        const trs = childrenByType(child, 'tr');
        return trs.map((tr) => {
          const tds = childrenByType(tr, 'td');
          return tds.map((td) => (td.props ? td.props.children : ''));
        });
      }
      return [];
    }

    /**
     * D-11 — does the type text contain the FK arrow? Used by SchemaTable.jsx to decide chip
     * style. The arrow character is preserved literally in the rendered chip; this helper
     * just exposes presence as a boolean.
     */
    export function detectFkType(typeText) {
      if (typeof typeText !== 'string' || typeText.length === 0) return false;
      return typeText.includes('FK →');
    }

    // ---- internals ----

    function childByType(parent, type) {
      const arr = Array.isArray(parent.props && parent.props.children)
        ? parent.props.children
        : [parent.props && parent.props.children];
      for (const c of arr) {
        if (c && c.type === type) return c;
      }
      return null;
    }

    function childrenByType(parent, type) {
      const arr = Array.isArray(parent.props && parent.props.children)
        ? parent.props.children
        : [parent.props && parent.props.children];
      return arr.filter((c) => c && c.type === type);
    }
    ```

    **Step C — Run tests (GREEN).** `npm test` — all 11 tests must pass alongside the cross-link tests from Plan 02. If a test fails, fix the helpers; do not weaken the test.

    **Step D — Commit RED then GREEN as separate commits:**
    1. `test(02-04): add failing tests for schema-card helpers`
    2. `feat(02-04): implement schema-card detection and traversal helpers`
  </action>
  <verify>
    <automated>npm test 2>&1 | tail -40</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/SchemaTable.helpers.test.js` exists with at least 11 `test(...)` blocks named `Test 1:` through `Test 11:`.
    - The test file uses ONLY plain JS — no JSX, no React imports, no `react-dom/server`.
    - `npm test` exits 0 with all 11 helper tests passing alongside Plan 02's cross-link tests.
    - `app/src/components/SchemaTable.helpers.js` exports four named functions: `isSchemaHeader`, `extractHeaderCells`, `extractBodyRows`, `detectFkType`.
    - `isSchemaHeader` returns `true` only for arrays of length 3 whose lowercased trimmed entries equal `['field', 'type', 'notes']`.
    - `extractBodyRows` preserves the literal cell children — strings with backslash escapes survive untouched.
    - `detectFkType` returns true iff the input contains the literal substring `FK →`.
  </acceptance_criteria>
  <done>
    Tests RED → GREEN. Helpers correctly detect schema headers per D-08, traverse the React-element-like tree to extract header cells and body rows, and identify FK types per D-11. Two commits land documenting the TDD cycle.
  </done>
</task>

<task type="auto" tdd="false">
  <name>Task 2: Wire SchemaOrTable JSX dispatcher and schema-card CSS</name>
  <files>
    app/src/components/SchemaTable.jsx,
    app/src/components/SchemaTable.css
  </files>
  <read_first>
    - app/src/components/SchemaTable.jsx (Plan 01 stub)
    - app/src/components/SchemaTable.helpers.js (just implemented in Task 1)
    - app/src/styles.css (confirm --schema-card-* custom properties from Plan 01 are present)
    - .planning/phases/02-rich-rendering/02-CONTEXT.md (D-09 card layout, D-12 theming boundary)
  </read_first>
  <action>
    **Step A — Replace `app/src/components/SchemaTable.jsx`:**

    ```jsx
    import './SchemaTable.css';
    import {
      isSchemaHeader,
      extractHeaderCells,
      extractBodyRows,
      detectFkType,
    } from './SchemaTable.helpers.js';

    /**
     * SchemaOrTable — react-markdown <table> override.
     *
     * Detection (D-08): exactly 3 columns AND header row text content,
     * lowercased and trimmed cell-by-cell, equals ["field", "type", "notes"].
     * Detection logic lives in SchemaTable.helpers.js so it is JSX-free and
     * unit-testable under `node --test`.
     *
     * On match → render schema card (D-09).
     * On miss  → render default <table> with all original children.
     *
     * D-10: cell content is rendered through React's normal text-child path; backslash
     * escapes survive untouched (React does not interpret them as escape sequences).
     * D-11: type cells containing `FK →` get a `--fk` modifier class on the chip; the
     * arrow itself is rendered literally.
     * D-12: all colors come from CSS custom properties set in styles.css (Plan 01).
     */
    export function SchemaOrTable({ children, ...props }) {
      const headerCells = extractHeaderCells(children);
      if (!isSchemaHeader(headerCells)) {
        // Fall through: regular table.
        return <table {...props}>{children}</table>;
      }

      const rows = extractBodyRows(children);

      return (
        <div className="schema-card" role="group" aria-label="Data model">
          <div className="schema-card__rows">
            {rows.map((row, idx) => {
              const typeText = readChildText(row[1]);
              const isFk = detectFkType(typeText);
              return (
                <div className="schema-card__row" key={idx}>
                  <div className="schema-card__field">{row[0]}</div>
                  <div className="schema-card__type">
                    <span className={'schema-card__type-chip' + (isFk ? ' schema-card__type-chip--fk' : '')}>
                      {row[1]}
                    </span>
                  </div>
                  <div className="schema-card__notes">{row[2]}</div>
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Minimal local readText — duplicated from helpers (which is JSX-free) so the JSX file
    // does not pull the helper into the render path for non-schema tables.
    function readChildText(el) {
      if (el == null) return '';
      if (typeof el === 'string' || typeof el === 'number') return String(el);
      if (Array.isArray(el)) return el.map(readChildText).join('');
      if (el.props && el.props.children !== undefined) return readChildText(el.props.children);
      return '';
    }
    ```

    **Step B — Create `app/src/components/SchemaTable.css`:**

    ```css
    /* Schema-card layout. Color values reference Plan 01 CSS custom properties; Phase 4 will
       theme via --schema-card-accent etc. */

    .schema-card {
      border: 1px solid var(--schema-card-border);
      background: var(--schema-card-background);
      border-radius: 6px;
      padding: 12px 16px;
      margin: 1em 0;
      overflow-x: auto;
    }

    .schema-card__rows {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .schema-card__row {
      display: grid;
      /* Three columns: field name (auto-sized), type chip (auto-sized), notes (flex). */
      grid-template-columns: minmax(140px, max-content) minmax(120px, max-content) 1fr;
      gap: 12px;
      align-items: baseline;
      padding: 4px 0;
      border-top: 1px solid var(--schema-card-border);
    }

    .schema-card__row:first-child {
      border-top: none;
    }

    .schema-card__field {
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.92em;
      color: var(--schema-card-field-color);
      word-break: break-word;
    }

    .schema-card__type {
      /* container — leaves room for chip styling */
    }

    .schema-card__type-chip {
      display: inline-block;
      padding: 1px 8px;
      border-radius: 999px;
      background: var(--schema-card-type-background);
      color: var(--schema-card-type-color);
      font-family: ui-monospace, 'SF Mono', Menlo, monospace;
      font-size: 0.85em;
      white-space: nowrap;
    }

    .schema-card__type-chip--fk {
      /* D-11: subtle visual cue that the type is a foreign key. Phase 4 may rebrand. */
      border: 1px solid var(--schema-card-accent);
    }

    .schema-card__notes {
      color: var(--schema-card-notes-color);
      font-size: 0.95em;
    }

    /* Mobile fallback: stack vertically on narrow screens. */
    @media (max-width: 640px) {
      .schema-card__row {
        grid-template-columns: 1fr;
        gap: 2px;
      }
    }
    ```

    **Step C — verify the build:**
    ```
    npm run build
    ```
    Must exit 0.

    Plan 04 explicitly does NOT touch `package.json` (the npm test script is owned by Plan 01; Plan 02 also leaves it alone). The Wave-2 file-disjointness contract holds.
  </action>
  <verify>
    <automated>grep -q "import { isSchemaHeader" app/src/components/SchemaTable.jsx && grep -q "extractHeaderCells" app/src/components/SchemaTable.jsx && grep -q "extractBodyRows" app/src/components/SchemaTable.jsx && grep -q "detectFkType" app/src/components/SchemaTable.jsx && grep -q "schema-card__row" app/src/components/SchemaTable.jsx && grep -q "schema-card__type-chip" app/src/components/SchemaTable.jsx && grep -q "import './SchemaTable.css'" app/src/components/SchemaTable.jsx && grep -q "var(--schema-card-border)" app/src/components/SchemaTable.css && grep -q "var(--schema-card-background)" app/src/components/SchemaTable.css && grep -q "var(--schema-card-type-background)" app/src/components/SchemaTable.css && grep -q "var(--schema-card-notes-color)" app/src/components/SchemaTable.css && ! grep -q "#2c8d4f" app/src/components/SchemaTable.jsx && ! grep -q "#2c8d4f" app/src/components/SchemaTable.css && npm run build 2>&1 | tail -5</automated>
  </verify>
  <acceptance_criteria>
    - `app/src/components/SchemaTable.jsx` imports the four named helpers from `./SchemaTable.helpers.js`.
    - For non-schema tables (any header that doesn't match), the component returns `<table>` with the original children.
    - For schema tables, the component renders `<div class="schema-card">` containing `<div class="schema-card__row">` blocks with `__field`, `__type`, `__notes` cells.
    - Type chips for FK types receive an additional `schema-card__type-chip--fk` class via `detectFkType`.
    - `app/src/components/SchemaTable.css` references `--schema-card-border`, `--schema-card-background`, `--schema-card-field-color`, `--schema-card-type-background`, `--schema-card-type-color`, `--schema-card-notes-color`, and `--schema-card-accent` (the FK chip border).
    - Neither `SchemaTable.jsx` nor `SchemaTable.css` contains the literal string `#2c8d4f` (or any other hex color code).
    - `npm run build` exits 0.
    - Plan 04 has NOT modified `package.json`.
  </acceptance_criteria>
  <done>
    The JSX dispatcher consumes the helpers and produces schema-card DOM for matching tables, falls through cleanly for the rest. FK chips get a subtle modifier class. All theming flows through CSS custom properties.
  </done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <name>Task 3: Human verification — Schema cards render correctly across the real spec</name>
  <files>(none — manual verification only)</files>
  <action>
    **What was built (before this checkpoint):**
- Pure-JS schema-card detection helpers per D-08 (exact 3 columns + lowercased thead == [field, type, notes]).
    - JSX dispatcher per D-09 (one card per table, field-row grid).
    - FK chip modifier class per D-11.
    - CSS custom property theming surface for Phase 4.

    **How to verify (perform these steps in a browser):**
1. Run `npm run dev` and open the URL.
    2. Scroll to the first PRD with a Data Model section (PRD-0 / `Users (Internal Staff)` around line 23 of the dated spec). Confirm:
       - The Field|Type|Notes table appears as a card (rounded border, light background) with a row per field.
       - The field name is in monospace.
       - The type column shows a small "chip" with the type text, including `enum`, `string`, `boolean`, etc.
       - Backslash escapes are visible — `created\_by` should render with a literal backslash before the underscore (NOT as just `created_by`). This proves D-10.
       - `FK → User` appears with the arrow intact in the chip, AND the chip has a subtle border (the `--fk` modifier class). This proves D-11.
    3. Scroll to PRD-1 (Plant Database & Inventory). Multiple sub-tables (Plants, Plant Variants, Plant Batches, etc.) should each render as their own card.
    4. Scroll to PRD-3 / Order Lifecycle. Confirm orderable-related tables also become cards.
    5. **Negative check — non-schema 3-col tables.** Search the spec for any 3-column table that is NOT `Field|Type|Notes`. The current spec has none (verified by grep at planning time), so this is a structural assertion: scroll to the "Scope Decisions Summary" or "Meeting Action Items" section near the end. If those contain tables, confirm they render as plain markdown tables, NOT as schema cards.
    6. **DevTools check — theming surface.** Inspect any schema card in DevTools. Confirm:
       - The `border` color resolves from `var(--schema-card-border)`.
       - The chip background resolves from `var(--schema-card-type-background)`.
       - No hex value `#2c8d4f` appears anywhere in the computed styles for the card.
    7. **Mobile check.** Resize the browser window to <640px wide. Confirm the field rows collapse to a vertical stack (the `@media` rule kicks in).
    8. **No console errors.** Open the browser console; the page should produce no errors related to SchemaTable.

    **Resume signal:** Type "approved" if all 8 checks pass, or describe which check failed and what was observed.
  </action>
  <verify>
    <automated>echo "checkpoint:human-verify — must be approved by human"; exit 0</automated>
  </verify>
  <done>
    User has performed the verification steps and typed "approved" (or described and resolved any failure).
  </done>
</task>

</tasks>

<threat_model>
## Trust Boundaries

| Boundary | Description |
|----------|-------------|
| Spec author → table renderer | Same trust posture as Plan 01: spec content from `project-spec/*.md` is semi-trusted (author = Sigurd / update-spec.mjs). |
| react-markdown AST → DOM | The component reads cells via React `props.children` traversal. No `dangerouslySetInnerHTML` is used; React escapes text content automatically. |

## STRIDE Threat Register

| Threat ID | Category | Component | Disposition | Mitigation Plan |
|-----------|----------|-----------|-------------|-----------------|
| T-02-04-01 | Tampering | Schema-card render — text content from cells | mitigate | Cell content is rendered through React's normal text-child path — no `dangerouslySetInnerHTML`. React HTML-escapes all string children. Backslashes (D-10) are not interpreted as escape sequences in text rendering; they appear literally in the DOM. |
| T-02-04-02 | Information Disclosure | Header detection traversal | n/a | The header check reads `props.children` recursively. It cannot read state from outside the table's own subtree. No exfiltration path. |
| T-02-04-03 | Denial of Service | Recursive `readText` on deeply nested cells | accept | Cells in the spec are flat text — at worst they contain inline code or italics (1-2 levels of nesting). The recursion is bounded by markdown's grammar. No risk in practice. |
| T-02-04-04 | Tampering | False-positive detection elevating non-schema tables to cards | accept | D-08's strict three-cell-equality check makes false positives essentially impossible without the spec author intentionally writing a `Field | Type | Notes` header. Verified by Tests 4–7 in Task 1. |
| T-02-04-05 | Tampering | False-negative — a real schema table missed | accept | If a future spec deviates from the convention (e.g. capitalizes "FIELD"), it will fall through to plain table. Detection is case-insensitive (Test 2) so this is unlikely; if it happens, the failure mode is "looks like Phase 1" — degraded but not broken. |

ASVS L1 disposition: T-02-04-01 is the only one requiring active enforcement, and React's default escaping handles it. No high-severity threats.
</threat_model>

<verification>
- `npm test` passes (11 helper tests in this plan, plus existing cross-link tests from Plan 02).
- `npm run build` exits 0.
- Browser checkpoint confirms cards render across the real spec (Task 3).
- Grep confirms no `#2c8d4f` in `SchemaTable.{jsx,css}`.
- Plan 04 did NOT modify `package.json` (the test script lives in Plan 01).
</verification>

<success_criteria>
1. The dispatcher correctly identifies schema-card tables per D-08 (case-insensitive, 3-col, exact field/type/notes).
2. Field names render literally with backslash escapes preserved.
3. Type chips preserve the FK arrow and FK types receive a modifier class for visual differentiation.
4. Non-schema tables continue to render as plain `<table>`.
5. All theming uses CSS custom properties; Phase 4 can rebrand without touching this plan's files.
6. Mobile layout collapses gracefully.
7. Pure-JS helpers are unit-tested under `node --test`; the JSX dispatcher is verified by the human checkpoint.
</success_criteria>

<output>
After completion, create `.planning/phases/02-rich-rendering/02-04-SUMMARY.md` documenting:
- Number of detected schema cards in the current dated spec (count from manual scroll-through, ~20 expected).
- Confirmation of each negative check (no false-positive detections).
- Note for Phase 4: the seven `--schema-card-*` custom properties (plus `--schema-card-accent` used by the FK chip border) are the theming surface. Phase 4 should override them in `:root` (or under a `.theme-macplants` class).
</output>
